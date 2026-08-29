import calendar
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import SessionLocal
from models import Budget, Expense, User
from schemas import BudgetCreate, BudgetResponse
from routes.auth import get_current_user


router = APIRouter(prefix="/budgets", tags=["Budgets"])


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def get_month_bounds(month_date: date):
    start = month_date.replace(day=1)
    _, last_day = calendar.monthrange(start.year, start.month)
    end = start.replace(day=last_day)
    return start, end


def calculate_spent(db: Session, user_id: int, category: str, month_date: date) -> float:
    start, end = get_month_bounds(month_date)
    spent = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(
            func.lower(Expense.category) == func.lower(category),
            Expense.user_id == user_id,
            Expense.date >= start,
            Expense.date <= end
        )
        .scalar()
    )
    return float(spent)


@router.get("/", response_model=list[BudgetResponse])
def get_budgets(
    month: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Budget).filter(Budget.user_id == current_user.id)

    if month is not None:
        target_month = month.replace(day=1)
        query = query.filter(Budget.month == target_month)

    budgets = query.order_by(Budget.id.desc()).all()

    result = []

    for budget in budgets:
        spent = calculate_spent(db, current_user.id, budget.category, budget.month)

        result.append({
            "id": budget.id,
            "category": budget.category,
            "amount": budget.amount,
            "month": budget.month,
            "spent": spent
        })

    return result


@router.post("/", response_model=BudgetResponse)
def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    normalized_month = budget.month.replace(day=1)

    existing = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            func.lower(Budget.category) == func.lower(budget.category.strip()),
            Budget.month == normalized_month
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"A budget for '{budget.category.strip()}' already exists for {normalized_month.strftime('%B %Y')}."
        )

    new_budget = Budget(
        user_id=current_user.id,
        category=budget.category.strip(),
        amount=budget.amount,
        month=normalized_month,
        spent=0
    )

    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)

    spent = calculate_spent(db, current_user.id, new_budget.category, new_budget.month)

    return {
        "id": new_budget.id,
        "category": new_budget.category,
        "amount": new_budget.amount,
        "month": new_budget.month,
        "spent": spent
    }


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_budget = (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,
            Budget.user_id == current_user.id
        )
        .first()
    )

    if not existing_budget:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    normalized_month = budget.month.replace(day=1)

    duplicate = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            func.lower(Budget.category) == func.lower(budget.category.strip()),
            Budget.month == normalized_month,
            Budget.id != budget_id
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail=f"A budget for '{budget.category.strip()}' already exists for {normalized_month.strftime('%B %Y')}."
        )

    existing_budget.category = budget.category.strip()
    existing_budget.amount = budget.amount
    existing_budget.month = normalized_month

    db.commit()
    db.refresh(existing_budget)

    spent = calculate_spent(db, current_user.id, existing_budget.category, existing_budget.month)

    return {
        "id": existing_budget.id,
        "category": existing_budget.category,
        "amount": existing_budget.amount,
        "month": existing_budget.month,
        "spent": spent
    }


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_budget = (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,
            Budget.user_id == current_user.id
        )
        .first()
    )

    if not existing_budget:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    db.delete(existing_budget)
    db.commit()

    return {
        "message": "Budget deleted successfully"
    }
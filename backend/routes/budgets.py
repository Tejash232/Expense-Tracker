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


@router.get("/", response_model=list[BudgetResponse])
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == current_user.id)
        .order_by(Budget.id.desc())
        .all()
    )

    result = []

    for budget in budgets:

        spent = (
            db.query(func.coalesce(func.sum(Expense.amount), 0))
            .filter(
                Expense.category == budget.category,
                Expense.user_id == current_user.id
            )
            .scalar()
        )

        result.append({
            "id": budget.id,
            "category": budget.category,
            "amount": budget.amount,
            "spent": float(spent)
        })

    return result


@router.post("/", response_model=BudgetResponse)
def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_budget = Budget(
        user_id=current_user.id,
        category=budget.category,
        amount=budget.amount,
        spent=0
    )

    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)

    return {
        "id": new_budget.id,
        "category": new_budget.category,
        "amount": new_budget.amount,
        "spent": 0
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

    existing_budget.category = budget.category
    existing_budget.amount = budget.amount

    db.commit()
    db.refresh(existing_budget)

    spent = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(
            Expense.category == existing_budget.category,
            Expense.user_id == current_user.id
        )
        .scalar()
    )

    return {
        "id": existing_budget.id,
        "category": existing_budget.category,
        "amount": existing_budget.amount,
        "spent": float(spent)
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
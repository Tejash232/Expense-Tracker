from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Expense, User
from schemas import ExpenseCreate, ExpenseResponse
from routes.auth import get_current_user


router = APIRouter(prefix="/expenses", tags=["Expenses"])


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[ExpenseResponse])
def get_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(Expense)
        .filter(Expense.user_id == current_user.id)
        .order_by(Expense.id.desc())
        .all()
    )


@router.post("/", response_model=ExpenseResponse)
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_expense = Expense(
        user_id=current_user.id,
        date=expense.date,
        merchant=expense.merchant,
        category=expense.category,
        payment_method=expense.payment_method,
        amount=expense.amount
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return new_expense


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_expense = (
        db.query(Expense)
        .filter(
            Expense.id == expense_id,
            Expense.user_id == current_user.id
        )
        .first()
    )

    if not existing_expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    existing_expense.date = expense.date
    existing_expense.merchant = expense.merchant
    existing_expense.category = expense.category
    existing_expense.payment_method = expense.payment_method
    existing_expense.amount = expense.amount

    db.commit()
    db.refresh(existing_expense)

    return existing_expense


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_expense = (
        db.query(Expense)
        .filter(
            Expense.id == expense_id,
            Expense.user_id == current_user.id
        )
        .first()
    )

    if not existing_expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    db.delete(existing_expense)
    db.commit()

    return {"message": "Expense deleted successfully"}

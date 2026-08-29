from datetime import date
from pydantic import BaseModel


class ExpenseCreate(BaseModel):
    date: date
    merchant: str
    category: str
    payment_method: str
    amount: float


class ExpenseResponse(ExpenseCreate):
    id: int

    class Config:
        from_attributes = True


class BudgetCreate(BaseModel):
    category: str
    amount: float


class BudgetResponse(BudgetCreate):
    id: int
    spent: float

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
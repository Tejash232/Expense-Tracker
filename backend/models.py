from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    date = Column(Date, nullable=False)
    merchant = Column(String, nullable=False)
    category = Column(String, nullable=False)
    payment_method = Column(String, nullable=False)
    amount = Column(Float, nullable=False)


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    category = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    spent = Column(Float, default=0)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
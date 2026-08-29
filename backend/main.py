from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routes.expenses import router as expenses_router
from routes.budgets import router as budgets_router
from routes.auth import router as auth_router

import models


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(expenses_router)
app.include_router(budgets_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {"message": "Expense Tracker API is running"}
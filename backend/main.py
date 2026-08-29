import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, run_migrations
from routes.expenses import router as expenses_router
from routes.budgets import router as budgets_router
from routes.auth import router as auth_router

import models


# Create database tables first, then run column migrations
Base.metadata.create_all(bind=engine)
run_migrations()


app = FastAPI()


def get_allowed_origins() -> list[str]:
    default_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]
    env_origins_str = os.getenv("ALLOWED_ORIGINS")

    if not env_origins_str:
        return default_origins

    parsed_origins = [
        origin.strip()
        for origin in env_origins_str.split(",")
        if origin.strip()
    ]

    return parsed_origins or default_origins


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
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
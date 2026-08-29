# SpendWise

SpendWise is a full-stack personal expense and monthly budget tracking application designed to help users monitor everyday spending, set category-based monthly budgets, and analyze spending patterns over time.

## Features

- **Authentication & User Isolation**
  - User registration and login
  - Secure password hashing using bcrypt (`passlib`)
  - JWT token authentication (`python-jose`)
  - User-specific data isolation (expenses and budgets are bound to `user_id`)

- **Expense Management**
  - Add, edit, and delete expenses
  - Merchant, amount, category, payment method, and date tracking
  - In-page search by merchant name or category
  - Category, payment method, and date range filtering (30 days, 3 months, All time)
  - Quick Add expense flow from header across all pages

- **Monthly Budget Management**
  - Month-specific category budgets (normalized to `YYYY-MM-01`)
  - Create, edit, and delete budgets
  - Dynamic spending calculations strictly matching month, category, and user
  - Case-insensitive category matching
  - Prevent duplicate category budgets within the same month
  - Total budget, total spent, remaining balance, and usage percentage calculations

- **Dashboard Overview**
  - High-level overview of spending and current-month budget usage
  - 30-day and 3-month spending period views
  - Interactive spending statistics line chart
  - Category spending breakdown & donut chart
  - Recent transactions list

- **Session & UI Protection**
  - Protected route access requiring valid JWT token
  - Logout functionality that clears the stored JWT token
  - Clean, responsive UI built with modern Vanilla CSS styling

## Tech Stack

### Frontend
- **React**
- **Vite**
- **JavaScript**
- **CSS**

### Backend
- **Python**
- **FastAPI**
- **SQLAlchemy**
- **Pydantic**
- **Passlib / Bcrypt** (Password hashing)
- **Python-Jose** (JWT authentication)

### Database
- **PostgreSQL**

## Project Structure

```
Expense-Tracker/
├── backend/
│   ├── routes/
│   │   ├── auth.py
│   │   ├── budgets.py
│   │   └── expenses.py
│   ├── .gitignore
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── requirements.txt
│   └── schemas.py
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Budgets.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Expenses.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── .gitignore
├── eslint.config.js
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL server

### 1. Backend Setup

1. Open a terminal in the project root.
2. Activate your Python virtual environment (e.g. `.venv\Scripts\activate` on Windows or `source .venv/bin/activate` on Linux/macOS).
3. Create a `backend/.env` file with your local environment variables (see [Environment Configuration](#environment-configuration)).
4. Navigate to the `backend` directory and install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
5. Start the FastAPI backend server on port 8001:
   ```bash
   python -m uvicorn main:app --reload --port 8001
   ```
   The backend API will run at `http://127.0.0.1:8001`.

### 2. Frontend Setup

1. Open a separate terminal window and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the server URL displayed in terminal (typically `http://localhost:5173`).

## Environment Configuration

The backend loads configuration from a local `.env` file located at `backend/.env`.

> **IMPORTANT**: The `.env` file contains sensitive secrets and database credentials and must **NEVER** be committed to GitHub or version control.

### Required Environment Variables
- `DATABASE_URL`
- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`

### Example `backend/.env` (Placeholder values only):
```env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/expense_tracker
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Database

The application uses **PostgreSQL** for persistent data storage.

- Database tables (`users`, `expenses`, `budgets`) are defined via SQLAlchemy models in [backend/models.py](file:///c:/projects/Expense_Tracker/backend/models.py).
- Tables are initialized automatically on backend startup via `Base.metadata.create_all(bind=engine)`.
- Automatic migration logic in [backend/database.py](file:///c:/projects/Expense_Tracker/backend/database.py) adds missing columns (such as the `month` column on `budgets`) safely without dropping existing tables or data.
- Monthly budgets store the month as the first day of the month (`YYYY-MM-01`).

## Authentication

- **Registration** (`POST /auth/register`): User submits name, email, and password. Password is hashed securely with `bcrypt` before storage.
- **Login** (`POST /auth/login`): User credentials are verified. Upon success, a signed JWT access token is returned.
- **Session Management**: Tokens are stored in browser `localStorage` as `access_token` and included as a `Bearer` token in the `Authorization` header for protected endpoints.
- **Data Isolation**: Each query is strictly scoped to the authenticated user's `user_id`.

## API Overview

Protected endpoints require a valid JWT Bearer token in the request header (`Authorization: Bearer <token>`).

### Authentication
- `POST /auth/register` — Register a new user account.
- `POST /auth/login` — Authenticate credentials and receive a JWT access token.

### Expenses
- `GET /expenses/` — Retrieve all expenses belonging to the authenticated user.
- `POST /expenses/` — Create a new expense.
- `PUT /expenses/{expense_id}` — Update an existing expense.
- `DELETE /expenses/{expense_id}` — Delete an expense.

### Budgets
- `GET /budgets/?month=YYYY-MM-01` — Retrieve budgets for a specific month along with dynamically calculated spent amounts.
- `POST /budgets/` — Create a new monthly budget.
- `PUT /budgets/{budget_id}` — Update budget category, amount, or month.
- `DELETE /budgets/{budget_id}` — Delete a budget.

## Budget System

- **Category & Month Scoped**: Each budget belongs to a specific category and month (normalized to `YYYY-MM-01`).
- **Duplicate Prevention**: A user cannot create multiple budgets for the same category in the same month (returns HTTP 400). The same category can be reused across different months.
- **Dynamic Spending Calculation**: Budget `spent` values are calculated on-the-fly from expenses matching the same user, category (case-insensitive), and falling within the budget month range (`start` to `end`).

## Security Notes

- Secrets and database credentials are kept out of source code via `backend/.env`.
- `.env` files are excluded from git repository tracking via `.gitignore`.
- API endpoints are protected using JWT token validation.
- Row-level `user_id` ownership checks prevent users from accessing other users' expenses or budgets.

## Current Limitations

- **Development Port**: API URL is currently configured for local development on port 8001.
- **Local Target**: Configured for local development; no production deployment configuration is included.
- **Income Tracking**: Dashboard currently tracks spending and budgets only (no income tracking).
- **Navigation Scope**: Previously planned navigation items such as Statistics, Settings, Reports, Notifications, and Help Center were intentionally removed as they were not implemented.

## Future Improvements

- Production deployment configuration (Docker, Nginx, cloud hosting).
- Automated test suite.
- Centralized frontend API configuration module.
- Production database migrations (e.g. Alembic).
- Expanded analytics features.

## License

License: Not specified yet.

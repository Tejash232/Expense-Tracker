# SpendWise

SpendWise is a full-stack personal expense and monthly budget tracking web application. It helps users manage everyday spending, set category-based monthly budgets, and visualize financial statistics through an intuitive dashboard. Built with a modern React frontend and a FastAPI REST API backed by PostgreSQL.

## Live Demo

- **Frontend App**: [https://expense-tracker-pink-beta-39.vercel.app](https://expense-tracker-pink-beta-39.vercel.app)

## Features

- **Authentication & Security**: User registration, secure password hashing (bcrypt), and JWT access token authentication.
- **Expense Management**: Add, edit, and delete expenses with merchant, category, date, and payment method details.
- **Search & Filtering**: Search expenses by merchant or category, and filter by date range, category, or payment method.
- **Monthly Budgets**: Set category-specific monthly budgets with automatic spending and usage calculations.
- **Dashboard Analytics**: Overview of total spending, budget progress, spending statistics, and category breakdowns.
- **Quick Add**: Easily record new expenses from any page via the top navigation bar.
- **Protected Routes & Data Isolation**: Secure client-side routing and row-level data isolation bound to each user.

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- Vanilla CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- PostgreSQL
- JWT / Passlib / Bcrypt

### Deployment
- Vercel (Frontend)
- Render (Backend)
- Neon (PostgreSQL Database)

## Project Structure

```
Expense-Tracker/
├── backend/
│   ├── routes/
│   │   ├── auth.py
│   │   ├── budgets.py
│   │   └── expenses.py
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
│   │   ├── config.js
│   │   └── main.jsx
│   ├── package.json
│   └── vercel.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL database

### 1. Clone the Repository
```bash
git clone https://github.com/Tejash232/Expense-Tracker.git
cd Expense-Tracker
```

### 2. Backend Setup
1. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   ```
2. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
3. Create a `backend/.env` file with local environment variables (see [Environment Variables](#environment-variables)).
4. Start the FastAPI server:
   ```bash
   python -m uvicorn main:app --reload --port 8001
   ```

### 3. Frontend Setup
1. In a new terminal window, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Configure environment variables in `backend/.env` for local development.

> **Note**: Do not commit `.env` files containing real secrets or database credentials to version control.

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/expense_tracker
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Frontend (`frontend/.env` or Vercel Environment Variables)
```env
VITE_API_URL=http://127.0.0.1:8001
```

## Deployment

- **Frontend**: Deployed on **Vercel** with SPA route rewriting.
- **Backend**: Deployed on **Render** as a Python Web Service.
- **Database**: Hosted on **Neon PostgreSQL**.

## License

License: Not specified yet.

import { createContext, useContext, useState, useCallback } from 'react'
import API_URL from '../config.js'

const DataContext = createContext(null)

export function DataProvider({ children, onLogout }) {
  const [expenses, setExpenses] = useState([])
  const [expensesLoading, setExpensesLoading] = useState(false)
  const [expensesFetched, setExpensesFetched] = useState(false)
  const [expensesError, setExpensesError] = useState('')

  const [budgetsByMonth, setBudgetsByMonth] = useState({})
  const [budgetsLoading, setBudgetsLoading] = useState(false)
  const [budgetsError, setBudgetsError] = useState('')

  const handleUnauthorized = useCallback(() => {
    onLogout?.()
  }, [onLogout])

  const fetchExpenses = useCallback(async (force = false) => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    if (!force && expensesFetched) {
      setExpensesLoading(false)
    } else {
      setExpensesLoading(true)
    }

    try {
      setExpensesError('')
      const response = await fetch(`${API_URL}/expenses/`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`)
      }

      const data = await response.json()
      setExpenses(data)
      setExpensesFetched(true)
    } catch (err) {
      console.error('Error fetching expenses:', err)
      setExpensesError('Could not load expenses from the database.')
    } finally {
      setExpensesLoading(false)
    }
  }, [expensesFetched, handleUnauthorized])

  const fetchBudgets = useCallback(async (monthStr, force = false) => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const normalizedMonth = monthStr.length === 7 ? `${monthStr}-01` : monthStr
    const hasCache = !!budgetsByMonth[monthStr]

    if (!force && hasCache) {
      setBudgetsLoading(false)
    } else {
      setBudgetsLoading(true)
    }

    try {
      setBudgetsError('')
      const response = await fetch(`${API_URL}/budgets/?month=${normalizedMonth}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`)
      }

      const data = await response.json()
      setBudgetsByMonth((prev) => ({
        ...prev,
        [monthStr]: data,
      }))
    } catch (err) {
      console.error('Error fetching budgets:', err)
      setBudgetsError('Could not load budgets from the database.')
    } finally {
      setBudgetsLoading(false)
    }
  }, [budgetsByMonth, handleUnauthorized])

  const invalidateBudgets = useCallback(() => {
    setBudgetsByMonth({})
  }, [])

  const addExpenseState = useCallback((newExpense) => {
    setExpenses((prev) => [newExpense, ...prev])
    invalidateBudgets()
  }, [invalidateBudgets])

  const updateExpenseState = useCallback((updatedExpense) => {
    setExpenses((prev) =>
      prev.map((item) => (item.id === updatedExpense.id ? updatedExpense : item))
    )
    invalidateBudgets()
  }, [invalidateBudgets])

  const deleteExpenseState = useCallback((deletedId) => {
    setExpenses((prev) => prev.filter((item) => item.id !== deletedId))
    invalidateBudgets()
  }, [invalidateBudgets])

  const addOrUpdateBudgetState = useCallback((savedBudget, monthKey) => {
    setBudgetsByMonth((prev) => {
      const monthBudgets = prev[monthKey] || []
      const exists = monthBudgets.some((b) => b.id === savedBudget.id)
      const updatedMonthBudgets = exists
        ? monthBudgets.map((b) => (b.id === savedBudget.id ? savedBudget : b))
        : [savedBudget, ...monthBudgets]

      return {
        ...prev,
        [monthKey]: updatedMonthBudgets,
      }
    })
  }, [])

  const deleteBudgetState = useCallback((deletedId, monthKey) => {
    setBudgetsByMonth((prev) => {
      const monthBudgets = prev[monthKey] || []
      return {
        ...prev,
        [monthKey]: monthBudgets.filter((b) => b.id !== deletedId),
      }
    })
  }, [])

  const clearCache = useCallback(() => {
    setExpenses([])
    setExpensesFetched(false)
    setBudgetsByMonth({})
    setExpensesError('')
    setBudgetsError('')
  }, [])

  return (
    <DataContext.Provider
      value={{
        expenses,
        expensesLoading,
        expensesFetched,
        expensesError,
        fetchExpenses,
        addExpenseState,
        updateExpenseState,
        deleteExpenseState,

        budgetsByMonth,
        budgetsLoading,
        budgetsError,
        fetchBudgets,
        addOrUpdateBudgetState,
        deleteBudgetState,
        invalidateBudgets,
        clearCache,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

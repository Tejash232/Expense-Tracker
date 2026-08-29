import { useEffect, useMemo, useState } from 'react'
import './Expenses.css'

const API_URL = 'http://127.0.0.1:8001'

const navItems = [
	['dashboard', 'Dashboard', '/'],
	['payments', 'Expenses', '/expenses'],
	['account_balance_wallet', 'Budgets', '/budgets'],
]

function Icon({ children, size }) {
	return (
		<span
			className="material-symbols-outlined"
			style={size ? { fontSize: size } : undefined}
		>
			{children}
		</span>
	)
}

const iconByCategory = {
	Groceries: 'shopping_cart',
	Housing: 'home',
	Transport: 'directions_car',
	Entertainment: 'subscriptions',
	Dining: 'restaurant',
	Health: 'medication',
	Shopping: 'shopping_bag',
	Bills: 'receipt_long',
}

const colorByCategory = {
	Groceries: 'bg-primary-fixed/50 text-on-primary-fixed-variant',
	Housing: 'bg-secondary-container/50 text-on-secondary-container',
	Transport: 'bg-tertiary-fixed/50 text-on-tertiary-fixed',
	Entertainment: 'bg-surface-variant text-on-surface',
	Dining: 'bg-error-container/50 text-on-error-container',
	Health: 'bg-primary-fixed/50 text-on-primary-fixed-variant',
	Shopping: 'bg-secondary-container/50 text-on-secondary-container',
	Bills: 'bg-surface-variant text-on-surface',
}

function formatDate(date) {
	if (!date) return ''

	const parsedDate = new Date(`${date}T00:00:00`)

	if (Number.isNaN(parsedDate.getTime())) {
		return date
	}

	return parsedDate.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})
}

function Sidebar({ activePath, onLogout }) {
	return (
		<aside className="hidden md:flex fixed left-0 top-0 h-full flex-col py-stack-lg border-r border-outline-variant bg-surface-container-low w-64 z-40">
			<div className="px-stack-lg mb-stack-lg flex flex-col gap-unit">
				<h1 className="font-headline-md text-headline-md font-bold text-primary">
					SpendWise
				</h1>

				<p className="font-label-md text-label-md text-on-surface-variant">
					Wealth Management
				</p>
			</div>

			<nav className="flex-1 px-stack-sm flex flex-col gap-unit">
				{navItems.map(([icon, label, href]) => (
					<a
						className={`flex items-center gap-stack-md rounded-lg px-stack-md py-2 active:scale-[0.98] transition-transform duration-150 ${
							activePath === href
								? 'bg-secondary-container text-on-secondary-container'
								: 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all'
						}`}
						href={href}
						key={label}
					>
						<Icon>{icon}</Icon>
						<span className="font-label-md text-label-md">{label}</span>
					</a>
				))}
			</nav>

			<div className="mt-auto px-stack-sm flex flex-col gap-unit pt-stack-md border-t border-outline-variant/30 mx-stack-sm">
				<a
					className="flex items-center gap-stack-md text-on-surface-variant px-stack-md py-2 hover:bg-surface-container-high hover:text-on-surface transition-all active:scale-[0.98] duration-150 rounded-lg"
					href="#"
					onClick={(event) => {
						event.preventDefault()
						onLogout?.()
					}}
				>
					<Icon>logout</Icon>
					<span className="font-label-md text-label-md">Logout</span>
				</a>
			</div>
		</aside>
	)
}

function Header({ onQuickAdd }) {
	return (
		<header className="flex justify-between items-center w-full px-container-padding-mobile md:px-container-padding-desktop sticky top-0 z-50 h-16 bg-surface shadow-sm">
			<div className="md:hidden flex items-center gap-stack-md">
				<button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:scale-95">
					<Icon>menu</Icon>
				</button>

				<span className="font-headline-md text-headline-md font-bold text-primary">
					SpendWise
				</span>
			</div>

			<div className="flex items-center gap-stack-md ml-auto">
				<button
					className="hidden sm:block text-secondary font-label-md text-label-md font-medium px-4 py-1.5 rounded border border-secondary hover:bg-secondary/5 transition-colors duration-200 cursor-pointer active:scale-95"
					onClick={onQuickAdd}
				>
					Quick Add
				</button>

				<div className="h-8 w-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center border border-outline-variant ml-2">
					<Icon size="20px">person</Icon>
				</div>
			</div>
		</header>
	)
}

function Expenses({
	activePath = '/expenses',
	onLogout,
	onQuickAdd,
	autoOpenAddExpense,
	setAutoOpenAddExpense,
}) {
	const [expenses, setExpenses] = useState([])
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)
	const [editingExpense, setEditingExpense] = useState(null)
	const [activeExpenseId, setActiveExpenseId] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		if (autoOpenAddExpense) {
			setIsAddModalOpen(true)
			setAutoOpenAddExpense?.(false)
		}
	}, [autoOpenAddExpense, setAutoOpenAddExpense])

	const [newExpense, setNewExpense] = useState({
		amount: '',
		merchant: '',
		category: 'Groceries',
		date: new Date().toISOString().slice(0, 10),
		method: 'Visa •••• 4242',
	})

	const [search, setSearch] = useState('')
	const [dateFilter, setDateFilter] = useState('Any date')
	const [category, setCategory] = useState('All categories')
	const [method, setMethod] = useState('All methods')
	const [page, setPage] = useState(1)

	// Load expenses from PostgreSQL through FastAPI
	useEffect(() => {
		const loadExpenses = async () => {
			try {
				setLoading(true)
				setError('')

				const token = localStorage.getItem('access_token')

				const response = await fetch(`${API_URL}/expenses/`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})

				const responseText = await response.text()

				if (response.status === 401) {
					onLogout?.()
					return
				}

				if (!response.ok) {
					console.error(
						'Backend response:',
						response.status,
						responseText
					)

					throw new Error(`Backend error: ${response.status}`)
				}

				const data = JSON.parse(responseText)

				setExpenses(data)
			} catch (err) {
				console.error('Error loading expenses:', err)
				setError('Could not load expenses from the database.')
			} finally {
				setLoading(false)
			}
		}

		loadExpenses()
	}, [onLogout])

	const filteredExpenses = useMemo(() => {
		return expenses.filter((expense) => {
			const matchesSearch =
				`${expense.merchant} ${expense.category}`
					.toLowerCase()
					.includes(search.toLowerCase())

			const matchesCategory =
				category === 'All categories' ||
				expense.category === category

			const matchesMethod =
				method === 'All methods' ||
				expense.payment_method === method

			let matchesDate = true

			if (dateFilter !== 'Any date') {
				const expenseDate = new Date(`${expense.date}T00:00:00`)
				const today = new Date()

				if (!Number.isNaN(expenseDate.getTime())) {
					const differenceInDays =
						(today - expenseDate) / (1000 * 60 * 60 * 24)

					if (dateFilter === 'Last 30 days') {
						matchesDate =
							differenceInDays >= 0 &&
							differenceInDays <= 30
					}

					if (dateFilter === 'Last 3 months') {
						matchesDate =
							differenceInDays >= 0 &&
							differenceInDays <= 90
					}
				}
			}

			return (
				matchesSearch &&
				matchesDate &&
				matchesCategory &&
				matchesMethod
			)
		})
	}, [category, dateFilter, expenses, method, search])

	const pageSize = 5

	const pageCount = Math.max(
		1,
		Math.ceil(filteredExpenses.length / pageSize)
	)

	const visibleExpenses = filteredExpenses.slice(
		(page - 1) * pageSize,
		page * pageSize
	)

	const updateNewExpense = (field, value) => {
		setNewExpense((current) => ({
			...current,
			[field]: value,
		}))
	}

	const updateEditingExpense = (field, value) => {
		setEditingExpense((current) => ({
			...current,
			[field]: value,
		}))
	}

	// Save expense to PostgreSQL through FastAPI
	const saveExpense = async (event) => {
		event.preventDefault()

		const amount = Number(newExpense.amount)

		if (!newExpense.merchant.trim() || !amount || amount < 0) {
			return
		}

		try {
			setError('')

			const token = localStorage.getItem('access_token')

			const response = await fetch(`${API_URL}/expenses/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					date: newExpense.date,
					merchant: newExpense.merchant.trim(),
					category: newExpense.category,
					payment_method: newExpense.method,
					amount: amount,
				}),
			})

			const responseText = await response.text()

			if (response.status === 401) {
				onLogout?.()
				return
			}

			if (!response.ok) {
				console.error(
					'Backend response:',
					response.status,
					responseText
				)

				throw new Error(`Backend error: ${response.status}`)
			}

			const savedExpense = JSON.parse(responseText)

			setExpenses((current) => [
				savedExpense,
				...current,
			])

			setNewExpense({
				amount: '',
				merchant: '',
				category: 'Groceries',
				date: new Date().toISOString().slice(0, 10),
				method: 'Visa •••• 4242',
			})

			setIsAddModalOpen(false)
			setPage(1)
		} catch (err) {
			console.error('Error saving expense:', err)
			setError('Could not save the expense to the database.')
		}
	}

	const saveEditedExpense = async (event) => {
		event.preventDefault()

		const amount = Number(editingExpense.amount)

		if (!editingExpense.merchant.trim() || !amount || amount < 0) {
			return
		}

		try {
			setError('')

			const token = localStorage.getItem('access_token')

			const response = await fetch(
				`${API_URL}/expenses/${editingExpense.id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						date: editingExpense.date,
						merchant: editingExpense.merchant.trim(),
						category: editingExpense.category,
						payment_method: editingExpense.method,
						amount: amount,
					}),
				}
			)

			const responseText = await response.text()

			if (response.status === 401) {
				onLogout?.()
				return
			}

			if (!response.ok) {
				console.error(
					'Backend response:',
					response.status,
					responseText
				)

				throw new Error(`Backend error: ${response.status}`)
			}

			const updatedExpense = JSON.parse(responseText)

			setExpenses((current) =>
				current.map((expense) =>
					expense.id === updatedExpense.id
						? updatedExpense
						: expense
				)
			)
			setEditingExpense(null)
		} catch (err) {
			console.error('Error updating expense:', err)
			setError('Could not update the expense. Please try again.')
		}
	}

	const deleteExpense = async (expense) => {
		const confirmed = window.confirm(
			`Delete ${expense.merchant}? This action cannot be undone.`
		)

		if (!confirmed) {
			return
		}

		try {
			setError('')

			const token = localStorage.getItem('access_token')

			const response = await fetch(
				`${API_URL}/expenses/${expense.id}`,
				{
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			)

			const responseText = await response.text()

			if (response.status === 401) {
				onLogout?.()
				return
			}

			if (!response.ok) {
				console.error(
					'Backend response:',
					response.status,
					responseText
				)

				throw new Error(`Backend error: ${response.status}`)
			}

			setExpenses((current) =>
				current.filter((currentExpense) =>
					currentExpense.id !== expense.id
				)
			)
			setActiveExpenseId(null)
		} catch (err) {
			console.error('Error deleting expense:', err)
			setError('Could not delete the expense. Please try again.')
		}
	}

	return (
		<div className="font-body-md text-body-md antialiased min-h-screen flex bg-surface expenses-shell">
			<Sidebar activePath={activePath} onLogout={onLogout} />

			<div className="flex-1 flex flex-col min-w-0 md:ml-64 bg-surface">
				<Header onQuickAdd={onQuickAdd || (() => setIsAddModalOpen(true))} />

				<main className="flex-1 p-container-padding-mobile md:p-container-padding-desktop max-w-7xl mx-auto w-full">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-stack-md mb-8">
						<div>
							<h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
								All Expenses
							</h2>

							<p className="font-body-md text-body-md text-on-surface-variant mt-1">
								Review, filter, and manage your everyday spending.
							</p>
						</div>

						<button
							className="bg-primary text-on-primary font-label-md text-label-md py-3 px-4 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-stack-sm"
							onClick={() => setIsAddModalOpen(true)}
						>
							<Icon size="18px">add</Icon>
							Add Expense
						</button>
					</div>

					{error && (
						<div className="mb-4 rounded-lg border border-error/30 bg-error-container/30 px-4 py-3 text-error">
							{error}
						</div>
					)}


					<section className="card-level-1 rounded-xl p-stack-lg">
						<div className="flex flex-col lg:flex-row gap-stack-md justify-between mb-6">
							<div className="flex items-center bg-surface-container-low rounded-lg px-3 py-2 border border-outline-variant/50 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 transition-all w-full lg:max-w-sm">
								<Icon size="20px">search</Icon>

								<input
									className="bg-transparent border-none outline-none font-body-md text-body-md text-primary w-full ml-2 placeholder:text-on-surface-variant"
									onChange={(event) => {
										setSearch(event.target.value)
										setPage(1)
									}}
									placeholder="Search expenses..."
									type="search"
									value={search}
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-stack-sm w-full lg:w-auto">
								<FilterSelect
									label="Date"
									options={[
										'Any date',
										'Last 30 days',
										'Last 3 months',
									]}
									value={dateFilter}
									onChange={(value) => {
										setDateFilter(value)
										setPage(1)
									}}
								/>

								<FilterSelect
									label="Category"
									options={[
										'All categories',
										...new Set(
											expenses.map(
												(expense) => expense.category
											)
										),
									]}
									value={category}
									onChange={(value) => {
										setCategory(value)
										setPage(1)
									}}
								/>

								<FilterSelect
									label="Payment method"
									options={[
										'All methods',
										...new Set(
											expenses.map(
												(expense) =>
													expense.payment_method
											)
										),
									]}
									value={method}
									onChange={(value) => {
										setMethod(value)
										setPage(1)
									}}
								/>
							</div>
						</div>

						<div className="expenses-table-wrap">
							{loading ? (
								<div className="py-12 text-center text-on-surface-variant">
									Loading expenses...
								</div>
							) : (
								<>
									<table className="w-full text-left">
										<thead>
											<tr className="border-b border-outline-variant/50">
												<th>Date</th>
												<th>Description</th>
												<th>Category</th>
												<th>Payment method</th>
												<th className="amount-column">
													Amount
												</th>
												<th aria-label="Actions" />
											</tr>
										</thead>

										<tbody>
											{visibleExpenses.map((expense) => (
												<tr key={expense.id}>
													<td className="text-on-surface-variant whitespace-nowrap">
														{formatDate(expense.date)}
													</td>

													<td>
														<div className="flex items-center gap-stack-sm">
															<div
																className={`expense-icon w-10 h-10 rounded-full flex items-center justify-center ${
																	colorByCategory[
																		expense.category
																	] ||
																	'bg-primary-fixed/50 text-on-primary-fixed-variant'
																}`}
															>
																<Icon size="20px">
																	{iconByCategory[
																		expense.category
																	] ||
																		'payments'}
																</Icon>
															</div>

															<span className="font-medium text-primary">
																{expense.merchant}
															</span>
														</div>
													</td>

													<td>
														<span className="category-label">
															{expense.category}
														</span>
													</td>

													<td className="text-on-surface-variant whitespace-nowrap">
														{expense.payment_method}
													</td>

													<td className="amount-column font-semibold text-primary whitespace-nowrap">
														-₹
														{Number(
															expense.amount
														).toFixed(2)}
													</td>

											<td>
												<div className="expense-actions-menu-wrap">
													<button
														aria-expanded={activeExpenseId === expense.id}
														aria-label={`More options for ${expense.merchant}`}
														className="text-on-surface-variant p-2 rounded-full hover:bg-surface-container-high transition-colors"
														onClick={() =>
															setActiveExpenseId((current) =>
																current === expense.id
																	? null
																	: expense.id
															)
														}
													>
														<Icon>more_horiz</Icon>
													</button>

													{activeExpenseId === expense.id && (
														<div className="expense-actions-menu">
															<button
																onClick={() => {
																setEditingExpense({
																	id: expense.id,
																	amount: String(expense.amount),
																	merchant: expense.merchant,
																	category: expense.category,
																	date: expense.date,
																	method: expense.payment_method,
																})
																setActiveExpenseId(null)
															}}
															>
																<Icon size="18px">edit</Icon>
																Edit
															</button>
															<button
																className="expense-delete-action"
																onClick={() => deleteExpense(expense)}
															>
																<Icon size="18px">delete</Icon>
																Delete
															</button>
														</div>
													)}
												</div>
											</td>
												</tr>
											))}
										</tbody>
									</table>

									{filteredExpenses.length === 0 && (
										<div className="py-12 text-center text-on-surface-variant">
											No expenses match your filters.
										</div>
									)}
								</>
							)}
						</div>

						<div className="flex flex-col sm:flex-row justify-between items-center gap-stack-md pt-6">
							<span className="font-label-md text-label-md text-on-surface-variant">
								Showing {visibleExpenses.length} of{' '}
								{filteredExpenses.length} expenses
							</span>

							<div className="flex items-center gap-1">
								<button
									aria-label="Previous page"
									className="pagination-button text-on-surface-variant"
									disabled={page === 1}
									onClick={() =>
										setPage(
											(currentPage) =>
												currentPage - 1
										)
									}
								>
									<Icon>chevron_left</Icon>
								</button>

								{Array.from(
									{ length: pageCount },
									(_, index) => index + 1
								).map((pageNumber) => (
									<button
										className={`pagination-button ${
											page === pageNumber
												? 'pagination-current'
												: 'text-on-surface-variant'
										}`}
										key={pageNumber}
										onClick={() =>
											setPage(pageNumber)
										}
									>
										{pageNumber}
									</button>
								))}

								<button
									aria-label="Next page"
									className="pagination-button text-on-surface-variant"
									disabled={page === pageCount}
									onClick={() =>
										setPage(
											(currentPage) =>
												currentPage + 1
										)
									}
								>
									<Icon>chevron_right</Icon>
								</button>
							</div>
						</div>
					</section>

					<div className="h-8" />
				</main>
			</div>

			{isAddModalOpen && (
				<AddExpenseModal
					expense={newExpense}
					onChange={updateNewExpense}
					onCancel={() => setIsAddModalOpen(false)}
					onSave={saveExpense}
				/>
			)}

			{editingExpense && (
				<AddExpenseModal
					expense={editingExpense}
					isEditing
					onChange={updateEditingExpense}
					onCancel={() => setEditingExpense(null)}
					onSave={saveEditedExpense}
				/>
			)}
		</div>
	)
}

function AddExpenseModal({
	expense,
	isEditing = false,
	onChange,
	onCancel,
	onSave,
}) {
	return (
		<div
			className="expense-modal-backdrop"
			role="presentation"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) {
					onCancel()
				}
			}}
		>
			<form className="expense-modal" onSubmit={onSave}>
				<div className="flex items-start justify-between mb-6">
					<div>
						<h2 className="font-headline-md text-headline-md text-primary">
							{isEditing ? 'Edit Expense' : 'Add Expense'}
						</h2>

						<p className="font-body-md text-body-md text-on-surface-variant mt-1">
							{isEditing
								? 'Update this transaction.'
								: 'Record a new transaction.'}
						</p>
					</div>

					<button
						aria-label="Close dialog"
						className="text-on-surface-variant p-2 rounded-full hover:bg-surface-container-high"
						onClick={onCancel}
						type="button"
					>
						<Icon>close</Icon>
					</button>
				</div>

				<div className="expense-form-grid">
					<label className="expense-form-field">
						<span>Amount</span>
						<input
							min="0.01"
							onChange={(event) =>
								onChange(
									'amount',
									event.target.value
								)
							}
							placeholder="0.00"
							required
							step="0.01"
							type="number"
							value={expense.amount}
						/>
					</label>

					<label className="expense-form-field">
						<span>Description / merchant</span>
						<input
							onChange={(event) =>
								onChange(
									'merchant',
									event.target.value
								)
							}
							placeholder="e.g. Coffee shop"
							required
							type="text"
							value={expense.merchant}
						/>
					</label>

					<label className="expense-form-field">
						<span>Category</span>
						<select
							onChange={(event) =>
								onChange(
									'category',
									event.target.value
								)
							}
							value={expense.category}
						>
							{[
								'Groceries',
								'Housing',
								'Transport',
								'Entertainment',
								'Dining',
								'Health',
								'Shopping',
								'Bills',
							].map((option) => (
								<option key={option}>
									{option}
								</option>
							))}
						</select>
					</label>

					<label className="expense-form-field">
						<span>Date</span>
						<input
							onChange={(event) =>
								onChange(
									'date',
									event.target.value
								)
							}
							required
							type="date"
							value={expense.date}
						/>
					</label>

					<label className="expense-form-field">
						<span>Payment method</span>
						<select
							onChange={(event) =>
								onChange(
									'method',
									event.target.value
								)
							}
							value={expense.method}
						>
							{[
								'Visa •••• 4242',
								'Mastercard •••• 8810',
								'Bank transfer',
								'Mobile wallet',
							].map((option) => (
								<option key={option}>
									{option}
								</option>
							))}
						</select>
					</label>
				</div>

				<div className="flex justify-end gap-stack-sm mt-8">
					<button
						className="text-secondary font-label-md text-label-md font-medium px-4 py-2 rounded border border-secondary hover:bg-secondary/5"
						onClick={onCancel}
						type="button"
					>
						Cancel
					</button>

					<button
						className="bg-primary text-on-primary font-label-md text-label-md font-medium px-4 py-2 rounded hover:opacity-90"
						type="submit"
					>
						{isEditing ? 'Update Expense' : 'Save Expense'}
					</button>
				</div>
			</form>
		</div>
	)
}

function FilterSelect({
	label,
	options,
	value,
	onChange,
}) {
	return (
		<label className="filter-field">
			<span>{label}</span>

			<select
				value={value || options[0]}
				onChange={(event) =>
					onChange?.(event.target.value)
				}
			>
				{options.map((option) => (
					<option key={option}>{option}</option>
				))}
			</select>

			<Icon size="18px">expand_more</Icon>
		</label>
	)
}

export default Expenses

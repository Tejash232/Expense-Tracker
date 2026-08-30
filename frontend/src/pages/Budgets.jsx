import { useEffect, useState } from 'react'
import API_URL from '../config.js'
import { useData } from '../context/DataContext.jsx'
import './Budgets.css'

const navItems = [
	['dashboard', 'Dashboard', '/'],
	['payments', 'Expenses', '/expenses'],
	['account_balance_wallet', 'Budgets', '/budgets'],
]

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
	Groceries:
		'bg-primary-fixed/50 text-on-primary-fixed-variant',

	Housing:
		'bg-secondary-container/50 text-on-secondary-container',

	Transport:
		'bg-tertiary-fixed/50 text-on-tertiary-fixed',

	Entertainment:
		'bg-surface-variant text-on-surface',

	Dining:
		'bg-error-container/50 text-on-error-container',

	Health:
		'bg-primary-fixed/50 text-on-primary-fixed-variant',

	Shopping:
		'bg-secondary-container/50 text-on-secondary-container',

	Bills:
		'bg-surface-variant text-on-surface',
}

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

						<span className="font-label-md text-label-md">
							{label}
						</span>
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

					<span className="font-label-md text-label-md">
						Logout
					</span>
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

const getCurrentMonthStr = () => {
	const now = new Date()
	const year = now.getFullYear()
	const month = String(now.getMonth() + 1).padStart(2, '0')
	return `${year}-${month}`
}

function Budgets({ activePath = '/budgets', onLogout, onQuickAdd }) {
	const {
		budgetsByMonth,
		budgetsError,
		fetchBudgets,
		addOrUpdateBudgetState,
		deleteBudgetState,
	} = useData()

	const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr())
	const [editingBudget, setEditingBudget] = useState(null)
	const [localError, setLocalError] = useState('')

	useEffect(() => {
		fetchBudgets(selectedMonth)
	}, [selectedMonth, fetchBudgets])

	const budgets = budgetsByMonth[selectedMonth] || []
	const loading = !budgetsByMonth[selectedMonth]
	const error = budgetsError || localError

	// --------------------------------------------------
	// TOTALS
	// --------------------------------------------------

	const totalBudget = budgets.reduce(
		(total, budget) =>
			total + Number(budget.amount),
		0
	)

	const totalSpent = budgets.reduce(
		(total, budget) =>
			total + Number(budget.spent),
		0
	)

	const totalRemaining =
		totalBudget - totalSpent

	const formatCurrency = (value) =>
		`₹${Number(value).toLocaleString(
			'en-IN',
			{
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}
		)}`

	// --------------------------------------------------
	// SAVE / CREATE / UPDATE BUDGET
	// --------------------------------------------------

	const saveBudget = async (event) => {
		event.preventDefault()

		const amount = Number(
			editingBudget.amount
		)

		const category =
			editingBudget.category.trim()

		const monthStr = editingBudget.month
			? (editingBudget.month.length === 7 ? `${editingBudget.month}-01` : editingBudget.month)
			: `${selectedMonth}-01`

		if (!category || !amount || amount < 0) {
			return
		}

		try {
			setError('')

			const token =
				localStorage.getItem('access_token')

			const isEditing =
				editingBudget.id !== null

			const url = isEditing
				? `${API_URL}/budgets/${editingBudget.id}`
				: `${API_URL}/budgets/`

			const method = isEditing
				? 'PUT'
				: 'POST'

			const response = await fetch(
				url,
				{
					method,
					headers: {
						'Content-Type':
							'application/json',

						Authorization: `Bearer ${token}`,
					},

					body: JSON.stringify({
						category: category,
						amount: amount,
						month: monthStr,
					}),
				}
			)

			const responseText =
				await response.text()

			if (response.status === 401) {
				onLogout?.()
				return
			}

			if (!response.ok) {
				console.error(
					'Budget save error:',
					response.status,
					responseText
				)

				let message = `Could not save budget. (${response.status})`
				try {
					const parsed = JSON.parse(responseText)
					if (parsed.detail) {
						message = parsed.detail
					}
				} catch (e) {
					// ignore
				}

				throw new Error(message)
			}

			const savedBudget =
				JSON.parse(responseText)

			const monthKey = savedBudget.month
				? savedBudget.month.slice(0, 7)
				: selectedMonth

			addOrUpdateBudgetState(savedBudget, monthKey)
			setEditingBudget(null)
		} catch (err) {
			console.error(
				'Error saving budget:',
				err
			)

			setLocalError(
				err.message || 'Could not save budget. Make sure the backend is running.'
			)
		}
	}

	const deleteBudget = async (budget) => {
		const confirmed = window.confirm(
			`Delete the ${budget.category} budget? This action cannot be undone.`
		)

		if (!confirmed) {
			return
		}

		try {
			setLocalError('')

			const token =
				localStorage.getItem('access_token')

			const response = await fetch(
				`${API_URL}/budgets/${budget.id}`,
				{
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			)

			const responseText =
				await response.text()

			if (response.status === 401) {
				onLogout?.()
				return
			}

			if (!response.ok) {
				console.error(
					'Budget delete error:',
					response.status,
					responseText
				)

				throw new Error(
					`Backend error: ${response.status}`
				)
			}

			deleteBudgetState(budget.id, selectedMonth)
		} catch (err) {
			console.error(
				'Error deleting budget:',
				err
			)

			setLocalError(
				'Could not delete the budget. Please try again.'
			)
		}
	}

	return (
		<div className="font-body-md text-body-md antialiased min-h-screen flex bg-surface budgets-shell">
			<Sidebar activePath={activePath} onLogout={onLogout} />

			<div className="flex-1 flex flex-col min-w-0 md:ml-64 bg-surface">
				<Header onQuickAdd={onQuickAdd} />

				<main className="flex-1 p-container-padding-mobile md:p-container-padding-desktop max-w-7xl mx-auto w-full">

					{/* HEADER */}

					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-stack-md mb-8">
						<div>
							<h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
								Monthly Budget
							</h2>

							<p className="font-body-md text-body-md text-on-surface-variant mt-1">
								Plan your spending and stay on track throughout the month.
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-stack-md">
							<div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 py-2">
								<span className="font-label-md text-label-md text-on-surface-variant font-medium">Month:</span>
								<input
									className="bg-transparent border-none outline-none font-body-md text-body-md text-primary cursor-pointer"
									type="month"
									value={selectedMonth}
									onChange={(e) => setSelectedMonth(e.target.value || getCurrentMonthStr())}
								/>
							</div>

							<button
								className="bg-primary text-on-primary font-label-md text-label-md py-3 px-4 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-stack-sm"
								onClick={() =>
									setEditingBudget({
										id: null,
										category: '',
										amount: '',
										month: selectedMonth,
									})
								}
							>
								<Icon size="18px">
									add
								</Icon>

								Add Budget
							</button>
						</div>
					</div>

					{/* ERROR */}

					{error && (
						<div className="mb-4 rounded-lg border border-error/30 bg-error-container/30 px-4 py-3 text-error">
							{error}
						</div>
					)}

					{/* METRICS */}

					<section className="grid grid-cols-1 sm:grid-cols-3 gap-gutter mb-gutter">
						<Metric
							label="Total budget"
							value={formatCurrency(
								totalBudget
							)}
							icon="account_balance_wallet"
						/>

						<Metric
							label="Total spent"
							value={formatCurrency(
								totalSpent
							)}
							icon="trending_up"
						/>

						<Metric
							label="Remaining"
							value={formatCurrency(
								totalRemaining
							)}
							icon="savings"
						/>
					</section>

					{/* CATEGORY BUDGETS */}

					<section className="card-level-1 rounded-xl p-stack-lg">

						<div className="flex justify-between items-center mb-6">
							<div>
								<h3 className="font-headline-md text-headline-md text-primary">
									Category budgets
								</h3>

								<p className="font-body-md text-body-md text-on-surface-variant mt-1">
									Monitor each spending category.
								</p>
							</div>

							<span className="font-label-md text-label-md text-on-surface-variant">
								{budgets.length}{' '}
								categories
							</span>
						</div>

						{loading ? (
							<div className="py-12 text-center text-on-surface-variant">
								Loading budgets...
							</div>
						) : budgets.length === 0 ? (
							<div className="py-12 text-center text-on-surface-variant">
								No budgets yet. Click "Add Budget" to create one.
							</div>
						) : (
							<div className="budget-list">

								{budgets.map(
									(budget) => {
										const amount =
											Number(
												budget.amount
											)

										const spent =
											Number(
												budget.spent
											)

										const remaining =
											amount -
											spent

										const percentage =
											amount > 0
												? Math.min(
														100,
														Math.round(
															(spent /
																amount) *
																100
														)
													)
												: 0

										const icon =
											iconByCategory[
												budget.category
											] ||
											'category'

										const color =
											colorByCategory[
												budget.category
											] ||
											'bg-primary-fixed/50 text-on-primary-fixed-variant'

										return (
											<div
												className="budget-row"
												key={
													budget.id
												}
											>

												{/* CATEGORY */}

												<div className="flex items-center gap-stack-md min-w-0">

													<div
														className={`budget-icon w-10 h-10 rounded-full flex items-center justify-center ${color}`}
													>
														<Icon size="20px">
															{
																icon
															}
														</Icon>
													</div>

													<div className="min-w-0">

														<p className="font-body-md text-body-md font-medium text-primary">
															{
																budget.category
															}
														</p>

														<p className="font-label-md text-label-md text-on-surface-variant">
															{formatCurrency(
																spent
															)}{' '}
															of{' '}
															{formatCurrency(
																amount
															)}{' '}
															used
														</p>

													</div>
												</div>

												{/* PROGRESS */}

												<div className="budget-progress">

													<div className="flex justify-between font-label-md text-label-md text-on-surface-variant">

														<span>
															{
																percentage
															}
															% used
														</span>

														<span
															className={
																remaining <
																0
																	? 'text-error'
																	: 'text-secondary'
															}
														>
															{formatCurrency(
																Math.max(
																	remaining,
																	0
																)
															)}{' '}
															left
														</span>

													</div>

													<div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-2">

														<div
															className={`h-full rounded-full ${
																percentage >=
																90
																	? 'bg-error'
																	: 'bg-secondary'
															}`}
															style={{
																width: `${percentage}%`,
															}}
														/>

													</div>
												</div>

												{/* EDIT */}

												<div className="budget-actions">

													<button
														aria-label={`Edit ${budget.category} budget`}
														className="text-on-surface-variant p-2 rounded-full hover:bg-surface-container-high"
														onClick={() =>
															setEditingBudget(
																{
																	id: budget.id,
																	category:
																		budget.category,
																	amount:
																		budget.amount,
																	month:
																		budget.month ? budget.month.slice(0, 7) : selectedMonth,
																}
															)
														}
													>
														<Icon size="20px">
															edit
														</Icon>
													</button>

													<button
														aria-label={`Delete ${budget.category} budget`}
														className="text-error p-2 rounded-full hover:bg-error-container"
														onClick={() =>
															deleteBudget(
																budget
															)
														}
													>
														<Icon size="20px">
															delete
														</Icon>
													</button>

												</div>

											</div>
										)
									}
								)}

							</div>
						)}

					</section>

					<div className="h-8" />

				</main>
			</div>

			{/* MODAL */}

			{editingBudget && (
				<BudgetModal
					budget={editingBudget}
					onChange={(
						field,
						value
					) =>
						setEditingBudget(
							(current) => ({
								...current,
								[field]:
									value,
							})
						)
					}
					onCancel={() =>
						setEditingBudget(
							null
						)
					}
					onSave={saveBudget}
				/>
			)}
		</div>
	)
}

function Metric({
	label,
	value,
	icon,
}) {
	return (
		<div className="card-level-1 rounded-xl p-stack-lg">

			<div className="flex justify-between items-center">

				<span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
					{label}
				</span>

				<span className="p-2 bg-secondary-container/50 text-on-secondary-container rounded-full">
					<Icon size="16px">
						{icon}
					</Icon>
				</span>

			</div>

			<p className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mt-4">
				{value}
			</p>

		</div>
	)
}

function BudgetModal({
	budget,
	onChange,
	onCancel,
	onSave,
}) {
	const isEditing = budget.id !== null

	return (
		<div
			className="budget-modal-backdrop"
			role="presentation"
			onMouseDown={(event) => {
				if (
					event.target ===
					event.currentTarget
				) {
					onCancel()
				}
			}}
		>

			<form
				className="budget-modal"
				onSubmit={onSave}
			>

				<div className="flex justify-between items-start mb-6">

					<div>

						<h2 className="font-headline-md text-headline-md text-primary">
							{isEditing
								? 'Edit Category Budget'
								: 'Add Category Budget'}
						</h2>

						<p className="font-body-md text-body-md text-on-surface-variant mt-1">
							Update your monthly spending limit.
						</p>

					</div>

					<button
						aria-label="Close dialog"
						className="text-on-surface-variant p-2 rounded-full hover:bg-surface-container-high"
						onClick={onCancel}
						type="button"
					>
						<Icon>
							close
						</Icon>
					</button>

				</div>

				<label className="budget-form-field">

					<span>
						Category name
					</span>

					<input
						onChange={(event) =>
							onChange(
								'category',
								event.target
									.value
							)
						}
						placeholder="e.g. Groceries"
						required
						type="text"
						value={
							budget.category
						}
					/>

				</label>

				<label className="budget-form-field mt-4">

					<span>
						Budget limit
					</span>

					<input
						min="0.01"
						onChange={(event) =>
							onChange(
								'amount',
								event.target
									.value
							)
						}
						placeholder="e.g. 5000"
						required
						step="0.01"
						type="number"
						value={
							budget.amount
						}
					/>

				</label>

				<label className="budget-form-field mt-4">

					<span>
						Budget month
					</span>

					<input
						onChange={(event) =>
							onChange(
								'month',
								event.target
									.value
							)
						}
						required
						type="month"
						value={
							budget.month ? budget.month.slice(0, 7) : ''
						}
					/>

				</label>

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
						{isEditing
							? 'Update Budget'
							: 'Save Budget'}
					</button>

				</div>

			</form>
		</div>
	)
}

export default Budgets

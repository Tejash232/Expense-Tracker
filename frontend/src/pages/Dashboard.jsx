import { useEffect, useState } from 'react'
import API_URL from '../config.js'
import './Dashboard.css'

const navItems = [
	['dashboard', 'Dashboard', '/'],
	['payments', 'Expenses', '/expenses'],
	['account_balance_wallet', 'Budgets', '/budgets'],
]

/* Historical mock expense data retained as a comment for reference.
const expenses = [
	['shopping_cart', 'Whole Foods Market', 'Groceries • Today, 2:45 PM', '-₹142.50', 'bg-primary-fixed/50 text-on-primary-fixed-variant'],
	['home', 'Crestview Apartments', 'Housing • Yesterday', '-₹1,200.00', 'bg-secondary-container/50 text-on-secondary-container'],
	['directions_car', 'Shell Station', 'Transport • Oct 24', '-₹45.00', 'bg-tertiary-fixed/50 text-on-tertiary-fixed'],
	['subscriptions', 'Netflix Premium', 'Entertainment • Oct 22', '-₹19.99', 'bg-surface-variant text-on-surface'],
	['restaurant', 'Bistro 71', 'Dining • Oct 20', '-₹84.20', 'bg-error-container/50 text-on-error-container'],
]
*/

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

const chartColors = ['#006a61', '#89f5e7', '#38485d', '#bec6e0']

const legendColors = [
	'bg-secondary',
	'bg-secondary-fixed',
	'bg-on-tertiary-fixed-variant',
	'bg-primary-fixed-dim',
]

function formatCurrency(value) {
	return `₹${Number(value).toLocaleString('en-IN', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`
}

function formatCompactCurrency(value) {
	return `₹${new Intl.NumberFormat('en-IN', {
		notation: 'compact',
		maximumFractionDigits: 1,
	}).format(Number(value))}`
}

function formatDate(date) {
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

function Icon({ children, filled = false, size }) {
	return (
		<span
			className="material-symbols-outlined"
			style={{
				...(size ? { fontSize: size } : {}),
				...(filled ? { fontVariationSettings: "'FILL' 1" } : {}),
			}}
		>
			{children}
		</span>
	)
}

function Dashboard({ activePath = '/', onLogout, onQuickAdd }) {
	const [expenses, setExpenses] = useState([])
	const [budgets, setBudgets] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [period, setPeriod] = useState('30 Days')

	useEffect(() => {
		let isActive = true

		const loadDashboard = async () => {
			try {
				setLoading(true)
				setError('')

				const token = localStorage.getItem('access_token')

				const now = new Date()
				const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

				const [expensesResponse, budgetsResponse] = await Promise.all([
					fetch(`${API_URL}/expenses/`, {
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}),
					fetch(`${API_URL}/budgets/?month=${currentMonthStr}`, {
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}),
				])


				if (
					expensesResponse.status === 401 ||
					budgetsResponse.status === 401
				) {
					onLogout?.()
					return
				}

				if (!expensesResponse.ok || !budgetsResponse.ok) {
					throw new Error('Could not load dashboard data.')
				}

				const [expensesData, budgetsData] = await Promise.all([
					expensesResponse.json(),
					budgetsResponse.json(),
				])

				if (isActive) {
					setExpenses(expensesData)
					setBudgets(budgetsData)
				}
			} catch (err) {
				console.error('Error loading dashboard:', err)

				if (isActive) {
					setError('Could not load your dashboard data. Please try again.')
				}
			} finally {
				if (isActive) {
					setLoading(false)
				}
			}
		}

		loadDashboard()

		return () => {
			isActive = false
		}
	}, [onLogout])

	const periodDays = period === '3 Months' ? 90 : 30
	const today = new Date()
	const periodExpenses = expenses.filter((expense) => {
		const expenseDate = new Date(`${expense.date}T00:00:00`)
		const differenceInDays =
			(today - expenseDate) / (1000 * 60 * 60 * 24)

		return (
			!Number.isNaN(expenseDate.getTime()) &&
			differenceInDays >= 0 &&
			differenceInDays <= periodDays
		)
	})

	const totalSpending = periodExpenses.reduce(
		(total, expense) => total + Number(expense.amount),
		0
	)
	const totalBudget = budgets.reduce(
		(total, budget) => total + Number(budget.amount),
		0
	)
	const totalBudgetSpent = budgets.reduce(
		(total, budget) => total + Number(budget.spent),
		0
	)
	const remainingBudget = totalBudget - totalBudgetSpent
	const budgetUsage = totalBudget > 0
		? (totalBudgetSpent / totalBudget) * 100
		: 0

	const categoryTotals = periodExpenses.reduce((totals, expense) => {
		totals[expense.category] =
			(totals[expense.category] || 0) + Number(expense.amount)

		return totals
	}, {})
	const sortedCategories = Object.entries(categoryTotals)
		.map(([category, amount]) => ({ category, amount }))
		.sort((first, second) => second.amount - first.amount)
	const categoryBreakdown = sortedCategories.length > 4
		? [
				...sortedCategories.slice(0, 3),
				{
					category: 'Other',
					amount: sortedCategories
						.slice(3)
						.reduce((total, item) => total + item.amount, 0),
				},
			]
		: sortedCategories

	const donutCircumference = 2 * Math.PI * 40
	let donutOffset = 0
	const donutSegments = categoryBreakdown.map((item, index) => {
		const segmentLength = totalSpending > 0
			? (item.amount / totalSpending) * donutCircumference
			: 0
		const segment = {
			...item,
			color: chartColors[index],
			dashArray: `${segmentLength} ${donutCircumference}`,
			dashOffset: -donutOffset,
		}

		donutOffset += segmentLength

		return segment
	})

	const chartBucketCount = period === '3 Months' ? 3 : 4
	const chartTotals = Array(chartBucketCount).fill(0)

	periodExpenses.forEach((expense) => {
		const expenseDate = new Date(`${expense.date}T00:00:00`)
		const differenceInDays =
			(today - expenseDate) / (1000 * 60 * 60 * 24)
		const bucket = Math.min(
			chartBucketCount - 1,
			Math.floor(
				(periodDays - differenceInDays) /
				(periodDays / chartBucketCount)
			)
		)

		chartTotals[bucket] += Number(expense.amount)
	})

	const chartMaximum = Math.max(...chartTotals, 0)
	const chartPoints = chartTotals.map((amount, index) => {
		const x = (index / (chartTotals.length - 1)) * 100
		const y = chartMaximum > 0
			? 100 - (amount / chartMaximum) * 100
			: 100

		return `${x},${y}`
	}).join(' ')
	const chartLabels = period === '3 Months'
		? ['Month 1', 'Month 2', 'Month 3']
		: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
	const recentExpenses = [...expenses]
		.sort((first, second) => {
			return (
				new Date(`${second.date}T00:00:00`) -
				new Date(`${first.date}T00:00:00`)
			)
		})
		.slice(0, 5)

	return (
		<div className="font-body-md text-body-md antialiased min-h-screen flex bg-surface dashboard-shell">
			<aside className="hidden md:flex fixed left-0 top-0 h-full flex-col py-stack-lg border-r border-outline-variant bg-surface-container-low w-64 z-40">
				<div className="px-stack-lg mb-stack-lg flex flex-col gap-unit">
					<h1 className="font-headline-md text-headline-md font-bold text-primary">SpendWise</h1>
					<p className="font-label-md text-label-md text-on-surface-variant">Wealth Management</p>
				</div>
				<nav className="flex-1 px-stack-sm flex flex-col gap-unit">
					{navItems.map(([icon, label, href]) => (
						<a
							className={`flex items-center gap-stack-md rounded-lg px-stack-md py-2 active:scale-[0.98] transition-transform duration-150 ${activePath === href ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all'}`}
							href={href}
							key={label}
						>
							<Icon filled={activePath === href}>{icon}</Icon>
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

			<div className="flex-1 flex flex-col min-w-0 md:ml-64 bg-surface">
				<header className="flex justify-between items-center w-full px-container-padding-mobile md:px-container-padding-desktop sticky top-0 z-50 h-16 bg-surface shadow-sm">
					<div className="md:hidden flex items-center gap-stack-md">
						<button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:scale-95"><Icon>menu</Icon></button>
						<span className="font-headline-md text-headline-md font-bold text-primary">SpendWise</span>
					</div>
					<div className="flex items-center gap-stack-md ml-auto">
						<button className="hidden sm:block text-secondary font-label-md text-label-md font-medium px-4 py-1.5 rounded border border-secondary hover:bg-secondary/5 transition-colors duration-200 cursor-pointer active:scale-95" onClick={onQuickAdd}>Quick Add</button>
						<div className="h-8 w-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center border border-outline-variant ml-2">
							<Icon size="20px">person</Icon>
						</div>
					</div>
				</header>

				<main className="flex-1 p-container-padding-mobile md:p-container-padding-desktop flex flex-col gap-gutter max-w-7xl mx-auto w-full">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-stack-sm mb-2">
						<div><h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">Overview</h2><p className="font-body-md text-body-md text-on-surface-variant mt-1">Here's a summary of your financial activity.</p></div>
						<div className="bg-surface-container rounded-lg p-1 flex font-label-md text-label-md border border-outline-variant/30"><button className={`px-4 py-1.5 rounded-md ${period === '30 Days' ? 'bg-surface-container-lowest shadow-sm text-primary font-medium' : 'text-on-surface-variant hover:text-primary transition-colors'}`} onClick={() => setPeriod('30 Days')}>30 Days</button><button className={`px-4 py-1.5 rounded-md ${period === '3 Months' ? 'bg-surface-container-lowest shadow-sm text-primary font-medium' : 'text-on-surface-variant hover:text-primary transition-colors'}`} onClick={() => setPeriod('3 Months')}>3 Months</button></div>
					</div>

					{/* Replaced static dashboard data. */}
					{/*
					<div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
						<SummaryCard title="Monthly Spending" icon="trending_up" value="₹2,450.00" trend="+5.2%" trendClass="text-error" iconClass="bg-error-container/30 text-on-error-container" />
						<SummaryCard title="Budget Remaining" icon="account_balance_wallet" value="₹550.00" iconClass="bg-secondary-container/50 text-on-secondary-container"><div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1"><div className="bg-secondary h-full rounded-full" style={{ width: '82%' }} /></div><span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">82% of ₹3,000 used</span></SummaryCard>
						<SummaryCard title="Savings" icon="savings" value="₹1,200.00" trend="+12.5%" trendClass="text-secondary" iconClass="bg-secondary-container/50 text-on-secondary-container" />
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
						<div className="card-level-1 rounded-xl p-stack-lg lg:col-span-2 flex flex-col">
							<div className="flex justify-between items-center mb-6"><h3 className="font-headline-md text-headline-md text-primary">Spending Statistics</h3><button className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 font-label-md text-label-md">Details <Icon size="16px">chevron_right</Icon></button></div>
							<div className="flex-1 relative w-full h-64 min-h-[250px] flex items-end pt-4">
								<div className="absolute left-0 top-0 h-full flex flex-col justify-between text-on-surface-variant font-label-sm text-label-sm pb-8"><span>₹3k</span><span>₹2k</span><span>₹1k</span><span>₹0</span></div>
								<div className="absolute inset-0 ml-8 mb-8 border-b border-outline-variant/30 flex flex-col justify-between pb-[1px]"><div className="border-t border-outline-variant/20 w-full flex-1 border-dashed" /><div className="border-t border-outline-variant/20 w-full flex-1 border-dashed" /><div className="border-t border-outline-variant/20 w-full flex-1 border-dashed" /></div>
								<svg className="w-full h-full ml-8 pb-8 overflow-visible z-10 relative" preserveAspectRatio="none" viewBox="0 0 100 100"><defs><linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#86f2e4" stopOpacity="0.3" /><stop offset="100%" stopColor="#86f2e4" stopOpacity="0" /></linearGradient></defs><path className="chart-area" d="M0,80 C15,60 25,90 40,50 C55,10 70,70 85,30 C95,10 100,40 100,40 L100,100 L0,100 Z" /><path className="chart-line" d="M0,80 C15,60 25,90 40,50 C55,10 70,70 85,30 C95,10 100,40 100,40" vectorEffect="non-scaling-stroke" /><circle cx="40" cy="50" fill="#ffffff" r="1.5" stroke="#006a61" strokeWidth="0.5" vectorEffect="non-scaling-stroke" /><circle cx="85" cy="30" fill="#ffffff" r="1.5" stroke="#006a61" strokeWidth="0.5" vectorEffect="non-scaling-stroke" /></svg>
								<div className="absolute bottom-0 left-8 right-0 flex justify-between text-on-surface-variant font-label-sm text-label-sm"><span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span></div>
							</div>
						</div>

						<div className="card-level-1 rounded-xl p-stack-lg flex flex-col">
							<h3 className="font-headline-md text-headline-md text-primary mb-6">Spending by Category</h3>
							<div className="relative w-48 h-48 mx-auto flex items-center justify-center"><svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="transparent" r="40" stroke="#f2f4f6" strokeWidth="16" /><circle className="donut-segment" cx="50" cy="50" fill="transparent" r="40" stroke="#006a61" strokeDasharray="100.5 150.7" strokeWidth="16" /><circle className="donut-segment" cx="50" cy="50" fill="transparent" r="40" stroke="#89f5e7" strokeDasharray="62.8 188.4" strokeDashoffset="-100.5" strokeWidth="16" /><circle className="donut-segment" cx="50" cy="50" fill="transparent" r="40" stroke="#38485d" strokeDasharray="50.2 201" strokeDashoffset="-163.3" strokeWidth="16" /><circle className="donut-segment" cx="50" cy="50" fill="transparent" r="40" stroke="#bec6e0" strokeDasharray="37.7 213.5" strokeDashoffset="-213.5" strokeWidth="16" /></svg><div className="absolute flex flex-col items-center justify-center text-center"><span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Total</span><span className="font-headline-md text-headline-md text-primary font-bold">₹2.4k</span></div></div>
							<div className="mt-6 flex flex-col gap-3">{[['bg-secondary', 'Housing', '40%'], ['bg-secondary-fixed', 'Food', '25%'], ['bg-on-tertiary-fixed-variant', 'Transport', '20%'], ['bg-primary-fixed-dim', 'Other', '15%']].map(([color, label, value]) => <div className="flex items-center justify-between text-body-md font-body-md" key={label}><div className="flex items-center gap-2 text-on-surface-variant"><span className={`w-3 h-3 rounded-full ${color}`} />{label}</div><span className="font-medium text-primary">{value}</span></div>)}</div>
						</div>
					</div>

					<div className="card-level-1 rounded-xl p-stack-lg flex flex-col"><div className="flex justify-between items-center mb-6"><h3 className="font-headline-md text-headline-md text-primary">Recent Expenses</h3><button className="text-secondary hover:text-secondary-fixed-dim transition-colors font-label-md text-label-md font-medium">View All</button></div><div className="flex flex-col">{expenses.map(([icon, name, detail, amount, iconClass], index) => <div className={`flex items-center justify-between py-4 ${index < expenses.length - 1 ? 'border-b border-outline-variant/30' : ''} group hover:bg-surface-bright transition-colors rounded-lg px-2 -mx-2`} key={name}><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform ${iconClass}`}><Icon size="20px">{icon}</Icon></div><div><p className="font-body-md text-body-md font-medium text-primary">{name}</p><p className="font-label-md text-label-md text-on-surface-variant">{detail}</p></div></div><span className="font-body-md text-body-md font-semibold text-primary">{amount}</span></div>)}</div></div>
					*/}
					{loading ? (
						<div className="card-level-1 rounded-xl p-stack-lg text-center text-on-surface-variant">
							Loading dashboard data...
						</div>
					) : error ? (
						<div className="rounded-lg border border-error/30 bg-error-container/30 px-4 py-3 text-error">
							{error}
						</div>
					) : (
						<DashboardContent
							budgetUsage={budgetUsage}
							donutSegments={donutSegments}
							chartLabels={chartLabels}
							chartMaximum={chartMaximum}
							chartPoints={chartPoints}
							chartTotals={chartTotals}
							period={period}
							periodExpenses={periodExpenses}
							recentExpenses={recentExpenses}
							remainingBudget={remainingBudget}
							totalBudget={totalBudget}
							totalBudgetSpent={totalBudgetSpent}
							totalSpending={totalSpending}
						/>
					)}
					<div className="h-8" />
				</main>
			</div>
		</div>
	)
}

function DashboardContent({
	budgetUsage,
	donutSegments,
	chartLabels,
	chartMaximum,
	chartPoints,
	chartTotals,
	period,
	periodExpenses,
	recentExpenses,
	remainingBudget,
	totalBudget,
	totalBudgetSpent,
	totalSpending,
}) {
	const hasSpending = chartMaximum > 0

	return (
		<>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
				<SummaryCard
					title="Total Spending"
					icon="trending_up"
					value={formatCurrency(totalSpending)}
					iconClass="bg-error-container/30 text-on-error-container"
				>
					<span className="font-label-sm text-label-sm mt-1 text-on-surface-variant">
						{periodExpenses.length} expense{periodExpenses.length === 1 ? '' : 's'} in the selected period
					</span>
				</SummaryCard>

				<SummaryCard
					title="Budget Remaining"
					icon="account_balance_wallet"
					value={formatCurrency(remainingBudget)}
					iconClass="bg-secondary-container/50 text-on-secondary-container"
				>
					{totalBudget > 0 ? (
						<>
							<div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
								<div className="bg-secondary h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, budgetUsage))}%` }} />
							</div>
							<span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
								{formatCurrency(totalBudgetSpent)} of {formatCurrency(totalBudget)} used
							</span>
						</>
					) : (
						<span className="font-label-sm text-label-sm mt-1 text-on-surface-variant">
							No budgets created yet.
						</span>
					)}
				</SummaryCard>

				<SummaryCard
					title="Budget Used"
					icon="savings"
					value={formatCurrency(totalBudgetSpent)}
					iconClass="bg-secondary-container/50 text-on-secondary-container"
				>
					<span className="font-label-sm text-label-sm mt-1 text-on-surface-variant">
						{totalBudget > 0 ? `${Math.round(budgetUsage)}% of your total budget` : 'Add a budget to track spending.'}
					</span>
				</SummaryCard>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
				<div className="card-level-1 rounded-xl p-stack-lg lg:col-span-2 flex flex-col">
					<div className="flex justify-between items-center mb-6">
						<h3 className="font-headline-md text-headline-md text-primary">Spending Statistics</h3>
						<span className="text-on-surface-variant font-label-md text-label-md">{period}</span>
					</div>

					{hasSpending ? (
						<div className="flex-1 relative w-full h-64 min-h-[250px] flex items-end pt-4">
							<div className="absolute left-0 top-0 h-full flex flex-col justify-between text-on-surface-variant font-label-sm text-label-sm pb-8">
								<span>{formatCompactCurrency(chartMaximum)}</span>
								<span>{formatCompactCurrency(chartMaximum * (2 / 3))}</span>
								<span>{formatCompactCurrency(chartMaximum / 3)}</span>
								<span>₹0</span>
							</div>
							<div className="absolute inset-0 ml-8 mb-8 border-b border-outline-variant/30 flex flex-col justify-between pb-[1px]">
								<div className="border-t border-outline-variant/20 w-full flex-1 border-dashed" />
								<div className="border-t border-outline-variant/20 w-full flex-1 border-dashed" />
								<div className="border-t border-outline-variant/20 w-full flex-1 border-dashed" />
							</div>
							<svg className="w-full h-full ml-8 pb-8 overflow-visible z-10 relative" preserveAspectRatio="none" viewBox="0 0 100 100">
								<defs>
									<linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
										<stop offset="0%" stopColor="#86f2e4" stopOpacity="0.3" />
										<stop offset="100%" stopColor="#86f2e4" stopOpacity="0" />
									</linearGradient>
								</defs>
								<polygon fill="url(#areaGradient)" points={`0,100 ${chartPoints} 100,100`} />
								<polyline fill="none" points={chartPoints} stroke="#006a61" strokeWidth="1" vectorEffect="non-scaling-stroke" />
								{chartTotals.map((amount, index) => {
									const x = (index / (chartTotals.length - 1)) * 100
									const y = 100 - (amount / chartMaximum) * 100

									return <circle cx={x} cy={y} fill="#ffffff" key={chartLabels[index]} r="1.5" stroke="#006a61" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
								})}
							</svg>
							<div className="absolute bottom-0 left-8 right-0 flex justify-between text-on-surface-variant font-label-sm text-label-sm">
								{chartLabels.map((label) => <span key={label}>{label}</span>)}
							</div>
						</div>
					) : (
						<div className="flex-1 min-h-[250px] flex items-center justify-center text-on-surface-variant">
							No expenses recorded for this period.
						</div>
					)}
				</div>

				<div className="card-level-1 rounded-xl p-stack-lg flex flex-col">
					<h3 className="font-headline-md text-headline-md text-primary mb-6">Spending by Category</h3>
					{hasSpending ? (
						<>
							<div className="relative w-48 h-48 mx-auto flex items-center justify-center">
								<svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
									<circle cx="50" cy="50" fill="transparent" r="40" stroke="#f2f4f6" strokeWidth="16" />
									{donutSegments.map((segment) => (
										<circle
											className="donut-segment"
											cx="50"
											cy="50"
											fill="transparent"
											key={segment.category}
											r="40"
											stroke={segment.color}
											strokeDasharray={segment.dashArray}
											strokeDashoffset={segment.dashOffset}
											strokeWidth="16"
										/>
									))}
								</svg>
								<div className="absolute flex flex-col items-center justify-center text-center">
									<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Total</span>
									<span className="font-headline-md text-headline-md text-primary font-bold">{formatCompactCurrency(totalSpending)}</span>
								</div>
							</div>
							<div className="mt-6 flex flex-col gap-3">
								{donutSegments.map((segment, index) => (
									<div className="flex items-center justify-between text-body-md font-body-md" key={segment.category}>
										<div className="flex items-center gap-2 text-on-surface-variant"><span className={`w-3 h-3 rounded-full ${legendColors[index]}`} />{segment.category}</div>
										<span className="font-medium text-primary">{Math.round((segment.amount / totalSpending) * 100)}%</span>
									</div>
								))}
							</div>
						</>
					) : (
						<div className="flex-1 min-h-48 flex items-center justify-center text-center text-on-surface-variant">
							No category spending for this period.
						</div>
					)}
				</div>
			</div>

			<div className="card-level-1 rounded-xl p-stack-lg flex flex-col">
				<div className="flex justify-between items-center mb-6">
					<h3 className="font-headline-md text-headline-md text-primary">Recent Expenses</h3>
					<button className="text-secondary hover:text-secondary-fixed-dim transition-colors font-label-md text-label-md font-medium">View All</button>
				</div>
				<div className="flex flex-col">
					{recentExpenses.length === 0 ? (
						<div className="py-8 text-center text-on-surface-variant">No expenses recorded yet.</div>
					) : recentExpenses.map((expense, index) => (
						<div className={`flex items-center justify-between py-4 ${index < recentExpenses.length - 1 ? 'border-b border-outline-variant/30' : ''} group hover:bg-surface-bright transition-colors rounded-lg px-2 -mx-2`} key={expense.id}>
							<div className="flex items-center gap-4">
								<div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform ${colorByCategory[expense.category] || 'bg-primary-fixed/50 text-on-primary-fixed-variant'}`}><Icon size="20px">{iconByCategory[expense.category] || 'payments'}</Icon></div>
								<div><p className="font-body-md text-body-md font-medium text-primary">{expense.merchant}</p><p className="font-label-md text-label-md text-on-surface-variant">{expense.category} • {formatDate(expense.date)}</p></div>
							</div>
							<span className="font-body-md text-body-md font-semibold text-primary">-{formatCurrency(expense.amount)}</span>
						</div>
					))}
				</div>
			</div>
		</>
	)
}

function SummaryCard({ title, icon, value, trend, trendClass, iconClass, children }) {
	return <div className="card-level-1 p-stack-lg rounded-xl flex flex-col gap-stack-sm relative overflow-hidden group hover:shadow-md transition-shadow"><div className="flex justify-between items-center w-full"><span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{title}</span><div className={`p-2 rounded-full ${iconClass}`}><Icon size="16px">{icon}</Icon></div></div><div className="mt-2 flex items-baseline gap-2"><span className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">{value}</span></div>{children || <div className="font-label-sm text-label-sm mt-1"><span className={`${trendClass} font-medium`}>{trend}</span> <span className="text-on-surface-variant">vs last month</span></div>}</div>
}

export default Dashboard

import { useEffect, useState } from 'react'

import Dashboard from './pages/Dashboard.jsx'
import Expenses from './pages/Expenses.jsx'
import Budgets from './pages/Budgets.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'


function currentPath() {
  const normalizedPath =
    window.location.pathname.replace(/\/+$/, '') || '/'

  return [
    '/',
    '/expenses',
    '/budgets',
    '/login',
    '/register',
  ].includes(normalizedPath)
    ? normalizedPath
    : '/'
}


function App() {

  // Check if a JWT token already exists
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('access_token')
  )

  const [path, setPath] = useState(currentPath)


  // Handle browser back/forward buttons
  useEffect(() => {

    const handlePopState = () => {
      setPath(currentPath())
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }

  }, [])


  // Keep unauthenticated visitors on public routes.
  useEffect(() => {

    if (
      !isLoggedIn &&
      path !== '/login' &&
      path !== '/register'
    ) {
      window.history.replaceState({}, '', '/login')

      setPath('/login')
    }

  }, [isLoggedIn, path])


  // Navigation function
  const navigate = (nextPath) => {

    if (nextPath === path) return

    window.history.pushState({}, '', nextPath)

    setPath(nextPath)
  }


  const handleLogin = () => {

    setIsLoggedIn(true)

    window.history.pushState({}, '', '/')

    setPath('/')
  }


  const handleRegistered = () => {

    window.history.pushState({}, '', '/login')

    setPath('/login')
  }


  const handleLogout = () => {

    localStorage.removeItem('access_token')

    setIsLoggedIn(false)

    window.history.pushState({}, '', '/login')

    setPath('/login')
  }


  // ------------------------------------------------
  // NOT LOGGED IN
  // ------------------------------------------------

  if (!isLoggedIn) {

    if (path === '/register') {

      return (
        <Register
          onRegister={handleRegistered}
          onShowLogin={() => navigate('/login')}
        />
      )
    }

    return (
      <Login
        onLogin={handleLogin}
        onShowRegister={() => navigate('/register')}
      />
    )
  }


  // ------------------------------------------------
  // LOGGED IN
  // ------------------------------------------------

  const pageProps = {
    activePath: path,
    onNavigate: navigate,
    onLogout: handleLogout,
  }


  if (path === '/expenses') {
    return <Expenses {...pageProps} />
  }


  if (path === '/budgets') {
    return <Budgets {...pageProps} />
  }


  return <Dashboard {...pageProps} />
}


export default App

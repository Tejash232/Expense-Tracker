import { useState } from 'react'
import './Login.css'

function Login({ onLogin, onShowRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed')
      }

      localStorage.setItem('access_token', data.access_token)

      onLogin()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <main className="login-container">

        {/* Desktop top bar */}
        <header className="login-topbar">
          <div className="brand-small">
            <span className="wallet-icon">▣</span>
            <span>SpendWise</span>
          </div>
        </header>

        {/* Login card */}
        <div className="login-card">

          <div className="login-heading">
            <h1>Welcome Back</h1>
            <p>Log in to continue to your dashboard.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="login-error">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>

              <div className="input-wrapper">
                <span className="input-icon">✉</span>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="input-wrapper">
                <span className="input-icon">🔒</span>

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '◉' : '◌'}
                </button>
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              <span>
                {loading ? 'Logging in...' : 'Login'}
              </span>

              {!loading && <span className="arrow">→</span>}
            </button>

          </form>

          {/* Register */}
          <div className="register-link">
            <p>
              Don't have an account?
              <button
                type="button"
                onClick={onShowRegister}
              >
                Register
              </button>
            </p>
          </div>

        </div>

        {/* Bottom text */}
        <div className="secure-text">
          <div></div>
          <p>Secure Financial Management</p>
        </div>

      </main>
    </div>
  )
}

export default Login
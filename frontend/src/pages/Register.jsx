import { useState } from 'react'
import './Register.css'

function Register({ onRegister, onShowLogin }) {
  const [name, setName] = useState('')
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
      const response = await fetch('http://127.0.0.1:8001/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed')
      }

      // Registration successful
      if (onRegister) {
        onRegister(data)
      } else if (onShowLogin) {
        onShowLogin()
      }

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <main className="register-container">

        {/* Register Card */}
        <div className="register-card">

          {/* Logo */}
          <div className="register-logo">
            <div className="register-wallet-icon">
              ▣
            </div>

            <h1>SpendWise</h1>

            <p>
              Create an account to manage your finances.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="register-error">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Full Name */}
            <div className="register-form-group">
              <label htmlFor="name">
                Full Name
              </label>

              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div className="register-form-group">
              <label htmlFor="register-email">
                Email Address
              </label>

              <input
                id="register-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="register-form-group">
              <label htmlFor="register-password">
                Password
              </label>

              <div className="register-password-wrapper">

                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="register-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '◉' : '◌'}
                </button>

              </div>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              <span>
                {loading ? 'Creating account...' : 'Register'}
              </span>

              {!loading && (
                <span className="register-arrow">
                  →
                </span>
              )}
            </button>

          </form>

          {/* Login */}
          <div className="login-link">
            <p>
              Already have an account?
              <button
                type="button"
                onClick={onShowLogin}
              >
                Login
              </button>
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="register-secure-text">
          <div></div>
          <p>Secure Financial Management</p>
        </div>

      </main>
    </div>
  )
}

export default Register
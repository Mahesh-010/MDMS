import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '../../shared/components/Input'
import { PasswordField } from '../../shared/components/PasswordField'
import './LoginPage.css'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const minimumPasswordLength = 8

interface LoginErrors {
  email?: string
  password?: string
}

function getEmailError(email: string): string | undefined {
  if (!email.trim()) return 'Email is required.'
  if (!emailPattern.test(email.trim())) return 'Enter a valid email address.'
  return undefined
}

function getPasswordError(password: string): string | undefined {
  if (!password) return 'Password is required.'
  if (password.length < minimumPasswordLength) {
    return `Password must be at least ${minimumPasswordLength} characters.`
  }
  return undefined
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [formError, setFormError] = useState('')

  const errors: LoginErrors = {
    email: emailTouched || submitted ? getEmailError(email) : undefined,
    password: passwordTouched || submitted ? getPasswordError(password) : undefined,
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    setSubmitMessage('')

    const emailError = getEmailError(email)
    const passwordError = getPasswordError(password)

    if (emailError || passwordError) {
      setFormError('Please correct the highlighted fields and try again.')
      return
    }

    setFormError('')
    setSubmitMessage('Sign-in is not connected yet. Choose a temporary demo role below.')
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand-mark" aria-hidden="true">M</div>
        <p className="login-eyebrow">Meter Data Management System</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="login-intro">Sign in to continue to your MDMS workspace.</p>

        <form className="login-form" noValidate onSubmit={handleSubmit}>
          <Input
            id="login-email"
            name="email"
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            error={errors.email}
            required
            onChange={(event) => {
              setEmail(event.target.value)
              setSubmitMessage('')
              setFormError('')
            }}
            onBlur={() => setEmailTouched(true)}
          />

          <PasswordField
            id="login-password"
            name="password"
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            error={errors.password}
            required
            onChange={(event) => {
              setPassword(event.target.value)
              setSubmitMessage('')
              setFormError('')
            }}
            onBlur={() => setPasswordTouched(true)}
          />
          <Link to="/forgot-password" className="login-forgot-link">
            Forgot password?
          </Link>

          <label className="login-remember">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span>Remember me</span>
          </label>

          {formError && (
            <div className="login-inline-message is-error" role="alert">
              {formError}
            </div>
          )}

          {submitMessage && (
            <div className="login-inline-message" role="status" aria-live="polite">
              {submitMessage}
            </div>
          )}

          <button type="submit" className="login-submit">
            Sign in
          </button>
        </form>

        <div className="login-demo">
          <p className="login-demo-title">Temporary demo access</p>
          <div className="login-demo-links">
            <Link to="/user/dashboard">End-user</Link>
            <Link to="/zone/dashboard">Zone</Link>
            <Link to="/enterprise/dashboard">Enterprise</Link>
          </div>
        </div>
      </section>
    </main>
  )
}

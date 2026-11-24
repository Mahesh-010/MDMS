import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '../../shared/components/Input'
import './AuthFlow.css'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setEmailError('Email is required.')
      return
    }

    if (!emailPattern.test(trimmedEmail)) {
      setEmailError('Enter a valid email address.')
      return
    }

    setEmailError('')
    setIsSubmitted(true)
    setResendMessage('')
  }

  if (isSubmitted) {
    return (
      <main className="auth-flow-page">
        <section className="auth-flow-card" aria-labelledby="forgot-success-title">
          <div className="auth-flow-icon" aria-hidden="true">✉</div>
          <p className="auth-flow-eyebrow">Password recovery</p>
          <h1 id="forgot-success-title">Check your email</h1>
          <p className="auth-flow-description">
            If an account exists for <strong>{email.trim()}</strong>, reset instructions
            will be sent there.
          </p>
          {resendMessage && (
            <p className="auth-flow-notice" role="status" aria-live="polite">
              {resendMessage}
            </p>
          )}
          <button
            type="button"
            className="auth-flow-secondary"
            onClick={() => setResendMessage('The reset email has been resent (demo only).')}
          >
            Resend email
          </button>
          <Link className="auth-flow-back-link" to="/login">
            Back to Login
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-flow-page">
      <section className="auth-flow-card" aria-labelledby="forgot-title">
        <div className="auth-flow-icon" aria-hidden="true">M</div>
        <p className="auth-flow-eyebrow">Password recovery</p>
        <h1 id="forgot-title">Forgot password?</h1>
        <p className="auth-flow-description">
          Enter your email address and we’ll show the next steps to reset your password.
        </p>
        <form className="auth-flow-form" noValidate onSubmit={handleSubmit}>
          <Input
            id="recovery-email"
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            error={emailError}
            required
            onChange={(event) => {
              setEmail(event.target.value)
              setEmailError('')
            }}
          />
          <button type="submit" className="auth-flow-primary">
            Send reset instructions
          </button>
        </form>
        <Link className="auth-flow-back-link" to="/login">
          Back to Login
        </Link>
      </section>
    </main>
  )
}

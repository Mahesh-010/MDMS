import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PasswordField } from '../../shared/components/PasswordField'
import './AuthFlow.css'

const minimumPasswordLength = 8

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [isUpdated, setIsUpdated] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const passwordError = !newPassword
      ? 'New password is required.'
      : newPassword.length < minimumPasswordLength
        ? `Password must be at least ${minimumPasswordLength} characters.`
        : ''
    const confirmationError = !confirmPassword
      ? 'Please confirm your password.'
      : confirmPassword !== newPassword
        ? 'Passwords do not match.'
        : ''

    setNewPasswordError(passwordError)
    setConfirmPasswordError(confirmationError)

    if (passwordError || confirmationError) return
    setIsUpdated(true)
  }

  if (isUpdated) {
    return (
      <main className="auth-flow-page">
        <section className="auth-flow-card" aria-labelledby="reset-success-title">
          <div className="auth-flow-icon is-success" aria-hidden="true">✓</div>
          <p className="auth-flow-eyebrow">Password recovery</p>
          <h1 id="reset-success-title">Password updated</h1>
          <p className="auth-flow-description">
            Your password has been updated in this demo. You can now return to the
            sign-in page.
          </p>
          <Link className="auth-flow-primary auth-flow-link-button" to="/login">
            Go to Login
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-flow-page">
      <section className="auth-flow-card" aria-labelledby="reset-title">
        <div className="auth-flow-icon" aria-hidden="true">M</div>
        <p className="auth-flow-eyebrow">Password recovery</p>
        <h1 id="reset-title">Set a new password</h1>
        <p className="auth-flow-description">
          Use at least {minimumPasswordLength} characters. Enter the same password
          in both fields.
        </p>
        <form className="auth-flow-form" noValidate onSubmit={handleSubmit}>
          <PasswordField
            id="new-password"
            label="New password"
            autoComplete="new-password"
            placeholder="Enter a new password"
            value={newPassword}
            error={newPasswordError}
            hint={`At least ${minimumPasswordLength} characters.`}
            required
            onChange={(event) => {
              setNewPassword(event.target.value)
              setNewPasswordError('')
              if (confirmPassword && event.target.value === confirmPassword) {
                setConfirmPasswordError('')
              }
            }}
          />
          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            error={confirmPasswordError}
            required
            onChange={(event) => {
              setConfirmPassword(event.target.value)
              setConfirmPasswordError('')
            }}
          />
          <button type="submit" className="auth-flow-primary">
            Update password
          </button>
        </form>
        <Link className="auth-flow-back-link" to="/login">
          Back to Login
        </Link>
      </section>
    </main>
  )
}

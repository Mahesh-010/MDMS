import { Link } from 'react-router-dom'
import './StatusPage.css'

export interface StatusPageProps {
  eyebrow?: string
  title: string
  description: string
  code?: string
  primaryAction?: {
    label: string
    to: string
  }
  secondaryAction?: {
    label: string
    to: string
  }
}

export function StatusPage({
  eyebrow = 'MDMS',
  title,
  description,
  code,
  primaryAction = { label: 'Go to Login', to: '/login' },
  secondaryAction,
}: StatusPageProps) {
  return (
    <main className="status-page">
      <section className="status-page-card">
        <div className="status-page-mark" aria-hidden="true">M</div>
        {code && <p className="status-page-code">{code}</p>}
        <p className="status-page-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="status-page-description">{description}</p>
        <div className="status-page-actions">
          <Link className="status-page-primary" to={primaryAction.to}>
            {primaryAction.label}
          </Link>
          {secondaryAction && (
            <Link className="status-page-secondary" to={secondaryAction.to}>
              {secondaryAction.label}
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}

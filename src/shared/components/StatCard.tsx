import type { ReactNode } from 'react'
import './SharedUi.css'

export interface StatCardLink {
  label: string
  href: string
}

export interface StatCardProps {
  value: ReactNode
  label: string
  hint?: ReactNode
  link?: StatCardLink
}

export function StatCard({ value, label, hint, link }: StatCardProps) {
  return (
    <article className="stat-card">
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value">{value}</p>
      {hint && <p className="stat-card-hint">{hint}</p>}
      {link && (
        <a className="stat-card-link" href={link.href}>
          {link.label}
        </a>
      )}
    </article>
  )
}

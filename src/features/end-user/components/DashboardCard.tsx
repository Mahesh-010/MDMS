import type { ReactNode } from 'react'

interface DashboardCardProps {
  title: string
  children: ReactNode
  className?: string
}

export function DashboardCard({
  title,
  children,
  className = '',
}: DashboardCardProps) {
  return (
    <section className={`dashboard-card ${className}`}>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

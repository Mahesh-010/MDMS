import type { ReactNode } from 'react'
import { TimeRangeToggle, type TimeRange } from './TimeRangeToggle'
import './SharedUi.css'

export interface ChartCardProps {
  title: string
  children: ReactNode
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
  subtitle?: string
  actions?: ReactNode
}

export function ChartCard({
  title,
  children,
  timeRange,
  onTimeRangeChange,
  subtitle,
  actions,
}: ChartCardProps) {
  return (
    <section className="chart-card" aria-label={title}>
      <header className="chart-card-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="chart-card-controls">
          <TimeRangeToggle value={timeRange} onChange={onTimeRangeChange} />
          {actions}
        </div>
      </header>
      <div className="chart-card-content">{children}</div>
    </section>
  )
}

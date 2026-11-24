import type { ReactNode } from 'react'

interface DataStatusProps {
  isLoading?: boolean
  error?: string | null
  isEmpty?: boolean
  emptyMessage: string
  children: ReactNode
}

export function DataStatus({
  isLoading = false,
  error = null,
  isEmpty = false,
  emptyMessage,
  children,
}: DataStatusProps) {
  if (isLoading) {
    return <p className="dashboard-status" role="status">Loading dashboard data...</p>
  }

  if (error) {
    return <p className="dashboard-status dashboard-error" role="alert">{error}</p>
  }

  if (isEmpty) {
    return <p className="dashboard-empty">{emptyMessage}</p>
  }

  return <>{children}</>
}

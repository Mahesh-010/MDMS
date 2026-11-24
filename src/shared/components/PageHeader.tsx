import type { ReactNode } from 'react'
import './SharedUi.css'

interface PageHeaderActionBase {
  label: string
  disabled?: boolean
  variant?: 'primary' | 'secondary'
  icon?: ReactNode
}

export type PageHeaderAction = PageHeaderActionBase &
  (
    | { href: string; onClick?: never }
    | { href?: never; onClick: () => void }
  )

export interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: PageHeaderAction[]
}

export function PageHeader({ title, subtitle, actions = [] }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions.length > 0 && (
        <div className="page-header-actions">
          {actions.map((action) => {
            const className = `ui-button ui-button--${action.variant ?? 'secondary'}`
            const contents = (
              <>
                {action.icon}
                <span>{action.label}</span>
              </>
            )

            if (action.href) {
              return (
                <a
                  key={action.label}
                  className={className}
                  href={action.href}
                  aria-disabled={action.disabled || undefined}
                  onClick={(event) => {
                    if (action.disabled) event.preventDefault()
                  }}
                >
                  {contents}
                </a>
              )
            }

            return (
              <button
                key={action.label}
                type="button"
                className={className}
                disabled={action.disabled}
                onClick={action.onClick}
              >
                {contents}
              </button>
            )
          })}
        </div>
      )}
    </header>
  )
}

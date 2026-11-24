import { NavLink } from 'react-router-dom'
import { menuConfig, roleLabels, type AppRole } from './menuConfig'

interface SidebarProps {
  role: AppRole
  isOpen: boolean
  onNavigate: () => void
}

export function Sidebar({ role, isOpen, onNavigate }: SidebarProps) {
  return (
    <aside className={`app-sidebar${isOpen ? ' is-open' : ''}`}>
      <p className="sidebar-section-label">{roleLabels[role]}</p>
      <nav aria-label={`${roleLabels[role]} navigation`} className="sidebar-nav">
        {menuConfig[role].map(({ label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to.endsWith('/dashboard')}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' is-active' : ''}`
            }
            onClick={onNavigate}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

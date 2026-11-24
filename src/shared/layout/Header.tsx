import { useState } from 'react'
import { Link } from 'react-router-dom'
import { roleLabels, type AppRole, type ThemeMode } from './menuConfig'

interface HeaderProps {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  onMenuToggle: () => void
  isSidebarOpen: boolean
  role: AppRole
}

export function Header({
  theme,
  onThemeChange,
  onMenuToggle,
  isSidebarOpen,
  role,
}: HeaderProps) {
  const [language, setLanguage] = useState('en')

  return (
    <header className="app-header">
      <div className="header-brand-group">
        <button
          type="button"
          className="mobile-menu-button"
          aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isSidebarOpen}
          onClick={onMenuToggle}
        >
          <span aria-hidden="true">{isSidebarOpen ? '×' : '☰'}</span>
        </button>
        <Link to={`/${role === 'end-user' ? 'user' : role}/dashboard`} className="app-brand">
          MDMS
        </Link>
        <span className="app-product-name">Meter Data Management System</span>
      </div>

      <div className="header-actions">
        <button type="button" className="header-icon-button notification-button" aria-label="Notifications, 3 unread">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
          <span className="unread-count" aria-hidden="true">3</span>
        </button>

        <button
          type="button"
          className="theme-toggle"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          aria-pressed={theme === 'dark'}
          onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
        >
          <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
          <span className="theme-toggle-label">{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>

        <label className="language-control">
          <span className="visually-hidden">Language</span>
          <select
            aria-label="Language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            <option value="en">EN</option>
            <option value="hi">हिन्दी</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
        </label>

        <details className="profile-menu">
          <summary aria-label="Open profile menu">
            <span className="profile-avatar" aria-hidden="true">U</span>
            <span className="profile-name">User</span>
            <span aria-hidden="true">⌄</span>
          </summary>
          <div className="profile-menu-panel">
            <p className="profile-menu-role">{roleLabels[role]}</p>
            <Link to="/profile">Profile</Link>
            <Link to={`/${role === 'end-user' ? 'user' : role}/settings`}>
              Settings
            </Link>
            <Link to="/login">Logout</Link>
          </div>
        </details>
      </div>
    </header>
  )
}

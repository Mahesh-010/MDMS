import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import type { AppRole, ThemeMode } from './menuConfig'
import './AppLayout.css'

interface AppLayoutProps {
  role: AppRole
}

function getInitialTheme(): ThemeMode {
  const savedTheme = window.localStorage.getItem('mdms-theme')
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function AppLayout({ role }: AppLayoutProps) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('mdms-theme', theme)
  }, [theme])

  return (
    <div className="app-shell">
      <Header
        theme={theme}
        onThemeChange={setTheme}
        onMenuToggle={() => setIsSidebarOpen((open) => !open)}
        isSidebarOpen={isSidebarOpen}
        role={role}
      />
      <div className="app-body">
        <Sidebar
          role={role}
          isOpen={isSidebarOpen}
          onNavigate={() => setIsSidebarOpen(false)}
        />
        {isSidebarOpen && (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Close navigation menu"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export type AppRole = 'end-user' | 'zone' | 'enterprise'
export type ThemeMode = 'light' | 'dark'

export interface MenuItem {
  label: string
  to: string
}

export const menuConfig: Record<AppRole, MenuItem[]> = {
  'end-user': [
    { label: 'Dashboard', to: '/user/dashboard' },
    { label: 'Bills & Payments', to: '/user/bills' },
    { label: 'Meter Data', to: '/user/meter-data' },
    { label: 'Alerts', to: '/user/alerts' },
  ],
  zone: [
    { label: 'Dashboard', to: '/zone/dashboard' },
    { label: 'Meter Management', to: '/zone/meters' },
    { label: 'User Management', to: '/zone/users' },
    { label: 'Reports & Analytics', to: '/zone/reports' },
    { label: 'Alerts', to: '/zone/alerts' },
    { label: 'Settings', to: '/zone/settings' },
  ],
  enterprise: [
    { label: 'Dashboard', to: '/enterprise/dashboard' },
    { label: 'Zone Management', to: '/enterprise/zones' },
    { label: 'Meter Management', to: '/enterprise/meters' },
    { label: 'User & Role Management', to: '/enterprise/users' },
    { label: 'Reports & Analytics', to: '/enterprise/reports' },
    { label: 'Alerts', to: '/enterprise/alerts' },
    { label: 'Audit Logs', to: '/enterprise/audit-logs' },
    { label: 'Settings', to: '/enterprise/settings' },
  ],
}

export const roleLabels: Record<AppRole, string> = {
  'end-user': 'End-user',
  zone: 'Zone administration',
  enterprise: 'Enterprise administration',
}

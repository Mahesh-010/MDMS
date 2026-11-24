export type UserRole = 'enterprise' | 'zoneAdmin' | 'customer'

export type RecordStatus = 'active' | 'inactive'

export interface Zone {
  id: string
  name: string
  code: string
  status: RecordStatus
}

export interface IndianAddress {
  street: string
  city: string
  state: string
  postalCode: string
  country: 'India'
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  zoneId: string | null
  status: RecordStatus
  address: IndianAddress
}

export type MeterStatus = 'active' | 'inactive' | 'underMaintenance'

export interface Meter {
  id: string
  serialNumber: string
  ownerId: string
  zoneId: string
  status: MeterStatus
  installedAt: string
  latestReadingKwh: number
}

export type BillStatus = 'paid' | 'pending' | 'overdue'

export interface Bill {
  id: string
  ownerId: string
  meterId: string
  zoneId: string
  periodStart: string
  periodEnd: string
  issuedAt: string
  dueAt: string
  amount: number
  currency: string
  unitsConsumedKwh: number
  status: BillStatus
}

export interface BillDay {
  id: string
  billId: string
  date: string
  unitsConsumedKwh: number
  hourlyReadings?: HourlyReading[]
}

export interface HourlyReading {
  id: string
  hour: string
  unitsConsumedKwh: number
}

export type ConsumptionPeriod = 'day' | 'week' | 'month' | 'year'

interface ConsumptionPoint {
  id: string
  period: ConsumptionPeriod
  periodStart: string
  label: string
  unitsKwh: number
}

export interface CustomerConsumptionPoint extends ConsumptionPoint {
  scopeType: 'customer'
  userId: string
  zoneId: string
}

export interface ZoneConsumptionPoint extends ConsumptionPoint {
  scopeType: 'zone'
  userId: null
  zoneId: string
}

export interface EnterpriseConsumptionPoint extends ConsumptionPoint {
  scopeType: 'enterprise'
  userId: null
  zoneId: null
}

export type ConsumptionPointRecord =
  | CustomerConsumptionPoint
  | ZoneConsumptionPoint
  | EnterpriseConsumptionPoint

export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertStatus = 'open' | 'acknowledged' | 'resolved'

export interface Alert {
  id: string
  userId: string | null
  zoneId: string
  meterId: string | null
  title: string
  message: string
  severity: AlertSeverity
  status: AlertStatus
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  createdAt: string
  readAt: string | null
}

export interface AuditLog {
  id: string
  userId: string
  zoneId: string | null
  action: string
  entityType: string
  entityId: string
  details: string
  createdAt: string
}

export type SettingValue = string | number | boolean
export type SettingScope = 'enterprise' | 'zone' | 'user'

export interface Setting {
  id: string
  key: string
  value: SettingValue
  scope: SettingScope
  userId: string | null
  zoneId: string | null
}

export interface MdmsDatabase {
  zones: Zone[]
  users: User[]
  meters: Meter[]
  bills: Bill[]
  billDays: BillDay[]
  consumption: ConsumptionPointRecord[]
  alerts: Alert[]
  notifications: Notification[]
  auditLogs: AuditLog[]
  settings: Setting[]
}

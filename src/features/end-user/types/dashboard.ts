import type { User } from '../../../shared/types'

export type { User }

export interface MonthlyConsumption {
  id: string
  month: string
  units: number
}

export interface DailyConsumption {
  id: string
  date: string
  units: number
}

export interface WeeklyConsumption {
  id: string
  week: string
  units: number
}

export interface BillSummary {
  amount: number
  dueDate: string
  status: 'Paid' | 'Pending' | 'Overdue'
}

export interface PreviousBill {
  period: string
  amount: number
  status: 'Paid' | 'Pending' | 'Overdue'
}

export interface MeterReading {
  id: string
  date: string
  reading: number
  unitsConsumed: number
}

export interface AlertNotification {
  id: string
  title: string
  message: string
  date: string
  severity: 'Info' | 'Warning' | 'Critical'
}

export interface ConsumptionChartPoint {
  id: string
  label: string
  units: number
}

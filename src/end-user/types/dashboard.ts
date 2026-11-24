import type {
  Bill,
  ConsumptionPeriod,
  CustomerConsumptionPoint,
  Meter,
  User,
  Zone,
} from '../../shared/types'

export type DashboardProfile = Pick<
  User,
  'id' | 'name' | 'zoneId'
>

export type DashboardChartPoint = Pick<
  CustomerConsumptionPoint,
  'id' | 'periodStart' | 'label' | 'unitsKwh'
>

export interface DashboardSummary {
  currentConsumptionKwh: number | null
  currentMonthBill: Bill | null
  outstandingBalance: number
  outstandingBillCount: number
  lastPayment: Bill | null
}

export interface DashboardData {
  profile: DashboardProfile
  zone: Pick<Zone, 'id' | 'name'> | null
  meter: Pick<Meter, 'id' | 'serialNumber'> | null
  summary: DashboardSummary
  lastSyncedAt: string
}

export interface DashboardChartQuery {
  userId: string
  period: ConsumptionPeriod
  limit: number
}

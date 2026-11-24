import API from '../../../services/http'
import type {
  ConsumptionPointRecord,
  User as MdmsUser,
} from '../../../shared/types'
import type {
  DailyConsumption,
  MonthlyConsumption,
  User,
  WeeklyConsumption,
} from '../types/dashboard'

interface PaginatedResponse<T> {
  first: number
  prev: number | null
  next: number | null
  last: number
  pages: number
  items: number
  data: T[]
}

export async function getDashboardUser(): Promise<User> {
  const response = await API.get<PaginatedResponse<MdmsUser>>('/users', {
    params: { role: 'customer', _page: 1, _per_page: 1 },
  })
  const endUser = response.data.data[0]

  if (!endUser) {
    throw new Error('No end-user record is available.')
  }

  return endUser
}

export async function getMonthlyConsumption(userId: string): Promise<MonthlyConsumption[]> {
  const response = await API.get<ConsumptionPointRecord[]>('/consumption', {
    params: { scopeType: 'customer', userId, period: 'month', _sort: 'periodStart' },
  })
  return response.data.map((point) => ({
    id: point.id,
    month: point.label,
    units: point.unitsKwh,
  }))
}

export async function getDailyConsumption(userId: string): Promise<DailyConsumption[]> {
  const response = await API.get<ConsumptionPointRecord[]>('/consumption', {
    params: { scopeType: 'customer', userId, period: 'day', _sort: 'periodStart' },
  })
  return response.data.map((point) => ({
    id: point.id,
    date: point.periodStart,
    units: point.unitsKwh,
  }))
}

export async function getWeeklyConsumption(userId: string): Promise<WeeklyConsumption[]> {
  const response = await API.get<ConsumptionPointRecord[]>('/consumption', {
    params: { scopeType: 'customer', userId, period: 'week', _sort: 'periodStart' },
  })
  return response.data.map((point) => ({
    id: point.id,
    week: point.label,
    units: point.unitsKwh,
  }))
}

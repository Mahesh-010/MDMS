
import API from '../../../services/http'
import type {
  Alert,
  Bill,
  ConsumptionPointRecord,
  Meter,
  User,
  Zone,
} from '../../../shared/types'
import type {
  EnterpriseDashboardData,
  EnterpriseDashboardSummary,
  ZonePerformance,
} from '../types/enterpriseDashboard'

interface JsonServerPage<T> {
  first: number
  prev: number | null
  next: number | null
  last: number
  pages: number
  items: number
  data: T[]
}

async function getAllRecords<T>(endpoint: string): Promise<T[]> {
  const firstResponse = await API.get<JsonServerPage<T>>(endpoint, {
    params: {
      _page: 1,
      _per_page: 100,
    },
  })

  const firstPage = firstResponse.data
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.pages - 1) }, (_, index) =>
      API.get<JsonServerPage<T>>(endpoint, {
        params: {
          _page: index + 2,
          _per_page: 100,
        },
      }),
    ),
  )

  return [
    ...firstPage.data,
    ...remainingPages.flatMap((response) => response.data.data),
  ]
}

export async function getEnterpriseDashboardData(): Promise<EnterpriseDashboardData> {
  const [zones, users, meters, bills, alerts, consumption] =
    await Promise.all([
      getAllRecords<Zone>('/zones'),
      getAllRecords<User>('/users'),
      getAllRecords<Meter>('/meters'),
      getAllRecords<Bill>('/bills'),
      getAllRecords<Alert>('/alerts'),
      getAllRecords<ConsumptionPointRecord>('/consumption'),
    ])

  return { zones, users, meters, bills, alerts, consumption }
}

export function calculateEnterpriseSummary(
  data: EnterpriseDashboardData,
): EnterpriseDashboardSummary {
  const { zones, users, meters, bills, alerts, consumption } = data

  const enterpriseConsumption = consumption.filter(
    (point) => point.scopeType === 'enterprise',
  )

  const latestConsumption = enterpriseConsumption.reduce<
    ConsumptionPointRecord | null
  >((latest, point) => {
    if (!latest || point.periodStart > latest.periodStart) return point
    return latest
  }, null)

  return {
    totalZones: zones.length,
    activeZones: zones.filter((zone) => zone.status === 'active').length,
    totalCustomers: users.filter((user) => user.role === 'customer').length,
    totalMeters: meters.length,
    activeMeters: meters.filter((meter) => meter.status === 'active').length,
    inactiveMeters: meters.filter((meter) => meter.status === 'inactive').length,
    maintenanceMeters: meters.filter(
      (meter) => meter.status === 'underMaintenance',
    ).length,
    totalConsumption: latestConsumption?.unitsKwh ?? 0,
    pendingBills: bills.filter((bill) => bill.status === 'pending').length,
    overdueBills: bills.filter((bill) => bill.status === 'overdue').length,
    openAlerts: alerts.filter(
      (alert) => alert.status === 'open',
    ).length,
    criticalAlerts: alerts.filter(
      (alert) => alert.status === 'open' && alert.severity === 'critical',
    ).length,
  }
}

export function calculateZonePerformance(
  data: EnterpriseDashboardData,
): ZonePerformance[] {
  return data.zones.map((zone) => {
    const zoneCustomers = data.users.filter(
      (user) => user.role === 'customer' && user.zoneId === zone.id,
    )

    const zoneMeters = data.meters.filter(
      (meter) => meter.zoneId === zone.id,
    )

    const zoneConsumption = data.consumption
      .filter(
        (point) =>
          point.scopeType === 'zone' && point.zoneId === zone.id,
      )
      .reduce((total, point) => {
        if (point.period === 'month') return total + point.unitsKwh
        return total
      }, 0)

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      customers: zoneCustomers.length,
      meters: zoneMeters.length,
      consumption: zoneConsumption,
    }
  })
}

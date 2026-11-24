import API from '../../services/http'
import type {
  Bill,
  ConsumptionPointRecord,
  Meter,
  User,
  Zone,
} from '../../shared/types'
import type {
  DashboardChartPoint,
  DashboardChartQuery,
  DashboardProfile,
  DashboardSummary,
} from '../types/dashboard'

interface JsonServerPage<T> {
  first: number
  prev: number | null
  next: number | null
  last: number
  pages: number
  items: number
  data: T[]
}

function firstRecord<T>(page: JsonServerPage<T>): T | null {
  return page.data[0] ?? null
}

export async function getDashboardProfile(): Promise<DashboardProfile> {
  const response = await API.get<JsonServerPage<User>>('/users', {
    params: {
      role: 'customer',
      _page: 1,
      _per_page: 1,
    },
  })
  const customer = firstRecord(response.data)

  if (!customer) {
    throw new Error('No customer profile is available in the sample data.')
  }

  return {
    id: customer.id,
    name: customer.name,
    zoneId: customer.zoneId,
  }
}

export async function getDashboardZone(
  zoneId: string | null,
): Promise<Pick<Zone, 'id' | 'name'> | null> {
  if (!zoneId) return null

  const response = await API.get<Zone>(`/zones/${encodeURIComponent(zoneId)}`)
  return { id: response.data.id, name: response.data.name }
}

export async function getPrimaryMeter(
  ownerId: string,
): Promise<Pick<Meter, 'id' | 'serialNumber'> | null> {
  const response = await API.get<JsonServerPage<Meter>>('/meters', {
    params: {
      ownerId,
      _sort: 'serialNumber',
      _page: 1,
      _per_page: 1,
    },
  })
  const meter = firstRecord(response.data)

  return meter ? { id: meter.id, serialNumber: meter.serialNumber } : null
}

export async function getDashboardSummary(
  userId: string,
  now: Date = new Date(),
): Promise<DashboardSummary> {
  const currentMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  )
  const currentMonthEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  )

  const [currentBills, outstandingBills, paidBills, latestConsumption] =
    await Promise.all([
      API.get<JsonServerPage<Bill>>('/bills', {
        params: {
          ownerId: userId,
          'issuedAt:gte': currentMonthStart.toISOString().slice(0, 10),
          'issuedAt:lte': currentMonthEnd.toISOString().slice(0, 10),
          _sort: '-issuedAt',
          _page: 1,
          _per_page: 1,
        },
      }),
      API.get<JsonServerPage<Bill>>('/bills', {
        params: {
          ownerId: userId,
          'status:in': 'pending,overdue',
          _page: 1,
          _per_page: 100,
        },
      }),
      API.get<JsonServerPage<Bill>>('/bills', {
        params: {
          ownerId: userId,
          status: 'paid',
          _sort: '-paidAt',
          _page: 1,
          _per_page: 1,
        },
      }),
      API.get<JsonServerPage<ConsumptionPointRecord>>('/consumption', {
        params: {
          scopeType: 'customer',
          userId,
          period: 'day',
          _sort: '-periodStart',
          _page: 1,
          _per_page: 1,
        },
      }),
    ])

  const outstandingPage = outstandingBills.data
  const additionalOutstandingPages = await Promise.all(
    Array.from(
      { length: Math.max(0, outstandingPage.pages - 1) },
      (_, index) =>
        API.get<JsonServerPage<Bill>>('/bills', {
          params: {
            ownerId: userId,
            'status:in': 'pending,overdue',
            _page: index + 2,
            _per_page: 100,
          },
        }),
    ),
  )
  const unpaid = [
    ...outstandingPage.data,
    ...additionalOutstandingPages.flatMap((page) => page.data.data),
  ]
  const latestDailyPoint = firstRecord(latestConsumption.data)

  return {
    currentConsumptionKwh: latestDailyPoint?.unitsKwh ?? null,
    currentMonthBill: firstRecord(currentBills.data),
    outstandingBalance: unpaid.reduce((total, bill) => total + bill.amount, 0),
    outstandingBillCount: outstandingPage.items,
    lastPayment: firstRecord(paidBills.data),
  }
}

export async function getConsumptionSeries({
  userId,
  period,
  limit,
}: DashboardChartQuery): Promise<DashboardChartPoint[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError('Consumption series limit must be a positive integer.')
  }

  const response = await API.get<JsonServerPage<DashboardChartPoint>>(
    '/consumption',
    {
      params: {
        scopeType: 'customer',
        userId,
        period,
        _sort: '-periodStart',
        _page: 1,
        _per_page: limit,
      },
    },
  )

  return response.data.data.reverse()
}

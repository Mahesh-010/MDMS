import API from '../../services/http'
import type {
  ConsumptionPeriod,
  CustomerConsumptionPoint,
  Meter,
  User,
  Zone,
} from '../../shared/types'

interface JsonServerPage<T> {
  first: number
  prev: number | null
  next: number | null
  last: number
  pages: number
  items: number
  data: T[]
}

export interface MeterDataResponse {
  customer: User
  zone: Zone | null
  meters: Meter[]
}

export async function getCustomerMeterData(): Promise<MeterDataResponse> {
  const userResponse = await API.get<JsonServerPage<User>>('/users', {
    params: {
      role: 'customer',
      _page: 1,
      _per_page: 1,
    },
  })

  const customer = userResponse.data.data[0]

  if (!customer) {
    throw new Error('No customer found in the database.')
  }

  const [meterResponse, zoneResponse] = await Promise.all([
    API.get<JsonServerPage<Meter>>('/meters', {
      params: {
        ownerId: customer.id,
        _sort: 'serialNumber',
        _page: 1,
        _per_page: 100,
      },
    }),
    customer.zoneId
      ? API.get<Zone>(`/zones/${encodeURIComponent(customer.zoneId)}`)
      : Promise.resolve(null),
  ])

  return {
    customer,
    zone: zoneResponse?.data ?? null,
    meters: meterResponse.data.data,
  }
}

export async function getCustomerConsumption(
  userId: string,
  period: ConsumptionPeriod,
): Promise<CustomerConsumptionPoint[]> {
  const limits: Record<ConsumptionPeriod, number> = {
    day: 24,
    week: 12,
    month: 12,
    year: 5,
  }

  const response = await API.get<JsonServerPage<CustomerConsumptionPoint>>(
    '/consumption',
    {
      params: {
        scopeType: 'customer',
        userId,
        period,
        _sort: '-periodStart',
        _page: 1,
        _per_page: limits[period],
      },
    },
  )

  return response.data.data.reverse()
}

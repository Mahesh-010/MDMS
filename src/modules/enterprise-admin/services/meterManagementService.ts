
import API from '../../../services/http'
import type { Meter, MeterStatus, User, Zone } from '../../../shared/types'

interface JsonServerPage<T> {
  pages: number
  data: T[]
}

export interface EnterpriseMeterRecord {
  meter: Meter
  owner: User | null
  zone: Zone | null
}

async function getAllRecords<T>(endpoint: string): Promise<T[]> {
  const response = await API.get<JsonServerPage<T>>(endpoint, {
    params: { _page: 1, _per_page: 100 },
  })

  const firstPage = response.data

  if (firstPage.pages <= 1) return firstPage.data

  const remaining = await Promise.all(
    Array.from({ length: firstPage.pages - 1 }, (_, index) =>
      API.get<JsonServerPage<T>>(endpoint, {
        params: { _page: index + 2, _per_page: 100 },
      }),
    ),
  )

  return [
    ...firstPage.data,
    ...remaining.flatMap((page) => page.data.data),
  ]
}

export async function getEnterpriseMeters(): Promise<EnterpriseMeterRecord[]> {
  const [meters, users, zones] = await Promise.all([
    getAllRecords<Meter>('/meters'),
    getAllRecords<User>('/users'),
    getAllRecords<Zone>('/zones'),
  ])

  const usersById = new Map(users.map((user) => [user.id, user]))
  const zonesById = new Map(zones.map((zone) => [zone.id, zone]))

  return meters.map((meter) => ({
    meter,
    owner: usersById.get(meter.ownerId) ?? null,
    zone: zonesById.get(meter.zoneId) ?? null,
  }))
}

export async function updateMeterStatus(
  meterId: string,
  status: MeterStatus,
): Promise<Meter> {
  const response = await API.patch<Meter>(
    `/meters/${encodeURIComponent(meterId)}`,
    { status },
  )

  return response.data
}

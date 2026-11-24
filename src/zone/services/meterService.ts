import API from '../../services/http'
import type { Meter, MeterStatus } from '../../shared/types'

export type MeterSortField =
  | 'serialNumber'
  | 'status'
  | 'installedAt'
  | 'latestReadingKwh'

export interface GetMetersParams {
  zoneId: string
  page?: number
  limit?: number
  search?: string
  status?: MeterStatus
  sortBy?: MeterSortField
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

interface JsonServerPage<T> {
  first: number
  prev: number | null
  next: number | null
  last: number
  pages: number
  items: number
  data: T[]
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer.`)
  }
}

export async function getMeters({
  zoneId,
  page = 1,
  limit = 10,
  search,
  status,
  sortBy = 'serialNumber',
  sortOrder = 'asc',
}: GetMetersParams): Promise<PaginatedResult<Meter>> {
  assertPositiveInteger(page, 'page')
  assertPositiveInteger(limit, 'limit')

  const searchTerm = search?.trim()
  const params: Record<string, string | number> = {
    zoneId,
    _page: page,
    _per_page: limit,
    _sort: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
  }

  if (searchTerm) {
    params['serialNumber:contains'] = searchTerm
  }

  if (status) {
    params['status:eq'] = status
  }

  const response = await API.get<JsonServerPage<Meter>>('/meters', { params })
  return {
    data: response.data.data,
    total: response.data.items,
    page,
    limit,
  }
}

export async function getMeterById(meterId: string): Promise<Meter> {
  const response = await API.get<Meter>(`/meters/${encodeURIComponent(meterId)}`)
  return response.data
}

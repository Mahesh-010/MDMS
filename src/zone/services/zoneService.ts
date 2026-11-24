import API from '../../services/http'
import type { Alert, Setting } from '../../shared/types'

export async function getZoneAlerts(zoneId: string): Promise<Alert[]> {
  const response = await API.get<Alert[]>('/alerts', {
    params: { zoneId },
  })
  return response.data
}

export async function getZoneSettings(zoneId: string): Promise<Setting[]> {
  const response = await API.get<Setting[]>('/settings', {
    params: { scope: 'zone', zoneId },
  })
  return response.data
}

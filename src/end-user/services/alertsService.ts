import API from '../../services/http'
import type { Alert, Notification, User } from '../../shared/types'

interface JsonServerPage<T> {
  first: number
  prev: number | null
  next: number | null
  last: number
  pages: number
  items: number
  data: T[]
}

export interface CustomerAlertsData {
  customer: User
  alerts: Alert[]
  notifications: Notification[]
}

export async function getCustomerAlerts(): Promise<CustomerAlertsData> {
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

  if (!customer.zoneId) {
    throw new Error('Your account is not assigned to a zone.')
  }

  const [alertResponse, notificationResponse] = await Promise.all([
    API.get<JsonServerPage<Alert>>('/alerts', {
      params: {
        zoneId: customer.zoneId,
        _sort: '-createdAt',
        _page: 1,
        _per_page: 100,
      },
    }),

    API.get<JsonServerPage<Notification>>('/notifications', {
      params: {
        userId: customer.id,
        _sort: '-createdAt',
        _page: 1,
        _per_page: 100,
      },
    }),
  ])

  const customerAlerts = alertResponse.data.data.filter(
    (alert) =>
      alert.userId === customer.id || alert.userId === null,
  )

  return {
    customer,
    alerts: customerAlerts,
    notifications: notificationResponse.data.data,
  }
}

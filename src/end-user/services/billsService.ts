
import API from '../../services/http'
import type {
  Bill,
  BillDay,
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

export interface BillsPageData {
  customerName: string
  bills: Bill[]
}

export interface BillDetailsData {
  bill: Bill
  customer: User
  meter: Meter
  zone: Zone
  billDays: BillDay[]
}

export async function getCustomerBills(): Promise<BillsPageData> {
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

  const billsResponse = await API.get<JsonServerPage<Bill>>('/bills', {
    params: {
      ownerId: customer.id,
      _sort: '-issuedAt',
      _page: 1,
      _per_page: 100,
    },
  })

  return {
    customerName: customer.name,
    bills: billsResponse.data.data,
  }
}

export async function getBillDetails(
  billId: string,
): Promise<BillDetailsData> {
  if (!billId.trim()) {
    throw new Error('Invalid bill ID.')
  }

  const billResponse = await API.get<Bill>(
    `/bills/${encodeURIComponent(billId)}`,
  )

  const bill = billResponse.data

  const [customerResponse, meterResponse, zoneResponse, daysResponse] =
    await Promise.all([
      API.get<User>(`/users/${encodeURIComponent(bill.ownerId)}`),
      API.get<Meter>(`/meters/${encodeURIComponent(bill.meterId)}`),
      API.get<Zone>(`/zones/${encodeURIComponent(bill.zoneId)}`),
      API.get<JsonServerPage<BillDay>>('/billDays', {
        params: {
          billId: bill.id,
          _sort: 'date',
          _page: 1,
          _per_page: 100,
        },
      }),
    ])

  return {
    bill,
    customer: customerResponse.data,
    meter: meterResponse.data,
    zone: zoneResponse.data,
    billDays: daysResponse.data.data,
  }
}

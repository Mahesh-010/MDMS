import { fakerEN_IN as faker } from '@faker-js/faker'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

faker.seed(20261124)

const zoneDefinitions = [
  { id: 'zone-mangalore', name: 'Mangalore', code: 'MNG' },
  { id: 'zone-udupi', name: 'Udupi', code: 'UDP' },
  { id: 'zone-surathkal', name: 'Surathkal', code: 'SRK' },
  { id: 'zone-mulki', name: 'Mulki', code: 'MLK' },
]
const billStatuses = ['paid', 'pending', 'overdue']
const zones = zoneDefinitions.map((zone) => ({ ...zone, status: 'active' }))
const users = []
const meters = []
const bills = []
const billDays = []
const consumption = []
const alerts = []
const notifications = []
const auditLogs = []
const settings = []
const customerMeters = new Map()
const zoneCustomers = new Map(zoneDefinitions.map(({ id }) => [id, []]))
let emailSequence = 1
let meterSequence = 1
let billSequence = 1
let billDaySequence = 1

const round = (value) => Number(value.toFixed(2))
const dateString = (date) => date.toISOString().slice(0, 10)
const addDays = (date, days) => {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}
const makeAddress = (city) => ({
  street: faker.location.streetAddress(),
  city,
  state: 'Karnataka',
  postalCode: String(faker.number.int({ min: 570001, max: 581999 })),
  country: 'India',
})
const makeUser = (role, zoneId, city) => {
  const name = faker.person.fullName()
  const emailName = name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')
  const user = {
    id: `${role}-${String(users.length + 1).padStart(3, '0')}`,
    name,
    email: `${emailName}.${emailSequence++}@mdms.example`,
    role,
    zoneId,
    status: 'active',
    address: makeAddress(city),
  }
  users.push(user)
  return user
}

const enterpriseUser = makeUser('enterprise', null, 'Bengaluru')
for (const zone of zoneDefinitions) {
  makeUser('zoneAdmin', zone.id, zone.name)
  zoneCustomers.set(zone.id, [])
  for (let customerIndex = 0; customerIndex < 12; customerIndex += 1) {
    const customer = makeUser('customer', zone.id, zone.name)
    zoneCustomers.get(zone.id).push(customer)
    const meterCount = faker.number.int({ min: 1, max: 3 })
    const ownedMeters = []

    for (let index = 0; index < meterCount; index += 1) {
      const meter = {
        id: `meter-${String(meterSequence).padStart(4, '0')}`,
        serialNumber: `MDMS-${zone.code}-${String(meterSequence).padStart(6, '0')}`,
        ownerId: customer.id,
        zoneId: zone.id,
        status: faker.helpers.arrayElement(['active', 'active', 'active', 'underMaintenance']),
        installedAt: dateString(faker.date.past({ years: 8 })),
        latestReadingKwh: round(faker.number.float({ min: 800, max: 28000, fractionDigits: 2 })),
      }
      meterSequence += 1
      meters.push(meter)
      ownedMeters.push(meter)
    }

    customerMeters.set(customer.id, ownedMeters)
  }
}

const now = new Date()
const firstBillMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 12, 1))
const featuredCustomer = zoneCustomers.get(zoneDefinitions[0].id)[0]

for (const zone of zoneDefinitions) {
  for (const customer of zoneCustomers.get(zone.id)) {
    const meter = customerMeters.get(customer.id)[0]

    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      const periodStartDate = new Date(Date.UTC(
        firstBillMonth.getUTCFullYear(),
        firstBillMonth.getUTCMonth() + monthIndex,
        1,
      ))
      const periodEndDate = new Date(Date.UTC(
        periodStartDate.getUTCFullYear(),
        periodStartDate.getUTCMonth() + 1,
        0,
      ))
      const periodStart = dateString(periodStartDate)
      const periodEnd = dateString(periodEndDate)
      const billId = `bill-${String(billSequence).padStart(5, '0')}`
      const estimatedUnits = round(faker.number.float({ min: 250, max: 720, fractionDigits: 2 }))
      const isFeatured = customer.id === featuredCustomer.id
      const readings = []

      if (isFeatured) {
        const daysInMonth = periodEndDate.getUTCDate()
        const weights = Array.from({ length: daysInMonth }, () =>
          faker.number.float({ min: 0.6, max: 1.4, fractionDigits: 4 }),
        )
        const weightTotal = weights.reduce((sum, weight) => sum + weight, 0)
        let assignedUnits = 0

        for (let day = 0; day < daysInMonth; day += 1) {
          const dailyUnits = day === daysInMonth - 1
            ? round(estimatedUnits - assignedUnits)
            : round((estimatedUnits * weights[day]) / weightTotal)
          assignedUnits = round(assignedUnits + dailyUnits)
          readings.push({
            id: `bill-day-${String(billDaySequence++).padStart(6, '0')}`,
            billId,
            date: dateString(addDays(periodStartDate, day)),
            unitsConsumedKwh: dailyUnits,
            ...(day === 0
              ? {
                  hourlyReadings: Array.from({ length: 24 }, (_, hour) => ({
                    id: `bill-day-hour-${billDaySequence}-${String(hour).padStart(2, '0')}`,
                    hour: `${String(hour).padStart(2, '0')}:00`,
                    unitsConsumedKwh: round(dailyUnits / 24),
                  })),
                }
              : {}),
          })
        }

        const hourly = readings[0].hourlyReadings
        const hourlyAssigned = round(hourly.reduce((sum, entry) => sum + entry.unitsConsumedKwh, 0))
        hourly[hourly.length - 1].unitsConsumedKwh = round(
          hourly[hourly.length - 1].unitsConsumedKwh + readings[0].unitsConsumedKwh - hourlyAssigned,
        )
        billDays.push(...readings)
      }

      const status = billStatuses[
        (monthIndex + zoneCustomers.get(zone.id).indexOf(customer)) % billStatuses.length
      ]
      const dueAt = dateString(addDays(periodEndDate, 21))
      const bill = {
        id: billId,
        ownerId: customer.id,
        meterId: meter.id,
        zoneId: zone.id,
        periodStart,
        periodEnd,
        issuedAt: dateString(addDays(periodEndDate, 1)),
        dueAt,
        ...(status === 'paid' ? { paidAt: dueAt } : {}),
        amount: round(estimatedUnits * 7.5),
        currency: 'INR',
        unitsConsumedKwh: isFeatured
          ? round(readings.reduce((sum, reading) => sum + reading.unitsConsumedKwh, 0))
          : estimatedUnits,
        status,
      }
      bills.push(bill)
      billSequence += 1
    }
  }
}

const startDay = addDays(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())), -364)
const consumptionTotals = new Map()
const addConsumption = (scopeType, userId, zoneId, date, unitsKwh) => {
  const day = new Date(`${date}T00:00:00Z`)
  const monday = addDays(day, -((day.getUTCDay() + 6) % 7))
  const periodStarts = {
    day: date,
    week: dateString(monday),
    month: `${date.slice(0, 7)}-01`,
    year: `${date.slice(0, 4)}-01-01`,
  }

  for (const [period, periodStart] of Object.entries(periodStarts)) {
    const subjectId = userId ?? zoneId ?? 'enterprise'
    const key = `${scopeType}:${subjectId}:${period}:${periodStart}`
    const current = consumptionTotals.get(key) ?? {
      scopeType,
      userId,
      zoneId,
      period,
      periodStart,
      unitsKwh: 0,
    }
    current.unitsKwh += unitsKwh
    consumptionTotals.set(key, current)
  }
}

for (let offset = 0; offset < 365; offset += 1) {
  const date = dateString(addDays(startDay, offset))
  for (const zone of zoneDefinitions) {
    for (const customer of zoneCustomers.get(zone.id)) {
      const units = round(faker.number.float({ min: 4, max: 28, fractionDigits: 2 }))
      addConsumption('customer', customer.id, zone.id, date, units)
      addConsumption('zone', null, zone.id, date, units)
      addConsumption('enterprise', null, null, date, units)
    }
  }
}

for (const point of consumptionTotals.values()) {
  const periodDate = new Date(`${point.periodStart}T00:00:00Z`)
  let label = point.periodStart
  if (point.period === 'day') {
    label = new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(periodDate)
  } else if (point.period === 'week') {
    label = `Week of ${new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(periodDate)}`
  } else if (point.period === 'month') {
    label = new Intl.DateTimeFormat('en-IN', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(periodDate)
  } else {
    label = periodDate.getUTCFullYear().toString()
  }
  consumption.push({
    id: `cons-${point.scopeType}-${point.userId ?? point.zoneId ?? 'enterprise'}-${point.period}-${point.periodStart}`,
    scopeType: point.scopeType,
    userId: point.userId,
    zoneId: point.zoneId,
    period: point.period,
    periodStart: point.periodStart,
    label,
    unitsKwh: round(point.unitsKwh),
  })
}

for (const zone of zoneDefinitions) {
  const zoneMeters = meters.filter((meter) => meter.zoneId === zone.id)
  for (let index = 0; index < 6; index += 1) {
    const meter = faker.helpers.arrayElement(zoneMeters)
    alerts.push({
      id: `alert-${String(alerts.length + 1).padStart(3, '0')}`,
      userId: index % 2 === 0 ? meter.ownerId : null,
      zoneId: zone.id,
      meterId: meter.id,
      title: faker.helpers.arrayElement([
        'Unusually high consumption',
        'Meter reading delayed',
        'Voltage fluctuation detected',
        'Meter communication restored',
      ]),
      message: faker.lorem.sentence(),
      severity: faker.helpers.arrayElement(['info', 'warning', 'critical']),
      status: faker.helpers.arrayElement(['open', 'acknowledged', 'resolved']),
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
    })
  }
}

for (let index = 0; index < 20; index += 1) {
  const zone = zoneDefinitions[index % zoneDefinitions.length]
  const customer = zoneCustomers.get(zone.id)[index % 12]
  notifications.push({
    id: `notification-${String(index + 1).padStart(3, '0')}`,
    userId: customer.id,
    title: faker.helpers.arrayElement([
      'New bill available',
      'Consumption report updated',
      'Meter reading received',
      'Payment reminder',
    ]),
    message: faker.lorem.sentence(),
    createdAt: faker.date.recent({ days: 120 }).toISOString(),
    readAt: index % 3 === 0 ? null : faker.date.recent({ days: 60 }).toISOString(),
  })
}

for (let index = 0; index < 32; index += 1) {
  const zone = zoneDefinitions[index % zoneDefinitions.length]
  const customer = zoneCustomers.get(zone.id)[index % 12]
  const meter = customerMeters.get(customer.id)[0]
  auditLogs.push({
    id: `audit-${String(index + 1).padStart(4, '0')}`,
    userId: index % 4 === 0 ? enterpriseUser.id : customer.id,
    zoneId: index % 4 === 0 ? null : zone.id,
    action: faker.helpers.arrayElement(['view', 'export', 'acknowledge']),
    entityType: faker.helpers.arrayElement(['meter', 'bill', 'alert', 'consumption']),
    entityId: meter.id,
    details: faker.lorem.sentence(),
    createdAt: faker.date.recent({ days: 180 }).toISOString(),
  })
}

for (const zone of zoneDefinitions) {
  settings.push({
    id: `setting-alert-threshold-${zone.code.toLowerCase()}`,
    key: 'alert.dailyUsageThresholdKwh',
    value: faker.number.int({ min: 65, max: 100 }),
    scope: 'zone',
    userId: null,
    zoneId: zone.id,
  })
}

settings.push(
  {
    id: 'setting-consumption-unit',
    key: 'consumption.unit',
    value: 'kWh',
    scope: 'enterprise',
    userId: null,
    zoneId: null,
  },
  {
    id: 'setting-currency',
    key: 'billing.currency',
    value: 'INR',
    scope: 'enterprise',
    userId: null,
    zoneId: null,
  },
  {
    id: 'setting-tariff',
    key: 'billing.defaultRatePerKwh',
    value: 7.5,
    scope: 'enterprise',
    userId: null,
    zoneId: null,
  },
  {
    id: 'setting-timezone',
    key: 'enterprise.timezone',
    value: 'Asia/Kolkata',
    scope: 'enterprise',
    userId: null,
    zoneId: null,
  },
)

const db = {
  zones,
  users,
  meters,
  bills,
  billDays,
  consumption,
  alerts,
  notifications,
  auditLogs,
  settings,
}

await writeFile(fileURLToPath(new URL('../db.json', import.meta.url)), `${JSON.stringify(db, null, 2)}\n`)

const errors = []
const usersById = new Map(users.map((user) => [user.id, user]))
const zonesById = new Map(zones.map((zone) => [zone.id, zone]))
const metersById = new Map(meters.map((meter) => [meter.id, meter]))
const billsById = new Map(bills.map((bill) => [bill.id, bill]))

for (const zone of zoneDefinitions) {
  const zoneAdminCount = users.filter((user) => user.role === 'zoneAdmin' && user.zoneId === zone.id).length
  const customerCount = users.filter((user) => user.role === 'customer' && user.zoneId === zone.id).length
  if (zoneAdminCount !== 1) errors.push(`${zone.name} must have exactly one zone admin; found ${zoneAdminCount}.`)
  if (customerCount < 12) errors.push(`${zone.name} must have at least 12 customers; found ${customerCount}.`)
}

for (const meter of meters) {
  const owner = usersById.get(meter.ownerId)
  if (!owner) {
    errors.push(`Meter ${meter.id} references missing owner ${meter.ownerId}.`)
  } else if (owner.role !== 'customer') {
    errors.push(`Meter ${meter.id} owner ${owner.id} is not a customer.`)
  } else if (meter.zoneId !== owner.zoneId) {
    errors.push(`Meter ${meter.id} zone ${meter.zoneId} does not match owner ${owner.id} zone ${owner.zoneId}.`)
  }
  if (!zonesById.has(meter.zoneId)) errors.push(`Meter ${meter.id} references missing zone ${meter.zoneId}.`)
}

for (const customer of users.filter((user) => user.role === 'customer')) {
  const customerBills = bills.filter((bill) => bill.ownerId === customer.id)
  if (customerBills.length < 12) {
    errors.push(`Customer ${customer.id} must have 12 months of bills; found ${customerBills.length}.`)
  }
  for (const bill of customerBills) {
    const meter = metersById.get(bill.meterId)
    if (!meter) {
      errors.push(`Bill ${bill.id} references missing meter ${bill.meterId}.`)
    } else if (meter.ownerId !== bill.ownerId || meter.zoneId !== bill.zoneId) {
      errors.push(`Bill ${bill.id} owner/zone does not match meter ${meter.id}.`)
    }
  }
}

for (const billDay of billDays) {
  if (!billsById.has(billDay.billId)) errors.push(`Bill day ${billDay.id} references missing bill ${billDay.billId}.`)
}
for (const notification of notifications) {
  if (!usersById.has(notification.userId)) errors.push(`Notification ${notification.id} references missing user ${notification.userId}.`)
}
for (const alert of alerts) {
  if (!zonesById.has(alert.zoneId)) errors.push(`Alert ${alert.id} references missing zone ${alert.zoneId}.`)
  if (alert.userId !== null && !usersById.has(alert.userId)) errors.push(`Alert ${alert.id} references missing user ${alert.userId}.`)
  if (alert.meterId !== null && !metersById.has(alert.meterId)) errors.push(`Alert ${alert.id} references missing meter ${alert.meterId}.`)
}
for (const log of auditLogs) {
  if (!usersById.has(log.userId)) errors.push(`Audit log ${log.id} references missing user ${log.userId}.`)
  if (log.zoneId !== null && !zonesById.has(log.zoneId)) errors.push(`Audit log ${log.id} references missing zone ${log.zoneId}.`)
}
for (const setting of settings) {
  if (setting.scope === 'zone' && (!setting.zoneId || !zonesById.has(setting.zoneId))) {
    errors.push(`Zone setting ${setting.id} must reference an existing zone.`)
  }
}

const featuredBills = bills.filter((bill) => bill.ownerId === featuredCustomer.id)
for (const bill of featuredBills) {
  const expectedDays = new Date(`${bill.periodEnd}T00:00:00Z`).getUTCDate()
  const readings = billDays.filter((reading) => reading.billId === bill.id)
  if (readings.length !== expectedDays) {
    errors.push(`Featured customer bill ${bill.id} needs ${expectedDays} daily readings; found ${readings.length}.`)
  }
}
if (!billDays.some((reading) => (reading.hourlyReadings?.length ?? 0) >= 24)) {
  errors.push('At least one day must include 24 hourly readings.')
}
if (alerts.length < 20) errors.push(`At least 20 alerts are required; found ${alerts.length}.`)
if (notifications.length < 15) errors.push(`At least 15 notifications are required; found ${notifications.length}.`)
if (auditLogs.length < 30) errors.push(`At least 30 audit logs are required; found ${auditLogs.length}.`)
if (settings.filter((setting) => setting.scope === 'zone').length < 4) {
  errors.push('Each zone must have a zone-scoped alert threshold setting.')
}

if (errors.length > 0) {
  console.error(`Generated db.json with ${errors.length} validation error(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log(
    `Generated db.json: ${zones.length} zones, ${users.length} users, ${meters.length} meters, ` +
    `${bills.length} bills, ${billDays.length} daily readings, ${consumption.length} consumption points, ` +
    `${alerts.length} alerts, ${notifications.length} notifications, ${auditLogs.length} audit logs. ` +
    'All validation checks passed.',
  )
}

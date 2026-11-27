
import { useCallback, useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '../../shared/components/ChartCard'
import { EmptyState } from '../../shared/components/EmptyState'
import { Loader } from '../../shared/components/Loader'
import { PageHeader } from '../../shared/components/PageHeader'
import { StatCard } from '../../shared/components/StatCard'
import type { TimeRange } from '../../shared/components/TimeRangeToggle'
import type {
  ConsumptionPeriod,
  CustomerConsumptionPoint,
  Meter,
} from '../../shared/types'
import {
  getCustomerConsumption,
  getCustomerMeterData,
} from '../services/meterDataService'
import type { MeterDataResponse } from '../services/meterDataService'
import './MeterDataPage.css'

const periodMap: Record<TimeRange, ConsumptionPeriod> = {
  day: 'day',
  week: 'week',
  month: 'month',
  year: 'year',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
}

function formatNumber(value: number) {
  return value.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })
}

function meterStatusLabel(status: Meter['status']) {
  if (status === 'active') return 'Active'
  if (status === 'inactive') return 'Inactive'
  return 'Under maintenance'
}

function meterStatusClass(status: Meter['status']) {
  if (status === 'active') return 'meter-status--active'
  if (status === 'inactive') return 'meter-status--inactive'
  return 'meter-status--maintenance'
}

export default function MeterDataPage() {
  const [data, setData] = useState<MeterDataResponse | null>(null)
  const [selectedMeterId, setSelectedMeterId] = useState('')
  const [period, setPeriod] = useState<TimeRange>('month')
  const [consumption, setConsumption] =
    useState<CustomerConsumptionPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartError, setChartError] = useState<string | null>(null)

  const selectedMeter =
    data?.meters.find((meter) => meter.id === selectedMeterId) ??
    data?.meters[0] ??
    null

  const loadChart = useCallback(
    (userId: string, selectedPeriod: TimeRange) =>
      getCustomerConsumption(userId, periodMap[selectedPeriod]),
    [],
  )

  const loadMeters = useCallback(() => getCustomerMeterData(), [])

  useEffect(() => {
    let active = true

    void loadMeters()
      .then((result) => {
        if (active) {
          setData(result)
          setSelectedMeterId((current) =>
            result.meters.some((meter) => meter.id === current)
              ? current
              : result.meters[0]?.id ?? '',
          )
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load meter information.',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [loadMeters])

  useEffect(() => {
    if (!data) return

    let active = true

    void loadChart(data.customer.id, period)
      .then((result) => {
        if (active) setConsumption(result)
      })
      .catch((err: unknown) => {
        if (active) {
          setChartError(
            err instanceof Error
              ? err.message
              : 'Unable to load consumption history.',
          )
          setConsumption([])
        }
      })
      .finally(() => {
        if (active) setChartLoading(false)
      })

    return () => {
      active = false
    }
  }, [data, period, loadChart])

  if (loading) {
    return (
      <div className="meter-loading">
        <Loader label="Loading meter information..." size="large" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="meter-page">
        <PageHeader
          title="Meter Data"
          subtitle="View your electricity meter information and readings."
        />

        <div className="meter-error" role="alert">
          <h2>Unable to load meter data</h2>
          <p>{error ?? 'Meter information is unavailable.'}</p>
          <button
            className="ui-button ui-button--primary"
            type="button"
            onClick={() => {
              setLoading(true)
              setError(null)
              void loadMeters()
                .then((result) => {
                  setData(result)
                  setSelectedMeterId((current) =>
                    result.meters.some((meter) => meter.id === current)
                      ? current
                      : result.meters[0]?.id ?? '',
                  )
                })
                .catch((err: unknown) => {
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'Unable to load meter information.',
                  )
                })
                .finally(() => setLoading(false))
            }}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const activeMeters = data.meters.filter(
    (meter) => meter.status === 'active',
  ).length

  const maintenanceMeters = data.meters.filter(
    (meter) => meter.status === 'underMaintenance',
  ).length

  return (
    <div className="meter-page">
      <PageHeader
        title="Meter Data"
        subtitle="View your registered electricity meters and consumption history."
      />

      <section className="meter-summary">
        <StatCard
          label="Total Meters"
          value={data.meters.length}
          hint="Meters registered to your account"
        />

        <StatCard
          label="Active Meters"
          value={activeMeters}
          hint="Currently active"
        />

        <StatCard
          label="Under Maintenance"
          value={maintenanceMeters}
          hint="Requires maintenance"
        />

        <StatCard
          label="Zone"
          value={data.zone?.name ?? 'Not assigned'}
          hint="Your service zone"
        />
      </section>

      <section className="meter-main-card">
        <div className="meter-section-heading">
          <div>
            <h2>Your Registered Meters</h2>
            <p>Meter information linked to your customer account</p>
          </div>

          <span className="meter-count">
            {data.meters.length} meter(s)
          </span>
        </div>

        {data.meters.length > 0 ? (
          <>
            {data.meters.length > 1 && (
              <div className="meter-selector">
                <label htmlFor="meter-select">Select meter</label>
                <select
                  id="meter-select"
                  value={selectedMeter?.id ?? ''}
                  onChange={(event) =>
                    setSelectedMeterId(event.target.value)
                  }
                >
                  {data.meters.map((meter) => (
                    <option key={meter.id} value={meter.id}>
                      {meter.serialNumber} ({meter.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedMeter && (
              <div className="meter-detail-grid">
                <div className="meter-detail-item">
                  <span>Meter ID</span>
                  <strong>{selectedMeter.id}</strong>
                </div>

                <div className="meter-detail-item">
                  <span>Serial Number</span>
                  <strong>{selectedMeter.serialNumber}</strong>
                </div>

                <div className="meter-detail-item">
                  <span>Installation Date</span>
                  <strong>{formatDate(selectedMeter.installedAt)}</strong>
                </div>

                <div className="meter-detail-item">
                  <span>Meter Status</span>
                  <strong>
                    <span
                      className={`meter-status ${meterStatusClass(selectedMeter.status)}`}
                    >
                      {meterStatusLabel(selectedMeter.status)}
                    </span>
                  </strong>
                </div>

                <div className="meter-detail-item">
                  <span>Latest Recorded Meter Reading</span>
                  <strong>
                    {formatNumber(selectedMeter.latestReadingKwh)} kWh
                  </strong>
                </div>

                <div className="meter-detail-item">
                  <span>Customer</span>
                  <strong>{data.customer.name}</strong>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="No meters registered"
            description="There are currently no electricity meters linked to your account."
          />
        )}
      </section>

      <ChartCard
        title="Consumption History"
        subtitle="Your total customer account electricity consumption"
        timeRange={period}
        onTimeRangeChange={(nextPeriod) => {
          if (nextPeriod !== period) {
            setChartLoading(true)
            setChartError(null)
            setPeriod(nextPeriod)
          }
        }}
      >
        {chartLoading ? (
          <div className="meter-chart-message">
            <Loader label="Loading consumption history..." />
          </div>
        ) : chartError ? (
          <div className="meter-chart-message" role="alert">
            <p>{chartError}</p>
          </div>
        ) : consumption.length === 0 ? (
          <EmptyState
            title="No consumption data"
            description="No readings are available for the selected period."
          />
        ) : (
          <div className="meter-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={consumption}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="meterConsumptionFill"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="4 4"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                />

                <Tooltip
                  contentStyle={{
                    color: 'var(--color-text)',
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    borderRadius: 8,
                  }}
                  formatter={(value) => [
                    `${formatNumber(Number(value))} kWh`,
                    'Consumption',
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="unitsKwh"
                  name="Consumption"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  fill="url(#meterConsumptionFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <section className="meter-main-card meter-history-card">
        <div className="meter-section-heading">
          <div>
            <h2>Reading History</h2>
            <p>Recorded consumption for the selected period</p>
          </div>
        </div>

        {consumption.length > 0 ? (
          <div className="meter-history-table-wrapper">
            <table className="meter-history-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Start Date</th>
                  <th>Consumption</th>
                </tr>
              </thead>

              <tbody>
                {[...consumption].reverse().map((point) => (
                  <tr key={point.id}>
                    <td>{point.label}</td>
                    <td>{formatDate(point.periodStart)}</td>
                    <td className="meter-reading-value">
                      {formatNumber(point.unitsKwh)} kWh
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No reading history"
            description="Reading history will appear here when data is available."
          />
        )}
      </section>

      <div className="meter-readonly-note">
        <span>ⓘ</span>
        <p>
          Meter information and readings are displayed in read-only mode.
          Meter configuration cannot be changed in Phase 1.
        </p>
      </div>
    </div>
  )
}
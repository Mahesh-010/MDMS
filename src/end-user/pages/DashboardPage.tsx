import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { ChartCard } from '../../shared/components/ChartCard'
import { EmptyState } from '../../shared/components/EmptyState'
import { Loader } from '../../shared/components/Loader'
import { PageHeader } from '../../shared/components/PageHeader'
import { StatCard } from '../../shared/components/StatCard'
import type { TimeRange } from '../../shared/components/TimeRangeToggle'
import {
  getConsumptionSeries,
  getDashboardProfile,
  getDashboardSummary,
  getDashboardZone,
  getPrimaryMeter,
} from '../services/dashboardService'
import type { DashboardChartPoint, DashboardData } from '../types/dashboard'
import './DashboardPage.css'

const chartLimits: Record<TimeRange, number> = {
  day: 24,
  week: 12,
  month: 12,
  year: 5,
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}

function formatCurrency(value: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Date unavailable'

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [chartPeriod, setChartPeriod] = useState<TimeRange>('month')
  const [chartPoints, setChartPoints] = useState<DashboardChartPoint[]>([])
  const [chartLoading, setChartLoading] = useState(true)
  const [chartError, setChartError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const chartRequest = useRef(0)
  const chartPeriodRef = useRef<TimeRange>('month')

  const loadChart = useCallback(async (userId: string, period: TimeRange) => {
    const requestId = ++chartRequest.current
    setChartLoading(true)
    setChartError(null)

    try {
      const points = await getConsumptionSeries({
        userId,
        period,
        limit: chartLimits[period],
      })
      if (requestId === chartRequest.current) setChartPoints(points)
    } catch (error) {
      if (requestId === chartRequest.current) {
        setChartError(`Could not load consumption data: ${getErrorMessage(error)}`)
      }
    } finally {
      if (requestId === chartRequest.current) setChartLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setDashboardError(null)
      try {
        const profile = await getDashboardProfile()
        const [zone, meter, summary] = await Promise.all([
          getDashboardZone(profile.zoneId),
          getPrimaryMeter(profile.id),
          getDashboardSummary(profile.id),
        ])

        if (!active) return

        setDashboard({
          profile,
          zone,
          meter,
          summary,
          lastSyncedAt: new Date().toISOString(),
        })
        setDashboardLoading(false)
        void loadChart(profile.id, chartPeriodRef.current)
      } catch (error) {
        if (active) {
          setDashboardError(`Could not load your dashboard: ${getErrorMessage(error)}`)
          setDashboardLoading(false)
        }
      }
    }

    void loadDashboard()
    return () => {
      active = false
      chartRequest.current += 1
    }
  }, [loadChart, refreshKey])

  function handleRangeChange(period: TimeRange) {
    chartPeriodRef.current = period
    setChartPeriod(period)
    if (dashboard) void loadChart(dashboard.profile.id, period)
  }

  function handleRetry() {
    setDashboardLoading(true)
    setChartLoading(true)
    setRefreshKey((key) => key + 1)
  }

  if (dashboardLoading) {
    return (
      <div className="end-user-dashboard-loading">
        <Loader label="Loading your dashboard…" size="large" />
      </div>
    )
  }

  if (dashboardError || !dashboard) {
    return (
      <div className="end-user-dashboard">
        <PageHeader title="Dashboard" subtitle="Your electricity usage at a glance." />
        <div className="dashboard-error" role="alert">
          <p>{dashboardError ?? 'Dashboard data is not available.'}</p>
          <button className="ui-button ui-button--primary" onClick={handleRetry} type="button">
            Try again
          </button>
        </div>
      </div>
    )
  }

  const { profile, zone, meter, summary } = dashboard
  const bill = summary.currentMonthBill
  const lastPayment = summary.lastPayment

  return (
    <div className="end-user-dashboard">
      <PageHeader
        title="Dashboard"
        subtitle="Your electricity usage at a glance."
      />

      <section className="dashboard-welcome" aria-label="Welcome">
        <div className="dashboard-welcome-copy">
          <span className="dashboard-eyebrow">CUSTOMER OVERVIEW</span>
          <h2>Welcome back, {profile.name}</h2>
          <p>
            {new Intl.DateTimeFormat('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(new Date())}
          </p>
        </div>
        <div className="dashboard-welcome-meta">
          <span>
            <strong>Zone</strong>
            {zone?.name ?? 'Not assigned'}
          </span>
          <span>
            <strong>Meter</strong>
            {meter?.serialNumber ?? 'No meter assigned'}
          </span>
          <span>
            <strong>Last synced</strong>
            {formatTime(dashboard.lastSyncedAt)}
          </span>
        </div>
      </section>

      <section className="dashboard-stats" aria-label="Account summary">
        <StatCard
          label="Current consumption"
          value={
            summary.currentConsumptionKwh === null
              ? '—'
              : `${summary.currentConsumptionKwh.toLocaleString('en-IN')} kWh`
          }
          hint="Latest daily meter reading"
        />
        <StatCard
          label="This month's bill"
          value={bill ? formatCurrency(bill.amount, bill.currency) : 'Not issued'}
          hint={bill ? `Due ${formatDate(bill.dueAt)}` : 'No bill has been issued this month.'}
        />
        <StatCard
          label="Outstanding balance"
          value={formatCurrency(summary.outstandingBalance)}
          hint={`${summary.outstandingBillCount} unpaid bill${summary.outstandingBillCount === 1 ? '' : 's'}`}
        />
        <StatCard
          label="Last payment"
          value={lastPayment ? formatCurrency(lastPayment.amount, lastPayment.currency) : 'No payments'}
          hint={
            lastPayment?.paidAt
              ? `Paid ${formatDate(lastPayment.paidAt)}`
              : 'Payment date is not recorded.'
          }
        />
      </section>

      <ChartCard
        title="Consumption"
        subtitle="Energy used over time"
        timeRange={chartPeriod}
        onTimeRangeChange={handleRangeChange}
      >
        {chartLoading ? (
          <div className="dashboard-chart-message">
            <Loader label="Loading consumption…" />
          </div>
        ) : chartError ? (
          <div className="dashboard-chart-message" role="alert">
            <p>{chartError}</p>
          </div>
        ) : chartPoints.length === 0 ? (
          <EmptyState
            title="No consumption data"
            description="There are no readings available for this time range."
          />
        ) : (
          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPoints} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="consumptionFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  tickLine={false}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    color: 'var(--color-text)',
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    borderRadius: 8,
                  }}
                  formatter={(value) => [`${Number(value).toLocaleString('en-IN')} kWh`, 'Consumption']}
                />
                <Area
                  type="monotone"
                  dataKey="unitsKwh"
                  name="Consumption"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  fill="url(#consumptionFill)"
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <section className="dashboard-quick-actions" aria-labelledby="quick-actions-title">
        <div className="dashboard-section-heading">
          <div>
            <h2 id="quick-actions-title">Quick actions</h2>
            <p>Common tasks for your account</p>
          </div>
        </div>
        <div className="dashboard-actions-grid">
          <Link className="dashboard-action" to="/user/bills">
            <span className="dashboard-action-icon" aria-hidden="true">₹</span>
            <span><strong>View bills</strong><small>Check your latest bill and due date</small></span>
            <span className="dashboard-action-arrow" aria-hidden="true">→</span>
          </Link>
          <Link className="dashboard-action" to="/user/bills?view=history">
            <span className="dashboard-action-icon" aria-hidden="true">▤</span>
            <span><strong>Bill history</strong><small>Browse previous bills and payments</small></span>
            <span className="dashboard-action-arrow" aria-hidden="true">→</span>
          </Link>
          <Link className="dashboard-action" to="/user/meter-data">
            <span className="dashboard-action-icon" aria-hidden="true">⌁</span>
            <span><strong>Meter data</strong><small>Review your consumption readings</small></span>
            <span className="dashboard-action-arrow" aria-hidden="true">→</span>
          </Link>
          <Link className="dashboard-action" to="/user/settings">
            <span className="dashboard-action-icon" aria-hidden="true">⚙</span>
            <span><strong>Notification settings</strong><small>Manage your notification preferences</small></span>
            <span className="dashboard-action-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  )
}

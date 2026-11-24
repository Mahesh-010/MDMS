import { useEffect, useState } from 'react'
import { DashboardCard } from '../components/DashboardCard'
import { ConsumptionChart } from '../components/ConsumptionChart'
import { DataStatus } from '../components/DataStatus'
import {
  getDailyConsumption,
  getDashboardUser,
  getMonthlyConsumption,
  getWeeklyConsumption,
} from '../services/dashboardService'
import type {
  DailyConsumption,
  MonthlyConsumption,
  User,
  WeeklyConsumption,
} from '../types/dashboard'
import '../styles/Dashboard.css'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [dailyData, setDailyData] = useState<DailyConsumption[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyConsumption[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyConsumption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      setIsLoading(true)
      setError(null)

      try {
        const dashboardUser = await getDashboardUser()
        const [daily, weekly, monthly] = await Promise.all([
          getDailyConsumption(dashboardUser.id),
          getWeeklyConsumption(dashboardUser.id),
          getMonthlyConsumption(dashboardUser.id),
        ])

        if (isMounted) {
          setUser(dashboardUser)
          setDailyData(daily)
          setWeeklyData(weekly)
          setMonthlyData(monthly)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load dashboard data.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const latestMonth = monthlyData.at(-1)
  const previousMonth = monthlyData.at(-2)
  const recentDailyData = [...dailyData]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 5)
  const chartData = [...dailyData]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((item) => ({
      id: item.id,
      label: new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${item.date}T00:00:00Z`)),
      units: item.units,
    }))

  return (
    <main className="dashboard-page">
      <DataStatus
        isLoading={isLoading}
        error={error}
        isEmpty={!user && !isLoading && !error}
        emptyMessage="No end-user information is available."
      >
        <header className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">Consumer overview</p>
            <h1>Welcome back, {user?.name ?? 'Customer'}</h1>
            <p className="dashboard-intro">
              Here is a summary of your electricity consumption.
            </p>
          </div>
          <span className="welcome-icon" aria-hidden="true">kWh</span>
        </header>

        <div className="dashboard-summary-grid">
          <DashboardCard title="Total consumption" className="summary-card">
            <p className="metric-value">
              {latestMonth ? `${latestMonth.units.toFixed(1)} kWh` : '—'}
            </p>
            <p className="metric-caption">
              {latestMonth ? `Latest available month · ${latestMonth.month}` : 'Monthly data unavailable'}
            </p>
          </DashboardCard>

          <DashboardCard title="Current bill amount" className="summary-card">
            <p className="metric-value metric-unavailable">Unavailable</p>
            <p className="metric-caption">Bill data is not provided by the current API.</p>
          </DashboardCard>

          <DashboardCard title="Previous month consumption" className="summary-card">
            <p className="metric-value">
              {previousMonth ? `${previousMonth.units.toFixed(1)} kWh` : '—'}
            </p>
            <p className="metric-caption">
              {previousMonth ? previousMonth.month : 'Previous month data unavailable'}
            </p>
          </DashboardCard>

          <DashboardCard title="Meter status" className="summary-card">
            <p className="metric-value metric-unavailable">Unavailable</p>
            <p className="metric-caption">Meter status is not provided by the current API.</p>
          </DashboardCard>
        </div>

        <div className="dashboard-content-grid">
          <DashboardCard title="Recent electricity consumption" className="chart-card">
            <p className="section-description">
              Daily usage from the available meter-data records.
            </p>
            <ConsumptionChart data={chartData} />
          </DashboardCard>

          <DashboardCard title="Consumption summary" className="summary-list-card">
            <h3>Weekly</h3>
            {weeklyData.length > 0 ? (
              <div className="dashboard-list">
                {weeklyData.map((item) => (
                  <div className="compact-list-row" key={item.id}>
                    <span>{item.week}</span>
                    <strong>{item.units.toFixed(1)} kWh</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dashboard-empty">Weekly consumption is unavailable.</p>
            )}

            <h3>Monthly</h3>
            {monthlyData.length > 0 ? (
              <div className="dashboard-list">
                {monthlyData.map((item) => (
                  <div className="compact-list-row" key={item.id}>
                    <span>{item.month}</span>
                    <strong>{item.units.toFixed(1)} kWh</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dashboard-empty">Monthly consumption is unavailable.</p>
            )}
          </DashboardCard>
        </div>

        <DashboardCard title="Recent meter data">
          <p className="section-description">
            The current API provides daily consumption, not cumulative meter readings.
          </p>
          {recentDailyData.length > 0 ? (
            <div className="dashboard-list">
              {recentDailyData.map((item) => (
                <div className="compact-list-row" key={item.id}>
                  <span>{item.date}</span>
                  <strong>{item.units.toFixed(1)} kWh consumed</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">Daily consumption records are unavailable.</p>
          )}
        </DashboardCard>

        <DashboardCard title="Quick links" className="quick-links-card">
          <p className="dashboard-empty">
            Bills, Meter Data, Alerts, and Profile links will be added when their
            destinations are agreed with the routing owner.
          </p>
        </DashboardCard>
      </DataStatus>
    </main>
  )
}

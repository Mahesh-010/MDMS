import type { ConsumptionChartPoint } from '../types/dashboard'

interface ConsumptionChartProps {
  data: ConsumptionChartPoint[]
}

export function ConsumptionChart({ data }: ConsumptionChartProps) {
  if (data.length === 0) {
    return <p className="dashboard-empty">Monthly consumption data is unavailable.</p>
  }

  const maximum = Math.max(...data.map((item) => item.units), 1)

  return (
    <div className="consumption-chart" role="img" aria-label="Electricity consumption chart">
      {data.map((item) => (
        <div className="chart-column" key={item.id}>
          <span className="chart-value">{item.units} kWh</span>
          <div className="chart-track">
            <div
              className="chart-bar"
              style={{ height: `${Math.max((item.units / maximum) * 100, 8)}%` }}
            />
          </div>
          <span className="chart-label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

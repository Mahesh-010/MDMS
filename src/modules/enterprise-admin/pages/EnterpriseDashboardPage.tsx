import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "../../../shared/components/PageHeader";
import { StatCard } from "../../../shared/components/StatCard";
import { Loader } from "../../../shared/components/Loader";
import {
  calculateEnterpriseSummary,
  calculateZonePerformance,
  getEnterpriseDashboardData,
} from "../services/enterpriseDashboardService";
import type {
  EnterpriseDashboardData,
  EnterpriseDashboardSummary,
  ZonePerformance,
} from "../types/enterpriseDashboard";
import "./EnterpriseDashboardPage.css";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

export default function EnterpriseDashboardPage() {
  const [data, setData] = useState<EnterpriseDashboardData | null>(null);
  const [summary, setSummary] = useState<EnterpriseDashboardSummary | null>(
    null,
  );
  const [zonePerformance, setZonePerformance] = useState<ZonePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const result = await getEnterpriseDashboardData();

        if (!active) return;

        setData(result);
        setSummary(calculateEnterpriseSummary(result));
        setZonePerformance(calculateZonePerformance(result));
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="enterprise-dashboard-loading">
        <Loader label="Loading enterprise dashboard..." size="large" />
      </div>
    );
  }

  if (error || !data || !summary) {
    return (
      <div className="enterprise-dashboard">
        <PageHeader
          title="Enterprise Dashboard"
          subtitle="System-wide overview and performance."
        />
        <div className="enterprise-dashboard-error" role="alert">
          <h2>Unable to load dashboard</h2>
          <p>{error ?? "Dashboard data is unavailable."}</p>
          <button
            type="button"
            className="ui-button ui-button--primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const meterStatusData = [
    { name: "Active", value: summary.activeMeters },
    { name: "Inactive", value: summary.inactiveMeters },
    { name: "Maintenance", value: summary.maintenanceMeters },
  ];

  const billingData = [
    {
      name: "Pending",
      value: summary.pendingBills,
    },
    {
      name: "Overdue",
      value: summary.overdueBills,
    },
  ];

  return (
    <div className="enterprise-dashboard">
      <PageHeader
        title="Enterprise Dashboard"
        subtitle="Monitor system-wide operations, zones, meters and customer activity."
      />

      <section className="enterprise-dashboard-welcome">
        <div>
          <span className="enterprise-dashboard-eyebrow">
            ENTERPRISE OVERVIEW
          </span>
          <h2>System performance at a glance</h2>
          <p>A consolidated view of your MDMS operations across all zones.</p>
        </div>
        <div className="enterprise-dashboard-date">
          <span>Last refreshed</span>
          <strong>
            {new Intl.DateTimeFormat("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date())}
          </strong>
        </div>
      </section>

      <section className="enterprise-dashboard-stats">
        <StatCard
          label="Total zones"
          value={formatNumber(summary.totalZones)}
          hint={`${summary.activeZones} active zones`}
        />
        <StatCard
          label="Registered customers"
          value={formatNumber(summary.totalCustomers)}
          hint="Across all zones"
        />
        <StatCard
          label="Total meters"
          value={formatNumber(summary.totalMeters)}
          hint={`${formatNumber(summary.activeMeters)} active meters`}
        />
        <StatCard
          label="Latest total consumption"
          value={`${formatNumber(summary.totalConsumption)} kWh`}
          hint="Latest enterprise-level reading"
        />
      </section>

      <section className="enterprise-dashboard-grid">
        <article className="enterprise-panel">
          <div className="enterprise-panel-heading">
            <div>
              <h2>Zone-wise performance</h2>
              <p>Monthly consumption by zone</p>
            </div>
          </div>

          {zonePerformance.length === 0 ? (
            <div className="enterprise-empty">No zone records available.</div>
          ) : (
            <div className="enterprise-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={zonePerformance}
                  margin={{ top: 10, right: 12, left: 0, bottom: 8 }}
                >
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="zoneName"
                    tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                      borderRadius: 8,
                      color: "var(--color-text)",
                    }}
                    formatter={(value) => [
                      `${formatNumber(Number(value))} kWh`,
                      "Consumption",
                    ]}
                  />
                  <Bar
                    dataKey="consumption"
                    name="Consumption"
                    fill="var(--color-primary)"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="enterprise-panel">
          <div className="enterprise-panel-heading">
            <div>
              <h2>Meter status</h2>
              <p>Distribution of registered meters</p>
            </div>
          </div>

          {summary.totalMeters === 0 ? (
            <div className="enterprise-empty">No meter records available.</div>
          ) : (
            <>
              <div className="enterprise-pie-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={meterStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                    >
                      {meterStatusData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.name === "Active"
                              ? "#16a34a"
                              : entry.name === "Inactive"
                                ? "#d97706"
                                : "#64748b"
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="enterprise-pie-total">
                  <strong>{formatNumber(summary.totalMeters)}</strong>
                  <span>Total meters</span>
                </div>
              </div>

              <div className="enterprise-legend">
                {meterStatusData.map((item) => (
                  <div key={item.name} className="enterprise-legend-item">
                    <span
                      className={`enterprise-legend-dot enterprise-legend-dot--${item.name.toLowerCase()}`}
                    />
                    <span>{item.name}</span>
                    <strong>{formatNumber(item.value)}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
      </section>

      <section className="enterprise-dashboard-bottom">
        <article className="enterprise-panel">
          <div className="enterprise-panel-heading">
            <div>
              <h2>Billing overview</h2>
              <p>Outstanding bill status</p>
            </div>
          </div>

          <div className="enterprise-overview-list">
            {billingData.map((item) => (
              <div className="enterprise-overview-row" key={item.name}>
                <span>{item.name} bills</span>
                <strong>{formatNumber(item.value)}</strong>
              </div>
            ))}
            <div className="enterprise-overview-row enterprise-overview-total">
              <span>Total outstanding bills</span>
              <strong>
                {formatNumber(summary.pendingBills + summary.overdueBills)}
              </strong>
            </div>
          </div>
        </article>

        <article className="enterprise-panel">
          <div className="enterprise-panel-heading">
            <div>
              <h2>Alert overview</h2>
              <p>Current system alerts</p>
            </div>
          </div>

          <div className="enterprise-alert-summary">
            <div>
              <span className="enterprise-alert-number">
                {formatNumber(summary.openAlerts)}
              </span>
              <span>Open alerts</span>
            </div>
            <div className="enterprise-alert-critical">
              <span className="enterprise-alert-number">
                {formatNumber(summary.criticalAlerts)}
              </span>
              <span>Critical alerts</span>
            </div>
          </div>
        </article>
      </section>

      <section className="enterprise-panel enterprise-zone-table">
        <div className="enterprise-panel-heading">
          <div>
            <h2>Zone summary</h2>
            <p>Customer and meter distribution across zones</p>
          </div>
          <a className="enterprise-text-link" href="/enterprise/zones">
            Manage zones →
          </a>
        </div>

        <div className="enterprise-table-wrapper">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Zone</th>
                <th>Customers</th>
                <th>Meters</th>
                <th>Monthly consumption</th>
              </tr>
            </thead>
            <tbody>
              {zonePerformance.map((zone) => (
                <tr key={zone.zoneId}>
                  <td>{zone.zoneName}</td>
                  <td>{formatNumber(zone.customers)}</td>
                  <td>{formatNumber(zone.meters)}</td>
                  <td>{formatNumber(zone.consumption)} kWh</td>
                </tr>
              ))}
              {zonePerformance.length === 0 && (
                <tr>
                  <td colSpan={4}>No zones found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

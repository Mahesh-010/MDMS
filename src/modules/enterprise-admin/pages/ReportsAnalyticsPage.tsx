
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "../../../shared/components/PageHeader";
import { StatCard } from "../../../shared/components/StatCard";
import type { ConsumptionPointRecord } from "../../../shared/types";
import {
  getReportsData,
  type ReportsData,
} from "../services/enterpriseOperationsService";
import "./EnterpriseOperations.css";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ReportsAnalyticsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"month" | "year">("month");

  const loadData = useCallback(() => getReportsData(), []);

  useEffect(() => {
    let active = true;

    void loadData()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load reports.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadData]);

  const report = useMemo(() => {
    if (!data) return null;

    const enterprisePoints = data.consumption
      .filter(
        (point) =>
          point.scopeType === "enterprise" && point.period === period,
      )
      .sort((a, b) => a.periodStart.localeCompare(b.periodStart));

    const latestPoints = enterprisePoints.slice(-12);

    const zoneTotals = data.zones.map((zone) => {
      const units = data.consumption
        .filter(
          (point) =>
            point.scopeType === "zone" &&
            point.zoneId === zone.id &&
            point.period === period,
        )
        .reduce((sum, point) => sum + point.unitsKwh, 0);

      return { name: zone.name, units };
    });

    const maxZoneUnits = Math.max(
      1,
      ...zoneTotals.map((zone) => zone.units),
    );

    const paidBills = data.bills.filter((bill) => bill.status === "paid");
    const pendingBills = data.bills.filter(
      (bill) => bill.status === "pending",
    );
    const overdueBills = data.bills.filter(
      (bill) => bill.status === "overdue",
    );

    return {
      latestPoints,
      zoneTotals,
      maxZoneUnits,
      totalUnits: latestPoints.reduce(
        (sum, point) => sum + point.unitsKwh,
        0,
      ),
      totalBilled: data.bills.reduce((sum, bill) => sum + bill.amount, 0),
      paidAmount: paidBills.reduce((sum, bill) => sum + bill.amount, 0),
      pendingAmount: pendingBills.reduce(
        (sum, bill) => sum + bill.amount,
        0,
      ),
      overdueAmount: overdueBills.reduce(
        (sum, bill) => sum + bill.amount,
        0,
      ),
      paidCount: paidBills.length,
      pendingCount: pendingBills.length,
      overdueCount: overdueBills.length,
    };
  }, [data, period]);

  return (
    <div className="enterprise-operations">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Monitor enterprise-wide electricity consumption and billing performance."
      />

      {error && (
        <div className="enterprise-message enterprise-message--error">
          {error}
          <button
            type="button"
            className="enterprise-small-button"
            onClick={() => {
              setLoading(true);
              setError(null);
              void loadData()
                .then(setData)
                .catch((err: unknown) => {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Unable to load reports.",
                  );
                })
                .finally(() => setLoading(false));
            }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="enterprise-state">Loading enterprise reports...</div>
      ) : !report ? (
        <div className="enterprise-state">Report data is unavailable.</div>
      ) : (
        <>
          <section className="enterprise-stats">
            <StatCard
              label="Total consumption"
              value={`${formatNumber(report.totalUnits)} kWh`}
              hint={`Based on latest ${period} records`}
            />
            <StatCard
              label="Total billed"
              value={formatCurrency(report.totalBilled)}
              hint={`${data?.bills.length ?? 0} billing records`}
            />
            <StatCard
              label="Paid amount"
              value={formatCurrency(report.paidAmount)}
              hint={`${report.paidCount} paid bills`}
            />
            <StatCard
              label="Outstanding amount"
              value={formatCurrency(
                report.pendingAmount + report.overdueAmount,
              )}
              hint={`${report.pendingCount + report.overdueCount} unpaid bills`}
            />
          </section>

          <section className="enterprise-panel">
            <div className="enterprise-panel-heading">
              <div>
                <h2>Enterprise consumption trend</h2>
                <p>Consumption recorded across the enterprise</p>
              </div>

              <select
                aria-label="Consumption period"
                value={period}
                onChange={(event) =>
                  setPeriod(event.target.value as "month" | "year")
                }
              >
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>

            {report.latestPoints.length === 0 ? (
              <div className="enterprise-state">
                No consumption records available for this period.
              </div>
            ) : (
              <div className="enterprise-chart">
                {report.latestPoints.map((point: ConsumptionPointRecord) => {
                  const max = Math.max(
                    1,
                    ...report.latestPoints.map((item) => item.unitsKwh),
                  );
                  const height = (point.unitsKwh / max) * 100;

                  return (
                    <div className="enterprise-chart-column" key={point.id}>
                      <span className="enterprise-chart-value">
                        {formatNumber(point.unitsKwh)}
                      </span>
                      <div className="enterprise-chart-track">
                        <div
                          className="enterprise-chart-bar"
                          style={{ height: `${height}%` }}
                          title={`${point.label}: ${formatNumber(point.unitsKwh)} kWh`}
                        />
                      </div>
                      <span className="enterprise-chart-label">
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="enterprise-panel">
            <div className="enterprise-panel-heading">
              <div>
                <h2>Zone-wise consumption</h2>
                <p>Comparison using available {period} zone records</p>
              </div>
            </div>

            {report.zoneTotals.length === 0 ? (
              <div className="enterprise-state">No zone data available.</div>
            ) : (
              <div className="enterprise-zone-bars">
                {report.zoneTotals.map((zone) => (
                  <div className="enterprise-zone-bar-row" key={zone.name}>
                    <strong>{zone.name}</strong>
                    <div className="enterprise-zone-bar-track">
                      <div
                        className="enterprise-zone-bar-fill"
                        style={{
                          width: `${(zone.units / report.maxZoneUnits) * 100}%`,
                        }}
                      />
                    </div>
                    <span>{formatNumber(zone.units)} kWh</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="enterprise-panel">
            <div className="enterprise-panel-heading">
              <div>
                <h2>Billing overview</h2>
                <p>Distribution of generated bills by payment status</p>
              </div>
            </div>

            <div className="enterprise-stats">
              <StatCard
                label="Paid bills"
                value={report.paidCount}
                hint={formatCurrency(report.paidAmount)}
              />
              <StatCard
                label="Pending bills"
                value={report.pendingCount}
                hint={formatCurrency(report.pendingAmount)}
              />
              <StatCard
                label="Overdue bills"
                value={report.overdueCount}
                hint={formatCurrency(report.overdueAmount)}
              />
              <StatCard
                label="Total bills"
                value={data?.bills.length ?? 0}
                hint={formatCurrency(report.totalBilled)}
              />
            </div>
          </section>

          <p className="enterprise-muted">
            Reports are calculated from the records currently stored in
            JSON Server. They are not live utility-company financial reports.
          </p>
        </>
      )}
    </div>
  );
}

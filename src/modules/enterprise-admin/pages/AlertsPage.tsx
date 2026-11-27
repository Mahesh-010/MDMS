import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "../../../shared/components/PageHeader";
import { StatCard } from "../../../shared/components/StatCard";
import type { Alert, AlertStatus } from "../../../shared/types";
import {
  getEnterpriseAlerts,
  updateAlertStatus,
} from "../services/enterpriseOperationsService";
import "./EnterpriseOperations.css";

type StatusFilter = "all" | AlertStatus;
type SeverityFilter = "all" | Alert["severity"];

function dateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Invalid date" : date.toLocaleString();
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [search, setSearch] = useState("");

  const loadAlerts = useCallback(() => getEnterpriseAlerts(), []);

  useEffect(() => {
    let active = true;

    void loadAlerts()
      .then((result) => {
        if (active) setAlerts(result);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load alerts.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadAlerts]);

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return alerts
      .filter((alert) => {
        const matchesSearch =
          !query ||
          alert.title.toLowerCase().includes(query) ||
          alert.message.toLowerCase().includes(query) ||
          alert.id.toLowerCase().includes(query) ||
          alert.zoneId.toLowerCase().includes(query);

        return (
          matchesSearch &&
          (statusFilter === "all" || alert.status === statusFilter) &&
          (severityFilter === "all" || alert.severity === severityFilter)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [alerts, search, statusFilter, severityFilter]);

  async function changeStatus(alert: Alert, status: AlertStatus) {
    setSavingId(alert.id);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateAlertStatus(alert.id, status);
      setAlerts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSuccess(`Alert ${alert.id} marked as ${status}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update alert.");
    } finally {
      setSavingId(null);
    }
  }

  const openCount = alerts.filter((item) => item.status === "open").length;
  const acknowledgedCount = alerts.filter(
    (item) => item.status === "acknowledged",
  ).length;
  const criticalCount = alerts.filter(
    (item) => item.severity === "critical" && item.status !== "resolved",
  ).length;

  return (
    <div className="enterprise-operations">
      <PageHeader
        title="Enterprise Alerts"
        subtitle="Monitor and manage alerts generated across all distribution zones."
        actions={[
          {
            label: "Refresh",
            variant: "secondary",
            onClick: () => {
              setLoading(true);
              setError(null);
              void loadAlerts()
                .then(setAlerts)
                .catch((err: unknown) => {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Unable to load alerts.",
                  );
                })
                .finally(() => setLoading(false));
            },
          },
        ]}
      />

      {error && (
        <div className="enterprise-message enterprise-message--error">
          {error}
        </div>
      )}
      {success && (
        <div className="enterprise-message enterprise-message--success">
          {success}
        </div>
      )}

      <section className="enterprise-stats">
        <StatCard label="Total alerts" value={alerts.length} />
        <StatCard label="Open alerts" value={openCount} />
        <StatCard label="Acknowledged" value={acknowledgedCount} />
        <StatCard label="Unresolved critical" value={criticalCount} />
      </section>

      <section className="enterprise-panel">
        <div className="enterprise-panel-heading">
          <div>
            <h2>All alerts</h2>
            <p>Review alert details and update their status.</p>
          </div>
        </div>

        <div className="enterprise-toolbar">
          <input
            type="search"
            placeholder="Search title, message, ID or zone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search alerts"
          />

          <select
            value={severityFilter}
            onChange={(event) =>
              setSeverityFilter(event.target.value as SeverityFilter)
            }
            aria-label="Filter by severity"
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {loading ? (
          <div className="enterprise-state">Loading alerts...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="enterprise-state">
            <strong>No alerts found</strong>
            <span>Try changing your filters or search.</span>
          </div>
        ) : (
          <div className="enterprise-table-wrap">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Alert</th>
                  <th>Zone</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      <strong>{alert.title}</strong>
                      <div className="enterprise-muted">{alert.message}</div>
                      <small className="enterprise-muted">{alert.id}</small>
                    </td>
                    <td>{alert.zoneId}</td>
                    <td>
                      <span
                        className={`enterprise-pill ${
                          alert.severity === "critical"
                            ? "enterprise-pill--danger"
                            : alert.severity === "warning"
                              ? "enterprise-pill--warning"
                              : "enterprise-pill--info"
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`enterprise-pill ${
                          alert.status === "resolved"
                            ? "enterprise-pill--success"
                            : alert.status === "acknowledged"
                              ? "enterprise-pill--info"
                              : "enterprise-pill--warning"
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>
                    <td>{dateTime(alert.createdAt)}</td>
                    <td>
                      <div className="enterprise-actions">
                        {alert.status === "open" && (
                          <button
                            className="enterprise-small-button"
                            type="button"
                            disabled={savingId === alert.id}
                            onClick={() =>
                              void changeStatus(alert, "acknowledged")
                            }
                          >
                            Acknowledge
                          </button>
                        )}

                        {alert.status !== "resolved" && (
                          <button
                            className="enterprise-small-button"
                            type="button"
                            disabled={savingId === alert.id}
                            onClick={() => void changeStatus(alert, "resolved")}
                          >
                            Resolve
                          </button>
                        )}

                        {savingId === alert.id && (
                          <span className="enterprise-muted">Saving...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="enterprise-muted">
          Showing {filteredAlerts.length} of {alerts.length} alerts.
        </p>
      </section>
    </div>
  );
}

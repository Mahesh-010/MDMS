import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../shared/components/EmptyState";
import { Loader } from "../../shared/components/Loader";
import { PageHeader } from "../../shared/components/PageHeader";
import { StatCard } from "../../shared/components/StatCard";
import type {
  Alert,
  AlertSeverity,
  AlertStatus,
  Notification,
} from "../../shared/types";
import { getCustomerAlerts } from "../services/alertsService";
import type { CustomerAlertsData } from "../services/alertsService";
import "./AlertsPage.css";

type ActiveTab = "alerts" | "notifications";
type SeverityFilter = "all" | AlertSeverity;
type StatusFilter = "all" | AlertStatus;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function severityLabel(severity: AlertSeverity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function statusLabel(status: AlertStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function severityClass(severity: AlertSeverity) {
  return `alert-severity--${severity}`;
}

function statusClass(status: AlertStatus) {
  return `alert-status--${status}`;
}

const EMPTY_ALERTS: Alert[] = [];
const EMPTY_NOTIFICATIONS: Notification[] = [];

export default function AlertsPage() {
  const [data, setData] = useState<CustomerAlertsData | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("alerts");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      const response = await getCustomerAlerts();
      setData(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load alerts and notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const alerts = data?.alerts ?? EMPTY_ALERTS;
  const notifications = data?.notifications ?? EMPTY_NOTIFICATIONS;

  const openCount = alerts.filter((alert) => alert.status === "open").length;

  const criticalCount = alerts.filter(
    (alert) => alert.severity === "critical",
  ).length;

  const warningCount = alerts.filter(
    (alert) => alert.severity === "warning",
  ).length;

  const unreadCount = notifications.filter(
    (notification) => notification.readAt === null,
  ).length;

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSeverity =
        severityFilter === "all" || alert.severity === severityFilter;

      const matchesStatus =
        statusFilter === "all" || alert.status === statusFilter;

      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        [alert.id, alert.title, alert.message, alert.meterId ?? ""].some(
          (value) => value.toLowerCase().includes(query),
        );

      return matchesSeverity && matchesStatus && matchesSearch;
    });
  }, [alerts, severityFilter, statusFilter, search]);

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      return (
        !query ||
        [notification.id, notification.title, notification.message].some(
          (value) => value.toLowerCase().includes(query),
        )
      );
    });
  }, [notifications, search]);

  if (loading) {
    return (
      <div className="alerts-loading">
        <Loader label="Loading alerts and notifications..." size="large" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="alerts-page">
        <PageHeader
          title="Alerts"
          subtitle="Stay informed about your electricity service."
        />

        <div className="alerts-error" role="alert">
          <h2>Unable to load alerts</h2>
          <p>{error ?? "Alert information is unavailable."}</p>

          <button
            className="ui-button ui-button--primary"
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              void loadAlerts();
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-page">
      <PageHeader
        title="Alerts & Notifications"
        subtitle={`Important updates about your electricity service, ${data.customer.name}.`}
      />

      <section className="alerts-summary">
        <StatCard
          label="Total Alerts"
          value={alerts.length}
          hint="Alerts for your account and zone"
        />

        <StatCard
          label="Open Alerts"
          value={openCount}
          hint="Awaiting resolution"
        />

        <StatCard
          label="Critical Alerts"
          value={criticalCount}
          hint="High-priority alerts"
        />

        <StatCard
          label="Unread Notifications"
          value={unreadCount}
          hint={`${warningCount} warning alert(s)`}
        />
      </section>

      <section className="alerts-main-card">
        <div className="alerts-heading">
          <div>
            <h2>Updates Centre</h2>
            <p>Review alerts and account notifications</p>
          </div>

          <span className="alerts-zone-label">
            {data.customer.zoneId ?? "No zone"}
          </span>
        </div>

        <div className="alerts-tabs" role="tablist" aria-label="Update type">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "alerts"}
            className={activeTab === "alerts" ? "is-active" : ""}
            onClick={() => setActiveTab("alerts")}
          >
            Alerts
            <span>{alerts.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "notifications"}
            className={activeTab === "notifications" ? "is-active" : ""}
            onClick={() => setActiveTab("notifications")}
          >
            Notifications
            <span>{notifications.length}</span>
            {unreadCount > 0 && (
              <span className="alerts-unread-count">{unreadCount} new</span>
            )}
          </button>
        </div>

        <div className="alerts-toolbar">
          <div className="alerts-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder={
                activeTab === "alerts"
                  ? "Search alerts, meter IDs..."
                  : "Search notifications..."
              }
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search updates"
            />
          </div>

          {activeTab === "alerts" && (
            <div className="alerts-filters">
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
                aria-label="Filter by alert status"
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          )}
        </div>

        {activeTab === "alerts" ? (
          <div className="alerts-list" role="tabpanel">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert: Alert) => (
                <article className="alert-item" key={alert.id}>
                  <div
                    className={`alert-severity-indicator ${severityClass(alert.severity)}`}
                    aria-hidden="true"
                  />

                  <div className="alert-item-content">
                    <div className="alert-item-heading">
                      <div>
                        <span
                          className={`alert-severity ${severityClass(alert.severity)}`}
                        >
                          {severityLabel(alert.severity)}
                        </span>

                        <h3>{alert.title}</h3>
                      </div>

                      <span
                        className={`alert-status ${statusClass(alert.status)}`}
                      >
                        {statusLabel(alert.status)}
                      </span>
                    </div>

                    <p>{alert.message}</p>

                    <div className="alert-item-meta">
                      <span>Alert ID: {alert.id}</span>

                      {alert.meterId && <span>Meter: {alert.meterId}</span>}

                      <span>{formatDate(alert.createdAt)}</span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                title="No alerts found"
                description="No alerts match your current search or filters."
                action={
                  <button
                    type="button"
                    className="ui-button ui-button--secondary"
                    onClick={() => {
                      setSearch("");
                      setSeverityFilter("all");
                      setStatusFilter("all");
                    }}
                  >
                    Clear filters
                  </button>
                }
              />
            )}
          </div>
        ) : (
          <div className="alerts-list" role="tabpanel">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification: Notification) => (
                <article
                  className={`notification-item ${notification.readAt === null ? "is-unread" : ""}`}
                  key={notification.id}
                >
                  <div className="notification-icon" aria-hidden="true">
                    {notification.readAt === null ? "●" : "○"}
                  </div>

                  <div className="notification-content">
                    <div className="notification-heading">
                      <h3>{notification.title}</h3>

                      {notification.readAt === null && (
                        <span className="notification-new">New</span>
                      )}
                    </div>

                    <p>{notification.message}</p>

                    <div className="notification-meta">
                      <span>Received {formatDate(notification.createdAt)}</span>

                      <span>
                        {notification.readAt
                          ? `Read ${formatDate(notification.readAt)}`
                          : "Not yet read"}
                      </span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                title="No notifications found"
                description="There are no notifications matching your search."
                action={
                  <button
                    type="button"
                    className="ui-button ui-button--secondary"
                    onClick={() => setSearch("")}
                  >
                    Clear search
                  </button>
                }
              />
            )}
          </div>
        )}
      </section>

      <div className="alerts-readonly-note">
        <span>ⓘ</span>
        <p>
          This is a read-only alerts centre. Acknowledging, resolving or marking
          notifications as read is not available in Phase 1.
        </p>
      </div>
    </div>
  );
}

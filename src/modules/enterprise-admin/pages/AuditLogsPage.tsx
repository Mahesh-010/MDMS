import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "../../../shared/components/PageHeader";
import { StatCard } from "../../../shared/components/StatCard";
import {
  getEnterpriseAuditLogs,
  type AuditLogRecord,
} from "../services/enterpriseOperationsService";
import "./EnterpriseOperations.css";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  const loadLogs = useCallback(() => getEnterpriseAuditLogs(), []);

  useEffect(() => {
    let active = true;

    void loadLogs()
      .then((result) => {
        if (active) setLogs(result);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load audit logs.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter((log) => {
      const searchable = [
        log.id,
        log.userName,
        log.userId,
        log.zoneName,
        log.action,
        log.entityType,
        log.entityId,
        log.details,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (actionFilter === "all" || log.action === actionFilter) &&
        (entityFilter === "all" || log.entityType === entityFilter)
      );
    });
  }, [logs, search, actionFilter, entityFilter]);

  const actionCount = new Set(logs.map((log) => log.action)).size;
  const entityCount = new Set(logs.map((log) => log.entityType)).size;

  return (
    <div className="enterprise-operations">
      <PageHeader
        title="Audit Logs"
        subtitle="Review recorded activities across the MDMS enterprise system."
        actions={[
          {
            label: "Refresh logs",
            variant: "secondary",
            onClick: () => {
              setLoading(true);
              setError(null);
              void loadLogs()
                .then(setLogs)
                .catch((err: unknown) => {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Unable to load audit logs.",
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

      <section className="enterprise-stats">
        <StatCard
          label="Total log entries"
          value={logs.length}
          hint="Recorded activity entries"
        />
        <StatCard
          label="Action types"
          value={actionCount}
          hint="Distinct recorded actions"
        />
        <StatCard
          label="Entity types"
          value={entityCount}
          hint="Types of affected records"
        />
        <StatCard
          label="Filtered entries"
          value={filteredLogs.length}
          hint="Matching current filters"
        />
      </section>

      <section className="enterprise-panel">
        <div className="enterprise-panel-heading">
          <div>
            <h2>Activity history</h2>
            <p>Search and filter recorded system activities.</p>
          </div>
        </div>

        <div className="enterprise-toolbar">
          <input
            type="search"
            placeholder="Search user, action, entity or details..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search audit logs"
          />

          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            aria-label="Filter by action"
          >
            <option value="all">All actions</option>
            {Array.from(new Set(logs.map((log) => log.action))).map(
              (action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ),
            )}
          </select>

          <select
            value={entityFilter}
            onChange={(event) => setEntityFilter(event.target.value)}
            aria-label="Filter by entity"
          >
            <option value="all">All entities</option>
            {Array.from(new Set(logs.map((log) => log.entityType))).map(
              (entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ),
            )}
          </select>
        </div>

        {loading ? (
          <div className="enterprise-state">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="enterprise-state">
            <strong>No audit entries found</strong>
            <span>Try changing your search or filters.</span>
          </div>
        ) : (
          <div className="enterprise-table-wrap">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Zone</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const date = new Date(log.createdAt);

                  return (
                    <tr key={log.id}>
                      <td>
                        {Number.isNaN(date.getTime())
                          ? "Invalid date"
                          : date.toLocaleString()}
                      </td>
                      <td>
                        <strong>{log.userName}</strong>
                        <div className="enterprise-muted">{log.userId}</div>
                      </td>
                      <td>{log.zoneName}</td>
                      <td>
                        <span className="enterprise-pill enterprise-pill--info">
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <strong>{log.entityType}</strong>
                        <div className="enterprise-muted">{log.entityId}</div>
                      </td>
                      <td>{log.details}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="enterprise-muted">
          Showing {filteredLogs.length} of {logs.length} recorded activities.
        </p>
      </section>

      <p className="enterprise-muted">
        These entries reflect the audit data currently seeded in JSON Server.
        This page does not yet provide tamper-proof audit storage.
      </p>
    </div>
  );
}

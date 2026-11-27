import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../../../shared/components/PageHeader";
import { StatCard } from "../../../shared/components/StatCard";
import type { MeterStatus } from "../../../shared/types";
import {
  getEnterpriseMeters,
  updateMeterStatus,
  type EnterpriseMeterRecord,
} from "../services/meterManagementService";
import "./MeterManagementPage.css";

type StatusFilter = "all" | MeterStatus;

const statusLabels: Record<MeterStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  underMaintenance: "Under Maintenance",
};

function formatReading(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function MeterManagementPage() {
  const [records, setRecords] = useState<EnterpriseMeterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [selected, setSelected] = useState<EnterpriseMeterRecord | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMeters() {
      try {
        const result = await getEnterpriseMeters();
        if (active) setRecords(result);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadMeters();

    return () => {
      active = false;
    };
  }, []);

  const zones = useMemo(() => {
    const zoneMap = new Map<string, string>();

    records.forEach(({ zone }) => {
      if (zone) zoneMap.set(zone.id, zone.name);
    });

    return [...zoneMap.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter(({ meter, owner, zone }) => {
      const matchesSearch =
        !query ||
        meter.serialNumber.toLowerCase().includes(query) ||
        meter.id.toLowerCase().includes(query) ||
        (owner?.name.toLowerCase().includes(query) ?? false) ||
        (zone?.name.toLowerCase().includes(query) ?? false);

      const matchesStatus =
        statusFilter === "all" || meter.status === statusFilter;

      const matchesZone = zoneFilter === "all" || meter.zoneId === zoneFilter;

      return matchesSearch && matchesStatus && matchesZone;
    });
  }, [records, search, statusFilter, zoneFilter]);

  const activeCount = records.filter(
    ({ meter }) => meter.status === "active",
  ).length;
  const inactiveCount = records.filter(
    ({ meter }) => meter.status === "inactive",
  ).length;
  const maintenanceCount = records.filter(
    ({ meter }) => meter.status === "underMaintenance",
  ).length;

  async function handleStatusChange(
    record: EnterpriseMeterRecord,
    status: MeterStatus,
  ) {
    const confirmed = window.confirm(
      `Change ${record.meter.serialNumber} to ${statusLabels[status]}?`,
    );

    if (!confirmed) return;

    setUpdatingId(record.meter.id);
    setError(null);
    setNotice(null);

    try {
      const updated = await updateMeterStatus(record.meter.id, status);

      setRecords((current) =>
        current.map((item) =>
          item.meter.id === updated.id ? { ...item, meter: updated } : item,
        ),
      );

      setSelected((current) =>
        current?.meter.id === updated.id
          ? { ...current, meter: updated }
          : current,
      );

      setNotice(
        `${updated.serialNumber} status updated to ${statusLabels[status]}.`,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="enterprise-meter-page">
      <PageHeader
        title="Meter Management"
        subtitle="Monitor and manage meters registered across all distribution zones."
      />

      {notice && (
        <div className="meter-notice" role="status">
          {notice}
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="meter-error" role="alert">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <section className="enterprise-meter-stats">
        <StatCard
          value={records.length}
          label="Total meters"
          hint="All registered meters"
        />
        <StatCard
          value={activeCount}
          label="Active meters"
          hint="Currently operational"
        />
        <StatCard
          value={inactiveCount}
          label="Inactive meters"
          hint="Not currently active"
        />
        <StatCard
          value={maintenanceCount}
          label="Under maintenance"
          hint="Requires attention"
        />
      </section>

      <section className="enterprise-meter-panel">
        <div className="enterprise-meter-toolbar">
          <div>
            <h2>All registered meters</h2>
            <p>Search, filter and update meter status.</p>
          </div>

          <div className="enterprise-meter-filters">
            <input
              type="search"
              placeholder="Search meter, customer or zone..."
              aria-label="Search meters"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="underMaintenance">Under maintenance</option>
            </select>

            <select
              aria-label="Filter by zone"
              value={zoneFilter}
              onChange={(event) => setZoneFilter(event.target.value)}
            >
              <option value="all">All zones</option>
              {zones.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="enterprise-meter-state">Loading meters...</div>
        ) : error && records.length === 0 ? (
          <div className="enterprise-meter-state">
            Unable to load meter records. Check that JSON Server is running.
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="enterprise-meter-state">
            No meters match your filters.
          </div>
        ) : (
          <div className="enterprise-meter-table-scroll">
            <table className="enterprise-meter-table">
              <thead>
                <tr>
                  <th>Serial number</th>
                  <th>Customer</th>
                  <th>Zone</th>
                  <th>Latest reading</th>
                  <th>Installed on</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.meter.id}>
                    <td>
                      <strong>{record.meter.serialNumber}</strong>
                      <small>{record.meter.id}</small>
                    </td>
                    <td>{record.owner?.name ?? "Unknown customer"}</td>
                    <td>{record.zone?.name ?? "Unknown zone"}</td>
                    <td>{formatReading(record.meter.latestReadingKwh)} kWh</td>
                    <td>{formatDate(record.meter.installedAt)}</td>
                    <td>
                      <span
                        className={`meter-status meter-status--${record.meter.status}`}
                      >
                        {statusLabels[record.meter.status]}
                      </span>
                    </td>
                    <td>
                      <div className="meter-actions">
                        <button
                          type="button"
                          onClick={() => setSelected(record)}
                        >
                          View
                        </button>
                        <select
                          aria-label={`Change status for ${record.meter.serialNumber}`}
                          value={record.meter.status}
                          disabled={updatingId === record.meter.id}
                          onChange={(event) =>
                            void handleStatusChange(
                              record,
                              event.target.value as MeterStatus,
                            )
                          }
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="underMaintenance">Maintenance</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="enterprise-meter-footer">
          Showing {filteredRecords.length} of {records.length} meters
        </div>
      </section>

      {selected && (
        <div className="meter-detail-backdrop" role="presentation">
          <section
            className="meter-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="meter-detail-title"
          >
            <header>
              <div>
                <h2 id="meter-detail-title">Meter details</h2>
                <p>{selected.meter.serialNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close details"
              >
                ×
              </button>
            </header>

            <dl className="meter-detail-list">
              <div>
                <dt>Meter ID</dt>
                <dd>{selected.meter.id}</dd>
              </div>
              <div>
                <dt>Customer</dt>
                <dd>{selected.owner?.name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Customer email</dt>
                <dd>{selected.owner?.email ?? "—"}</dd>
              </div>
              <div>
                <dt>Zone</dt>
                <dd>{selected.zone?.name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Zone code</dt>
                <dd>{selected.zone?.code ?? "—"}</dd>
              </div>
              <div>
                <dt>Installed on</dt>
                <dd>{formatDate(selected.meter.installedAt)}</dd>
              </div>
              <div>
                <dt>Latest reading</dt>
                <dd>{formatReading(selected.meter.latestReadingKwh)} kWh</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{statusLabels[selected.meter.status]}</dd>
              </div>
            </dl>

            <footer>
              <button
                type="button"
                className="ui-button ui-button--secondary"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

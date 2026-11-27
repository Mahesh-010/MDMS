import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../../shared/components/PageHeader";
import { StatCard } from "../../../shared/components/StatCard";
import type { Zone } from "../../../shared/types";
import {
  createZone,
  getZones,
  updateZone,
} from "../services/zoneManagementService";
import type {
  CreateZoneInput,
  UpdateZoneInput,
} from "../services/zoneManagementService";
import "./ZoneManagementPage.css";

type StatusFilter = "all" | "active" | "inactive";

interface ZoneFormValues {
  name: string;
  code: string;
  status: "active" | "inactive";
}

const initialForm: ZoneFormValues = {
  name: "",
  code: "",
  status: "active",
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

function createZoneId(code: string): string {
  return `zone-${code
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;
}

export default function ZoneManagementPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [form, setForm] = useState<ZoneFormValues>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);

  const loadZones = useCallback(async () => {
    try {
      setError(null);
      const result = await getZones();
      setZones(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadZones();
  }, [loadZones]);

  const filteredZones = useMemo(() => {
    const query = search.trim().toLowerCase();

    return zones.filter((zone) => {
      const matchesSearch =
        !query ||
        zone.name.toLowerCase().includes(query) ||
        zone.code.toLowerCase().includes(query) ||
        zone.id.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || zone.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [zones, search, statusFilter]);

  const activeCount = zones.filter((zone) => zone.status === "active").length;
  const inactiveCount = zones.filter(
    (zone) => zone.status === "inactive",
  ).length;

  function openAddForm() {
    setEditingZone(null);
    setForm(initialForm);
    setFormError(null);
    setMessage(null);
    setFormOpen(true);
  }

  function openEditForm(zone: Zone) {
    setEditingZone(zone);
    setForm({
      name: zone.name,
      code: zone.code,
      status: zone.status,
    });
    setFormError(null);
    setMessage(null);
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setEditingZone(null);
    setForm(initialForm);
    setFormError(null);
  }

  function validateForm(): string | null {
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();

    if (!name || !code) {
      return "Zone name and zone code are required.";
    }

    if (!/^[A-Z0-9-]{2,10}$/.test(code)) {
      return "Zone code must be 2–10 characters and contain only letters, numbers or hyphens.";
    }

    const duplicateName = zones.some(
      (zone) =>
        zone.name.toLowerCase() === name.toLowerCase() &&
        zone.id !== editingZone?.id,
    );

    if (duplicateName) return "A zone with this name already exists.";

    const duplicateCode = zones.some(
      (zone) => zone.code.toUpperCase() === code && zone.id !== editingZone?.id,
    );

    if (duplicateCode) return "This zone code is already in use.";

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError(null);

    const normalizedName = form.name.trim();
    const normalizedCode = form.code.trim().toUpperCase();

    try {
      if (editingZone) {
        const input: UpdateZoneInput = {
          name: normalizedName,
          code: normalizedCode,
          status: form.status,
        };

        const updated = await updateZone(editingZone.id, input);

        setZones((current) =>
          current.map((zone) => (zone.id === updated.id ? updated : zone)),
        );
        setMessage(`${updated.name} has been updated successfully.`);
      } else {
        const id = createZoneId(normalizedCode);

        if (zones.some((zone) => zone.id === id)) {
          setFormError(
            "A zone with this generated ID already exists. Use another code.",
          );
          setSaving(false);
          return;
        }

        const input: CreateZoneInput = {
          id,
          name: normalizedName,
          code: normalizedCode,
          status: form.status,
        };

        const created = await createZone(input);

        setZones((current) =>
          [...current, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
        setMessage(`${created.name} has been created successfully.`);
      }

      setFormOpen(false);
      setEditingZone(null);
      setForm(initialForm);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusToggle(zone: Zone) {
    const nextStatus = zone.status === "active" ? "inactive" : "active";
    const confirmed = window.confirm(
      `Are you sure you want to ${nextStatus === "active" ? "activate" : "deactivate"} ${zone.name}?`,
    );

    if (!confirmed) return;

    setError(null);
    setMessage(null);

    try {
      const updated = await updateZone(zone.id, {
        name: zone.name,
        code: zone.code,
        status: nextStatus,
      });

      setZones((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setMessage(`${updated.name} is now ${updated.status}.`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="zone-management-page">
      <PageHeader
        title="Zone Management"
        subtitle="Create, update and manage electricity distribution zones."
        actions={[
          {
            label: "Add new zone",
            variant: "primary",
            onClick: openAddForm,
          },
        ]}
      />

      {message && (
        <div className="zone-message zone-message--success" role="status">
          {message}
          <button
            type="button"
            onClick={() => setMessage(null)}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="zone-message zone-message--error" role="alert">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <section className="zone-management-stats" aria-label="Zone statistics">
        <StatCard
          label="Total zones"
          value={zones.length}
          hint="Registered distribution zones"
        />
        <StatCard
          label="Active zones"
          value={activeCount}
          hint="Currently active"
        />
        <StatCard
          label="Inactive zones"
          value={inactiveCount}
          hint="Currently inactive"
        />
      </section>

      <section className="zone-management-panel">
        <div className="zone-management-toolbar">
          <div>
            <h2>All zones</h2>
            <p>Search and manage your distribution zones.</p>
          </div>

          <div className="zone-management-filters">
            <label className="zone-search">
              <span className="zone-visually-hidden">Search zones</span>
              <input
                type="search"
                placeholder="Search name, code or ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label className="zone-filter">
              <span className="zone-visually-hidden">Filter by status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="zone-table-state">Loading zones...</div>
        ) : error && zones.length === 0 ? (
          <div className="zone-table-state">
            Unable to load zones. Check that JSON Server is running.
            <button
              type="button"
              className="ui-button ui-button--secondary"
              onClick={() => {
                setLoading(true);
                void loadZones();
              }}
            >
              Try again
            </button>
          </div>
        ) : filteredZones.length === 0 ? (
          <div className="zone-table-state">
            <strong>No zones found</strong>
            <span>Try changing your search or status filter.</span>
          </div>
        ) : (
          <div className="zone-table-scroll">
            <table className="zone-management-table">
              <thead>
                <tr>
                  <th>Zone name</th>
                  <th>Zone code</th>
                  <th>Zone ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredZones.map((zone) => (
                  <tr key={zone.id}>
                    <td>
                      <strong>{zone.name}</strong>
                    </td>
                    <td>{zone.code}</td>
                    <td className="zone-id-cell">{zone.id}</td>
                    <td>
                      <span
                        className={`zone-status zone-status--${zone.status}`}
                      >
                        {zone.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="zone-row-actions">
                        <button
                          type="button"
                          onClick={() => openEditForm(zone)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={
                            zone.status === "active"
                              ? "zone-deactivate"
                              : "zone-activate"
                          }
                          onClick={() => void handleStatusToggle(zone)}
                        >
                          {zone.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <Link
                          to={`/enterprise/zones/${encodeURIComponent(zone.id)}`}
                        >
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="zone-management-footer">
          Showing {filteredZones.length} of {zones.length} zones
        </div>
      </section>

      {formOpen && (
        <div className="zone-modal-backdrop" role="presentation">
          <section
            className="zone-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="zone-form-title"
          >
            <div className="zone-modal-header">
              <div>
                <h2 id="zone-form-title">
                  {editingZone ? "Edit zone" : "Add new zone"}
                </h2>
                <p>
                  {editingZone
                    ? "Update the zone information below."
                    : "Enter the details for the new distribution zone."}
                </p>
              </div>
              <button
                type="button"
                className="zone-modal-close"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="zone-modal-body">
                {formError && (
                  <div
                    className="zone-message zone-message--error"
                    role="alert"
                  >
                    {formError}
                  </div>
                )}

                <label className="zone-form-field">
                  <span>Zone name *</span>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. Mangalore"
                    maxLength={60}
                    required
                  />
                </label>

                <label className="zone-form-field">
                  <span>Zone code *</span>
                  <input
                    value={form.code}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        code: event.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="e.g. MNG"
                    maxLength={10}
                    required
                  />
                  <small>Use 2–10 letters, numbers or hyphens.</small>
                </label>

                <label className="zone-form-field">
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as ZoneFormValues["status"],
                      }))
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>

                {editingZone && (
                  <p className="zone-form-note">
                    Zone ID: <strong>{editingZone.id}</strong>
                  </p>
                )}
              </div>

              <div className="zone-modal-footer">
                <button
                  type="button"
                  className="ui-button ui-button--secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ui-button ui-button--primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingZone
                      ? "Save changes"
                      : "Create zone"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "../../../shared/components/PageHeader";
import { StatCard } from "../../../shared/components/StatCard";
import type { User, UserRole, Zone } from "../../../shared/types";
import {
  getEnterpriseUsers,
  getUserZones,
} from "../services/userManagementService";
import "./UserManagementPage.css";

type RoleFilter = "all" | UserRole;
type StatusFilter = "all" | "active" | "inactive";

const roleLabels: Record<UserRole, string> = {
  enterprise: "Enterprise Admin",
  zoneAdmin: "Zone Admin",
  customer: "Customer",
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const loadData = useCallback(
    () => Promise.all([getEnterpriseUsers(), getUserZones()]),
    [],
  );

  useEffect(() => {
    let active = true;

    void loadData()
      .then(([userRecords, zoneRecords]) => {
        if (active) {
          setUsers(userRecords);
          setZones(zoneRecords);
        }
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadData]);

  const zoneMap = useMemo(
    () => new Map(zones.map((zone) => [zone.id, zone.name])),
    [zones],
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const enterpriseCount = users.filter(
    (user) => user.role === "enterprise",
  ).length;

  const zoneAdminCount = users.filter(
    (user) => user.role === "zoneAdmin",
  ).length;

  const customerCount = users.filter((user) => user.role === "customer").length;

  const activeCount = users.filter((user) => user.status === "active").length;

  return (
    <div className="user-management-page">
      <PageHeader
        title="User & Role Management"
        subtitle="View registered users, their roles, zone assignments and account status."
      />

      <section className="user-management-stats">
        <StatCard
          label="Total users"
          value={users.length}
          hint="All registered users"
        />
        <StatCard
          label="Enterprise admins"
          value={enterpriseCount}
          hint="Enterprise-level accounts"
        />
        <StatCard
          label="Zone admins"
          value={zoneAdminCount}
          hint="Zone-level administrators"
        />
        <StatCard
          label="Customers"
          value={customerCount}
          hint="Registered customers"
        />
      </section>

      <section className="user-management-panel">
        <div className="user-management-toolbar">
          <div>
            <h2>All users</h2>
            <p>
              {activeCount} active users out of {users.length} registered users.
            </p>
          </div>

          <div className="user-management-filters">
            <label className="user-search">
              <span className="user-visually-hidden">Search users</span>
              <input
                type="search"
                placeholder="Search name, email or ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label className="user-filter">
              <span className="user-visually-hidden">Filter by role</span>
              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value as RoleFilter)
                }
              >
                <option value="all">All roles</option>
                <option value="enterprise">Enterprise Admin</option>
                <option value="zoneAdmin">Zone Admin</option>
                <option value="customer">Customer</option>
              </select>
            </label>

            <label className="user-filter">
              <span className="user-visually-hidden">Filter by status</span>
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
          <div className="user-table-state">Loading users...</div>
        ) : error ? (
          <div className="user-table-state user-table-state--error">
            <strong>Unable to load users</strong>
            <span>{error}</span>
            <button
              type="button"
              className="ui-button ui-button--secondary"
              onClick={() => {
                setLoading(true);
                setError(null);
                void loadData()
                  .then(([userRecords, zoneRecords]) => {
                    setUsers(userRecords);
                    setZones(zoneRecords);
                  })
                  .catch((err: unknown) => setError(getErrorMessage(err)))
                  .finally(() => setLoading(false));
              }}
            >
              Try again
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="user-table-state">
            <strong>No users found</strong>
            <span>Try changing your search or filters.</span>
          </div>
        ) : (
          <div className="user-table-scroll">
            <table className="user-management-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>User ID</th>
                  <th>Role</th>
                  <th>Zone</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-identity">
                        <span className="user-avatar">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="user-identity-details">
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </span>
                      </div>
                    </td>

                    <td className="user-id-cell">{user.id}</td>

                    <td>
                      <span className={`user-role user-role--${user.role}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>

                    <td>
                      {user.zoneId
                        ? (zoneMap.get(user.zoneId) ?? "Unknown zone")
                        : "—"}
                    </td>

                    <td>
                      <span
                        className={`user-status user-status--${user.status}`}
                      >
                        <span className="user-status-dot" />
                        {user.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="user-table-footer">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        )}
      </section>
    </div>
  );
}

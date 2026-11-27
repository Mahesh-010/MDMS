import API from "../../../services/http";
import type {
  Alert,
  AuditLog,
  Bill,
  ConsumptionPointRecord,
  Setting,
  Zone,
} from "../../../shared/types";

interface JsonServerPage<T> {
  pages: number;
  data: T[];
}

async function getAll<T>(endpoint: string): Promise<T[]> {
  const first = await API.get<JsonServerPage<T>>(endpoint, {
    params: { _page: 1, _per_page: 100 },
  });

  const records = [...first.data.data];

  if (first.data.pages <= 1) return records;

  const remaining = await Promise.all(
    Array.from({ length: first.data.pages - 1 }, (_, index) =>
      API.get<JsonServerPage<T>>(endpoint, {
        params: { _page: index + 2, _per_page: 100 },
      }),
    ),
  );

  remaining.forEach((response) => records.push(...response.data.data));
  return records;
}

export interface ReportsData {
  consumption: ConsumptionPointRecord[];
  bills: Bill[];
  zones: Zone[];
}

export async function getReportsData(): Promise<ReportsData> {
  const [consumption, bills, zones] = await Promise.all([
    getAll<ConsumptionPointRecord>("/consumption"),
    getAll<Bill>("/bills"),
    getAll<Zone>("/zones"),
  ]);

  return { consumption, bills, zones };
}

export async function getEnterpriseAlerts(): Promise<Alert[]> {
  return getAll<Alert>("/alerts");
}

export async function updateAlertStatus(
  alertId: string,
  status: Alert["status"],
): Promise<Alert> {
  const response = await API.patch<Alert>(
    `/alerts/${encodeURIComponent(alertId)}`,
    { status },
  );

  return response.data;
}

export interface AuditLogRecord extends AuditLog {
  userName: string;
  zoneName: string;
}

export async function getEnterpriseAuditLogs(): Promise<AuditLogRecord[]> {
  const [logs, users, zones] = await Promise.all([
    getAll<AuditLog>("/auditLogs"),
    getAll<{ id: string; name: string }>("/users"),
    getAll<Zone>("/zones"),
  ]);

  const userMap = new Map(users.map((user) => [user.id, user.name]));
  const zoneMap = new Map(zones.map((zone) => [zone.id, zone.name]));

  return logs
    .map((log) => ({
      ...log,
      userName: userMap.get(log.userId) ?? "Unknown user",
      zoneName: log.zoneId
        ? (zoneMap.get(log.zoneId) ?? "Unknown zone")
        : "Enterprise",
    }))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getEnterpriseSettings(): Promise<Setting[]> {
  const settings = await getAll<Setting>("/settings");
  return settings.filter((setting) => setting.scope === "enterprise");
}

export async function saveEnterpriseSetting(
  setting: Setting,
): Promise<Setting> {
  if (setting.scope !== "enterprise") {
    throw new Error("Only enterprise-level settings can be changed here.");
  }

  const response = await API.patch<Setting>(
    `/settings/${encodeURIComponent(setting.id)}`,
    { value: setting.value },
  );

  return response.data;
}

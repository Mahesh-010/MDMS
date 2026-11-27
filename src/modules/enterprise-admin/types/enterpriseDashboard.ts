import type {
  Alert,
  Bill,
  ConsumptionPointRecord,
  Meter,
  User,
  Zone,
} from "../../../shared/types";

export interface EnterpriseDashboardData {
  zones: Zone[];
  users: User[];
  meters: Meter[];
  bills: Bill[];
  alerts: Alert[];
  consumption: ConsumptionPointRecord[];
}

export interface EnterpriseDashboardSummary {
  totalZones: number;
  activeZones: number;
  totalCustomers: number;
  totalMeters: number;
  activeMeters: number;
  inactiveMeters: number;
  maintenanceMeters: number;
  totalConsumption: number;
  pendingBills: number;
  overdueBills: number;
  openAlerts: number;
  criticalAlerts: number;
}

export interface ZonePerformance {
  zoneId: string;
  zoneName: string;
  customers: number;
  meters: number;
  consumption: number;
}

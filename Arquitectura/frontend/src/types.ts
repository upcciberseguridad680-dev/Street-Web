export type PageName = "login" | "register" | "dashboard" | "heatmap" | "report" | "moderation";

export type FlashCategory = "error" | "success" | "info" | "warning" | string;

export interface UserSession {
  id: number;
  username: string;
  isAdmin: boolean;
}

export interface FlashMessage {
  category: FlashCategory;
  message: string;
}

export type IncidentStatus = "pending" | "approved" | "rejected";

export interface Incident {
  id: number;
  district: string;
  incidentType: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: number;
  dateReported: string | null;
  source: string;
  status: IncidentStatus;
  reportedBy: string | null;
}

export interface TypeCount {
  label: string;
  value: number;
}

export interface DashboardData {
  totalIncidents: number;
  recentIncidents: Incident[];
  incidentTypes: string[];
  districts: string[];
  typeCounts: TypeCount[];
}

export interface HeatmapPoint {
  id?: number;
  lat: number;
  lng: number;
  intensity: number;
  district: string;
  type: string;
  description: string;
  date: string;
}

export interface HeatmapFilters {
  type: string;
  district: string;
  startDate: string;
  endDate: string;
}

export interface HeatmapData {
  incidents: Incident[];
  heatmapPoints: HeatmapPoint[];
  incidentTypes: string[];
  districts: string[];
  filters: HeatmapFilters;
}

export interface ReportFormData {
  districts: string[];
  incidentTypes: string[];
}

export interface ModerationData {
  pending: Incident[];
}

export interface AppData {
  page: PageName;
  user: UserSession | null;
  flashMessages: FlashMessage[];
  csrfToken?: string;
  dashboard?: DashboardData;
  heatmap?: HeatmapData;
  report?: ReportFormData;
  moderation?: ModerationData;
}

declare global {
  interface Window {
    __STREET_WEB__?: AppData;
    L?: any;
  }
}

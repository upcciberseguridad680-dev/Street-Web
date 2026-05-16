export type PageName = "login" | "register" | "dashboard" | "heatmap";

export type FlashCategory = "error" | "success" | "info" | "warning" | string;

export interface UserSession {
  id: number;
  username: string;
}

export interface FlashMessage {
  category: FlashCategory;
  message: string;
}

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

export interface AppData {
  page: PageName;
  user: UserSession | null;
  flashMessages: FlashMessage[];
  csrfToken?: string;
  dashboard?: DashboardData;
  heatmap?: HeatmapData;
}

declare global {
  interface Window {
    __STREET_WEB__?: AppData;
    L?: any;
  }
}

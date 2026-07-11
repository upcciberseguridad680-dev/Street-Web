import React, { useEffect, useMemo, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Filter,
  FilePlus2,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPinned,
  Menu,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  UserPlus,
  UsersRound,
  X,
  Sun,
  Moon,
  Lock,
  PieChart,
  List,
  Download
} from "lucide-react";
import "./styles.css";
import type {
  AppData,
  DashboardData,
  FlashMessage,
  HeatmapData,
  HeatmapPoint,
  Incident,
  ModerationData,
  PageName,
  ReportFormData,
  UserSession
} from "./types";

const appData = window.__STREET_WEB__ ?? {
  page: "login",
  user: null,
  flashMessages: []
};

function App({ data }: { data: AppData }) {
  return (
    <AppLayout page={data.page} user={data.user} flashMessages={data.flashMessages}>
      {data.page === "login" && <AuthView mode="login" csrfToken={data.csrfToken ?? ""} />}
      {data.page === "register" && <AuthView mode="register" csrfToken={data.csrfToken ?? ""} />}
      {data.page === "dashboard" && <DashboardView data={data.dashboard} />}
      {data.page === "heatmap" && <HeatmapView data={data.heatmap} />}
      {data.page === "report" && <ReportView data={data.report} csrfToken={data.csrfToken ?? ""} />}
      {data.page === "moderation" && (
        <ModerationView data={data.moderation} csrfToken={data.csrfToken ?? ""} />
      )}
    </AppLayout>
  );
}

function AppLayout({
  children,
  page,
  user,
  flashMessages
}: {
  children: React.ReactNode;
  page: PageName;
  user: UserSession | null;
  flashMessages: FlashMessage[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark-theme");
      document.body.classList.add("dark-theme");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark-theme");
      document.body.classList.remove("dark-theme");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">
            <ShieldCheck size={22} strokeWidth={2.3} />
          </span>
          <span>
            <strong>Street Web</strong>
            <small>Lima y Callao</small>
          </span>
        </a>

        <button
          className="icon-button nav-toggle"
          type="button"
          aria-label="Abrir navegación"
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className={`nav-links ${menuOpen ? "is-open" : ""}`}>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <>
              <NavLink href="/dashboard" active={page === "dashboard"} icon={<LayoutDashboard size={18} />}>
                Panel
              </NavLink>
              <NavLink href="/heatmap" active={page === "heatmap"} icon={<MapPinned size={18} />}>
                Mapa
              </NavLink>
              <NavLink href="/reports/new" active={page === "report"} icon={<FilePlus2 size={18} />}>
                Reportar
              </NavLink>
              {user.isAdmin && (
                <NavLink href="/reports/pending" active={page === "moderation"} icon={<ClipboardCheck size={18} />}>
                  Moderación
                </NavLink>
              )}
              <span className="session-chip">
                <UsersRound size={16} />
                {user.username}
              </span>
              <a className="nav-action" href="/logout">
                <LogOut size={17} />
                Salir
              </a>
            </>
          ) : (
            <>
              <NavLink href="/login" active={page === "login"} icon={<LogIn size={18} />}>
                Iniciar sesión
              </NavLink>
              <a className="nav-action" href="/register">
                <UserPlus size={17} />
                Registro
              </a>
            </>
          )}
        </nav>
      </header>

      <main className="main-content">
        <FlashStack initialMessages={flashMessages} />
        {children}
      </main>

      <footer className="footer">
        <span>Street Web</span>
        <span>Sistema de monitoreo de seguridad ciudadana</span>
      </footer>
    </div>
  );
}

function NavLink({
  href,
  active,
  icon,
  children
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <a className={`nav-link ${active ? "is-active" : ""}`} href={href}>
      {icon}
      {children}
    </a>
  );
}

function FlashStack({ initialMessages }: { initialMessages: FlashMessage[] }) {
  const [messages, setMessages] = useState(initialMessages);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="flash-stack">
      {messages.map((message, index) => (
        <div className={`flash flash-${message.category}`} role="alert" key={`${message.category}-${index}`}>
          {message.category === "success" ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
          <span>{translateFlash(message.message)}</span>
          <button
            className="icon-button subtle"
            type="button"
            aria-label="Cerrar alerta"
            onClick={() => setMessages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function AuthView({ mode, csrfToken }: { mode: "login" | "register"; csrfToken: string }) {
  const isRegister = mode === "register";

  return (
    <section className="auth-page">
      <div className="auth-summary">
        <div className="section-kicker">Acceso seguro</div>
        <h1>{isRegister ? "Crear cuenta" : "Iniciar sesión"}</h1>
        <p>Gestión de incidentes y zonas de riesgo para Lima y Callao.</p>
        <div className="auth-metrics">
          <span>
            <ShieldCheck size={18} />
            Sesión protegida
          </span>
          <span>
            <MapPinned size={18} />
            Monitoreo territorial
          </span>
        </div>
      </div>

      <form className="auth-form surface" method="POST">
        <input type="hidden" name="csrf_token" value={csrfToken} />
        <div>
          <h2>{isRegister ? "Registro" : "Credenciales"}</h2>
          <p>{isRegister ? "Completa los datos de usuario." : "Ingresa con tu usuario registrado."}</p>
        </div>

        <label className="field">
          <span>Usuario</span>
          <input name="username" type="text" autoComplete="username" required />
        </label>

        {isRegister && (
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
        )}

        <label className="field">
          <span>Contraseña</span>
          <input
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
          />
        </label>

        <button className="primary-button" type="submit">
          {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
          {isRegister ? "Crear cuenta" : "Ingresar"}
        </button>

        <p className="form-switch">
          {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
          <a href={isRegister ? "/login" : "/register"}>{isRegister ? "Inicia sesión" : "Regístrate"}</a>
        </p>
      </form>
    </section>
  );
}

function DashboardView({ data }: { data?: DashboardData }) {
  const dashboard = data ?? {
    totalIncidents: 0,
    recentIncidents: [],
    incidentTypes: [],
    districts: [],
    typeCounts: []
  };

  const topType = dashboard.typeCounts[0]?.label ?? "Sin datos";
  const latestDate = dashboard.recentIncidents[0]?.dateReported ?? null;

  const exportToCSV = async () => {
    try {
      const response = await fetch('/api/incidents');
      if (!response.ok) {
        throw new Error('Error al obtener los datos');
      }
      const incidents = await response.json();
      
      // Build CSV content
      const headers = ["ID", "Distrito", "Tipo", "Severidad", "Fecha de Reporte", "Fuente", "Descripcion"];
      const rows = incidents.map((inc: any) => [
        inc.id,
        `"${inc.district.replace(/"/g, '""')}"`,
        `"${inc.incident_type.replace(/"/g, '""')}"`,
        inc.severity,
        inc.date_reported || "",
        `"${inc.source.replace(/"/g, '""')}"`,
        `"${inc.description.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
      ]);
      
      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `incidentes_street_web_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('No se pudo exportar a CSV en este momento.');
    }
  };

  return (
    <section className="workspace">
      <PageHeader
        kicker="Panel operativo"
        title="Resumen de seguridad"
        description="Indicadores actualizados de incidentes reportados."
        actionHref="/heatmap"
        actionLabel="Ver mapa"
        actionIcon={<MapPinned size={18} />}
        extraAction={
          <button className="secondary-button" onClick={exportToCSV} type="button">
            <Download size={18} />
            Exportar CSV
          </button>
        }
      />

      <div className="stat-grid">
        <StatCard icon={<ShieldCheck size={22} />} label="Incidentes" value={dashboard.totalIncidents} tone="teal" />
        <StatCard icon={<CalendarDays size={22} />} label="Recientes" value={dashboard.recentIncidents.length} tone="blue" />
        <StatCard icon={<AlertTriangle size={22} />} label="Tipos" value={dashboard.incidentTypes.length} tone="amber" />
        <StatCard icon={<MapPinned size={22} />} label="Distritos" value={dashboard.districts.length} tone="red" />
      </div>

      <div className="dashboard-grid">
        <section className="surface data-panel">
          <PanelHeader icon={<Search size={20} />} title="Incidentes recientes" meta={formatDateTime(latestDate)} />
          <IncidentTable incidents={dashboard.recentIncidents} compact />
        </section>

        <aside className="surface insight-panel">
          <PanelHeader icon={<BarChart3 size={20} />} title="Distribución por tipo" meta={topType} />
          <InteractiveStats counts={dashboard.typeCounts} />
        </aside>
      </div>

      <section className="surface map-cta">
        <div>
          <div className="section-kicker">Mapa de calor</div>
          <h2>Zonas con mayor concentración de incidentes</h2>
        </div>
        <a className="primary-button inline" href="/heatmap">
          Abrir mapa
          <ChevronRight size={18} />
        </a>
      </section>
    </section>
  );
}

function HeatmapView({ data }: { data?: HeatmapData }) {
  const heatmap = data ?? {
    incidents: [],
    heatmapPoints: [],
    incidentTypes: [],
    districts: [],
    filters: {
      type: "",
      district: "",
      startDate: "",
      endDate: ""
    }
  };

  const [focusedPoint, setFocusedPoint] = useState<HeatmapPoint | null>(null);

  return (
    <section className="workspace">
      <PageHeader
        kicker="Mapa de calor"
        title="Riesgo territorial"
        description="Vista georreferenciada de incidentes filtrados."
      />

      <form className="surface filter-bar" method="GET" action="/heatmap">
        <label className="field">
          <span>Tipo</span>
          <select name="type" defaultValue={heatmap.filters.type}>
            <option value="">Todos</option>
            {heatmap.incidentTypes.map((type) => (
              <option value={type} key={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Distrito</span>
          <select name="district" defaultValue={heatmap.filters.district}>
            <option value="">Todos</option>
            {heatmap.districts.map((district) => (
              <option value={district} key={district}>
                {district}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Inicio</span>
          <input name="start_date" type="date" defaultValue={heatmap.filters.startDate} />
        </label>

        <label className="field">
          <span>Fin</span>
          <input name="end_date" type="date" defaultValue={heatmap.filters.endDate} />
        </label>

        <div className="filter-actions">
          <button className="primary-button" type="submit">
            <Filter size={18} />
            Aplicar
          </button>
          <a className="secondary-button" href="/heatmap">
            <X size={17} />
            Limpiar
          </a>
        </div>
      </form>

      <div className="stat-grid compact">
        <StatCard icon={<ShieldCheck size={22} />} label="Resultados" value={heatmap.incidents.length} tone="teal" />
        <StatCard
          icon={<SlidersHorizontal size={22} />}
          label="Filtros activos"
          value={countActiveFilters(heatmap.filters)}
          tone="blue"
        />
        <StatCard icon={<MapPinned size={22} />} label="Distritos" value={uniqueCount(heatmap.incidents, "district")} tone="amber" />
      </div>

      <section className="surface map-panel">
        <PanelHeader icon={<MapPinned size={20} />} title="Mapa de inseguridad" meta={`${heatmap.heatmapPoints.length} puntos`} />
        <LeafletHeatmap points={heatmap.heatmapPoints} focusedPoint={focusedPoint} />
      </section>

      <section className="surface data-panel">
        <PanelHeader icon={<Search size={20} />} title="Detalle de incidentes" meta={`${heatmap.incidents.length} registros`} />
        <IncidentTable
          incidents={heatmap.incidents}
          onRowClick={(incident) => {
            const point = heatmap.heatmapPoints.find((p) => p.id === incident.id);
            if (point) {
              setFocusedPoint(point);
              document.querySelector(".map-panel")?.scrollIntoView({ behavior: "smooth" });
            }
          }}
          focusedIncidentId={focusedPoint?.id}
        />
      </section>
    </section>
  );
}

const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  'Ancón': [-11.7725, -77.1758],
  'Ate': [-12.0261, -76.9192],
  'Barranco': [-12.1499, -77.0201],
  'Breña': [-12.0578, -77.0517],
  'Carabayllo': [-11.8642, -77.0272],
  'Chaclacayo': [-11.9781, -76.7758],
  'Chorrillos': [-12.1747, -77.0181],
  'Cieneguilla': [-12.0864, -76.8067],
  'Comas': [-11.9349, -77.0522],
  'El Agustino': [-12.0378, -77.0022],
  'Independencia': [-11.9889, -77.0500],
  'Jesús María': [-12.0764, -77.0489],
  'La Molina': [-12.0868, -76.9420],
  'La Victoria': [-12.0645, -77.0175],
  'Lima Cercado': [-12.0464, -77.0428],
  'Lince': [-12.0868, -77.0343],
  'Los Olivos': [-11.9689, -77.0700],
  'Lurigancho (Chosica)': [-11.9333, -76.7000],
  'Lurín': [-12.2725, -76.8672],
  'Magdalena del Mar': [-12.0925, -77.0742],
  'Miraflores': [-12.1216, -77.0282],
  'Pachacámac': [-12.2333, -76.8333],
  'Pucusana': [-12.4833, -76.7972],
  'Pueblo Libre': [-12.0733, -77.0631],
  'Puente Piedra': [-11.8672, -77.0761],
  'Punta Hermosa': [-12.3333, -76.8167],
  'Punta Negra': [-12.3667, -76.8000],
  'Rímac': [-12.0294, -77.0347],
  'San Bartolo': [-12.3667, -76.7833],
  'San Borja': [-12.1083, -77.0011],
  'San Isidro': [-12.0975, -77.0367],
  'San Juan de Lurigancho': [-11.9722, -77.0000],
  'San Juan de Miraflores': [-12.1567, -76.9711],
  'San Luis': [-12.0797, -77.0083],
  'San Martín de Porres': [-12.0022, -77.0836],
  'San Miguel': [-12.0775, -77.0925],
  'Santa Anita': [-12.0447, -76.9683],
  'Santa María del Mar': [-12.3833, -76.8000],
  'Santa Rosa': [-11.7961, -77.1719],
  'Santiago de Surco': [-12.1350, -76.9908],
  'Surquillo': [-12.1122, -77.0181],
  'Villa El Salvador': [-12.1881, -76.9845],
  'Villa María del Triunfo': [-12.1614, -76.9422],
  'Bellavista': [-12.0611, -77.1069],
  'Callao': [-12.0566, -77.1181],
  'Carmen de la Legua Reynoso': [-12.0500, -77.0942],
  'La Perla': [-12.0667, -77.1167],
  'La Punta': [-12.0663, -77.1368],
  'Mi Perú': [-11.8489, -77.1214],
  'Ventanilla': [-11.8747, -77.1281]
};

function ReportLocationMap({
  district,
  onLocationSelect
}: {
  district: string;
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  const mapId = useMemo(() => `report-map-${Math.random().toString(36).slice(2)}`, []);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!window.L) return;

    const L = window.L;
    const initialCoords = DISTRICT_COORDINATES[district] || [-12.0464, -77.0428];

    const map = L.map(mapId, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView(initialCoords, 13);

    mapRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 20
    }).addTo(map);

    const marker = L.marker(initialCoords, {
      draggable: true
    }).addTo(map);

    markerRef.current = marker;

    onLocationSelect(initialCoords[0], initialCoords[1]);

    const handleMove = (e: any) => {
      const latlng = e.target.getLatLng();
      onLocationSelect(latlng.lat, latlng.lng);
    };

    marker.on("dragend", handleMove);

    map.on("click", (e: any) => {
      marker.setLatLng(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [mapId]);

  useEffect(() => {
    if (mapRef.current && markerRef.current && DISTRICT_COORDINATES[district]) {
      const coords = DISTRICT_COORDINATES[district];
      mapRef.current.setView(coords, 13);
      markerRef.current.setLatLng(coords);
      onLocationSelect(coords[0], coords[1]);
    }
  }, [district]);

  return <div id={mapId} className="report-map" />;
}

function ReportView({ data, csrfToken }: { data?: ReportFormData; csrfToken: string }) {
  const report = data ?? { districts: [], incidentTypes: [] };
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleLocationSelect = (lat: number, lng: number) => {
    setLocation({ lat, lng });
  };

  return (
    <section className="workspace">
      <PageHeader
        kicker="Reportar incidente"
        title="Registra un incidente de inseguridad"
        description="Tu reporte quedará pendiente de revisión por un administrador antes de mostrarse en el mapa y el panel."
      />

      <form className="surface report-form" method="POST" action="/reports/new">
        <input type="hidden" name="csrf_token" value={csrfToken} />
        <input type="hidden" name="latitude" value={location ? location.lat : ""} />
        <input type="hidden" name="longitude" value={location ? location.lng : ""} />
        <input type="hidden" name="is_anonymous" value={isAnonymous ? "true" : "false"} />

        <label className="field">
          <span>Distrito</span>
          <select
            name="district"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            required
          >
            <option value="" disabled>
              Selecciona un distrito
            </option>
            {report.districts.map((district) => (
              <option value={district} key={district}>
                {district}
              </option>
            ))}
          </select>
        </label>

        {selectedDistrict && (
          <div className="report-map-container">
            <span style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
              Marca la ubicación exacta en el mapa (opcional)
            </span>
            <ReportLocationMap
              district={selectedDistrict}
              onLocationSelect={handleLocationSelect}
            />
            {location && (
              <div className="coordinates-display">
                <span>Latitud: <strong>{location.lat.toFixed(6)}</strong></span>
                <span>Longitud: <strong>{location.lng.toFixed(6)}</strong></span>
              </div>
            )}
          </div>
        )}

        <label className="field">
          <span>Tipo de incidente</span>
          <select name="incident_type" defaultValue="" required>
            <option value="" disabled>
              Selecciona un tipo
            </option>
            {report.incidentTypes.map((type) => (
              <option value={type} key={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Severidad</span>
          <select name="severity" defaultValue="" required>
            <option value="" disabled>
              Selecciona un nivel
            </option>
            <option value="1">1 - Baja</option>
            <option value="2">2 - Leve</option>
            <option value="3">3 - Media</option>
            <option value="4">4 - Alta</option>
            <option value="5">5 - Crítica</option>
          </select>
        </label>

        <label className="field">
          <span>Descripción</span>
          <textarea name="description" rows={4} required placeholder="Describe brevemente lo ocurrido: lugar, hora, detalles relevantes." />
        </label>

        <label className="anonymous-field">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          <span>Reportar de forma anónima</span>
        </label>

        {isAnonymous && (
          <div className="anonymous-warning">
            <Lock size={16} />
            <span>Tu usuario no será registrado en este reporte para garantizar tu anonimato.</span>
          </div>
        )}

        <button className="primary-button" type="submit">
          <FilePlus2 size={18} />
          Enviar reporte
        </button>
      </form>
    </section>
  );
}

function ModerationView({ data, csrfToken }: { data?: ModerationData; csrfToken: string }) {
  const moderation = data ?? { pending: [] };

  return (
    <section className="workspace">
      <PageHeader
        kicker="Moderación"
        title="Reportes pendientes de revisión"
        description="Aprueba los reportes que deban mostrarse en el dashboard y el mapa de calor, o recházalos si no corresponden."
      />

      <section className="surface data-panel">
        <PanelHeader
          icon={<ClipboardCheck size={20} />}
          title="Pendientes"
          meta={`${moderation.pending.length} reportes`}
        />

        {moderation.pending.length === 0 ? (
          <div className="empty-state">No hay reportes pendientes.</div>
        ) : (
          <div className="table-wrap">
            <table className="incident-table">
              <thead>
                <tr>
                  <th>Distrito</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Severidad</th>
                  <th>Reportado por</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {moderation.pending.map((incident) => (
                  <tr key={incident.id}>
                    <td className="strong-cell">{incident.district}</td>
                    <td>
                      <span className={`type-badge type-${slugify(incident.incidentType)}`}>{incident.incidentType}</span>
                    </td>
                    <td>{truncate(incident.description, 72)}</td>
                    <td>
                      <Severity value={incident.severity} />
                    </td>
                    <td>
                      {incident.reportedBy ? (
                        incident.reportedBy
                      ) : (
                        <span className="anonymous-badge">
                          <Lock size={12} /> Anónimo
                        </span>
                      )}
                    </td>
                    <td>{formatDateTime(incident.dateReported)}</td>
                    <td>
                      <div className="moderation-actions">
                        <form method="POST" action={`/reports/${incident.id}/approve`}>
                          <input type="hidden" name="csrf_token" value={csrfToken} />
                          <button className="primary-button inline" type="submit">
                            <CheckCircle2 size={16} />
                            Aprobar
                          </button>
                        </form>
                        <form method="POST" action={`/reports/${incident.id}/reject`}>
                          <input type="hidden" name="csrf_token" value={csrfToken} />
                          <button className="secondary-button" type="submit">
                            <X size={16} />
                            Rechazar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

function PageHeader({
  kicker,
  title,
  description,
  actionHref,
  actionLabel,
  actionIcon,
  extraAction
}: {
  kicker: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  extraAction?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <div className="section-kicker">{kicker}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="header-actions" style={{ display: "flex", gap: "10px" }}>
        {actionHref && actionLabel && (
          <a className="primary-button inline" href={actionHref}>
            {actionIcon}
            {actionLabel}
          </a>
        )}
        {extraAction}
      </div>
    </div>
  );
}

function PanelHeader({ icon, title, meta }: { icon: React.ReactNode; title: string; meta?: string }) {
  return (
    <header className="panel-header">
      <h2>
        {icon}
        {title}
      </h2>
      {meta && <span>{meta}</span>}
    </header>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: "teal" | "blue" | "amber" | "red";
}) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

function IncidentTable({
  incidents,
  compact = false,
  onRowClick,
  focusedIncidentId
}: {
  incidents: Incident[];
  compact?: boolean;
  onRowClick?: (incident: Incident) => void;
  focusedIncidentId?: number;
}) {
  if (incidents.length === 0) {
    return <div className="empty-state">Sin incidentes para mostrar.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="incident-table">
        <thead>
          <tr>
            <th>Distrito</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Severidad</th>
            {!compact && <th>Fuente</th>}
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => {
            const isFocused = incident.id === focusedIncidentId;
            return (
              <tr
                key={incident.id}
                onClick={() => onRowClick?.(incident)}
                className={onRowClick ? `clickable-row ${isFocused ? "is-focused" : ""}` : ""}
                style={isFocused ? { backgroundColor: "rgba(20, 184, 166, 0.15)", borderLeft: "4px solid var(--primary)" } : {}}
              >
                <td className="strong-cell">{incident.district}</td>
                <td>
                  <span className={`type-badge type-${slugify(incident.incidentType)}`}>{incident.incidentType}</span>
                </td>
                <td>{truncate(incident.description, compact ? 52 : 72)}</td>
                <td>
                  <Severity value={incident.severity} />
                </td>
                {!compact && <td>{incident.source}</td>}
                <td>{formatDateTime(incident.dateReported)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface InteractiveStatsProps {
  counts: { label: string; value: number }[];
}

const PALETTE = [
  "#2563eb", // Blue
  "#0f766e", // Teal
  "#d97706", // Amber
  "#dc2626", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#10b981", // Emerald
];

function InteractiveStats({ counts }: InteractiveStatsProps) {
  const [activeTab, setActiveTab] = useState<"list" | "donut" | "bar">("donut");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = counts.reduce((sum, item) => sum + item.value, 0);

  if (counts.length === 0 || total === 0) {
    return <div className="empty-state">Sin distribución disponible.</div>;
  }

  // Radius = 50, Stroke Width = 16, SVG size = 200x200
  // Circumference = 2 * PI * r = 2 * PI * 50 = 314.159
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.159
  
  let accumulatedOffset = 0;
  const donutSegments = counts.map((item, index) => {
    const percentage = item.value / total;
    const dashLength = percentage * circumference;
    const offset = accumulatedOffset;
    accumulatedOffset -= dashLength;

    const color = PALETTE[index % PALETTE.length];

    return {
      ...item,
      percentage: Math.round(percentage * 100),
      dashLength,
      offset,
      color,
      index,
    };
  });

  const selectedSegment = hoveredIndex !== null ? donutSegments[hoveredIndex] : null;

  // Bar Chart calculations
  const maxVal = Math.max(...counts.map((c) => c.value), 1);
  const barChartHeight = 130;
  const barChartWidth = 280;
  const paddingLeft = 20;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 20;

  const barCount = counts.length;
  const chartInnerWidth = barChartWidth - paddingLeft - paddingRight;
  const chartInnerHeight = barChartHeight - paddingTop - paddingBottom;
  const barGap = 12;
  const barWidth = Math.max((chartInnerWidth - barGap * (barCount - 1)) / barCount, 12);

  return (
    <div className="interactive-stats-widget">
      <div className="chart-tabs">
        <button
          className={`chart-tab ${activeTab === "list" ? "is-active" : ""}`}
          onClick={() => setActiveTab("list")}
          type="button"
        >
          <List size={16} />
          Lista
        </button>
        <button
          className={`chart-tab ${activeTab === "donut" ? "is-active" : ""}`}
          onClick={() => setActiveTab("donut")}
          type="button"
        >
          <PieChart size={16} />
          Dona
        </button>
        <button
          className={`chart-tab ${activeTab === "bar" ? "is-active" : ""}`}
          onClick={() => setActiveTab("bar")}
          type="button"
        >
          <BarChart3 size={16} />
          Barras
        </button>
      </div>

      {activeTab === "list" && (
        <div className="distribution-list">
          {counts.map((item, index) => {
            const percentage = Math.round((item.value / total) * 100);
            const color = PALETTE[index % PALETTE.length];

            return (
              <div className="distribution-item" key={item.label}>
                <div>
                  <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, display: "inline-block" }} />
                    {item.label}
                  </strong>
                  <span>{item.value} casos</span>
                </div>
                <div className="bar-track" aria-label={`${item.label}: ${percentage}%`}>
                  <span style={{ width: `${percentage}%`, background: color }} />
                </div>
                <b>{percentage}%</b>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "donut" && (
        <div className="donut-chart-container">
          <div style={{ position: "relative", width: "200px", height: "200px" }}>
            <svg className="donut-chart-svg" viewBox="0 0 200 200">
              {donutSegments.map((segment) => (
                <circle
                  key={segment.label}
                  cx="100"
                  cy="100"
                  r={radius}
                  className={`donut-segment ${hoveredIndex === segment.index ? "is-active" : ""}`}
                  stroke={segment.color}
                  strokeDasharray={`${segment.dashLength} ${circumference - segment.dashLength}`}
                  strokeDashoffset={segment.offset}
                  onMouseEnter={() => setHoveredIndex(segment.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}
            </svg>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                textAlign: "center",
                padding: "20px",
              }}
            >
              <span className="section-kicker" style={{ fontSize: "0.68rem", marginBottom: "2px" }}>
                {selectedSegment ? truncate(selectedSegment.label, 12) : "Total"}
              </span>
              <strong style={{ fontSize: "1.4rem", color: "var(--ink)", lineHeight: 1.1 }}>
                {selectedSegment ? `${selectedSegment.value}` : `${total}`}
              </strong>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: selectedSegment ? selectedSegment.color : "var(--muted)", marginTop: "2px" }}>
                {selectedSegment ? `${selectedSegment.percentage}%` : "Casos"}
              </span>
            </div>
          </div>

          <div className="donut-legend">
            {donutSegments.map((segment) => (
              <div
                key={segment.label}
                className={`donut-legend-item ${hoveredIndex === segment.index ? "is-active" : ""}`}
                onMouseEnter={() => setHoveredIndex(segment.index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span className="donut-legend-dot" style={{ background: segment.color }} />
                <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", fontWeight: 600, color: hoveredIndex === segment.index ? "var(--ink)" : "var(--muted)" }}>
                  {segment.label}
                </span>
                <span style={{ marginLeft: "auto", fontWeight: 700 }}>{segment.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "bar" && (
        <div className="bar-chart-container">
          <svg className="bar-chart-svg" viewBox={`0 0 ${barChartWidth} ${barChartHeight}`}>
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingTop + chartInnerHeight * (1 - ratio);
              return (
                <line
                  key={ratio}
                  x1={paddingLeft}
                  y1={y}
                  x2={barChartWidth - paddingRight}
                  y2={y}
                  stroke="var(--line)"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.6"
                />
              );
            })}

            {counts.map((item, index) => {
              const barHeight = (item.value / maxVal) * chartInnerHeight;
              const x = paddingLeft + index * (barWidth + barGap);
              const y = paddingTop + chartInnerHeight - barHeight;
              const color = PALETTE[index % PALETTE.length];

              return (
                <g key={item.label}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="3"
                    className={`bar-chart-bar ${hoveredIndex === index ? "is-active" : ""}`}
                    fill={color}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                  {/* Value on Top */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    className="bar-chart-value"
                    opacity={hoveredIndex === index || barHeight > 20 ? 1 : 0}
                    style={{ transition: "opacity 0.2s" }}
                  >
                    {item.value}
                  </text>
                  {/* Axis Label */}
                  <text
                    x={x + barWidth / 2}
                    y={barChartHeight - 4}
                    className="bar-chart-label"
                    style={{
                      fontSize: "7px",
                      fill: hoveredIndex === index ? "var(--ink)" : "var(--muted)",
                      fontWeight: hoveredIndex === index ? 700 : 500
                    }}
                  >
                    {truncate(item.label, 8)}
                  </text>
                </g>
              );
            })}

            {/* Bottom Axis Line */}
            <line
              x1={paddingLeft}
              y1={paddingTop + chartInnerHeight}
              x2={barChartWidth - paddingRight}
              y2={paddingTop + chartInnerHeight}
              className="bar-chart-axis"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

function LeafletHeatmap({ points, focusedPoint }: { points: HeatmapPoint[]; focusedPoint: HeatmapPoint | null }) {
  const mapId = useMemo(() => `street-map-${Math.random().toString(36).slice(2)}`, []);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!window.L) {
      return;
    }

    const L = window.L;
    const map = L.map(mapId, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([-12.0464, -77.0428], 11);

    mapRef.current = map;
    markersRef.current = {};

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 20
    }).addTo(map);

    if (points.length > 0) {
      const heatPoints = points.map((point) => [point.lat, point.lng, point.intensity]);
      L.heatLayer(heatPoints, {
        radius: 32,
        blur: 22,
        maxZoom: 17,
        minOpacity: 0.35,
        gradient: {
          0.2: "#2563eb",
          0.45: "#0f766e",
          0.65: "#d97706",
          0.85: "#dc2626"
        }
      }).addTo(map);

      points.forEach((point) => {
        const marker = L.circleMarker([point.lat, point.lng], {
          radius: 6,
          fillColor: severityColor(point.intensity),
          color: "#111827",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.85
        }).addTo(map);

        marker.bindPopup(`
          <strong>${escapeHtml(point.district)}</strong><br>
          Tipo: ${escapeHtml(point.type)}<br>
          Severidad: ${point.intensity}/5<br>
          Fecha: ${escapeHtml(point.date)}<br>
          ${escapeHtml(point.description)}
        `);

        if (point.id) {
          markersRef.current[point.id] = marker;
        }
      });

      const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
      map.fitBounds(bounds.pad(0.18), { maxZoom: 13 });
    }

    const legend = L.control({ position: "bottomright" });
    legend.onAdd = () => {
      const div = L.DomUtil.create("div", "leaflet-legend");
      div.innerHTML = `
        <strong>Severidad</strong>
        <span><i style="background:${severityColor(1)}"></i>1 Baja</span>
        <span><i style="background:${severityColor(3)}"></i>3 Media</span>
        <span><i style="background:${severityColor(5)}"></i>5 Alta</span>
      `;
      return div;
    };
    legend.addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, [mapId, points]);

  useEffect(() => {
    if (focusedPoint && mapRef.current) {
      const map = mapRef.current;
      map.setView([focusedPoint.lat, focusedPoint.lng], 15, { animate: true });
      if (focusedPoint.id && markersRef.current[focusedPoint.id]) {
        markersRef.current[focusedPoint.id].openPopup();
      }
    }
  }, [focusedPoint]);

  return <div id={mapId} className="map-canvas" />;
}

function Severity({ value }: { value: number }) {
  return (
    <span className="severity" aria-label={`Severidad ${value} de 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={14}
          fill={index < value ? "currentColor" : "none"}
          strokeWidth={2}
          className={index < value ? "is-filled" : ""}
        />
      ))}
    </span>
  );
}

function countActiveFilters(filters: HeatmapData["filters"]) {
  return Object.values(filters).filter(Boolean).length;
}

function uniqueCount(incidents: Incident[], key: "district") {
  return new Set(incidents.map((incident) => incident[key])).size;
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function severityColor(severity: number) {
  if (severity >= 5) {
    return "#dc2626";
  }

  if (severity >= 4) {
    return "#ea580c";
  }

  if (severity >= 3) {
    return "#d97706";
  }

  if (severity >= 2) {
    return "#0f766e";
  }

  return "#2563eb";
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function translateFlash(message: string) {
  const messages: Record<string, string> = {
    "Login successful!": "Inicio de sesión correcto.",
    "Invalid username or password": "Usuario o contraseña inválidos.",
    "You have been logged out": "Sesión cerrada.",
    "Username already exists": "El usuario ya existe.",
    "Email already registered": "El email ya está registrado.",
    "Registration successful! Please login.": "Registro completado. Inicia sesión."
  };

  return messages[message] ?? message;
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App data={appData} />
  </React.StrictMode>
);

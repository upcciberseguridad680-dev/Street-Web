import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Filter,
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
  X
} from "lucide-react";
import "./styles.css";
import type {
  AppData,
  DashboardData,
  FlashMessage,
  HeatmapData,
  HeatmapPoint,
  Incident,
  PageName,
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
          {user ? (
            <>
              <NavLink href="/dashboard" active={page === "dashboard"} icon={<LayoutDashboard size={18} />}>
                Panel
              </NavLink>
              <NavLink href="/heatmap" active={page === "heatmap"} icon={<MapPinned size={18} />}>
                Mapa
              </NavLink>
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

  return (
    <section className="workspace">
      <PageHeader
        kicker="Panel operativo"
        title="Resumen de seguridad"
        description="Indicadores actualizados de incidentes reportados."
        actionHref="/heatmap"
        actionLabel="Ver mapa"
        actionIcon={<MapPinned size={18} />}
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
          <TypeDistribution counts={dashboard.typeCounts} />
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
        <LeafletHeatmap points={heatmap.heatmapPoints} />
      </section>

      <section className="surface data-panel">
        <PanelHeader icon={<Search size={20} />} title="Detalle de incidentes" meta={`${heatmap.incidents.length} registros`} />
        <IncidentTable incidents={heatmap.incidents} />
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
  actionIcon
}: {
  kicker: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <div className="section-kicker">{kicker}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actionHref && actionLabel && (
        <a className="primary-button inline" href={actionHref}>
          {actionIcon}
          {actionLabel}
        </a>
      )}
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

function IncidentTable({ incidents, compact = false }: { incidents: Incident[]; compact?: boolean }) {
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
          {incidents.map((incident) => (
            <tr key={incident.id}>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TypeDistribution({ counts }: { counts: { label: string; value: number }[] }) {
  const total = counts.reduce((sum, item) => sum + item.value, 0);

  if (counts.length === 0 || total === 0) {
    return <div className="empty-state">Sin distribución disponible.</div>;
  }

  return (
    <div className="distribution-list">
      {counts.map((item) => {
        const percentage = Math.round((item.value / total) * 100);

        return (
          <div className="distribution-item" key={item.label}>
            <div>
              <strong>{item.label}</strong>
              <span>{item.value} casos</span>
            </div>
            <div className="bar-track" aria-label={`${item.label}: ${percentage}%`}>
              <span style={{ width: `${percentage}%` }} />
            </div>
            <b>{percentage}%</b>
          </div>
        );
      })}
    </div>
  );
}

function LeafletHeatmap({ points }: { points: HeatmapPoint[] }) {
  const mapId = useMemo(() => `street-map-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    if (!window.L) {
      return;
    }

    const L = window.L;
    const map = L.map(mapId, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([-12.0464, -77.0428], 11);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 20
    }).addTo(map);

    if (points.length > 0) {
      const heatPoints = points.map((point) => [point.lat, point.lng, point.intensity]);
      L.heatLayer(heatPoints, {
        radius: 28,
        blur: 18,
        maxZoom: 17,
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
    };
  }, [mapId, points]);

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

import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Target,
  Users,
  BarChart3,
  Briefcase,
  Settings,
  Sparkles,
  ChevronRight,
  Cpu,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Territory Overview", path: "/dashboard" },
  { icon: Search, label: "Research Hub", path: "/dashboard/research-hub" },
  { icon: Cpu, label: "Agent Swarm", path: "/dashboard/agent-swarm" },
  { icon: Target, label: "War Room", path: "/dashboard/war-room" },
  {
    icon: BarChart3,
    label: "Analytics & Automation",
    path: "/dashboard/analytics",
  },
  { icon: Briefcase, label: "Integrations", path: "/dashboard/integrations" },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div
          style={{
            padding: "20px 16px 8px",
            borderBottom: "1px solid rgba(167,176,222,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background:
                  "linear-gradient(135deg, var(--primary), var(--tertiary))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={14} color="#fff" />
            </div>
            <span
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 800,
                fontSize: "0.9rem",
                color: "var(--on-background)",
                letterSpacing: "-0.02em",
              }}
            >
              PG Machine
            </span>
          </div>
          <p
            style={{
              fontSize: "0.65rem",
              color: "var(--on-surface-variant)",
              paddingLeft: 2,
            }}
          >
            Nordic Enterprise Sales
          </p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 0" }}>
          <p
            style={{
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--on-surface-variant)",
              padding: "8px 24px 4px",
              textTransform: "uppercase",
              fontFamily: "var(--font-label)",
            }}
          >
            Workspace
          </p>
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/dashboard" &&
                location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid rgba(167,176,222,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, var(--primary), var(--secondary-brand))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-label)",
              fontWeight: 700,
              fontSize: "0.65rem",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            AJ
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--on-surface)",
                fontFamily: "var(--font-headline)",
              }}
              className="truncate"
            >
              Alex Johnson
            </p>
            <p
              style={{
                fontSize: "0.65rem",
                color: "var(--on-surface-variant)",
              }}
              className="truncate"
            >
              Enterprise AE · Nordics
            </p>
          </div>
          <Settings
            size={14}
            color="var(--on-surface-variant)"
            style={{ flexShrink: 0 }}
          />
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

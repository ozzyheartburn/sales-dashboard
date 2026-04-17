import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Workflow,
  Settings,
  Sparkles,
  ChevronDown,
  Shield,
  LogOut,
  ArrowLeftRight,
  Menu,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  platform_admin: "Platform Admin",
  company_admin: "Company Admin",
  team_leader: "Team Leader",
  end_user: "Sales Rep",
};

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Users & Roles", path: "/admin/users" },
  { icon: Building2, label: "Tenants", path: "/admin/tenants" },
  { icon: Workflow, label: "Workflows", path: "/admin/workflows" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, credential, logout } = useAuth();
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSwitchRole = (
    role: string,
    tenant: string,
    teamName: string | null,
  ) => {
    if (!user || !credential) return;
    const updatedUser = {
      ...user,
      role,
      tenant,
      teamName,
      isPlatformAdmin: role === "platform_admin",
    };
    login(updatedUser, credential);
    setRoleSwitcherOpen(false);

    if (role === "platform_admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  const availableRoles = user?.availableRoles || [];
  const otherRoles = availableRoles.filter(
    (ar) => ar.role !== user?.role || ar.tenant !== user?.tenant,
  );

  return (
    <div className="app-layout dark">
      {/* Mobile Top Bar */}
      <div className="mobile-topbar">
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Menu size={22} color="var(--on-surface)" />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background:
                "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={12} color="#fff" />
          </div>
          <span
            style={{
              fontFamily: "var(--font-headline)",
              fontWeight: 800,
              fontSize: "0.85rem",
              color: "var(--on-background)",
            }}
          >
            PG Machine Admin
          </span>
        </div>
      </div>

      {/* Sidebar Backdrop (mobile) */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}
        style={{
          background: "var(--surface-container-lowest)",
          borderRight: "1px solid rgba(167,176,222,0.10)",
        }}
      >
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
                  "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Shield size={14} color="#fff" />
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
            Admin Console
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
            Administration
          </p>
          {adminNavItems.map((item) => {
            const isActive =
              item.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User + Role Switcher */}
        <div
          style={{
            borderTop: "1px solid rgba(167,176,222,0.08)",
            position: "relative",
          }}
        >
          {/* Role Switcher Dropdown */}
          <AnimatePresence>
            {roleSwitcherOpen && otherRoles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 8,
                  right: 8,
                  background: "var(--surface-container-lowest)",
                  border: "1px solid rgba(167,176,222,0.15)",
                  borderRadius: 12,
                  padding: 6,
                  boxShadow: "0 -4px 24px rgba(0,0,0,0.3)",
                  zIndex: 100,
                  marginBottom: 4,
                }}
              >
                <p
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: "var(--on-surface-variant)",
                    padding: "4px 10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: "var(--font-label)",
                  }}
                >
                  Switch Role
                </p>
                {otherRoles.map((ar, i) => (
                  <button
                    key={`${ar.tenant}-${ar.role}-${i}`}
                    onClick={() =>
                      handleSwitchRole(ar.role, ar.tenant, ar.teamName)
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "8px 10px",
                      border: "none",
                      background: "transparent",
                      borderRadius: 8,
                      cursor: "pointer",
                      transition: "background 100ms",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(167,176,222,0.08)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <ArrowLeftRight
                      size={12}
                      color="var(--on-surface-variant)"
                    />
                    <div>
                      <p
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: "var(--on-surface)",
                          fontFamily: "var(--font-headline)",
                        }}
                      >
                        {ROLE_LABELS[ar.role] || ar.role}
                      </p>
                      <p
                        style={{
                          fontSize: "0.6rem",
                          color: "var(--on-surface-variant)",
                        }}
                      >
                        {ar.tenant}
                        {ar.teamName ? ` · ${ar.teamName}` : ""}
                      </p>
                    </div>
                  </button>
                ))}
                <div
                  style={{
                    borderTop: "1px solid rgba(167,176,222,0.08)",
                    marginTop: 4,
                    paddingTop: 4,
                  }}
                >
                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "8px 10px",
                      border: "none",
                      background: "transparent",
                      borderRadius: 8,
                      cursor: "pointer",
                      transition: "background 100ms",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(211,47,47,0.08)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <LogOut size={12} color="var(--error)" />
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "var(--error)",
                        fontFamily: "var(--font-headline)",
                      }}
                    >
                      Sign Out
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
            style={{
              width: "100%",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
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
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--on-surface)",
                  fontFamily: "var(--font-headline)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.name || user?.email || "User"}
              </p>
              <p
                style={{
                  fontSize: "0.65rem",
                  color: "var(--tertiary)",
                  fontWeight: 600,
                  fontFamily: "var(--font-label)",
                }}
              >
                {ROLE_LABELS[user?.role || ""] || user?.role || "User"}
              </p>
            </div>
            <ChevronDown
              size={14}
              color="var(--on-surface-variant)"
              style={{
                flexShrink: 0,
                transform: roleSwitcherOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main
        className="main-content"
        style={{ background: "var(--background)", color: "var(--on-surface)" }}
      >
        <Outlet />
      </main>
    </div>
  );
}

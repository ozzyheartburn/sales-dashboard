import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth, buildAuthHeaders, type AuthUser } from "../App";
import { motion, AnimatePresence } from "motion/react";
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
  Brain,
  Send,
  Loader2,
  X,
  ExternalLink,
  Menu,
  ChevronDown,
  ArrowLeftRight,
  LogOut,
} from "lucide-react";

const allNavItems = [
  {
    icon: LayoutDashboard,
    label: "Territory Overview",
    path: "/dashboard",
    moduleKey: "dashboard",
  },
  {
    icon: Search,
    label: "Research Hub",
    path: "/dashboard/research-hub",
    moduleKey: "research-hub",
  },
  {
    icon: Target,
    label: "War Room",
    path: "/dashboard/war-room",
    moduleKey: "war-room",
  },
  {
    icon: BarChart3,
    label: "Analytics & Automation",
    path: "/dashboard/analytics",
    moduleKey: "analytics",
  },
  {
    icon: Briefcase,
    label: "Integrations",
    path: "/dashboard/integrations",
    moduleKey: "integrations",
  },
  {
    icon: Settings,
    label: "Admin Console",
    path: "/admin",
    moduleKey: "admin",
  },
];

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, login, credential } = useAuth();
  const { userModules } = useAuth();
  const authHeaders = buildAuthHeaders(user);
  const navItems = allNavItems.filter((item) =>
    userModules.includes(item.moduleKey),
  );
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiSources, setAiSources] = useState<
    {
      companyName: string;
      website: string;
      rrfScore?: number;
      priority?: string;
    }[]
  >([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [topAccounts, setTopAccounts] = useState<
    {
      companyName: string;
      buyingSignalScore: number;
      priority: string;
      status?: string;
      updatedAt?: string;
    }[]
  >([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [tenantUsers, setTenantUsers] = useState<
    { email: string; name?: string; role?: string; teamName?: string | null }[]
  >([]);
  const [impersonationSource, setImpersonationSource] =
    useState<AuthUser | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    try {
      const raw = localStorage.getItem("impersonation_source_user");
      if (!raw) {
        setImpersonationSource(null);
        return;
      }
      setImpersonationSource(JSON.parse(raw));
    } catch {
      setImpersonationSource(null);
      localStorage.removeItem("impersonation_source_user");
    }
  }, [user?.email, user?.role]);

  // Platform admins can impersonate users inside their current company tenant.
  useEffect(() => {
    if (!user?.isPlatformAdmin || !user?.tenant) {
      setTenantUsers([]);
      return;
    }
    fetch(`${API_URL}/api/tenants/${encodeURIComponent(user.tenant)}/users`, {
      headers: authHeaders,
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const filtered = (Array.isArray(data) ? data : []).filter(
          (u) =>
            u && u.email && u.email.toLowerCase() !== user.email.toLowerCase(),
        );
        setTenantUsers(filtered);
      })
      .catch(() => setTenantUsers([]));
  }, [user?.isPlatformAdmin, user?.tenant, user?.email]);

  // Fetch sidebar accounts: prioritize pending/new research, then top signal.
  useEffect(() => {
    fetch(`${API_URL}/api/accounts`, { headers: authHeaders })
      .then((res) => res.json())
      .then(
        (
          data: {
            companyName: string;
            buyingSignalScore: number;
            priority: string;
            status?: string;
            updatedAt?: string;
          }[],
        ) => {
          const sorted = [...data]
            .filter((a) => a.companyName)
            .sort((a, b) => {
              const aPending = a.status === "pending_research" ? 1 : 0;
              const bPending = b.status === "pending_research" ? 1 : 0;
              if (aPending !== bPending) return bPending - aPending;

              const scoreDiff =
                (b.buyingSignalScore || 0) - (a.buyingSignalScore || 0);
              if (scoreDiff !== 0) return scoreDiff;

              const aUpdated = new Date(a.updatedAt || 0).getTime();
              const bUpdated = new Date(b.updatedAt || 0).getTime();
              return bUpdated - aUpdated;
            })
            .slice(0, 10);
          setTopAccounts(sorted);
        },
      )
      .catch(() => {});
  }, [user?.tenant]);

  const handleAiSubmit = async () => {
    if (!aiQuery.trim() || aiLoading) return;
    setAiLoading(true);
    setAiAnswer("");
    setAiSources([]);
    try {
      const res = await fetch(`${API_URL}/api/hybrid-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ query: aiQuery, topK: 5 }),
      });
      const data = await res.json();
      setAiAnswer(data.answer || "No answer returned.");
      setAiSources(data.sources || []);
    } catch {
      setAiAnswer("Failed to reach the AI service. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

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
                "linear-gradient(135deg, var(--primary), var(--tertiary))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={12} color="#fff" />
          </div>
          <span
            style={{
              fontFamily: "var(--font-headline)",
              fontWeight: 800,
              fontSize: "0.85rem",
              color: "var(--on-background)",
            }}
          >
            PG Machine
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
              <div key={item.path}>
                <button
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <item.icon size={15} />
                  {item.label}
                </button>

                {/* Top 5 accounts under War Room */}
                {item.path === "/dashboard/war-room" &&
                  isActive &&
                  topAccounts.length > 0 && (
                    <div style={{ padding: "2px 0 6px 0" }}>
                      {topAccounts.map((acc, i) => (
                        <button
                          key={acc.companyName}
                          onClick={() =>
                            navigate(
                              `/dashboard/war-room?account=${encodeURIComponent(acc.companyName)}`,
                            )
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                            padding: "4px 24px 4px 44px",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            transition: "background 100ms",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(18,74,241,0.05)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <span
                            style={{
                              fontSize: "0.68rem",
                              color: "var(--on-surface-variant)",
                              fontFamily: "var(--font-body)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 110,
                            }}
                          >
                            {acc.companyName}
                          </span>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 800,
                              fontFamily: "var(--font-label)",
                              color:
                                acc.status === "pending_research"
                                  ? "var(--tertiary)"
                                  : "var(--primary)",
                              flexShrink: 0,
                              marginLeft: 6,
                            }}
                          >
                            {acc.status === "pending_research"
                              ? "new"
                              : acc.buyingSignalScore}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
              </div>
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
            {roleSwitcherOpen &&
              (() => {
                const availableRoles = user?.availableRoles || [];
                const ROLE_LABELS: Record<string, string> = {
                  platform_admin: "Admin",
                  company_admin: "Company Admin",
                  sales_leader: "Sales Leader",
                  team_leader: "Team Leader",
                  end_user: "Sales Rep",
                  sdr: "SDR",
                  sdr_manager: "SDR Manager",
                };
                return (
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
                    {user?.isPlatformAdmin && tenantUsers.length > 0 && (
                      <>
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
                          Impersonate User
                        </p>
                        {tenantUsers.map((tu) => (
                          <button
                            key={`imp-${tu.email}`}
                            onClick={() => {
                              if (!user || !credential) return;
                              if (
                                !localStorage.getItem(
                                  "impersonation_source_user",
                                )
                              ) {
                                localStorage.setItem(
                                  "impersonation_source_user",
                                  JSON.stringify(user),
                                );
                              }
                              const updatedUser = {
                                ...user,
                                email: tu.email.toLowerCase(),
                                name: tu.name || tu.email,
                                role: tu.role || "end_user",
                                teamName: tu.teamName || null,
                                isPlatformAdmin: false,
                                customer_user_id_rbac: tu.role || "end_user",
                                customer_user_id: null,
                              };
                              login(updatedUser, credential);
                              setRoleSwitcherOpen(false);
                              navigate("/dashboard");
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
                            <div style={{ flex: 1 }}>
                              <p
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  color: "var(--on-surface)",
                                  fontFamily: "var(--font-headline)",
                                }}
                              >
                                {tu.name || tu.email}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.6rem",
                                  color: "var(--on-surface-variant)",
                                }}
                              >
                                {ROLE_LABELS[tu.role || "end_user"] ||
                                  tu.role ||
                                  "Sales Rep"}
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
                        />
                      </>
                    )}

                    {!user?.isPlatformAdmin && impersonationSource && (
                      <>
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
                          Impersonation
                        </p>
                        <button
                          onClick={() => {
                            if (!credential || !impersonationSource) return;
                            login(impersonationSource, credential);
                            localStorage.removeItem(
                              "impersonation_source_user",
                            );
                            setImpersonationSource(null);
                            setRoleSwitcherOpen(false);
                            navigate("/admin");
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            width: "100%",
                            padding: "8px 10px",
                            border: "none",
                            background: "rgba(18,74,241,0.08)",
                            borderRadius: 8,
                            cursor: "pointer",
                            transition: "background 100ms",
                            textAlign: "left",
                          }}
                        >
                          <ArrowLeftRight size={12} color="var(--primary)" />
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              color: "var(--primary)",
                              fontFamily: "var(--font-headline)",
                            }}
                          >
                            Stop Impersonating
                          </span>
                        </button>
                        <div
                          style={{
                            borderTop: "1px solid rgba(167,176,222,0.08)",
                            marginTop: 4,
                            paddingTop: 4,
                          }}
                        />
                      </>
                    )}

                    {availableRoles.length > 0 && (
                      <>
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
                        {availableRoles.map((ar, i) => {
                          const isActive =
                            ar.role === user?.role &&
                            ar.tenant === user?.tenant;
                          return (
                            <button
                              key={`${ar.tenant}-${ar.role}-${i}`}
                              onClick={() => {
                                if (isActive || !user || !credential) {
                                  setRoleSwitcherOpen(false);
                                  return;
                                }
                                const updatedUser = {
                                  ...user,
                                  role: ar.role,
                                  tenant: ar.tenant,
                                  teamName: ar.teamName,
                                  isPlatformAdmin: ar.role === "platform_admin",
                                };
                                login(updatedUser, credential);
                                setRoleSwitcherOpen(false);
                                if (ar.role === "platform_admin") {
                                  navigate("/admin");
                                } else {
                                  navigate("/dashboard");
                                }
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                width: "100%",
                                padding: "8px 10px",
                                border: "none",
                                background: isActive
                                  ? "rgba(18,74,241,0.1)"
                                  : "transparent",
                                borderRadius: 8,
                                cursor: isActive ? "default" : "pointer",
                                transition: "background 100ms",
                                textAlign: "left",
                              }}
                              onMouseEnter={(e) => {
                                if (!isActive)
                                  e.currentTarget.style.background =
                                    "rgba(167,176,222,0.08)";
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive)
                                  e.currentTarget.style.background =
                                    "transparent";
                              }}
                            >
                              <ArrowLeftRight
                                size={12}
                                color={
                                  isActive
                                    ? "var(--primary)"
                                    : "var(--on-surface-variant)"
                                }
                              />
                              <div style={{ flex: 1 }}>
                                <p
                                  style={{
                                    fontSize: "0.72rem",
                                    fontWeight: 600,
                                    color: isActive
                                      ? "var(--primary)"
                                      : "var(--on-surface)",
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
                              {isActive && (
                                <span
                                  style={{
                                    fontSize: "0.55rem",
                                    fontWeight: 700,
                                    color: "var(--primary)",
                                    fontFamily: "var(--font-label)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  Active
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </>
                    )}
                    <div
                      style={{
                        borderTop:
                          availableRoles.length > 0
                            ? "1px solid rgba(167,176,222,0.08)"
                            : "none",
                        marginTop: availableRoles.length > 0 ? 4 : 0,
                        paddingTop: availableRoles.length > 0 ? 4 : 0,
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
                );
              })()}
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
                  color: "var(--on-surface-variant)",
                  fontWeight: 600,
                  fontFamily: "var(--font-label)",
                }}
              >
                {(
                  {
                    platform_admin: "Admin",
                    company_admin: "Company Admin",
                    sales_leader: "Sales Leader",
                    team_leader: "Team Leader",
                    end_user: "Sales Rep",
                    sdr: "SDR",
                    sdr_manager: "SDR Manager",
                  } as Record<string, string>
                )[user?.role || ""] ||
                  user?.role ||
                  "User"}
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

      {/* Floating AI Button */}
      {!aiOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setAiOpen(true)}
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            background:
              "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
            boxShadow: "0 4px 24px rgba(135, 32, 222, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <Brain size={24} color="#fff" />
        </motion.button>
      )}

      {/* AI Slide-out Panel */}
      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="ai-panel-mobile"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: 400,
              background: "var(--surface-container-lowest)",
              borderLeft: "1px solid rgba(167,176,222,0.12)",
              zIndex: 1001,
              display: "flex",
              flexDirection: "column",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
            }}
          >
            {/* Panel Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid rgba(167,176,222,0.10)",
                background:
                  "linear-gradient(135deg, rgba(135,32,222,0.08), rgba(78,69,228,0.08))",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Brain size={18} color="var(--tertiary)" />
                <span
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "var(--on-background)",
                  }}
                >
                  Ask AI
                </span>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} color="var(--on-surface-variant)" />
              </button>
            </div>

            {/* Chat Body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {!aiAnswer && !aiLoading && (
                <div style={{ textAlign: "center", paddingTop: 48 }}>
                  <Brain
                    size={40}
                    color="var(--on-surface-variant)"
                    style={{ opacity: 0.3, marginBottom: 12 }}
                  />
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--on-surface-variant)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Ask anything about your accounts, research, or market
                    intelligence.
                  </p>
                </div>
              )}

              {aiLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 16,
                  }}
                >
                  <Loader2
                    size={18}
                    color="var(--tertiary)"
                    className="spin"
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  <span
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--on-surface-variant)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Searching intelligence database...
                  </span>
                </motion.div>
              )}

              {aiAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Answer */}
                  <div
                    style={{
                      background: "rgba(167,176,222,0.06)",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 16,
                      border: "1px solid rgba(167,176,222,0.08)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.82rem",
                        lineHeight: 1.7,
                        color: "var(--on-surface)",
                        fontFamily: "var(--font-body)",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {aiAnswer}
                    </p>
                  </div>

                  {/* Sources */}
                  {aiSources.length > 0 && (
                    <div>
                      <p
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "var(--on-surface-variant)",
                          fontFamily: "var(--font-label)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: 8,
                        }}
                      >
                        Sources
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {aiSources.map((src, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 14px",
                              borderRadius: 10,
                              background: "rgba(167,176,222,0.04)",
                              border: "1px solid rgba(167,176,222,0.06)",
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  fontSize: "0.78rem",
                                  fontWeight: 600,
                                  color: "var(--on-surface)",
                                  fontFamily: "var(--font-headline)",
                                }}
                              >
                                {src.companyName}
                              </p>
                              {src.rrfScore !== undefined && (
                                <p
                                  style={{
                                    fontSize: "0.65rem",
                                    color: "var(--on-surface-variant)",
                                    fontFamily: "var(--font-label)",
                                    marginTop: 2,
                                  }}
                                >
                                  Relevance: {(src.rrfScore * 100).toFixed(1)}%
                                </p>
                              )}
                            </div>
                            {src.website && (
                              <a
                                href={
                                  src.website.startsWith("http")
                                    ? src.website
                                    : `https://${src.website}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "var(--primary)",
                                  display: "flex",
                                }}
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div
              style={{
                padding: "14px 20px",
                borderTop: "1px solid rgba(167,176,222,0.10)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  background: "rgba(167,176,222,0.06)",
                  borderRadius: 12,
                  padding: "6px 6px 6px 14px",
                  border: "1px solid rgba(167,176,222,0.10)",
                }}
              >
                <input
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAiSubmit()}
                  placeholder="Ask about accounts, signals, research..."
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--on-surface)",
                    fontSize: "0.82rem",
                    fontFamily: "var(--font-body)",
                  }}
                />
                <button
                  onClick={handleAiSubmit}
                  disabled={aiLoading || !aiQuery.trim()}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: "none",
                    cursor:
                      aiLoading || !aiQuery.trim() ? "default" : "pointer",
                    background:
                      aiLoading || !aiQuery.trim()
                        ? "rgba(167,176,222,0.08)"
                        : "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    opacity: aiLoading || !aiQuery.trim() ? 0.4 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  <Send size={16} color="#fff" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

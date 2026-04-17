import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth, buildAuthHeaders } from "../App";
import {
  Users,
  Building2,
  Database,
  Activity,
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";

interface TenantSummary {
  _id: string;
  slug: string;
  displayName: string;
  status: string;
  createdAt: string;
}

interface StatsData {
  totalTenants: number;
  activeTenants: number;
  totalAccounts: number;
  systemStatus: "healthy" | "degraded" | "down";
  tenants: TenantSummary[];
}

export function AdminDashboard() {
  const { user } = useAuth();
  const authHeaders = buildAuthHeaders(user);
  const API_URL = import.meta.env.VITE_API_URL || "";

  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [tenantsRes, accountsRes, healthRes] = await Promise.all([
          fetch(`${API_URL}/api/tenants`, { headers: authHeaders }),
          fetch(`${API_URL}/api/accounts`, { headers: authHeaders }),
          fetch(`${API_URL}/api/health`),
        ]);

        const tenants: TenantSummary[] = tenantsRes.ok
          ? await tenantsRes.json()
          : [];
        const accounts = accountsRes.ok ? await accountsRes.json() : [];
        const health = healthRes.ok ? await healthRes.json() : null;

        setStats({
          totalTenants: tenants.length,
          activeTenants: tenants.filter((t) => t.status === "active").length,
          totalAccounts: Array.isArray(accounts) ? accounts.length : 0,
          systemStatus: health?.status === "ok" ? "healthy" : "degraded",
          tenants,
        });
      } catch {
        setStats({
          totalTenants: 0,
          activeTenants: 0,
          totalAccounts: 0,
          systemStatus: "down",
          tenants: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const kpiCards = stats
    ? [
        {
          label: "Active Tenants",
          value: stats.activeTenants,
          total: stats.totalTenants,
          icon: Building2,
          color: "var(--primary)",
          bg: "rgba(18,74,241,0.08)",
        },
        {
          label: "Total Accounts",
          value: stats.totalAccounts,
          icon: Database,
          color: "var(--secondary-brand)",
          bg: "rgba(78,69,228,0.08)",
        },
        {
          label: "System Status",
          value:
            stats.systemStatus === "healthy"
              ? "Healthy"
              : stats.systemStatus === "degraded"
                ? "Degraded"
                : "Down",
          icon: Activity,
          color:
            stats.systemStatus === "healthy"
              ? "#22c55e"
              : stats.systemStatus === "degraded"
                ? "#f59e0b"
                : "var(--error)",
          bg:
            stats.systemStatus === "healthy"
              ? "rgba(34,197,94,0.08)"
              : stats.systemStatus === "degraded"
                ? "rgba(245,158,11,0.08)"
                : "rgba(211,47,47,0.08)",
        },
        {
          label: "Platform",
          value: "Multi-Tenant",
          icon: Shield,
          color: "var(--tertiary)",
          bg: "rgba(135,32,222,0.08)",
        },
      ]
    : [];

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "3px solid var(--surface-container)",
            borderTopColor: "var(--primary)",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-headline)",
              fontWeight: 800,
              fontSize: "1.5rem",
              color: "var(--on-background)",
              marginBottom: 4,
            }}
          >
            Admin Dashboard
          </h1>
          <p
            style={{
              fontSize: "0.82rem",
              color: "var(--on-surface-variant)",
              fontFamily: "var(--font-body)",
            }}
          >
            360° platform overview — {user?.name || user?.email}
          </p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.07 }}
            className="luminous-shadow"
            style={{
              borderRadius: "1rem",
              padding: "1.25rem",
              backgroundColor: "var(--surface-container-lowest)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: card.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <card.icon size={18} color={card.color} />
              </div>
              {card.total !== undefined && (
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--on-surface-variant)",
                    fontFamily: "var(--font-label)",
                    fontWeight: 600,
                  }}
                >
                  {card.total} total
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                fontFamily: "var(--font-headline)",
                color: "var(--on-background)",
                marginBottom: 2,
              }}
            >
              {card.value}
            </p>
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--on-surface-variant)",
                fontFamily: "var(--font-label)",
                fontWeight: 600,
              }}
            >
              {card.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Tenants Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="luminous-shadow"
        style={{
          borderRadius: "1rem",
          backgroundColor: "var(--surface-container-lowest)",
          overflow: "hidden",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid rgba(167,176,222,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={16} color="var(--primary)" />
            <h2
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "0.95rem",
                color: "var(--on-background)",
              }}
            >
              Tenants
            </h2>
          </div>
          <span
            style={{
              fontSize: "0.65rem",
              fontFamily: "var(--font-label)",
              fontWeight: 600,
              color: "var(--on-surface-variant)",
            }}
          >
            {stats?.tenants.length || 0} registered
          </span>
        </div>

        {stats && stats.tenants.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.8rem",
                fontFamily: "var(--font-body)",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(167,176,222,0.08)",
                  }}
                >
                  {["Company", "Slug", "Status", "Created"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontWeight: 700,
                        fontSize: "0.68rem",
                        color: "var(--on-surface-variant)",
                        fontFamily: "var(--font-label)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.tenants.map((tenant) => (
                  <tr
                    key={tenant._id}
                    style={{
                      borderBottom: "1px solid rgba(167,176,222,0.04)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--surface-container-low)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td
                      style={{
                        padding: "10px 16px",
                        fontWeight: 600,
                        color: "var(--on-surface)",
                        fontFamily: "var(--font-headline)",
                      }}
                    >
                      {tenant.displayName}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        color: "var(--on-surface-variant)",
                        fontFamily: "monospace",
                        fontSize: "0.72rem",
                      }}
                    >
                      {tenant.slug}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          borderRadius: 9999,
                          padding: "0.15rem 0.6rem",
                          fontWeight: 700,
                          fontFamily: "var(--font-label)",
                          background:
                            tenant.status === "active"
                              ? "rgba(34,197,94,0.12)"
                              : "rgba(245,158,11,0.12)",
                          color:
                            tenant.status === "active" ? "#22c55e" : "#f59e0b",
                        }}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        color: "var(--on-surface-variant)",
                        fontSize: "0.72rem",
                      }}
                    >
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--on-surface-variant)",
              fontSize: "0.82rem",
            }}
          >
            No tenants provisioned yet.
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.4 }}
        className="luminous-shadow"
        style={{
          borderRadius: "1rem",
          padding: "1.25rem",
          backgroundColor: "var(--surface-container-lowest)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <TrendingUp size={16} color="var(--tertiary)" />
          <h2
            style={{
              fontFamily: "var(--font-headline)",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "var(--on-background)",
            }}
          >
            Quick Actions
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {[
            {
              label: "Provision Tenant",
              desc: "Create a new company workspace",
              icon: Building2,
              path: "/admin/tenants",
            },
            {
              label: "Invite Users",
              desc: "Add users to a tenant",
              icon: Users,
              path: "/admin/users",
            },
            {
              label: "View Health",
              desc: "System diagnostics & status",
              icon: Activity,
              path: "/admin/settings",
            },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => (window.location.hash = action.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid rgba(167,176,222,0.08)",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(167,176,222,0.06)";
                e.currentTarget.style.borderColor = "rgba(167,176,222,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(167,176,222,0.08)";
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(135,32,222,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <action.icon size={16} color="var(--tertiary)" />
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "var(--on-surface)",
                    fontFamily: "var(--font-headline)",
                  }}
                >
                  {action.label}
                </p>
                <p
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  {action.desc}
                </p>
              </div>
              <ArrowUpRight
                size={14}
                color="var(--on-surface-variant)"
                style={{ flexShrink: 0 }}
              />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

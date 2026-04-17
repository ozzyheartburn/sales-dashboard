import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth, buildAuthHeaders } from "../App";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Users,
  Building2,
  DollarSign,
  Activity,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  CreditCard,
  UserPlus,
  Settings,
  Zap,
} from "lucide-react";

const MOCK_TENANT_EXTRAS: Record<
  string,
  { mrr: number; activeUsers: number; activeModules: string[] }
> = {
  PG_Machine: {
    mrr: 4900,
    activeUsers: 12,
    activeModules: ["Research Hub", "War Room", "Agent Swarm"],
  },
  "6gnordic": {
    mrr: 2400,
    activeUsers: 8,
    activeModules: ["Research Hub", "War Room"],
  },
  pg_identity: { mrr: 1200, activeUsers: 3, activeModules: ["Research Hub"] },
};

const MRR_TREND = [
  { month: "Nov", mrr: 5200 },
  { month: "Dec", mrr: 6100 },
  { month: "Jan", mrr: 6800 },
  { month: "Feb", mrr: 7400 },
  { month: "Mar", mrr: 8100 },
  { month: "Apr", mrr: 8500 },
];

const USAGE_DATA = [
  { module: "Research Hub", users: 23 },
  { module: "War Room", users: 18 },
  { module: "Agent Swarm", users: 9 },
  { module: "Dashboard", users: 23 },
];

const RECENT_ACTIVITY = [
  {
    action: "New company added",
    detail: "6G Nordic — Pro plan",
    time: "2h ago",
    type: "company",
  },
  {
    action: "User invited",
    detail: "samuli.melart@gmail.com → PG Machine",
    time: "5h ago",
    type: "user",
  },
  {
    action: "Subscription upgraded",
    detail: "PG Identity → Starter plan",
    time: "1d ago",
    type: "billing",
  },
  {
    action: "Workflow edited",
    detail: "Research prompt v3 deployed",
    time: "2d ago",
    type: "workflow",
  },
  {
    action: "New user registered",
    detail: "anna.k@6gnordic.com",
    time: "3d ago",
    type: "user",
  },
];

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
  const navigate = useNavigate();
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

  const totalMRR = Object.values(MOCK_TENANT_EXTRAS).reduce(
    (s, t) => s + t.mrr,
    0,
  );
  const totalActiveUsers = Object.values(MOCK_TENANT_EXTRAS).reduce(
    (s, t) => s + t.activeUsers,
    0,
  );

  const kpiCards = [
    {
      label: "Total MRR",
      value: `€${totalMRR.toLocaleString()}`,
      change: "+12%",
      positive: true,
      icon: DollarSign,
      color: "#22c55e",
      bg: "rgba(34,197,94,0.08)",
    },
    {
      label: "Companies",
      value: stats?.activeTenants ?? "—",
      change: `${stats?.totalTenants ?? 0} total`,
      positive: true,
      icon: Building2,
      color: "var(--primary)",
      bg: "rgba(18,74,241,0.08)",
    },
    {
      label: "Active Users",
      value: totalActiveUsers,
      change: "+3 this month",
      positive: true,
      icon: Users,
      color: "var(--secondary-brand)",
      bg: "rgba(78,69,228,0.08)",
    },
    {
      label: "System Health",
      value:
        stats?.systemStatus === "healthy"
          ? "Healthy"
          : stats?.systemStatus === "degraded"
            ? "Degraded"
            : "—",
      change: "All services",
      positive: stats?.systemStatus === "healthy",
      icon: Activity,
      color: stats?.systemStatus === "healthy" ? "#22c55e" : "var(--error)",
      bg:
        stats?.systemStatus === "healthy"
          ? "rgba(34,197,94,0.08)"
          : "rgba(211,47,47,0.08)",
    },
  ];

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
    <div style={{ padding: "2rem", maxWidth: 1400, margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ marginBottom: "1.5rem" }}
      >
        <h1
          style={{
            fontFamily: "var(--font-headline)",
            fontWeight: 800,
            fontSize: "1.5rem",
            color: "var(--on-background)",
            marginBottom: 4,
          }}
        >
          Platform Overview
        </h1>
        <p
          style={{
            fontSize: "0.82rem",
            color: "var(--on-surface-variant)",
            fontFamily: "var(--font-body)",
          }}
        >
          SaaS management console — {user?.name || user?.email}
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.65rem",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                  color: card.positive ? "#22c55e" : "var(--error)",
                }}
              >
                {card.positive ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {card.change}
              </div>
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

      {/* Charts Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
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
            <TrendingUp size={16} color="var(--primary)" />
            <h2
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "0.95rem",
                color: "var(--on-background)",
              }}
            >
              MRR Trend
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MRR_TREND}>
              <CartesianGrid stroke="rgba(167,176,222,0.15)" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
                tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  background: "var(--surface-container-lowest)",
                  fontSize: 12,
                }}
                formatter={(v) => [`€${Number(v).toLocaleString()}`, "MRR"]}
              />
              <Line
                type="monotone"
                dataKey="mrr"
                stroke="#124af1"
                strokeWidth={2.5}
                dot={{ fill: "#124af1", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
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
            <Package size={16} color="var(--secondary-brand)" />
            <h2
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "0.95rem",
                color: "var(--on-background)",
              }}
            >
              Module Usage
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={USAGE_DATA}>
              <CartesianGrid stroke="rgba(167,176,222,0.15)" vertical={false} />
              <XAxis
                dataKey="module"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--on-surface-variant)" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--on-surface-variant)" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  background: "var(--surface-container-lowest)",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="users"
                fill="#4e45e4"
                radius={[6, 6, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom Row: Tenants Table + Activity Feed */}
      <div
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.4 }}
          className="luminous-shadow"
          style={{
            borderRadius: "1rem",
            backgroundColor: "var(--surface-container-lowest)",
            overflow: "hidden",
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
                Companies
              </h2>
            </div>
            <button
              onClick={() => navigate("/admin/companies")}
              style={{
                fontSize: "0.65rem",
                fontFamily: "var(--font-label)",
                fontWeight: 600,
                color: "var(--primary)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              View all →
            </button>
          </div>
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
                  style={{ borderBottom: "1px solid rgba(167,176,222,0.08)" }}
                >
                  {[
                    "Company",
                    "Slug",
                    "Status",
                    "Created",
                    "MRR",
                    "Active Users",
                    "Active Modules",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        color: "var(--on-surface-variant)",
                        fontFamily: "var(--font-label)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats?.tenants.map((tenant) => {
                  const extra = MOCK_TENANT_EXTRAS[tenant.slug] || {
                    mrr: 0,
                    activeUsers: 0,
                    activeModules: [],
                  };
                  return (
                    <tr
                      key={tenant._id}
                      style={{
                        borderBottom: "1px solid rgba(167,176,222,0.04)",
                        cursor: "pointer",
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
                          padding: "10px 14px",
                          fontWeight: 600,
                          color: "var(--on-surface)",
                          fontFamily: "var(--font-headline)",
                        }}
                      >
                        {tenant.displayName}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          color: "var(--on-surface-variant)",
                          fontFamily: "monospace",
                          fontSize: "0.72rem",
                        }}
                      >
                        {tenant.slug}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
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
                              tenant.status === "active"
                                ? "#22c55e"
                                : "#f59e0b",
                          }}
                        >
                          {tenant.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          color: "var(--on-surface-variant)",
                          fontSize: "0.72rem",
                        }}
                      >
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontWeight: 700,
                          color: "var(--on-surface)",
                          fontFamily: "var(--font-headline)",
                        }}
                      >
                        €{extra.mrr.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          color: "var(--on-surface)",
                          textAlign: "center",
                        }}
                      >
                        {extra.activeUsers}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div
                          style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                        >
                          {extra.activeModules.map((m) => (
                            <span
                              key={m}
                              style={{
                                fontSize: "0.6rem",
                                borderRadius: 9999,
                                padding: "0.1rem 0.5rem",
                                fontWeight: 600,
                                fontFamily: "var(--font-label)",
                                background: "rgba(78,69,228,0.1)",
                                color: "var(--secondary-brand)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.45 }}
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
            <Zap size={16} color="var(--tertiary)" />
            <h2
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "0.95rem",
                color: "var(--on-background)",
              }}
            >
              Recent Activity
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {RECENT_ACTIVITY.map((item, i) => {
              const iconMap: Record<string, typeof Building2> = {
                company: Building2,
                user: UserPlus,
                billing: CreditCard,
                workflow: Settings,
              };
              const Icon = iconMap[item.type] || Activity;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom:
                      i < RECENT_ACTIVITY.length - 1
                        ? "1px solid rgba(167,176,222,0.06)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "rgba(135,32,222,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <Icon size={13} color="var(--tertiary)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--on-surface)",
                        fontFamily: "var(--font-headline)",
                        marginBottom: 2,
                      }}
                    >
                      {item.action}
                    </p>
                    <p
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--on-surface-variant)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.detail}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "var(--on-surface-variant)",
                      fontFamily: "var(--font-label)",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

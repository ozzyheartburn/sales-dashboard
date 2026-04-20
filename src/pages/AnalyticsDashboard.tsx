import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Users,
  Target,
  Zap,
  Brain,
  FileSearch,
  Activity,
  TrendingUp,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PieChart,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface Summary {
  totalTenants: number;
  totalCompanies: number;
  totalAccounts: number;
  totalUsers: number;
  totalActivities: number;
  totalWithSwarm: number;
  totalWithResearch: number;
  totalWithEmbeddings: number;
  assignedAccounts: number;
  unassignedAccounts: number;
}

interface TenantMetric {
  slug: string;
  displayName: string;
  status: string;
  createdAt?: string;
  accounts?: number;
  users?: number;
  swarmRuns?: number;
  researchRuns?: number;
  embeddingCoverage?: number;
  salesActivities?: number;
  error?: string;
}

interface AnalyticsData {
  summary: Summary;
  priorityBreakdown: Record<string, number>;
  buyingSignalBuckets: Record<string, number>;
  championReadiness: Record<string, number>;
  activityByType: Record<string, number>;
  activityByOutcome: Record<string, number>;
  tenantMetrics: TenantMetric[];
}

// Mini bar chart component
function HorizontalBar({
  items,
  colors,
}: {
  items: { label: string; value: number }[];
  colors: string[];
}) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0)
    return (
      <p style={{ color: "var(--on-surface-variant)", fontSize: "0.8rem" }}>
        No data
      </p>
    );
  return (
    <div>
      <div
        style={{
          display: "flex",
          borderRadius: 8,
          overflow: "hidden",
          height: 28,
          marginBottom: 8,
        }}
      >
        {items.map((item, i) => (
          <div
            key={item.label}
            title={`${item.label}: ${item.value}`}
            style={{
              width: `${(item.value / total) * 100}%`,
              backgroundColor: colors[i % colors.length],
              minWidth: item.value > 0 ? 4 : 0,
              transition: "width 0.5s ease",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        {items.map((item, i) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.75rem",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                backgroundColor: colors[i % colors.length],
                flexShrink: 0,
              }}
            />
            <span style={{ color: "var(--on-surface-variant)" }}>
              {item.label}
            </span>
            <span
              style={{
                fontWeight: 700,
                color: "var(--on-background)",
                fontFamily: "var(--font-headline)",
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// KPI card
function KpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string | number;
  subtitle: string;
  icon: typeof BarChart3;
  gradient?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        padding: "1.25rem",
        borderRadius: "1rem",
        backgroundColor: "var(--surface-container-lowest)",
        border: "1px solid rgba(167,176,222,0.1)",
        minWidth: 180,
        flex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: gradient
              ? "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))"
              : "rgba(167,176,222,0.1)",
          }}
        >
          <Icon size={18} color={gradient ? "#fff" : "var(--tertiary)"} />
        </div>
        <span
          style={{
            fontSize: "0.8rem",
            color: "var(--on-surface-variant)",
            fontFamily: "var(--font-headline)",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: "2rem",
          fontWeight: 800,
          fontFamily: "var(--font-headline)",
          color: "var(--on-background)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "0.75rem",
          color: "var(--on-surface-variant)",
          marginTop: 4,
        }}
      >
        {subtitle}
      </div>
    </motion.div>
  );
}

export function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/analytics/platform`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      setError("");
    } catch {
      setError("Could not load analytics. Is the backend running?");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const s = data?.summary;

  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: 1440,
        margin: "0 auto",
        minHeight: "100vh",
        backgroundColor: "var(--background)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/admin")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: "var(--surface-container-lowest)",
              border: "1px solid rgba(167,176,222,0.1)",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={16} color="var(--on-surface-variant)" />
          </button>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 800,
                fontSize: "1.5rem",
                color: "var(--on-background)",
                letterSpacing: "-0.02em",
              }}
            >
              Platform Analytics
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--on-surface-variant)",
                marginTop: 2,
              }}
            >
              Performance metrics across all tenants
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            borderRadius: "0.75rem",
            backgroundColor: "var(--surface-container-lowest)",
            color: "var(--on-surface-variant)",
            fontSize: "0.875rem",
            fontFamily: "var(--font-headline)",
            fontWeight: 600,
            border: "1px solid rgba(167,176,222,0.1)",
            cursor: refreshing ? "not-allowed" : "pointer",
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          <RefreshCw
            size={14}
            style={{
              animation: refreshing ? "spin 0.9s linear infinite" : "none",
            }}
          />
          Refresh
        </button>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 300,
            gap: 12,
          }}
        >
          <Loader2
            size={24}
            style={{ animation: "spin 0.9s linear infinite" }}
            color="var(--tertiary)"
          />
          <span style={{ color: "var(--on-surface-variant)" }}>
            Loading analytics...
          </span>
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            padding: "2rem",
            borderRadius: "1rem",
            backgroundColor: "rgba(172,49,73,0.06)",
            border: "1px solid rgba(172,49,73,0.15)",
            textAlign: "center",
          }}
        >
          <AlertCircle
            size={32}
            color="var(--error)"
            style={{ marginBottom: 8 }}
          />
          <p style={{ color: "var(--on-background)", fontWeight: 600 }}>
            {error}
          </p>
        </div>
      )}

      {data && s && !loading && (
        <>
          {/* KPI Cards */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "2rem",
              flexWrap: "wrap",
            }}
          >
            <KpiCard
              label="Tenants"
              value={s.totalTenants}
              subtitle="active workspaces"
              icon={Building2}
              gradient
            />
            <KpiCard
              label="Total Accounts"
              value={s.totalAccounts}
              subtitle={`${s.assignedAccounts} assigned`}
              icon={Target}
            />
            <KpiCard
              label="Total Users"
              value={s.totalUsers}
              subtitle="across all tenants"
              icon={Users}
            />
            <KpiCard
              label="AI Swarm Runs"
              value={s.totalWithSwarm}
              subtitle={`${s.totalAccounts > 0 ? Math.round((s.totalWithSwarm / s.totalAccounts) * 100) : 0}% coverage`}
              icon={Brain}
            />
            <KpiCard
              label="Research Done"
              value={s.totalWithResearch}
              subtitle={`${s.totalAccounts > 0 ? Math.round((s.totalWithResearch / s.totalAccounts) * 100) : 0}% coverage`}
              icon={FileSearch}
            />
            <KpiCard
              label="Sales Activities"
              value={s.totalActivities}
              subtitle="logged activities"
              icon={Activity}
            />
          </div>

          {/* Charts Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            {/* Priority Breakdown */}
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "1rem",
                backgroundColor: "var(--surface-container-lowest)",
                border: "1px solid rgba(167,176,222,0.1)",
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
                <span
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "var(--on-background)",
                  }}
                >
                  Account Priority
                </span>
              </div>
              <HorizontalBar
                items={[
                  { label: "High", value: data.priorityBreakdown.high },
                  { label: "Medium", value: data.priorityBreakdown.medium },
                  { label: "Low", value: data.priorityBreakdown.low },
                  { label: "Unset", value: data.priorityBreakdown.unset },
                ]}
                colors={["#ef4444", "#f59e0b", "#3b82f6", "#6b7280"]}
              />
            </div>

            {/* Buying Signal Buckets */}
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "1rem",
                backgroundColor: "var(--surface-container-lowest)",
                border: "1px solid rgba(167,176,222,0.1)",
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
                <span
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "var(--on-background)",
                  }}
                >
                  Buying Signal Distribution
                </span>
              </div>
              <HorizontalBar
                items={[
                  { label: "Hot (70+)", value: data.buyingSignalBuckets.hot },
                  {
                    label: "Warm (40-69)",
                    value: data.buyingSignalBuckets.warm,
                  },
                  { label: "Cold (<40)", value: data.buyingSignalBuckets.cold },
                  {
                    label: "Unknown",
                    value: data.buyingSignalBuckets.unknown,
                  },
                ]}
                colors={["#ef4444", "#f59e0b", "#3b82f6", "#6b7280"]}
              />
            </div>

            {/* Champion Readiness */}
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "1rem",
                backgroundColor: "var(--surface-container-lowest)",
                border: "1px solid rgba(167,176,222,0.1)",
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
                <CheckCircle2 size={16} color="var(--tertiary)" />
                <span
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "var(--on-background)",
                  }}
                >
                  Champion Readiness
                </span>
              </div>
              <HorizontalBar
                items={[
                  { label: "High", value: data.championReadiness.high },
                  { label: "Medium", value: data.championReadiness.medium },
                  { label: "Low", value: data.championReadiness.low },
                  { label: "None", value: data.championReadiness.none },
                ]}
                colors={["#22c55e", "#f59e0b", "#ef4444", "#6b7280"]}
              />
            </div>

            {/* Account Assignment */}
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "1rem",
                backgroundColor: "var(--surface-container-lowest)",
                border: "1px solid rgba(167,176,222,0.1)",
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
                <Users size={16} color="var(--tertiary)" />
                <span
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "var(--on-background)",
                  }}
                >
                  Account Assignment
                </span>
              </div>
              <HorizontalBar
                items={[
                  { label: "Assigned", value: s.assignedAccounts },
                  { label: "Unassigned", value: s.unassignedAccounts },
                ]}
                colors={["#22c55e", "#6b7280"]}
              />
            </div>

            {/* AI Coverage */}
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "1rem",
                backgroundColor: "var(--surface-container-lowest)",
                border: "1px solid rgba(167,176,222,0.1)",
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
                <Brain size={16} color="var(--tertiary)" />
                <span
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "var(--on-background)",
                  }}
                >
                  AI Coverage
                </span>
              </div>
              <HorizontalBar
                items={[
                  { label: "Swarm", value: s.totalWithSwarm },
                  { label: "Research", value: s.totalWithResearch },
                  { label: "Embeddings", value: s.totalWithEmbeddings },
                ]}
                colors={["#a855f7", "#3b82f6", "#22c55e"]}
              />
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "var(--on-surface-variant)",
                  marginTop: 8,
                }}
              >
                out of {s.totalAccounts} total accounts
              </p>
            </div>

            {/* Activity by Type */}
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "1rem",
                backgroundColor: "var(--surface-container-lowest)",
                border: "1px solid rgba(167,176,222,0.1)",
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
                <PieChart size={16} color="var(--tertiary)" />
                <span
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "var(--on-background)",
                  }}
                >
                  Activities by Type
                </span>
              </div>
              <HorizontalBar
                items={Object.entries(data.activityByType).map(([k, v]) => ({
                  label: k,
                  value: v,
                }))}
                colors={[
                  "#a855f7",
                  "#3b82f6",
                  "#22c55e",
                  "#f59e0b",
                  "#ef4444",
                  "#06b6d4",
                  "#ec4899",
                ]}
              />
            </div>
          </div>

          {/* Tenant Breakdown Table */}
          <div
            style={{
              padding: "1.25rem",
              borderRadius: "1rem",
              backgroundColor: "var(--surface-container-lowest)",
              border: "1px solid rgba(167,176,222,0.1)",
              marginBottom: "2rem",
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
              <BarChart3 size={16} color="var(--tertiary)" />
              <span
                style={{
                  fontFamily: "var(--font-headline)",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "var(--on-background)",
                }}
              >
                Tenant Breakdown
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.8rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid rgba(167,176,222,0.15)",
                    }}
                  >
                    {[
                      "Tenant",
                      "Status",
                      "Accounts",
                      "Users",
                      "Swarm",
                      "Research",
                      "Embeddings",
                      "Activities",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "0.5rem 0.75rem",
                          color: "var(--on-surface-variant)",
                          fontFamily: "var(--font-headline)",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.tenantMetrics.map((t) => (
                    <tr
                      key={t.slug}
                      style={{
                        borderBottom: "1px solid rgba(167,176,222,0.07)",
                      }}
                    >
                      <td
                        style={{
                          padding: "0.6rem 0.75rem",
                          fontWeight: 700,
                          color: "var(--on-background)",
                          fontFamily: "var(--font-headline)",
                        }}
                      >
                        {t.displayName || t.slug}
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            backgroundColor:
                              t.status === "active"
                                ? "rgba(34,197,94,0.12)"
                                : "rgba(107,114,128,0.12)",
                            color:
                              t.status === "active" ? "#22c55e" : "#6b7280",
                          }}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "0.6rem 0.75rem",
                          color: "var(--on-background)",
                        }}
                      >
                        {t.error ? "—" : t.accounts}
                      </td>
                      <td
                        style={{
                          padding: "0.6rem 0.75rem",
                          color: "var(--on-background)",
                        }}
                      >
                        {t.error ? "—" : t.users}
                      </td>
                      <td
                        style={{
                          padding: "0.6rem 0.75rem",
                          color: "var(--on-background)",
                        }}
                      >
                        {t.error ? "—" : t.swarmRuns}
                      </td>
                      <td
                        style={{
                          padding: "0.6rem 0.75rem",
                          color: "var(--on-background)",
                        }}
                      >
                        {t.error ? "—" : t.researchRuns}
                      </td>
                      <td
                        style={{
                          padding: "0.6rem 0.75rem",
                          color: "var(--on-background)",
                        }}
                      >
                        {t.error ? "—" : t.embeddingCoverage}
                      </td>
                      <td
                        style={{
                          padding: "0.6rem 0.75rem",
                          color: "var(--on-background)",
                        }}
                      >
                        {t.error ? "—" : t.salesActivities}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

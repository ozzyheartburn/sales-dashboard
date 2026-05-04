import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, buildAuthHeaders } from "../App";
import { motion } from "motion/react";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Building2,
  Target,
  Users,
  RefreshCw,
  ChevronRight,
  FileSearch,
} from "lucide-react";

interface Account {
  companyName: string;
  buyingSignalScore: number;
  priority: string;
  timestamp?: string;
  insights?: {
    strategicContext?: { title: string; description: string }[];
    ecommercePriorities?: { title: string; description: string }[];
    activeInitiatives?: { title: string; description: string }[];
    keyChallenges?: { title: string; description: string }[];
    opportunityFrame?: { title: string; description: string }[];
  };
  champion_cxo_candidates?: { full_name: string }[];
  champion_vp_director_candidates?: { full_name: string }[];
  champion_enduser_candidates?: { full_name: string }[];
}

const API_URL = import.meta.env.VITE_API_URL || "";

interface InsightAlert {
  id: string;
  severity: "high" | "medium";
  title: string;
  detail: string;
  owner: string;
  since: string;
  action: string;
  link: string;
  externalLink: boolean;
}

const sevStyle: Record<
  string,
  { bg: string; dot: string; badge: { bg: string; color: string } }
> = {
  high: {
    bg: "rgba(172,49,73,0.06)",
    dot: "#f59e0b",
    badge: { bg: "var(--error)", color: "#fff" },
  },
  medium: {
    bg: "rgba(245,158,11,0.06)",
    dot: "#f59e0b",
    badge: { bg: "rgba(245,158,11,0.12)", color: "#b45309" },
  },
};

export function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const authHeaders = buildAuthHeaders(user);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/accounts`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data: Account[]) => setAccounts(data))
      .catch(() => {});
  }, []);

  const insightAlerts: InsightAlert[] = accounts
    .filter((a) => a.companyName)
    .sort((a, b) => (b.buyingSignalScore || 0) - (a.buyingSignalScore || 0))
    .map((account) => {
      const insights = account.insights || {};
      const keyChallenge = insights.keyChallenges?.[0];
      const opportunity = insights.opportunityFrame?.[0];
      const initiative = insights.activeInitiatives?.[0];
      const strategic = insights.strategicContext?.[0];

      const firstInsight =
        keyChallenge || opportunity || initiative || strategic || null;

      return {
        id: account.companyName,
        severity: (account.priority === "P0" ? "high" : "medium") as
          | "high"
          | "medium",
        title: `${account.companyName} — ${firstInsight?.title || "AI insight available"}`,
        detail:
          firstInsight?.description ||
          "No structured insight summary yet. Open the Value Pyramid to review and refresh account-level AI findings.",
        owner: "AI",
        since: account.timestamp
          ? new Date(account.timestamp).toLocaleDateString()
          : "Recently",
        action: "Open Value Pyramid",
        link: `/dashboard/war-room?account=${encodeURIComponent(account.companyName)}`,
        externalLink: false,
      };
    })
    .filter((a) => a.detail)
    .slice(0, 6);

  const activeAlerts = insightAlerts.filter((a) => !dismissed.includes(a.id));

  const totalAccounts = accounts.length;
  const completedResearch = accounts.filter(
    (a) => a.buyingSignalScore > 0,
  ).length;
  const totalChampions = accounts.reduce((sum, a) => {
    return (
      sum +
      (a.champion_cxo_candidates?.length || 0) +
      (a.champion_vp_director_candidates?.length || 0) +
      (a.champion_enduser_candidates?.length || 0)
    );
  }, 0);
  const avgSignalScore =
    totalAccounts > 0
      ? Math.round(
          accounts.reduce((s, a) => s + (a.buyingSignalScore || 0), 0) /
            totalAccounts,
        )
      : 0;
  const p0Count = accounts.filter((a) => a.priority === "P0").length;

  const kpis = [
    {
      label: "Active Accounts",
      value: String(totalAccounts),
      change: "in PG Machine",
      dir: "neutral" as const,
      icon: Building2,
      gradient: true,
    },
    {
      label: "Research Completed",
      value: String(completedResearch),
      change: `of ${totalAccounts} accounts`,
      dir: "up" as const,
      icon: FileSearch,
    },
    {
      label: "Champion Contacts",
      value: String(totalChampions),
      change: "across all tiers",
      dir: "up" as const,
      icon: Users,
    },
    {
      label: "Avg. Buying Signal",
      value: String(avgSignalScore),
      change: "weighted score",
      dir: avgSignalScore >= 50 ? ("up" as const) : ("neutral" as const),
      icon: Target,
    },
    {
      label: "P0 Accounts",
      value: String(p0Count),
      change: "highest priority",
      dir: "up" as const,
      icon: CheckCircle2,
    },
  ];

  function handleRefresh() {
    setRefreshing(true);
    fetch(`${API_URL}/api/accounts`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data: Account[]) => {
        setAccounts(data);
        setRefreshing(false);
      })
      .catch(() => setRefreshing(false));
  }

  return (
    <div
      className="page-container"
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
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
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
            {(() => {
              const hour = new Date().getHours();
              const greeting =
                hour < 12
                  ? "Good morning"
                  : hour < 18
                    ? "Good afternoon"
                    : "Good evening";
              const firstName = user?.name?.split(" ")[0] || "there";
              return `${greeting}, ${firstName}`;
            })()}
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--on-surface-variant)",
              marginTop: "0.25rem",
            }}
          >
            {(() => {
              const role = user?.role || "end_user";
              const subtitles: Record<string, string> = {
                platform_admin:
                  "Platform overview — all tenants and system health.",
                company_admin: "Your company's pipeline and team performance.",
                sales_leader: "Here's what needs your attention today.",
                team_leader: "Your team's territory and active deals.",
                end_user: "Your accounts and upcoming tasks.",
                sdr: "Your outreach pipeline and activity targets.",
                sdr_manager: "SDR team performance and outreach metrics.",
              };
              return (
                subtitles[role] || "Here's what needs your attention today."
              );
            })()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
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
          }}
        >
          <RefreshCw
            size={14}
            style={{ animation: refreshing ? "spin 0.9s linear" : "none" }}
          />
          Refresh
        </button>
      </div>

      {/* AI Next Best Action Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="ai-card-glow"
        style={{
          borderRadius: "1rem",
          padding: "1.5rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "1rem",
          backgroundColor: "rgba(211,166,255,0.07)",
          border: "1px solid rgba(211,166,255,0.15)",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            flexShrink: 0,
            background:
              "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.35rem",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-label)",
                fontWeight: 700,
                fontSize: "0.6rem",
                color: "var(--tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Next Best Action
            </span>
            <span
              style={{
                fontSize: "0.65rem",
                color: "var(--on-surface-variant)",
              }}
            >
              Updated just now
            </span>
          </div>
          <p
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--on-background)",
              fontFamily: "var(--font-headline)",
              marginBottom: 6,
            }}
          >
            {totalAccounts > 0
              ? `You have ${totalAccounts} accounts in your pipeline with ${totalChampions} champion contacts identified.`
              : "Your pipeline is empty — start by adding accounts in the Research Hub."}
          </p>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--on-surface-variant)",
              lineHeight: 1.6,
            }}
          >
            {activeAlerts.filter((a) => a.severity === "high").length > 0
              ? `${activeAlerts.filter((a) => a.severity === "high").length} high-priority alerts require immediate attention. Review stakeholder gaps and new executive hires to protect pipeline and uncover new opportunities.`
              : "No high-priority alerts right now. Focus on deepening champion relationships and completing value pyramids for your top accounts."}
          </p>
        </div>
        <button
          onClick={() =>
            navigate(activeAlerts[0]?.link || "/dashboard/war-room")
          }
          style={{
            flexShrink: 0,
            padding: "0.55rem 1.15rem",
            borderRadius: "9999px",
            background:
              "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
            color: "#fff",
            fontFamily: "var(--font-headline)",
            fontWeight: 700,
            fontSize: "0.82rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Open War Room
        </button>
      </motion.div>

      {/* KPI Cards */}
      <section style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-headline)",
            fontWeight: 700,
            fontSize: "1rem",
            color: "var(--on-background)",
            marginBottom: "1rem",
          }}
        >
          Key Metrics
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "1rem",
          }}
        >
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              className="luminous-shadow"
              style={{
                borderRadius: "1rem",
                padding: "1.25rem",
                background: kpi.gradient
                  ? "linear-gradient(135deg, var(--primary), var(--secondary-brand))"
                  : "var(--surface-container-lowest)",
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
                  marginBottom: "1rem",
                  backgroundColor: kpi.gradient
                    ? "rgba(255,255,255,0.15)"
                    : "var(--surface-container-low)",
                }}
              >
                <kpi.icon
                  size={16}
                  color={kpi.gradient ? "#fff" : "var(--primary)"}
                />
              </div>
              <div
                style={{
                  fontFamily: "var(--font-headline)",
                  fontWeight: 800,
                  fontSize: "1.75rem",
                  lineHeight: 1,
                  color: kpi.gradient ? "#fff" : "var(--on-background)",
                  marginBottom: 4,
                }}
              >
                {kpi.value}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-label)",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: kpi.gradient
                    ? "rgba(250,248,255,0.8)"
                    : "var(--on-surface-variant)",
                  marginBottom: 8,
                }}
              >
                {kpi.label}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {kpi.dir === "up" && (
                  <TrendingUp
                    size={11}
                    color={kpi.gradient ? "rgba(255,255,255,0.7)" : "#22c55e"}
                  />
                )}
                {kpi.dir === "neutral" && (
                  <Clock size={11} color="var(--on-surface-variant)" />
                )}
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontFamily: "var(--font-label)",
                    color: kpi.gradient
                      ? "rgba(255,255,255,0.7)"
                      : kpi.dir === "up"
                        ? "#22c55e"
                        : "var(--on-surface-variant)",
                  }}
                >
                  {kpi.change}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI-Driven Recommendations */}
      {activeAlerts.length > 0 && (
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <AlertTriangle size={15} color="var(--error)" />
            <h2
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "1rem",
                color: "var(--on-background)",
              }}
            >
              AI-Driven Recommendations
            </h2>
            <span
              style={{
                backgroundColor: "rgba(172,49,73,0.1)",
                color: "var(--error)",
                fontSize: "0.65rem",
                fontWeight: 700,
                fontFamily: "var(--font-label)",
                borderRadius: "9999px",
                padding: "0.15rem 0.6rem",
              }}
            >
              {activeAlerts.length} active
            </span>
          </div>
          <div
            className="responsive-grid-alerts"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(420px, 100%), 1fr))",
              gap: "0.75rem",
            }}
          >
            {activeAlerts.map((alert, i) => {
              const sev =
                sevStyle[alert.severity as keyof typeof sevStyle] ||
                sevStyle.medium;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="luminous-shadow"
                  style={{
                    borderRadius: "1rem",
                    padding: "1rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    backgroundColor: sev.bg,
                  }}
                >
                  <div
                    style={{
                      marginTop: 6,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      flexShrink: 0,
                      backgroundColor: sev.dot,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.25rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          ...sev.badge,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          fontFamily: "var(--font-label)",
                          borderRadius: "9999px",
                          padding: "0.1rem 0.5rem",
                        }}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--on-surface-variant)",
                        }}
                      >
                        {alert.owner} · {alert.since}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--on-surface)",
                        fontFamily: "var(--font-headline)",
                      }}
                    >
                      {alert.title}
                    </p>
                    <p
                      style={{
                        marginTop: "0.2rem",
                        fontSize: "0.78rem",
                        color: "var(--on-surface-variant)",
                        lineHeight: 1.5,
                      }}
                    >
                      {alert.detail}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "0.4rem",
                      flexShrink: 0,
                    }}
                  >
                    {alert.externalLink ? (
                      <a
                        href={alert.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "var(--primary)",
                          fontFamily: "var(--font-headline)",
                          textDecoration: "none",
                        }}
                      >
                        {alert.action} <ChevronRight size={11} />
                      </a>
                    ) : (
                      <button
                        onClick={() => navigate(alert.link)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "var(--primary)",
                          fontFamily: "var(--font-headline)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {alert.action} <ChevronRight size={11} />
                      </button>
                    )}
                    <button
                      onClick={() => setDismissed((d) => [...d, alert.id])}
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--on-surface-variant)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

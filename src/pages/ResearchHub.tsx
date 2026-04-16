import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Building2,
  TrendingUp,
  Sparkles,
  Plus,
  Globe,
  Target,
  Zap,
  AlertTriangle,
  Crosshair,
  Clock,
  Network,
  BarChart3,
  Trophy,
  Users,
  X,
  ChevronRight,
  Shield,
  Crown,
  UserCheck,
  UserX,
  Star,
  Brain,
  FileText,
  ExternalLink,
  Link2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AgentSwarm } from "./AgentSwarm";

interface ChampionCandidate {
  full_name?: string;
  title_role?: string;
  department?: string;
  seniority_level?: string;
  linkedin_url?: string;
  pain_hypothesis?: string;
  personal_win?: string;
  outreach_angle?: string;
  best_channel?: string;
  champion_readiness?: string;
  reason_for_resistance?: string;
  [key: string]: unknown;
}

interface Account {
  _id: string;
  companyName: string;
  website: string;
  buyingSignalScore: number;
  priority: string;
  rationale: string;
  insights: {
    strategicContext: unknown[];
    ecommercePriorities: unknown[];
    activeInitiatives: unknown[];
    keyChallenges: unknown[];
    opportunityFrame: unknown[];
  };
  reports: {
    chatGptAnalysis: string;
    perplexityResearch: string;
  };
  metadata: {
    citations: unknown[];
    searchResults: unknown[];
    lastSwarmRun?: string;
  };
  timestamp: string;
  champion_cxo_candidates?: ChampionCandidate[];
  champion_vp_director_candidates?: ChampionCandidate[];
  champion_enduser_candidates?: ChampionCandidate[];
  detractors?: ChampionCandidate[];
  primary_champion_recommendation?: string;
  champion_overall_readiness?: string;
  agentResults?: Record<
    string,
    { output?: unknown; rawText?: string; error?: string; executedAt?: string }
  >;
  swarmBriefs?: Record<
    string,
    { brief?: string; template?: string; executedAt?: string }
  >;
  [key: string]: unknown;
}

const API_URL = import.meta.env.VITE_API_URL || "";

export function ResearchHub() {
  const [showModal, setShowModal] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollingAccount, setPollingAccount] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/accounts`)
      .then((res) => res.json())
      .then((data: Account[]) => {
        const populated = data.filter((a) => a.companyName);
        populated.sort(
          (a, b) => (b.buyingSignalScore || 0) - (a.buyingSignalScore || 0),
        );
        setAccounts(populated);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleInitiateResearch = async () => {
    setIsSubmitting(true);
    try {
      // Fire-and-forget: backend triggers n8n asynchronously
      const res = await fetch(`${API_URL}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_name: accountName,
          website_url: website,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Research initiation failed:", err);
      } else {
        // Start polling for completion
        setPollingAccount(accountName);
      }
    } catch (err) {
      console.error("Research workflow error:", err);
    }
    setIsSubmitting(false);
    setShowModal(false);
    setAccountName("");
    setWebsite("");
  };

  // Poll for research completion when pollingAccount is set
  useEffect(() => {
    if (!pollingAccount) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/research/status/${encodeURIComponent(pollingAccount)}`,
        );
        const data = await res.json();
        if (data.status === "completed") {
          setPollingAccount(null);
          // Refresh accounts list
          const accountsRes = await fetch(`${API_URL}/api/accounts`);
          const freshAccounts: Account[] = await accountsRes.json();
          const sorted = freshAccounts
            .filter((a) => a.companyName)
            .sort(
              (a, b) => (b.buyingSignalScore || 0) - (a.buyingSignalScore || 0),
            );
          setAccounts(sorted);
        }
      } catch {
        // ignore polling errors
      }
    }, 10000); // poll every 10 seconds

    return () => clearInterval(interval);
  }, [pollingAccount]);

  // Glassmorphic card style
  const glassCard: React.CSSProperties = {
    borderRadius: "1rem",
    padding: "1.25rem",
    background: "rgba(20,24,38,0.55)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 2px 16px rgba(135,32,222,0.08)",
  };

  // --- MAIN LAYOUT ---
  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: 1440,
        margin: "0 auto",
        minHeight: "100vh",
        backgroundColor: "#0a0e1a",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-headline)",
            fontWeight: 800,
            fontSize: "2rem",
            color: "#fff",
          }}
        >
          Research Hub
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: "linear-gradient(135deg, #8720de, #14b8a6)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0.7rem 1.5rem",
            fontFamily: "var(--font-label)",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(135,32,222,0.08)",
          }}
        >
          <Plus size={18} style={{ marginRight: 8, verticalAlign: -2 }} />{" "}
          Initiate Deep Research
        </button>
      </div>
      <div
        style={{
          fontSize: "0.95rem",
          color: "rgba(255,255,255,0.5)",
          marginBottom: 32,
        }}
      >
        Identify pain above the noise and investment urgency based on data
        driven proof
      </div>

      {/* --- BUYER PROGRESSION ANALYTICS --- */}
      <div style={{ display: "flex", gap: 20, marginBottom: 28 }}>
        {/* Buyer Progression Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            flex: 1,
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-headline)",
              fontWeight: 700,
              fontSize: "1rem",
              color: "#1a1a2e",
              marginBottom: 10,
            }}
          >
            Buyer Progression Metrics
          </div>
          {/* KPI row — derived from live accounts */}
          {(() => {
            const total = accounts.length;
            const progressing = accounts.filter(
              (a) => a.buyingSignalScore >= 60,
            ).length;
            const stalled = accounts.filter(
              (a) => a.buyingSignalScore > 0 && a.buyingSignalScore < 40,
            ).length;
            const avgSignal =
              total > 0
                ? Math.round(
                    accounts.reduce(
                      (s, a) => s + (a.buyingSignalScore || 0),
                      0,
                    ) / total,
                  )
                : 0;
            const withChampion = accounts.filter(
              (a) =>
                (a.champion_cxo_candidates?.length || 0) +
                  (a.champion_vp_director_candidates?.length || 0) +
                  (a.champion_enduser_candidates?.length || 0) >
                0,
            ).length;
            const champCoverage =
              total > 0 ? Math.round((withChampion / total) * 100) : 0;
            return (
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                {[
                  {
                    label: "Progressing",
                    value: String(progressing),
                    color: "#22c55e",
                  },
                  {
                    label: "Stalled",
                    value: String(stalled),
                    color: "#ef4444",
                  },
                  {
                    label: "Avg Signal",
                    value: String(avgSignal),
                    color: "#124af1",
                  },
                  {
                    label: "Champion %",
                    value: `${champCoverage}%`,
                    color: "#8720de",
                  },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    style={{
                      flex: 1,
                      background: "#f8f9fc",
                      borderRadius: 10,
                      padding: "0.6rem 0.75rem",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 800,
                        color: kpi.color,
                        fontFamily: "var(--font-headline)",
                      }}
                    >
                      {kpi.value}
                    </div>
                    <div
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 600,
                        color: "#6b7194",
                        fontFamily: "var(--font-label)",
                        marginTop: 1,
                      }}
                    >
                      {kpi.label}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          {/* Buying Signal Distribution */}
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#6b7194",
              fontFamily: "var(--font-label)",
              marginBottom: 6,
            }}
          >
            Buying Signal Score Distribution
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart
              data={(() => {
                const buckets = [
                  { range: "0–20", min: 0, max: 20 },
                  { range: "21–40", min: 21, max: 40 },
                  { range: "41–60", min: 41, max: 60 },
                  { range: "61–80", min: 61, max: 80 },
                  { range: "81–100", min: 81, max: 100 },
                ];
                return buckets.map((b) => ({
                  range: b.range,
                  count: accounts.filter(
                    (a) =>
                      (a.buyingSignalScore || 0) >= b.min &&
                      (a.buyingSignalScore || 0) <= b.max,
                  ).length,
                }));
              })()}
              barCategoryGap="20%"
            >
              <CartesianGrid stroke="rgba(167,176,222,0.15)" vertical={false} />
              <XAxis
                dataKey="range"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fill: "#6b7194",
                  fontFamily: "var(--font-label)",
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#6b7194" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  background: "#fff",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  fontSize: "0.8rem",
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Accounts">
                {["#ef4444", "#f59e0b", "#06b6d4", "#4e45e4", "#22c55e"].map(
                  (c, i) => (
                    <Cell key={i} fill={c} />
                  ),
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Priority Breakdown */}
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#6b7194",
              fontFamily: "var(--font-label)",
              marginBottom: 6,
              marginTop: 14,
            }}
          >
            Deal Priority Breakdown
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(() => {
              const priorities = ["P0", "P1", "P2", "P3"];
              const colors = ["#ef4444", "#f59e0b", "#124af1", "#6b7194"];
              return priorities.map((p, i) => {
                const count = accounts.filter((a) => a.priority === p).length;
                const pct =
                  accounts.length > 0
                    ? Math.round((count / accounts.length) * 100)
                    : 0;
                return (
                  <div key={p}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.7rem",
                        fontFamily: "var(--font-label)",
                        fontWeight: 600,
                        color: "#374151",
                        marginBottom: 2,
                      }}
                    >
                      <span>{p}</span>
                      <span style={{ color: "#6b7194" }}>
                        {count} accounts ({pct}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: "#f3f4f6",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 3,
                          background: colors[i],
                          width: `${pct}%`,
                          transition: "width 0.4s",
                        }}
                      />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </motion.div>

        {/* Customer Buying Signals */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.07 }}
          style={{
            flex: 1,
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-headline)",
              fontWeight: 700,
              fontSize: "1rem",
              color: "#1a1a2e",
              marginBottom: 10,
            }}
          >
            Customer Buying Signals
          </div>
          {/* Champion Readiness Donut */}
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            <div style={{ flex: "0 0 110px" }}>
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "#6b7194",
                  fontFamily: "var(--font-label)",
                  marginBottom: 4,
                }}
              >
                Champion Readiness
              </div>
              {(() => {
                const readinessMap: Record<string, number> = {};
                accounts.forEach((a) => {
                  const r = a.champion_overall_readiness || "Unknown";
                  readinessMap[r] = (readinessMap[r] || 0) + 1;
                });
                const readinessColors: Record<string, string> = {
                  High: "#22c55e",
                  Medium: "#f59e0b",
                  Low: "#ef4444",
                  Unknown: "#9ca3af",
                };
                const pieData = Object.entries(readinessMap).map(
                  ([name, value]) => ({ name, value }),
                );
                return (
                  <>
                    <ResponsiveContainer width={110} height={110}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={48}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {pieData.map((d, i) => (
                            <Cell
                              key={i}
                              fill={readinessColors[d.name] || "#9ca3af"}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "none",
                            background: "#fff",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                            fontSize: "0.8rem",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 8,
                        marginTop: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      {pieData.map((d) => (
                        <div
                          key={d.name}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: "0.58rem",
                            color: "#6b7194",
                            fontFamily: "var(--font-label)",
                            fontWeight: 600,
                          }}
                        >
                          <div
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: readinessColors[d.name] || "#9ca3af",
                            }}
                          />
                          {d.name}
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
            {/* Risk Indicators */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "#6b7194",
                  fontFamily: "var(--font-label)",
                  marginBottom: 8,
                }}
              >
                Progression Risk Indicators
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(() => {
                  const total = accounts.length || 1;
                  const noChampions = accounts.filter(
                    (a) =>
                      (a.champion_cxo_candidates?.length || 0) +
                        (a.champion_vp_director_candidates?.length || 0) +
                        (a.champion_enduser_candidates?.length || 0) ===
                      0,
                  ).length;
                  const lowSignal = accounts.filter(
                    (a) => (a.buyingSignalScore || 0) < 30,
                  ).length;
                  const noSwarm = accounts.filter(
                    (a) => !a.metadata?.lastSwarmRun,
                  ).length;
                  const hasDetractors = accounts.filter(
                    (a) => (a.detractors?.length || 0) > 0,
                  ).length;
                  const risks = [
                    {
                      label: "No Champion Identified",
                      count: noChampions,
                      color: "#ef4444",
                    },
                    {
                      label: "Low Buying Signal (<30)",
                      count: lowSignal,
                      color: "#f59e0b",
                    },
                    {
                      label: "No Agent Swarm Run",
                      count: noSwarm,
                      color: "#6b7194",
                    },
                    {
                      label: "Active Detractors",
                      count: hasDetractors,
                      color: "#8720de",
                    },
                  ];
                  return risks.map((r) => (
                    <div key={r.label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.7rem",
                          fontFamily: "var(--font-label)",
                          fontWeight: 600,
                          color: "#374151",
                          marginBottom: 2,
                        }}
                      >
                        <span>{r.label}</span>
                        <span style={{ color: "#6b7194" }}>
                          {r.count} / {accounts.length}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 3,
                          background: "#f3f4f6",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 3,
                            background: r.color,
                            width: `${(r.count / total) * 100}%`,
                            transition: "width 0.4s",
                          }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
          {/* Buying Signal by Account — top movers & stalled */}
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#6b7194",
              fontFamily: "var(--font-label)",
              marginBottom: 6,
            }}
          >
            Account Buying Signals (top 10)
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart
              data={[...accounts]
                .filter((a) => a.buyingSignalScore != null)
                .sort(
                  (a, b) =>
                    (b.buyingSignalScore || 0) - (a.buyingSignalScore || 0),
                )
                .slice(0, 10)
                .map((a) => ({
                  name:
                    a.companyName?.length > 12
                      ? a.companyName.slice(0, 12) + "…"
                      : a.companyName,
                  score: a.buyingSignalScore || 0,
                }))}
              layout="vertical"
              barCategoryGap="18%"
            >
              <CartesianGrid
                stroke="rgba(167,176,222,0.15)"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#6b7194" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#374151", fontWeight: 600 }}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  background: "#fff",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  fontSize: "0.8rem",
                }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} name="Signal Score">
                {[...accounts]
                  .filter((a) => a.buyingSignalScore != null)
                  .sort(
                    (a, b) =>
                      (b.buyingSignalScore || 0) - (a.buyingSignalScore || 0),
                  )
                  .slice(0, 10)
                  .map((a, i) => (
                    <Cell
                      key={i}
                      fill={
                        (a.buyingSignalScore || 0) >= 70
                          ? "#22c55e"
                          : (a.buyingSignalScore || 0) >= 40
                            ? "#f59e0b"
                            : "#ef4444"
                      }
                    />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.18)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "var(--surface-container-lowest)",
              borderRadius: 16,
              padding: 32,
              minWidth: 340,
              boxShadow: "0 4px 32px rgba(0,0,0,0.10)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "1.2rem",
                marginBottom: 18,
              }}
            >
              Initiate Deep Research
            </div>
            <div style={{ marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Account Name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  marginBottom: 10,
                }}
              />
              <input
                type="text"
                placeholder="Website URL"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                }}
              />
            </div>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--on-surface-variant)",
                  fontWeight: 600,
                  fontFamily: "var(--font-label)",
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleInitiateResearch}
                style={{
                  background:
                    "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "0.6rem 1.2rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-label)",
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
                disabled={isSubmitting || !accountName || !website}
              >
                {isSubmitting ? "Submitting..." : "Initiate"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20,
          marginBottom: 36,
        }}
      >
        {[
          {
            icon: <Sparkles size={22} color="#fff" />,
            name: "Agent Swarm",
            description:
              "Deploy and customize your Agent Swarm with custom signals, ICP definitions, market research and competitive intelligence data",
          },
          {
            icon: <Network size={22} color="#fff" />,
            name: "Territory Neural Network",
            description:
              "Dynamic and data-driven territory management based on webscale agentic automation and self-learning AI",
          },
          {
            icon: <Trophy size={22} color="#fff" />,
            name: "Champion's League",
            description:
              "360-view into Champion Building through deeply understanding what your champions care about, and how to uniquely position yourself in every situation to further build and test your champions",
          },
        ].map((widget, i) => (
          <motion.div
            key={widget.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            style={{
              ...glassCard,
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setActivePanel(widget.name)}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #8720de, #14b8a6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {widget.icon}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-headline)",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  color: "#fff",
                }}
              >
                {widget.name}
              </div>
              <div
                style={{
                  fontSize: "0.88rem",
                  color: "rgba(255,255,255,0.7)",
                  marginTop: 4,
                  lineHeight: 1.45,
                }}
              >
                {widget.description}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Dynamic Research Insights & Workflows widget */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 3 * 0.07 }}
          style={{
            ...glassCard,
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
            cursor: "pointer",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          whileHover={{ scale: 1.02 }}
          onClick={() => setActivePanel("Research Insights & Workflows")}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #8720de, #14b8a6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BarChart3 size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "1.05rem",
                color: "#fff",
                marginBottom: 8,
              }}
            >
              Research Insights & Workflows
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              <span style={kpiBadgeStyle("#124af1")}>
                {" "}
                <Target size={10} /> {accounts.length} Active Workflows{" "}
              </span>
              <span style={kpiBadgeStyle("#22c55e")}>
                {" "}
                <Users size={10} />{" "}
                {pollingAccount ? accounts.length + 1 : accounts.length}{" "}
                Contacts Identified{" "}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 10,
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.7)",
                fontFamily: "var(--font-label)",
                fontWeight: 600,
              }}
            >
              <span>
                Research → Meeting{" "}
                <strong style={{ color: "#124af1" }}>34%</strong>
              </span>
              <span>
                Meeting → Opp <strong style={{ color: "#22c55e" }}>66%</strong>
              </span>
              <span>
                S2 → S4 <strong style={{ color: "#8720de" }}>42%</strong>
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Polling banner */}
      {pollingAccount && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "linear-gradient(135deg, #8720de, #14b8a6)",
            color: "#fff",
            borderRadius: 12,
            padding: "0.85rem 1.25rem",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "var(--font-label)",
            fontWeight: 600,
            fontSize: "0.92rem",
          }}
        >
          <Sparkles size={18} className="spin" />
          AI research in progress for  201c{pollingAccount} 201d  2012mdash; this
          may take a few minutes. The page will update automatically.
        </motion.div>
      )}

      {/* --- SEARCH + ACCOUNTS --- */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: 12,
              top: 13,
              color: "rgba(255,255,255,0.5)",
            }}
          />
          <input
            type="text"
            placeholder="Search accounts..."
            style={{
              width: "100%",
              padding: "0.7rem 0.7rem 0.7rem 2.2rem",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: "1rem",
              background: "rgba(255,255,255,0.03)",
              color: "#fff",
              fontFamily: "var(--font-body)",
            }}
          />
        </div>
        <div
          style={{
            fontSize: "0.95rem",
            color: "rgba(255,255,255,0.7)",
            fontFamily: "var(--font-label)",
            fontWeight: 600,
          }}
        >
          {accounts.length} Active Accounts
        </div>
      </div>
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "var(--on-surface-variant)",
          }}
        >
          Loading accounts...
        </div>
      ) : accounts.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "var(--on-surface-variant)",
          }}
        >
          No accounts found.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
            marginTop: 8,
          }}
        >
          {accounts.map((acc, idx) => (
            <motion.div
              key={acc._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.07 }}
              className="luminous-shadow"
              style={{
                borderRadius: "1rem",
                padding: "1.25rem",
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                position: "relative",
                minHeight: 120,
                cursor: "pointer",
                transition: "box-shadow 0.15s, transform 0.15s",
              }}
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedAccount(acc)}
            >
              {/* Header: Name + Website */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Building2 size={20} color="#124af1" />
                <span
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: "1.08rem",
                    color: "#1a1a2e",
                  }}
                >
                  {acc.companyName}
                </span>
                {acc.website && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: "0.82rem",
                      color: "#6b7194",
                    }}
                  >
                    <Globe size={12} /> {acc.website}
                  </span>
                )}
              </div>

              {/* Badges Row: Priority + Score + Timestamp */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {acc.priority && (
                  <span
                    style={{
                      fontSize: "0.62rem",
                      borderRadius: 4,
                      background:
                        acc.priority === "high"
                          ? "var(--error)"
                          : acc.priority === "medium"
                            ? "#f59e0b"
                            : "var(--secondary-brand)",
                      color: "#fff",
                      padding: "0.15rem 0.6rem",
                      fontFamily: "var(--font-label)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {acc.priority}
                  </span>
                )}
                {acc.buyingSignalScore != null && (
                  <span
                    style={{
                      fontSize: "0.88rem",
                      color: "#124af1",
                      fontWeight: 700,
                      fontFamily: "var(--font-label)",
                    }}
                  >
                    {acc.buyingSignalScore}/10
                  </span>
                )}
                {acc.timestamp && (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "#6b7194",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      marginLeft: "auto",
                    }}
                  >
                    <Clock size={11} />
                    {new Date(acc.timestamp).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Rationale */}
              {acc.rationale && (
                <div
                  style={{
                    fontSize: "0.84rem",
                    color: "#6b7194",
                    lineHeight: 1.45,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {acc.rationale}
                </div>
              )}

              {/* Insights Pill Row */}
              {acc.insights && (
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginTop: 2,
                  }}
                >
                  {(acc.insights.strategicContext?.length ?? 0) > 0 && (
                    <span style={insightPillStyle("#124af1")}>
                      <Target size={10} />{" "}
                      {acc.insights.strategicContext.length} Strategic
                    </span>
                  )}
                  {(acc.insights.ecommercePriorities?.length ?? 0) > 0 && (
                    <span style={insightPillStyle("#4e45e4")}>
                      <TrendingUp size={10} />{" "}
                      {acc.insights.ecommercePriorities.length} Priorities
                    </span>
                  )}
                  {(acc.insights.activeInitiatives?.length ?? 0) > 0 && (
                    <span style={insightPillStyle("#22c55e")}>
                      <Zap size={10} /> {acc.insights.activeInitiatives.length}{" "}
                      Initiatives
                    </span>
                  )}
                  {(acc.insights.keyChallenges?.length ?? 0) > 0 && (
                    <span style={insightPillStyle("#ef4444")}>
                      <AlertTriangle size={10} />{" "}
                      {acc.insights.keyChallenges.length} Challenges
                    </span>
                  )}
                  {(acc.insights.opportunityFrame?.length ?? 0) > 0 && (
                    <span style={insightPillStyle("#8720de")}>
                      <Crosshair size={10} />{" "}
                      {acc.insights.opportunityFrame.length} Opportunities
                    </span>
                  )}
                </div>
              )}

              {/* Reports indicator */}
              {acc.reports?.chatGptAnalysis && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAccount(acc);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: "auto",
                    paddingTop: 6,
                    borderTop: "1px solid rgba(107,113,148,0.1)",
                    cursor: "pointer",
                    borderRadius: 8,
                    padding: "6px 8px",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(135,32,222,0.06)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <Sparkles size={13} color="#8720de" />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#8720de",
                      fontFamily: "var(--font-label)",
                      fontWeight: 600,
                    }}
                  >
                    AI Analysis Available
                  </span>
                  <ChevronRight
                    size={12}
                    color="#8720de"
                    style={{ marginLeft: "auto" }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Research Report Slide-out Panel */}
      <AnimatePresence>
        {selectedAccount && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              position: "fixed",
              top: 0,
              left: 220,
              right: 0,
              bottom: 0,
              backgroundColor: "var(--background)",
              zIndex: 950,
              overflow: "auto",
            }}
          >
            {/* Panel header */}
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.5rem",
                backgroundColor: "var(--background)",
                borderBottom: "1px solid rgba(167,176,222,0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => setSelectedAccount(null)}
                  style={{
                    background: "var(--surface-container-low)",
                    border: "none",
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  <X size={16} />
                </button>
                <Building2 size={20} color="var(--primary)" />
                <span
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: "var(--on-background)",
                  }}
                >
                  {selectedAccount.companyName}
                </span>
                {selectedAccount.priority && (
                  <span
                    style={{
                      fontSize: "0.62rem",
                      borderRadius: 4,
                      background:
                        selectedAccount.priority === "high"
                          ? "var(--error)"
                          : selectedAccount.priority === "medium"
                            ? "#f59e0b"
                            : "var(--secondary-brand)",
                      color: "#fff",
                      padding: "0.15rem 0.6rem",
                      fontFamily: "var(--font-label)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {selectedAccount.priority}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "var(--on-surface-variant)",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                }}
              >
                Research Hub / {selectedAccount.companyName}
              </span>
            </div>

            {/* Panel content */}
            <div style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
              <ResearchReportContent account={selectedAccount} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-page overlay panel for sub-pages */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              position: "fixed",
              top: 0,
              left: 220,
              right: 0,
              bottom: 0,
              backgroundColor: "var(--background)",
              zIndex: 900,
              overflow: "auto",
            }}
          >
            {/* Panel header with close */}
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.5rem",
                backgroundColor: "var(--background)",
                borderBottom: "1px solid rgba(167,176,222,0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => setActivePanel(null)}
                  style={{
                    background: "var(--surface-container-low)",
                    border: "none",
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  <X size={16} />
                </button>
                <span
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: "var(--on-background)",
                  }}
                >
                  {activePanel}
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "var(--on-surface-variant)",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                }}
              >
                Research Hub / {activePanel}
              </span>
            </div>

            {/* Panel content */}
            <div>
              {activePanel === "Agent Swarm" && <AgentSwarm />}
              {activePanel === "Territory Neural Network" && (
                <ComingSoonPanel name="Territory Neural Network" />
              )}
              {activePanel === "Champion's League" && (
                <ComingSoonPanel name="Champion's League" />
              )}
              {activePanel === "Research Insights & Workflows" && (
                <ComingSoonPanel name="Research Insights & Workflows" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Research Report Content ─── */
function ResearchReportContent({ account }: { account: Account }) {
  const sectionCard: React.CSSProperties = {
    borderRadius: "1rem",
    padding: "1.25rem",
    backgroundColor: "var(--surface-container-lowest)",
    border: "1px solid rgba(167,176,222,0.10)",
    marginBottom: 16,
  };

  const sectionTitle = (
    icon: React.ReactNode,
    title: string,
  ): React.ReactNode => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        fontFamily: "var(--font-headline)",
        fontWeight: 700,
        fontSize: "0.95rem",
        color: "var(--on-background)",
      }}
    >
      {icon}
      {title}
    </div>
  );

  const labelStyle: React.CSSProperties = {
    fontSize: "0.7rem",
    fontFamily: "var(--font-label)",
    fontWeight: 600,
    color: "var(--on-surface-variant)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: 4,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: "0.88rem",
    color: "var(--on-surface)",
    lineHeight: 1.5,
  };

  const sourceBadge = (source: string, color: string) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: "0.58rem",
        fontFamily: "var(--font-label)",
        fontWeight: 700,
        padding: "0.1rem 0.45rem",
        borderRadius: 9999,
        background: `${color}12`,
        color,
        marginLeft: 6,
        verticalAlign: "middle",
      }}
    >
      <Link2 size={8} />
      {source}
    </span>
  );

  const renderInsightList = (
    items: unknown[],
    color: string,
    sourceLabel?: string,
  ) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item: any, i: number) => (
          <div
            key={i}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: `${color}08`,
              borderLeft: `3px solid ${color}`,
            }}
          >
            {item.title && (
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "0.84rem",
                  color: "var(--on-surface)",
                  marginBottom: 2,
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {item.title}
                {item.source
                  ? sourceBadge(item.source, color)
                  : sourceLabel
                    ? sourceBadge(sourceLabel, color)
                    : sourceBadge("Perplexity + ChatGPT", "#6b7194")}
              </div>
            )}
            {item.description && (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--on-surface-variant)",
                  lineHeight: 1.45,
                }}
              >
                {item.description}
              </div>
            )}
            {item.citation && (
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--on-surface-variant)",
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontStyle: "italic",
                }}
              >
                <ExternalLink size={9} />
                {item.citation}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderChampionCards = (
    candidates: ChampionCandidate[] | undefined,
    icon: React.ReactNode,
    tierLabel: string,
    accentColor: string,
  ) => {
    if (!candidates || candidates.length === 0) return null;
    return (
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
            fontSize: "0.8rem",
            fontFamily: "var(--font-label)",
            fontWeight: 700,
            color: accentColor,
          }}
        >
          {icon}
          {tierLabel}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 10,
          }}
        >
          {candidates.map((c, i) => (
            <div
              key={i}
              style={{
                borderRadius: 12,
                padding: "12px 14px",
                background: `${accentColor}06`,
                border: `1px solid ${accentColor}20`,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  color: "var(--on-surface)",
                  marginBottom: 2,
                }}
              >
                {c.full_name || "Unknown"}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--on-surface-variant)",
                  marginBottom: 6,
                }}
              >
                {c.title_role || ""}
                {c.department ? ` · ${c.department}` : ""}
              </div>
              {c.pain_hypothesis && (
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--on-surface)",
                    marginBottom: 4,
                  }}
                >
                  <span style={labelStyle}>Pain Hypothesis</span>
                  <div style={valueStyle}>{c.pain_hypothesis}</div>
                </div>
              )}
              {c.reason_for_resistance && (
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--on-surface)",
                    marginBottom: 4,
                  }}
                >
                  <span style={labelStyle}>Resistance</span>
                  <div style={valueStyle}>{c.reason_for_resistance}</div>
                </div>
              )}
              {c.outreach_angle && (
                <div style={{ fontSize: "0.78rem", marginBottom: 4 }}>
                  <span style={labelStyle}>Outreach Angle</span>
                  <div style={valueStyle}>{c.outreach_angle}</div>
                </div>
              )}
              {c.champion_readiness && (
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "0.62rem",
                    fontFamily: "var(--font-label)",
                    fontWeight: 700,
                    padding: "0.15rem 0.6rem",
                    borderRadius: 9999,
                    background: `${accentColor}14`,
                    color: accentColor,
                    marginTop: 4,
                  }}
                >
                  Readiness: {c.champion_readiness}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Company Overview */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0 }}
        style={sectionCard}
      >
        {sectionTitle(
          <Building2 size={18} color="var(--primary)" />,
          "Company Overview",
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}
        >
          <div>
            <div style={labelStyle}>Website</div>
            <div style={valueStyle}>{account.website || "—"}</div>
          </div>
          <div>
            <div style={labelStyle}>Buying Signal Score</div>
            <div
              style={{
                ...valueStyle,
                fontWeight: 700,
                color: "var(--primary)",
                fontSize: "1.1rem",
              }}
            >
              {account.buyingSignalScore != null
                ? `${account.buyingSignalScore}/10`
                : "—"}
            </div>
          </div>
          <div>
            <div style={labelStyle}>Last Updated</div>
            <div style={valueStyle}>
              {account.timestamp
                ? new Date(account.timestamp).toLocaleDateString()
                : "—"}
            </div>
          </div>
        </div>
        {account.rationale && (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                ...labelStyle,
                display: "flex",
                alignItems: "center",
              }}
            >
              Rationale
              {sourceBadge("Perplexity + ChatGPT", "#6b7194")}
            </div>
            <div style={{ ...valueStyle, lineHeight: 1.6 }}>
              {account.rationale}
            </div>
          </div>
        )}
      </motion.div>

      {/* Strategic Insights */}
      {account.insights && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.07 }}
          style={sectionCard}
        >
          {sectionTitle(
            <Brain size={18} color="#8720de" />,
            "Strategic Insights",
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {account.insights.strategicContext?.length > 0 && (
              <div>
                <div
                  style={{ ...labelStyle, color: "#124af1", marginBottom: 6 }}
                >
                  Strategic Context
                </div>
                {renderInsightList(
                  account.insights.strategicContext,
                  "#124af1",
                  "Perplexity Research",
                )}
              </div>
            )}
            {account.insights.ecommercePriorities?.length > 0 && (
              <div>
                <div
                  style={{ ...labelStyle, color: "#4e45e4", marginBottom: 6 }}
                >
                  E-commerce Priorities
                </div>
                {renderInsightList(
                  account.insights.ecommercePriorities,
                  "#4e45e4",
                  "Perplexity Research",
                )}
              </div>
            )}
            {account.insights.activeInitiatives?.length > 0 && (
              <div>
                <div
                  style={{ ...labelStyle, color: "#22c55e", marginBottom: 6 }}
                >
                  Active Initiatives
                </div>
                {renderInsightList(
                  account.insights.activeInitiatives,
                  "#22c55e",
                  "ChatGPT Analysis",
                )}
              </div>
            )}
            {account.insights.keyChallenges?.length > 0 && (
              <div>
                <div
                  style={{ ...labelStyle, color: "#ef4444", marginBottom: 6 }}
                >
                  Key Challenges
                </div>
                {renderInsightList(
                  account.insights.keyChallenges,
                  "#ef4444",
                  "Perplexity Research",
                )}
              </div>
            )}
            {account.insights.opportunityFrame?.length > 0 && (
              <div>
                <div
                  style={{ ...labelStyle, color: "#8720de", marginBottom: 6 }}
                >
                  Opportunity Frame
                </div>
                {renderInsightList(
                  account.insights.opportunityFrame,
                  "#8720de",
                  "ChatGPT Analysis",
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Champion Mapping */}
      {(account.champion_cxo_candidates?.length ||
        account.champion_vp_director_candidates?.length ||
        account.champion_enduser_candidates?.length ||
        account.detractors?.length) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.14 }}
          style={sectionCard}
        >
          {sectionTitle(
            <Shield size={18} color="#124af1" />,
            "Champion Mapping",
          )}
          {account.primary_champion_recommendation && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, rgba(135,32,222,0.08), rgba(78,69,228,0.08))",
                marginBottom: 16,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <Star
                size={16}
                color="#8720de"
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <div>
                <div
                  style={{
                    ...labelStyle,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Primary Champion Recommendation
                  {sourceBadge("Agent Swarm", "#8720de")}
                </div>
                <div style={valueStyle}>
                  {account.primary_champion_recommendation}
                </div>
              </div>
            </div>
          )}
          {account.champion_overall_readiness && (
            <div style={{ marginBottom: 14 }}>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontFamily: "var(--font-label)",
                  fontWeight: 700,
                  padding: "0.15rem 0.6rem",
                  borderRadius: 9999,
                  background: "rgba(18,74,241,0.10)",
                  color: "#124af1",
                }}
              >
                Overall Readiness: {account.champion_overall_readiness}
              </span>
            </div>
          )}
          {renderChampionCards(
            account.champion_cxo_candidates,
            <Crown size={14} />,
            "CXO Candidates",
            "#8720de",
          )}
          {renderChampionCards(
            account.champion_vp_director_candidates,
            <UserCheck size={14} />,
            "VP / Director Candidates",
            "#124af1",
          )}
          {renderChampionCards(
            account.champion_enduser_candidates,
            <Users size={14} />,
            "End-User Champions",
            "#22c55e",
          )}
          {renderChampionCards(
            account.detractors,
            <UserX size={14} />,
            "Detractors",
            "#ef4444",
          )}
        </motion.div>
      )}

      {/* Agent Results */}
      {account.agentResults && Object.keys(account.agentResults).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.21 }}
          style={sectionCard}
        >
          {sectionTitle(
            <Sparkles size={18} color="#8720de" />,
            "Agent Results",
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(account.agentResults).map(([agentId, result]) => (
              <details
                key={agentId}
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(167,176,222,0.12)",
                  overflow: "hidden",
                }}
              >
                <summary
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontFamily: "var(--font-label)",
                    fontWeight: 600,
                    fontSize: "0.84rem",
                    color: "var(--on-surface)",
                    background: "var(--surface-container-low)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FileText size={14} color="var(--primary)" />
                  {agentId}
                  {result.executedAt && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "0.68rem",
                        color: "var(--on-surface-variant)",
                      }}
                    >
                      {new Date(result.executedAt).toLocaleString()}
                    </span>
                  )}
                </summary>
                <div
                  style={{
                    padding: "12px 14px",
                    fontSize: "0.82rem",
                    color: "var(--on-surface)",
                    lineHeight: 1.55,
                  }}
                >
                  {result.error ? (
                    <span style={{ color: "var(--error)" }}>
                      Error: {result.error}
                    </span>
                  ) : typeof result.output === "object" ? (
                    <pre
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.8rem",
                        margin: 0,
                        maxHeight: 400,
                        overflow: "auto",
                      }}
                    >
                      {JSON.stringify(result.output, null, 2)}
                    </pre>
                  ) : (
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {result.rawText || String(result.output)}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </motion.div>
      )}

      {/* Swarm Briefs */}
      {account.swarmBriefs && Object.keys(account.swarmBriefs).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.28 }}
          style={sectionCard}
        >
          {sectionTitle(
            <Target size={18} color="#06b6d4" />,
            "Swarm Synthesis Briefs",
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(account.swarmBriefs).map(([key, brief]) => (
              <div
                key={key}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(6,182,212,0.04)",
                  border: "1px solid rgba(6,182,212,0.12)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      fontFamily: "var(--font-label)",
                      color: "var(--on-surface)",
                    }}
                  >
                    {key}
                  </span>
                  {brief.executedAt && (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--on-surface-variant)",
                      }}
                    >
                      {new Date(brief.executedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--on-surface)",
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {brief.brief}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Source Documents */}
      {(account.reports?.chatGptAnalysis ||
        account.reports?.perplexityResearch) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          style={sectionCard}
        >
          {sectionTitle(
            <FileText size={18} color="#06b6d4" />,
            "Source Documents",
          )}
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--on-surface-variant)",
              marginBottom: 12,
              fontStyle: "italic",
            }}
          >
            All insights, strategic context, and recommendations above are
            derived from the following source reports.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {account.reports?.perplexityResearch && (
              <details
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(167,176,222,0.12)",
                  overflow: "hidden",
                }}
              >
                <summary
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontFamily: "var(--font-label)",
                    fontWeight: 600,
                    fontSize: "0.84rem",
                    color: "var(--on-surface)",
                    background: "var(--surface-container-low)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Globe size={14} color="#8720de" />
                  Perplexity Research Report
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: "0.62rem",
                      fontFamily: "var(--font-label)",
                      fontWeight: 700,
                      padding: "0.1rem 0.45rem",
                      borderRadius: 9999,
                      background: "rgba(135,32,222,0.10)",
                      color: "#8720de",
                    }}
                  >
                    PRIMARY SOURCE
                  </span>
                </summary>
                <div
                  style={{
                    padding: "12px 14px",
                    fontSize: "0.82rem",
                    color: "var(--on-surface)",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    maxHeight: 500,
                    overflow: "auto",
                  }}
                >
                  {account.reports.perplexityResearch}
                </div>
              </details>
            )}
            {account.reports?.chatGptAnalysis && (
              <details
                style={{
                  borderRadius: 10,
                  border: "1px solid rgba(167,176,222,0.12)",
                  overflow: "hidden",
                }}
              >
                <summary
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontFamily: "var(--font-label)",
                    fontWeight: 600,
                    fontSize: "0.84rem",
                    color: "var(--on-surface)",
                    background: "var(--surface-container-low)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Brain size={14} color="#124af1" />
                  ChatGPT Analysis Report
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: "0.62rem",
                      fontFamily: "var(--font-label)",
                      fontWeight: 700,
                      padding: "0.1rem 0.45rem",
                      borderRadius: 9999,
                      background: "rgba(18,74,241,0.10)",
                      color: "#124af1",
                    }}
                  >
                    PRIMARY SOURCE
                  </span>
                </summary>
                <div
                  style={{
                    padding: "12px 14px",
                    fontSize: "0.82rem",
                    color: "var(--on-surface)",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    maxHeight: 500,
                    overflow: "auto",
                  }}
                >
                  {account.reports.chatGptAnalysis}
                </div>
              </details>
            )}
          </div>
        </motion.div>
      )}

      {/* Citations & References */}
      {(account.metadata?.citations?.length > 0 ||
        account.metadata?.searchResults?.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.42 }}
          style={sectionCard}
        >
          {sectionTitle(
            <Link2 size={18} color="#f59e0b" />,
            "Citations & References",
          )}
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--on-surface-variant)",
              marginBottom: 12,
              fontStyle: "italic",
            }}
          >
            External sources referenced during the research process. All data
            points in this report are traceable to these citations.
          </div>
          {account.metadata?.citations?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...labelStyle, marginBottom: 8 }}>
                Citations ({(account.metadata.citations as any[]).length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(account.metadata.citations as any[]).map(
                  (c: any, i: number) => {
                    const url =
                      typeof c === "string"
                        ? c.startsWith("http")
                          ? c
                          : null
                        : c.url || null;
                    const title =
                      typeof c === "string"
                        ? c
                        : c.title || c.url || JSON.stringify(c);
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: "rgba(245,158,11,0.04)",
                          border: "1px solid rgba(245,158,11,0.10)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontFamily: "var(--font-label)",
                            fontWeight: 700,
                            color: "#f59e0b",
                            minWidth: 20,
                            flexShrink: 0,
                          }}
                        >
                          [{i + 1}]
                        </span>
                        <div style={{ flex: 1 }}>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--primary)",
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                wordBreak: "break-all",
                              }}
                            >
                              {title}
                              <ExternalLink
                                size={10}
                                style={{ flexShrink: 0 }}
                              />
                            </a>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--on-surface-variant)",
                                wordBreak: "break-all",
                              }}
                            >
                              {title}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}
          {account.metadata?.searchResults?.length > 0 && (
            <div>
              <div style={{ ...labelStyle, marginBottom: 8 }}>
                Search Results (
                {(account.metadata.searchResults as any[]).length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(account.metadata.searchResults as any[])
                  .slice(0, 15)
                  .map((sr: any, i: number) => {
                    const url = sr.url || sr.link || null;
                    const title =
                      sr.title || sr.snippet || url || JSON.stringify(sr);
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: "rgba(18,74,241,0.03)",
                          border: "1px solid rgba(18,74,241,0.08)",
                        }}
                      >
                        <ExternalLink
                          size={11}
                          color="var(--primary)"
                          style={{ flexShrink: 0, marginTop: 2 }}
                        />
                        <div style={{ flex: 1 }}>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--primary)",
                                textDecoration: "none",
                                wordBreak: "break-all",
                              }}
                            >
                              {title}
                            </a>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--on-surface-variant)",
                              }}
                            >
                              {title}
                            </span>
                          )}
                          {sr.snippet && sr.title && (
                            <div
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--on-surface-variant)",
                                marginTop: 2,
                                lineHeight: 1.4,
                              }}
                            >
                              {sr.snippet}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Metadata */}
      {account.metadata && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.49 }}
          style={sectionCard}
        >
          {sectionTitle(
            <Clock size={18} color="var(--on-surface-variant)" />,
            "Metadata",
          )}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {account.metadata.lastSwarmRun && (
              <div>
                <div style={labelStyle}>Last Swarm Run</div>
                <div style={valueStyle}>
                  {new Date(account.metadata.lastSwarmRun).toLocaleString()}
                </div>
              </div>
            )}
            {account.timestamp && (
              <div>
                <div style={labelStyle}>Record Timestamp</div>
                <div style={valueStyle}>
                  {new Date(account.timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ComingSoonPanel({ name }: { name: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 16,
        color: "var(--on-surface-variant)",
      }}
    >
      <Sparkles size={40} color="var(--tertiary)" />
      <div
        style={{
          fontFamily: "var(--font-headline)",
          fontWeight: 700,
          fontSize: "1.3rem",
          color: "var(--on-background)",
        }}
      >
        {name}
      </div>
      <div style={{ fontSize: "0.92rem" }}>Coming soon</div>
    </div>
  );
}

function insightPillStyle(color: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: "0.62rem",
    fontWeight: 700,
    fontFamily: "var(--font-label)",
    padding: "0.15rem 0.55rem",
    borderRadius: 9999,
    background: `${color}14`,
    color,
  };
}

function kpiBadgeStyle(color: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: "0.65rem",
    fontWeight: 700,
    fontFamily: "var(--font-label)",
    padding: "0.15rem 0.6rem",
    borderRadius: 9999,
    background: `${color}14`,
    color,
  };
}

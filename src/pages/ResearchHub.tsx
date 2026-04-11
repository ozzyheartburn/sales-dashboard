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
  AreaChart,
  Area,
} from "recharts";
import { AgentSwarm } from "./AgentSwarm";

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
  };
  timestamp: string;
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

      {/* --- ANALYTICS VIEWS --- */}
      <div style={{ display: "flex", gap: 20, marginBottom: 28 }}>
        {/* Quantitative Metrics */}
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
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "1rem",
                color: "#1a1a2e",
              }}
            >
              Quantitative Metrics
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                style={{
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  padding: "0.3rem 0.6rem",
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                }}
              >
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last 12 months</option>
              </select>
              <select
                style={{
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  padding: "0.3rem 0.6rem",
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                }}
              >
                <option>All Accounts</option>
                <option>Top Priority</option>
                <option>Medium Priority</option>
              </select>
            </div>
          </div>
          {/* KPI row */}
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            {[
              { label: "Research/wk", value: "7.2", color: "#124af1" },
              { label: "Meetings/wk", value: "2.3", color: "#22c55e" },
              { label: "SQOs/mo", value: "4.2", color: "#8720de" },
              { label: "Avg Deal", value: "$42.5k", color: "#f59e0b" },
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
          {/* Meetings & SQOs Bar Chart */}
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#6b7194",
              fontFamily: "var(--font-label)",
              marginBottom: 6,
            }}
          >
            Meetings & SQOs (last 6 months)
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart
              data={[
                { month: "Oct", meetings: 6, sqos: 2 },
                { month: "Nov", meetings: 8, sqos: 3 },
                { month: "Dec", meetings: 7, sqos: 3 },
                { month: "Jan", meetings: 10, sqos: 4 },
                { month: "Feb", meetings: 9, sqos: 5 },
                { month: "Mar", meetings: 11, sqos: 5 },
              ]}
              barGap={2}
              barCategoryGap="20%"
            >
              <CartesianGrid stroke="rgba(167,176,222,0.15)" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 11,
                  fill: "#6b7194",
                  fontFamily: "var(--font-label)",
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#6b7194" }}
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
              <Bar
                dataKey="meetings"
                fill="#124af1"
                radius={[4, 4, 0, 0]}
                name="Meetings"
              />
              <Bar
                dataKey="sqos"
                fill="#8720de"
                radius={[4, 4, 0, 0]}
                name="SQOs"
              />
            </BarChart>
          </ResponsiveContainer>
          {/* Pipeline Trend */}
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
            Pipeline Value ($k)
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart
              data={[
                { month: "Oct", value: 85 },
                { month: "Nov", value: 110 },
                { month: "Dec", value: 95 },
                { month: "Jan", value: 140 },
                { month: "Feb", value: 168 },
                { month: "Mar", value: 195 },
              ]}
            >
              <defs>
                <linearGradient id="pipelineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#124af1" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#124af1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(167,176,222,0.15)" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#6b7194" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#6b7194" }}
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
              <Area
                type="monotone"
                dataKey="value"
                stroke="#124af1"
                strokeWidth={2.5}
                fill="url(#pipelineGrad)"
                name="Pipeline ($k)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Qualitative Metrics */}
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
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "1rem",
                color: "#1a1a2e",
              }}
            >
              Qualitative Metrics
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                style={{
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  padding: "0.3rem 0.6rem",
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                }}
              >
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last 12 months</option>
              </select>
              <select
                style={{
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  padding: "0.3rem 0.6rem",
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                }}
              >
                <option>All Accounts</option>
                <option>Top Priority</option>
                <option>Medium Priority</option>
              </select>
            </div>
          </div>
          {/* Champion Sentiment Donut */}
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
                Champion Sentiment
              </div>
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Positive", value: 58 },
                      { name: "Neutral", value: 27 },
                      { name: "Negative", value: 15 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={48}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
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
                  gap: 10,
                  marginTop: 2,
                }}
              >
                {[
                  { color: "#22c55e", label: "Pos" },
                  { color: "#f59e0b", label: "Neut" },
                  { color: "#ef4444", label: "Neg" },
                ].map((l) => (
                  <div
                    key={l.label}
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
                        background: l.color,
                      }}
                    />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
            {/* Win/Loss Themes */}
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
                Win / Loss Themes
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  {
                    theme: "Discovery relevance",
                    wins: 14,
                    losses: 2,
                    color: "#22c55e",
                  },
                  {
                    theme: "Personalization depth",
                    wins: 11,
                    losses: 4,
                    color: "#124af1",
                  },
                  {
                    theme: "Integration complexity",
                    wins: 3,
                    losses: 9,
                    color: "#ef4444",
                  },
                  {
                    theme: "Time-to-value",
                    wins: 8,
                    losses: 5,
                    color: "#f59e0b",
                  },
                  {
                    theme: "Pricing / ROI clarity",
                    wins: 10,
                    losses: 3,
                    color: "#8720de",
                  },
                ].map((t) => (
                  <div key={t.theme}>
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
                      <span>{t.theme}</span>
                      <span style={{ color: "#6b7194" }}>
                        {t.wins}W / {t.losses}L
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
                          background: t.color,
                          width: `${(t.wins / (t.wins + t.losses)) * 100}%`,
                          transition: "width 0.4s",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Buyer Journey Insights */}
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#6b7194",
              fontFamily: "var(--font-label)",
              marginBottom: 6,
            }}
          >
            Buyer Journey Stage Distribution
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart
              data={[
                { stage: "Awareness", count: 18 },
                { stage: "Interest", count: 14 },
                { stage: "Evaluate", count: 9 },
                { stage: "Commit", count: 6 },
                { stage: "Closed", count: 4 },
              ]}
              layout="vertical"
              barCategoryGap="18%"
            >
              <CartesianGrid
                stroke="rgba(167,176,222,0.15)"
                horizontal={false}
              />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#6b7194" }}
              />
              <YAxis
                type="category"
                dataKey="stage"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#374151", fontWeight: 600 }}
                width={70}
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
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Accounts">
                {[
                  { stage: "Awareness", count: 18 },
                  { stage: "Interest", count: 14 },
                  { stage: "Evaluate", count: 9 },
                  { stage: "Commit", count: 6 },
                  { stage: "Closed", count: 4 },
                ].map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      ["#124af1", "#4e45e4", "#8720de", "#06b6d4", "#22c55e"][i]
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
              }}
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: "auto",
                    paddingTop: 6,
                    borderTop: "1px solid rgba(107,113,148,0.1)",
                  }}
                >
                  <Sparkles size={13} color="#8720de" />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7194",
                      fontFamily: "var(--font-label)",
                      fontWeight: 600,
                    }}
                  >
                    AI Analysis Available
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

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

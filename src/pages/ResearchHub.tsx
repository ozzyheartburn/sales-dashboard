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
      <div style={{ display: "flex", gap: 24, marginBottom: 40 }}>
        {/* Quantitative Metrics */}
        <div style={{ flex: 1, ...glassCard }}>
          <div
            style={{
              fontFamily: "var(--font-headline)",
              fontWeight: 700,
              fontSize: "1.15rem",
              color: "#fff",
              marginBottom: 10,
            }}
          >
            Quantitative Metrics
          </div>
          {/* Filters */}
          <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
            <select
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "0.4rem 0.8rem",
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
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "0.4rem 0.8rem",
                fontFamily: "var(--font-label)",
                fontWeight: 600,
              }}
            >
              <option>All Accounts</option>
              <option>Top Priority</option>
              <option>Medium Priority</option>
            </select>
          </div>
          {/* KPIs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{ color: "#fff", fontSize: "1.05rem", fontWeight: 700 }}
            >
              7.2{" "}
              <span
                style={{
                  color: "#2dd4bf",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                }}
              >
                research processes/week
              </span>
            </div>
            <div
              style={{ color: "#fff", fontSize: "0.98rem", fontWeight: 600 }}
            >
              Contacts/account (avg): CXO{" "}
              <b style={{ color: "#14b8a6" }}>2.1</b>, VP/Dir{" "}
              <b style={{ color: "#4e45e4" }}>3.4</b>, End User{" "}
              <b style={{ color: "#8720de" }}>4.7</b>, Detractor{" "}
              <b style={{ color: "#ef4444" }}>1.2</b>, High Value{" "}
              <b style={{ color: "#f59e0b" }}>1.0</b>
            </div>
            <div
              style={{ color: "#fff", fontSize: "0.98rem", fontWeight: 600 }}
            >
              Sales touches to 1st meeting:{" "}
              <b style={{ color: "#14b8a6" }}>5.8/account</b>,{" "}
              <b style={{ color: "#4e45e4" }}>3.2/contact</b>
            </div>
            <div
              style={{ color: "#fff", fontSize: "0.98rem", fontWeight: 600 }}
            >
              Net new meetings via Deep Research:{" "}
              <b style={{ color: "#2dd4bf" }}>2.3/week</b>,{" "}
              <b style={{ color: "#8720de" }}>8.9/month</b>,{" "}
              <b style={{ color: "#f59e0b" }}>27/quarter</b>
            </div>
            <div
              style={{ color: "#fff", fontSize: "0.98rem", fontWeight: 600 }}
            >
              SQOs from meetings: <b style={{ color: "#22c55e" }}>1.1/week</b>,{" "}
              <b style={{ color: "#4e45e4" }}>4.2/month</b>,{" "}
              <b style={{ color: "#8720de" }}>13/quarter</b>
            </div>
            <div
              style={{ color: "#fff", fontSize: "0.98rem", fontWeight: 600 }}
            >
              Pipeline deal size: <b style={{ color: "#2dd4bf" }}>$42.5k avg</b>
              , <b style={{ color: "#14b8a6" }}>$120k max</b>,{" "}
              <b style={{ color: "#ef4444" }}>$8.2k min</b>
            </div>
          </div>
        </div>
        {/* Qualitative Metrics */}
        <div style={{ flex: 1, ...glassCard }}>
          <div
            style={{
              fontFamily: "var(--font-headline)",
              fontWeight: 700,
              fontSize: "1.15rem",
              color: "#fff",
              marginBottom: 10,
            }}
          >
            Qualitative Metrics
          </div>
          {/* Filters */}
          <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
            <select
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "0.4rem 0.8rem",
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
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "0.4rem 0.8rem",
                fontFamily: "var(--font-label)",
                fontWeight: 600,
              }}
            >
              <option>All Accounts</option>
              <option>Top Priority</option>
              <option>Medium Priority</option>
            </select>
          </div>
          {/* Placeholder for qualitative metrics */}
          <div
            style={{
              color: "#fff",
              fontSize: "0.98rem",
              fontWeight: 600,
              opacity: 0.7,
            }}
          >
            Coming soon: champion sentiment, win/loss themes, buyer journey
            insights, and more.
          </div>
        </div>
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
                backgroundColor: "var(--surface-container-lowest)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                position: "relative",
                minHeight: 120,
              }}
            >
              {/* Header: Name + Website */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Building2 size={20} color="var(--primary)" />
                <span
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: "1.08rem",
                    color: "var(--on-background)",
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
                      color: "var(--on-surface-variant)",
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
                      color: "var(--primary)",
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
                      color: "var(--on-surface-variant)",
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
                    color: "var(--on-surface-variant)",
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
                  <Sparkles size={13} color="var(--tertiary)" />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--on-surface-variant)",
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

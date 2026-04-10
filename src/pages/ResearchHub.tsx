import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Search,
  Building2,
  TrendingUp,
  Sparkles,
  Lightbulb,
  Plus,
  Globe,
  Target,
  Zap,
  AlertTriangle,
  Crosshair,
  Clock,
  Network,
  BarChart3,
} from "lucide-react";

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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function ResearchHub() {
  const [showModal, setShowModal] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const deepInsights = 7;
  const researchToOpp = 66;

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
      // 1. Trigger n8n workflow and wait for the structured result
      const n8nRes = await fetch(
        "https://gtmbaltics.app.n8n.cloud/webhook/002eb43f-96f4-4046-86f3-d0129f19819d",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account_name: accountName,
            website_url: website,
          }),
        },
      );
      const rawData = await n8nRes.json();

      // n8n "All Incoming Items" returns an array — extract the first item
      const researchData = Array.isArray(rawData) ? rawData[0] : rawData;

      // 2. Save the result to MongoDB via our backend
      await fetch(`${API_URL}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(researchData),
      });

      // 3. Refresh the accounts list
      const accountsRes = await fetch(`${API_URL}/api/accounts`);
      const accounts: Account[] = await accountsRes.json();
      const sorted = accounts
        .filter((a) => a.companyName)
        .sort(
          (a, b) => (b.buyingSignalScore || 0) - (a.buyingSignalScore || 0),
        );
      setAccounts(sorted);
    } catch (err) {
      console.error("Research workflow error:", err);
    }
    setIsSubmitting(false);
    setShowModal(false);
    setAccountName("");
    setWebsite("");
  };

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
            color: "var(--on-background)",
          }}
        >
          Research Hub
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background:
              "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
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
          color: "var(--on-surface-variant)",
          marginBottom: 32,
        }}
      >
        Identify pain above the noise and investment urgency based on data
        driven proof
      </div>
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
              "Deploy, orchestrate and customize your agent swarm with custom signals, ICP definitions, and market / competitive intelligence data",
          },
          {
            icon: <Network size={22} color="#fff" />,
            name: "Territory Neural Network",
            description:
              "Dynamic territory management based on agentic automation & analytics",
          },
          {
            icon: <Lightbulb size={22} color="#fff" />,
            name: "Deep Insights & Actions",
            description:
              "PG Machine has identified 7 new HVTs, 2 high urgency signals and 1 new market trend impacting your business",
          },
          {
            icon: <BarChart3 size={22} color="#fff" />,
            name: "Activity Dashboard & Overview",
            description:
              "Review, edit or pause your active research campaigns and agentic swarms with key metrics",
          },
        ].map((widget, i) => (
          <motion.div
            key={widget.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            className="luminous-shadow"
            style={{
              borderRadius: "1rem",
              padding: "1.25rem",
              backgroundColor: "var(--surface-container-lowest)",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
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
                  color: "var(--on-background)",
                }}
              >
                {widget.name}
              </div>
              <div
                style={{
                  fontSize: "0.88rem",
                  color: "var(--on-surface-variant)",
                  marginTop: 4,
                  lineHeight: 1.45,
                }}
              >
                {widget.description}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
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
              color: "var(--on-surface-variant)",
            }}
          />
          <input
            type="text"
            placeholder="Search accounts..."
            style={{
              width: "100%",
              padding: "0.7rem 0.7rem 0.7rem 2.2rem",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: "1rem",
              background: "var(--surface-container-low)",
              color: "var(--on-surface)",
              fontFamily: "var(--font-body)",
            }}
          />
        </div>
        <div
          style={{
            fontSize: "0.95rem",
            color: "var(--on-surface-variant)",
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

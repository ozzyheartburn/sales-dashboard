import { useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Building2,
  TrendingUp,
  Star,
  Sparkles,
  Lightbulb,
  Users,
  Plus,
} from "lucide-react";

const accounts = [
  {
    name: "Nemlig",
    country: "🇩🇰 Denmark",
    priority: "P1",
    score: 92,
    growth: "+18%",
    status: "Active",
  },
  {
    name: "Matas Group",
    country: "🇩🇰 Denmark",
    priority: "P1",
    score: 88,
    growth: "+14%",
    status: "Active",
  },
  {
    name: "SOK",
    country: "🇫🇮 Finland",
    priority: "P1",
    score: 85,
    growth: "+11%",
    status: "Active",
  },
  {
    name: "Onninen",
    country: "🇫🇮 Finland",
    priority: "P2",
    score: 74,
    growth: "+9%",
    status: "At Risk",
  },
  {
    name: "Helly Hansen",
    country: "🇳🇴 Norway",
    priority: "P2",
    score: 71,
    growth: "+7%",
    status: "At Risk",
  },
  {
    name: "Bestseller",
    country: "🇩🇰 Denmark",
    priority: "P2",
    score: 68,
    growth: "+12%",
    status: "Researching",
  },
];

export function ResearchHub() {
  const [showModal, setShowModal] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Placeholder for research stats
  const deepInsights = 7;
  const activeAccounts = 12;
  const researchToOpp = 66;

  // Modal submit handler (calls n8n webhook)
  const handleInitiateResearch = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(
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
      // Optionally check response status
    } catch (err) {
      // Optionally handle error (show toast, etc)
    } finally {
      setIsSubmitting(false);
      setShowModal(false);
      setAccountName("");
      setWebsite("");
    }
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
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "2.5rem",
          gap: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontFamily: "var(--font-headline)",
              fontWeight: 800,
              fontSize: "1.5rem",
              color: "var(--on-background)",
              letterSpacing: "-0.02em",
            }}
          >
            Research Hub
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--on-surface-variant)",
              marginTop: "0.25rem",
            }}
          >
            Account intelligence & org charts for your target accounts.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background:
              "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
            color: "#fff",
            fontWeight: 700,
            fontFamily: "var(--font-label)",
            border: "none",
            borderRadius: 12,
            fontSize: "0.95rem",
            padding: "0.7rem 1.4rem",
            boxShadow: "0 2px 12px 0 rgba(135,32,222,0.08)",
            cursor: "pointer",
            marginLeft: "auto",
            minWidth: 0,
          }}
        >
          <Plus size={17} /> Start New Research
        </button>
      </div>

      {/* Top widgets */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2.5rem",
        }}
      >
        {/* Widget 1: Train AI */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0 }}
          className="luminous-shadow"
          style={{
            borderRadius: "1rem",
            padding: "1.25rem",
            backgroundColor: "var(--surface-container-lowest)",
            display: "flex",
            gap: 18,
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
            }}
          >
            <Sparkles size={22} color="#fff" />
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "1.08rem",
                color: "var(--on-background)",
              }}
            >
              Train the AI
            </div>
            <div
              style={{
                fontSize: "0.93rem",
                color: "var(--on-surface-variant)",
                marginTop: 2,
              }}
            >
              Upload custom prompts, sales/marketing materials, proof points,
              competitive intelligence, ICP & champion info to supercharge
              research.
            </div>
          </div>
        </motion.div>
        {/* Widget 2: Deep Insights */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.07 }}
          className="luminous-shadow"
          style={{
            borderRadius: "1rem",
            padding: "1.25rem",
            backgroundColor: "var(--surface-container-lowest)",
            display: "flex",
            gap: 18,
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
            }}
          >
            <Lightbulb size={22} color="#fff" />
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "1.08rem",
                color: "var(--on-background)",
              }}
            >
              New Deep Insights
            </div>
            <div
              style={{
                fontSize: "0.93rem",
                color: "var(--on-surface-variant)",
                marginTop: 2,
              }}
            >
              <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                {deepInsights}
              </span>{" "}
              complex patterns found in P1 accounts last 7 days.
              <br />
              <span
                style={{
                  fontSize: "0.85em",
                  color: "var(--on-surface-variant)",
                }}
              >
                E.g. hiring for key roles while expanding to new regions —
                insights hard for humans to spot.
              </span>
            </div>
          </div>
        </motion.div>
        {/* Widget 3: Research Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.14 }}
          className="luminous-shadow"
          style={{
            borderRadius: "1rem",
            padding: "1.25rem",
            backgroundColor: "var(--surface-container-lowest)",
            display: "flex",
            gap: 18,
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
            }}
          >
            <Users size={22} color="#fff" />
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "1.08rem",
                color: "var(--on-background)",
              }}
            >
              Accounts Researched
            </div>
            <div
              style={{
                fontSize: "0.93rem",
                color: "var(--on-surface-variant)",
                marginTop: 2,
              }}
            >
              <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                {activeAccounts}
              </span>{" "}
              accounts with deep research & org chart.
              <br />
              <span
                style={{
                  fontSize: "0.85em",
                  color: "var(--on-surface-variant)",
                }}
              >
                Research → Opportunity conversion:{" "}
                <span style={{ color: "var(--tertiary)", fontWeight: 700 }}>
                  {researchToOpp}%
                </span>{" "}
                (last quarter)
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div
        style={{ position: "relative", marginBottom: "1.5rem", maxWidth: 400 }}
      >
        <Search
          size={14}
          color="var(--on-surface-variant)"
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
        <input
          placeholder="Search accounts..."
          style={{
            width: "100%",
            padding: "0.625rem 0.875rem 0.625rem 2.5rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(167,176,222,0.15)",
            backgroundColor: "var(--surface-container-lowest)",
            color: "var(--on-surface)",
            fontFamily: "var(--font-body)",
            fontSize: "0.875rem",
            outline: "none",
          }}
        />
      </div>

      {/* Account Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {accounts.map((acc, i) => (
          <motion.div
            key={acc.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="luminous-shadow"
            style={{
              borderRadius: "1rem",
              padding: "1.25rem",
              backgroundColor: "var(--surface-container-lowest)",
              cursor: "pointer",
              border: "1px solid rgba(167,176,222,0.05)",
              transition: "border-color 140ms",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(18,74,241,0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(167,176,222,0.05)";
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background:
                      "linear-gradient(135deg, var(--primary), var(--secondary-brand))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Building2 size={18} color="#fff" />
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-headline)",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: "var(--on-background)",
                    }}
                  >
                    {acc.name}
                  </p>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    {acc.country}
                  </p>
                </div>
              </div>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-label)",
                  borderRadius: 4,
                  padding: "0.15rem 0.5rem",
                  backgroundColor:
                    acc.priority === "P1" ? "var(--error)" : "#f59e0b",
                  color: "#fff",
                }}
              >
                {acc.priority}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginBottom: 4,
                  }}
                >
                  <Star size={11} color="#f59e0b" fill="#f59e0b" />
                  <span
                    style={{
                      fontFamily: "var(--font-headline)",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: "var(--on-background)",
                    }}
                  >
                    {acc.score}
                  </span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    priority score
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <TrendingUp size={11} color="#22c55e" />
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "#22c55e",
                      fontWeight: 600,
                    }}
                  >
                    {acc.growth} YoY
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                  borderRadius: "9999px",
                  padding: "0.2rem 0.75rem",
                  backgroundColor:
                    acc.status === "Active"
                      ? "rgba(34,197,94,0.1)"
                      : acc.status === "At Risk"
                        ? "rgba(172,49,73,0.1)"
                        : "rgba(18,74,241,0.1)",
                  color:
                    acc.status === "Active"
                      ? "#22c55e"
                      : acc.status === "At Risk"
                        ? "var(--error)"
                        : "var(--primary)",
                }}
              >
                {acc.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal for new research */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(24,20,36,0.18)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "var(--surface-container-lowest)",
              borderRadius: 18,
              padding: "2.2rem 2.5rem",
              minWidth: 340,
              boxShadow: "0 6px 32px 0 rgba(18,74,241,0.10)",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              alignItems: "stretch",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: 18,
                right: 18,
                background: "none",
                border: "none",
                color: "var(--on-surface-variant)",
                fontSize: 22,
                cursor: "pointer",
                padding: 0,
              }}
              aria-label="Close"
            >
              ×
            </button>
            <div
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "1.15rem",
                color: "var(--on-background)",
                marginBottom: 2,
              }}
            >
              Initiate Deep Research
            </div>
            <label
              style={{
                fontSize: "0.92rem",
                color: "var(--on-surface-variant)",
                marginBottom: 2,
              }}
            >
              Account Name
            </label>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              style={{
                padding: "0.7rem 1rem",
                borderRadius: 10,
                border: "1px solid rgba(167,176,222,0.18)",
                background: "var(--surface-container-low)",
                color: "var(--on-surface)",
                fontFamily: "var(--font-body)",
                fontSize: "1rem",
                marginBottom: 8,
                outline: "none",
              }}
              placeholder="e.g. Nemlig"
              autoFocus
            />
            <label
              style={{
                fontSize: "0.92rem",
                color: "var(--on-surface-variant)",
                marginBottom: 2,
              }}
            >
              Website Address
            </label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              style={{
                padding: "0.7rem 1rem",
                borderRadius: 10,
                border: "1px solid rgba(167,176,222,0.18)",
                background: "var(--surface-container-low)",
                color: "var(--on-surface)",
                fontFamily: "var(--font-body)",
                fontSize: "1rem",
                marginBottom: 8,
                outline: "none",
              }}
              placeholder="e.g. nemlig.com"
            />
            <button
              onClick={handleInitiateResearch}
              disabled={!accountName || !website || isSubmitting}
              style={{
                marginTop: 10,
                background:
                  "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                color: "#fff",
                fontWeight: 700,
                fontFamily: "var(--font-label)",
                border: "none",
                borderRadius: 10,
                fontSize: "1rem",
                padding: "0.8rem 1.2rem",
                cursor:
                  !accountName || !website || isSubmitting
                    ? "not-allowed"
                    : "pointer",
                opacity: !accountName || !website || isSubmitting ? 0.7 : 1,
                boxShadow: "0 2px 12px 0 rgba(135,32,222,0.08)",
              }}
            >
              {isSubmitting ? "Initiating..." : "Initiate Deep Research"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

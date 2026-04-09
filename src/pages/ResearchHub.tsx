import { useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Building2,
  TrendingUp,
  Star,
  Sparkles,
  Lightbulb,
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
  const deepInsights = 7;
  const activeAccounts = 12;
  const researchToOpp = 66;

  const handleInitiateResearch = async () => {
    setIsSubmitting(true);
    try {
      await fetch(
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
    } catch (err) {}
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
          marginBottom: 32,
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
        style={{ display: "flex", gap: 24, marginBottom: 36, flexWrap: "wrap" }}
      >
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
            minWidth: 320,
            flex: 1,
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
              Agent Orchestration & Customization
            </div>
            <div
              style={{
                fontSize: "0.93rem",
                color: "var(--on-surface-variant)",
                marginTop: 2,
              }}
            >
              Customize your agentic research by providing prompts, additional
              signals, and configuration options. Tailor the AI agents to focus
              on the signals and pain points most relevant to your sales process
              and ICP.
            </div>
          </div>
        </motion.div>
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
            minWidth: 220,
            flex: 1,
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
              Deep Insights Generated
            </div>
            <div
              style={{
                fontSize: "2.1rem",
                fontWeight: 800,
                color: "var(--primary)",
                marginTop: 2,
              }}
            >
              {deepInsights}
            </div>
            <div
              style={{
                fontSize: "0.93rem",
                color: "var(--on-surface-variant)",
              }}
            >
              in the last 30 days
            </div>
          </div>
        </motion.div>
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
            minWidth: 220,
            flex: 1,
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
            <TrendingUp size={22} color="#fff" />
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
              Research → Opportunity Rate
            </div>
            <div
              style={{
                fontSize: "2.1rem",
                fontWeight: 800,
                color: "var(--primary)",
                marginTop: 2,
              }}
            >
              {researchToOpp}%
            </div>
            <div
              style={{
                fontSize: "0.93rem",
                color: "var(--on-surface-variant)",
              }}
            >
              conversion from research to opp
            </div>
          </div>
        </motion.div>
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
          {activeAccounts} Active Accounts
        </div>
      </div>
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
            key={acc.name}
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
                {acc.name}
              </span>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--on-surface-variant)",
                  marginLeft: 6,
                }}
              >
                {acc.country}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 2,
              }}
            >
              <span
                style={{
                  fontSize: "0.65rem",
                  borderRadius: 4,
                  background:
                    acc.priority === "P1"
                      ? "var(--primary)"
                      : "var(--secondary-brand)",
                  color: "#fff",
                  padding: "0.15rem 0.6rem",
                  fontFamily: "var(--font-label)",
                  fontWeight: 700,
                }}
              >
                {acc.priority}
              </span>
              <span style={{ fontSize: "0.93rem", color: "var(--on-surface)" }}>
                Score: <b>{acc.score}</b>
              </span>
              <span
                style={{
                  fontSize: "0.93rem",
                  color: "var(--on-surface-variant)",
                }}
              >
                Growth: {acc.growth}
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  borderRadius: 9999,
                  background:
                    acc.status === "Active"
                      ? "var(--primary)"
                      : acc.status === "At Risk"
                        ? "var(--error)"
                        : "var(--secondary-brand)",
                  color: "#fff",
                  padding: "0.15rem 0.6rem",
                  fontFamily: "var(--font-label)",
                  fontWeight: 700,
                }}
              >
                {acc.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

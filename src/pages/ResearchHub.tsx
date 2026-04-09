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
        {/* Widget 1: Agent Orchestration & Customization */}
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
              Agent Orchestration & Customization
            </div>
            <div
              style={{
                fontSize: "0.93rem",
                color: "var(--on-surface-variant)",
                marginTop: 2,
              }}
            >
              Customize your agentic research by providing prompts, additional signals, and configuration options. Tailor the AI agents to focus on the signals and pain points most relevant to your sales process and ICP.
            </div>
          </div>
        </motion.div>
        {/* Widget 2: Deep Account Insights */}
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
              Deep Account Insights
            </div>
            <div
              style={{
                fontSize: "0.93rem",
                color: "var(--on-surface-variant)",
                marginTop: 2,
              }}
            >
              AI has identified <span style={{ fontWeight: 700, color: "var(--primary)" }}>6 accounts</span> with high urgency and investment signals, strong pain hypothesis, and identified champion candidates.<br />
              <span style={{ fontSize: "0.85em", color: "var(--on-surface-variant)" }}>
                This analytics view highlights where AI-driven automation delivers the most value.
              </span>
            </div>
            <button
              style={{
                marginTop: 14,
                background: 'linear-gradient(135deg, var(--tertiary), var(--secondary-brand))',
                color: '#fff', fontWeight: 700, fontFamily: 'var(--font-label)',
                border: 'none', borderRadius: 10, fontSize: '1rem', padding: '0.7rem 1.2rem',
                cursor: 'pointer', boxShadow: '0 2px 12px 0 rgba(135,32,222,0.08)'
              }}
            >Review Account-Based Signals</button>
          </div>
        </motion.div>
        {/* Widget 3: Active Accounts in PG Machine */}
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
              Active Accounts in PG Machine
            </div>
            <div
              style={{
                fontSize: "0.93rem",
                color: "var(--on-surface-variant)",
                marginTop: 2,
              }}
            >
              <span style={{ fontWeight: 700, color: "var(--primary)" }}>{activeAccounts}</span> accounts are currently in the research process.<br />
              <span style={{ fontWeight: 700, color: "var(--tertiary)" }}>4 Tier 1</span> accounts open/identified.<br />
              <span style={{ fontWeight: 700, color: "var(--primary)" }}>7 champion</span> and <span style={{ fontWeight: 700, color: "var(--secondary-brand)" }}>2 EB</span> candidates identified.
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

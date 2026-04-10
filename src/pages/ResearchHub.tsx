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
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollingAccount, setPollingAccount] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Glassmorphic card style
  const glassCard: React.CSSProperties = {
    borderRadius: "1rem",
    padding: "1.25rem",
    background: "rgba(36, 40, 54, 0.55)",
    boxShadow: "0 4px 24px 0 rgba(36, 40, 54, 0.18)",
    backdropFilter: "blur(12px)",
    border: "1.5px solid rgba(255,255,255,0.08)",
  };

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/accounts`);
        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        console.error("Error fetching accounts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  // (Other handlers omitted for brevity, implement as needed)

  return (
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
              {pollingAccount ? accounts.length + 1 : accounts.length} Contacts
              Identified{" "}
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

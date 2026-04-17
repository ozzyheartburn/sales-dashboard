import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, buildAuthHeaders } from "../App";
import {
  Search,
  Cpu,
  TrendingUp,
  BarChart3,
  Eye,
  Info,
  Play,
  Plus,
  Sparkles,
  FileText,
  Users,
  Target,
  Clock,
  Trophy,
  AlertTriangle,
  DollarSign,
  Heart,
  Zap,
  ShieldCheck,
  Check,
  Loader2,
  Settings,
  MessageSquare,
  Palette,
  Volume2,
  Mail,
  Phone,
  Globe,
  Brain,
  Shield,
  ChevronRight,
  CheckSquare,
  Square,
  Rocket,
  RefreshCw,
  Download,
  Crosshair,
  Scan,
  ArrowRight,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const defaultAgents: Agent[] = [
  {
    id: "financial-agent",
    name: "FinancialAgent",
    description:
      "Pulls revenue, EBIT margin, growth trajectory, and capital allocation signals (buybacks, capex) to assess whether the account has budget pressure or surplus that drives CVR optimization urgency.",
    icon: <BarChart3 size={18} />,
    enabled: true,
  },
  {
    id: "tech-stack-agent",
    name: "TechStackAgent",
    description:
      "Identifies current search, personalization, recommendations, CDP, and ecommerce platform vendors to detect discovery stack gaps and estimate how replaceable the current setup is.",
    icon: <Cpu size={18} />,
    enabled: true,
  },
  {
    id: "hiring-agent",
    name: "HiringAgent",
    description:
      "Scrapes job boards for open roles in search, ML, product discovery, and ecommerce to detect whether a build-vs-buy decision is imminent or a tech team is scaling.",
    icon: <Users size={18} />,
    enabled: false,
  },
  {
    id: "initiative-agent",
    name: "InitiativeAgent",
    description:
      "Surfaces active platform migrations, M&A events, replatforming projects, and strategic transformation programs that create procurement windows.",
    icon: <Sparkles size={18} />,
    enabled: false,
  },
  {
    id: "category-complexity-agent",
    name: "CategoryComplexityAgent",
    description:
      "Estimates SKU count, number of markets, and catalog breadth to quantify how hard product discovery is to manage manually — and therefore how much value Constructor can add.",
    icon: <BarChart3 size={18} />,
    enabled: false,
  },
  {
    id: "competitor-agent",
    name: "CompetitorAgent",
    description:
      "Researches the discovery maturity of the account's direct competitors to identify whether falling behind on search/personalization is a competitive risk the account should feel urgency about.",
    icon: <Target size={18} />,
    enabled: false,
  },
  {
    id: "sentiment-agent",
    name: "SentimentAgent",
    description:
      "Mines iOS App Store and Google Play reviews for user complaints about search, recommendations, and product finding to surface qualitative discovery pain that no financial report will mention.",
    icon: <Eye size={18} />,
    enabled: false,
  },
  {
    id: "leadership-agent",
    name: "LeadershipAgent",
    description:
      "Tracks recent CXO and VP hires in digital, product, and ecommerce roles — new leadership with a mandate is one of the strongest buying triggers in B2B sales.",
    icon: <Users size={18} />,
    enabled: false,
  },
  {
    id: "earnings-call-agent",
    name: "EarningsCallAgent",
    description:
      "Extracts statements from public earnings call transcripts where executives mention digital conversion, search experience, product discovery, or ecommerce optimization as a priority or problem.",
    icon: <FileText size={18} />,
    enabled: false,
  },
  {
    id: "vendor-tenure-agent",
    name: "VendorTenureAgent",
    description:
      "Estimates how long the account has been on their current discovery vendor by tracking first-detection dates, flagging accounts approaching likely contract renewal windows.",
    icon: <Clock size={18} />,
    enabled: false,
  },
  {
    id: "champion-building-agent",
    name: "ChampionBuildingAgent",
    description:
      "One of the world's most appraised cognitive and behavioral psychologists, who understands how different type of personas get motivated and how to support them in achieving their dreams, while ensuring the sales team also gets their reward for doing it.",
    icon: <Trophy size={18} />,
    enabled: false,
  },
  {
    id: "risk-flagger-agent",
    name: "RiskFlaggerAgent",
    description:
      "The doomsayer who always finds something negative of the current situation, and is solely focused on what could go wrong. Good thing with his character is, however, that his concerns are always based on reality, facts and data driven proof - and not just paranoia.",
    icon: <AlertTriangle size={18} />,
    enabled: false,
  },
  {
    id: "market-research-agent",
    name: "MarketResearchAgent",
    description:
      "Aggregates macro market trends, TAM/SAM sizing, analyst reports, and industry benchmarks to contextualize how market forces create urgency or opportunity for the account.",
    icon: <TrendingUp size={18} />,
    enabled: false,
  },
];

// Value driver templates — each groups agents by enterprise buying theme
interface ValueDriverTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  agentIds: string[];
}

const valueDriverTemplates: ValueDriverTemplate[] = [
  {
    id: "lower-tco",
    name: "Lower TCO / Higher ROI",
    description:
      "Financial signals, earnings insights, and market trends that quantify cost savings and ROI potential for the buyer.",
    icon: <DollarSign size={18} />,
    color: "#22c55e",
    agentIds: [
      "financial-agent",
      "earnings-call-agent",
      "market-research-agent",
    ],
  },
  {
    id: "improved-cx",
    name: "Improved Customer Experience",
    description:
      "Sentiment analysis, competitive benchmarking, and tech stack evaluation to build the case for better discovery UX.",
    icon: <Heart size={18} />,
    color: "#8720de",
    agentIds: ["sentiment-agent", "competitor-agent", "tech-stack-agent"],
  },
  {
    id: "transformation-urgency",
    name: "Business Transformation & Urgency",
    description:
      "Hiring signals, leadership changes, platform initiatives, and financial pressure that create a time-sensitive buying window.",
    icon: <Zap size={18} />,
    color: "#f59e0b",
    agentIds: [
      "initiative-agent",
      "hiring-agent",
      "vendor-tenure-agent",
      "leadership-agent",
      "financial-agent",
    ],
  },
  {
    id: "reduce-risk",
    name: "Reduce Risk & Improve CX (Tech Stack)",
    description:
      "Vendor lock-in risk, category complexity, build-vs-buy signals, and platform migration readiness assessment.",
    icon: <ShieldCheck size={18} />,
    color: "#124af1",
    agentIds: [
      "vendor-tenure-agent",
      "category-complexity-agent",
      "hiring-agent",
      "initiative-agent",
    ],
  },
];

// Dark glassmorphic theme tokens
const dark = {
  bg: "#0a0e1a",
  card: "rgba(255,255,255,0.04)",
  cardBorder: "rgba(255,255,255,0.08)",
  cardHover: "rgba(255,255,255,0.06)",
  text: "rgba(255,255,255,0.92)",
  textMuted: "rgba(255,255,255,0.5)",
  textDim: "rgba(255,255,255,0.35)",
  accent: "#14b8a6",
  accentLight: "#2dd4bf",
  accentGlow: "rgba(20,184,166,0.15)",
  purple: "#8720de",
  purpleGlow: "rgba(135,32,222,0.2)",
  gradient: "linear-gradient(135deg, #8720de, #14b8a6)",
  inputBg: "rgba(255,255,255,0.03)",
  inputBorder: "rgba(255,255,255,0.1)",
  blur: "blur(24px)",
};

export function AgentSwarm() {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [searchQuery, setSearchQuery] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [activeTab, setActiveTab] = useState<
    "instructions" | "dependencies" | "signals"
  >("instructions");
  const [activeTemplates, setActiveTemplates] = useState<string[]>([]);
  const [swarmStatus, setSwarmStatus] = useState<"idle" | "running" | "done">(
    "idle",
  );
  const [swarmMessage, setSwarmMessage] = useState("");
  const [availableAccounts, setAvailableAccounts] = useState<
    { companyName: string; _id: string }[]
  >([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || "";
  const { user } = useAuth();
  const authHeaders = buildAuthHeaders(user);

  // Fetch accounts for the multi-select picker
  useEffect(() => {
    fetch(`${API_URL}/api/accounts`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data: { companyName: string; _id: string }[]) => {
        const populated = data.filter((a) => a.companyName);
        populated.sort((a, b) => a.companyName.localeCompare(b.companyName));
        setAvailableAccounts(populated);
      })
      .catch(() => {});
  }, []);

  const toggleAgent = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    );
  };

  const applyTemplate = (templateId: string) => {
    const template = valueDriverTemplates.find((t) => t.id === templateId);
    if (!template) return;

    setActiveTemplates((prev) => {
      const isAlreadyActive = prev.includes(templateId);
      const next = isAlreadyActive
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId];

      // Build union of all agent IDs from selected templates
      const allAgentIds = new Set<string>();
      for (const tId of next) {
        const t = valueDriverTemplates.find((vt) => vt.id === tId);
        if (t) t.agentIds.forEach((aid) => allAgentIds.add(aid));
      }

      // Enable agents in the union, disable the rest
      setAgents((prevAgents) =>
        prevAgents.map((a) => ({
          ...a,
          enabled: allAgentIds.has(a.id),
        })),
      );

      return next;
    });
  };

  const toggleAccount = (name: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const toggleAllAccounts = () => {
    if (selectedAccounts.length === availableAccounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(availableAccounts.map((a) => a.companyName));
    }
  };

  const runSwarm = async () => {
    const enabledAgents = agents.filter((a) => a.enabled);
    if (enabledAgents.length === 0) {
      setSwarmMessage("Select at least one agent or value driver template.");
      return;
    }

    // Determine target accounts: selected accounts OR typed name
    const targetAccounts =
      selectedAccounts.length > 0
        ? selectedAccounts
        : searchQuery.trim()
          ? [searchQuery.trim()]
          : [];

    if (targetAccounts.length === 0) {
      setSwarmMessage("Select accounts or enter an account name.");
      return;
    }

    const templateStr =
      activeTemplates.length > 0 ? activeTemplates.join("+") : "custom";

    setSwarmStatus("running");
    setSwarmMessage("");
    try {
      if (targetAccounts.length === 1) {
        // Single account → use /api/swarm/run
        const res = await fetch(`${API_URL}/api/swarm/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account_name: targetAccounts[0],
            agents: enabledAgents.map((a) => a.id),
            template: templateStr,
            instructions: customInstructions || undefined,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setSwarmStatus("done");
          setSwarmMessage(
            `Swarm deployed for "${targetAccounts[0]}" — ${enabledAgents.length} agents running in parallel.`,
          );
        } else {
          setSwarmStatus("idle");
          setSwarmMessage(data.error || "Failed to start swarm.");
        }
      } else {
        // Multiple accounts → use /api/swarm/run-all with account_names
        const res = await fetch(`${API_URL}/api/swarm/run-all`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account_names: targetAccounts,
            agents: enabledAgents.map((a) => a.id),
            template: templateStr,
            instructions: customInstructions || undefined,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setSwarmStatus("done");
          setSwarmMessage(
            `Batch swarm deployed — ${enabledAgents.length} agents × ${targetAccounts.length} accounts. Job ID: ${data.jobId}`,
          );
        } else {
          setSwarmStatus("idle");
          setSwarmMessage(data.error || "Failed to start batch swarm.");
        }
      }
    } catch {
      setSwarmStatus("idle");
      setSwarmMessage("Network error — could not reach the server.");
    }
  };

  const activeCount = agents.filter((a) => a.enabled).length;

  const glassCard: React.CSSProperties = {
    borderRadius: "1rem",
    padding: "1.25rem",
    backgroundColor: dark.card,
    backdropFilter: dark.blur,
    WebkitBackdropFilter: dark.blur,
    border: `1px solid ${dark.cardBorder}`,
  };

  return (
    <div
      className="page-container"
      style={{
        padding: "1.5rem",
        maxWidth: 1440,
        margin: "0 auto",
        minHeight: "100vh",
        backgroundColor: dark.bg,
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            fontFamily: "var(--font-headline)",
            fontWeight: 800,
            fontSize: "2rem",
            color: dark.text,
          }}
        >
          Agent Swarm
        </div>
        <div
          style={{
            fontSize: "0.95rem",
            color: dark.textMuted,
            marginBottom: 24,
          }}
        >
          Deploy and customize your Agent Swarm with custom signals, ICP
          definitions, market research and competitive intelligence data
        </div>
      </div>

      {/* Three-Column Layout: Shortcuts + Agent Swarm + Cockpit */}
      <div
        className="agentswarm-layout"
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* LEFT: Shortcuts */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          <div
            style={{
              fontFamily: "var(--font-label)",
              fontWeight: 700,
              fontSize: "0.68rem",
              color: dark.textDim,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "0 4px",
              marginBottom: 2,
            }}
          >
            Quick Actions
          </div>
          {[
            {
              icon: <Rocket size={16} />,
              label: "Run All Agents",
              desc: "Batch swarm across all accounts",
              color: dark.accent,
              action: () => {
                const enabledAgents = agents
                  .filter((a) => a.enabled)
                  .map((a) => a.id);
                if (enabledAgents.length === 0) return;
                setSwarmStatus("running");
                setSwarmMessage("Launching batch swarm on all accounts...");
                fetch(`${API_URL}/api/swarm/run-all`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    agents: enabledAgents,
                    template: activeTemplates.join("+") || null,
                  }),
                })
                  .then((r) => r.json())
                  .then((d) => {
                    setSwarmStatus("done");
                    setSwarmMessage(
                      d.message ||
                        `Batch started for ${d.accountCount} accounts.`,
                    );
                  })
                  .catch(() => {
                    setSwarmStatus("idle");
                    setSwarmMessage("Failed to start batch swarm.");
                  });
              },
            },
            {
              icon: <Crosshair size={16} />,
              label: "Champion Scan",
              desc: "Map champions across all accounts",
              color: dark.purple,
              action: () => {
                setSwarmStatus("running");
                setSwarmMessage(
                  "Running ChampionBuildingAgent on all accounts...",
                );
                fetch(`${API_URL}/api/swarm/run-all`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ agents: ["champion-building-agent"] }),
                })
                  .then((r) => r.json())
                  .then((d) => {
                    setSwarmStatus("done");
                    setSwarmMessage(d.message || "Champion scan started.");
                  })
                  .catch(() => {
                    setSwarmStatus("idle");
                    setSwarmMessage("Failed to start champion scan.");
                  });
              },
            },
            {
              icon: <Scan size={16} />,
              label: "Competitive Intel",
              desc: "Run competitor & market agents",
              color: "#f59e0b",
              action: () => {
                setSwarmStatus("running");
                setSwarmMessage("Running competitive intelligence agents...");
                fetch(`${API_URL}/api/swarm/run-all`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    agents: ["competitor-agent", "market-research-agent"],
                    template: "reduce-risk",
                  }),
                })
                  .then((r) => r.json())
                  .then((d) => {
                    setSwarmStatus("done");
                    setSwarmMessage(d.message || "Competitive intel started.");
                  })
                  .catch(() => {
                    setSwarmStatus("idle");
                    setSwarmMessage("Failed to start competitive intel.");
                  });
              },
            },
            {
              icon: <TrendingUp size={16} />,
              label: "Financial Pulse",
              desc: "Revenue & growth signals for all",
              color: "#22c55e",
              action: () => {
                setSwarmStatus("running");
                setSwarmMessage("Running FinancialAgent on all accounts...");
                fetch(`${API_URL}/api/swarm/run-all`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ agents: ["financial-agent"] }),
                })
                  .then((r) => r.json())
                  .then((d) => {
                    setSwarmStatus("done");
                    setSwarmMessage(d.message || "Financial pulse started.");
                  })
                  .catch(() => {
                    setSwarmStatus("idle");
                    setSwarmMessage("Failed to start financial pulse.");
                  });
              },
            },
            {
              icon: <RefreshCw size={16} />,
              label: "Refresh Stale Intel",
              desc: "Re-run on accounts >7 days old",
              color: "#06b6d4",
              action: () => {
                const enabledAgents = agents
                  .filter((a) => a.enabled)
                  .map((a) => a.id);
                if (enabledAgents.length === 0) return;
                // Find accounts with stale intel (lastSwarmRun > 7 days)
                const sevenDaysAgo = new Date(
                  Date.now() - 7 * 24 * 60 * 60 * 1000,
                ).toISOString();
                const staleAccounts = availableAccounts
                  .map((a) => a.companyName)
                  .slice(0, 50); // Will run on all — backend filters
                setSwarmStatus("running");
                setSwarmMessage("Re-running agents on all accounts...");
                fetch(`${API_URL}/api/swarm/run-all`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    agents: enabledAgents,
                    account_names: staleAccounts,
                  }),
                })
                  .then((r) => r.json())
                  .then((d) => {
                    setSwarmStatus("done");
                    setSwarmMessage(d.message || "Refresh started.");
                  })
                  .catch(() => {
                    setSwarmStatus("idle");
                    setSwarmMessage("Failed to refresh intel.");
                  });
              },
            },
            {
              icon: <AlertTriangle size={16} />,
              label: "Risk Assessment",
              desc: "Flag risks & detractors everywhere",
              color: "#ef4444",
              action: () => {
                setSwarmStatus("running");
                setSwarmMessage("Running RiskFlagger across all accounts...");
                fetch(`${API_URL}/api/swarm/run-all`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    agents: ["risk-flagger-agent"],
                    template: "reduce-risk",
                  }),
                })
                  .then((r) => r.json())
                  .then((d) => {
                    setSwarmStatus("done");
                    setSwarmMessage(d.message || "Risk assessment started.");
                  })
                  .catch(() => {
                    setSwarmStatus("idle");
                    setSwarmMessage("Failed to start risk assessment.");
                  });
              },
            },
          ].map((shortcut, i) => (
            <motion.div
              key={shortcut.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
              onClick={shortcut.action}
              style={{
                ...glassCard,
                padding: "0.75rem 0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "all 0.15s",
              }}
              whileHover={{
                scale: 1.02,
                borderColor: `${shortcut.color}40`,
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: `${shortcut.color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: shortcut.color,
                  flexShrink: 0,
                }}
              >
                {shortcut.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-label)",
                    color: dark.text,
                    lineHeight: 1.2,
                  }}
                >
                  {shortcut.label}
                </div>
                <div
                  style={{
                    fontSize: "0.6rem",
                    color: dark.textMuted,
                    lineHeight: 1.3,
                    marginTop: 1,
                  }}
                >
                  {shortcut.desc}
                </div>
              </div>
              <ArrowRight
                size={12}
                color={dark.textDim}
                style={{ flexShrink: 0 }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* CENTER: Swarm Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            ...glassCard,
            aspectRatio: "1",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background image from Figma */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url(/swarm-bg.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.3,
              pointerEvents: "none",
            }}
          />
          {/* Dark overlay for readability */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(10,14,26,0.5) 0%, rgba(10,14,26,0.7) 50%, rgba(10,14,26,0.85) 100%)",
              pointerEvents: "none",
            }}
          />

          {/* Central Hub — gradient ring */}
          <div
            style={{
              position: "relative",
              width: 200,
              height: 200,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgba(135,32,222,0.25), rgba(20,184,166,0.25))",
              border: "2px solid rgba(20,184,166,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              zIndex: 1,
              boxShadow:
                "0 0 40px rgba(135,32,222,0.15), 0 0 80px rgba(20,184,166,0.08)",
            }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, rgba(135,32,222,0.3), rgba(20,184,166,0.2))",
                border: "1px solid rgba(20,184,166,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-headline)",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  color: dark.text,
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                AGENT
                <br />
                SWARM
              </div>
            </div>
          </div>

          {/* Agent Nodes around the hub */}
          {agents.map((agent, i) => {
            const angle = (i * 360) / agents.length - 90;
            const radius = 180;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: agent.enabled ? 1 : 0.3, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                style={{
                  position: "absolute",
                  top: `calc(50% + ${y}px - 22px)`,
                  left: `calc(50% + ${x}px - 22px)`,
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: agent.enabled
                    ? dark.gradient
                    : "rgba(255,255,255,0.05)",
                  border: agent.enabled
                    ? "2px solid rgba(20,184,166,0.4)"
                    : `1px solid ${dark.cardBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: agent.enabled ? "#fff" : dark.textDim,
                  cursor: "pointer",
                  zIndex: 2,
                  boxShadow: agent.enabled
                    ? `0 2px 16px ${dark.purpleGlow}`
                    : "none",
                }}
                title={agent.name}
                onClick={() => toggleAgent(agent.id)}
              >
                {agent.icon}
              </motion.div>
            );
          })}

          {/* Connection lines (SVG) */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            {agents.map((agent, i) => {
              if (!agent.enabled) return null;
              const angle = (i * 360) / agents.length - 90;
              const radius = 180;
              const x =
                50 + (Math.cos((angle * Math.PI) / 180) * radius * 100) / 600;
              const y =
                50 + (Math.sin((angle * Math.PI) / 180) * radius * 100) / 500;
              return (
                <line
                  key={agent.id}
                  x1="50%"
                  y1="50%"
                  x2={`${x}%`}
                  y2={`${y}%`}
                  stroke="rgba(20,184,166,0.2)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              );
            })}
          </svg>

          {/* Status bar */}
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              right: 16,
              display: "flex",
              justifyContent: "center",
              gap: 24,
              fontSize: "0.72rem",
              color: dark.textDim,
              fontFamily: "var(--font-label)",
              fontWeight: 600,
            }}
          >
            <span>
              <span style={{ color: dark.accentLight, fontWeight: 700 }}>
                {activeCount}
              </span>{" "}
              Agents Active
            </span>
            <span>
              <span style={{ color: "#22c55e", fontWeight: 700 }}>3</span>{" "}
              Signals Configured
            </span>
            <span>
              <span style={{ color: dark.accentLight, fontWeight: 700 }}>
                Live
              </span>{" "}
              Status
            </span>
          </div>
        </motion.div>

        {/* RIGHT: Cockpit */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{
            ...glassCard,
            aspectRatio: "1",
            padding: 0,
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Cockpit background image */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url(/cockpit-bg.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.35,
              pointerEvents: "none",
            }}
          />
          {/* Dark overlay for readability */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(10,14,26,0.7) 0%, rgba(10,14,26,0.85) 60%, rgba(10,14,26,0.95) 100%)",
              pointerEvents: "none",
            }}
          />

          {/* Content */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              flex: 1,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: dark.gradient,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 2px 16px ${dark.purpleGlow}`,
                  }}
                >
                  <Settings size={18} color="#fff" />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-headline)",
                      fontWeight: 700,
                      fontSize: "1.05rem",
                      color: dark.text,
                    }}
                  >
                    Cockpit
                  </div>
                  <div
                    style={{
                      fontSize: "0.62rem",
                      color: dark.textDim,
                      fontFamily: "var(--font-label)",
                    }}
                  >
                    AI Platform Control Center
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-label)",
                  padding: "0.15rem 0.6rem",
                  borderRadius: 9999,
                  background: "rgba(34,197,94,0.15)",
                  color: "#4ade80",
                }}
              >
                Systems Online
              </span>
            </div>

            {/* Cockpit Modules */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                {
                  icon: <Brain size={14} />,
                  label: "AI Personality Engine",
                  desc: "Tone, empathy level & communication style",
                  color: dark.purple,
                  status: "Active",
                },
                {
                  icon: <MessageSquare size={14} />,
                  label: "Messaging Framework",
                  desc: "Templates, value props & objection handling",
                  color: dark.accent,
                  status: "12 templates",
                },
                {
                  icon: <Palette size={14} />,
                  label: "Personalization Rules",
                  desc: "Industry, persona & buying stage adaptation",
                  color: "#f59e0b",
                  status: "8 rules",
                },
                {
                  icon: <Volume2 size={14} />,
                  label: "Voice & Tone Profiles",
                  desc: "Executive, technical & champion variants",
                  color: "#22c55e",
                  status: "3 profiles",
                },
                {
                  icon: <Shield size={14} />,
                  label: "Compliance & Guardrails",
                  desc: "Brand safety, legal review & approval flows",
                  color: "#ef4444",
                  status: "Enforced",
                },
              ].map((module) => (
                <div
                  key={module.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "0.55rem 0.65rem",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${dark.cardBorder}`,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: `${module.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: module.color,
                      flexShrink: 0,
                    }}
                  >
                    {module.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        fontFamily: "var(--font-label)",
                        color: dark.text,
                      }}
                    >
                      {module.label}
                    </div>
                    <div
                      style={{
                        fontSize: "0.62rem",
                        color: dark.textMuted,
                        lineHeight: 1.3,
                      }}
                    >
                      {module.desc}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.58rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-label)",
                      color: module.color,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {module.status}
                  </span>
                  <ChevronRight size={13} color={dark.textDim} />
                </div>
              ))}
            </div>

            {/* Channel Configuration */}
            <div
              style={{
                borderTop: `1px solid ${dark.cardBorder}`,
                paddingTop: 12,
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                  color: dark.textDim,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 8,
                }}
              >
                Active Channels
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { icon: <Mail size={14} />, label: "Email", active: true },
                  { icon: <Phone size={14} />, label: "Phone", active: true },
                  { icon: <Globe size={14} />, label: "Web", active: true },
                  {
                    icon: <MessageSquare size={14} />,
                    label: "Chat",
                    active: false,
                  },
                ].map((ch) => (
                  <div
                    key={ch.label}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      padding: "0.5rem 0.3rem",
                      borderRadius: 8,
                      background: ch.active
                        ? "rgba(20,184,166,0.06)"
                        : "rgba(255,255,255,0.02)",
                      border: ch.active
                        ? "1px solid rgba(20,184,166,0.2)"
                        : `1px solid ${dark.cardBorder}`,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        color: ch.active ? dark.accentLight : dark.textDim,
                      }}
                    >
                      {ch.icon}
                    </div>
                    <span
                      style={{
                        fontSize: "0.58rem",
                        fontWeight: 600,
                        fontFamily: "var(--font-label)",
                        color: ch.active ? dark.text : dark.textDim,
                      }}
                    >
                      {ch.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: "auto",
              }}
            >
              {[
                { label: "Response Rate", value: "94%", color: "#22c55e" },
                { label: "Personalization", value: "87%", color: dark.accent },
                { label: "Compliance", value: "100%", color: dark.purple },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.03)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      fontFamily: "var(--font-headline)",
                      color: stat.color,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: "0.55rem",
                      color: dark.textDim,
                      fontFamily: "var(--font-label)",
                      fontWeight: 600,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Customization Workflow */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.18 }}
        style={{ ...glassCard, marginTop: 24 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "1.05rem",
                color: dark.text,
              }}
            >
              Mission Control
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: dark.textMuted,
                marginTop: 2,
              }}
            >
              Configure your swarm from account selection through deployment
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {swarmStatus === "done" && (
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-label)",
                  padding: "0.15rem 0.6rem",
                  borderRadius: 9999,
                  background: "rgba(34,197,94,0.15)",
                  color: "#4ade80",
                }}
              >
                Swarm Deployed
              </span>
            )}
          </div>
        </div>

        {/* Step indicators */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 20,
            gap: 0,
          }}
        >
          {[
            { num: 1, label: "Select Account" },
            { num: 2, label: "Custom Instructions" },
            { num: 3, label: "Intel & Signals" },
            { num: 4, label: "Deploy Swarm" },
          ].map((step, i) => (
            <div
              key={step.num}
              style={{
                display: "flex",
                alignItems: "center",
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background:
                      i === 0 ? dark.gradient : `rgba(255,255,255,0.06)`,
                    border: i === 0 ? "none" : `1px solid ${dark.cardBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-label)",
                    color: i === 0 ? "#fff" : dark.textDim,
                    flexShrink: 0,
                  }}
                >
                  {step.num}
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: i === 0 ? 700 : 500,
                    fontFamily: "var(--font-label)",
                    color: i === 0 ? dark.text : dark.textDim,
                    whiteSpace: "nowrap",
                  }}
                >
                  {step.label}
                </span>
              </div>
              {i < 3 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: dark.cardBorder,
                    margin: "0 12px",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Workflow content — 4-column grid */}
        <div
          className="agentswarm-grid-4"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 16,
          }}
        >
          {/* Step 1: Account Selection */}
          <div
            style={{
              padding: "1rem",
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${dark.cardBorder}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Search size={14} color={dark.accent} />
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-label)",
                  color: dark.text,
                }}
              >
                Target Accounts
              </span>
            </div>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: 8,
                  top: 9,
                  color: dark.textDim,
                }}
              />
              <input
                type="text"
                placeholder="Search or type account..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.5rem 0.5rem 1.8rem",
                  borderRadius: 8,
                  border: `1px solid ${dark.inputBorder}`,
                  fontSize: "0.78rem",
                  background: dark.inputBg,
                  color: dark.text,
                  fontFamily: "var(--font-body)",
                }}
              />
            </div>

            {/* Multi-select account list */}
            {availableAccounts.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div
                  onClick={toggleAllAccounts}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0.3rem 0.4rem",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-label)",
                    color:
                      selectedAccounts.length === availableAccounts.length
                        ? dark.accentLight
                        : dark.textDim,
                    marginBottom: 4,
                  }}
                >
                  {selectedAccounts.length === availableAccounts.length ? (
                    <CheckSquare size={12} />
                  ) : (
                    <Square size={12} />
                  )}
                  Select All ({availableAccounts.length})
                </div>
                <div
                  style={{
                    maxHeight: 120,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {availableAccounts
                    .filter(
                      (a) =>
                        !searchQuery.trim() ||
                        a.companyName
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                    )
                    .map((acc) => {
                      const isSelected = selectedAccounts.includes(
                        acc.companyName,
                      );
                      return (
                        <div
                          key={acc._id}
                          onClick={() => toggleAccount(acc.companyName)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "0.3rem 0.4rem",
                            borderRadius: 6,
                            cursor: "pointer",
                            background: isSelected
                              ? "rgba(20,184,166,0.08)"
                              : "transparent",
                            transition: "background 0.15s",
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare size={12} color={dark.accentLight} />
                          ) : (
                            <Square size={12} color={dark.textDim} />
                          )}
                          <span
                            style={{
                              fontSize: "0.72rem",
                              color: isSelected ? dark.text : dark.textMuted,
                              fontWeight: isSelected ? 600 : 400,
                              fontFamily: "var(--font-label)",
                            }}
                          >
                            {acc.companyName}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            <div
              style={{
                fontSize: "0.65rem",
                fontFamily: "var(--font-label)",
                fontWeight: 600,
                color: dark.textDim,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 6,
              }}
            >
              ICP & Persona Filters
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {["Nordic Enterprise", "Ecommerce", "Head of Digital"].map(
                (tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      fontFamily: "var(--font-label)",
                      padding: "0.15rem 0.5rem",
                      borderRadius: 9999,
                      background: dark.accentGlow,
                      color: dark.accentLight,
                    }}
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Step 2: Custom Instructions */}
          <div
            style={{
              padding: "1rem",
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${dark.cardBorder}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <MessageSquare size={14} color={dark.purple} />
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-label)",
                  color: dark.text,
                }}
              >
                Agent Instructions
              </span>
            </div>
            <textarea
              placeholder="Instruct your agents with custom prompts, context, priorities, and strategic direction..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              style={{
                width: "100%",
                minHeight: 90,
                padding: "0.5rem",
                borderRadius: 8,
                border: `1px solid ${dark.inputBorder}`,
                background: dark.inputBg,
                color: dark.text,
                fontSize: "0.75rem",
                fontFamily: "var(--font-body)",
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Step 3: Intel & Signals */}
          <div
            style={{
              padding: "1rem",
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${dark.cardBorder}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Sparkles size={14} color="#f59e0b" />
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-label)",
                  color: dark.text,
                }}
              >
                Competitive Intel & Signals
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                "Revenue Decline > 10%",
                "Leadership Change",
                "New Funding Round",
                "Platform Migration",
              ].map((signal) => (
                <div
                  key={signal}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0.35rem 0.5rem",
                    borderRadius: 7,
                    background: "rgba(255,255,255,0.03)",
                    fontSize: "0.72rem",
                    color: dark.text,
                  }}
                >
                  <Sparkles size={10} color={dark.accent} />
                  {signal}
                </div>
              ))}
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "none",
                  border: `1px dashed ${dark.cardBorder}`,
                  borderRadius: 7,
                  padding: "0.35rem 0.5rem",
                  fontSize: "0.72rem",
                  color: dark.textDim,
                  cursor: "pointer",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                }}
              >
                <Plus size={10} /> Add Signal
              </button>
            </div>
          </div>

          {/* Step 4: Deploy */}
          <div
            style={{
              padding: "1rem",
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${dark.cardBorder}`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Zap size={14} color="#22c55e" />
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-label)",
                  color: dark.text,
                }}
              >
                Deploy & Run
              </span>
            </div>

            <div
              style={{
                fontSize: "0.72rem",
                color: dark.textMuted,
                lineHeight: 1.5,
                marginBottom: 12,
              }}
            >
              <span style={{ color: dark.accentLight, fontWeight: 700 }}>
                {activeCount}
              </span>{" "}
              agents selected across{" "}
              <span style={{ color: dark.accentLight, fontWeight: 700 }}>
                {activeTemplates.length > 0
                  ? activeTemplates
                      .map(
                        (tId) =>
                          valueDriverTemplates.find((t) => t.id === tId)?.name,
                      )
                      .join(" + ")
                  : "custom"}
              </span>{" "}
              template{activeTemplates.length > 1 ? "s" : ""}
              {selectedAccounts.length > 0 && (
                <>
                  <br />
                  <span style={{ color: "#22c55e", fontWeight: 700 }}>
                    {selectedAccounts.length}
                  </span>{" "}
                  account{selectedAccounts.length !== 1 ? "s" : ""} selected
                </>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.4rem 0",
                marginBottom: 10,
                borderTop: `1px solid ${dark.cardBorder}`,
                borderBottom: `1px solid ${dark.cardBorder}`,
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  color: dark.text,
                  fontWeight: 600,
                }}
              >
                Auto-deploy on new accounts
              </span>
              <ToggleSwitch enabled={true} onToggle={() => {}} />
            </div>

            <button
              onClick={runSwarm}
              disabled={swarmStatus === "running"}
              style={{
                width: "100%",
                marginTop: "auto",
                padding: "0.65rem",
                borderRadius: 10,
                border: "none",
                background:
                  swarmStatus === "running"
                    ? "rgba(255,255,255,0.08)"
                    : dark.gradient,
                color: "#fff",
                fontFamily: "var(--font-label)",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: swarmStatus === "running" ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow:
                  swarmStatus === "running"
                    ? "none"
                    : `0 2px 16px ${dark.purpleGlow}`,
                opacity: swarmStatus === "running" ? 0.7 : 1,
              }}
            >
              {swarmStatus === "running" ? (
                <>
                  <Loader2 size={16} className="spin" /> Running...
                </>
              ) : swarmStatus === "done" ? (
                <>
                  <Check size={16} /> Deployed
                </>
              ) : (
                <>
                  <Play size={16} /> Run Swarm
                </>
              )}
            </button>

            <AnimatePresence>
              {swarmMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    marginTop: 8,
                    fontSize: "0.68rem",
                    color:
                      swarmStatus === "done"
                        ? dark.accentLight
                        : swarmStatus === "idle"
                          ? "#f87171"
                          : dark.textMuted,
                    fontFamily: "var(--font-label)",
                    fontWeight: 600,
                    lineHeight: 1.4,
                  }}
                >
                  {swarmMessage}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Value Driver Templates & Agent Selection — full-width below main grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        style={{ ...glassCard, marginTop: 24 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-headline)",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: dark.text,
            }}
          >
            Select Agents by Value Driver
          </div>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              fontFamily: "var(--font-label)",
              padding: "0.15rem 0.6rem",
              borderRadius: 9999,
              background: dark.accentGlow,
              color: dark.accentLight,
            }}
          >
            {activeCount} Active
          </span>
        </div>

        {/* Template Cards */}
        <div
          className="agentswarm-grid-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {valueDriverTemplates.map((template) => {
            const isActive = activeTemplates.includes(template.id);
            return (
              <motion.button
                key={template.id}
                onClick={() => applyTemplate(template.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: isActive
                    ? `${template.color}18`
                    : "rgba(255,255,255,0.02)",
                  border: isActive
                    ? `2px solid ${template.color}60`
                    : `1px solid ${dark.cardBorder}`,
                  borderRadius: 12,
                  padding: "0.85rem 0.75rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: template.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={11} color="#fff" />
                  </div>
                )}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${template.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: template.color,
                    marginBottom: 8,
                  }}
                >
                  {template.icon}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-label)",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    color: dark.text,
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {template.name}
                </div>
                <div
                  style={{
                    fontSize: "0.62rem",
                    color: dark.textMuted,
                    lineHeight: 1.35,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                  }}
                >
                  {template.description}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: "0.58rem",
                    fontFamily: "var(--font-label)",
                    fontWeight: 600,
                    color: isActive ? template.color : dark.textDim,
                  }}
                >
                  {template.agentIds.length} agents
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* All Agents Grid — grouped by active template highlight */}
        <div
          style={{
            fontSize: "0.7rem",
            fontFamily: "var(--font-label)",
            fontWeight: 600,
            color: dark.textDim,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: 8,
          }}
        >
          All Agents
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 10,
          }}
        >
          {agents.map((agent) => (
            <div
              key={agent.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0.6rem 0.65rem",
                borderRadius: 10,
                background: agent.enabled
                  ? "rgba(20,184,166,0.06)"
                  : "rgba(255,255,255,0.02)",
                border: agent.enabled
                  ? "1px solid rgba(20,184,166,0.2)"
                  : `1px solid ${dark.cardBorder}`,
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: agent.enabled
                    ? dark.gradient
                    : "rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: agent.enabled ? "#fff" : dark.textDim,
                  flexShrink: 0,
                }}
                title={agent.description}
              >
                {agent.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-label)",
                    color: dark.text,
                  }}
                >
                  {agent.name}
                </div>
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: dark.textMuted,
                    lineHeight: 1.3,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                  }}
                >
                  {agent.description}
                </div>
              </div>
              <ToggleSwitch
                enabled={agent.enabled}
                onToggle={() => toggleAgent(agent.id)}
              />
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: dark.textDim,
                  padding: 2,
                  display: "flex",
                }}
                title={agent.description}
              >
                <Info size={14} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function ToggleSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        border: "none",
        background: enabled
          ? "linear-gradient(135deg, #8720de, #14b8a6)"
          : "rgba(255,255,255,0.1)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 3,
          left: enabled ? 19 : 3,
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      />
    </button>
  );
}

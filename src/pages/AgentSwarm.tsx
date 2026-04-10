import { useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Cpu,
  Shield,
  TrendingUp,
  BarChart3,
  Eye,
  Info,
  Play,
  Plus,
  Sparkles,
  Globe,
  FileText,
  Settings,
  ChevronRight,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface IntelCard {
  id: string;
  title: string;
  summary: string;
  source: string;
  type: "alert" | "insight" | "trend";
}

const defaultAgents: Agent[] = [
  {
    id: "tech-scout",
    name: "Tech Scout",
    description: "Monitors technology stack changes, new tool adoption, and digital transformation signals",
    icon: <Cpu size={18} />,
    enabled: true,
  },
  {
    id: "regulatory-monitor",
    name: "Regulatory Monitor",
    description: "Tracks regulatory changes, compliance requirements, and policy shifts in target markets",
    icon: <Shield size={18} />,
    enabled: true,
  },
  {
    id: "industry-monitor",
    name: "Trend & Industry Monitor",
    description: "Identifies emerging industry trends, market shifts, and competitive landscape changes",
    icon: <TrendingUp size={18} />,
    enabled: false,
  },
  {
    id: "trend-forecaster",
    name: "Trend Forecaster",
    description: "Predicts market movements and buying intent signals using AI-powered forecasting",
    icon: <BarChart3 size={18} />,
    enabled: false,
  },
  {
    id: "social-listener",
    name: "Social Listener",
    description: "Monitors social media, forums, and communities for brand mentions and sentiment shifts",
    icon: <Eye size={18} />,
    enabled: false,
  },
];

const competitiveIntel: IntelCard[] = [
  {
    id: "1",
    title: "ESG Monitoring Inc. Launches New AI-Powered Compliance Tool",
    summary: "Direct competitor released new product targeting Nordic enterprise segment.",
    source: "TechCrunch",
    type: "alert",
  },
  {
    id: "2",
    title: "Global Ecommerce SaaS Market Expected to Reach $45B by 2028",
    summary: "Market growth accelerating in Nordic and DACH regions with 23% YoY increase.",
    source: "Gartner",
    type: "insight",
  },
  {
    id: "3",
    title: "AI & Analytics Sector Seeing Record PE Investment",
    summary: "Private equity firms invested $12.4B in AI analytics companies in Q1 2026.",
    source: "PitchBook",
    type: "insight",
  },
  {
    id: "4",
    title: "Market Consolidation Expected to Result in Product Line Changes",
    summary: "Three major competitors exploring M&A activity in the Nordics.",
    source: "Bloomberg",
    type: "alert",
  },
];

const marketShareData = [
  { month: "Oct", value: 14 },
  { month: "Nov", value: 16 },
  { month: "Dec", value: 15 },
  { month: "Jan", value: 18 },
  { month: "Feb", value: 21 },
  { month: "Mar", value: 24 },
];

export function AgentSwarm() {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [searchQuery, setSearchQuery] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [activeTab, setActiveTab] = useState<"instructions" | "dependencies" | "signals">("instructions");

  const toggleAgent = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    );
  };

  const activeCount = agents.filter((a) => a.enabled).length;

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
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            fontFamily: "var(--font-headline)",
            fontWeight: 800,
            fontSize: "2rem",
            color: "var(--on-background)",
          }}
        >
          Agent Swarm
        </div>
        <div
          style={{
            fontSize: "0.95rem",
            color: "var(--on-surface-variant)",
            marginBottom: 24,
          }}
        >
          Deploy and customize your Agent Swarm with custom signals, ICP
          definitions, market research and competitive intelligence data
        </div>
      </div>

      {/* 3 Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "340px 1fr 380px",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* LEFT: Deploy & Orchestrate */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Deploy & Orchestrate Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="luminous-shadow"
            style={{
              borderRadius: "1rem",
              padding: "1.25rem",
              backgroundColor: "var(--surface-container-lowest)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "1.05rem",
                color: "var(--on-background)",
                marginBottom: 14,
              }}
            >
              Deploy & Orchestrate
            </div>

            {/* Search / Account Input */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: 10,
                  top: 10,
                  color: "var(--on-surface-variant)",
                }}
              />
              <input
                type="text"
                placeholder="Search accounts or signals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.6rem 0.55rem 2rem",
                  borderRadius: 8,
                  border: "1px solid rgba(167,176,222,0.2)",
                  fontSize: "0.85rem",
                  background: "var(--surface-container-low)",
                  color: "var(--on-surface)",
                  fontFamily: "var(--font-body)",
                }}
              />
            </div>

            {/* ICP & Persona Tags */}
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--on-surface-variant)",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Active ICP & Persona Filters
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["Nordic Enterprise", "Ecommerce", "Head of Digital"].map(
                  (tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        fontFamily: "var(--font-label)",
                        padding: "0.2rem 0.6rem",
                        borderRadius: 9999,
                        background: "rgba(18,74,241,0.1)",
                        color: "var(--primary)",
                      }}
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>
            </div>

            {/* Auto-deploy Toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.5rem 0",
                borderTop: "1px solid rgba(167,176,222,0.08)",
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--on-surface)",
                  fontWeight: 600,
                }}
              >
                Auto-deploy on new accounts
              </span>
              <ToggleSwitch enabled={true} onToggle={() => {}} />
            </div>
          </motion.div>

          {/* Select Agents Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.07 }}
            className="luminous-shadow"
            style={{
              borderRadius: "1rem",
              padding: "1.25rem",
              backgroundColor: "var(--surface-container-lowest)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-headline)",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  color: "var(--on-background)",
                }}
              >
                Select Agents
              </div>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-label)",
                  padding: "0.15rem 0.6rem",
                  borderRadius: 9999,
                  background: "rgba(18,74,241,0.1)",
                  color: "var(--primary)",
                }}
              >
                {activeCount} Active
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                      ? "rgba(18,74,241,0.06)"
                      : "var(--surface-container-low)",
                    border: agent.enabled
                      ? "1px solid rgba(18,74,241,0.15)"
                      : "1px solid rgba(167,176,222,0.08)",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: agent.enabled
                        ? "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))"
                        : "rgba(167,176,222,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: agent.enabled ? "#fff" : "var(--on-surface-variant)",
                      flexShrink: 0,
                    }}
                  >
                    {agent.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        fontFamily: "var(--font-label)",
                        color: "var(--on-background)",
                      }}
                    >
                      {agent.name}
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
                      color: "var(--on-surface-variant)",
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

          {/* Instructions / Signals Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.14 }}
            className="luminous-shadow"
            style={{
              borderRadius: "1rem",
              padding: "1.25rem",
              backgroundColor: "var(--surface-container-lowest)",
            }}
          >
            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: 0,
                marginBottom: 12,
                borderBottom: "1px solid rgba(167,176,222,0.1)",
              }}
            >
              {(
                [
                  { key: "instructions", label: "Custom Instructions" },
                  { key: "dependencies", label: "Dependencies" },
                  { key: "signals", label: "Signals" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "0.5rem 0.8rem",
                    fontSize: "0.72rem",
                    fontWeight: activeTab === tab.key ? 700 : 500,
                    fontFamily: "var(--font-label)",
                    color:
                      activeTab === tab.key
                        ? "var(--primary)"
                        : "var(--on-surface-variant)",
                    borderBottom:
                      activeTab === tab.key
                        ? "2px solid var(--primary)"
                        : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "instructions" && (
              <textarea
                placeholder="Add custom instructions, notes, or context for this swarm run..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 80,
                  padding: "0.6rem",
                  borderRadius: 8,
                  border: "1px solid rgba(167,176,222,0.15)",
                  background: "var(--surface-container-low)",
                  color: "var(--on-surface)",
                  fontSize: "0.82rem",
                  fontFamily: "var(--font-body)",
                  resize: "vertical",
                }}
              />
            )}

            {activeTab === "dependencies" && (
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "var(--on-surface-variant)",
                  padding: "0.5rem 0",
                }}
              >
                No dependencies configured. Agents run independently by default.
              </div>
            )}

            {activeTab === "signals" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["Revenue Decline > 10%", "Leadership Change", "New Funding Round"].map(
                  (signal) => (
                    <div
                      key={signal}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "0.4rem 0.6rem",
                        borderRadius: 8,
                        background: "var(--surface-container-low)",
                        fontSize: "0.78rem",
                        color: "var(--on-surface)",
                      }}
                    >
                      <Sparkles size={12} color="var(--tertiary)" />
                      {signal}
                    </div>
                  ),
                )}
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "none",
                    border: "1px dashed rgba(167,176,222,0.2)",
                    borderRadius: 8,
                    padding: "0.4rem 0.6rem",
                    fontSize: "0.78rem",
                    color: "var(--on-surface-variant)",
                    cursor: "pointer",
                    fontFamily: "var(--font-label)",
                    fontWeight: 600,
                  }}
                >
                  <Plus size={12} /> Add Signal
                </button>
              </div>
            )}

            {/* Run Swarm Button */}
            <button
              style={{
                width: "100%",
                marginTop: 14,
                padding: "0.7rem",
                borderRadius: 10,
                border: "none",
                background:
                  "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                color: "#fff",
                fontFamily: "var(--font-label)",
                fontWeight: 700,
                fontSize: "0.92rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 2px 12px rgba(135,32,222,0.15)",
              }}
            >
              <Play size={16} /> Run Swarm
            </button>
          </motion.div>
        </div>

        {/* CENTER: Swarm Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="luminous-shadow"
          style={{
            borderRadius: "1rem",
            padding: "1.25rem",
            backgroundColor: "var(--surface-container-lowest)",
            minHeight: 500,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background grid effect */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 50% 50%, rgba(135,32,222,0.04) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Central Hub */}
          <div
            style={{
              position: "relative",
              width: 200,
              height: 200,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgba(135,32,222,0.15), rgba(78,69,228,0.15))",
              border: "2px solid rgba(135,32,222,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, rgba(135,32,222,0.2), rgba(78,69,228,0.25))",
                border: "1px solid rgba(135,32,222,0.3)",
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
                  color: "var(--on-background)",
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
                    ? "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))"
                    : "rgba(167,176,222,0.1)",
                  border: agent.enabled
                    ? "2px solid rgba(135,32,222,0.4)"
                    : "1px solid rgba(167,176,222,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: agent.enabled ? "#fff" : "var(--on-surface-variant)",
                  cursor: "pointer",
                  zIndex: 2,
                  boxShadow: agent.enabled
                    ? "0 2px 12px rgba(135,32,222,0.2)"
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
              const x = 50 + (Math.cos((angle * Math.PI) / 180) * radius * 100) / 600;
              const y = 50 + (Math.sin((angle * Math.PI) / 180) * radius * 100) / 500;
              return (
                <line
                  key={agent.id}
                  x1="50%"
                  y1="50%"
                  x2={`${x}%`}
                  y2={`${y}%`}
                  stroke="rgba(135,32,222,0.2)"
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
              color: "var(--on-surface-variant)",
              fontFamily: "var(--font-label)",
              fontWeight: 600,
            }}
          >
            <span>
              <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                {activeCount}
              </span>{" "}
              Agents Active
            </span>
            <span>
              <span style={{ color: "#22c55e", fontWeight: 700 }}>3</span>{" "}
              Signals Configured
            </span>
            <span>
              <span style={{ color: "var(--tertiary)", fontWeight: 700 }}>
                Live
              </span>{" "}
              Status
            </span>
          </div>
        </motion.div>

        {/* RIGHT: Competitive Comps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="luminous-shadow"
            style={{
              borderRadius: "1rem",
              padding: "1.25rem",
              backgroundColor: "var(--surface-container-lowest)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-headline)",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  color: "var(--on-background)",
                }}
              >
                Competitive Comps
              </div>
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-label)",
                  padding: "0.15rem 0.6rem",
                  borderRadius: 9999,
                  background: "rgba(239,68,68,0.1)",
                  color: "var(--error)",
                }}
              >
                Latest Intelligence
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {competitiveIntel.map((intel) => (
                <div
                  key={intel.id}
                  style={{
                    padding: "0.65rem 0.75rem",
                    borderRadius: 10,
                    background: "var(--surface-container-low)",
                    borderLeft:
                      intel.type === "alert"
                        ? "3px solid var(--error)"
                        : intel.type === "trend"
                          ? "3px solid var(--tertiary)"
                          : "3px solid var(--primary)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-label)",
                      color: "var(--on-background)",
                      marginBottom: 4,
                      lineHeight: 1.35,
                    }}
                  >
                    {intel.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--on-surface-variant)",
                      lineHeight: 1.4,
                      marginBottom: 4,
                    }}
                  >
                    {intel.summary}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: "0.62rem",
                      color: "var(--on-surface-variant)",
                      fontFamily: "var(--font-label)",
                      fontWeight: 600,
                    }}
                  >
                    <Globe size={10} /> {intel.source}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Market Share Trends */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.22 }}
            className="luminous-shadow"
            style={{
              borderRadius: "1rem",
              padding: "1.25rem",
              backgroundColor: "var(--surface-container-lowest)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "1.05rem",
                color: "var(--on-background)",
                marginBottom: 14,
              }}
            >
              Market Share Trends
            </div>

            {/* Simple sparkline chart */}
            <svg
              viewBox="0 0 300 100"
              style={{ width: "100%", height: 100 }}
            >
              <defs>
                <linearGradient
                  id="chartGrad"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--primary)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <path
                d={`M0,${100 - marketShareData[0].value * 3.5} ${marketShareData
                  .map(
                    (d, i) =>
                      `L${(i * 300) / (marketShareData.length - 1)},${100 - d.value * 3.5}`,
                  )
                  .join(" ")} L300,100 L0,100 Z`}
                fill="url(#chartGrad)"
              />
              {/* Line */}
              <polyline
                points={marketShareData
                  .map(
                    (d, i) =>
                      `${(i * 300) / (marketShareData.length - 1)},${100 - d.value * 3.5}`,
                  )
                  .join(" ")}
                fill="none"
                stroke="var(--primary)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data points */}
              {marketShareData.map((d, i) => (
                <circle
                  key={i}
                  cx={(i * 300) / (marketShareData.length - 1)}
                  cy={100 - d.value * 3.5}
                  r={3}
                  fill="var(--primary)"
                />
              ))}
            </svg>

            {/* X axis labels */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 4,
                fontSize: "0.62rem",
                color: "var(--on-surface-variant)",
                fontFamily: "var(--font-label)",
                fontWeight: 600,
              }}
            >
              {marketShareData.map((d) => (
                <span key={d.month}>{d.month}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
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
          ? "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))"
          : "rgba(167,176,222,0.2)",
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

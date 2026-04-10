import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Target,
  Building2,
  Crown,
  UserCheck,
  Users,
  Sparkles,
  Send,
  AlertTriangle,
  MessageSquare,
  Layers,
  GitBranch,
  Brain,
  FileText,
  TrendingUp,
  Briefcase,
  UsersRound,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Account {
  _id: string;
  companyName: string;
  website: string;
  buyingSignalScore: number;
  priority: string;
  rationale: string;
  insights: {
    strategicContext: { title: string; description: string }[];
    ecommercePriorities: { title: string; description: string }[];
    activeInitiatives: { title: string; description: string }[];
    keyChallenges: { title: string; description: string }[];
    opportunityFrame: { title: string; description: string }[];
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

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Value Pyramid Data (Figma design) ────────────────────────────────────────
interface PyramidCard {
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
}

interface PyramidRow {
  label: string;
  color: string;
  gradient?: string;
  cards: PyramidCard[];
}

const defaultPyramidRows: PyramidRow[] = [
  {
    label: "Strategic Context",
    color: "#124af1",
    cards: [
      {
        title: "Market Positioning",
        description:
          "Pivot from Infrastructure to AI-First Platform leadership by FY26.",
      },
      {
        title: "Competitive Landscape",
        description:
          "Facing aggressive pricing from challenger start-ups in EU market.",
      },
      {
        title: "Global Expansion",
        description:
          "Expanding APAC operations with 3 new data centers in Singapore.",
      },
    ],
  },
  {
    label: "Ecommerce & Business Priorities",
    color: "#4e45e4",
    cards: [
      {
        title: "OpEx Reduction",
        description:
          "Mandate to cut cloud costs by 15% across all business units.",
      },
      {
        title: "Vendor Consolidation",
        description:
          "Reducing SaaS vendors from 450 to under 200 primary partners.",
      },
      {
        title: "Sustainability Goals",
        description:
          "Net-zero data processing goal by 2030 (Tier 1 requirement).",
      },
    ],
  },
  {
    label: "Active Initiatives",
    color: "#22c55e",
    cards: [
      {
        title: "Project Sentinel",
        description:
          "Next-gen security layer integration across legacy infrastructure.",
      },
      {
        title: "Hybrid Work ROI",
        description:
          "Implementing collaboration tools to measure employee productivity.",
      },
      {
        title: "Data Democracy",
        description:
          "Internal initiative to enable self-serve analytics for non-tech teams.",
      },
    ],
  },
  {
    label: "Challenges & Friction",
    color: "#ef4444",
    cards: [
      {
        title: "Legacy Debt",
        description:
          "15-year old core database systems causing latency issues.",
      },
      {
        title: "Talent Retention",
        description:
          "Losing top cloud architects to competitors (22% churn rate).",
      },
      {
        title: "Compliance Bottleneck",
        description:
          "Legal review cycles adding 4 months to any new tech onboarding.",
      },
    ],
  },
  {
    label: "Opportunity Frame",
    color: "#8720de",
    gradient: "linear-gradient(135deg, #8720de, #4e45e4)",
    cards: [
      {
        title: "Core Upsell",
        description: "Migrate Project Sentinel to PG Enterprise Tier.",
        badge: "Validated",
        badgeColor: "#22c55e",
      },
      {
        title: "Service Expansion",
        description: "Managed Services for Legacy Data Modernization.",
        badge: "In Progress",
        badgeColor: "#124af1",
      },
      {
        title: "Net New Footprint",
        description: "AI Content Generation engine for Marketing APAC.",
        badge: "Discovery",
        badgeColor: "#8720de",
      },
    ],
  },
];

// ─── MEDDPICC Framework ───────────────────────────────────────────────────────
const meddpiccItems = [
  {
    key: "M",
    label: "Metrics",
    status: "identified",
    detail: "Revenue per visitor, conversion rate, AOV",
  },
  {
    key: "E",
    label: "Economic Buyer",
    status: "gap",
    detail: "Not yet identified — AI scanning org data",
  },
  {
    key: "D",
    label: "Decision Criteria",
    status: "identified",
    detail: "KPI-native, real-time, enterprise-scale",
  },
  {
    key: "D",
    label: "Decision Process",
    status: "gap",
    detail: "Procurement flow unknown",
  },
  {
    key: "P",
    label: "Paper Process",
    status: "gap",
    detail: "Legal/procurement timeline unclear",
  },
  {
    key: "I",
    label: "Identified Pain",
    status: "identified",
    detail: "Search relevance, revenue leakage, manual merchandising",
  },
  {
    key: "C",
    label: "Champion",
    status: "identified",
    detail: "Head of Product Discovery (likely)",
  },
  {
    key: "C",
    label: "Competition",
    status: "partial",
    detail: "Algolia in use, limited KPI awareness",
  },
];

// ─── Org Chart Custom Node ────────────────────────────────────────────────────
function PersonaNode({
  data,
}: {
  data: { label: string; role: string; type: string; notes: string };
}) {
  const typeColors: Record<string, string> = {
    champion: "var(--tertiary)",
    "economic-buyer": "var(--error)",
    influencer: "var(--secondary-brand)",
    blocker: "#f59e0b",
    unknown: "var(--on-surface-variant)",
  };

  const typeLabels: Record<string, string> = {
    champion: "Champion",
    "economic-buyer": "Economic Buyer",
    influencer: "Influencer",
    blocker: "Blocker",
    unknown: "Unknown",
  };

  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: 12,
        background: "var(--surface-container-lowest)",
        border: `2px solid ${typeColors[data.type] || "var(--on-surface-variant)"}`,
        minWidth: 180,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "var(--primary)" }}
      />
      <div
        style={{
          fontFamily: "var(--font-headline)",
          fontWeight: 700,
          fontSize: "0.9rem",
          color: "var(--on-background)",
        }}
      >
        {data.label}
      </div>
      <div
        style={{
          fontSize: "0.78rem",
          color: "var(--on-surface-variant)",
          marginTop: 2,
        }}
      >
        {data.role}
      </div>
      <span
        style={{
          display: "inline-block",
          marginTop: 6,
          fontSize: "0.6rem",
          fontWeight: 700,
          fontFamily: "var(--font-label)",
          padding: "0.15rem 0.5rem",
          borderRadius: 9999,
          background: typeColors[data.type] || "var(--on-surface-variant)",
          color: "#fff",
        }}
      >
        {typeLabels[data.type] || "Unknown"}
      </span>
      {data.notes && (
        <div
          style={{
            fontSize: "0.72rem",
            color: "var(--on-surface-variant)",
            marginTop: 6,
            lineHeight: 1.3,
          }}
        >
          {data.notes}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "var(--primary)" }}
      />
    </div>
  );
}

const nodeTypes = { persona: PersonaNode };

// ─── Default Org Chart Nodes/Edges (placeholder) ─────────────────────────────
const defaultNodes: Node[] = [
  {
    id: "1",
    type: "persona",
    position: { x: 250, y: 0 },
    data: {
      label: "CTO / CPO",
      role: "C-Suite Technology",
      type: "economic-buyer",
      notes: "Final budget authority",
    },
  },
  {
    id: "2",
    type: "persona",
    position: { x: 80, y: 150 },
    data: {
      label: "VP Product",
      role: "Product Leadership",
      type: "champion",
      notes: "Key advocate for discovery improvements",
    },
  },
  {
    id: "3",
    type: "persona",
    position: { x: 420, y: 150 },
    data: {
      label: "VP Engineering",
      role: "Engineering Leadership",
      type: "influencer",
      notes: "Technical evaluation owner",
    },
  },
  {
    id: "4",
    type: "persona",
    position: { x: 0, y: 300 },
    data: {
      label: "Head of Search",
      role: "Product Discovery",
      type: "champion",
      notes: "Day-to-day champion — owns search KPIs",
    },
  },
  {
    id: "5",
    type: "persona",
    position: { x: 250, y: 300 },
    data: {
      label: "Sr. Engineer",
      role: "Platform Team",
      type: "influencer",
      notes: "Integration & API evaluation",
    },
  },
  {
    id: "6",
    type: "persona",
    position: { x: 480, y: 300 },
    data: {
      label: "Procurement Lead",
      role: "Procurement",
      type: "unknown",
      notes: "",
    },
  },
];

const defaultEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
    style: { stroke: "var(--primary)" },
  },
  {
    id: "e1-3",
    source: "1",
    target: "3",
    animated: true,
    style: { stroke: "var(--primary)" },
  },
  {
    id: "e2-4",
    source: "2",
    target: "4",
    style: { stroke: "var(--secondary-brand)" },
  },
  {
    id: "e3-5",
    source: "3",
    target: "5",
    style: { stroke: "var(--secondary-brand)" },
  },
  {
    id: "e3-6",
    source: "3",
    target: "6",
    style: { stroke: "var(--on-surface-variant)", strokeDasharray: "5 5" },
  },
];

// ─── Build pyramid rows from account insight data ─────────────────────────────
function buildPyramidRows(account: Account | null): PyramidRow[] {
  if (!account?.insights) return defaultPyramidRows;

  const insightMap: {
    key: keyof Account["insights"];
    label: string;
    color: string;
    gradient?: string;
  }[] = [
    { key: "strategicContext", label: "Strategic Context", color: "#124af1" },
    {
      key: "ecommercePriorities",
      label: "Ecommerce & Business Priorities",
      color: "#4e45e4",
    },
    { key: "activeInitiatives", label: "Active Initiatives", color: "#22c55e" },
    { key: "keyChallenges", label: "Challenges & Friction", color: "#ef4444" },
    {
      key: "opportunityFrame",
      label: "Opportunity Frame",
      color: "#8720de",
      gradient: "linear-gradient(135deg, #8720de, #4e45e4)",
    },
  ];

  return insightMap.map((row, rowIdx) => {
    const items = account.insights[row.key] as
      | { title: string; description: string }[]
      | undefined;

    // If account has insight data for this row, use it (up to 3 cards)
    if (items && Array.isArray(items) && items.length > 0) {
      return {
        label: row.label,
        color: row.color,
        gradient: row.gradient,
        cards: items.slice(0, 3).map((item) => ({
          title: item.title || "Untitled",
          description: item.description || "",
        })),
      };
    }

    // Fall back to static defaults
    return defaultPyramidRows[rowIdx];
  });
}

const API_URL = import.meta.env.VITE_API_URL || "http://51.21.219.66:4000";

// ─── Main Component ───────────────────────────────────────────────────────────
export function WarRoom() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pyramid" | "orgchart" | "ai">(
    "pyramid",
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI research assistant. Select an account and ask me anything about their pains, initiatives, buying signals, or org structure.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          { ...params, animated: true, style: { stroke: "var(--primary)" } },
          eds,
        ),
      ),
    [setEdges],
  );

  useEffect(() => {
    fetch(`${API_URL}/api/accounts`)
      .then((res) => res.json())
      .then((data: Account[]) => {
        const sorted = [...data].sort(
          (a, b) => (b.buyingSignalScore || 0) - (a.buyingSignalScore || 0),
        );
        setAccounts(sorted);
        if (sorted.length > 0) setSelectedAccount(sorted[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    // Simulated AI response (v0.1 — will integrate with Perplexity/Claude API)
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        role: "assistant",
        content: selectedAccount
          ? `Based on the research for **${selectedAccount.companyName}**, here's what I found:\n\n${selectedAccount.rationale ? selectedAccount.rationale.slice(0, 400) + "..." : "No detailed research available yet. Initiate a deep research from the Research Hub to populate this account's intelligence."}`
          : "Please select an account from the sidebar to get contextual insights.",
      };
      setChatMessages((prev) => [...prev, aiResponse]);
    }, 800);
  };

  const tabStyle = (tab: string) => ({
    padding: "0.6rem 1.2rem",
    borderRadius: 10,
    border: "none",
    fontFamily: "var(--font-label)",
    fontWeight: 700,
    fontSize: "0.88rem",
    cursor: "pointer" as const,
    background:
      activeTab === tab
        ? "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))"
        : "var(--surface-container-low)",
    color: activeTab === tab ? "#fff" : "var(--on-surface-variant)",
    transition: "all 140ms ease",
  });

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        minHeight: "100vh",
        backgroundColor: "var(--background)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* ─── Account Sidebar ─────────────────────────────────────── */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          borderRight: "1px solid rgba(107,113,148,0.15)",
          background: "var(--surface-container-lowest)",
          overflowY: "auto",
          padding: "1.25rem 0",
        }}
      >
        <div
          style={{
            padding: "0 1rem 1rem",
            borderBottom: "1px solid rgba(107,113,148,0.1)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-headline)",
              fontWeight: 800,
              fontSize: "1.15rem",
              color: "var(--on-background)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Target size={18} color="var(--primary)" /> War Room
          </div>
          <div
            style={{
              fontSize: "0.82rem",
              color: "var(--on-surface-variant)",
              marginTop: 4,
            }}
          >
            {accounts.length} accounts · Sorted by signal score
          </div>
        </div>
        {loading ? (
          <div
            style={{
              padding: "2rem 1rem",
              color: "var(--on-surface-variant)",
              fontSize: "0.9rem",
            }}
          >
            Loading accounts...
          </div>
        ) : (
          accounts.map((acc) => (
            <button
              key={acc._id}
              onClick={() => setSelectedAccount(acc)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "0.75rem 1rem",
                border: "none",
                background:
                  selectedAccount?._id === acc._id
                    ? "rgba(18,74,241,0.08)"
                    : "transparent",
                borderLeft:
                  selectedAccount?._id === acc._id
                    ? "3px solid var(--primary)"
                    : "3px solid transparent",
                cursor: "pointer",
                transition: "all 100ms",
                textAlign: "left",
              }}
            >
              <Building2
                size={16}
                color={
                  selectedAccount?._id === acc._id
                    ? "var(--primary)"
                    : "var(--on-surface-variant)"
                }
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    color: "var(--on-background)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {acc.companyName}
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  {acc.website}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 2,
                }}
              >
                {acc.buyingSignalScore != null && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                    }}
                  >
                    {acc.buyingSignalScore}
                  </span>
                )}
                {acc.priority && (
                  <span
                    style={{
                      fontSize: "0.58rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-label)",
                      padding: "0.1rem 0.4rem",
                      borderRadius: 4,
                      background:
                        acc.priority === "P1"
                          ? "var(--error)"
                          : "var(--secondary-brand)",
                      color: "#fff",
                    }}
                  >
                    {acc.priority}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* ─── Main Content ────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid rgba(107,113,148,0.1)",
            background: "var(--surface-container-lowest)",
          }}
        >
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
                  fontFamily: "var(--font-headline)",
                  fontWeight: 800,
                  fontSize: "1.4rem",
                  color: "var(--on-background)",
                }}
              >
                {selectedAccount?.companyName || "Select an Account"}
              </div>
              {selectedAccount?.website && (
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--on-surface-variant)",
                    marginTop: 2,
                  }}
                >
                  {selectedAccount.website}
                </div>
              )}
            </div>
            {selectedAccount && (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {selectedAccount.buyingSignalScore != null && (
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 800,
                        color: "var(--primary)",
                      }}
                    >
                      {selectedAccount.buyingSignalScore}
                    </div>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--on-surface-variant)",
                        fontFamily: "var(--font-label)",
                      }}
                    >
                      Signal Score
                    </div>
                  </div>
                )}
                {selectedAccount.priority && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-label)",
                      padding: "0.2rem 0.7rem",
                      borderRadius: 4,
                      background:
                        selectedAccount.priority === "P1"
                          ? "var(--error)"
                          : "var(--secondary-brand)",
                      color: "#fff",
                    }}
                  >
                    {selectedAccount.priority}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              style={tabStyle("pyramid")}
              onClick={() => setActiveTab("pyramid")}
            >
              <Layers size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
              Value Pyramid
            </button>
            <button
              style={tabStyle("orgchart")}
              onClick={() => setActiveTab("orgchart")}
            >
              <GitBranch
                size={14}
                style={{ marginRight: 6, verticalAlign: -2 }}
              />
              Org Chart
            </button>
            <button style={tabStyle("ai")} onClick={() => setActiveTab("ai")}>
              <Brain size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
              AI Assistant
            </button>
          </div>
        </div>

        {/* ─── Tab Content ─────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* ── Value Pyramid Tab ───────────────────────────────── */}
          {activeTab === "pyramid" && (
            <div
              style={{ padding: "1.5rem", maxWidth: 1200, margin: "0 auto" }}
            >
              {/* ── Section Header ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        fontFamily: "var(--font-label)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--primary)",
                      }}
                    >
                      Active Strategic Target
                    </span>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#22c55e",
                        display: "inline-block",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-headline)",
                      fontWeight: 800,
                      fontSize: "1.6rem",
                      color: "var(--on-background)",
                    }}
                  >
                    {selectedAccount?.companyName || "Select an Account"}
                  </div>
                </div>
                <button
                  style={{
                    padding: "0.5rem 1.2rem",
                    borderRadius: 8,
                    border: "1.5px solid var(--primary)",
                    background: "transparent",
                    color: "var(--primary)",
                    fontFamily: "var(--font-label)",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <FileText size={14} /> Export Blueprint
                </button>
                <button
                  style={{
                    padding: "0.5rem 1.2rem",
                    borderRadius: 8,
                    border: "none",
                    background:
                      "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                    color: "#fff",
                    fontFamily: "var(--font-label)",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Sparkles size={14} /> Update AI Strategy
                </button>
              </div>

              {/* ── Metric Cards Row ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 16,
                  marginBottom: 32,
                }}
              >
                {[
                  {
                    label: "Primary Industry",
                    value: "Enterprise SaaS",
                    icon: (
                      <Briefcase size={16} color="var(--on-surface-variant)" />
                    ),
                  },
                  {
                    label: "Annual Revenue",
                    value: "$14.2B USD",
                    icon: (
                      <TrendingUp size={16} color="var(--on-surface-variant)" />
                    ),
                  },
                  {
                    label: "Employee Count",
                    value: "42,500+",
                    icon: (
                      <UsersRound size={16} color="var(--on-surface-variant)" />
                    ),
                  },
                  {
                    label: "Revenue Growth Target",
                    value: "8.5% YoY",
                    icon: (
                      <TrendingUp size={16} color="var(--on-surface-variant)" />
                    ),
                  },
                ].map((metric, i) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    className="luminous-shadow"
                    style={{
                      borderRadius: "0.75rem",
                      padding: "1rem 1.25rem",
                      backgroundColor: "var(--surface-container-lowest)",
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
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          fontFamily: "var(--font-label)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "var(--on-surface-variant)",
                        }}
                      >
                        {metric.label}
                      </span>
                      {metric.icon}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-headline)",
                        fontWeight: 800,
                        fontSize: "1.15rem",
                        color: "var(--on-background)",
                      }}
                    >
                      {metric.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* ── Strategic Value Pyramid Heading ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 4,
                    height: 28,
                    borderRadius: 2,
                    background: "var(--on-background)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: "1.2rem",
                    color: "var(--on-background)",
                  }}
                >
                  Strategic Value Pyramid
                </span>
                <span
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-label)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "0.2rem 0.6rem",
                    borderRadius: 4,
                    background: "rgba(18,74,241,0.08)",
                    color: "var(--primary)",
                  }}
                >
                  Dynamic Framework
                </span>
              </div>

              {/* ── Pyramid Rows ── */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  marginBottom: 32,
                }}
              >
                {buildPyramidRows(selectedAccount).map((row, rowIdx) => (
                  <motion.div
                    key={row.label}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: rowIdx * 0.07 }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "180px 1fr 1fr 1fr",
                      gap: 14,
                      alignItems: "stretch",
                    }}
                  >
                    {/* Row Label */}
                    <div
                      style={{
                        background: row.gradient || row.color,
                        borderRadius: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "1rem 0.75rem",
                        minHeight: 90,
                      }}
                    >
                      <span
                        style={{
                          color: "#fff",
                          fontFamily: "var(--font-headline)",
                          fontWeight: 700,
                          fontSize: "0.88rem",
                          textAlign: "center",
                          lineHeight: 1.3,
                        }}
                      >
                        {row.label}
                      </span>
                    </div>

                    {/* 3 Detail Cards */}
                    {row.cards.map((card) => (
                      <div
                        key={card.title}
                        className="luminous-shadow"
                        style={{
                          borderRadius: "0.75rem",
                          padding: "1rem 1.1rem",
                          backgroundColor: "var(--surface-container-lowest)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              fontFamily: "var(--font-label)",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              color: "var(--on-surface-variant)",
                            }}
                          >
                            {card.title}
                          </span>
                          {card.badge && (
                            <span
                              style={{
                                fontSize: "0.55rem",
                                fontWeight: 700,
                                fontFamily: "var(--font-label)",
                                padding: "0.12rem 0.5rem",
                                borderRadius: 9999,
                                background: card.badgeColor
                                  ? `${card.badgeColor}18`
                                  : "rgba(18,74,241,0.08)",
                                color: card.badgeColor || "var(--primary)",
                              }}
                            >
                              {card.badge}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "0.84rem",
                            color: "var(--on-surface)",
                            lineHeight: 1.45,
                          }}
                        >
                          {card.description}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ))}
              </div>

              {/* ── Proprietary AI Insight Banner ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.4 }}
                className="luminous-shadow"
                style={{
                  borderRadius: "1rem",
                  padding: "1.5rem",
                  backgroundColor: "var(--surface-container-lowest)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
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
                  <Sparkles size={22} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-headline)",
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: "var(--on-background)",
                      marginBottom: 6,
                    }}
                  >
                    Proprietary AI Insight
                  </div>
                  <div
                    style={{
                      fontSize: "0.86rem",
                      color: "var(--on-surface)",
                      lineHeight: 1.55,
                    }}
                  >
                    {selectedAccount?.rationale
                      ? selectedAccount.rationale.slice(0, 350) +
                        (selectedAccount.rationale.length > 350 ? "..." : "")
                      : 'Analysis of Global Tech Systems\' recent quarterly report suggests a 12% increase in R&D focus toward edge computing. There is a \u00A084% correlation\u00A0 between their "Sustainability Goal" and our new Carbon Tracker module. Recommendation: Pitch the Tracker as a value-add during the Q3 renewal cycle.'}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <button
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: 8,
                      border: "none",
                      background: "var(--error)",
                      color: "#fff",
                      fontFamily: "var(--font-label)",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      cursor: "pointer",
                    }}
                  >
                    Action Suggestion
                  </button>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--primary)",
                      cursor: "pointer",
                      fontFamily: "var(--font-label)",
                      fontWeight: 600,
                    }}
                  >
                    Dismiss Insight
                  </span>
                </div>
              </motion.div>
            </div>
          )}

          {/* ── Org Chart Tab ───────────────────────────────────── */}
          {activeTab === "orgchart" && (
            <div style={{ height: "calc(100vh - 160px)", width: "100%" }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                style={{ background: "var(--background)" }}
              >
                <Background color="rgba(107,113,148,0.15)" gap={20} />
                <Controls
                  style={{
                    background: "var(--surface-container-lowest)",
                    borderRadius: 10,
                    border: "1px solid rgba(107,113,148,0.15)",
                  }}
                />
                <MiniMap
                  nodeColor={() => "var(--primary)"}
                  style={{
                    background: "var(--surface-container-low)",
                    borderRadius: 10,
                    border: "1px solid rgba(107,113,148,0.15)",
                  }}
                />
              </ReactFlow>

              {/* Legend */}
              <div
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: 20,
                  display: "flex",
                  gap: 12,
                  padding: "8px 14px",
                  borderRadius: 10,
                  background: "var(--surface-container-lowest)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                  color: "var(--on-surface-variant)",
                }}
              >
                <span>
                  <Crown
                    size={11}
                    color="var(--error)"
                    style={{ verticalAlign: -1 }}
                  />{" "}
                  Economic Buyer
                </span>
                <span>
                  <UserCheck
                    size={11}
                    color="var(--tertiary)"
                    style={{ verticalAlign: -1 }}
                  />{" "}
                  Champion
                </span>
                <span>
                  <Users
                    size={11}
                    color="var(--secondary-brand)"
                    style={{ verticalAlign: -1 }}
                  />{" "}
                  Influencer
                </span>
                <span>
                  <AlertTriangle
                    size={11}
                    color="#f59e0b"
                    style={{ verticalAlign: -1 }}
                  />{" "}
                  Blocker
                </span>
              </div>
            </div>
          )}

          {/* ── AI Assistant Tab ─────────────────────────────────── */}
          {activeTab === "ai" && (
            <div style={{ display: "flex", height: "calc(100vh - 160px)" }}>
              {/* Chat Area */}
              <div
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                {/* Messages */}
                <div style={{ flex: 1, overflow: "auto", padding: "1.5rem" }}>
                  {chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        display: "flex",
                        justifyContent:
                          msg.role === "user" ? "flex-end" : "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "70%",
                          padding: "0.75rem 1rem",
                          borderRadius:
                            msg.role === "user"
                              ? "14px 14px 4px 14px"
                              : "14px 14px 14px 4px",
                          background:
                            msg.role === "user"
                              ? "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))"
                              : "var(--surface-container-lowest)",
                          color:
                            msg.role === "user" ? "#fff" : "var(--on-surface)",
                          fontSize: "0.88rem",
                          lineHeight: 1.5,
                          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                        }}
                      >
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Input */}
                <div
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderTop: "1px solid rgba(107,113,148,0.1)",
                    background: "var(--surface-container-lowest)",
                    display: "flex",
                    gap: 10,
                  }}
                >
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder={
                      selectedAccount
                        ? `Ask about ${selectedAccount.companyName}...`
                        : "Select an account first..."
                    }
                    style={{
                      flex: 1,
                      padding: "0.7rem 1rem",
                      borderRadius: 10,
                      border: "1px solid rgba(107,113,148,0.15)",
                      background: "var(--surface-container-low)",
                      color: "var(--on-surface)",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleSendChat}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      border: "none",
                      background:
                        "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>

              {/* AI Insights Sidebar */}
              <div
                style={{
                  width: 320,
                  borderLeft: "1px solid rgba(107,113,148,0.1)",
                  overflowY: "auto",
                  padding: "1.25rem",
                  background: "var(--surface-container-lowest)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "var(--on-background)",
                    marginBottom: 16,
                  }}
                >
                  <Sparkles
                    size={14}
                    style={{
                      marginRight: 6,
                      verticalAlign: -2,
                      color: "var(--tertiary)",
                    }}
                  />
                  AI Detections
                </div>

                {/* Champion Detection */}
                <div
                  className="luminous-shadow"
                  style={{
                    borderRadius: 12,
                    padding: "1rem",
                    marginBottom: 12,
                    backgroundColor: "var(--surface-container-low)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-label)",
                      color: "var(--on-background)",
                      marginBottom: 6,
                    }}
                  >
                    <UserCheck
                      size={13}
                      color="var(--tertiary)"
                      style={{ marginRight: 4, verticalAlign: -2 }}
                    />
                    Champion Candidates
                  </div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--on-surface)",
                      lineHeight: 1.5,
                    }}
                  >
                    AI has identified <b>Head of Product Discovery</b> and{" "}
                    <b>VP Product</b> as likely champions based on their
                    involvement in search & personalization initiatives.
                  </div>
                </div>

                {/* Economic Buyer */}
                <div
                  className="luminous-shadow"
                  style={{
                    borderRadius: 12,
                    padding: "1rem",
                    marginBottom: 12,
                    backgroundColor: "var(--surface-container-low)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-label)",
                      color: "var(--on-background)",
                      marginBottom: 6,
                    }}
                  >
                    <Crown
                      size={13}
                      color="var(--error)"
                      style={{ marginRight: 4, verticalAlign: -2 }}
                    />
                    Economic Buyer
                  </div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--on-surface)",
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ color: "var(--error)", fontWeight: 600 }}>
                      Gap detected.
                    </span>{" "}
                    CTO/CPO identified as likely EB but no direct engagement
                    yet. Recommend multi-threading through champion.
                  </div>
                </div>

                {/* MEDDPICC Gaps */}
                <div
                  className="luminous-shadow"
                  style={{
                    borderRadius: 12,
                    padding: "1rem",
                    marginBottom: 12,
                    backgroundColor: "var(--surface-container-low)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-label)",
                      color: "var(--on-background)",
                      marginBottom: 6,
                    }}
                  >
                    <AlertTriangle
                      size={13}
                      color="#f59e0b"
                      style={{ marginRight: 4, verticalAlign: -2 }}
                    />
                    MEDDPICC Gaps
                  </div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--on-surface)",
                      lineHeight: 1.5,
                    }}
                  >
                    3 gaps identified: <b>Economic Buyer</b>,{" "}
                    <b>Decision Process</b>, <b>Paper Process</b>. Focus next
                    steps on uncovering procurement timeline and budget
                    authority.
                  </div>
                </div>

                {/* Key Challenges */}
                {(selectedAccount?.insights?.keyChallenges?.length ?? 0) >
                  0 && (
                  <div
                    className="luminous-shadow"
                    style={{
                      borderRadius: 12,
                      padding: "1rem",
                      backgroundColor: "var(--surface-container-low)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        fontFamily: "var(--font-label)",
                        color: "var(--on-background)",
                        marginBottom: 6,
                      }}
                    >
                      <MessageSquare
                        size={13}
                        color="var(--primary)"
                        style={{ marginRight: 4, verticalAlign: -2 }}
                      />
                      Key Challenges
                    </div>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--on-surface)",
                        lineHeight: 1.5,
                        maxHeight: 150,
                        overflow: "auto",
                      }}
                    >
                      {JSON.stringify(
                        selectedAccount?.insights?.keyChallenges,
                      ).slice(0, 300)}
                      {JSON.stringify(selectedAccount?.insights?.keyChallenges)
                        .length > 300 && "..."}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

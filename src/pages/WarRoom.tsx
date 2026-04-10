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
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Layers,
  GitBranch,
  Brain,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Account {
  _id: string;
  CompanyName: string;
  Website: string;
  score: number;
  priority: string;
  BuyingSignals: string;
  rationale: string;
  strategicContext: string;
  procurementPriorities: string;
  activeInitiatives: string;
  keyChallenges: string;
  opportunityFrame: string;
  created_at: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Value Pyramid Data ───────────────────────────────────────────────────────
const valuePyramidLevels = [
  {
    level: "Strategic",
    color: "var(--tertiary)",
    description: "Board-level business outcomes & market positioning",
    items: ["Revenue growth acceleration", "Market share expansion", "Competitive differentiation"],
  },
  {
    level: "Operational",
    color: "var(--secondary-brand)",
    description: "Process improvements & efficiency gains",
    items: ["Conversion rate optimization", "Search relevance improvement", "Merchandising automation"],
  },
  {
    level: "Tactical",
    color: "var(--primary)",
    description: "Day-to-day capabilities & feature needs",
    items: ["KPI-native product discovery", "Personalization at scale", "Real-time analytics dashboard"],
  },
];

// ─── MEDDPICC Framework ───────────────────────────────────────────────────────
const meddpiccItems = [
  { key: "M", label: "Metrics", status: "identified", detail: "Revenue per visitor, conversion rate, AOV" },
  { key: "E", label: "Economic Buyer", status: "gap", detail: "Not yet identified — AI scanning org data" },
  { key: "D", label: "Decision Criteria", status: "identified", detail: "KPI-native, real-time, enterprise-scale" },
  { key: "D", label: "Decision Process", status: "gap", detail: "Procurement flow unknown" },
  { key: "P", label: "Paper Process", status: "gap", detail: "Legal/procurement timeline unclear" },
  { key: "I", label: "Identified Pain", status: "identified", detail: "Search relevance, revenue leakage, manual merchandising" },
  { key: "C", label: "Champion", status: "identified", detail: "Head of Product Discovery (likely)" },
  { key: "C", label: "Competition", status: "partial", detail: "Algolia in use, limited KPI awareness" },
];

// ─── Org Chart Custom Node ────────────────────────────────────────────────────
function PersonaNode({ data }: { data: { label: string; role: string; type: string; notes: string } }) {
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
      <Handle type="target" position={Position.Top} style={{ background: "var(--primary)" }} />
      <div style={{ fontFamily: "var(--font-headline)", fontWeight: 700, fontSize: "0.9rem", color: "var(--on-background)" }}>
        {data.label}
      </div>
      <div style={{ fontSize: "0.78rem", color: "var(--on-surface-variant)", marginTop: 2 }}>{data.role}</div>
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
        <div style={{ fontSize: "0.72rem", color: "var(--on-surface-variant)", marginTop: 6, lineHeight: 1.3 }}>
          {data.notes}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: "var(--primary)" }} />
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
    data: { label: "CTO / CPO", role: "C-Suite Technology", type: "economic-buyer", notes: "Final budget authority" },
  },
  {
    id: "2",
    type: "persona",
    position: { x: 80, y: 150 },
    data: { label: "VP Product", role: "Product Leadership", type: "champion", notes: "Key advocate for discovery improvements" },
  },
  {
    id: "3",
    type: "persona",
    position: { x: 420, y: 150 },
    data: { label: "VP Engineering", role: "Engineering Leadership", type: "influencer", notes: "Technical evaluation owner" },
  },
  {
    id: "4",
    type: "persona",
    position: { x: 0, y: 300 },
    data: { label: "Head of Search", role: "Product Discovery", type: "champion", notes: "Day-to-day champion — owns search KPIs" },
  },
  {
    id: "5",
    type: "persona",
    position: { x: 250, y: 300 },
    data: { label: "Sr. Engineer", role: "Platform Team", type: "influencer", notes: "Integration & API evaluation" },
  },
  {
    id: "6",
    type: "persona",
    position: { x: 480, y: 300 },
    data: { label: "Procurement Lead", role: "Procurement", type: "unknown", notes: "" },
  },
];

const defaultEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "var(--primary)" } },
  { id: "e1-3", source: "1", target: "3", animated: true, style: { stroke: "var(--primary)" } },
  { id: "e2-4", source: "2", target: "4", style: { stroke: "var(--secondary-brand)" } },
  { id: "e3-5", source: "3", target: "5", style: { stroke: "var(--secondary-brand)" } },
  { id: "e3-6", source: "3", target: "6", style: { stroke: "var(--on-surface-variant)", strokeDasharray: "5 5" } },
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ─── Main Component ───────────────────────────────────────────────────────────
export function WarRoom() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pyramid" | "orgchart" | "ai">("pyramid");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I'm your AI research assistant. Select an account and ask me anything about their pains, initiatives, buying signals, or org structure." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [pyramidExpanded, setPyramidExpanded] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true });

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "var(--primary)" } }, eds)),
    [setEdges],
  );

  useEffect(() => {
    fetch(`${API_URL}/api/accounts`)
      .then((res) => res.json())
      .then((data: Account[]) => {
        const sorted = [...data].sort((a, b) => (b.score || 0) - (a.score || 0));
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
          ? `Based on the research for **${selectedAccount.CompanyName}**, here's what I found:\n\n${selectedAccount.rationale ? selectedAccount.rationale.slice(0, 400) + "..." : "No detailed research available yet. Initiate a deep research from the Research Hub to populate this account's intelligence."}`
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
    background: activeTab === tab ? "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))" : "var(--surface-container-low)",
    color: activeTab === tab ? "#fff" : "var(--on-surface-variant)",
    transition: "all 140ms ease",
  });

  return (
    <div style={{ display: "flex", height: "100%", minHeight: "100vh", backgroundColor: "var(--background)", fontFamily: "var(--font-body)" }}>
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
        <div style={{ padding: "0 1rem 1rem", borderBottom: "1px solid rgba(107,113,148,0.1)" }}>
          <div style={{ fontFamily: "var(--font-headline)", fontWeight: 800, fontSize: "1.15rem", color: "var(--on-background)", display: "flex", alignItems: "center", gap: 8 }}>
            <Target size={18} color="var(--primary)" /> War Room
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--on-surface-variant)", marginTop: 4 }}>
            {accounts.length} accounts · Sorted by signal score
          </div>
        </div>
        {loading ? (
          <div style={{ padding: "2rem 1rem", color: "var(--on-surface-variant)", fontSize: "0.9rem" }}>Loading accounts...</div>
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
                background: selectedAccount?._id === acc._id ? "rgba(18,74,241,0.08)" : "transparent",
                borderLeft: selectedAccount?._id === acc._id ? "3px solid var(--primary)" : "3px solid transparent",
                cursor: "pointer",
                transition: "all 100ms",
                textAlign: "left",
              }}
            >
              <Building2 size={16} color={selectedAccount?._id === acc._id ? "var(--primary)" : "var(--on-surface-variant)"} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-headline)", fontWeight: 600, fontSize: "0.85rem", color: "var(--on-background)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {acc.CompanyName}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--on-surface-variant)" }}>{acc.Website}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                {acc.score != null && (
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)" }}>{acc.score}</span>
                )}
                {acc.priority && (
                  <span
                    style={{
                      fontSize: "0.58rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-label)",
                      padding: "0.1rem 0.4rem",
                      borderRadius: 4,
                      background: acc.priority === "P1" ? "var(--error)" : "var(--secondary-brand)",
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(107,113,148,0.1)", background: "var(--surface-container-lowest)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "var(--font-headline)", fontWeight: 800, fontSize: "1.4rem", color: "var(--on-background)" }}>
                {selectedAccount?.CompanyName || "Select an Account"}
              </div>
              {selectedAccount?.Website && (
                <div style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)", marginTop: 2 }}>{selectedAccount.Website}</div>
              )}
            </div>
            {selectedAccount && (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {selectedAccount.score != null && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)" }}>{selectedAccount.score}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--on-surface-variant)", fontFamily: "var(--font-label)" }}>Signal Score</div>
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
                      background: selectedAccount.priority === "P1" ? "var(--error)" : "var(--secondary-brand)",
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
            <button style={tabStyle("pyramid")} onClick={() => setActiveTab("pyramid")}>
              <Layers size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
              Value Pyramid
            </button>
            <button style={tabStyle("orgchart")} onClick={() => setActiveTab("orgchart")}>
              <GitBranch size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
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
            <div style={{ padding: "1.5rem", maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
                {/* Pyramid */}
                <div>
                  <div style={{ fontFamily: "var(--font-headline)", fontWeight: 700, fontSize: "1.1rem", color: "var(--on-background)", marginBottom: 16 }}>
                    Value Pyramid
                  </div>
                  {valuePyramidLevels.map((level, i) => (
                    <motion.div
                      key={level.level}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.08 }}
                      className="luminous-shadow"
                      style={{
                        borderRadius: "1rem",
                        padding: "1.25rem",
                        backgroundColor: "var(--surface-container-lowest)",
                        marginBottom: 12,
                        borderLeft: `4px solid ${level.color}`,
                        cursor: "pointer",
                      }}
                      onClick={() => setPyramidExpanded((prev) => ({ ...prev, [i]: !prev[i] }))}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {pyramidExpanded[i] ? <ChevronDown size={16} color={level.color} /> : <ChevronRight size={16} color={level.color} />}
                          <div>
                            <div style={{ fontFamily: "var(--font-headline)", fontWeight: 700, fontSize: "1rem", color: "var(--on-background)" }}>
                              {level.level} Value
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "var(--on-surface-variant)" }}>{level.description}</div>
                          </div>
                        </div>
                      </div>
                      {pyramidExpanded[i] && (
                        <div style={{ marginTop: 12, paddingLeft: 26 }}>
                          {level.items.map((item) => (
                            <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: "0.88rem", color: "var(--on-surface)" }}>
                              <CheckCircle size={14} color={level.color} />
                              {item}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Account Context from Research */}
                  {selectedAccount?.strategicContext && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="luminous-shadow"
                      style={{
                        borderRadius: "1rem",
                        padding: "1.25rem",
                        backgroundColor: "var(--surface-container-lowest)",
                        marginTop: 16,
                      }}
                    >
                      <div style={{ fontFamily: "var(--font-headline)", fontWeight: 700, fontSize: "0.95rem", color: "var(--on-background)", marginBottom: 8 }}>
                        <Sparkles size={14} style={{ marginRight: 6, verticalAlign: -2, color: "var(--tertiary)" }} />
                        Strategic Context (from Research)
                      </div>
                      <div style={{ fontSize: "0.88rem", color: "var(--on-surface)", lineHeight: 1.5, maxHeight: 200, overflow: "auto" }}>
                        {selectedAccount.strategicContext.slice(0, 600)}
                        {selectedAccount.strategicContext.length > 600 && "..."}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* MEDDPICC Sidebar */}
                <div>
                  <div style={{ fontFamily: "var(--font-headline)", fontWeight: 700, fontSize: "1.1rem", color: "var(--on-background)", marginBottom: 16 }}>
                    MEDDPICC Analysis
                  </div>
                  <div className="luminous-shadow" style={{ borderRadius: "1rem", padding: "1rem", backgroundColor: "var(--surface-container-lowest)" }}>
                    {meddpiccItems.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          padding: "10px 0",
                          borderBottom: i < meddpiccItems.length - 1 ? "1px solid rgba(107,113,148,0.1)" : "none",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "var(--font-label)",
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            color: "#fff",
                            flexShrink: 0,
                            background:
                              item.status === "identified"
                                ? "var(--primary)"
                                : item.status === "partial"
                                  ? "#f59e0b"
                                  : "var(--error)",
                          }}
                        >
                          {item.key}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.82rem", fontWeight: 700, fontFamily: "var(--font-label)", color: "var(--on-background)" }}>
                            {item.label}
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: "0.6rem",
                                padding: "0.1rem 0.4rem",
                                borderRadius: 9999,
                                fontWeight: 600,
                                background:
                                  item.status === "identified"
                                    ? "rgba(18,74,241,0.1)"
                                    : item.status === "partial"
                                      ? "rgba(245,158,11,0.1)"
                                      : "rgba(211,47,47,0.1)",
                                color:
                                  item.status === "identified"
                                    ? "var(--primary)"
                                    : item.status === "partial"
                                      ? "#f59e0b"
                                      : "var(--error)",
                              }}
                            >
                              {item.status === "identified" ? "Identified" : item.status === "partial" ? "Partial" : "Gap"}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "var(--on-surface-variant)", marginTop: 2, lineHeight: 1.3 }}>{item.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
                <span><Crown size={11} color="var(--error)" style={{ verticalAlign: -1 }} /> Economic Buyer</span>
                <span><UserCheck size={11} color="var(--tertiary)" style={{ verticalAlign: -1 }} /> Champion</span>
                <span><Users size={11} color="var(--secondary-brand)" style={{ verticalAlign: -1 }} /> Influencer</span>
                <span><AlertTriangle size={11} color="#f59e0b" style={{ verticalAlign: -1 }} /> Blocker</span>
              </div>
            </div>
          )}

          {/* ── AI Assistant Tab ─────────────────────────────────── */}
          {activeTab === "ai" && (
            <div style={{ display: "flex", height: "calc(100vh - 160px)" }}>
              {/* Chat Area */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
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
                        justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "70%",
                          padding: "0.75rem 1rem",
                          borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                          background: msg.role === "user" ? "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))" : "var(--surface-container-lowest)",
                          color: msg.role === "user" ? "#fff" : "var(--on-surface)",
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
                    placeholder={selectedAccount ? `Ask about ${selectedAccount.CompanyName}...` : "Select an account first..."}
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
                      background: "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
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
                <div style={{ fontFamily: "var(--font-headline)", fontWeight: 700, fontSize: "1rem", color: "var(--on-background)", marginBottom: 16 }}>
                  <Sparkles size={14} style={{ marginRight: 6, verticalAlign: -2, color: "var(--tertiary)" }} />
                  AI Detections
                </div>

                {/* Champion Detection */}
                <div className="luminous-shadow" style={{ borderRadius: 12, padding: "1rem", marginBottom: 12, backgroundColor: "var(--surface-container-low)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, fontFamily: "var(--font-label)", color: "var(--on-background)", marginBottom: 6 }}>
                    <UserCheck size={13} color="var(--tertiary)" style={{ marginRight: 4, verticalAlign: -2 }} />
                    Champion Candidates
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--on-surface)", lineHeight: 1.5 }}>
                    AI has identified <b>Head of Product Discovery</b> and <b>VP Product</b> as likely champions based on their involvement in search & personalization initiatives.
                  </div>
                </div>

                {/* Economic Buyer */}
                <div className="luminous-shadow" style={{ borderRadius: 12, padding: "1rem", marginBottom: 12, backgroundColor: "var(--surface-container-low)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, fontFamily: "var(--font-label)", color: "var(--on-background)", marginBottom: 6 }}>
                    <Crown size={13} color="var(--error)" style={{ marginRight: 4, verticalAlign: -2 }} />
                    Economic Buyer
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--on-surface)", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--error)", fontWeight: 600 }}>Gap detected.</span> CTO/CPO identified as likely EB but no direct engagement yet. Recommend multi-threading through champion.
                  </div>
                </div>

                {/* MEDDPICC Gaps */}
                <div className="luminous-shadow" style={{ borderRadius: 12, padding: "1rem", marginBottom: 12, backgroundColor: "var(--surface-container-low)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, fontFamily: "var(--font-label)", color: "var(--on-background)", marginBottom: 6 }}>
                    <AlertTriangle size={13} color="#f59e0b" style={{ marginRight: 4, verticalAlign: -2 }} />
                    MEDDPICC Gaps
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--on-surface)", lineHeight: 1.5 }}>
                    3 gaps identified: <b>Economic Buyer</b>, <b>Decision Process</b>, <b>Paper Process</b>. Focus next steps on uncovering procurement timeline and budget authority.
                  </div>
                </div>

                {/* Key Challenges */}
                {selectedAccount?.keyChallenges && (
                  <div className="luminous-shadow" style={{ borderRadius: 12, padding: "1rem", backgroundColor: "var(--surface-container-low)" }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, fontFamily: "var(--font-label)", color: "var(--on-background)", marginBottom: 6 }}>
                      <MessageSquare size={13} color="var(--primary)" style={{ marginRight: 4, verticalAlign: -2 }} />
                      Key Challenges
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--on-surface)", lineHeight: 1.5, maxHeight: 150, overflow: "auto" }}>
                      {selectedAccount.keyChallenges.slice(0, 300)}
                      {selectedAccount.keyChallenges.length > 300 && "..."}
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

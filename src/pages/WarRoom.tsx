import { useState, useEffect, useCallback } from "react";
import { useAuth, buildAuthHeaders } from "../App";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
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
  X,
  ShieldCheck,
  UserPlus,
  Plus,
  RefreshCw,
  Loader2,
  ChevronDown,
  ExternalLink as LinkedinIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChampionCandidate {
  full_name: string;
  title_role: string;
  pain_hypothesis?: string;
  engagement_strategy?: string;
  risk_notes?: string;
  linkedin_indicators?: string[];
  linkedin_url?: string;
  confidence?: string;
}

interface Detractor {
  full_name: string;
  title_role: string;
  reason_for_resistance?: string;
  mitigation_strategy?: string;
  linkedin_url?: string;
}

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
    lastSwarmRun?: string;
  };
  timestamp: string;
  champion_cxo_candidates?: ChampionCandidate[];
  champion_vp_director_candidates?: ChampionCandidate[];
  champion_enduser_candidates?: ChampionCandidate[];
  detractors?: Detractor[];
  primary_champion_recommendation?: string;
  champion_overall_readiness?: string;
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
  data: {
    label: string;
    role: string;
    type: string;
    notes: string;
    painHypothesis?: string;
    engagementStrategy?: string;
    confidence?: string;
    linkedinUrl?: string;
    isChampion?: boolean;
    isVerified?: boolean;
    onToggleChampion?: () => void;
    onToggleVerified?: () => void;
  };
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
      <div
        style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}
      >
        <span
          style={{
            display: "inline-block",
            fontSize: "0.6rem",
            fontWeight: 700,
            fontFamily: "var(--font-label)",
            padding: "0.15rem 0.5rem",
            borderRadius: 9999,
            background: typeColors[data.type] || "var(--on-surface-variant)",
            color: "#fff",
          }}
        >
          {(typeLabels[data.type] || "Unknown") +
            (!data.isVerified &&
            (data.type === "champion" || data.type === "economic-buyer")
              ? " Candidate"
              : "")}
        </span>
        {data.linkedinUrl && (
          <a
            href={data.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              color: "#0a66c2",
              transition: "opacity 0.15s",
            }}
            title="View LinkedIn Profile"
          >
            <LinkedinIcon size={13} />
          </a>
        )}
      </div>

      {/* Champion + Verified toggles */}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleChampion?.();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            fontSize: "0.58rem",
            fontWeight: 700,
            fontFamily: "var(--font-label)",
            padding: "0.15rem 0.45rem",
            borderRadius: 6,
            border: "1.5px solid",
            borderColor: data.isChampion
              ? "var(--tertiary)"
              : "rgba(107,113,148,0.3)",
            background: data.isChampion
              ? "rgba(135,32,222,0.12)"
              : "transparent",
            color: data.isChampion
              ? "var(--tertiary)"
              : "var(--on-surface-variant)",
            cursor: "pointer",
            transition: "all 140ms ease",
          }}
        >
          <UserCheck size={10} />
          Champion
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleVerified?.();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            fontSize: "0.58rem",
            fontWeight: 700,
            fontFamily: "var(--font-label)",
            padding: "0.15rem 0.45rem",
            borderRadius: 6,
            border: "1.5px solid",
            borderColor: data.isVerified ? "#22c55e" : "rgba(107,113,148,0.3)",
            background: data.isVerified
              ? "rgba(34,197,94,0.12)"
              : "transparent",
            color: data.isVerified ? "#22c55e" : "var(--on-surface-variant)",
            cursor: "pointer",
            transition: "all 140ms ease",
          }}
        >
          <ShieldCheck size={10} />
          {data.isVerified ? "Verified" : "Unverified"}
        </button>
      </div>

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
      {data.painHypothesis && (
        <div
          style={{
            fontSize: "0.65rem",
            color: "var(--tertiary)",
            marginTop: 4,
            lineHeight: 1.3,
            fontStyle: "italic",
          }}
        >
          Pain: {data.painHypothesis}
        </div>
      )}
      {data.engagementStrategy && (
        <div
          style={{
            fontSize: "0.65rem",
            color: "var(--primary)",
            marginTop: 3,
            lineHeight: 1.3,
          }}
        >
          Strategy: {data.engagementStrategy}
        </div>
      )}
      {data.confidence && (
        <span
          style={{
            display: "inline-block",
            marginTop: 4,
            fontSize: "0.55rem",
            fontWeight: 600,
            fontFamily: "var(--font-label)",
            padding: "0.1rem 0.4rem",
            borderRadius: 4,
            background:
              data.confidence === "high"
                ? "rgba(34,197,94,0.15)"
                : data.confidence === "medium"
                  ? "rgba(245,158,11,0.15)"
                  : "rgba(239,68,68,0.15)",
            color:
              data.confidence === "high"
                ? "#22c55e"
                : data.confidence === "medium"
                  ? "#f59e0b"
                  : "#ef4444",
          }}
        >
          {data.confidence} confidence
        </span>
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

// ─── Build Org Chart from Champion Data ───────────────────────────────────────
function buildOrgChartFromChampions(account: Account | null): {
  nodes: Node[];
  edges: Edge[];
} {
  if (!account) return { nodes: defaultNodes, edges: defaultEdges };

  const cxo = account.champion_cxo_candidates || [];
  const vpDir = account.champion_vp_director_candidates || [];
  const endUser = account.champion_enduser_candidates || [];
  const blockers = account.detractors || [];

  const hasChampionData =
    cxo.length > 0 ||
    vpDir.length > 0 ||
    endUser.length > 0 ||
    blockers.length > 0;

  if (!hasChampionData) return { nodes: defaultNodes, edges: defaultEdges };

  const newNodes: Node[] = [];
  const newEdges: Edge[] = [];
  let nodeId = 1;

  // Row 0: CXO candidates (economic buyers / exec sponsors)
  const cxoIds: string[] = [];
  cxo.forEach((c, i) => {
    const id = String(nodeId++);
    cxoIds.push(id);
    newNodes.push({
      id,
      type: "persona",
      position: { x: 220 * i + 80, y: 0 },
      data: {
        label: c.full_name,
        role: c.title_role,
        type: "economic-buyer",
        notes: c.risk_notes || "",
        painHypothesis: c.pain_hypothesis || "",
        engagementStrategy: c.engagement_strategy || "",
        confidence: c.confidence || "",
        linkedinUrl: c.linkedin_url || "",
        isChampion: false,
        isVerified: false,
      },
    });
  });

  // Row 1: VP/Director candidates (champions)
  const vpIds: string[] = [];
  vpDir.forEach((c, i) => {
    const id = String(nodeId++);
    vpIds.push(id);
    newNodes.push({
      id,
      type: "persona",
      position: { x: 220 * i + 40, y: 180 },
      data: {
        label: c.full_name,
        role: c.title_role,
        type: "champion",
        notes: c.risk_notes || "",
        painHypothesis: c.pain_hypothesis || "",
        engagementStrategy: c.engagement_strategy || "",
        confidence: c.confidence || "",
        linkedinUrl: c.linkedin_url || "",
        isChampion: true,
        isVerified: false,
      },
    });
    // Connect to all CXO nodes
    cxoIds.forEach((cxoId) => {
      newEdges.push({
        id: `e${cxoId}-${id}`,
        source: cxoId,
        target: id,
        animated: true,
        style: { stroke: "var(--primary)" },
      });
    });
  });

  // Row 2: End-user candidates (influencers)
  const euIds: string[] = [];
  endUser.forEach((c, i) => {
    const id = String(nodeId++);
    euIds.push(id);
    newNodes.push({
      id,
      type: "persona",
      position: { x: 220 * i, y: 360 },
      data: {
        label: c.full_name,
        role: c.title_role,
        type: "influencer",
        notes: c.risk_notes || "",
        painHypothesis: c.pain_hypothesis || "",
        engagementStrategy: c.engagement_strategy || "",
        confidence: c.confidence || "",
        linkedinUrl: c.linkedin_url || "",
        isChampion: false,
        isVerified: false,
      },
    });
    // Connect to nearest VP node or first CXO
    const parentId = vpIds[Math.min(i, vpIds.length - 1)] || cxoIds[0];
    if (parentId) {
      newEdges.push({
        id: `e${parentId}-${id}`,
        source: parentId,
        target: id,
        style: { stroke: "var(--secondary-brand)" },
      });
    }
  });

  // Detractors / blockers — positioned to the right
  blockers.forEach((d, i) => {
    const id = String(nodeId++);
    const rightX = Math.max(...newNodes.map((n) => n.position.x), 400) + 80;
    newNodes.push({
      id,
      type: "persona",
      position: { x: rightX + 220 * i, y: 180 },
      data: {
        label: d.full_name,
        role: d.title_role,
        type: "blocker",
        notes: d.reason_for_resistance || "",
        painHypothesis: "",
        engagementStrategy: d.mitigation_strategy || "",
        confidence: "",
        linkedinUrl: d.linkedin_url || "",
        isChampion: false,
        isVerified: false,
      },
    });
    // Dashed edge from first CXO
    if (cxoIds[0]) {
      newEdges.push({
        id: `e${cxoIds[0]}-${id}`,
        source: cxoIds[0],
        target: id,
        style: {
          stroke: "#f59e0b",
          strokeDasharray: "5 5",
        },
      });
    }
  });

  return { nodes: newNodes, edges: newEdges };
}

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

const API_URL = import.meta.env.VITE_API_URL || "";

// ─── Main Component ───────────────────────────────────────────────────────────
export function WarRoom() {
  const location = useLocation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pyramid" | "orgchart" | "ai">(
    "orgchart",
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI research assistant. Select an account and ask me anything about their pains, initiatives, buying signals, or org structure.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [detailInsight, setDetailInsight] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPerson, setNewPerson] = useState({
    name: "",
    role: "",
    type: "unknown" as string,
    linkedinUrl: "",
  });

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

  // Toggle isChampion on a node
  const toggleChampion = useCallback(
    (nodeId: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, isChampion: !n.data.isChampion } }
            : n,
        ),
      );
    },
    [setNodes],
  );

  // Toggle isVerified on a node
  const toggleVerified = useCallback(
    (nodeId: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, isVerified: !n.data.isVerified } }
            : n,
        ),
      );
    },
    [setNodes],
  );

  // Inject toggle callbacks into node data whenever nodes change
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onToggleChampion: () => toggleChampion(n.id),
          onToggleVerified: () => toggleVerified(n.id),
        },
      })),
    );
    // Only re-inject when toggleChampion/toggleVerified references change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggleChampion, toggleVerified]);

  // Add a new person to the org chart
  const handleAddPerson = useCallback(() => {
    if (!newPerson.name.trim()) return;

    const maxX = nodes.reduce((mx, n) => Math.max(mx, n.position.x), 0);
    const maxY = nodes.reduce((mx, n) => Math.max(mx, n.position.y), 0);
    const id = String(Date.now());

    const newNode: Node = {
      id,
      type: "persona",
      position: { x: maxX + 240, y: maxY > 0 ? maxY / 2 : 180 },
      data: {
        label: newPerson.name.trim(),
        role: newPerson.role.trim() || "Unknown Role",
        type: newPerson.type,
        notes: "",
        linkedinUrl: newPerson.linkedinUrl.trim() || "",
        isChampion: false,
        isVerified: false,
        onToggleChampion: () => toggleChampion(id),
        onToggleVerified: () => toggleVerified(id),
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setNewPerson({ name: "", role: "", type: "unknown", linkedinUrl: "" });
    setShowAddPerson(false);
  }, [newPerson, nodes, setNodes, toggleChampion, toggleVerified]);

  // Auto-save org chart when nodes or edges change (debounced)
  useEffect(() => {
    if (!selectedAccount) return;
    const timeout = setTimeout(() => {
      // Strip callback functions before saving
      const cleanNodes = nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onToggleChampion: undefined,
          onToggleVerified: undefined,
        },
      }));
      fetch(`${API_URL}/api/org-chart/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_name: selectedAccount.companyName,
          nodes: cleanNodes,
          edges,
        }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(timeout);
  }, [nodes, edges, selectedAccount]);

  // Rebuild org chart when selected account changes — load persisted first, fallback to champion data
  useEffect(() => {
    if (!selectedAccount) return;

    const accountName = selectedAccount.companyName;

    // Try loading persisted org chart from backend
    fetch(`${API_URL}/api/org-chart/${encodeURIComponent(accountName)}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("not found");
      })
      .then((data) => {
        if (data.nodes && data.nodes.length > 0) {
          setNodes(data.nodes);
          setEdges(data.edges || []);
        } else {
          throw new Error("empty");
        }
      })
      .catch(() => {
        // Fallback: build from champion data
        const { nodes: newNodes, edges: newEdges } =
          buildOrgChartFromChampions(selectedAccount);
        setNodes(newNodes);
        setEdges(newEdges);

        // Auto-save if we built a real chart (not defaults)
        const hasChampionData =
          (selectedAccount.champion_cxo_candidates || []).length > 0 ||
          (selectedAccount.champion_vp_director_candidates || []).length > 0 ||
          (selectedAccount.champion_enduser_candidates || []).length > 0 ||
          (selectedAccount.detractors || []).length > 0;

        if (hasChampionData) {
          fetch(`${API_URL}/api/org-chart/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              account_name: accountName,
              nodes: newNodes,
              edges: newEdges,
            }),
          }).catch(() => {});
        }
      });
  }, [selectedAccount, setNodes, setEdges]);

  const { user, activeTenant } = useAuth();
  const authHeaders = buildAuthHeaders(user, activeTenant);

  // Only platform_admin, company_admin, and sales_leader can trigger research & run swarms
  const canRunResearch =
    user?.isPlatformAdmin ||
    ["platform_admin", "company_admin", "sales_leader"].includes(
      user?.role || "",
    );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedAccount = (params.get("account") || "").trim();
    const normalizedRequested = requestedAccount
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    fetch(`${API_URL}/api/accounts`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data: Account[]) => {
        const sorted = [...data].sort(
          (a, b) => (b.buyingSignalScore || 0) - (a.buyingSignalScore || 0),
        );
        setAccounts(sorted);
        if (sorted.length > 0) {
          const normalized = (name?: string) =>
            (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          const fromQuery = normalizedRequested
            ? sorted.find(
                (account) =>
                  normalized(account.companyName) === normalizedRequested,
              )
            : null;
          const keepCurrent = selectedAccount
            ? sorted.find((account) => account._id === selectedAccount._id)
            : null;
          const preferred = sorted.find(
            (account) => normalized(account.companyName) === "mrmarvis",
          );
          setSelectedAccount(
            fromQuery || keepCurrent || preferred || sorted[0],
          );
        } else {
          setSelectedAccount(null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.email, user?.role, activeTenant, location.search]);

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
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowAccountDropdown((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: accounts.length > 1 ? "pointer" : "default",
                }}
              >
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
                {accounts.length > 1 && (
                  <ChevronDown
                    size={20}
                    color="var(--on-surface-variant)"
                    style={{
                      transition: "transform 150ms ease",
                      transform: showAccountDropdown
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
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
              {/* Account switcher dropdown */}
              {showAccountDropdown && accounts.length > 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    zIndex: 200,
                    background: "var(--surface-container-lowest)",
                    borderRadius: 12,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                    border: "1px solid rgba(107,113,148,0.15)",
                    minWidth: 260,
                    maxHeight: 320,
                    overflowY: "auto",
                    padding: "6px 0",
                  }}
                >
                  {accounts.map((acc) => (
                    <button
                      key={acc._id}
                      onClick={() => {
                        setSelectedAccount(acc);
                        setShowAccountDropdown(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "0.6rem 1rem",
                        background:
                          acc._id === selectedAccount?._id
                            ? "var(--surface-container-low)"
                            : "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: "var(--font-headline)",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            color:
                              acc._id === selectedAccount?._id
                                ? "var(--primary)"
                                : "var(--on-background)",
                          }}
                        >
                          {acc.companyName}
                        </div>
                        {acc.website && (
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--on-surface-variant)",
                              marginTop: 1,
                            }}
                          >
                            {acc.website}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexShrink: 0,
                        }}
                      >
                        {acc.priority && (
                          <span
                            style={{
                              fontSize: "0.6rem",
                              fontWeight: 700,
                              fontFamily: "var(--font-label)",
                              padding: "0.1rem 0.45rem",
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
                        {acc.buyingSignalScore != null && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: "var(--primary)",
                              fontFamily: "var(--font-label)",
                            }}
                          >
                            {acc.buyingSignalScore}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
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
              style={{ padding: "1.5rem", maxWidth: 1400, margin: "0 auto" }}
            >
              <div
                className="warroom-pyramid-layout"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) 320px",
                  gap: 20,
                  alignItems: "start",
                }}
              >
                <div>
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
                          fontSize: "1.45rem",
                          color: "var(--on-background)",
                        }}
                      >
                        {selectedAccount?.companyName || "Select an Account"}
                      </div>
                    </div>
                    <button
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: 8,
                        border: "1.5px solid var(--primary)",
                        background: "transparent",
                        color: "var(--primary)",
                        fontFamily: "var(--font-label)",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <FileText size={14} /> Export Blueprint
                    </button>
                    <button
                      disabled={
                        refreshing || !selectedAccount || !canRunResearch
                      }
                      onClick={async () => {
                        if (!selectedAccount || !canRunResearch) return;
                        setRefreshing(true);
                        try {
                          // 1. Fire n8n monolith research
                          await fetch(`${API_URL}/api/research`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              account_name: selectedAccount.companyName,
                              website_url: selectedAccount.website,
                            }),
                          });
                          // 2. Run all agents via swarm
                          const allAgents = [
                            "financial-agent",
                            "tech-stack-agent",
                            "hiring-agent",
                            "initiative-agent",
                            "category-complexity-agent",
                            "competitor-agent",
                            "sentiment-agent",
                            "leadership-agent",
                            "earnings-call-agent",
                            "vendor-tenure-agent",
                            "champion-building-agent",
                            "risk-flagger-agent",
                            "market-research-agent",
                          ];
                          await fetch(`${API_URL}/api/swarm/run`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              account_name: selectedAccount.companyName,
                              agents: allAgents,
                              template: "full-refresh",
                            }),
                          });
                        } catch (err) {
                          console.error("Refresh failed:", err);
                        } finally {
                          setRefreshing(false);
                        }
                      }}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: 8,
                        border: "none",
                        background: refreshing
                          ? "var(--on-surface-variant)"
                          : "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                        color: "#fff",
                        fontFamily: "var(--font-label)",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        cursor: refreshing ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        opacity: refreshing ? 0.7 : 1,
                      }}
                    >
                      {refreshing ? (
                        <Loader2
                          size={14}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>

                  {/* ── Previous research timestamp ── */}
                  {selectedAccount && (
                    <p
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--on-surface-variant)",
                        fontFamily: "var(--font-body)",
                        marginTop: -4,
                        marginBottom: 16,
                      }}
                    >
                      Previous research completed:{" "}
                      {selectedAccount.metadata?.lastSwarmRun
                        ? new Date(
                            selectedAccount.metadata.lastSwarmRun,
                          ).toLocaleString()
                        : selectedAccount.timestamp
                          ? new Date(selectedAccount.timestamp).toLocaleString()
                          : "No research run yet"}
                    </p>
                  )}

                  {/* ── Metric Cards Row ── */}
                  <div
                    className="responsive-grid-4"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 12,
                      marginBottom: 24,
                    }}
                  >
                    {[
                      {
                        label: "Primary Industry",
                        value: "Enterprise SaaS",
                        icon: (
                          <Briefcase
                            size={16}
                            color="var(--on-surface-variant)"
                          />
                        ),
                      },
                      {
                        label: "Annual Revenue",
                        value: "$14.2B USD",
                        icon: (
                          <TrendingUp
                            size={16}
                            color="var(--on-surface-variant)"
                          />
                        ),
                      },
                      {
                        label: "Employee Count",
                        value: "42,500+",
                        icon: (
                          <UsersRound
                            size={16}
                            color="var(--on-surface-variant)"
                          />
                        ),
                      },
                      {
                        label: "Revenue Growth Target",
                        value: "8.5% YoY",
                        icon: (
                          <TrendingUp
                            size={16}
                            color="var(--on-surface-variant)"
                          />
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
                          padding: "0.8rem 0.95rem",
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
                            fontSize: "1rem",
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
                      marginBottom: 16,
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
                      gap: 10,
                      marginBottom: 20,
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
                          gridTemplateColumns: "140px 1fr 1fr 1fr",
                          gap: 10,
                          alignItems: "stretch",
                        }}
                        className="warroom-pyramid-row"
                      >
                        {/* Row Label */}
                        <div
                          style={{
                            background: row.gradient || row.color,
                            borderRadius: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0.75rem 0.65rem",
                            minHeight: 74,
                          }}
                        >
                          <span
                            style={{
                              color: "#fff",
                              fontFamily: "var(--font-headline)",
                              fontWeight: 700,
                              fontSize: "0.78rem",
                              textAlign: "center",
                              lineHeight: 1.3,
                            }}
                          >
                            {row.label}
                          </span>
                        </div>

                        {/* 3 Detail Cards */}
                        {row.cards.map((card, cardIdx) => {
                          return (
                            <div
                              key={card.title}
                              style={{
                                borderRadius: "0.75rem",
                                padding: "0.9rem 0.8rem",
                                backgroundColor: "#1e2230",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                minHeight: 118,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.66rem",
                                  fontWeight: 700,
                                  fontFamily: "var(--font-headline)",
                                  color: "rgba(167,176,222,0.7)",
                                  lineHeight: 1.45,
                                  textTransform: "uppercase",
                                  textAlign: "center",
                                  letterSpacing: "0.03em",
                                }}
                              >
                                {card.title}
                              </span>
                              {card.description && (
                                <button
                                  onClick={() =>
                                    setDetailInsight({
                                      title: card.title,
                                      description: card.description,
                                    })
                                  }
                                  style={{
                                    background: "rgba(167,176,222,0.12)",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "0.68rem",
                                    fontWeight: 600,
                                    fontFamily: "var(--font-label)",
                                    color: "rgba(167,176,222,0.6)",
                                    padding: "0.3rem 1rem",
                                    borderRadius: 9999,
                                    marginTop: "auto",
                                  }}
                                >
                                  expand
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </motion.div>
                    ))}
                  </div>

                  {/* ── Insight Detail Widget ── */}
                  <AnimatePresence>
                    {detailInsight && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setDetailInsight(null)}
                        style={{
                          position: "fixed",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: "rgba(0,0,0,0.25)",
                          zIndex: 1000,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 12 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 12 }}
                          transition={{ duration: 0.2 }}
                          onClick={(e) => e.stopPropagation()}
                          className="luminous-shadow"
                          style={{
                            backgroundColor: "var(--surface-container-lowest)",
                            borderRadius: "1rem",
                            padding: "1.75rem",
                            maxWidth: 560,
                            width: "90%",
                            maxHeight: "70vh",
                            overflow: "auto",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: 12,
                              marginBottom: 16,
                            }}
                          >
                            <span
                              style={{
                                fontSize: "1.15rem",
                                fontWeight: 800,
                                fontFamily: "var(--font-headline)",
                                color: "var(--on-background)",
                                lineHeight: 1.3,
                              }}
                            >
                              {detailInsight.title}
                            </span>
                            <button
                              onClick={() => setDetailInsight(null)}
                              style={{
                                background: "var(--surface-container-low)",
                                border: "none",
                                borderRadius: 8,
                                width: 28,
                                height: 28,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                color: "var(--on-surface-variant)",
                                flexShrink: 0,
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <p
                            style={{
                              fontSize: "0.9rem",
                              color: "var(--on-surface)",
                              lineHeight: 1.6,
                              margin: 0,
                            }}
                          >
                            {detailInsight.description}
                          </p>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                            (selectedAccount.rationale.length > 350
                              ? "..."
                              : "")
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

                <aside
                  className="warroom-pyramid-sidebar"
                  style={{
                    background: "var(--surface-container-lowest)",
                    border: "1px solid rgba(107,113,148,0.14)",
                    borderRadius: "1rem",
                    padding: "1rem",
                    position: "sticky",
                    top: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    <Brain size={14} color="var(--tertiary)" />
                    <span
                      style={{
                        fontFamily: "var(--font-headline)",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "var(--on-background)",
                      }}
                    >
                      AI Insights Tips
                    </span>
                  </div>

                  <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                    {(() => {
                      const tips = [
                        ...(selectedAccount?.insights?.opportunityFrame || []),
                        ...(selectedAccount?.insights?.keyChallenges || []),
                      ]
                        .filter(
                          (item) =>
                            item &&
                            typeof item.title === "string" &&
                            typeof item.description === "string",
                        )
                        .slice(0, 4);

                      if (tips.length === 0) {
                        return (
                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--on-surface-variant)",
                              lineHeight: 1.45,
                            }}
                          >
                            No tips yet. Run refresh to generate actionable
                            insight cards for this account.
                          </div>
                        );
                      }

                      return tips.map((tip, idx) => (
                        <button
                          key={`${tip.title}-${idx}`}
                          onClick={() =>
                            setDetailInsight({
                              title: tip.title,
                              description: tip.description,
                            })
                          }
                          style={{
                            textAlign: "left",
                            borderRadius: 10,
                            border: "1px solid rgba(107,113,148,0.18)",
                            background: "var(--surface-container-low)",
                            padding: "0.6rem 0.65rem",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              color: "var(--on-background)",
                              marginBottom: 4,
                            }}
                          >
                            {tip.title}
                          </div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--on-surface-variant)",
                              lineHeight: 1.4,
                            }}
                          >
                            {tip.description.slice(0, 74)}
                            {tip.description.length > 74 ? "..." : ""}
                          </div>
                        </button>
                      ));
                    })()}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <LinkedinIcon size={14} color="var(--primary)" />
                    <span
                      style={{
                        fontFamily: "var(--font-headline)",
                        fontWeight: 700,
                        fontSize: "0.88rem",
                        color: "var(--on-background)",
                      }}
                    >
                      Direct Links
                    </span>
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    <button
                      onClick={() => setActiveTab("ai")}
                      style={{
                        borderRadius: 10,
                        border: "none",
                        background:
                          "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                        color: "#fff",
                        padding: "0.55rem 0.75rem",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Open AI Assistant
                    </button>

                    {selectedAccount?.website && (
                      <a
                        href={
                          selectedAccount.website.startsWith("http")
                            ? selectedAccount.website
                            : `https://${selectedAccount.website}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderRadius: 10,
                          textDecoration: "none",
                          border: "1px solid rgba(18,74,241,0.25)",
                          padding: "0.55rem 0.7rem",
                          color: "var(--primary)",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          background: "rgba(18,74,241,0.06)",
                        }}
                      >
                        Company Website
                        <LinkedinIcon size={12} />
                      </a>
                    )}

                    {[
                      ...(selectedAccount?.champion_cxo_candidates || []),
                      ...(selectedAccount?.champion_vp_director_candidates ||
                        []),
                      ...(selectedAccount?.champion_enduser_candidates || []),
                    ]
                      .filter((c) => !!c.linkedin_url)
                      .slice(0, 2)
                      .map((c, idx) => (
                        <a
                          key={`${c.full_name}-${idx}`}
                          href={c.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderRadius: 10,
                            textDecoration: "none",
                            border: "1px solid rgba(107,113,148,0.22)",
                            padding: "0.5rem 0.65rem",
                            color: "var(--on-surface)",
                            fontSize: "0.72rem",
                            background: "var(--surface-container-low)",
                          }}
                        >
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 220,
                            }}
                          >
                            {c.full_name || "Champion profile"}
                          </span>
                          <LinkedinIcon size={12} />
                        </a>
                      ))}
                  </div>
                </aside>
              </div>
            </div>
          )}

          {/* ── Org Chart Tab ───────────────────────────────────── */}
          {activeTab === "orgchart" && (
            <div
              style={{
                height: "calc(100vh - 160px)",
                width: "100%",
                position: "relative",
              }}
            >
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

              {/* Add Person Button */}
              <button
                onClick={() => setShowAddPerson(true)}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0.5rem 1rem",
                  borderRadius: 10,
                  border: "none",
                  background:
                    "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                  color: "#fff",
                  fontFamily: "var(--font-label)",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(135,32,222,0.25)",
                  transition: "all 140ms ease",
                  zIndex: 5,
                }}
              >
                <Plus size={15} />
                Add Person
              </button>

              {/* Add Person Form */}
              <AnimatePresence>
                {showAddPerson && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 50,
                    }}
                    onClick={() => setShowAddPerson(false)}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.2 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        background: "var(--surface-container-lowest)",
                        borderRadius: "1rem",
                        padding: "1.5rem",
                        width: 340,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "var(--font-headline)",
                            fontWeight: 700,
                            fontSize: "1.1rem",
                            color: "var(--on-background)",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <UserPlus size={18} color="var(--tertiary)" />
                          Add Person
                        </div>
                        <button
                          onClick={() => setShowAddPerson(false)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--on-surface-variant)",
                          }}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <div>
                          <label
                            style={{
                              fontSize: "0.75rem",
                              fontFamily: "var(--font-label)",
                              fontWeight: 600,
                              color: "var(--on-surface-variant)",
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={newPerson.name}
                            onChange={(e) =>
                              setNewPerson((p) => ({
                                ...p,
                                name: e.target.value,
                              }))
                            }
                            placeholder="e.g. Jane Smith"
                            style={{
                              width: "100%",
                              padding: "0.5rem 0.75rem",
                              borderRadius: 8,
                              border: "1.5px solid rgba(107,113,148,0.25)",
                              background: "var(--surface-container-low)",
                              color: "var(--on-surface)",
                              fontFamily: "var(--font-body)",
                              fontSize: "0.85rem",
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              fontSize: "0.75rem",
                              fontFamily: "var(--font-label)",
                              fontWeight: 600,
                              color: "var(--on-surface-variant)",
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            Role / Title
                          </label>
                          <input
                            type="text"
                            value={newPerson.role}
                            onChange={(e) =>
                              setNewPerson((p) => ({
                                ...p,
                                role: e.target.value,
                              }))
                            }
                            placeholder="e.g. VP of Engineering"
                            style={{
                              width: "100%",
                              padding: "0.5rem 0.75rem",
                              borderRadius: 8,
                              border: "1.5px solid rgba(107,113,148,0.25)",
                              background: "var(--surface-container-low)",
                              color: "var(--on-surface)",
                              fontFamily: "var(--font-body)",
                              fontSize: "0.85rem",
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>

                        <div>
                          <label
                            style={{
                              fontSize: "0.75rem",
                              fontFamily: "var(--font-label)",
                              fontWeight: 600,
                              color: "var(--on-surface-variant)",
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            Type
                          </label>
                          <select
                            value={newPerson.type}
                            onChange={(e) =>
                              setNewPerson((p) => ({
                                ...p,
                                type: e.target.value,
                              }))
                            }
                            style={{
                              width: "100%",
                              padding: "0.5rem 0.75rem",
                              borderRadius: 8,
                              border: "1.5px solid rgba(107,113,148,0.25)",
                              background: "var(--surface-container-low)",
                              color: "var(--on-surface)",
                              fontFamily: "var(--font-body)",
                              fontSize: "0.85rem",
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          >
                            <option value="unknown">Unknown</option>
                            <option value="economic-buyer">
                              Economic Buyer
                            </option>
                            <option value="champion">Champion</option>
                            <option value="influencer">Influencer</option>
                            <option value="blocker">Blocker</option>
                          </select>
                        </div>

                        <div>
                          <label
                            style={{
                              fontSize: "0.75rem",
                              fontFamily: "var(--font-label)",
                              fontWeight: 600,
                              color: "var(--on-surface-variant)",
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            LinkedIn Profile URL
                          </label>
                          <input
                            type="url"
                            value={newPerson.linkedinUrl}
                            onChange={(e) =>
                              setNewPerson((p) => ({
                                ...p,
                                linkedinUrl: e.target.value,
                              }))
                            }
                            placeholder="https://linkedin.com/in/..."
                            style={{
                              width: "100%",
                              padding: "0.5rem 0.75rem",
                              borderRadius: 8,
                              border: "1.5px solid rgba(107,113,148,0.25)",
                              background: "var(--surface-container-low)",
                              color: "var(--on-surface)",
                              fontFamily: "var(--font-body)",
                              fontSize: "0.85rem",
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>

                        <button
                          onClick={handleAddPerson}
                          disabled={!newPerson.name.trim()}
                          style={{
                            marginTop: 4,
                            padding: "0.6rem 1rem",
                            borderRadius: 10,
                            border: "none",
                            background: newPerson.name.trim()
                              ? "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))"
                              : "rgba(107,113,148,0.2)",
                            color: newPerson.name.trim()
                              ? "#fff"
                              : "var(--on-surface-variant)",
                            fontFamily: "var(--font-label)",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            cursor: newPerson.name.trim()
                              ? "pointer"
                              : "not-allowed",
                            transition: "all 140ms ease",
                          }}
                        >
                          Add to Org Chart
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── AI Assistant Tab ─────────────────────────────────── */}
          {activeTab === "ai" && (
            <div
              className="warroom-content-area"
              style={{ display: "flex", height: "calc(100vh - 160px)" }}
            >
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
                className="warroom-ai-sidebar"
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
                    {(() => {
                      const vpChamps =
                        selectedAccount?.champion_vp_director_candidates || [];
                      const euChamps =
                        selectedAccount?.champion_enduser_candidates || [];
                      const allChamps = [...vpChamps, ...euChamps];
                      if (allChamps.length === 0) {
                        return (
                          <span style={{ color: "var(--on-surface-variant)" }}>
                            No champion data yet — run ChampionBuildingAgent.
                          </span>
                        );
                      }
                      return (
                        <>
                          {allChamps.map((c, i) => (
                            <div
                              key={i}
                              style={{
                                marginBottom: i < allChamps.length - 1 ? 6 : 0,
                              }}
                            >
                              <b>{c.full_name}</b> — {c.title_role}
                              {c.pain_hypothesis && (
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--tertiary)",
                                    fontStyle: "italic",
                                    marginTop: 2,
                                  }}
                                >
                                  Pain: {c.pain_hypothesis}
                                </div>
                              )}
                              {c.engagement_strategy && (
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--primary)",
                                    marginTop: 1,
                                  }}
                                >
                                  Strategy: {c.engagement_strategy}
                                </div>
                              )}
                            </div>
                          ))}
                          {selectedAccount?.primary_champion_recommendation && (
                            <div
                              style={{
                                marginTop: 8,
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "var(--tertiary)",
                              }}
                            >
                              Primary:{" "}
                              {selectedAccount.primary_champion_recommendation}
                            </div>
                          )}
                        </>
                      );
                    })()}
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
                    {(() => {
                      const cxo =
                        selectedAccount?.champion_cxo_candidates || [];
                      if (cxo.length === 0) {
                        return (
                          <>
                            <span
                              style={{ color: "var(--error)", fontWeight: 600 }}
                            >
                              Gap detected.
                            </span>{" "}
                            No CXO-level contacts identified yet. Run
                            ChampionBuildingAgent to scan.
                          </>
                        );
                      }
                      return cxo.map((c, i) => (
                        <div
                          key={i}
                          style={{ marginBottom: i < cxo.length - 1 ? 6 : 0 }}
                        >
                          <b>{c.full_name}</b> — {c.title_role}
                          {c.pain_hypothesis && (
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--tertiary)",
                                fontStyle: "italic",
                                marginTop: 2,
                              }}
                            >
                              Pain: {c.pain_hypothesis}
                            </div>
                          )}
                          {c.engagement_strategy && (
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--primary)",
                                marginTop: 1,
                              }}
                            >
                              Strategy: {c.engagement_strategy}
                            </div>
                          )}
                          {c.confidence && (
                            <span
                              style={{
                                display: "inline-block",
                                marginTop: 3,
                                fontSize: "0.6rem",
                                fontWeight: 600,
                                fontFamily: "var(--font-label)",
                                padding: "0.1rem 0.4rem",
                                borderRadius: 4,
                                background:
                                  c.confidence === "high"
                                    ? "rgba(34,197,94,0.15)"
                                    : c.confidence === "medium"
                                      ? "rgba(245,158,11,0.15)"
                                      : "rgba(239,68,68,0.15)",
                                color:
                                  c.confidence === "high"
                                    ? "#22c55e"
                                    : c.confidence === "medium"
                                      ? "#f59e0b"
                                      : "#ef4444",
                              }}
                            >
                              {c.confidence} confidence
                            </span>
                          )}
                        </div>
                      ));
                    })()}
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
                    {(() => {
                      const acc = selectedAccount;
                      const gaps: string[] = [];
                      const filled: string[] = [];

                      // Champion
                      const hasChampions =
                        (acc?.champion_vp_director_candidates?.length || 0) >
                          0 ||
                        (acc?.champion_enduser_candidates?.length || 0) > 0;
                      if (hasChampions) filled.push("Champion");
                      else gaps.push("Champion");

                      // Economic Buyer
                      const hasEB =
                        (acc?.champion_cxo_candidates?.length || 0) > 0;
                      if (hasEB) filled.push("Economic Buyer");
                      else gaps.push("Economic Buyer");

                      // Identified Pain
                      const hasPain = [
                        ...(acc?.champion_cxo_candidates || []),
                        ...(acc?.champion_vp_director_candidates || []),
                        ...(acc?.champion_enduser_candidates || []),
                      ].some((c) => c.pain_hypothesis);
                      if (hasPain) filled.push("Identified Pain");
                      else gaps.push("Identified Pain");

                      // Competition — check detractors as proxy
                      const hasDetractors = (acc?.detractors?.length || 0) > 0;
                      if (hasDetractors) filled.push("Competition Mapped");
                      else gaps.push("Competition");

                      // Static gaps (not yet tracked)
                      gaps.push("Decision Process", "Paper Process");
                      filled.push("Metrics", "Decision Criteria");

                      if (gaps.length === 0) {
                        return (
                          <span style={{ color: "#22c55e", fontWeight: 600 }}>
                            All MEDDPICC fields covered.
                          </span>
                        );
                      }
                      return (
                        <>
                          {gaps.length} gap{gaps.length !== 1 ? "s" : ""}{" "}
                          identified:{" "}
                          {gaps.map((g, i) => (
                            <span key={g}>
                              <b>{g}</b>
                              {i < gaps.length - 1 ? ", " : ". "}
                            </span>
                          ))}
                          {hasChampions && !hasEB && (
                            <span>
                              Recommend multi-threading through champion to
                              reach Economic Buyer.
                            </span>
                          )}
                          {acc?.champion_overall_readiness && (
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: "0.75rem",
                                color: "var(--tertiary)",
                                fontWeight: 600,
                              }}
                            >
                              Overall readiness:{" "}
                              {acc.champion_overall_readiness}
                            </div>
                          )}
                        </>
                      );
                    })()}
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

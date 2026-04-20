import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, buildAuthHeaders } from "../App";
import {
  Brain,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Check,
  AlertCircle,
  Building2,
  Loader2,
  Play,
  Globe,
  CheckCircle2,
  Link2,
  Zap,
  LayoutTemplate,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

interface AgentMeta {
  id: string;
  label: string;
  description: string;
}

interface TemplateMeta {
  id: string;
  label: string;
  description: string;
}

const ALL_AGENTS: AgentMeta[] = [
  {
    id: "financial-agent",
    label: "Financial Analyst",
    description:
      "Analyses financial health, growth trajectory, and capital allocation",
  },
  {
    id: "tech-stack-agent",
    label: "Tech Stack Analyst",
    description:
      "Maps current technology stack with focus on discovery-layer vendors",
  },
  {
    id: "hiring-agent",
    label: "Hiring Signals",
    description: "Interprets hiring signals to identify strategic intent",
  },
  {
    id: "initiative-agent",
    label: "Initiative Tracker",
    description: "Surfaces active initiatives that create procurement windows",
  },
  {
    id: "category-complexity-agent",
    label: "Catalog Complexity",
    description: "Estimates catalog complexity and discovery challenge",
  },
  {
    id: "competitor-agent",
    label: "Competitive Intelligence",
    description: "Benchmarks discovery and search experience vs competitors",
  },
  {
    id: "sentiment-agent",
    label: "Customer Sentiment",
    description: "Mines app reviews and public feedback for pain signals",
  },
  {
    id: "leadership-agent",
    label: "Leadership Tracker",
    description: "Tracks leadership changes and new executive hires",
  },
  {
    id: "earnings-call-agent",
    label: "Earnings Call Analyst",
    description: "Analyses earnings transcripts for digital investment signals",
  },
  {
    id: "vendor-tenure-agent",
    label: "Vendor Tenure",
    description: "Estimates SaaS contract renewal windows and vendor tenure",
  },
  {
    id: "champion-building-agent",
    label: "Champion Builder",
    description: "Maps multi-tier champion candidates (CXO, VP, IC)",
  },
  {
    id: "risk-flagger-agent",
    label: "Risk Flagger",
    description: "Identifies deal risks, objections, and competitive threats",
  },
];

const ALL_TEMPLATES: TemplateMeta[] = [
  {
    id: "lower-tco",
    label: "Lower TCO / Higher ROI",
    description: "CFO-ready ROI brief",
  },
  {
    id: "customer-experience",
    label: "Customer Experience",
    description: "CX evidence brief",
  },
  {
    id: "business-transformation",
    label: "Business Transformation",
    description: "Urgency/trigger event brief",
  },
  {
    id: "risk-technical",
    label: "Risk & Technical Fit",
    description: "Technical evaluation brief",
  },
  {
    id: "champion-deal",
    label: "Champion & Deal Strategy",
    description: "Deal strategy/champion brief",
  },
];

interface WorkflowConfig {
  slug: string;
  n8n: { webhook_url: string };
  enabled_agents: string[];
  enabled_templates: string[];
  agent_prompt_overrides: Record<string, string>;
  template_injection_overrides: Record<string, Record<string, string>>;
  synthesis_overrides: Record<string, string>;
}

const EMPTY_CONFIG: WorkflowConfig = {
  slug: "",
  n8n: { webhook_url: "" },
  enabled_agents: [],
  enabled_templates: [],
  agent_prompt_overrides: {},
  template_injection_overrides: {},
  synthesis_overrides: {},
};

type Tab = "n8n" | "agents" | "templates";

export function AdminWorkflows() {
  const { user } = useAuth();
  const authHeaders = buildAuthHeaders(user);

  const [tenants, setTenants] = useState<
    { slug: string; displayName: string }[]
  >([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [config, setConfig] = useState<WorkflowConfig>(EMPTY_CONFIG);
  const [savedConfig, setSavedConfig] = useState<WorkflowConfig>(EMPTY_CONFIG);
  const [tab, setTab] = useState<Tab>("n8n");
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Research runner state
  const [researchAccount, setResearchAccount] = useState("");
  const [researchWebsite, setResearchWebsite] = useState("");
  const [researchRunning, setResearchRunning] = useState(false);
  const [researchStatus, setResearchStatus] = useState<
    "idle" | "polling" | "completed"
  >("idle");

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load tenants
  useEffect(() => {
    fetch(`${API_URL}/api/tenants`, { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setTenants(data);
        if (data.length > 0) setSelectedTenant(data[0].slug);
      })
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, []);

  // Load workflow config when tenant changes
  useEffect(() => {
    if (!selectedTenant) return;
    setLoading(true);
    fetch(`${API_URL}/api/tenants/${selectedTenant}/workflow`, {
      headers: authHeaders,
    })
      .then((r) => (r.ok ? r.json() : EMPTY_CONFIG))
      .then((data) => {
        const cfg = { ...EMPTY_CONFIG, ...data, slug: selectedTenant };
        setConfig(cfg);
        setSavedConfig(cfg);
      })
      .catch(() => {
        setConfig({ ...EMPTY_CONFIG, slug: selectedTenant });
        setSavedConfig({ ...EMPTY_CONFIG, slug: selectedTenant });
      })
      .finally(() => setLoading(false));
  }, [selectedTenant]);

  const dirty = JSON.stringify(config) !== JSON.stringify(savedConfig);

  const handleSave = async () => {
    if (!selectedTenant) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${API_URL}/api/tenants/${selectedTenant}/workflow`,
        {
          method: "PUT",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify(config),
        },
      );
      if (res.ok) {
        setSavedConfig(config);
        showToast("Workflow config saved", "success");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to save", "error");
      }
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(savedConfig);
  };

  const toggleAgent = (agentId: string) => {
    setConfig((prev) => {
      const enabled = prev.enabled_agents.includes(agentId);
      return {
        ...prev,
        enabled_agents: enabled
          ? prev.enabled_agents.filter((a) => a !== agentId)
          : [...prev.enabled_agents, agentId],
      };
    });
  };

  const toggleTemplate = (templateId: string) => {
    setConfig((prev) => {
      const enabled = prev.enabled_templates.includes(templateId);
      return {
        ...prev,
        enabled_templates: enabled
          ? prev.enabled_templates.filter((t) => t !== templateId)
          : [...prev.enabled_templates, templateId],
      };
    });
  };

  const updateAgentPrompt = (agentId: string, prompt: string) => {
    setConfig((prev) => ({
      ...prev,
      agent_prompt_overrides: {
        ...prev.agent_prompt_overrides,
        [agentId]: prompt,
      },
    }));
  };

  const clearAgentPrompt = (agentId: string) => {
    setConfig((prev) => {
      const next = { ...prev.agent_prompt_overrides };
      delete next[agentId];
      return { ...prev, agent_prompt_overrides: next };
    });
  };

  const updateSynthesis = (templateId: string, prompt: string) => {
    setConfig((prev) => ({
      ...prev,
      synthesis_overrides: {
        ...prev.synthesis_overrides,
        [templateId]: prompt,
      },
    }));
  };

  const clearSynthesis = (templateId: string) => {
    setConfig((prev) => {
      const next = { ...prev.synthesis_overrides };
      delete next[templateId];
      return { ...prev, synthesis_overrides: next };
    });
  };

  // Research runner
  const handleRunResearch = async () => {
    if (!researchAccount.trim()) {
      showToast("Account name is required", "error");
      return;
    }
    setResearchRunning(true);
    setResearchStatus("idle");
    try {
      const res = await fetch(`${API_URL}/api/research`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          account_name: researchAccount.trim(),
          website_url: researchWebsite.trim() || undefined,
          tenant: selectedTenant || undefined,
        }),
      });
      if (res.ok) {
        showToast(`Research started for "${researchAccount}"`, "success");
        setResearchStatus("polling");
        const pollName = researchAccount.trim();
        const interval = setInterval(async () => {
          try {
            const statusRes = await fetch(
              `${API_URL}/api/research/status/${encodeURIComponent(pollName)}`,
            );
            const statusData = await statusRes.json();
            if (statusData.status === "completed") {
              clearInterval(interval);
              setResearchStatus("completed");
              setResearchRunning(false);
              showToast(`Research for "${pollName}" completed`, "success");
            }
          } catch {
            /* ignore */
          }
        }, 10000);
        setTimeout(() => {
          clearInterval(interval);
          setResearchRunning(false);
        }, 300000);
      } else {
        showToast("Failed to start research", "error");
        setResearchRunning(false);
      }
    } catch {
      showToast("Failed to start research", "error");
      setResearchRunning(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(167,176,222,0.15)",
    background: "var(--surface-container-low)",
    color: "var(--on-surface)",
    fontSize: "0.82rem",
    fontFamily: "var(--font-body)",
    outline: "none",
  };

  const enabledAgentCount = config.enabled_agents.length;
  const overrideCount = Object.keys(config.agent_prompt_overrides).filter((k) =>
    config.agent_prompt_overrides[k]?.trim(),
  ).length;

  return (
    <div style={{ padding: "2rem", maxWidth: 1100, margin: "0 auto" }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed",
              top: 24,
              right: 24,
              zIndex: 999,
              padding: "12px 20px",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.82rem",
              fontWeight: 600,
              fontFamily: "var(--font-label)",
              background:
                toast.type === "success"
                  ? "rgba(34,197,94,0.15)"
                  : "rgba(211,47,47,0.15)",
              color: toast.type === "success" ? "#22c55e" : "var(--error)",
              border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(211,47,47,0.3)"}`,
            }}
          >
            {toast.type === "success" ? (
              <Check size={14} />
            ) : (
              <AlertCircle size={14} />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ marginBottom: "1.25rem" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 800,
                fontSize: "1.5rem",
                color: "var(--on-background)",
                marginBottom: 4,
              }}
            >
              Workflow Configuration
            </h1>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--on-surface-variant)",
                fontFamily: "var(--font-body)",
              }}
            >
              Configure n8n webhooks, agents, and prompt overrides per tenant
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {dirty && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleReset}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--outline-variant)",
                  background: "var(--surface-container-lowest)",
                  color: "var(--on-surface)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                }}
              >
                <RotateCcw size={14} /> Reset
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={!dirty || saving}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1.2rem",
                borderRadius: "0.5rem",
                border: "none",
                background: dirty
                  ? "var(--primary)"
                  : "var(--surface-container-low)",
                color: dirty ? "#fff" : "var(--on-surface-variant)",
                cursor: dirty ? "pointer" : "default",
                fontSize: "0.8rem",
                fontFamily: "var(--font-label)",
                fontWeight: 600,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <Loader2
                  size={14}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Save size={14} />
              )}
              Save Changes
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Tenant Selector */}
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
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Building2 size={16} color="var(--primary)" />
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              fontFamily: "var(--font-label)",
              color: "var(--on-surface)",
            }}
          >
            Tenant:
          </span>
        </div>
        <select
          value={selectedTenant}
          onChange={(e) => setSelectedTenant(e.target.value)}
          style={{ ...inputStyle, maxWidth: 280, cursor: "pointer" }}
        >
          {tenants.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.displayName} ({t.slug})
            </option>
          ))}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {enabledAgentCount > 0 && (
            <span
              style={{
                fontSize: "0.65rem",
                borderRadius: 9999,
                padding: "0.15rem 0.6rem",
                fontWeight: 700,
                fontFamily: "var(--font-label)",
                background:
                  "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Sparkles size={10} />
              {enabledAgentCount} agents · {overrideCount} overrides
            </span>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          marginBottom: "1.25rem",
          background: "var(--surface-container-low)",
          borderRadius: "0.6rem",
          padding: "0.2rem",
          width: "fit-content",
        }}
      >
        {[
          { key: "n8n" as Tab, label: "n8n & Research", icon: Link2 },
          { key: "agents" as Tab, label: "Agents", icon: Brain },
          { key: "templates" as Tab, label: "Templates", icon: LayoutTemplate },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.45rem 1rem",
                borderRadius: "0.4rem",
                border: "none",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontFamily: "var(--font-label)",
                fontWeight: 600,
                background: active
                  ? "var(--surface-container-lowest)"
                  : "transparent",
                color: active
                  ? "var(--on-surface)"
                  : "var(--on-surface-variant)",
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s",
              }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "30vh",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "3px solid var(--surface-container)",
              borderTopColor: "var(--primary)",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      ) : (
        <>
          {/* ── n8n & Research Tab ── */}
          {tab === "n8n" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {/* n8n Webhook URL */}
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
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "var(--on-background)",
                  }}
                >
                  <Zap size={18} color="var(--tertiary)" />
                  n8n Webhook Configuration
                </div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--on-surface-variant)",
                    fontFamily: "var(--font-body)",
                    lineHeight: 1.5,
                    marginBottom: 14,
                  }}
                >
                  Each tenant can have its own n8n instance with a dedicated
                  webhook URL. When research is triggered for this tenant, the
                  request will be sent to this URL instead of the default. Leave
                  empty to use the platform default.
                </p>
                <label
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "var(--on-surface-variant)",
                    fontFamily: "var(--font-label)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  Webhook URL (HTTPS required)
                </label>
                <div style={{ position: "relative" }}>
                  <Link2
                    size={14}
                    color="var(--on-surface-variant)"
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <input
                    value={config.n8n.webhook_url}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        n8n: { ...prev.n8n, webhook_url: e.target.value },
                      }))
                    }
                    placeholder="https://your-instance.app.n8n.cloud/webhook/..."
                    style={{ ...inputStyle, paddingLeft: 32 }}
                  />
                </div>
                {config.n8n.webhook_url &&
                  !config.n8n.webhook_url.startsWith("https://") && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: "0.72rem",
                        color: "var(--error)",
                        fontFamily: "var(--font-label)",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <AlertCircle size={12} /> URL must start with https://
                    </div>
                  )}
              </motion.div>

              {/* Run Research */}
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
                    gap: 8,
                    marginBottom: 14,
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "var(--on-background)",
                  }}
                >
                  <Play size={18} color="var(--primary)" />
                  Run Initial Research
                </div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--on-surface-variant)",
                    fontFamily: "var(--font-body)",
                    lineHeight: 1.5,
                    marginBottom: 14,
                  }}
                >
                  Trigger the n8n deep research workflow for a specific account.
                  Uses this tenant's webhook URL if configured.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "var(--on-surface-variant)",
                        fontFamily: "var(--font-label)",
                        marginBottom: 4,
                        display: "block",
                      }}
                    >
                      Account Name *
                    </label>
                    <input
                      value={researchAccount}
                      onChange={(e) => setResearchAccount(e.target.value)}
                      placeholder="e.g. Kasten Finland"
                      style={inputStyle}
                      disabled={researchRunning}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "var(--on-surface-variant)",
                        fontFamily: "var(--font-label)",
                        marginBottom: 4,
                        display: "block",
                      }}
                    >
                      Website URL
                    </label>
                    <div style={{ position: "relative" }}>
                      <Globe
                        size={14}
                        color="var(--on-surface-variant)"
                        style={{
                          position: "absolute",
                          left: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                      />
                      <input
                        value={researchWebsite}
                        onChange={(e) => setResearchWebsite(e.target.value)}
                        placeholder="https://www.example.com"
                        style={{ ...inputStyle, paddingLeft: 32 }}
                        disabled={researchRunning}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleRunResearch}
                    disabled={researchRunning || !researchAccount.trim()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 20px",
                      borderRadius: 10,
                      border: "none",
                      background: researchRunning
                        ? "rgba(167,176,222,0.1)"
                        : researchStatus === "completed"
                          ? "rgba(34,197,94,0.15)"
                          : "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                      color: researchRunning
                        ? "var(--on-surface-variant)"
                        : researchStatus === "completed"
                          ? "#22c55e"
                          : "#fff",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-label)",
                      cursor:
                        researchRunning || !researchAccount.trim()
                          ? "default"
                          : "pointer",
                      opacity: !researchAccount.trim() ? 0.5 : 1,
                      whiteSpace: "nowrap",
                      height: 42,
                    }}
                  >
                    {researchRunning ? (
                      <Loader2
                        size={14}
                        style={{ animation: "spin 0.8s linear infinite" }}
                      />
                    ) : researchStatus === "completed" ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <Play size={14} />
                    )}
                    {researchRunning
                      ? researchStatus === "polling"
                        ? "Researching..."
                        : "Starting..."
                      : researchStatus === "completed"
                        ? "Completed"
                        : "Run Research"}
                  </button>
                </div>
                {researchStatus === "polling" && (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: "0.72rem",
                      color: "var(--on-surface-variant)",
                      fontFamily: "var(--font-body)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Loader2
                      size={12}
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
                    n8n workflow is processing — polling for results every
                    10s...
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* ── Agents Tab ── */}
          {tab === "agents" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {/* Info Banner */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  borderRadius: "1rem",
                  padding: "1rem 1.25rem",
                  background:
                    "linear-gradient(135deg, rgba(135,32,222,0.06), rgba(78,69,228,0.06))",
                  border: "1px solid rgba(135,32,222,0.12)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <Brain
                  size={18}
                  color="var(--tertiary)"
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      fontFamily: "var(--font-label)",
                      color: "var(--on-surface)",
                      marginBottom: 4,
                    }}
                  >
                    Agent Configuration
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--on-surface-variant)",
                      fontFamily: "var(--font-body)",
                      lineHeight: 1.5,
                    }}
                  >
                    Toggle agents on/off for this tenant. Enabled agents will
                    run when the swarm is executed. Expand an agent to provide a
                    custom prompt that <strong>overrides</strong> the system
                    default for this tenant only.
                  </div>
                </div>
              </motion.div>

              {ALL_AGENTS.map((agent, i) => {
                const isEnabled = config.enabled_agents.includes(agent.id);
                const hasOverride =
                  !!config.agent_prompt_overrides[agent.id]?.trim();
                const isExpanded = expandedAgent === agent.id;

                return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.04 + i * 0.03 }}
                    className="luminous-shadow"
                    style={{
                      borderRadius: "1rem",
                      backgroundColor: "var(--surface-container-lowest)",
                      overflow: "hidden",
                      border: hasOverride
                        ? "1px solid rgba(135,32,222,0.15)"
                        : "1px solid transparent",
                      opacity: isEnabled ? 1 : 0.6,
                      transition: "opacity 0.2s",
                    }}
                  >
                    <div
                      style={{
                        padding: "1rem 1.25rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: isExpanded
                          ? "var(--surface-container-low)"
                          : "transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Toggle */}
                      <button
                        onClick={() => toggleAgent(agent.id)}
                        style={{
                          width: 36,
                          height: 20,
                          borderRadius: 9999,
                          border: "none",
                          cursor: "pointer",
                          position: "relative",
                          transition: "background 0.2s",
                          background: isEnabled
                            ? "var(--primary)"
                            : "var(--surface-container)",
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
                            left: isEnabled ? 19 : 3,
                            transition: "left 0.2s",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          }}
                        />
                      </button>

                      {/* Agent info */}
                      <div
                        onClick={() =>
                          setExpandedAgent(isExpanded ? null : agent.id)
                        }
                        style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                      >
                        <div
                          style={{
                            fontFamily: "var(--font-headline)",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: "var(--on-background)",
                          }}
                        >
                          {agent.label}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--on-surface-variant)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          {agent.description}
                        </div>
                      </div>

                      {hasOverride && (
                        <span
                          style={{
                            fontSize: "0.6rem",
                            borderRadius: 9999,
                            padding: "0.1rem 0.5rem",
                            fontWeight: 700,
                            fontFamily: "var(--font-label)",
                            background: "rgba(135,32,222,0.1)",
                            color: "var(--tertiary)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Custom Prompt
                        </span>
                      )}

                      <div
                        onClick={() =>
                          setExpandedAgent(isExpanded ? null : agent.id)
                        }
                        style={{ cursor: "pointer", flexShrink: 0 }}
                      >
                        {isExpanded ? (
                          <ChevronDown
                            size={16}
                            color="var(--on-surface-variant)"
                          />
                        ) : (
                          <ChevronRight
                            size={16}
                            color="var(--on-surface-variant)"
                          />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={{ padding: "0 1.25rem 1.25rem" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 8,
                              }}
                            >
                              <label
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  color: "var(--on-surface-variant)",
                                  fontFamily: "var(--font-label)",
                                }}
                              >
                                Custom Prompt Override
                              </label>
                              {hasOverride && (
                                <button
                                  onClick={() => clearAgentPrompt(agent.id)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    border: "none",
                                    background: "rgba(211,47,47,0.08)",
                                    color: "var(--error)",
                                    fontSize: "0.68rem",
                                    fontWeight: 600,
                                    fontFamily: "var(--font-label)",
                                    cursor: "pointer",
                                  }}
                                >
                                  <RotateCcw size={10} /> Reset to Default
                                </button>
                              )}
                            </div>
                            <textarea
                              value={
                                config.agent_prompt_overrides[agent.id] || ""
                              }
                              onChange={(e) =>
                                updateAgentPrompt(agent.id, e.target.value)
                              }
                              placeholder="Leave empty to use the system default prompt..."
                              rows={10}
                              style={{
                                ...inputStyle,
                                resize: "vertical",
                                minHeight: 160,
                                lineHeight: 1.6,
                                fontFamily: "monospace",
                                fontSize: "0.75rem",
                              }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ── Templates Tab ── */}
          {tab === "templates" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  borderRadius: "1rem",
                  padding: "1rem 1.25rem",
                  background:
                    "linear-gradient(135deg, rgba(135,32,222,0.06), rgba(78,69,228,0.06))",
                  border: "1px solid rgba(135,32,222,0.12)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <LayoutTemplate
                  size={18}
                  color="var(--tertiary)"
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      fontFamily: "var(--font-label)",
                      color: "var(--on-surface)",
                      marginBottom: 4,
                    }}
                  >
                    Analysis Templates
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--on-surface-variant)",
                      fontFamily: "var(--font-body)",
                      lineHeight: 1.5,
                    }}
                  >
                    Toggle which analysis templates are available for this
                    tenant. Expand a template to override the synthesis prompt
                    that Agent Zero uses to generate the final buying signal
                    brief.
                  </div>
                </div>
              </motion.div>

              {ALL_TEMPLATES.map((tmpl, i) => {
                const isEnabled = config.enabled_templates.includes(tmpl.id);
                const hasOverride =
                  !!config.synthesis_overrides[tmpl.id]?.trim();
                const isExpanded = expandedTemplate === tmpl.id;

                return (
                  <motion.div
                    key={tmpl.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.04 + i * 0.03 }}
                    className="luminous-shadow"
                    style={{
                      borderRadius: "1rem",
                      backgroundColor: "var(--surface-container-lowest)",
                      overflow: "hidden",
                      border: hasOverride
                        ? "1px solid rgba(135,32,222,0.15)"
                        : "1px solid transparent",
                      opacity: isEnabled ? 1 : 0.6,
                      transition: "opacity 0.2s",
                    }}
                  >
                    <div
                      style={{
                        padding: "1rem 1.25rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: isExpanded
                          ? "var(--surface-container-low)"
                          : "transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      <button
                        onClick={() => toggleTemplate(tmpl.id)}
                        style={{
                          width: 36,
                          height: 20,
                          borderRadius: 9999,
                          border: "none",
                          cursor: "pointer",
                          position: "relative",
                          transition: "background 0.2s",
                          background: isEnabled
                            ? "var(--primary)"
                            : "var(--surface-container)",
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
                            left: isEnabled ? 19 : 3,
                            transition: "left 0.2s",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          }}
                        />
                      </button>
                      <div
                        onClick={() =>
                          setExpandedTemplate(isExpanded ? null : tmpl.id)
                        }
                        style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                      >
                        <div
                          style={{
                            fontFamily: "var(--font-headline)",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: "var(--on-background)",
                          }}
                        >
                          {tmpl.label}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--on-surface-variant)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          {tmpl.description}
                        </div>
                      </div>
                      {hasOverride && (
                        <span
                          style={{
                            fontSize: "0.6rem",
                            borderRadius: 9999,
                            padding: "0.1rem 0.5rem",
                            fontWeight: 700,
                            fontFamily: "var(--font-label)",
                            background: "rgba(135,32,222,0.1)",
                            color: "var(--tertiary)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Custom Synthesis
                        </span>
                      )}
                      <div
                        onClick={() =>
                          setExpandedTemplate(isExpanded ? null : tmpl.id)
                        }
                        style={{ cursor: "pointer", flexShrink: 0 }}
                      >
                        {isExpanded ? (
                          <ChevronDown
                            size={16}
                            color="var(--on-surface-variant)"
                          />
                        ) : (
                          <ChevronRight
                            size={16}
                            color="var(--on-surface-variant)"
                          />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={{ padding: "0 1.25rem 1.25rem" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 8,
                              }}
                            >
                              <label
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  color: "var(--on-surface-variant)",
                                  fontFamily: "var(--font-label)",
                                }}
                              >
                                Custom Synthesis Prompt Override
                              </label>
                              {hasOverride && (
                                <button
                                  onClick={() => clearSynthesis(tmpl.id)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    border: "none",
                                    background: "rgba(211,47,47,0.08)",
                                    color: "var(--error)",
                                    fontSize: "0.68rem",
                                    fontWeight: 600,
                                    fontFamily: "var(--font-label)",
                                    cursor: "pointer",
                                  }}
                                >
                                  <RotateCcw size={10} /> Reset to Default
                                </button>
                              )}
                            </div>
                            <textarea
                              value={config.synthesis_overrides[tmpl.id] || ""}
                              onChange={(e) =>
                                updateSynthesis(tmpl.id, e.target.value)
                              }
                              placeholder="Leave empty to use the system default synthesis prompt..."
                              rows={10}
                              style={{
                                ...inputStyle,
                                resize: "vertical",
                                minHeight: 160,
                                lineHeight: 1.6,
                                fontFamily: "monospace",
                                fontSize: "0.75rem",
                              }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

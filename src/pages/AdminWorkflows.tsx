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
} from "lucide-react";

interface AgentPrompt {
  agentId: string;
  label: string;
  description: string;
  prompt: string;
  isCustomized: boolean;
}

const AGENT_DEFAULTS: { id: string; label: string; description: string }[] = [
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
];

export function AdminWorkflows() {
  const { user } = useAuth();
  const authHeaders = buildAuthHeaders(user);
  const API_URL = import.meta.env.VITE_API_URL || "";

  const [tenants, setTenants] = useState<
    { slug: string; displayName: string }[]
  >([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [prompts, setPrompts] = useState<AgentPrompt[]>([]);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

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

  // Load prompts when tenant changes
  useEffect(() => {
    if (!selectedTenant) return;
    setLoading(true);
    fetch(`${API_URL}/api/tenants/${selectedTenant}/prompts`, {
      headers: authHeaders,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.agents) {
          setPrompts(
            AGENT_DEFAULTS.map((a) => {
              const saved = data.agents.find(
                (s: { agentId: string; prompt: string }) => s.agentId === a.id,
              );
              return {
                agentId: a.id,
                label: a.label,
                description: a.description,
                prompt: saved?.prompt || "",
                isCustomized: !!saved?.prompt,
              };
            }),
          );
        } else {
          // No saved prompts — show defaults as empty
          setPrompts(
            AGENT_DEFAULTS.map((a) => ({
              agentId: a.id,
              label: a.label,
              description: a.description,
              prompt: "",
              isCustomized: false,
            })),
          );
        }
        setDirty(false);
      })
      .catch(() => {
        setPrompts(
          AGENT_DEFAULTS.map((a) => ({
            agentId: a.id,
            label: a.label,
            description: a.description,
            prompt: "",
            isCustomized: false,
          })),
        );
      })
      .finally(() => setLoading(false));
  }, [selectedTenant]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePromptChange = (agentId: string, value: string) => {
    setPrompts((prev) =>
      prev.map((p) =>
        p.agentId === agentId
          ? { ...p, prompt: value, isCustomized: value.trim().length > 0 }
          : p,
      ),
    );
    setDirty(true);
  };

  const handleResetAgent = (agentId: string) => {
    setPrompts((prev) =>
      prev.map((p) =>
        p.agentId === agentId ? { ...p, prompt: "", isCustomized: false } : p,
      ),
    );
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedTenant) return;
    setSaving(true);
    try {
      const payload = {
        agents: prompts
          .filter((p) => p.prompt.trim())
          .map((p) => ({ agentId: p.agentId, prompt: p.prompt })),
      };
      const res = await fetch(
        `${API_URL}/api/tenants/${selectedTenant}/prompts`,
        {
          method: "PUT",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        showToast("Prompts saved successfully", "success");
        setDirty(false);
      } else {
        showToast("Failed to save prompts", "error");
      }
    } catch {
      showToast("Failed to save prompts", "error");
    } finally {
      setSaving(false);
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

  const customizedCount = prompts.filter((p) => p.isCustomized).length;

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

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ marginBottom: "1.5rem" }}
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
              Research Workflows
            </h1>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--on-surface-variant)",
                fontFamily: "var(--font-body)",
              }}
            >
              Customize agent prompts per tenant for the deep research workflow
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background:
                dirty && !saving ? "var(--primary)" : "rgba(167,176,222,0.1)",
              color: dirty && !saving ? "#fff" : "var(--on-surface-variant)",
              fontSize: "0.82rem",
              fontWeight: 600,
              fontFamily: "var(--font-label)",
              cursor: dirty && !saving ? "pointer" : "default",
              opacity: dirty && !saving ? 1 : 0.6,
            }}
          >
            {saving ? (
              <Loader2
                size={14}
                style={{ animation: "spin 0.8s linear infinite" }}
              />
            ) : (
              <Save size={14} />
            )}
            Save Changes
          </button>
        </div>
      </motion.div>

      {/* Tenant Selector */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.07 }}
        style={{ marginBottom: "1.5rem" }}
      >
        <div
          className="luminous-shadow"
          style={{
            borderRadius: "1rem",
            padding: "1.25rem",
            backgroundColor: "var(--surface-container-lowest)",
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
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
            style={{
              ...inputStyle,
              maxWidth: 280,
              cursor: "pointer",
            }}
          >
            {tenants.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.displayName} ({t.slug})
              </option>
            ))}
          </select>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
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
              {customizedCount} / {AGENT_DEFAULTS.length} customized
            </span>
          </div>
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.14 }}
        style={{
          marginBottom: "1.5rem",
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
            How prompt customization works
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--on-surface-variant)",
              fontFamily: "var(--font-body)",
              lineHeight: 1.5,
            }}
          >
            Each agent has a base prompt built into the system. When you add a
            custom prompt here, it <strong>overrides</strong> the default for
            this tenant only. Leave blank to use the system default. Custom
            prompts are used when the n8n deep research workflow runs for
            accounts in this tenant.
          </div>
        </div>
      </motion.div>

      {/* Agent Prompt Cards */}
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {prompts.map((agent, i) => {
            const isExpanded = expandedAgent === agent.agentId;
            return (
              <motion.div
                key={agent.agentId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.21 + i * 0.04 }}
                className="luminous-shadow"
                style={{
                  borderRadius: "1rem",
                  backgroundColor: "var(--surface-container-lowest)",
                  overflow: "hidden",
                  border: agent.isCustomized
                    ? "1px solid rgba(135,32,222,0.15)"
                    : "1px solid transparent",
                }}
              >
                {/* Agent Header */}
                <div
                  onClick={() =>
                    setExpandedAgent(isExpanded ? null : agent.agentId)
                  }
                  style={{
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    background: isExpanded
                      ? "var(--surface-container-low)"
                      : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: agent.isCustomized
                        ? "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))"
                        : "rgba(167,176,222,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Brain
                      size={15}
                      color={
                        agent.isCustomized
                          ? "#fff"
                          : "var(--on-surface-variant)"
                      }
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
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
                  {agent.isCustomized && (
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
                      Custom
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown size={16} color="var(--on-surface-variant)" />
                  ) : (
                    <ChevronRight size={16} color="var(--on-surface-variant)" />
                  )}
                </div>

                {/* Expanded Editor */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        style={{
                          padding: "0 1.25rem 1.25rem",
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
                          {agent.isCustomized && (
                            <button
                              onClick={() => handleResetAgent(agent.agentId)}
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
                          value={agent.prompt}
                          onChange={(e) =>
                            handlePromptChange(agent.agentId, e.target.value)
                          }
                          placeholder="Leave empty to use the system default prompt. Enter a custom prompt to override for this tenant..."
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
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: "0.68rem",
                            color: "var(--on-surface-variant)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          This prompt will be sent to the{" "}
                          <strong>{agent.label}</strong> when running deep
                          research for accounts in tenant{" "}
                          <strong>{selectedTenant}</strong>.
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

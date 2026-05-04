import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, buildAuthHeaders } from "../App";
import {
  Building2,
  Plus,
  Search,
  MoreVertical,
  Users,
  DollarSign,
  Package,
  X,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

const ALL_MODULES = [
  "Territory Overview",
  "Research Hub",
  "War Room",
  "Agent Swarm",
  "Analytics & Automation",
] as const;

const PLAN_DEFAULT_MODULES: Record<Plan, string[]> = {
  Free: ["Territory Overview"],
  Starter: ["Territory Overview", "Research Hub"],
  Pro: [
    "Territory Overview",
    "Research Hub",
    "War Room",
    "Analytics & Automation",
  ],
  Enterprise: [
    "Territory Overview",
    "Research Hub",
    "War Room",
    "Agent Swarm",
    "Analytics & Automation",
  ],
};

const PLANS = ["Free", "Starter", "Pro", "Enterprise"] as const;
type Plan = (typeof PLANS)[number];

const PLAN_COLORS: Record<Plan, { bg: string; color: string }> = {
  Free: { bg: "rgba(167,176,222,0.1)", color: "var(--on-surface-variant)" },
  Starter: { bg: "rgba(34,197,94,0.12)", color: "#22c55e" },
  Pro: { bg: "rgba(78,69,228,0.1)", color: "var(--secondary-brand)" },
  Enterprise: { bg: "rgba(135,32,222,0.1)", color: "var(--tertiary)" },
};

const MOCK_ENRICHMENT: Record<
  string,
  {
    plan: Plan;
    mrr: number;
    activeUsers: number;
    totalUsers: number;
    activeModules: string[];
    billingEmail: string;
  }
> = {
  PG_Machine: {
    plan: "Enterprise",
    mrr: 4900,
    activeUsers: 12,
    totalUsers: 15,
    activeModules: ["Research Hub", "War Room", "Agent Swarm"],
    billingEmail: "billing@pgmachine.com",
  },
  pg_identity: {
    plan: "Starter",
    mrr: 1200,
    activeUsers: 3,
    totalUsers: 5,
    activeModules: ["Research Hub"],
    billingEmail: "finance@pgidentity.com",
  },
};

interface Tenant {
  _id: string;
  slug: string;
  displayName: string;
  status: string;
  createdAt: string;
}

export function AdminCompanies() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const authHeaders = buildAuthHeaders(user);
  const API_URL = import.meta.env.VITE_API_URL || "";
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    slug: "",
    plan: "Starter" as Plan,
    billingEmail: "",
    modules: [...PLAN_DEFAULT_MODULES["Starter"]] as string[],
  });
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/tenants`, { headers: authHeaders })
      .then((r) => (r.ok ? r.json() : []))
      .then(setTenants)
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tenants.filter(
    (t) =>
      t.displayName.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()),
  );

  const [provisioning, setProvisioning] = useState(false);

  const handleAdd = async () => {
    if (!newCompany.name || !newCompany.slug) {
      setToast({ msg: "Name and slug are required", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setProvisioning(true);
    try {
      const res = await fetch(`${API_URL}/api/tenants/provision`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: newCompany.slug,
          displayName: newCompany.name,
          adminEmail: newCompany.billingEmail || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "Provisioning failed" }));
        setToast({ msg: err.error || "Provisioning failed", type: "error" });
        setTimeout(() => setToast(null), 3000);
        return;
      }
      setTenants((prev) => [
        ...prev,
        {
          _id: crypto.randomUUID(),
          slug: newCompany.slug,
          displayName: newCompany.name,
          status: "active",
          createdAt: new Date().toISOString(),
        },
      ]);
      MOCK_ENRICHMENT[newCompany.slug] = {
        plan: newCompany.plan,
        mrr: 0,
        activeUsers: 0,
        totalUsers: 0,
        activeModules: newCompany.modules,
        billingEmail: newCompany.billingEmail,
      };
      setShowAdd(false);
      setNewCompany({
        name: "",
        slug: "",
        plan: "Starter",
        billingEmail: "",
        modules: [...PLAN_DEFAULT_MODULES["Starter"]],
      });
      setToast({
        msg: `${newCompany.name} provisioned successfully`,
        type: "success",
      });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast({ msg: "Failed to provision company", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setProvisioning(false);
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

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
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
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 1400, margin: "0 auto" }}>
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
              Companies
            </h1>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--on-surface-variant)",
                fontFamily: "var(--font-body)",
              }}
            >
              {tenants.length} companies registered
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background: "var(--primary)",
              color: "#fff",
              fontSize: "0.82rem",
              fontWeight: 600,
              fontFamily: "var(--font-label)",
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Add Company
          </button>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.07 }}
        style={{ marginBottom: "1rem" }}
      >
        <div style={{ position: "relative", maxWidth: 400 }}>
          <Search
            size={16}
            color="var(--on-surface-variant)"
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies..."
            style={{ ...inputStyle, paddingLeft: 36 }}
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.14 }}
        className="luminous-shadow"
        style={{
          borderRadius: "1rem",
          backgroundColor: "var(--surface-container-lowest)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8rem",
              fontFamily: "var(--font-body)",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(167,176,222,0.08)" }}>
                {[
                  "Company",
                  "Slug",
                  "Plan",
                  "Status",
                  "MRR",
                  "Users",
                  "Active Modules",
                  "Created",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 14px",
                      textAlign: "left",
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      color: "var(--on-surface-variant)",
                      fontFamily: "var(--font-label)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tenant, i) => {
                const extra = MOCK_ENRICHMENT[tenant.slug] || {
                  plan: "Free" as Plan,
                  mrr: 0,
                  activeUsers: 0,
                  totalUsers: 0,
                  activeModules: [],
                  billingEmail: "",
                };
                const pc = PLAN_COLORS[extra.plan];
                return (
                  <motion.tr
                    key={tenant._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    style={{
                      borderBottom: "1px solid rgba(167,176,222,0.04)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--surface-container-low)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td
                      style={{
                        padding: "12px 14px",
                        fontWeight: 600,
                        color: "var(--on-surface)",
                        fontFamily: "var(--font-headline)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "rgba(18,74,241,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Building2 size={15} color="var(--primary)" />
                        </div>
                        {tenant.displayName}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "var(--on-surface-variant)",
                        fontFamily: "monospace",
                        fontSize: "0.72rem",
                      }}
                    >
                      {tenant.slug}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          borderRadius: 9999,
                          padding: "0.15rem 0.6rem",
                          fontWeight: 700,
                          fontFamily: "var(--font-label)",
                          background: pc.bg,
                          color: pc.color,
                        }}
                      >
                        {extra.plan}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          borderRadius: 9999,
                          padding: "0.15rem 0.6rem",
                          fontWeight: 700,
                          fontFamily: "var(--font-label)",
                          background:
                            tenant.status === "active"
                              ? "rgba(34,197,94,0.12)"
                              : "rgba(245,158,11,0.12)",
                          color:
                            tenant.status === "active" ? "#22c55e" : "#f59e0b",
                        }}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        fontWeight: 700,
                        color: "var(--on-surface)",
                        fontFamily: "var(--font-headline)",
                      }}
                    >
                      €{extra.mrr.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "var(--on-surface)",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {extra.activeUsers}
                      </span>
                      <span
                        style={{
                          color: "var(--on-surface-variant)",
                          fontSize: "0.7rem",
                        }}
                      >
                        {" "}
                        / {extra.totalUsers}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div
                        style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                      >
                        {extra.activeModules.map((m) => (
                          <span
                            key={m}
                            style={{
                              fontSize: "0.6rem",
                              borderRadius: 9999,
                              padding: "0.1rem 0.5rem",
                              fontWeight: 600,
                              fontFamily: "var(--font-label)",
                              background: "rgba(78,69,228,0.1)",
                              color: "var(--secondary-brand)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "var(--on-surface-variant)",
                        fontSize: "0.72rem",
                      }}
                    >
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <button
                        onClick={() =>
                          navigate(`/admin/companies/${tenant.slug}`)
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 4,
                        }}
                      >
                        <MoreVertical
                          size={14}
                          color="var(--on-surface-variant)"
                        />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Company Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 480,
                borderRadius: "1rem",
                padding: "1.5rem",
                backgroundColor: "var(--surface-container-lowest)",
                border: "1px solid rgba(167,176,222,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <h2
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: "var(--on-background)",
                  }}
                >
                  Add Company
                </h2>
                <button
                  onClick={() => setShowAdd(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <X size={18} color="var(--on-surface-variant)" />
                </button>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div>
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
                    Company Name
                  </label>
                  <input
                    value={newCompany.name}
                    onChange={(e) =>
                      setNewCompany((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Acme Corp"
                    style={inputStyle}
                  />
                </div>
                <div>
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
                    Slug
                  </label>
                  <input
                    value={newCompany.slug}
                    onChange={(e) =>
                      setNewCompany((p) => ({
                        ...p,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_-]/g, ""),
                      }))
                    }
                    placeholder="acme_corp"
                    style={{ ...inputStyle, fontFamily: "monospace" }}
                  />
                </div>
                <div>
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
                    Subscription Plan
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 6,
                    }}
                  >
                    {PLANS.map((p) => {
                      const pc = PLAN_COLORS[p];
                      const isSelected = newCompany.plan === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() =>
                            setNewCompany((prev) => ({
                              ...prev,
                              plan: p,
                              modules: [...PLAN_DEFAULT_MODULES[p]],
                            }))
                          }
                          style={{
                            padding: "8px 0",
                            borderRadius: 8,
                            border: isSelected
                              ? `2px solid ${pc.color}`
                              : "2px solid rgba(167,176,222,0.1)",
                            background: isSelected ? pc.bg : "transparent",
                            color: isSelected
                              ? pc.color
                              : "var(--on-surface-variant)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            fontFamily: "var(--font-label)",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "var(--on-surface-variant)",
                      fontFamily: "var(--font-label)",
                      marginBottom: 6,
                      display: "block",
                    }}
                  >
                    Active Modules
                  </label>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    {ALL_MODULES.map((mod) => {
                      const checked = newCompany.modules.includes(mod);
                      return (
                        <label
                          key={mod}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 10px",
                            borderRadius: 8,
                            background: checked
                              ? "rgba(78,69,228,0.06)"
                              : "transparent",
                            cursor: "pointer",
                            fontSize: "0.78rem",
                            fontFamily: "var(--font-body)",
                            color: checked
                              ? "var(--on-surface)"
                              : "var(--on-surface-variant)",
                            transition: "background 0.15s",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setNewCompany((prev) => ({
                                ...prev,
                                modules: checked
                                  ? prev.modules.filter((m) => m !== mod)
                                  : [...prev.modules, mod],
                              }))
                            }
                            style={{
                              accentColor: "var(--secondary-brand)",
                              width: 14,
                              height: 14,
                            }}
                          />
                          {mod}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
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
                    Billing Email
                  </label>
                  <input
                    value={newCompany.billingEmail}
                    onChange={(e) =>
                      setNewCompany((p) => ({
                        ...p,
                        billingEmail: e.target.value,
                      }))
                    }
                    placeholder="billing@company.com"
                    style={inputStyle}
                  />
                </div>
                <button
                  onClick={handleAdd}
                  disabled={provisioning}
                  style={{
                    marginTop: 4,
                    padding: "12px 0",
                    borderRadius: 10,
                    border: "none",
                    background: provisioning
                      ? "rgba(167,176,222,0.2)"
                      : "var(--primary)",
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-label)",
                    cursor: provisioning ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {provisioning ? "Provisioning…" : "Create Company"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

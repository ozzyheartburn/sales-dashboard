import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, buildAuthHeaders } from "../App";
import {
  ArrowLeft,
  Building2,
  Users,
  UserPlus,
  Shield,
  Mail,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Workflow,
  Package,
  Settings,
  ChevronRight,
  X,
  Edit3,
  Globe,
  Calendar,
  CreditCard,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

interface TenantUser {
  _id: string;
  email: string;
  name: string | null;
  role: string;
  teamName: string | null;
  createdAt?: string;
  lastLoginAt?: string;
}

interface TenantInfo {
  _id: string;
  slug: string;
  displayName: string;
  status: string;
  createdAt: string;
  domain?: string;
}

const ROLES = [
  "company_admin",
  "sales_leader",
  "team_leader",
  "end_user",
  "sdr",
  "sdr_manager",
] as const;

const ROLE_LABELS: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  platform_admin: {
    label: "Platform Admin",
    color: "var(--error)",
    bg: "rgba(211,47,47,0.1)",
  },
  company_admin: {
    label: "Company Admin",
    color: "var(--tertiary)",
    bg: "rgba(135,32,222,0.1)",
  },
  sales_leader: {
    label: "Sales Leader",
    color: "var(--secondary-brand)",
    bg: "rgba(78,69,228,0.1)",
  },
  team_leader: {
    label: "Team Leader",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.1)",
  },
  end_user: {
    label: "End User",
    color: "var(--on-surface-variant)",
    bg: "rgba(167,176,222,0.1)",
  },
  sdr: { label: "SDR", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  sdr_manager: {
    label: "SDR Manager",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
  },
};

type Tab = "overview" | "users" | "modules" | "settings";

export function AdminCompanyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const authHeaders = buildAuthHeaders(user);

  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Add user form
  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<string>("end_user");
  const [newTeam, setNewTeam] = useState("");
  const [addingUser, setAddingUser] = useState(false);

  // Edit role
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editTeam, setEditTeam] = useState("");
  const [savingRole, setSavingRole] = useState(false);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load tenant info
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/api/tenants/${slug}`, { headers: authHeaders }).then(
        (r) => (r.ok ? r.json() : null),
      ),
      fetch(`${API_URL}/api/tenants/${slug}/users`, {
        headers: authHeaders,
      }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([tenantData, usersData]) => {
        setTenant(tenantData);
        setUsers(usersData || []);
      })
      .catch(() => {
        showToast("Failed to load company data", "error");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddUser = async () => {
    if (!newEmail.trim()) return;
    setAddingUser(true);
    try {
      const res = await fetch(`${API_URL}/api/tenants/${slug}/users`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail.trim().toLowerCase(),
          name: newName.trim() || null,
          role: newRole,
          teamName: newRole === "team_leader" ? newTeam.trim() : null,
        }),
      });
      if (res.ok) {
        showToast(`User ${newEmail} added`, "success");
        setShowAddUser(false);
        setNewEmail("");
        setNewName("");
        setNewRole("end_user");
        setNewTeam("");
        // Refresh users
        const usersRes = await fetch(`${API_URL}/api/tenants/${slug}/users`, {
          headers: authHeaders,
        });
        if (usersRes.ok) setUsers(await usersRes.json());
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Failed to add user", "error");
      }
    } catch {
      showToast("Failed to add user", "error");
    } finally {
      setAddingUser(false);
    }
  };

  const handleUpdateRole = async (email: string) => {
    setSavingRole(true);
    try {
      const res = await fetch(`${API_URL}/api/tenants/${slug}/users`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role: editRole,
          teamName: editRole === "team_leader" ? editTeam.trim() : null,
        }),
      });
      if (res.ok) {
        showToast(`Role updated for ${email}`, "success");
        setEditingUser(null);
        const usersRes = await fetch(`${API_URL}/api/tenants/${slug}/users`, {
          headers: authHeaders,
        });
        if (usersRes.ok) setUsers(await usersRes.json());
      } else {
        showToast("Failed to update role", "error");
      }
    } catch {
      showToast("Failed to update role", "error");
    } finally {
      setSavingRole(false);
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

  if (!tenant) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "var(--on-surface-variant)",
        }}
      >
        <AlertCircle size={40} style={{ marginBottom: 12 }} />
        <div
          style={{
            fontFamily: "var(--font-headline)",
            fontWeight: 700,
            fontSize: "1.1rem",
            marginBottom: 8,
          }}
        >
          Company not found
        </div>
        <button
          onClick={() => navigate("/admin/companies")}
          style={{
            padding: "0.5rem 1.2rem",
            borderRadius: 8,
            border: "none",
            background: "var(--primary)",
            color: "#fff",
            cursor: "pointer",
            fontFamily: "var(--font-label)",
            fontWeight: 600,
            fontSize: "0.82rem",
          }}
        >
          Back to Companies
        </button>
      </div>
    );
  }

  const adminCount = users.filter((u) =>
    ["company_admin", "platform_admin"].includes(u.role),
  ).length;
  const activeCount = users.filter((u) => u.lastLoginAt).length;

  return (
    <div style={{ padding: "2rem", maxWidth: 1100, margin: "0 auto" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

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
        style={{ marginBottom: "1.25rem" }}
      >
        <button
          onClick={() => navigate("/admin/companies")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--on-surface-variant)",
            fontSize: "0.8rem",
            fontFamily: "var(--font-label)",
            fontWeight: 600,
            marginBottom: 12,
            padding: 0,
          }}
        >
          <ArrowLeft size={14} /> Back to Companies
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background:
                "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Building2 size={22} color="#fff" />
          </div>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 800,
                fontSize: "1.5rem",
                color: "var(--on-background)",
                marginBottom: 2,
              }}
            >
              {tenant.displayName}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  color: "var(--on-surface-variant)",
                }}
              >
                {tenant.slug}
              </span>
              <span
                style={{
                  fontSize: "0.6rem",
                  borderRadius: 9999,
                  padding: "0.12rem 0.5rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-label)",
                  background:
                    tenant.status === "active"
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(245,158,11,0.12)",
                  color: tenant.status === "active" ? "#22c55e" : "#f59e0b",
                }}
              >
                {tenant.status}
              </span>
            </div>
          </div>
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
          { key: "overview" as Tab, label: "Overview", icon: Building2 },
          {
            key: "users" as Tab,
            label: `Users (${users.length})`,
            icon: Users,
          },
          { key: "modules" as Tab, label: "Modules", icon: Package },
          { key: "settings" as Tab, label: "Settings", icon: Settings },
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

      {/* ── Overview Tab ── */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Stats Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1rem",
            }}
          >
            {[
              {
                label: "Total Users",
                value: users.length,
                icon: Users,
                color: "var(--primary)",
              },
              {
                label: "Admins",
                value: adminCount,
                icon: Shield,
                color: "var(--tertiary)",
              },
              {
                label: "Active (logged in)",
                value: activeCount,
                icon: Check,
                color: "#22c55e",
              },
              {
                label: "Created",
                value: new Date(tenant.createdAt).toLocaleDateString(),
                icon: Calendar,
                color: "var(--secondary-brand)",
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
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
                      marginBottom: 10,
                    }}
                  >
                    <Icon size={16} color={stat.color} />
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--on-surface-variant)",
                        fontFamily: "var(--font-label)",
                        fontWeight: 600,
                      }}
                    >
                      {stat.label}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-headline)",
                      fontWeight: 800,
                      fontSize: "1.3rem",
                      color: "var(--on-background)",
                    }}
                  >
                    {stat.value}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.28 }}
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
                fontSize: "0.95rem",
                color: "var(--on-background)",
                marginBottom: 14,
              }}
            >
              Quick Actions
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.75rem",
              }}
            >
              {[
                {
                  label: "Manage Users",
                  icon: Users,
                  onClick: () => setTab("users"),
                },
                {
                  label: "Workflow Config",
                  icon: Workflow,
                  onClick: () => navigate(`/admin/workflows`),
                },
                {
                  label: "Module Access",
                  icon: Package,
                  onClick: () => setTab("modules"),
                },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "1px solid rgba(167,176,222,0.1)",
                      background: "var(--surface-container-low)",
                      color: "var(--on-surface)",
                      cursor: "pointer",
                      fontFamily: "var(--font-label)",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      transition: "all 0.15s",
                    }}
                  >
                    <Icon size={16} color="var(--primary)" />
                    {action.label}
                    <ChevronRight
                      size={14}
                      color="var(--on-surface-variant)"
                      style={{ marginLeft: "auto" }}
                    />
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.35 }}
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
                  fontSize: "0.95rem",
                  color: "var(--on-background)",
                }}
              >
                Users
              </div>
              <button
                onClick={() => {
                  setTab("users");
                  setShowAddUser(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--primary)",
                  color: "#fff",
                  cursor: "pointer",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              >
                <UserPlus size={12} /> Add User
              </button>
            </div>
            {users.slice(0, 5).map((u) => {
              const rl = ROLE_LABELS[u.role] || ROLE_LABELS.end_user;
              return (
                <div
                  key={u.email}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid rgba(167,176,222,0.08)",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "rgba(78,69,228,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-label)",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      color: "var(--secondary-brand)",
                    }}
                  >
                    {(u.name || u.email).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-label)",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        color: "var(--on-surface)",
                      }}
                    >
                      {u.name || u.email}
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--on-surface-variant)",
                      }}
                    >
                      {u.email}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.6rem",
                      borderRadius: 9999,
                      padding: "0.12rem 0.5rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-label)",
                      background: rl.bg,
                      color: rl.color,
                    }}
                  >
                    {rl.label}
                  </span>
                </div>
              );
            })}
            {users.length > 5 && (
              <button
                onClick={() => setTab("users")}
                style={{
                  marginTop: 10,
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  cursor: "pointer",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                View all {users.length} users <ChevronRight size={12} />
              </button>
            )}
          </motion.div>
        </div>
      )}

      {/* ── Users Tab ── */}
      {tab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Add User Button */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <button
              onClick={() => setShowAddUser(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0.5rem 1.2rem",
                borderRadius: 8,
                border: "none",
                background: "var(--primary)",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "var(--font-label)",
                fontWeight: 600,
                fontSize: "0.82rem",
              }}
            >
              <UserPlus size={14} /> Add User
            </button>
          </motion.div>

          {/* Users List */}
          {users.map((u, i) => {
            const rl = ROLE_LABELS[u.role] || ROLE_LABELS.end_user;
            const isEditing = editingUser === u.email;

            return (
              <motion.div
                key={u.email}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.03 + i * 0.03 }}
                className="luminous-shadow"
                style={{
                  borderRadius: "1rem",
                  padding: "1rem 1.25rem",
                  backgroundColor: "var(--surface-container-lowest)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "rgba(78,69,228,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-label)",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      color: "var(--secondary-brand)",
                      flexShrink: 0,
                    }}
                  >
                    {(u.name || u.email).charAt(0).toUpperCase()}
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
                      {u.name || "—"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: "0.72rem",
                        color: "var(--on-surface-variant)",
                      }}
                    >
                      <Mail size={11} /> {u.email}
                    </div>
                  </div>
                  {u.teamName && (
                    <span
                      style={{
                        fontSize: "0.6rem",
                        borderRadius: 9999,
                        padding: "0.1rem 0.5rem",
                        fontWeight: 600,
                        fontFamily: "var(--font-label)",
                        background: "rgba(6,182,212,0.1)",
                        color: "#06b6d4",
                      }}
                    >
                      Team: {u.teamName}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "0.6rem",
                      borderRadius: 9999,
                      padding: "0.12rem 0.5rem",
                      fontWeight: 700,
                      fontFamily: "var(--font-label)",
                      background: rl.bg,
                      color: rl.color,
                    }}
                  >
                    {rl.label}
                  </span>
                  <button
                    onClick={() => {
                      if (isEditing) {
                        setEditingUser(null);
                      } else {
                        setEditingUser(u.email);
                        setEditRole(u.role);
                        setEditTeam(u.teamName || "");
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "none",
                      background: isEditing
                        ? "rgba(211,47,47,0.08)"
                        : "rgba(167,176,222,0.08)",
                      color: isEditing
                        ? "var(--error)"
                        : "var(--on-surface-variant)",
                      cursor: "pointer",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      fontFamily: "var(--font-label)",
                    }}
                  >
                    {isEditing ? (
                      <>
                        <X size={10} /> Cancel
                      </>
                    ) : (
                      <>
                        <Edit3 size={10} /> Edit Role
                      </>
                    )}
                  </button>
                </div>

                {/* Edit Role Inline */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        style={{
                          marginTop: 14,
                          paddingTop: 14,
                          borderTop: "1px solid rgba(167,176,222,0.1)",
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-end",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <label
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              color: "var(--on-surface-variant)",
                              fontFamily: "var(--font-label)",
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            Role
                          </label>
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            style={{ ...inputStyle, cursor: "pointer" }}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]?.label || r}
                              </option>
                            ))}
                          </select>
                        </div>
                        {editRole === "team_leader" && (
                          <div style={{ flex: 1, minWidth: 160 }}>
                            <label
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                color: "var(--on-surface-variant)",
                                fontFamily: "var(--font-label)",
                                display: "block",
                                marginBottom: 4,
                              }}
                            >
                              Team Name
                            </label>
                            <input
                              value={editTeam}
                              onChange={(e) => setEditTeam(e.target.value)}
                              placeholder="e.g. Nordic Sales"
                              style={inputStyle}
                            />
                          </div>
                        )}
                        <button
                          onClick={() => handleUpdateRole(u.email)}
                          disabled={savingRole}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "10px 18px",
                            borderRadius: 8,
                            border: "none",
                            background: "var(--primary)",
                            color: "#fff",
                            cursor: "pointer",
                            fontFamily: "var(--font-label)",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            opacity: savingRole ? 0.7 : 1,
                            height: 42,
                          }}
                        >
                          {savingRole ? (
                            <Loader2
                              size={14}
                              style={{ animation: "spin 0.8s linear infinite" }}
                            />
                          ) : (
                            <Check size={14} />
                          )}
                          Save
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {users.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "var(--on-surface-variant)",
                fontSize: "0.85rem",
              }}
            >
              No users in this tenant yet. Add the first user above.
            </div>
          )}
        </div>
      )}

      {/* ── Modules Tab ── */}
      {tab === "modules" && (
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
              fontSize: "0.95rem",
              color: "var(--on-background)",
              marginBottom: 8,
            }}
          >
            Module Access
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--on-surface-variant)",
              fontFamily: "var(--font-body)",
              lineHeight: 1.5,
              marginBottom: 16,
            }}
          >
            Module access for this company is managed from the Module Access
            page.
          </p>
          <button
            onClick={() => navigate("/admin/modules")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0.6rem 1.2rem",
              borderRadius: 8,
              border: "none",
              background: "var(--primary)",
              color: "#fff",
              cursor: "pointer",
              fontFamily: "var(--font-label)",
              fontWeight: 600,
              fontSize: "0.82rem",
            }}
          >
            <Package size={14} /> Go to Module Access
            <ChevronRight size={14} />
          </button>
        </motion.div>
      )}

      {/* ── Settings Tab ── */}
      {tab === "settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                fontSize: "0.95rem",
                color: "var(--on-background)",
                marginBottom: 14,
              }}
            >
              Company Details
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "var(--on-surface-variant)",
                    fontFamily: "var(--font-label)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Display Name
                </label>
                <input
                  value={tenant.displayName}
                  readOnly
                  style={{ ...inputStyle, opacity: 0.7, cursor: "not-allowed" }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "var(--on-surface-variant)",
                    fontFamily: "var(--font-label)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Slug
                </label>
                <input
                  value={tenant.slug}
                  readOnly
                  style={{
                    ...inputStyle,
                    opacity: 0.7,
                    cursor: "not-allowed",
                    fontFamily: "monospace",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "var(--on-surface-variant)",
                    fontFamily: "var(--font-label)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Status
                </label>
                <input
                  value={tenant.status}
                  readOnly
                  style={{ ...inputStyle, opacity: 0.7, cursor: "not-allowed" }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "var(--on-surface-variant)",
                    fontFamily: "var(--font-label)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Created At
                </label>
                <input
                  value={new Date(tenant.createdAt).toLocaleString()}
                  readOnly
                  style={{ ...inputStyle, opacity: 0.7, cursor: "not-allowed" }}
                />
              </div>
            </div>
          </motion.div>

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
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "0.95rem",
                color: "var(--on-background)",
                marginBottom: 8,
              }}
            >
              Workflow Configuration
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
              Configure n8n webhooks, agent prompts, and template overrides for
              this company.
            </p>
            <button
              onClick={() => navigate("/admin/workflows")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0.6rem 1.2rem",
                borderRadius: 8,
                border: "none",
                background:
                  "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "var(--font-label)",
                fontWeight: 600,
                fontSize: "0.82rem",
              }}
            >
              <Workflow size={14} /> Open Workflows
              <ChevronRight size={14} />
            </button>
          </motion.div>
        </div>
      )}

      {/* ── Add User Modal ── */}
      <AnimatePresence>
        {showAddUser && (
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
            onClick={() => setShowAddUser(false)}
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
                  Add User to {tenant.displayName}
                </h2>
                <button
                  onClick={() => setShowAddUser(false)}
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
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Email *
                  </label>
                  <input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@company.com"
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
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Name
                  </label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Full Name"
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
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]?.label || r}
                      </option>
                    ))}
                  </select>
                </div>
                {newRole === "team_leader" && (
                  <div>
                    <label
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "var(--on-surface-variant)",
                        fontFamily: "var(--font-label)",
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Team Name
                    </label>
                    <input
                      value={newTeam}
                      onChange={(e) => setNewTeam(e.target.value)}
                      placeholder="e.g. Nordic Sales"
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 20,
                }}
              >
                <button
                  onClick={() => setShowAddUser(false)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: 8,
                    border: "1px solid var(--outline-variant)",
                    background: "var(--surface-container-lowest)",
                    color: "var(--on-surface)",
                    cursor: "pointer",
                    fontFamily: "var(--font-label)",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={addingUser || !newEmail.trim()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0.5rem 1.2rem",
                    borderRadius: 8,
                    border: "none",
                    background: "var(--primary)",
                    color: "#fff",
                    cursor: "pointer",
                    fontFamily: "var(--font-label)",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    opacity: addingUser || !newEmail.trim() ? 0.6 : 1,
                  }}
                >
                  {addingUser ? (
                    <Loader2
                      size={14}
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  Add User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

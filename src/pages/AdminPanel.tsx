import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2,
  UserPlus,
  Users,
  ChevronDown,
  ChevronRight,
  Check,
  AlertCircle,
  ArrowLeft,
  Shield,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api";

interface Tenant {
  _id: string;
  slug: string;
  displayName: string;
  status: string;
  createdAt: string;
}

interface TenantUser {
  _id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

type ToastType = "success" | "error";

const ROLES = [
  {
    value: "end_user",
    label: "End User",
    description: "Sales rep — sees only their own accounts",
    dbRole: "end_user",
  },
  {
    value: "team_leader",
    label: "Team Leader",
    description: "Sees team data, runs research",
    dbRole: "team_leader",
  },
  {
    value: "company_admin",
    label: "Company Admin",
    description: "Full access — manage users & data",
    dbRole: "company_admin",
  },
  {
    value: "platform_admin",
    label: "Platform Admin",
    description: "Super admin — all tenants (founders only)",
    dbRole: "platform_admin",
  },
];

export function AdminPanel() {
  const navigate = useNavigate();

  // Tenants
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null);
  const [tenantUsers, setTenantUsers] = useState<Record<string, TenantUser[]>>(
    {},
  );
  const [loadingTenants, setLoadingTenants] = useState(true);

  // Provision form
  const [companyName, setCompanyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [provisioning, setProvisioning] = useState(false);

  // Invite form
  const [inviteTenant, setInviteTenant] = useState("");
  const [inviteRows, setInviteRows] = useState([
    { email: "", name: "", role: "end_user", teamName: "" },
  ]);
  const [inviting, setInviting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    msg: string;
    type: ToastType;
  } | null>(null);

  const showToast = (msg: string, type: ToastType) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch tenants
  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/tenants`);
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      }
    } catch {
      // silent
    } finally {
      setLoadingTenants(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Fetch users for a tenant
  const fetchUsers = async (slug: string) => {
    try {
      const res = await fetch(`${API_BASE}/tenants/${slug}/users`);
      if (res.ok) {
        const data = await res.json();
        setTenantUsers((prev) => ({ ...prev, [slug]: data }));
      }
    } catch {
      // silent
    }
  };

  const toggleTenant = (slug: string) => {
    if (expandedTenant === slug) {
      setExpandedTenant(null);
    } else {
      setExpandedTenant(slug);
      if (!tenantUsers[slug]) fetchUsers(slug);
    }
  };

  // Provision new customer
  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    const slug = companyName
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    if (!slug) {
      showToast("Invalid company name", "error");
      return;
    }

    setProvisioning(true);
    try {
      const res = await fetch(`${API_BASE}/tenants/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          displayName: companyName.trim(),
          adminEmail: adminEmail.trim() || null,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        // If admin email provided, also add the admin user
        if (adminEmail.trim()) {
          await fetch(`${API_BASE}/tenants/${slug}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: adminEmail.trim(),
              name: adminName.trim() || null,
              role: "company_admin",
            }),
          });
        }

        showToast(
          `"${companyName.trim()}" provisioned successfully`,
          "success",
        );
        setCompanyName("");
        setAdminName("");
        setAdminEmail("");
        fetchTenants();
      } else {
        showToast(data.error || "Provisioning failed", "error");
      }
    } catch {
      showToast("Network error — is the backend running?", "error");
    } finally {
      setProvisioning(false);
    }
  };

  // Invite users
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteTenant) {
      showToast("Select a customer first", "error");
      return;
    }

    const validRows = inviteRows.filter((r) => r.email.trim());
    if (validRows.length === 0) {
      showToast("Add at least one email", "error");
      return;
    }

    setInviting(true);
    let success = 0;
    let failed = 0;

    for (const row of validRows) {
      const roleMapping = ROLES.find((r) => r.value === row.role);
      try {
        const res = await fetch(`${API_BASE}/tenants/${inviteTenant}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: row.email.trim(),
            name: row.name.trim() || null,
            role: roleMapping?.dbRole || "end_user",
            teamName:
              row.role === "team_leader" ? row.teamName?.trim() || null : null,
          }),
        });
        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
    }

    if (success > 0) {
      showToast(
        `${success} user${success > 1 ? "s" : ""} added${failed > 0 ? `, ${failed} failed` : ""}`,
        failed > 0 ? "error" : "success",
      );
      setInviteRows([{ email: "", name: "", role: "end_user", teamName: "" }]);
      fetchUsers(inviteTenant);
    } else {
      showToast("Failed to add users", "error");
    }

    setInviting(false);
  };

  const addInviteRow = () => {
    setInviteRows((prev) => [
      ...prev,
      { email: "", name: "", role: "end_user", teamName: "" },
    ]);
  };

  const removeInviteRow = (idx: number) => {
    setInviteRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateInviteRow = (
    idx: number,
    field: "email" | "name" | "role" | "teamName",
    value: string,
  ) => {
    setInviteRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    );
  };

  // --- Styles ---
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.6rem 0.85rem",
    borderRadius: 10,
    border: "1px solid rgba(107,113,148,0.2)",
    backgroundColor: "var(--surface-container-low)",
    color: "var(--on-surface)",
    fontFamily: "var(--font-body)",
    fontSize: "0.85rem",
    outline: "none",
    transition: "border-color 140ms ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "0.3rem",
    fontSize: "0.72rem",
    fontWeight: 600,
    fontFamily: "var(--font-label)",
    color: "var(--on-surface-variant)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  const cardStyle: React.CSSProperties = {
    borderRadius: "1rem",
    padding: "1.5rem",
    backgroundColor: "var(--surface-container-lowest)",
  };

  const btnPrimary: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.45rem",
    padding: "0.65rem 1.25rem",
    borderRadius: 10,
    border: "none",
    background:
      "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
    color: "var(--on-primary)",
    fontFamily: "var(--font-label)",
    fontWeight: 700,
    fontSize: "0.82rem",
    cursor: "pointer",
    transition: "opacity 140ms ease",
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--background)",
        position: "relative",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.5rem",
          borderBottom: "1px solid rgba(107,113,148,0.1)",
          backgroundColor: "var(--surface-container-lowest)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "none",
              border: "none",
              color: "var(--on-surface-variant)",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontFamily: "var(--font-label)",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div
            style={{
              width: 1,
              height: 20,
              backgroundColor: "rgba(107,113,148,0.15)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 8,
                background:
                  "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
              }}
            >
              <Shield size={16} color="white" />
            </div>
            <span
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "1rem",
                color: "var(--on-background)",
              }}
            >
              Platform Admin
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "2rem 1.5rem 4rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* ============ Section 1: Provision New Customer ============ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="luminous-shadow"
          style={cardStyle}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <Building2 size={18} style={{ color: "var(--tertiary)" }} />
            <h2
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "1.05rem",
                color: "var(--on-background)",
                margin: 0,
              }}
            >
              Provision New Customer
            </h2>
          </div>

          <form onSubmit={handleProvision}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Company Name *</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. 6G Nordics"
                required
                style={inputStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--primary)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(107,113,148,0.2)")
                }
              />
              {companyName.trim() && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--on-surface-variant)",
                    marginTop: "0.25rem",
                    display: "block",
                  }}
                >
                  Database:{" "}
                  <code style={{ color: "var(--primary)" }}>
                    {companyName
                      .trim()
                      .replace(/[^a-zA-Z0-9]+/g, "_")
                      .replace(/^_|_$/g, "")}
                  </code>
                </span>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1.25rem",
              }}
            >
              <div>
                <label style={labelStyle}>Admin Name</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="John Doe"
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "var(--primary)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(107,113,148,0.2)")
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Admin Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@company.com"
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "var(--primary)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(107,113,148,0.2)")
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={provisioning || !companyName.trim()}
              style={{
                ...btnPrimary,
                opacity: provisioning || !companyName.trim() ? 0.5 : 1,
                cursor:
                  provisioning || !companyName.trim()
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {provisioning ? (
                <Loader2
                  size={14}
                  style={{ animation: "spin 0.8s linear infinite" }}
                />
              ) : (
                <Building2 size={14} />
              )}
              {provisioning ? "Provisioning…" : "Provision Customer"}
            </button>
          </form>
        </motion.div>

        {/* ============ Section 2: Invite Users ============ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.07 }}
          className="luminous-shadow"
          style={cardStyle}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <UserPlus size={18} style={{ color: "var(--secondary-brand)" }} />
            <h2
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "1.05rem",
                color: "var(--on-background)",
                margin: 0,
              }}
            >
              Add Users
            </h2>
          </div>

          <form onSubmit={handleInvite}>
            {/* Tenant selector */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={labelStyle}>Customer *</label>
              <select
                value={inviteTenant}
                onChange={(e) => setInviteTenant(e.target.value)}
                required
                style={{
                  ...inputStyle,
                  cursor: "pointer",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7194' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.75rem center",
                  paddingRight: "2rem",
                }}
              >
                <option value="">Select customer…</option>
                {tenants.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.displayName || t.slug}
                  </option>
                ))}
              </select>
            </div>

            {/* User rows */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
                marginBottom: "1rem",
              }}
            >
              {inviteRows.map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 160px 32px",
                    gap: "0.5rem",
                    alignItems: "end",
                  }}
                >
                  <div>
                    {idx === 0 && <label style={labelStyle}>Email *</label>}
                    <input
                      type="email"
                      value={row.email}
                      onChange={(e) =>
                        updateInviteRow(idx, "email", e.target.value)
                      }
                      placeholder="user@company.com"
                      required
                      style={inputStyle}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "var(--primary)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor =
                          "rgba(107,113,148,0.2)")
                      }
                    />
                  </div>
                  <div>
                    {idx === 0 && <label style={labelStyle}>Name</label>}
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) =>
                        updateInviteRow(idx, "name", e.target.value)
                      }
                      placeholder="Full name"
                      style={inputStyle}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = "var(--primary)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor =
                          "rgba(107,113,148,0.2)")
                      }
                    />
                  </div>
                  <div>
                    {idx === 0 && <label style={labelStyle}>Role</label>}
                    <select
                      value={row.role}
                      onChange={(e) =>
                        updateInviteRow(idx, "role", e.target.value)
                      }
                      style={{
                        ...inputStyle,
                        cursor: "pointer",
                        appearance: "none",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7194' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 0.6rem center",
                        paddingRight: "1.75rem",
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Team name field — only visible for team_leader */}
                  {row.role === "team_leader" && (
                    <div>
                      {idx === 0 && <label style={labelStyle}>Team Name</label>}
                      <input
                        type="text"
                        value={row.teamName || ""}
                        onChange={(e) =>
                          updateInviteRow(idx, "teamName", e.target.value)
                        }
                        placeholder="e.g. Nordic Enterprise"
                        style={inputStyle}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = "var(--primary)")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor =
                            "rgba(107,113,148,0.2)")
                        }
                      />
                    </div>
                  )}
                  <div>
                    {inviteRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInviteRow(idx)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 32,
                          height: 36,
                          borderRadius: 8,
                          border: "none",
                          background: "none",
                          color: "var(--on-surface-variant)",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <button
                type="button"
                onClick={addInviteRow}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.45rem 0.85rem",
                  borderRadius: 8,
                  border: "1px solid rgba(107,113,148,0.2)",
                  background: "none",
                  color: "var(--on-surface-variant)",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  cursor: "pointer",
                }}
              >
                <Plus size={13} />
                Add row
              </button>

              <button
                type="submit"
                disabled={inviting || !inviteTenant}
                style={{
                  ...btnPrimary,
                  background: "var(--primary)",
                  opacity: inviting || !inviteTenant ? 0.5 : 1,
                  cursor: inviting || !inviteTenant ? "not-allowed" : "pointer",
                }}
              >
                {inviting ? (
                  <Loader2
                    size={14}
                    style={{ animation: "spin 0.8s linear infinite" }}
                  />
                ) : (
                  <UserPlus size={14} />
                )}
                {inviting ? "Adding…" : "Add Users"}
              </button>
            </div>
          </form>
        </motion.div>

        {/* ============ Section 3: Existing Customers ============ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.14 }}
          className="luminous-shadow"
          style={cardStyle}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <Users size={18} style={{ color: "var(--primary)" }} />
            <h2
              style={{
                fontFamily: "var(--font-headline)",
                fontWeight: 700,
                fontSize: "1.05rem",
                color: "var(--on-background)",
                margin: 0,
              }}
            >
              Customers
            </h2>
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                fontFamily: "var(--font-label)",
                color: "var(--on-surface-variant)",
                backgroundColor: "var(--surface-container-low)",
                borderRadius: 9999,
                padding: "0.15rem 0.6rem",
              }}
            >
              {tenants.length}
            </span>
          </div>

          {loadingTenants ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--on-surface-variant)",
                fontSize: "0.82rem",
                padding: "1rem 0",
              }}
            >
              <Loader2
                size={14}
                style={{ animation: "spin 0.8s linear infinite" }}
              />
              Loading…
            </div>
          ) : tenants.length === 0 ? (
            <p
              style={{
                color: "var(--on-surface-variant)",
                fontSize: "0.82rem",
                padding: "1rem 0",
              }}
            >
              No customers provisioned yet. Use the form above to create one.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
              }}
            >
              {tenants.map((tenant) => (
                <div key={tenant.slug}>
                  <button
                    onClick={() => toggleTenant(tenant.slug)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.65rem 0.85rem",
                      borderRadius: 10,
                      border: "none",
                      backgroundColor:
                        expandedTenant === tenant.slug
                          ? "var(--surface-container-low)"
                          : "transparent",
                      color: "var(--on-surface)",
                      fontFamily: "var(--font-label)",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      transition: "background-color 140ms ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {expandedTenant === tenant.slug ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                      <span>{tenant.displayName || tenant.slug}</span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        color:
                          tenant.status === "active"
                            ? "#16a34a"
                            : "var(--on-surface-variant)",
                        backgroundColor:
                          tenant.status === "active"
                            ? "rgba(22,163,74,0.1)"
                            : "var(--surface-container)",
                        borderRadius: 9999,
                        padding: "0.12rem 0.55rem",
                      }}
                    >
                      {tenant.status}
                    </span>
                  </button>

                  <AnimatePresence>
                    {expandedTenant === tenant.slug && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          style={{
                            padding: "0.5rem 0.85rem 0.85rem 2.25rem",
                          }}
                        >
                          {!tenantUsers[tenant.slug] ? (
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--on-surface-variant)",
                              }}
                            >
                              Loading users…
                            </span>
                          ) : tenantUsers[tenant.slug].length === 0 ? (
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--on-surface-variant)",
                              }}
                            >
                              No users yet
                            </span>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.3rem",
                              }}
                            >
                              {tenantUsers[tenant.slug].map((u) => (
                                <div
                                  key={u._id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    fontSize: "0.78rem",
                                    padding: "0.35rem 0",
                                    borderBottom:
                                      "1px solid rgba(107,113,148,0.08)",
                                  }}
                                >
                                  <div>
                                    <span
                                      style={{
                                        color: "var(--on-surface)",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {u.name || u.email}
                                    </span>
                                    {u.name && (
                                      <span
                                        style={{
                                          color: "var(--on-surface-variant)",
                                          marginLeft: "0.5rem",
                                        }}
                                      >
                                        {u.email}
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: "0.65rem",
                                      fontWeight: 600,
                                      fontFamily: "var(--font-label)",
                                      color:
                                        u.role === "admin"
                                          ? "var(--tertiary)"
                                          : "var(--on-surface-variant)",
                                      backgroundColor:
                                        u.role === "admin"
                                          ? "rgba(135,32,222,0.08)"
                                          : "var(--surface-container-low)",
                                      borderRadius: 9999,
                                      padding: "0.12rem 0.55rem",
                                    }}
                                  >
                                    {u.role === "admin"
                                      ? "Manager / Director"
                                      : u.role === "analyst"
                                        ? "End-user"
                                        : u.role}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: "fixed",
              bottom: 24,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.65rem 1.25rem",
              borderRadius: 12,
              backgroundColor:
                toast.type === "success"
                  ? "rgba(22,163,74,0.95)"
                  : "rgba(211,47,47,0.95)",
              color: "white",
              fontFamily: "var(--font-label)",
              fontWeight: 600,
              fontSize: "0.82rem",
              zIndex: 9999,
              boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
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
    </div>
  );
}

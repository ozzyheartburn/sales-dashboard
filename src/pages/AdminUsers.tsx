import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, buildAuthHeaders } from "../App";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  MoreVertical,
  X,
  Check,
  AlertCircle,
  Mail,
  Building2,
} from "lucide-react";

const ALL_ROLES = [
  { value: "platform_admin", label: "Admin" },
  { value: "company_admin", label: "Company Admin" },
  { value: "sales_leader", label: "Sales Leader" },
  { value: "team_leader", label: "Team Leader" },
  { value: "end_user", label: "Sales Rep" },
  { value: "sdr", label: "SDR" },
  { value: "sdr_manager", label: "SDR Manager" },
];

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  platform_admin: { bg: "rgba(135,32,222,0.1)", color: "var(--tertiary)" },
  company_admin: { bg: "rgba(18,74,241,0.08)", color: "var(--primary)" },
  sales_leader: { bg: "rgba(34,197,94,0.12)", color: "#22c55e" },
  team_leader: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  end_user: { bg: "rgba(78,69,228,0.1)", color: "var(--secondary-brand)" },
  sdr: { bg: "rgba(6,182,212,0.1)", color: "#06b6d4" },
  sdr_manager: { bg: "rgba(244,63,94,0.1)", color: "#f43f5e" },
};

interface MockUser {
  id: string;
  email: string;
  name: string;
  role: string;
  company: string;
  status: "active" | "invited" | "disabled";
  lastLogin: string;
}

const MOCK_USERS: MockUser[] = [
  {
    id: "1",
    email: "alimelkkilaoskari@gmail.com",
    name: "Oskari Ali-Melkkilä",
    role: "platform_admin",
    company: "PG Machine",
    status: "active",
    lastLogin: "2026-04-17T18:30:00Z",
  },
  {
    id: "2",
    email: "samuli.melart@gmail.com",
    name: "Samuli Melart",
    role: "platform_admin",
    company: "PG Machine",
    status: "active",
    lastLogin: "2026-04-16T14:20:00Z",
  },
  {
    id: "3",
    email: "anna.k@6gnordic.com",
    name: "Anna Korhonen",
    role: "sales_leader",
    company: "6G Nordic",
    status: "active",
    lastLogin: "2026-04-15T09:10:00Z",
  },
  {
    id: "4",
    email: "mika.v@6gnordic.com",
    name: "Mika Virtanen",
    role: "end_user",
    company: "6G Nordic",
    status: "active",
    lastLogin: "2026-04-14T11:45:00Z",
  },
  {
    id: "5",
    email: "lars.n@pgidentity.com",
    name: "Lars Nilsson",
    role: "company_admin",
    company: "PG Identity",
    status: "active",
    lastLogin: "2026-04-13T16:00:00Z",
  },
  {
    id: "6",
    email: "emma.s@pgidentity.com",
    name: "Emma Svensson",
    role: "sdr",
    company: "PG Identity",
    status: "invited",
    lastLogin: "—",
  },
  {
    id: "7",
    email: "juha.l@pgmachine.com",
    name: "Juha Lahtinen",
    role: "sdr_manager",
    company: "PG Machine",
    status: "active",
    lastLogin: "2026-04-12T08:30:00Z",
  },
  {
    id: "8",
    email: "petra.h@6gnordic.com",
    name: "Petra Haapala",
    role: "end_user",
    company: "6G Nordic",
    status: "disabled",
    lastLogin: "2026-03-20T10:00:00Z",
  },
];

export function AdminUsers() {
  const { user } = useAuth();
  const authHeaders = buildAuthHeaders(user);
  const API_URL = import.meta.env.VITE_API_URL || "";
  const [users, setUsers] = useState<MockUser[]>(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [tenants, setTenants] = useState<{ slug: string; name: string }[]>([]);
  const [invite, setInvite] = useState({
    email: "",
    name: "",
    role: "end_user",
    company: "",
  });
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Fetch real tenants for company dropdown
  useEffect(() => {
    fetch(`${API_URL}/api/tenants`, { headers: authHeaders })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTenants(data);
          if (data.length > 0 && !invite.company) {
            setInvite((p) => ({ ...p, company: data[0].slug }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const companies = [...new Set(users.map((u) => u.company))];

  const filtered = users.filter((u) => {
    if (
      search &&
      !u.email.toLowerCase().includes(search.toLowerCase()) &&
      !u.name.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterRole && u.role !== filterRole) return false;
    if (filterCompany && u.company !== filterCompany) return false;
    return true;
  });

  const handleInvite = async () => {
    if (!invite.email) {
      setToast({ msg: "Email is required", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setInviting(true);
    try {
      const res = await fetch(`${API_URL}/api/invite`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: invite.email,
          name: invite.name,
          role: invite.role,
          tenant: invite.company,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.error || "Failed to invite user", type: "error" });
        setTimeout(() => setToast(null), 4000);
        return;
      }
      // Add to local list
      const tenantName =
        tenants.find((t) => t.slug === invite.company)?.name || invite.company;
      setUsers((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          email: data.email,
          name: data.name,
          role: invite.role,
          company: tenantName,
          status: "invited",
          lastLogin: "—",
        },
      ]);
      setShowInvite(false);
      setInvite({
        email: "",
        name: "",
        role: "end_user",
        company: tenants[0]?.slug || "",
      });
      const emailMsg = data.emailSent
        ? `Invitation emailed to ${data.email}`
        : `User created: ${data.email} (email not configured — temp password: ${data.tempPassword})`;
      setToast({ msg: emailMsg, type: "success" });
      setTimeout(() => setToast(null), 8000);
    } catch (err) {
      setToast({ msg: "Network error — could not invite user", type: "error" });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setInviting(false);
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

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    minWidth: 130,
  };

  const statusColors: Record<string, { bg: string; color: string }> = {
    active: { bg: "rgba(34,197,94,0.12)", color: "#22c55e" },
    invited: { bg: "rgba(78,69,228,0.1)", color: "var(--secondary-brand)" },
    disabled: {
      bg: "rgba(167,176,222,0.1)",
      color: "var(--on-surface-variant)",
    },
  };

  return (
    <div style={{ padding: "2rem", maxWidth: 1400, margin: "0 auto" }}>
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
              Users & Roles
            </h1>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--on-surface-variant)",
                fontFamily: "var(--font-body)",
              }}
            >
              {users.length} users across {companies.length} companies
            </p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
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
            <UserPlus size={16} /> Invite User
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.07 }}
        style={{
          display: "flex",
          gap: 10,
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
            minWidth: 200,
            maxWidth: 350,
          }}
        >
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
            placeholder="Search by name or email..."
            style={{ ...inputStyle, paddingLeft: 36 }}
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={selectStyle}
        >
          <option value="">All roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <select
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          style={selectStyle}
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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
                  "User",
                  "Email",
                  "Company",
                  "Role",
                  "Status",
                  "Last Login",
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
              {filtered.map((u, i) => {
                const rc = ROLE_COLORS[u.role] || ROLE_COLORS.end_user;
                const sc = statusColors[u.status];
                const roleLabel =
                  ALL_ROLES.find((r) => r.value === u.role)?.label || u.role;
                return (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: "1px solid rgba(167,176,222,0.04)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--surface-container-low)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "12px 14px" }}>
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
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            fontFamily: "var(--font-label)",
                            flexShrink: 0,
                          }}
                        >
                          {u.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--on-surface)",
                            fontFamily: "var(--font-headline)",
                          }}
                        >
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "var(--on-surface-variant)",
                        fontSize: "0.75rem",
                      }}
                    >
                      {u.email}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Building2
                          size={12}
                          color="var(--on-surface-variant)"
                        />
                        <span
                          style={{
                            color: "var(--on-surface)",
                            fontSize: "0.75rem",
                          }}
                        >
                          {u.company}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          borderRadius: 9999,
                          padding: "0.15rem 0.6rem",
                          fontWeight: 700,
                          fontFamily: "var(--font-label)",
                          background: rc.bg,
                          color: rc.color,
                        }}
                      >
                        {roleLabel}
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
                          background: sc.bg,
                          color: sc.color,
                        }}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "var(--on-surface-variant)",
                        fontSize: "0.72rem",
                      }}
                    >
                      {u.lastLogin === "—"
                        ? "—"
                        : new Date(u.lastLogin).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <button
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

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
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
            onClick={() => setShowInvite(false)}
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
                  Invite User
                </h2>
                <button
                  onClick={() => setShowInvite(false)}
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
                    Email
                  </label>
                  <input
                    value={invite.email}
                    onChange={(e) =>
                      setInvite((p) => ({ ...p, email: e.target.value }))
                    }
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
                      marginBottom: 4,
                      display: "block",
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    value={invite.name}
                    onChange={(e) =>
                      setInvite((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="John Doe"
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
                    Company
                  </label>
                  <select
                    value={invite.company}
                    onChange={(e) =>
                      setInvite((p) => ({ ...p, company: e.target.value }))
                    }
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    {tenants.map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.name}
                      </option>
                    ))}
                  </select>
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
                    Role
                  </label>
                  <select
                    value={invite.role}
                    onChange={(e) =>
                      setInvite((p) => ({ ...p, role: e.target.value }))
                    }
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleInvite}
                  disabled={inviting}
                  style={{
                    marginTop: 4,
                    padding: "12px 0",
                    borderRadius: 10,
                    border: "none",
                    background: inviting
                      ? "var(--on-surface-variant)"
                      : "var(--primary)",
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-label)",
                    cursor: inviting ? "not-allowed" : "pointer",
                    opacity: inviting ? 0.7 : 1,
                  }}
                >
                  {inviting ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth, buildAuthHeaders } from "../App";
import {
  LayoutDashboard,
  Search,
  Target,
  BarChart3,
  Briefcase,
  Settings,
  Save,
  Loader2,
  Check,
  RotateCcw,
  Users,
  Shield,
  Trash2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

interface ModuleInfo {
  key: string;
  label: string;
  icon: React.FC<{ size?: number }>;
}

const ALL_MODULES: ModuleInfo[] = [
  { key: "dashboard", label: "Territory Overview", icon: LayoutDashboard },
  { key: "research-hub", label: "Research Hub", icon: Search },
  { key: "war-room", label: "War Room", icon: Target },
  { key: "analytics", label: "Analytics & Automation", icon: BarChart3 },
  { key: "integrations", label: "Integrations", icon: Briefcase },
  { key: "admin", label: "Admin Console", icon: Settings },
];

const ALL_ROLES = [
  { key: "platform_admin", label: "Platform Admin" },
  { key: "company_admin", label: "Company Admin" },
  { key: "sales_leader", label: "Sales Leader" },
  { key: "team_leader", label: "Team Leader" },
  { key: "end_user", label: "Sales Rep" },
  { key: "sdr", label: "SDR" },
  { key: "sdr_manager", label: "SDR Manager" },
];

type Permissions = Record<string, string[]>;

interface UserOverride {
  email: string;
  modules: string[];
}

interface TenantUser {
  email: string;
  name?: string;
  role?: string;
}

const toggleStyle = (enabled: boolean) => ({
  width: 36,
  height: 20,
  borderRadius: 9999,
  border: "none",
  cursor: "pointer",
  position: "relative" as const,
  transition: "background 0.2s",
  background: enabled ? "var(--primary)" : "var(--surface-container)",
});

const toggleKnob = (enabled: boolean) => ({
  width: 14,
  height: 14,
  borderRadius: "50%",
  background: "#fff",
  position: "absolute" as const,
  top: 3,
  left: enabled ? 19 : 3,
  transition: "left 0.2s",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
});

export function AdminModules() {
  const { user } = useAuth();
  const { activeTenant } = useAuth();
  const authHeaders = buildAuthHeaders(user, activeTenant);

  const [tab, setTab] = useState<"roles" | "users">("roles");

  // Role-based state
  const [permissions, setPermissions] = useState<Permissions>({});
  const [savedPermissions, setSavedPermissions] = useState<Permissions>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // User-based state
  const [userOverrides, setUserOverrides] = useState<Record<string, string[]>>(
    {},
  );
  const [savedUserOverrides, setSavedUserOverrides] = useState<
    Record<string, string[]>
  >({});
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSaving, setUserSaving] = useState<string | null>(null);
  const [userSaved, setUserSaved] = useState<string | null>(null);

  // Load role permissions
  useEffect(() => {
    fetch(`${API_URL}/api/module-permissions`, { headers: authHeaders })
      .then((r) => r.json())
      .then((data) => {
        setPermissions(data);
        setSavedPermissions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load users + overrides when user tab is opened
  useEffect(() => {
    if (tab !== "users") return;
    setUsersLoading(true);

    const tenant = activeTenant || user?.tenant || "PG_Machine";

    Promise.all([
      fetch(`${API_URL}/api/module-permissions/users`, {
        headers: authHeaders,
      }).then((r) => r.json()),
      fetch(`${API_URL}/api/tenants/${tenant}/users`, {
        headers: authHeaders,
      }).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_URL}/api/auth/list-users`, {
        headers: authHeaders,
      }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([overrides, tUsers, authUsers]) => {
        const overrideMap: Record<string, string[]> = {};
        (overrides as UserOverride[]).forEach((o) => {
          overrideMap[o.email] = o.modules;
        });
        setUserOverrides(overrideMap);
        setSavedUserOverrides(overrideMap);

        // Merge tenant users + auth_users for a complete list
        const seen = new Set<string>();
        const merged: TenantUser[] = [];
        for (const u of [
          ...(authUsers as TenantUser[]),
          ...(tUsers as TenantUser[]),
        ]) {
          const email = u.email?.toLowerCase();
          if (email && !seen.has(email)) {
            seen.add(email);
            merged.push({ ...u, email });
          }
        }
        setTenantUsers(merged);
        setUsersLoading(false);
      })
      .catch(() => setUsersLoading(false));
  }, [tab, activeTenant]);

  // Role tab handlers
  const toggleModule = (role: string, moduleKey: string) => {
    setPermissions((prev) => {
      const current = prev[role] || [];
      const next = current.includes(moduleKey)
        ? current.filter((m) => m !== moduleKey)
        : [...current, moduleKey];
      return { ...prev, [role]: next };
    });
    setSaved(false);
  };

  const hasChanges =
    JSON.stringify(permissions) !== JSON.stringify(savedPermissions);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/module-permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ permissions }),
      });
      if (res.ok) {
        setSavedPermissions(permissions);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      /* ignore */
    }
    setSaving(false);
  };

  const handleReset = () => {
    setPermissions(savedPermissions);
    setSaved(false);
  };

  // User tab handlers
  const toggleUserModule = (email: string, moduleKey: string) => {
    setUserOverrides((prev) => {
      const userRole =
        tenantUsers.find((u) => u.email === email)?.role || "end_user";
      const roleModules = permissions[userRole] || [];
      const current = prev[email] || roleModules;
      const next = current.includes(moduleKey)
        ? current.filter((m) => m !== moduleKey)
        : [...current, moduleKey];
      return { ...prev, [email]: next };
    });
  };

  const saveUserOverride = async (email: string) => {
    setUserSaving(email);
    try {
      const modules = userOverrides[email];
      if (!modules) return;
      const res = await fetch(
        `${API_URL}/api/module-permissions/users/${encodeURIComponent(email)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ modules }),
        },
      );
      if (res.ok) {
        setSavedUserOverrides((prev) => ({ ...prev, [email]: modules }));
        setUserSaved(email);
        setTimeout(() => setUserSaved(null), 2000);
      }
    } catch {
      /* ignore */
    }
    setUserSaving(null);
  };

  const removeUserOverride = async (email: string) => {
    try {
      await fetch(
        `${API_URL}/api/module-permissions/users/${encodeURIComponent(email)}`,
        { method: "DELETE", headers: authHeaders },
      );
      setUserOverrides((prev) => {
        const next = { ...prev };
        delete next[email];
        return next;
      });
      setSavedUserOverrides((prev) => {
        const next = { ...prev };
        delete next[email];
        return next;
      });
    } catch {
      /* ignore */
    }
  };

  const getUserModules = (email: string) => {
    if (userOverrides[email]) return userOverrides[email];
    const userRole =
      tenantUsers.find((u) => u.email === email)?.role || "end_user";
    return permissions[userRole] || [];
  };

  const userHasChanges = (email: string) => {
    const current = userOverrides[email];
    const saved = savedUserOverrides[email];
    if (!current && !saved) return false;
    return JSON.stringify(current) !== JSON.stringify(saved);
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          color: "var(--on-surface-variant)",
        }}
      >
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 1200 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-headline)",
              fontWeight: 800,
              fontSize: "1.5rem",
              color: "var(--on-background)",
              margin: 0,
            }}
          >
            Module Access
          </h1>
          <p
            style={{
              color: "var(--on-surface-variant)",
              fontSize: "0.85rem",
              margin: "0.25rem 0 0",
              fontFamily: "var(--font-body)",
            }}
          >
            {tab === "roles"
              ? "Configure default modules per role"
              : "Override modules for individual users"}
          </p>
        </div>
        {tab === "roles" && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {hasChanges && (
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
              disabled={!hasChanges || saving}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1.2rem",
                borderRadius: "0.5rem",
                border: "none",
                background: hasChanges
                  ? "var(--primary)"
                  : "var(--surface-container-low)",
                color: hasChanges ? "#fff" : "var(--on-surface-variant)",
                cursor: hasChanges ? "pointer" : "default",
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
              ) : saved ? (
                <Check size={14} />
              ) : (
                <Save size={14} />
              )}
              {saved ? "Saved" : "Save Changes"}
            </motion.button>
          </div>
        )}
      </div>

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
          { key: "roles" as const, label: "By Role", icon: Shield },
          { key: "users" as const, label: "By User", icon: Users },
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

      {/* By Role tab */}
      {tab === "roles" && (
        <div
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
                fontFamily: "var(--font-body)",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "0.85rem 1.25rem",
                      textAlign: "left",
                      fontFamily: "var(--font-label)",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      color: "var(--on-surface-variant)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid var(--outline-variant)",
                      backgroundColor: "var(--surface-container-low)",
                    }}
                  >
                    Module
                  </th>
                  {ALL_ROLES.map((role) => (
                    <th
                      key={role.key}
                      style={{
                        padding: "0.85rem 0.75rem",
                        textAlign: "center",
                        fontFamily: "var(--font-label)",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        color: "var(--on-surface-variant)",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                        borderBottom: "1px solid var(--outline-variant)",
                        backgroundColor: "var(--surface-container-low)",
                        minWidth: 90,
                      }}
                    >
                      {role.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_MODULES.map((mod, idx) => {
                  const Icon = mod.icon;
                  return (
                    <motion.tr
                      key={mod.key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                      style={{
                        borderBottom: "1px solid var(--outline-variant)",
                      }}
                    >
                      <td
                        style={{
                          padding: "0.75rem 1.25rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "var(--on-surface)",
                        }}
                      >
                        <Icon size={16} />
                        {mod.label}
                      </td>
                      {ALL_ROLES.map((role) => {
                        const enabled = (permissions[role.key] || []).includes(
                          mod.key,
                        );
                        return (
                          <td
                            key={role.key}
                            style={{ padding: "0.75rem", textAlign: "center" }}
                          >
                            <button
                              onClick={() => toggleModule(role.key, mod.key)}
                              style={toggleStyle(enabled)}
                            >
                              <div style={toggleKnob(enabled)} />
                            </button>
                          </td>
                        );
                      })}
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* By User tab */}
      {tab === "users" && (
        <div>
          {usersLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 200,
                color: "var(--on-surface-variant)",
              }}
            >
              <Loader2
                size={24}
                style={{ animation: "spin 1s linear infinite" }}
              />
            </div>
          ) : tenantUsers.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "var(--on-surface-variant)",
                fontSize: "0.9rem",
              }}
            >
              No users found
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {tenantUsers.map((tu, idx) => {
                const modules = getUserModules(tu.email);
                const hasOverride = !!userOverrides[tu.email];
                const changed = userHasChanges(tu.email);
                const isSaving = userSaving === tu.email;
                const isSaved = userSaved === tu.email;
                const roleLabel =
                  ALL_ROLES.find((r) => r.key === tu.role)?.label ||
                  tu.role ||
                  "—";

                return (
                  <motion.div
                    key={tu.email}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.07 }}
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
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            fontFamily: "var(--font-label)",
                          }}
                        >
                          {(tu.name || tu.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "0.9rem",
                              color: "var(--on-surface)",
                              fontFamily: "var(--font-body)",
                            }}
                          >
                            {tu.name || tu.email.split("@")[0]}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--on-surface-variant)",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            {tu.email}
                            <span
                              style={{
                                fontSize: "0.65rem",
                                borderRadius: 9999,
                                padding: "0.15rem 0.6rem",
                                fontFamily: "var(--font-label)",
                                fontWeight: 600,
                                background: "var(--surface-container-low)",
                                color: "var(--on-surface-variant)",
                              }}
                            >
                              {roleLabel}
                            </span>
                            {hasOverride && (
                              <span
                                style={{
                                  fontSize: "0.65rem",
                                  borderRadius: 9999,
                                  padding: "0.15rem 0.6rem",
                                  fontFamily: "var(--font-label)",
                                  fontWeight: 600,
                                  background:
                                    "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                                  color: "#fff",
                                }}
                              >
                                Custom
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        {hasOverride && (
                          <button
                            onClick={() => removeUserOverride(tu.email)}
                            title="Remove override (revert to role defaults)"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              padding: "0.35rem 0.7rem",
                              borderRadius: "0.4rem",
                              border: "1px solid var(--outline-variant)",
                              background: "transparent",
                              color: "var(--on-surface-variant)",
                              cursor: "pointer",
                              fontSize: "0.7rem",
                              fontFamily: "var(--font-label)",
                              fontWeight: 600,
                            }}
                          >
                            <Trash2 size={12} /> Reset
                          </button>
                        )}
                        {(changed ||
                          (hasOverride && !savedUserOverrides[tu.email])) && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => saveUserOverride(tu.email)}
                            disabled={isSaving}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              padding: "0.35rem 0.8rem",
                              borderRadius: "0.4rem",
                              border: "none",
                              background: "var(--primary)",
                              color: "#fff",
                              cursor: "pointer",
                              fontSize: "0.7rem",
                              fontFamily: "var(--font-label)",
                              fontWeight: 600,
                              opacity: isSaving ? 0.7 : 1,
                            }}
                          >
                            {isSaving ? (
                              <Loader2
                                size={12}
                                style={{ animation: "spin 1s linear infinite" }}
                              />
                            ) : isSaved ? (
                              <Check size={12} />
                            ) : (
                              <Save size={12} />
                            )}
                            {isSaved ? "Saved" : "Save"}
                          </motion.button>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      {ALL_MODULES.map((mod) => {
                        const Icon = mod.icon;
                        const enabled = modules.includes(mod.key);
                        return (
                          <button
                            key={mod.key}
                            onClick={() => toggleUserModule(tu.email, mod.key)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              padding: "0.4rem 0.8rem",
                              borderRadius: "0.5rem",
                              border: enabled
                                ? "1.5px solid var(--primary)"
                                : "1.5px solid var(--outline-variant)",
                              background: enabled
                                ? "rgba(18,74,241,0.08)"
                                : "transparent",
                              color: enabled
                                ? "var(--primary)"
                                : "var(--on-surface-variant)",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                              fontFamily: "var(--font-label)",
                              fontWeight: 600,
                              transition: "all 0.15s",
                            }}
                          >
                            <Icon size={14} />
                            {mod.label}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

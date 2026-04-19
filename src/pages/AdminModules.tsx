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

export function AdminModules() {
  const { user } = useAuth();
  const { activeTenant } = useAuth();
  const authHeaders = buildAuthHeaders(user, activeTenant);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [savedPermissions, setSavedPermissions] = useState<Permissions>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
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
            Configure which modules each role can access
          </p>
        </div>
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
      </div>

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
                          style={{
                            padding: "0.75rem",
                            textAlign: "center",
                          }}
                        >
                          <button
                            onClick={() => toggleModule(role.key, mod.key)}
                            style={{
                              width: 36,
                              height: 20,
                              borderRadius: 9999,
                              border: "none",
                              cursor: "pointer",
                              position: "relative",
                              transition: "background 0.2s",
                              background: enabled
                                ? "var(--primary)"
                                : "var(--surface-container)",
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
                                left: enabled ? 19 : 3,
                                transition: "left 0.2s",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              }}
                            />
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
    </div>
  );
}

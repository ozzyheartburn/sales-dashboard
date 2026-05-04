import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  useState,
  useEffect,
  createContext,
  useContext,
  lazy,
  Suspense,
} from "react";
import { AppLayout } from "./components/AppLayout";
import { AdminLayout } from "./components/AdminLayout";

const DashboardHome = lazy(() =>
  import("./pages/DashboardHome").then((m) => ({ default: m.DashboardHome })),
);
const ResearchHub = lazy(() =>
  import("./pages/ResearchHub").then((m) => ({ default: m.ResearchHub })),
);
const WarRoom = lazy(() =>
  import("./pages/WarRoom").then((m) => ({ default: m.WarRoom })),
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const ForgotPasswordPage = lazy(() =>
  import("./pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("./pages/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const AdminPanel = lazy(() =>
  import("./pages/AdminPanel").then((m) => ({ default: m.AdminPanel })),
);
const AdminViewSelector = lazy(() =>
  import("./pages/AdminViewSelector").then((m) => ({
    default: m.AdminViewSelector,
  })),
);
const AdminUsers = lazy(() =>
  import("./pages/AdminUsers").then((m) => ({ default: m.AdminUsers })),
);
const AdminWorkflows = lazy(() =>
  import("./pages/AdminWorkflows").then((m) => ({
    default: m.AdminWorkflows,
  })),
);
const AdminModules = lazy(() =>
  import("./pages/AdminModules").then((m) => ({ default: m.AdminModules })),
);

export interface AvailableRole {
  tenant: string;
  role: string;
  teamName: string | null;
}

export interface AuthUser {
  email: string;
  name: string | null;
  picture: string | null;
  role: string;
  isPlatformAdmin: boolean;
  tenant: string;
  linkedTenants: string[];
  teamName: string | null;
  availableRoles: AvailableRole[];
  customer_company_id: string | null;
  customer_user_id: string | null;
  customer_user_id_rbac: string | null;
}

export type ModulePermissions = Record<string, string[]>;

interface AuthContextType {
  user: AuthUser | null;
  credential: string | null;
  login: (user: AuthUser, credential: string) => void;
  logout: () => void;
  isLoading: boolean;
  activeTenant: string;
  setActiveTenant: (tenant: string) => void;
  modulePermissions: ModulePermissions;
  userModules: string[];
}

const DEFAULT_MODULE_PERMISSIONS: ModulePermissions = {
  platform_admin: [
    "dashboard",
    "research-hub",
    "war-room",
    "analytics",
    "integrations",
    "admin",
  ],
  company_admin: [
    "dashboard",
    "research-hub",
    "war-room",
    "analytics",
    "integrations",
  ],
  sales_leader: ["dashboard", "research-hub", "war-room", "analytics"],
  team_leader: ["dashboard", "research-hub", "war-room"],
  end_user: ["dashboard", "research-hub"],
  sdr: ["dashboard"],
  sdr_manager: ["dashboard", "analytics"],
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  credential: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
  activeTenant: "",
  setActiveTenant: () => {},
  modulePermissions: DEFAULT_MODULE_PERMISSIONS,
  userModules: [],
});

export function useAuth() {
  return useContext(AuthContext);
}

export function buildAuthHeaders(
  user: AuthUser | null,
  tenantOverride?: string,
): Record<string, string> {
  if (!user) return {};
  const h: Record<string, string> = {};
  if (user.email) h["x-user-email"] = user.email;
  if (user.role) h["x-user-role"] = user.role;
  const tenant = tenantOverride || user.tenant;
  if (tenant) h["x-tenant"] = tenant;
  if (user.teamName) h["x-user-team"] = user.teamName;
  if (user.customer_company_id)
    h["x-customer-company-id"] = user.customer_company_id;
  if (user.customer_user_id_rbac)
    h["x-customer-user-id-rbac"] = user.customer_user_id_rbac;
  return h;
}

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "3px solid var(--surface-container)",
            borderTopColor: "var(--primary)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span
          style={{
            color: "var(--on-surface-variant)",
            fontSize: "0.85rem",
            fontFamily: "var(--font-label)",
            fontWeight: 600,
          }}
        >
          Loading...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}

function ModuleGuard({
  children,
  moduleKey,
}: {
  children: React.ReactNode;
  moduleKey: string;
}) {
  const { userModules } = useAuth();
  if (!userModules.includes(moduleKey)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [credential, setCredential] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTenant, setActiveTenantState] = useState("");
  const [modulePermissions, setModulePermissions] = useState<ModulePermissions>(
    DEFAULT_MODULE_PERMISSIONS,
  );
  const [userModules, setUserModules] = useState<string[]>([]);

  const setActiveTenant = (tenant: string) => {
    setActiveTenantState(tenant);
    localStorage.setItem("active_tenant", tenant);
  };

  const API_URL = import.meta.env.VITE_API_URL || "";

  // Load module permissions from backend
  useEffect(() => {
    fetch(`${API_URL}/api/module-permissions`)
      .then((r) => (r.ok ? r.json() : DEFAULT_MODULE_PERMISSIONS))
      .then((data) => {
        setModulePermissions(data);
        // Set default userModules from role if user is already loaded
        if (user) {
          setUserModules(data[user.role] || []);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch per-user module overrides
  useEffect(() => {
    if (!user) return;
    const headers: Record<string, string> = {};
    if (user.email) headers["x-user-email"] = user.email;
    if (user.role) headers["x-user-role"] = user.role;
    if (user.tenant) headers["x-tenant"] = user.tenant;
    fetch(`${API_URL}/api/module-permissions/me`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.modules)) {
          setUserModules(data.modules);
        } else {
          // Fall back to role-based
          setUserModules(modulePermissions[user.role] || []);
        }
      })
      .catch(() => {
        setUserModules(modulePermissions[user.role] || []);
      });
  }, [user, modulePermissions]);

  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    const storedCred = localStorage.getItem("auth_credential");
    const storedTenant = localStorage.getItem("active_tenant");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setCredential(storedCred);
        setActiveTenantState(storedTenant || parsed.tenant || "");
      } catch {
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_credential");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (u: AuthUser, cred: string) => {
    setUser(u);
    setCredential(cred);
    setActiveTenantState(u.tenant || "");
    localStorage.setItem("auth_user", JSON.stringify(u));
    localStorage.setItem("auth_credential", cred);
    localStorage.setItem("active_tenant", u.tenant || "");
  };

  const logout = () => {
    setUser(null);
    setCredential(null);
    setActiveTenantState("");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_credential");
    localStorage.removeItem("active_tenant");
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        credential,
        login,
        logout,
        isLoading,
        activeTenant,
        setActiveTenant,
        modulePermissions,
        userModules,
      }}
    >
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {user ? (
              <>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/select-view" element={<AdminViewSelector />} />
                <Route path="/dashboard" element={<AppLayout />}>
                  <Route index element={<DashboardHome />} />
                  <Route
                    path="research-hub"
                    element={
                      <ModuleGuard moduleKey="research-hub">
                        <ResearchHub />
                      </ModuleGuard>
                    }
                  />
                  <Route
                    path="war-room"
                    element={
                      <ModuleGuard moduleKey="war-room">
                        <WarRoom />
                      </ModuleGuard>
                    }
                  />
                </Route>
                {user.isPlatformAdmin && (
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="users" replace />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="workflows" element={<AdminWorkflows />} />
                    <Route path="modules" element={<AdminModules />} />
                    <Route path="settings" element={<AdminPanel />} />
                  </Route>
                )}
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </>
            ) : (
              <>
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

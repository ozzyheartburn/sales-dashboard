import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { AppLayout } from "./components/AppLayout";
import { AdminLayout } from "./components/AdminLayout";
import { DashboardHome } from "./pages/DashboardHome";
import { ResearchHub } from "./pages/ResearchHub";
import { WarRoom } from "./pages/WarRoom";
import { LoginPage } from "./pages/LoginPage";
import { AdminPanel } from "./pages/AdminPanel";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminViewSelector } from "./pages/AdminViewSelector";
import { AdminCompanies } from "./pages/AdminCompanies";
import { AdminUsers } from "./pages/AdminUsers";
import { AdminSubscriptions } from "./pages/AdminSubscriptions";
import { AdminWorkflows } from "./pages/AdminWorkflows";

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

interface AuthContextType {
  user: AuthUser | null;
  credential: string | null;
  login: (user: AuthUser, credential: string) => void;
  logout: () => void;
  isLoading: boolean;
  activeTenant: string;
  setActiveTenant: (tenant: string) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  credential: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
  activeTenant: "",
  setActiveTenant: () => {},
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
          Loading…
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}

function RoleGuard({
  children,
  allowed,
  role,
}: {
  children: React.ReactNode;
  allowed: string[];
  role: string;
}) {
  if (!allowed.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [credential, setCredential] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTenant, setActiveTenantState] = useState("");

  const setActiveTenant = (tenant: string) => {
    setActiveTenantState(tenant);
    localStorage.setItem("active_tenant", tenant);
  };

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
      }}
    >
      <BrowserRouter>
        <Routes>
          {user ? (
            <>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/select-view" element={<AdminViewSelector />} />
              <Route path="/dashboard" element={<AppLayout />}>
                <Route index element={<DashboardHome />} />
                <Route
                  path="research-hub"
                  element={
                    <RoleGuard
                      allowed={[
                        "platform_admin",
                        "company_admin",
                        "sales_leader",
                        "team_leader",
                        "end_user",
                      ]}
                      role={user.role}
                    >
                      <ResearchHub />
                    </RoleGuard>
                  }
                />
                <Route
                  path="war-room"
                  element={
                    <RoleGuard
                      allowed={[
                        "platform_admin",
                        "company_admin",
                        "sales_leader",
                        "team_leader",
                      ]}
                      role={user.role}
                    >
                      <WarRoom />
                    </RoleGuard>
                  }
                />
              </Route>
              {user.isPlatformAdmin && (
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="companies" element={<AdminCompanies />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route
                    path="subscriptions"
                    element={<AdminSubscriptions />}
                  />
                  <Route path="workflows" element={<AdminWorkflows />} />
                  <Route path="settings" element={<AdminPanel />} />
                </Route>
              )}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

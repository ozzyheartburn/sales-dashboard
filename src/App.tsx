import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { AppLayout } from "./components/AppLayout";
import { DashboardHome } from "./pages/DashboardHome";
import { ResearchHub } from "./pages/ResearchHub";
import { WarRoom } from "./pages/WarRoom";
import { LoginPage } from "./pages/LoginPage";
import { AdminPanel } from "./pages/AdminPanel";

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

export default function App() {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Admin panel — standalone, always accessible */}
        <Route path="/admin" element={<AdminPanel />} />

        {isAuthenticated ? (
          <>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<AppLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="research-hub" element={<ResearchHub />} />
              <Route path="war-room" element={<WarRoom />} />
            </Route>
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
  );
}

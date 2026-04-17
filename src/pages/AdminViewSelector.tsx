import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth, type AvailableRole } from "../App";
import {
  Settings,
  TrendingUp,
  BarChart3,
  Users,
  Brain,
  LogOut,
  Shield,
} from "lucide-react";
import type { FC } from "react";

interface RoleMeta {
  label: string;
  description: string;
  icon: FC<{ size?: number; color?: string }>;
  gradient: string;
}

const ROLE_META: Record<string, RoleMeta> = {
  platform_admin: {
    label: "Platform Admin",
    description: "Manage all companies, users and platform settings",
    icon: Shield,
    gradient:
      "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
  },
  company_admin: {
    label: "Company Admin",
    description: "Full access — manage users & company data",
    icon: Settings,
    gradient:
      "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
  },
  team_leader: {
    label: "Team Leader",
    description: "Team performance, pipeline analytics, coaching insights",
    icon: TrendingUp,
    gradient: "var(--primary)",
  },
  end_user: {
    label: "Sales Rep",
    description: "Account research, deal intelligence, war room",
    icon: BarChart3,
    gradient: "var(--primary)",
  },
};

const DEFAULT_META: RoleMeta = {
  label: "Dashboard",
  description: "View your dashboard",
  icon: Users,
  gradient: "var(--primary)",
};

export function AdminViewSelector() {
  const navigate = useNavigate();
  const { user, login, credential, logout } = useAuth();

  const roles = user?.availableRoles || [];

  const handleSelectRole = (ar: AvailableRole) => {
    if (!user || !credential) return;

    const updatedUser = {
      ...user,
      role: ar.role,
      tenant: ar.tenant,
      teamName: ar.teamName,
      isPlatformAdmin: ar.role === "platform_admin",
    };

    login(updatedUser, credential);

    if (ar.role === "platform_admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background gradient orbs */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "50vw",
          height: "50vw",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(135,32,222,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "50vw",
          height: "50vw",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(18,74,241,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: "100%",
          maxWidth: 520,
          padding: "0 1.5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 14,
              background:
                "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
              marginBottom: "1rem",
            }}
          >
            <Brain size={28} color="white" />
          </motion.div>
          <h1
            style={{
              fontFamily: "var(--font-headline)",
              fontWeight: 800,
              fontSize: "1.5rem",
              color: "var(--on-background)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Select View
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--on-surface-variant)",
              fontSize: "0.85rem",
              marginTop: "0.4rem",
            }}
          >
            Welcome back, {user?.name?.split(" ")[0] || user?.email}
          </p>
        </div>

        {/* Role Cards */}
        <div
          className="luminous-shadow"
          style={{
            borderRadius: "1rem",
            padding: "1.25rem",
            backgroundColor: "var(--surface-container-lowest)",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
          >
            {roles.map((ar, index) => {
              const meta = ROLE_META[ar.role] || DEFAULT_META;
              const Icon = meta.icon;

              return (
                <motion.button
                  key={`${ar.tenant}-${ar.role}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.06 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelectRole(ar)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.9rem",
                    padding: "0.9rem 1rem",
                    borderRadius: 12,
                    border: "1px solid rgba(107,113,148,0.15)",
                    background: "var(--surface-container-low)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 160ms ease",
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: meta.gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} color="white" />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-headline)",
                        fontWeight: 700,
                        fontSize: "0.88rem",
                        color: "var(--on-background)",
                      }}
                    >
                      {meta.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.72rem",
                        color: "var(--on-surface-variant)",
                        marginTop: "0.1rem",
                      }}
                    >
                      {meta.description}
                      {ar.tenant !== "platform" && (
                        <span style={{ opacity: 0.7 }}> · {ar.tenant}</span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Sign out */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "1.5rem",
          }}
        >
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "none",
              border: "none",
              color: "var(--on-surface-variant)",
              fontSize: "0.75rem",
              fontWeight: 600,
              fontFamily: "var(--font-label)",
              cursor: "pointer",
              opacity: 0.7,
              transition: "opacity 140ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

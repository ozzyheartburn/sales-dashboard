import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import {
  Settings,
  TrendingUp,
  BarChart3,
  Headphones,
  Users,
  Lock,
  Brain,
  LogOut,
} from "lucide-react";

interface ViewOption {
  id: string;
  label: string;
  description: string;
  icon: typeof Settings;
  active: boolean;
  gradient?: string;
}

const VIEW_OPTIONS: ViewOption[] = [
  {
    id: "admin",
    label: "Admin Account",
    description: "Manage prompts, assign user permissions, platform settings",
    icon: Settings,
    active: true,
    gradient:
      "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
  },
  {
    id: "sales_leader",
    label: "Sales Leader View",
    description: "Team performance, pipeline analytics, coaching insights",
    icon: TrendingUp,
    active: false,
  },
  {
    id: "sales_rep",
    label: "Sales Rep View",
    description: "Account research, deal intelligence, war room",
    icon: BarChart3,
    active: true,
    gradient: "var(--primary)",
  },
  {
    id: "sdr_leader",
    label: "SDR Leader View",
    description: "Outbound metrics, team activity, conversion tracking",
    icon: Users,
    active: false,
  },
  {
    id: "sdr",
    label: "SDR View",
    description: "Prospecting tools, sequences, meeting booking",
    icon: Headphones,
    active: false,
  },
];

export function AdminViewSelector() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSelect = (view: ViewOption) => {
    if (!view.active) return;

    if (view.id === "admin") {
      navigate("/admin");
    } else if (view.id === "sales_rep") {
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

        {/* View Cards */}
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
            {VIEW_OPTIONS.map((view, index) => (
              <motion.button
                key={view.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                whileHover={view.active ? { scale: 1.01 } : undefined}
                whileTap={view.active ? { scale: 0.99 } : undefined}
                onClick={() => handleSelect(view)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.9rem",
                  padding: "0.9rem 1rem",
                  borderRadius: 12,
                  border: view.active
                    ? "1px solid rgba(107,113,148,0.15)"
                    : "1px solid rgba(107,113,148,0.08)",
                  background: view.active
                    ? "var(--surface-container-low)"
                    : "transparent",
                  cursor: view.active ? "pointer" : "default",
                  opacity: view.active ? 1 : 0.45,
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
                    background: view.active
                      ? view.gradient || "var(--primary)"
                      : "var(--surface-container)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {view.active ? (
                    <view.icon size={20} color="white" />
                  ) : (
                    <Lock
                      size={16}
                      style={{ color: "var(--on-surface-variant)" }}
                    />
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-headline)",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      color: view.active
                        ? "var(--on-background)"
                        : "var(--on-surface-variant)",
                    }}
                  >
                    {view.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.72rem",
                      color: "var(--on-surface-variant)",
                      marginTop: "0.1rem",
                    }}
                  >
                    {view.description}
                  </div>
                </div>

                {/* Badge */}
                {!view.active && (
                  <span
                    style={{
                      fontSize: "0.6rem",
                      fontFamily: "var(--font-label)",
                      fontWeight: 700,
                      color: "var(--on-surface-variant)",
                      background: "var(--surface-container)",
                      borderRadius: 9999,
                      padding: "0.15rem 0.6rem",
                      flexShrink: 0,
                    }}
                  >
                    UPCOMING
                  </span>
                )}
              </motion.button>
            ))}
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

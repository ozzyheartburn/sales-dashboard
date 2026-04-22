import { motion } from "motion/react";
import {
  Shield,
  Sparkles,
  BarChart3,
  Brain,
  LogIn,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { useState } from "react";
import heroImage from "../assets/hero.png";

const RAW_API_BASE = import.meta.env.VITE_API_URL || "";
const API_BASE =
  typeof window !== "undefined" &&
  window.location.protocol === "https:" &&
  RAW_API_BASE.startsWith("http://")
    ? ""
    : RAW_API_BASE;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      if (data.user && data.credential) {
        login(data.user, data.credential);
        navigate("/select-view");
        return;
      }

      setError("Login failed");
    } catch {
      setError("Login failed. Please try again.");
    }
    setIsLoading(false);
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

      {/* Main container */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          maxWidth: "1200px",
          width: "100%",
          height: "100dvh",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Left: Image */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "3rem",
            color: "#fff",
            position: "relative",
          }}
        >
          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(18,74,241,0.4), rgba(135,32,222,0.4))",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 700, margin: 0 }}>
              PG Machine
            </h1>
            <p style={{ fontSize: "1rem", marginTop: "0.5rem", opacity: 0.9 }}>
              Sales intelligence workspace
            </p>
          </div>
        </motion.div>

        {/* Right: Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "3rem",
            background: "var(--background)",
          }}
        >
          <div>
            <>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--on-background)",
                  marginBottom: "0.5rem",
                }}
              >
                Sign in
              </h2>
              <p
                style={{
                  color: "var(--on-surface-variant)",
                  marginBottom: "2rem",
                }}
              >
                Enter your credentials to continue
              </p>

              <form onSubmit={handleLoginSubmit}>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      marginBottom: "1rem",
                      fontSize: "14px",
                      color: "var(--error)",
                    }}
                  >
                    {error}
                  </motion.div>
                )}

                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--on-surface)",
                      marginBottom: "8px",
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "1px solid rgba(167,176,222,0.3)",
                      borderRadius: "8px",
                      fontSize: "14px",
                      background: "var(--surface-container-lowest)",
                      color: "var(--on-surface)",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "2rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--on-surface)",
                      marginBottom: "8px",
                    }}
                  >
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "1px solid rgba(167,176,222,0.3)",
                        borderRadius: "8px",
                        fontSize: "14px",
                        background: "var(--surface-container-lowest)",
                        color: "var(--on-surface)",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--on-surface-variant)",
                        padding: "4px",
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: isLoading
                      ? "rgba(18,74,241,0.5)"
                      : "var(--primary)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <LogIn size={18} />
                  {isLoading ? "Signing in..." : "Sign in"}
                </motion.button>
              </form>

              <div
                style={{
                  marginTop: "1.5rem",
                  paddingTop: "1.5rem",
                  borderTop: "1px solid rgba(167,176,222,0.2)",
                  textAlign: "center",
                }}
              >
                <button
                  onClick={() => navigate("/forgot-password")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Forgot your password?
                </button>
              </div>
            </>
          </div>
        </motion.div>
      </div>

      {/* Mobile fallback: stack vertically */}
      <style>{`
        @media (max-width: 768px) {
          [style*="gridTemplateColumns"][style*="1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

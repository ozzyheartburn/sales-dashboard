import { motion } from "motion/react";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import heroImage from "../assets/hero.png";

const RAW_API_BASE = import.meta.env.VITE_API_URL || "";
const API_BASE =
  typeof window !== "undefined" &&
  window.location.protocol === "https:" &&
  RAW_API_BASE.startsWith("http://")
    ? ""
    : RAW_API_BASE;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!token) {
      setError("Invalid reset link.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        setIsLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Failed to reset password. Please try again.");
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
            {!submitted ? (
              <>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--on-background)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Create new password
                </h2>
                <p
                  style={{
                    color: "var(--on-surface-variant)",
                    marginBottom: "2rem",
                  }}
                >
                  Enter a new password for your account
                </p>

                {!token && (
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
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <AlertCircle size={16} />
                    Invalid reset link
                  </motion.div>
                )}

                <form
                  onSubmit={handleSubmit}
                  style={{ opacity: token ? 1 : 0.5 }}
                >
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
                      New password
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={!token}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: "1px solid rgba(167,176,222,0.3)",
                          borderRadius: "8px",
                          fontSize: "14px",
                          background: "var(--surface-container-lowest)",
                          color: "var(--on-surface)",
                          boxSizing: "border-box",
                          opacity: token ? 1 : 0.5,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={!token}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: token ? "pointer" : "not-allowed",
                          color: "var(--on-surface-variant)",
                          padding: "4px",
                        }}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
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
                      Confirm password
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={!token}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: "1px solid rgba(167,176,222,0.3)",
                          borderRadius: "8px",
                          fontSize: "14px",
                          background: "var(--surface-container-lowest)",
                          color: "var(--on-surface)",
                          boxSizing: "border-box",
                          opacity: token ? 1 : 0.5,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        disabled={!token}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: token ? "pointer" : "not-allowed",
                          color: "var(--on-surface-variant)",
                          padding: "4px",
                        }}
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading || !token}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background:
                        isLoading || !token
                          ? "rgba(18,74,241,0.5)"
                          : "var(--primary)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: isLoading || !token ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <Lock size={18} />
                    {isLoading ? "Resetting..." : "Reset password"}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => navigate("/login")}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "transparent",
                      color: "var(--primary)",
                      border: "1px solid rgba(18,74,241,0.3)",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      marginTop: "1rem",
                    }}
                  >
                    <ArrowLeft size={18} />
                    Back to login
                  </motion.button>
                </form>
              </>
            ) : (
              <>
                <div style={{ textAlign: "center" }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}
                    style={{
                      display: "inline-block",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <CheckCircle
                      size={64}
                      style={{ color: "var(--primary)" }}
                    />
                  </motion.div>

                  <h2
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--on-background)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Password reset successful
                  </h2>
                  <p
                    style={{
                      color: "var(--on-surface-variant)",
                      marginBottom: "2rem",
                      lineHeight: 1.6,
                    }}
                  >
                    Your password has been changed. You can now sign in with
                    your new password.
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/login")}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "var(--primary)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    Go to login
                  </motion.button>
                </div>
              </>
            )}
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

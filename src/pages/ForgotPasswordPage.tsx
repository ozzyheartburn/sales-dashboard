import { motion } from "motion/react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import heroImage from "../assets/hero.png";

const RAW_API_BASE = import.meta.env.VITE_API_URL || "";
const API_BASE =
  typeof window !== "undefined" &&
  window.location.protocol === "https:" &&
  RAW_API_BASE.startsWith("http://")
    ? ""
    : RAW_API_BASE;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset email");
        setIsLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Failed to send reset email. Please try again.");
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
                  Reset your password
                </h2>
                <p
                  style={{
                    color: "var(--on-surface-variant)",
                    marginBottom: "2rem",
                  }}
                >
                  Enter your email and we'll send you a password reset link
                </p>

                <form onSubmit={handleSubmit}>
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
                      Email address
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
                    <Mail size={18} />
                    {isLoading ? "Sending..." : "Send reset link"}
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
                    Check your email
                  </h2>
                  <p
                    style={{
                      color: "var(--on-surface-variant)",
                      marginBottom: "2rem",
                      lineHeight: 1.6,
                    }}
                  >
                    If an account exists with <strong>{email}</strong>, you'll
                    receive a password reset link. The link expires in 1 hour.
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
                    <ArrowLeft size={18} />
                    Back to login
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

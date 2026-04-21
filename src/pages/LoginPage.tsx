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

const API_BASE = import.meta.env.VITE_API_URL || "";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
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

      login(data.user, data.credential);

      // Always go to role selector so user picks their view
      navigate("/select-view");
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

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "0 1.5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo / Brand */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              background:
                "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
              marginBottom: "1.25rem",
            }}
          >
            <Brain size={32} color="white" />
          </motion.div>
          <h1
            style={{
              fontFamily: "var(--font-headline)",
              fontWeight: 800,
              fontSize: "1.75rem",
              color: "var(--on-background)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Sales Intelligence
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--on-surface-variant)",
              fontSize: "0.9rem",
              marginTop: "0.5rem",
            }}
          >
            AI-powered account research & deal intelligence
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="luminous-shadow"
          style={{
            borderRadius: "1rem",
            backgroundColor: "var(--surface-container-lowest)",
            overflow: "hidden",
            marginBottom: "1.1rem",
            border: "1px solid rgba(107,113,148,0.18)",
          }}
        >
          <img
            src={heroImage}
            alt="Neural network visualization"
            style={{
              width: "100%",
              height: "170px",
              objectFit: "cover",
              objectPosition: "center",
              filter: "saturate(1.07)",
            }}
          />
        </motion.div>

        <div
          className="luminous-shadow"
          style={{
            borderRadius: "1rem",
            padding: "2rem 1.75rem",
            backgroundColor: "var(--surface-container-lowest)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-headline)",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "var(--on-background)",
              margin: "0 0 0.25rem 0",
              textAlign: "center",
            }}
          >
            Welcome back
          </h2>
          <p
            style={{
              color: "var(--on-surface-variant)",
              fontSize: "0.82rem",
              margin: "0 0 1.5rem 0",
              textAlign: "center",
            }}
          >
            Sign in to your account
          </p>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  color: "var(--on-surface-variant)",
                  marginBottom: "0.35rem",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                placeholder="you@company.com"
                style={{
                  width: "100%",
                  padding: "0.7rem 0.85rem",
                  borderRadius: 10,
                  border: "1px solid rgba(107,113,148,0.25)",
                  backgroundColor: "var(--surface-container-low)",
                  color: "var(--on-surface)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.88rem",
                  outline: "none",
                  transition: "border-color 140ms ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--primary)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(107,113,148,0.25)")
                }
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontFamily: "var(--font-label)",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  color: "var(--on-surface-variant)",
                  marginBottom: "0.35rem",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  style={{
                    width: "100%",
                    padding: "0.7rem 2.5rem 0.7rem 0.85rem",
                    borderRadius: 10,
                    border: "1px solid rgba(107,113,148,0.25)",
                    backgroundColor: "var(--surface-container-low)",
                    color: "var(--on-surface)",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.88rem",
                    outline: "none",
                    transition: "border-color 140ms ease",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "var(--primary)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(107,113,148,0.25)")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--on-surface-variant)",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.25rem",
                borderRadius: 12,
                border: "none",
                background:
                  "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                color: "white",
                fontFamily: "var(--font-label)",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: isLoading ? "wait" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: "opacity 140ms ease",
              }}
            >
              <LogIn size={18} />
              {isLoading ? "Signing in…" : "Sign in"}
            </motion.button>
          </form>

          {error && (
            <p
              style={{
                color: "var(--error)",
                fontSize: "0.8rem",
                marginTop: "0.75rem",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1.5rem",
            marginTop: "2rem",
          }}
        >
          {[
            { icon: Sparkles, label: "AI Research" },
            { icon: BarChart3, label: "Deal Signals" },
            { icon: Shield, label: "Secure" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                color: "var(--on-surface-variant)",
                fontSize: "0.72rem",
                fontWeight: 600,
                fontFamily: "var(--font-label)",
              }}
            >
              <item.icon size={13} />
              {item.label}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

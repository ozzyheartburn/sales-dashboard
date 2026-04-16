import { useGoogleLogin } from "@react-oauth/google";
import { motion } from "motion/react";
import {
  Shield,
  Sparkles,
  BarChart3,
  Brain,
  Settings,
  KeyRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE || "https://sales-dashboard-liard.vercel.app";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDevLogin, setShowDevLogin] = useState(false);
  const [devEmail, setDevEmail] = useState("");

  const handleDevLogin = async () => {
    if (!devEmail.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/dev-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: devEmail.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Login failed");
        setIsLoading(false);
        return;
      }
      const data = await res.json();
      login(data.user, data.credential);
      navigate("/dashboard");
    } catch {
      setError("Login failed. Please try again.");
    }
    setIsLoading(false);
  };

  const googleLogin = useGoogleLogin({
    flow: "implicit",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSuccess: async (tokenResponse: any) => {
      setIsLoading(true);
      setError(null);
      try {
        // Exchange the access token for user info from Google
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          },
        );
        const userInfo = await userInfoRes.json();

        // Call our backend to link/verify the user
        const res = await fetch(`${API_BASE}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credential: tokenResponse.access_token,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            googleId: userInfo.sub,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Login failed");
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        login(data.user, tokenResponse.access_token);
        navigate("/dashboard");
      } catch {
        setError("Login failed. Please try again.");
      }
      setIsLoading(false);
    },
    onError: () => {
      setError("Google sign-in failed");
      setIsLoading(false);
    },
  });

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
          maxWidth: 440,
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
              margin: "0 0 0.5rem 0",
            }}
          >
            Welcome back
          </h2>
          <p
            style={{
              color: "var(--on-surface-variant)",
              fontSize: "0.82rem",
              margin: "0 0 1.75rem 0",
            }}
          >
            Sign in to access your dashboard and account intelligence.
          </p>

          {/* Sign in with Google button */}
          <button
            onClick={() => googleLogin()}
            disabled={isLoading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              padding: "0.75rem 1.25rem",
              borderRadius: 12,
              border: "1px solid rgba(107,113,148,0.2)",
              backgroundColor: "var(--surface-container-low)",
              color: "var(--on-surface)",
              fontFamily: "var(--font-label)",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: isLoading ? "wait" : "pointer",
              opacity: isLoading ? 0.6 : 1,
              transition: "all 140ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isLoading)
                e.currentTarget.style.backgroundColor =
                  "var(--surface-container)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--surface-container-low)";
            }}
          >
            {/* Google "G" icon */}
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            {isLoading ? "Signing in…" : "Sign in with Google"}
          </button>

          {/* Error message */}
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

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              margin: "1.25rem 0",
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(107,113,148,0.15)",
              }}
            />
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--on-surface-variant)",
                fontFamily: "var(--font-label)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              or
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(107,113,148,0.15)",
              }}
            />
          </div>

          {/* Platform Admin Login */}
          {!showDevLogin ? (
            <button
              onClick={() => setShowDevLogin(true)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.65rem 1rem",
                borderRadius: 12,
                border: "1px solid rgba(107,113,148,0.15)",
                backgroundColor: "transparent",
                color: "var(--on-surface-variant)",
                fontFamily: "var(--font-label)",
                fontWeight: 600,
                fontSize: "0.82rem",
                cursor: "pointer",
                transition: "all 140ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--surface-container-low)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <KeyRound size={15} />
              Platform Admin Login
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <input
                type="email"
                placeholder="Platform admin email"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDevLogin()}
                autoFocus
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  borderRadius: 10,
                  border: "1px solid rgba(107,113,148,0.2)",
                  backgroundColor: "var(--surface-container-low)",
                  color: "var(--on-surface)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.85rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={handleDevLogin}
                disabled={isLoading || !devEmail.trim()}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.65rem 1rem",
                  borderRadius: 10,
                  border: "none",
                  background:
                    "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                  color: "white",
                  fontFamily: "var(--font-label)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: isLoading ? "wait" : "pointer",
                  opacity: isLoading || !devEmail.trim() ? 0.6 : 1,
                  transition: "opacity 140ms ease",
                }}
              >
                <KeyRound size={15} />
                {isLoading ? "Signing in…" : "Sign in as Admin"}
              </button>
            </div>
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

        {/* Admin access */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "1.5rem",
          }}
        >
          <button
            onClick={() => navigate("/admin")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "none",
              border: "none",
              color: "var(--on-surface-variant)",
              fontSize: "0.72rem",
              fontWeight: 600,
              fontFamily: "var(--font-label)",
              cursor: "pointer",
              opacity: 0.7,
              transition: "opacity 140ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            <Settings size={12} />
            Platform Admin
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

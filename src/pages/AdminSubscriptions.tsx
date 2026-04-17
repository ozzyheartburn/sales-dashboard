import { useState } from "react";
import { motion } from "motion/react";
import {
  CreditCard,
  Check,
  Zap,
  Crown,
  Building2,
  Sparkles,
} from "lucide-react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    icon: Zap,
    color: "var(--on-surface-variant)",
    bg: "rgba(167,176,222,0.08)",
    features: [
      "1 user",
      "Basic account view",
      "Manual data entry only",
      "No research agents",
      "Community support",
    ],
    limits: { users: 1, accounts: 25, research: 0, agents: 0 },
  },
  {
    id: "starter",
    name: "Starter",
    price: 49,
    icon: CreditCard,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    features: [
      "Up to 5 users",
      "Research Hub access",
      "3 research runs / month",
      "Basic agent prompts",
      "Email support",
    ],
    limits: { users: 5, accounts: 100, research: 3, agents: 3 },
  },
  {
    id: "pro",
    name: "Pro",
    price: 199,
    icon: Crown,
    color: "var(--secondary-brand)",
    bg: "rgba(78,69,228,0.08)",
    popular: true,
    features: [
      "Up to 25 users",
      "Full Research Hub + War Room",
      "Unlimited research runs",
      "All 8 specialist agents",
      "Custom prompt templates",
      "Priority support",
    ],
    limits: { users: 25, accounts: 500, research: -1, agents: 8 },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 499,
    icon: Building2,
    color: "var(--tertiary)",
    bg: "rgba(135,32,222,0.08)",
    features: [
      "Unlimited users",
      "All modules included",
      "Unlimited research runs",
      "All agents + custom agents",
      "Full prompt customization",
      "Agent Swarm access",
      "Dedicated support + SLA",
      "SSO & audit logs",
    ],
    limits: { users: -1, accounts: -1, research: -1, agents: -1 },
  },
];

const MODULE_ACCESS: Record<string, Record<string, boolean>> = {
  free: {
    "Territory Overview": true,
    "Research Hub": false,
    "War Room": false,
    "Agent Swarm": false,
    "Analytics & Automation": false,
  },
  starter: {
    "Territory Overview": true,
    "Research Hub": true,
    "War Room": false,
    "Agent Swarm": false,
    "Analytics & Automation": false,
  },
  pro: {
    "Territory Overview": true,
    "Research Hub": true,
    "War Room": true,
    "Agent Swarm": false,
    "Analytics & Automation": true,
  },
  enterprise: {
    "Territory Overview": true,
    "Research Hub": true,
    "War Room": true,
    "Agent Swarm": true,
    "Analytics & Automation": true,
  },
};

export function AdminSubscriptions() {
  const [selectedPlan, setSelectedPlan] = useState("pro");

  return (
    <div style={{ padding: "2rem", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ marginBottom: "2rem" }}
      >
        <h1
          style={{
            fontFamily: "var(--font-headline)",
            fontWeight: 800,
            fontSize: "1.5rem",
            color: "var(--on-background)",
            marginBottom: 4,
          }}
        >
          Subscription Plans
        </h1>
        <p
          style={{
            fontSize: "0.82rem",
            color: "var(--on-surface-variant)",
            fontFamily: "var(--font-body)",
          }}
        >
          Manage plan tiers, module access, and agent limits
        </p>
      </motion.div>

      {/* Plan Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {PLANS.map((plan, i) => {
          const Icon = plan.icon;
          const isSelected = selectedPlan === plan.id;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              onClick={() => setSelectedPlan(plan.id)}
              className="luminous-shadow"
              style={{
                borderRadius: "1rem",
                padding: "1.25rem",
                backgroundColor: "var(--surface-container-lowest)",
                cursor: "pointer",
                border: isSelected
                  ? `2px solid ${plan.color}`
                  : "2px solid transparent",
                position: "relative",
                transition: "border-color 0.2s",
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    right: 16,
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-label)",
                    padding: "0.15rem 0.6rem",
                    borderRadius: 9999,
                    background:
                      "linear-gradient(135deg, var(--tertiary), var(--secondary-brand))",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Sparkles size={10} /> Most Popular
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: plan.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={18} color={plan.color} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-headline)",
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: "var(--on-background)",
                    }}
                  >
                    {plan.name}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <span
                  style={{
                    fontFamily: "var(--font-headline)",
                    fontWeight: 800,
                    fontSize: "1.8rem",
                    color: "var(--on-background)",
                  }}
                >
                  €{plan.price}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--on-surface-variant)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {plan.price > 0 ? " / mo per company" : ""}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {plan.features.map((f) => (
                  <div
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: "0.75rem",
                      color: "var(--on-surface)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    <Check size={14} color={plan.color} />
                    {f}
                  </div>
                ))}
              </div>

              {/* Limits */}
              <div
                style={{
                  marginTop: 16,
                  padding: "10px 0",
                  borderTop: "1px solid rgba(167,176,222,0.08)",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {Object.entries(plan.limits).map(([k, v]) => (
                  <span
                    key={k}
                    style={{
                      fontSize: "0.6rem",
                      borderRadius: 9999,
                      padding: "0.1rem 0.5rem",
                      fontWeight: 600,
                      fontFamily: "var(--font-label)",
                      background: "rgba(167,176,222,0.08)",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    {k}: {v === -1 ? "∞" : v}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Module Access Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.35 }}
        className="luminous-shadow"
        style={{
          borderRadius: "1rem",
          backgroundColor: "var(--surface-container-lowest)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid rgba(167,176,222,0.08)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-headline)",
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--on-background)",
            }}
          >
            Module Access by Plan
          </h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8rem",
              fontFamily: "var(--font-body)",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgba(167,176,222,0.08)",
                }}
              >
                <th
                  style={{
                    padding: "12px 14px",
                    textAlign: "left",
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    color: "var(--on-surface-variant)",
                    fontFamily: "var(--font-label)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Module
                </th>
                {PLANS.map((p) => (
                  <th
                    key={p.id}
                    style={{
                      padding: "12px 14px",
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      color: "var(--on-surface-variant)",
                      fontFamily: "var(--font-label)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(MODULE_ACCESS.free).map((mod) => (
                <tr
                  key={mod}
                  style={{
                    borderBottom: "1px solid rgba(167,176,222,0.04)",
                  }}
                >
                  <td
                    style={{
                      padding: "12px 14px",
                      fontWeight: 600,
                      color: "var(--on-surface)",
                    }}
                  >
                    {mod}
                  </td>
                  {PLANS.map((p) => (
                    <td
                      key={p.id}
                      style={{ padding: "12px 14px", textAlign: "center" }}
                    >
                      {MODULE_ACCESS[p.id][mod] ? (
                        <Check size={16} color="#22c55e" />
                      ) : (
                        <span
                          style={{
                            color: "var(--on-surface-variant)",
                            fontSize: "0.75rem",
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

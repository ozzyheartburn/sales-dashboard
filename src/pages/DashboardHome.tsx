import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Clock, Sparkles, Building2, Target, Users, DollarSign,
  RefreshCw, ChevronRight, Zap, BarChart3, FileSearch,
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LabelList,
} from "recharts";

const priorityAlerts = [
  {
    id: 1, severity: "medium",
    title: "Bestseller — Stakeholder coverage gap",
    detail: "You have identified only 3 potential stakeholders at Bestseller, and none of them have a mobile number in the notes.",
    owner: "AI", since: "Just now", action: "Go to Org Chart",
    link: "/dashboard/research-hub", externalLink: false,
  },
  {
    id: 2, severity: "high",
    title: "RevolutionRace hired Peter Jansson as new CTO",
    detail: "Your target account RevolutionRace hired Peter Jansson on 1st November as their new CTO with a main task of future-proofing ecommerce tech stack.",
    owner: "AI", since: "2d ago", action: "View LinkedIn Profile",
    link: "https://linkedin.com/in/janssonpeter", externalLink: true,
  },
  {
    id: 3, severity: "medium",
    title: "Nordics ecommerce growth — P1 accounts outperforming peers",
    detail: "The Nordics ecommerce market is growing at 10–14% annually. Your P1 accounts Nemlig, Matas Group and SOK significantly outperform against their peers.",
    owner: "AI", since: "Today", action: "View Research Hub",
    link: "/dashboard/research-hub", externalLink: false,
  },
  {
    id: 4, severity: "high",
    title: "No meetings in 2 weeks — Onninen & Helly Hansen",
    detail: "You haven't had any meetings during the last 2 weeks with Onninen and Helly Hansen. I have built a new value-based point of view to help.",
    owner: "AI", since: "14d", action: "Link to POV Document",
    link: "/dashboard/research-hub", externalLink: false,
  },
];

const kpis = [
  { label: "Active Accounts in PG Machine", value: "4", change: "in motion this quarter", dir: "neutral", icon: Building2, gradient: true },
  { label: "Value Pyramid + Org Chart Completed", value: "3", change: "+1 this week", dir: "up", icon: FileSearch },
  { label: "Champion, EB & Coach Contacts", value: "17", change: "high value contacts", dir: "up", icon: Users },
  { label: "Opportunities Created", value: "2", change: "$928K pipeline", dir: "up", icon: Target },
  { label: "Opportunity Qualification Ratio", value: "66%", change: "2 of 3 researches", dir: "up", icon: CheckCircle2 },
];

const pipelineHealthData = [
  { quarter: "Q1 FY26", commit: 430, mostLikely: 0, bestCase: 0, total: 430 },
  { quarter: "Q2 FY26", commit: 0, mostLikely: 670, bestCase: 590, total: 1260 },
  { quarter: "Q3 FY26", commit: 0, mostLikely: 300, bestCase: 630, total: 930 },
  { quarter: "Q4 FY26", commit: 0, mostLikely: 0, bestCase: 3600, total: 3600 },
];

const pipelineSourceData = [
  { quarter: "Q1 FY26", sdr: 215, partner: 215, event: 0, selfSourced: 0 },
  { quarter: "Q2 FY26", sdr: 466, partner: 794, event: 0, selfSourced: 0 },
  { quarter: "Q3 FY26", sdr: 605, partner: 0, event: 0, selfSourced: 325 },
  { quarter: "Q4 FY26", sdr: 3600, partner: 0, event: 0, selfSourced: 0 },
];

const formatTick = (v: number) => v === 0 ? "$0" : v >= 1000 ? `$${(v/1000).toFixed(1)}M` : `$${v}k`;
const formatVal = (v: number) => v >= 1000 ? `$${(v/1000).toFixed(2)}M` : `$${v}k`;

const dealActionQueue = [
  { id: 1, account: "Acme Corp", action: "Identify Economic Buyer before QBR", priority: "P0", status: "Overdue", owner: "AJ", value: "$840K" },
  { id: 2, account: "DataSystems", action: "Champion health critical — exec touchpoint", priority: "P0", status: "Blocked", owner: "SR", value: "$1.1M" },
  { id: 3, account: "TechVentures", action: "Document Decision Process in MEDDIC", priority: "P1", status: "In Progress", owner: "AJ", value: "$320K" },
  { id: 4, account: "FinCorp", action: "Missing Identified Pain — update discovery notes", priority: "P1", status: "Todo", owner: "MC", value: "$480K" },
  { id: 5, account: "GlobalTech", action: "Competitive displacement — share battlecard", priority: "P1", status: "Todo", owner: "TK", value: "$680K" },
  { id: 6, account: "NewCo", action: "Update MEDDIC qualification score", priority: "P2", status: "Todo", owner: "AJ", value: "$210K" },
];

const aiActivityFeed = [
  { icon: Sparkles, color: "var(--tertiary)", text: "AI detected champion change at Acme Corp — deal risk elevated", time: "4m ago", ai: true },
  { icon: AlertTriangle, color: "var(--error)", text: "DataSystems deal health score dropped from 7.2 → 4.1", time: "14m ago", ai: false },
  { icon: TrendingUp, color: "#22c55e", text: "TechVentures MEDDIC score improved to 7.8 after discovery call", time: "32m ago", ai: false },
  { icon: Sparkles, color: "var(--tertiary)", text: "AI forecast: Q1 gap of $1.2M — 3 deals recommended for acceleration", time: "1h ago", ai: true },
  { icon: Users, color: "var(--primary)", text: "SR updated champion map for FinCorp with 2 new stakeholders", time: "2h ago", ai: false },
  { icon: CheckCircle2, color: "#22c55e", text: "GlobalCo deal advanced to Negotiate stage — $920K ARR", time: "3h ago", ai: false },
];

const sevStyle: Record<string, { bg: string; dot: string; badge: { bg: string; color: string } }> = {
  high: { bg: "rgba(172,49,73,0.06)", dot: "#f59e0b", badge: { bg: "var(--error)", color: "#fff" } },
  medium: { bg: "rgba(245,158,11,0.06)", dot: "#f59e0b", badge: { bg: "rgba(245,158,11,0.12)", color: "#b45309" } },
};

const statusStyle: Record<string, { bg: string; color: string }> = {
  "In Progress": { bg: "rgba(18,74,241,0.1)", color: "var(--primary)" },
  "Todo": { bg: "var(--surface-container-high)", color: "var(--on-surface-variant)" },
  "Blocked": { bg: "rgba(172,49,73,0.1)", color: "var(--error)" },
  "Overdue": { bg: "rgba(172,49,73,0.15)", color: "var(--error)" },
};

const priorityStyle: Record<string, { bg: string; color: string }> = {
  P0: { bg: "var(--error)", color: "#fff" },
  P1: { bg: "#f59e0b", color: "#fff" },
  P2: { bg: "var(--primary)", color: "#fff" },
};

export function DashboardHome() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const activeAlerts = priorityAlerts.filter(a => !dismissed.includes(a.id));

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1440, margin: '0 auto', minHeight: '100vh', backgroundColor: 'var(--background)', fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--on-background)', letterSpacing: '-0.02em' }}>
            Good morning, Alex 👋
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>
            Your digital war room is live — Q1 close is in 6 weeks.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={handleRefresh} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '0.75rem',
            backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)',
            fontSize: '0.875rem', fontFamily: 'var(--font-headline)', fontWeight: 600,
            border: '1px solid rgba(167,176,222,0.1)',
          }}>
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.9s linear' : 'none' }} />
            Refresh
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1.25rem', borderRadius: '9999px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dim))',
            color: 'var(--on-primary)', fontSize: '0.875rem',
            fontFamily: 'var(--font-headline)', fontWeight: 700,
            boxShadow: '0 4px 20px rgba(18,74,241,0.2)',
          }}>
            <BarChart3 size={14} />
            Q1 Forecast
          </button>
        </div>
      </div>

      {/* AI Insight Banner */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="ai-card-glow"
        style={{ borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', backgroundColor: 'rgba(211,166,255,0.07)', border: '1px solid rgba(211,166,255,0.15)', marginBottom: '2rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--tertiary), var(--secondary-brand))',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Sparkles size={18} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontFamily: 'var(--font-label)', fontWeight: 700, fontSize: '0.6rem', color: 'var(--tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Insight</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)' }}>Just now</span>
          </div>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--on-background)', fontFamily: 'var(--font-headline)' }}>
            Key action points for this week to drive pipeline & revenue
          </p>
          <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
            Schedule champion touchpoints at Acme Corp and DataSystems to protect $1.96M in Q1 ARR. Complete Economic Buyer mapping for 2 key accounts. Close MEDDIC gaps on 4 additional deals to advance pipeline velocity.
          </p>
        </div>
        <button style={{
          flexShrink: 0, padding: '0.5rem 1rem', borderRadius: '9999px',
          background: 'linear-gradient(135deg, var(--tertiary), var(--secondary-brand))',
          color: '#fff', fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.8rem',
        }}>
          Review Action Items
        </button>
      </motion.div>

      {/* KPI Cards */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1rem', color: 'var(--on-background)', marginBottom: '1rem' }}>Key Metrics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {kpis.map((kpi, i) => (
            <motion.div key={kpi.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.07 }}
              className="luminous-shadow"
              style={{
                borderRadius: '1rem', padding: '1.25rem',
                background: kpi.gradient ? 'linear-gradient(135deg, var(--primary), var(--secondary-brand))' : 'var(--surface-container-lowest)',
              }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', backgroundColor: kpi.gradient ? 'rgba(255,255,255,0.15)' : 'var(--surface-container-low)' }}>
                <kpi.icon size={16} color={kpi.gradient ? '#fff' : 'var(--primary)'} />
              </div>
              <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '1.75rem', lineHeight: 1, color: kpi.gradient ? '#fff' : 'var(--on-background)', marginBottom: 4 }}>{kpi.value}</div>
              <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.72rem', fontWeight: 600, color: kpi.gradient ? 'rgba(250,248,255,0.8)' : 'var(--on-surface-variant)', marginBottom: 8 }}>{kpi.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {kpi.dir === 'up' && <TrendingUp size={11} color={kpi.gradient ? 'rgba(255,255,255,0.7)' : '#22c55e'} />}
                {kpi.dir === 'neutral' && <Clock size={11} color="var(--on-surface-variant)" />}
                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-label)', color: kpi.gradient ? 'rgba(255,255,255,0.7)' : kpi.dir === 'up' ? '#22c55e' : 'var(--on-surface-variant)' }}>{kpi.change}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Priority Alerts */}
      {activeAlerts.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle size={15} color="var(--error)" />
            <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1rem', color: 'var(--on-background)' }}>Priority Alerts</h2>
            <span style={{ backgroundColor: 'rgba(172,49,73,0.1)', color: 'var(--error)', fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--font-label)', borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>{activeAlerts.length} active</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '0.75rem' }}>
            {activeAlerts.map((alert, i) => {
              const sev = sevStyle[alert.severity as keyof typeof sevStyle] || sevStyle.medium;
              return (
                <motion.div key={alert.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="luminous-shadow"
                  style={{ borderRadius: '1rem', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', backgroundColor: sev.bg }}>
                  <div style={{ marginTop: 6, width: 10, height: 10, borderRadius: '50%', flexShrink: 0, backgroundColor: sev.dot }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{ ...sev.badge, fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--font-label)', borderRadius: '9999px', padding: '0.1rem 0.5rem' }}>{alert.severity.toUpperCase()}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>{alert.owner} · {alert.since}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)', fontFamily: 'var(--font-headline)' }}>{alert.title}</p>
                    <p style={{ marginTop: '0.2rem', fontSize: '0.78rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{alert.detail}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
                    {alert.externalLink ? (
                      <a href={alert.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-headline)' }}>
                        {alert.action} <ChevronRight size={11} />
                      </a>
                    ) : (
                      <button onClick={() => navigate(alert.link)} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-headline)' }}>
                        {alert.action} <ChevronRight size={11} />
                      </button>
                    )}
                    <button onClick={() => setDismissed(d => [...d, alert.id])} style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>Dismiss</button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Pipeline Health */}
        <div className="luminous-shadow" style={{ borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'var(--surface-container-lowest)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1rem', color: 'var(--on-background)' }}>Pipeline Health & Coverage</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>FY2026 · Quarterly forecast view</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
              <span style={{ backgroundColor: 'var(--surface-container-low)', color: 'var(--on-surface-variant)', fontSize: '0.72rem', fontFamily: 'var(--font-label)', fontWeight: 600, borderRadius: '9999px', padding: '0.2rem 0.75rem' }}>$6.2M total</span>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.3rem 0.75rem', borderRadius: '9999px', background: 'linear-gradient(135deg, var(--tertiary), var(--secondary-brand))', color: '#fff', fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.72rem', boxShadow: '0 2px 12px rgba(135,32,222,0.25)' }}>
                <Sparkles size={11} /> Ask AI
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, marginTop: 12 }}>
            {[{ label: 'Commit', color: '#124af1' }, { label: 'Most Likely', color: '#4e45e4' }, { label: 'Best Case', color: '#8720de' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: l.color }} />
                <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.68rem', color: 'var(--on-surface-variant)' }}>{l.label}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={pipelineHealthData} barCategoryGap="32%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,176,222,0.15)" vertical={false} />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: 'var(--on-surface-variant)', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatTick} tick={{ fontSize: 10, fill: 'var(--on-surface-variant)', fontFamily: 'Inter' }} width={44} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value, name) => { const v = Number(value ?? 0); return [v > 0 ? `$${v}k` : "—", String(name)]; }}
                contentStyle={{ fontSize: '0.78rem', borderRadius: 12, border: 'none', backgroundColor: 'var(--surface-container-lowest)', boxShadow: '0 8px 32px rgba(39,48,87,0.12)', color: 'var(--on-surface)', fontFamily: 'Inter' }}
                labelStyle={{ fontFamily: 'var(--font-headline)', fontWeight: 700, color: 'var(--on-background)', marginBottom: 4 }} />
              <Bar stackId="ph" dataKey="commit" name="Commit" fill="#124af1" radius={[0,0,0,0]} />
              <Bar stackId="ph" dataKey="mostLikely" name="Most Likely" fill="#4e45e4" radius={[0,0,0,0]} />
              <Bar stackId="ph" dataKey="bestCase" name="Best Case" fill="#8720de" radius={[4,4,0,0]}>
                <LabelList dataKey="total" position="top" content={(props: any) => {
                  const { x, y, width, value } = props;
                  if (!value) return null;
                  return <text x={Number(x)+Number(width)/2} y={Number(y)-5} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--on-surface-variant)" fontFamily="Inter">{formatVal(value)}</text>;
                }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Source */}
        <div className="luminous-shadow" style={{ borderRadius: '1rem', padding: '1.5rem', backgroundColor: 'var(--surface-container-lowest)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1rem', color: 'var(--on-background)' }}>Pipeline Source</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>FY2026 · By origination channel</p>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.3rem 0.75rem', borderRadius: '9999px', background: 'linear-gradient(135deg, var(--tertiary), var(--secondary-brand))', color: '#fff', fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.72rem', boxShadow: '0 2px 12px rgba(135,32,222,0.25)', flexShrink: 0, marginLeft: 8 }}>
              <Sparkles size={11} /> Pipeline advice
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, marginTop: 12, flexWrap: 'wrap' }}>
            {[{ label: 'SDR', color: '#124af1' }, { label: 'Partner', color: '#4e45e4' }, { label: 'Event', color: '#06b6d4' }, { label: 'Self Sourced', color: '#f59e0b' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: l.color }} />
                <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.68rem', color: 'var(--on-surface-variant)' }}>{l.label}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={pipelineSourceData} barCategoryGap="32%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,176,222,0.15)" vertical={false} />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: 'var(--on-surface-variant)', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatTick} tick={{ fontSize: 10, fill: 'var(--on-surface-variant)', fontFamily: 'Inter' }} width={44} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value, name) => { const v = Number(value ?? 0); return [v > 0 ? `$${v}k` : "—", String(name)]; }}
                contentStyle={{ fontSize: '0.78rem', borderRadius: 12, border: 'none', backgroundColor: 'var(--surface-container-lowest)', boxShadow: '0 8px 32px rgba(39,48,87,0.12)', color: 'var(--on-surface)', fontFamily: 'Inter' }}
                labelStyle={{ fontFamily: 'var(--font-headline)', fontWeight: 700, color: 'var(--on-background)', marginBottom: 4 }} />
              <Bar stackId="ps" dataKey="sdr" name="SDR" fill="#124af1" radius={[0,0,0,0]} />
              <Bar stackId="ps" dataKey="partner" name="Partner" fill="#4e45e4" radius={[0,0,0,0]} />
              <Bar stackId="ps" dataKey="event" name="Event" fill="#06b6d4" radius={[0,0,0,0]} />
              <Bar stackId="ps" dataKey="selfSourced" name="Self Sourced" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Deal Queue + AI Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Deal Action Queue */}
        <div className="luminous-shadow" style={{ borderRadius: '1rem', overflow: 'hidden', backgroundColor: 'var(--surface-container-lowest)' }}>
          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--surface-container-low)' }}>
            <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1rem', color: 'var(--on-background)' }}>Deal Action Queue</h3>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)' }}>
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div>
            {dealActionQueue.map((task, i) => (
              <motion.div key={task.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                style={{ padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: i < dealActionQueue.length - 1 ? '1px solid var(--surface-container-low)' : 'none', cursor: 'pointer', transition: 'background 140ms' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--surface-container-low)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
                <span style={{ ...priorityStyle[task.priority], fontSize: '0.6rem', fontFamily: 'var(--font-label)', fontWeight: 700, borderRadius: 4, padding: '0.1rem 0.4rem', flexShrink: 0 }}>{task.priority}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="truncate" style={{ fontFamily: 'var(--font-headline)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--on-surface)' }}>{task.account}</p>
                  <p className="truncate" style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{task.action}</p>
                </div>
                <span style={{ ...statusStyle[task.status], fontSize: '0.65rem', fontFamily: 'var(--font-label)', fontWeight: 600, borderRadius: '9999px', padding: '0.15rem 0.6rem', flexShrink: 0 }}>{task.status}</span>
                <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)', flexShrink: 0 }}>{task.value}</span>
                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--secondary-container)', color: 'var(--on-secondary-container)', fontFamily: 'var(--font-label)', fontWeight: 700, fontSize: '0.6rem', flexShrink: 0 }}>{task.owner}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Activity Feed */}
        <div className="luminous-shadow" style={{ borderRadius: '1rem', overflow: 'hidden', backgroundColor: 'var(--surface-container-lowest)' }}>
          <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--surface-container-low)' }}>
            <Sparkles size={15} color="var(--tertiary)" />
            <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1rem', color: 'var(--on-background)' }}>AI Activity</h3>
          </div>
          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {aiActivityFeed.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: a.ai ? 'rgba(211,166,255,0.15)' : 'var(--surface-container-low)' }}>
                  <a.icon size={13} color={a.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--on-surface)', lineHeight: 1.5 }}>{a.text}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    {a.ai && <span style={{ backgroundColor: 'rgba(135,32,222,0.1)', color: 'var(--tertiary)', fontSize: '0.55rem', fontFamily: 'var(--font-label)', fontWeight: 700, borderRadius: '9999px', padding: '0.1rem 0.4rem' }}>AI</span>}
                    <p style={{ fontFamily: 'var(--font-label)', fontSize: '0.68rem', color: 'var(--on-surface-variant)' }}>{a.time}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '1rem', color: 'var(--on-background)', marginBottom: '1rem' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { icon: Target, label: 'Update MEDDIC Score', sub: '7 deals pending', color: 'var(--primary)', bg: 'rgba(18,74,241,0.06)' },
            { icon: Zap, label: 'Run AI Playbook', sub: 'Champion re-engagement', color: 'var(--tertiary)', bg: 'rgba(135,32,222,0.06)' },
            { icon: Users, label: 'Map Stakeholders', sub: 'Acme Corp', color: 'var(--secondary-brand)', bg: 'rgba(78,69,228,0.06)' },
            { icon: DollarSign, label: 'Submit Q1 Forecast', sub: 'Due Friday', color: '#22c55e', bg: 'rgba(34,197,94,0.06)' },
          ].map((qa, i) => (
            <button key={i}
              style={{ borderRadius: '1rem', padding: '1.25rem', textAlign: 'left', backgroundColor: 'var(--surface-container-lowest)', boxShadow: '0 2px 12px rgba(39,48,87,0.04)', transition: 'background 140ms', border: '1px solid rgba(167,176,222,0.05)', width: '100%' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = qa.bg; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--surface-container-lowest)'; }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', backgroundColor: qa.bg }}>
                <qa.icon size={18} color={qa.color} />
              </div>
              <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--on-surface)' }}>{qa.label}</p>
              <p style={{ marginTop: '0.125rem', fontFamily: 'var(--font-label)', fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>{qa.sub}</p>
            </button>
          ))}
        </div>
      </section>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

import { motion } from "motion/react";
import { Search, Building2, TrendingUp, Star } from "lucide-react";

const accounts = [
  { name: "Nemlig", country: "🇩🇰 Denmark", priority: "P1", score: 92, growth: "+18%", status: "Active" },
  { name: "Matas Group", country: "🇩🇰 Denmark", priority: "P1", score: 88, growth: "+14%", status: "Active" },
  { name: "SOK", country: "🇫🇮 Finland", priority: "P1", score: 85, growth: "+11%", status: "Active" },
  { name: "Onninen", country: "🇫🇮 Finland", priority: "P2", score: 74, growth: "+9%", status: "At Risk" },
  { name: "Helly Hansen", country: "🇳🇴 Norway", priority: "P2", score: 71, growth: "+7%", status: "At Risk" },
  { name: "Bestseller", country: "🇩🇰 Denmark", priority: "P2", score: 68, growth: "+12%", status: "Researching" },
];

export function ResearchHub() {
  return (
    <div style={{ padding: '1.5rem', maxWidth: 1440, margin: '0 auto', minHeight: '100vh', backgroundColor: 'var(--background)', fontFamily: 'var(--font-body)' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--on-background)', letterSpacing: '-0.02em' }}>Research Hub</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>Account intelligence & org charts for your target accounts.</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 400 }}>
        <Search size={14} color="var(--on-surface-variant)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input placeholder="Search accounts..." style={{ width: '100%', padding: '0.625rem 0.875rem 0.625rem 2.5rem', borderRadius: '0.75rem', border: '1px solid rgba(167,176,222,0.15)', backgroundColor: 'var(--surface-container-lowest)', color: 'var(--on-surface)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none' }} />
      </div>

      {/* Account Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {accounts.map((acc, i) => (
          <motion.div key={acc.name}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}
            className="luminous-shadow"
            style={{ borderRadius: '1rem', padding: '1.25rem', backgroundColor: 'var(--surface-container-lowest)', cursor: 'pointer', border: '1px solid rgba(167,176,222,0.05)', transition: 'border-color 140ms' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(18,74,241,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(167,176,222,0.05)'; }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), var(--secondary-brand))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} color="#fff" />
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--on-background)' }}>{acc.name}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>{acc.country}</p>
                </div>
              </div>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--font-label)', borderRadius: 4, padding: '0.15rem 0.5rem',
                backgroundColor: acc.priority === 'P1' ? 'var(--error)' : '#f59e0b',
                color: '#fff'
              }}>{acc.priority}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Star size={11} color="#f59e0b" fill="#f59e0b" />
                  <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--on-background)' }}>{acc.score}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)' }}>priority score</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TrendingUp size={11} color="#22c55e" />
                  <span style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 600 }}>{acc.growth} YoY</span>
                </div>
              </div>
              <span style={{
                fontSize: '0.7rem', fontFamily: 'var(--font-label)', fontWeight: 600, borderRadius: '9999px', padding: '0.2rem 0.75rem',
                backgroundColor: acc.status === 'Active' ? 'rgba(34,197,94,0.1)' : acc.status === 'At Risk' ? 'rgba(172,49,73,0.1)' : 'rgba(18,74,241,0.1)',
                color: acc.status === 'Active' ? '#22c55e' : acc.status === 'At Risk' ? 'var(--error)' : 'var(--primary)'
              }}>{acc.status}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

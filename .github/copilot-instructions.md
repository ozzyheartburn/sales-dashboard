# Copilot Instructions — Sales Intelligence Dashboard

## Design System
Always use CSS variables — never hardcode hex values.

### Color Tokens
- `var(--primary)` → blue, buttons, links, active nav
- `var(--secondary-brand)` → indigo, secondary accents
- `var(--tertiary)` → purple, AI elements & gradients
- `var(--error)` → red, alerts, P0 priority badges
- `var(--background)` → page background
- `var(--surface-container-lowest)` → card background
- `var(--surface-container-low)` → card headers, row hover
- `var(--on-background)` → primary heading text
- `var(--on-surface)` → body text
- `var(--on-surface-variant)` → muted/secondary text

### AI Gradient (purple-to-indigo)
```css
background: linear-gradient(135deg, var(--tertiary), var(--secondary-brand))
```
Use on: AI insight banners, "Ask AI" buttons, AI activity icons.

### Card Pattern
```tsx
<div className="luminous-shadow" style={{
  borderRadius: '1rem',
  padding: '1.25rem',
  backgroundColor: 'var(--surface-container-lowest)'
}}>
```

### Animation Pattern (motion/react)
```tsx
// Staggered card entry
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35, delay: index * 0.07 }}
>
```

### Recharts Chart Pattern
- Bar colors: #124af1 → #4e45e4 → #8720de → #06b6d4 → #f59e0b
- CartesianGrid: stroke="rgba(167,176,222,0.15)" vertical={false}
- XAxis/YAxis: axisLine={false} tickLine={false}
- Tooltip contentStyle: borderRadius 12, no border, bg var(--surface-container-lowest)

### Typography
- Headings: fontFamily var(--font-headline), fontWeight 700-800
- Body: fontFamily var(--font-body)
- Badges/labels: fontFamily var(--font-label), fontWeight 600-700

### Badge Sizes
- Status badge: fontSize 0.65rem, borderRadius 9999px, padding 0.15rem 0.6rem
- Priority badge (P0/P1): fontSize 0.6rem, borderRadius 4px
- Alert severity: fontSize 0.65rem, borderRadius 9999px

## Adding a New Page
1. Create `src/pages/NewPage.tsx` with a named export function
2. Add route in `src/App.tsx` under the `/dashboard` Route
3. Add nav item in `src/components/AppLayout.tsx` navItems array
4. Import a Lucide icon for the nav item

## Tech Stack
- React 18 + TypeScript (strict mode)
- React Router DOM v7 (useNavigate, useLocation, Outlet)
- motion/react for animations (NOT framer-motion directly)
- Recharts for all data visualization
- Lucide React for icons (never use emoji as icons in UI)

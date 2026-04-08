import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { DashboardHome } from './pages/DashboardHome'
import { ResearchHub } from './pages/ResearchHub'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<AppLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="research-hub" element={<ResearchHub />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

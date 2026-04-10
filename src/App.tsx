import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { DashboardHome } from "./pages/DashboardHome";
import { ResearchHub } from "./pages/ResearchHub";
import { WarRoom } from "./pages/WarRoom";
import { AgentSwarm } from "./pages/AgentSwarm";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<AppLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="research-hub" element={<ResearchHub />} />
          <Route path="agent-swarm" element={<AgentSwarm />} />
          <Route path="war-room" element={<WarRoom />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// src/pages/Dashboard.js
import React from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SetupPage     from "./SetupPage";
import PlanPage      from "./PlanPage";
import MLPage        from "./MLPage";
import RLPage        from "./RLPage";
import AnalyticsPage from "./AnalyticsPage";
import ChatPage      from "./ChatPage";
import RewardsPage   from "./RewardsPage";

const NAV_ITEMS = [
  { path:"setup",     icon:"⚙",  label:"Setup" },
  { path:"plan",      icon:"📋", label:"Study Plan" },
  { path:"rewards",   icon:"🎮", label:"Rewards",  badge:"NEW" },
  { path:"ml",        icon:"🧠", label:"ML Models" },
  { path:"rl",        icon:"🎯", label:"RL Engine" },
  { path:"analytics", icon:"📊", label:"Analytics" },
  { path:"chat",      icon:"💬", label:"AI Chat",  badge:"LLM" }
];

export default function Dashboard() {
  const { student, logout } = useAuth();
  const nav      = useNavigate();
  const location = useLocation();
  const current  = location.pathname.split("/")[2] || "setup";

  return (
    <div style={{ display:"flex", minHeight:"100vh" }}>
      {/* SIDEBAR */}
      <aside style={{ width:220, background:"var(--bg2)", borderRight:"1px solid var(--border2)",
                      display:"flex", flexDirection:"column", position:"fixed",
                      top:0, left:0, height:"100vh", zIndex:100 }}>
        {/* Logo */}
        <div style={{ padding:"20px 18px 16px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, background:"linear-gradient(135deg,var(--accent),var(--accent2))",
                          borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:17, boxShadow:"0 0 16px rgba(79,142,247,0.3)" }}>🎓</div>
            <div>
              <div style={{ fontFamily:"var(--font2)", fontWeight:800, fontSize:16, lineHeight:1 }}>StudyAI</div>
              <div style={{ fontSize:10, color:"var(--text3)", marginTop:2 }}>Research Edition</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"12px 10px", display:"flex", flexDirection:"column", gap:3 }}>
          {NAV_ITEMS.map(item => {
            const active = current === item.path;
            return (
              <button key={item.path} onClick={() => nav(`/dashboard/${item.path}`)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
                         borderRadius:9, border:"none", cursor:"pointer", width:"100%",
                         textAlign:"left", transition:"all 0.2s", fontSize:13, fontWeight:500,
                         fontFamily:"var(--font)",
                         background: active ? "rgba(79,142,247,0.15)" : "transparent",
                         color:      active ? "var(--accent)" : "var(--text2)" }}>
                <span style={{ fontSize:15 }}>{item.icon}</span>
                <span style={{ flex:1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{ background: item.badge==="NEW"
                                  ? "linear-gradient(135deg,var(--accent3),#059669)"
                                  : "linear-gradient(135deg,var(--accent),var(--accent2))",
                                 color:"#fff", fontSize:9, padding:"2px 6px",
                                 borderRadius:20, fontWeight:700 }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding:"14px 16px", borderTop:"1px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:30, height:30, borderRadius:8,
                          background:"linear-gradient(135deg,var(--accent3),#059669)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:13, fontWeight:700, color:"#fff" }}>
              {student?.name?.[0]?.toUpperCase() || "S"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, overflow:"hidden",
                            textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {student?.name || "Student"}
              </div>
              <div style={{ fontSize:10, color:"var(--text3)" }}>
                {student?.studyLevel || "Student"}
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm btn-full" onClick={logout}>← Logout</button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft:220, flex:1, padding:"28px 30px", minWidth:0 }}>
        <Routes>
          <Route index               element={<SetupPage />} />
          <Route path="setup"        element={<SetupPage />} />
          <Route path="plan"         element={<PlanPage />} />
          <Route path="rewards"      element={<RewardsPage />} />
          <Route path="ml"           element={<MLPage />} />
          <Route path="rl"           element={<RLPage />} />
          <Route path="analytics"    element={<AnalyticsPage />} />
          <Route path="chat"         element={<ChatPage />} />
        </Routes>
      </main>
    </div>
  );
}

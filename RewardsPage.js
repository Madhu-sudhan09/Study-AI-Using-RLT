// src/pages/RewardsPage.js — Reward, Penalty & Reminder System
import React, { useState, useEffect, useCallback } from "react";
import { rewardAPI, taskAPI, studentAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

// ── Level config ─────────────────────────────────────────────
function getLevel(xp) {
  if (xp >= 500) return { level:5, title:"Study Master",   icon:"🏆", color:"#f59e0b", next:null };
  if (xp >= 300) return { level:4, title:"Expert Learner", icon:"🎯", color:"#7c3aed", next:500 };
  if (xp >= 150) return { level:3, title:"Active Student", icon:"📚", color:"#4f8ef7", next:300 };
  if (xp >= 50)  return { level:2, title:"Rising Scholar", icon:"⭐", color:"#10b981", next:150 };
  return               { level:1, title:"Beginner",        icon:"🌱", color:"#94a3b8", next:50  };
}

// ── Toast ─────────────────────────────────────────────────────
function Toast({ data, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  if (!data) return null;
  const pos = data.totalRLDelta >= 0;
  return (
    <div style={{ position:"fixed", top:20, right:20, zIndex:9999, minWidth:300, maxWidth:360,
                  background:"var(--bg2)", border:`2px solid ${pos?"var(--accent3)":"var(--accent5)"}`,
                  borderRadius:14, padding:"16px 18px", boxShadow:"0 8px 32px rgba(0,0,0,0.5)",
                  animation:"slideIn 0.3s ease" }}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <span style={{ fontWeight:700, fontSize:15, color: pos?"var(--accent3)":"var(--accent5)" }}>
          {pos ? "🎉 Reward Earned!" : "📉 Penalty Applied"}
        </span>
        <button onClick={onClose} style={{ background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:16 }}>✕</button>
      </div>
      {data.breakdown?.map((b,i) => (
        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 10px",
                              borderRadius:7, marginBottom:4, background:b.color+"18",
                              border:`1px solid ${b.color}33` }}>
          <span style={{ fontSize:12, color:b.color, fontWeight:600 }}>{b.label}</span>
          <span style={{ fontSize:12, fontWeight:700 }}>
            <span style={{ color:"var(--accent3)", marginRight:8 }}>{b.rl>0?"+":""}{b.rl} RL</span>
            <span style={{ color:"var(--accent4)" }}>{b.xp>0?"+":""}{b.xp} XP</span>
          </span>
        </div>
      ))}
      <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid var(--border)",
                    display:"flex", gap:16, justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:10, color:"var(--text3)" }}>TOTAL RL</div>
          <div style={{ fontSize:16, fontWeight:700, color:"var(--accent3)" }}>{data.totalRLReward?.toFixed(0)}</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:10, color:"var(--text3)" }}>TOTAL XP</div>
          <div style={{ fontSize:16, fontWeight:700, color:"var(--accent4)" }}>{data.totalXP}</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:10, color:"var(--text3)" }}>STREAK</div>
          <div style={{ fontSize:16, fontWeight:700, color:"var(--accent2)" }}>🔥{data.currentStreak}</div>
        </div>
      </div>
      {data.level && (
        <div style={{ marginTop:8, textAlign:"center", fontSize:12,
                      color:data.level.color||"var(--accent)" }}>
          {data.level.icon} Level {data.level.level} — {data.level.title}
        </div>
      )}
    </div>
  );
}

export default function RewardsPage() {
  const { student, refreshStudent } = useAuth();
  const [summary,    setSummary]    = useState(null);
  const [tasks,      setTasks]      = useState([]);
  const [reminders,  setReminders]  = useState([]);
  const [toast,      setToast]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [markInputs, setMarkInputs] = useState({});
  const [updatingMarks, setUpdatingMarks] = useState(false);
  const [dailyMsg,   setDailyMsg]   = useState(null);
  const [activeTab,  setActiveTab]  = useState("dashboard");

  const load = useCallback(async () => {
    try {
      const [s, t, r] = await Promise.all([
        rewardAPI.getSummary(),
        taskAPI.getAll(),
        rewardAPI.getReminders()
      ]);
      setSummary(s.data.summary);
      setTasks(t.data.tasks);
      setReminders(r.data.reminders || []);

      // Pre-fill mark inputs with current marks
      const inputs = {};
      student?.subjects?.forEach(sub => { inputs[sub.name] = sub.marks; });
      setMarkInputs(inputs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [student]);

  useEffect(() => { load(); }, [load]);

  // Task toggle with reward
  const handleTaskToggle = async (taskId) => {
    try {
      const res = await rewardAPI.taskToggle(taskId);
      const { task, reward } = res.data;
      setTasks(prev => prev.map(t => t._id === taskId ? task : t));
      setSummary(prev => prev ? {
        ...prev,
        totalXP:        reward.totalXP,
        totalRLReward:  reward.totalRLReward,
        currentStreak:  reward.currentStreak,
        completedTasks: reward.completedCount,
        completionRate: Math.round((reward.completedCount/reward.totalTasks)*100)
      } : prev);
      setToast(reward);
    } catch (e) { console.error(e); }
  };

  // Update marks and get reward/penalty
  const handleUpdateMarks = async () => {
    setUpdatingMarks(true);
    try {
      const subjects = student?.subjects?.map(s => ({
        name:  s.name,
        marks: +markInputs[s.name],
        total: s.total
      })) || [];

      const res = await rewardAPI.updateMarks(subjects);
      const d   = res.data;

      setToast({
        breakdown:     d.results.filter(r=>r.type!=="no_change").map(r => ({
          label: `${r.subject}: ${r.diff}`,
          rl:    r.rl, xp: r.xp,
          color: r.type==="reward" ? "#10b981" : "#ef4444"
        })),
        totalRLDelta:  d.totalRLDelta,
        totalXPDelta:  d.totalXPDelta,
        totalXP:       d.totalXP,
        totalRLReward: d.totalRLReward,
        currentStreak: summary?.currentStreak || 0,
        level:         d.level
      });

      await refreshStudent();
      await load();
    } catch (e) { console.error(e); }
    setUpdatingMarks(false);
  };

  // Generate reminders
  const handleSetReminders = async () => {
    try {
      const res = await rewardAPI.setReminders();
      setReminders(res.data.reminders);
    } catch (e) { console.error(e); }
  };

  // Daily check
  const handleDailyCheck = async () => {
    try {
      const res = await rewardAPI.dailyCheck();
      setDailyMsg(res.data);
      await load();
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", gap:12, color:"var(--text2)" }}>
      <span className="spinner"></span> Loading reward system...
    </div>
  );

  const lvl       = getLevel(summary?.totalXP || 0);
  const xpProg    = lvl.next ? Math.min(100, Math.round(((summary?.totalXP||0) / lvl.next) * 100)) : 100;
  const done      = tasks.filter(t => t.completed).length;
  const taskPct   = tasks.length ? Math.round((done/tasks.length)*100) : 0;
  const weakNames = student?.subjects?.filter(s=>(s.marks/s.total)*100<60).map(s=>s.name)||[];

  return (
    <div className="fade-up">
      {toast && <Toast data={toast} onClose={()=>setToast(null)} />}

      {/* Header */}
      <div className="sec-head">
        <div>
          <h2 style={{ fontSize:22, marginBottom:4 }}>🎮 Reward & Penalty System</h2>
          <p style={{ color:"var(--text2)", fontSize:13 }}>
            Complete tasks → earn XP & RL rewards · Miss tasks → penalties · Improve marks → bonus rewards
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleDailyCheck}>
          📋 Daily Check
        </button>
      </div>

      {/* Daily check result */}
      {dailyMsg && (
        <div className={`alert ${dailyMsg.penaltyApplied?"alert-danger":"alert-success"}`}
             style={{ marginBottom:16 }}>
          <span>{dailyMsg.penaltyApplied?"❌":"✅"}</span>
          <div>{dailyMsg.message} · Completion: {dailyMsg.completionRate}%</div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, background:"var(--bg3)", borderRadius:10,
                    padding:4, width:"fit-content", marginBottom:20 }}>
        {[["dashboard","📊 Dashboard"],["tasks","✅ Tasks"],["marks","📈 Update Marks"],["reminders","🔔 Reminders"],["history","📜 History"]].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)}
            style={{ padding:"8px 16px", borderRadius:7, border:"none", cursor:"pointer",
                     fontFamily:"var(--font)", fontSize:13, fontWeight:500, transition:"all 0.2s",
                     background: activeTab===id?"var(--accent)":"transparent",
                     color:      activeTab===id?"#fff":"var(--text2)" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: DASHBOARD ── */}
      {activeTab === "dashboard" && (
        <div>
          {/* Level Card */}
          <div className="card-elevated" style={{ marginBottom:20, background:"var(--bg2)",
                border:`1px solid ${lvl.color}44` }}>
            <div style={{ display:"flex", alignItems:"center", gap:20 }}>
              <div style={{ fontSize:56 }}>{lvl.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:"var(--text3)", textTransform:"uppercase",
                              letterSpacing:"0.8px", marginBottom:4 }}>Current Level</div>
                <div style={{ fontSize:24, fontWeight:800, fontFamily:"var(--font2)",
                              color:lvl.color, marginBottom:4 }}>
                  Level {lvl.level} — {lvl.title}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:8 }}>
                  <span style={{ fontSize:13, color:"var(--accent4)", fontWeight:700 }}>
                    {summary?.totalXP || 0} XP
                  </span>
                  {lvl.next && <span style={{ fontSize:12, color:"var(--text3)" }}>
                    Next level at {lvl.next} XP
                  </span>}
                </div>
                <div style={{ height:10, background:"var(--bg4)", borderRadius:5, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${xpProg}%`, background:lvl.color,
                                borderRadius:5, transition:"width 1s ease" }}></div>
                </div>
                {lvl.next && <div style={{ fontSize:11, color:"var(--text3)", marginTop:4 }}>
                  {xpProg}% to Level {lvl.level+1}
                </div>}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"flex-end" }}>
                <div style={{ textAlign:"center", padding:"10px 18px", background:"rgba(16,185,129,0.1)",
                              borderRadius:10, border:"1px solid rgba(16,185,129,0.25)" }}>
                  <div style={{ fontSize:11, color:"var(--text3)" }}>RL REWARD</div>
                  <div style={{ fontSize:22, fontWeight:700, color:"var(--accent3)" }}>
                    {(summary?.totalRLReward||0).toFixed(0)}
                  </div>
                </div>
                <div style={{ textAlign:"center", padding:"10px 18px", background:"rgba(124,58,237,0.1)",
                              borderRadius:10, border:"1px solid rgba(124,58,237,0.25)" }}>
                  <div style={{ fontSize:11, color:"var(--text3)" }}>STREAK</div>
                  <div style={{ fontSize:22, fontWeight:700, color:"var(--accent2)" }}>
                    🔥 {summary?.currentStreak||0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid4" style={{ marginBottom:20 }}>
            {[
              { label:"Tasks Done",     value:`${summary?.completedTasks||0}/${summary?.totalTasks||0}`, color:"blue" },
              { label:"Completion Rate",value:(summary?.completionRate||0)+"%",       color:"green" },
              { label:"Total Rewards",  value:summary?.totalRewards||0,               color:"amber" },
              { label:"Penalties",      value:summary?.totalPenalties||0,             color:"red" }
            ].map(s => (
              <div key={s.label} className={`stat-card ${s.color}`}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Reward table */}
          <div className="card-elevated">
            <div className="sec-title" style={{ marginBottom:14 }}>
              <span className="dot"></span> Reward & Penalty Table
            </div>
            {[
              { icon:"✅", event:"Complete a task",         rl:"+10", xp:"+20 XP", color:"var(--accent3)" },
              { icon:"⚡", event:"Weak subject task done",  rl:"+5",  xp:"+15 XP", color:"var(--accent4)" },
              { icon:"🔥", event:"3-task streak",           rl:"+5",  xp:"+10 XP", color:"var(--accent2)" },
              { icon:"🔥", event:"5-task streak",           rl:"+10", xp:"+20 XP", color:"var(--accent2)" },
              { icon:"🏆", event:"All tasks done",          rl:"+15", xp:"+50 XP", color:"var(--accent)" },
              { icon:"📈", event:"Marks improved 1–4%",     rl:"+10", xp:"+30 XP", color:"var(--accent3)" },
              { icon:"📈", event:"Marks improved 5–9%",     rl:"+20", xp:"+60 XP", color:"var(--accent3)" },
              { icon:"📈", event:"Marks improved 10%+",     rl:"+35", xp:"+100 XP",color:"var(--accent3)" },
              { icon:"🎯", event:"Weak subject passed 60%", rl:"+25", xp:"+75 XP", color:"var(--accent4)" },
              { icon:"❌", event:"Task unmarked",            rl:"-5",  xp:"-5 XP",  color:"var(--accent5)" },
              { icon:"📉", event:"Marks declined",           rl:"-10", xp:"-15 XP", color:"var(--accent5)" },
              { icon:"⚠️", event:"<50% tasks done (daily)", rl:"-8",  xp:"-10 XP", color:"var(--accent5)" },
            ].map((r,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"9px 0",
                                    borderBottom:"1px solid var(--border)" }}>
                <span style={{ fontSize:18, width:24, textAlign:"center" }}>{r.icon}</span>
                <span style={{ flex:1, fontSize:13 }}>{r.event}</span>
                <span style={{ fontWeight:700, color:r.color, minWidth:40, textAlign:"right" }}>{r.rl}</span>
                <span style={{ color:"var(--accent4)", fontSize:12, minWidth:60, textAlign:"right" }}>{r.xp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: TASKS ── */}
      {activeTab === "tasks" && (
        <div>
          <div className="sec-head" style={{ marginBottom:14 }}>
            <div className="sec-title"><span className="dot"></span>Daily Tasks — Click to Complete</div>
            <span className={`tag ${taskPct>=80?"tag-green":taskPct>=50?"tag-amber":"tag-red"}`}>
              {done}/{tasks.length} · {taskPct}%
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom:16 }}>
            <div className="progress-bar" style={{ height:10 }}>
              <div className="progress-fill"
                   style={{ width:`${taskPct}%`,
                            background:taskPct>=80?"var(--accent3)":taskPct>=50?"var(--accent4)":"var(--accent5)" }}></div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11,
                          color:"var(--text3)", marginTop:4 }}>
              <span>{taskPct < 50 ? "⚠️ Below 50% — daily penalty risk!" : "✅ On track"}</span>
              <span>Streak: 🔥 {summary?.currentStreak||0}</span>
            </div>
          </div>

          {tasks.length === 0
            ? <div className="alert alert-info"><span>ℹ</span><div>No tasks yet. Go to Setup and generate a plan first.</div></div>
            : tasks.map(t => {
                const isWeak = weakNames.includes(t.subject);
                return (
                  <div key={t._id} onClick={() => handleTaskToggle(t._id)}
                    style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
                             background: t.completed?"rgba(16,185,129,0.06)":"var(--bg3)",
                             borderRadius:10, marginBottom:8, cursor:"pointer", transition:"all 0.2s",
                             border:`1px solid ${t.completed?"rgba(16,185,129,0.3)":"var(--border)"}`,
                             opacity: t.completed ? 0.75 : 1 }}>
                    <div style={{ width:26, height:26, borderRadius:7, flexShrink:0,
                                  border:`2px solid ${t.completed?"var(--accent3)":"var(--border2)"}`,
                                  background: t.completed?"var(--accent3)":"transparent",
                                  display:"flex", alignItems:"center", justifyContent:"center",
                                  fontSize:13, color:"#fff", fontWeight:700, transition:"all 0.2s" }}>
                      {t.completed?"✓":""}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontWeight:600, fontSize:14,
                                       textDecoration:t.completed?"line-through":"none",
                                       color:t.completed?"var(--text2)":"var(--text)" }}>
                          {t.subject}
                        </span>
                        {isWeak && !t.completed && (
                          <span className="tag tag-amber" style={{ fontSize:9 }}>⚡ Bonus XP</span>
                        )}
                      </div>
                      <div style={{ fontSize:12, color:"var(--text3)" }}>
                        {t.action} · {t.topic}
                        {t.completed && t.completedAt && (
                          <span style={{ marginLeft:8, color:"var(--accent3)" }}>
                            ✓ {new Date(t.completedAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:"var(--accent)", fontWeight:700 }}>{t.duration}</div>
                    {!t.completed && (
                      <div style={{ textAlign:"right", fontSize:11, lineHeight:1.6 }}>
                        <div style={{ color:"var(--accent3)" }}>+10 RL</div>
                        <div style={{ color:"var(--accent4)" }}>+{isWeak?35:20} XP</div>
                      </div>
                    )}
                    <span className={`tag ${t.completed?"tag-green":"tag-blue"}`}
                          style={{ fontSize:10, minWidth:52, justifyContent:"center" }}>
                      {t.completed?"Done ✓":"Pending"}
                    </span>
                  </div>
                );
              })
          }
        </div>
      )}

      {/* ── TAB: UPDATE MARKS ── */}
      {activeTab === "marks" && (
        <div>
          <div className="card-elevated" style={{ marginBottom:16 }}>
            <div className="sec-title" style={{ marginBottom:6 }}>
              <span className="dot" style={{ background:"var(--accent3)" }}></span>
              Update Your Marks — Earn Rewards or Penalties
            </div>
            <p style={{ color:"var(--text2)", fontSize:13, marginBottom:16 }}>
              Enter your new marks after getting results. The system will automatically compare with your previous marks and award rewards for improvement or apply penalties for decline.
            </p>
            <div style={{ padding:"12px 16px", background:"rgba(16,185,129,0.08)",
                          borderRadius:9, border:"1px solid rgba(16,185,129,0.25)", marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--accent3)", marginBottom:6 }}>
                Reward Scale for Mark Improvement:
              </div>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                {[["+1 to +4%","+10 RL, +30 XP","#10b981"],["+5 to +9%","+20 RL, +60 XP","#4f8ef7"],
                  ["+10% or more","+35 RL, +100 XP","#7c3aed"],["Crossed 60%","+25 RL, +75 XP","#f59e0b"],
                  ["Declined","-10 RL, -15 XP","#ef4444"]].map(([l,v,c])=>(
                  <span key={l} style={{ fontSize:11, padding:"3px 10px", borderRadius:20,
                    background:c+"18", color:c, fontWeight:600 }}>{l} → {v}</span>
                ))}
              </div>
            </div>

            {student?.subjects?.map((sub, i) => {
              const oldPct = Math.round((sub.marks/sub.total)*100);
              const newPct = markInputs[sub.name] != null
                ? Math.round((+markInputs[sub.name]/sub.total)*100) : oldPct;
              const diff   = newPct - oldPct;
              const diffColor = diff > 0 ? "var(--accent3)" : diff < 0 ? "var(--accent5)" : "var(--text3)";
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 0",
                                      borderBottom:"1px solid var(--border)" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{sub.name}</div>
                    <div style={{ fontSize:11, color:"var(--text3)" }}>
                      Previous: {sub.previousMarks != null ? sub.previousMarks : sub.marks}/{sub.total} ({oldPct}%)
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <label style={{ fontSize:11, color:"var(--text3)" }}>New Marks:</label>
                    <input type="number" min="0" max={sub.total}
                      value={markInputs[sub.name] ?? sub.marks}
                      onChange={e => setMarkInputs(prev => ({ ...prev, [sub.name]: e.target.value }))}
                      style={{ width:70, background:"var(--bg3)", border:"1px solid var(--border2)",
                               borderRadius:7, padding:"7px 10px", color:"var(--text)",
                               fontFamily:"var(--font)", fontSize:13, outline:"none", textAlign:"center" }} />
                    <span style={{ fontSize:12, color:"var(--text3)" }}>/{sub.total}</span>
                  </div>
                  <div style={{ textAlign:"center", minWidth:70 }}>
                    <div style={{ fontSize:16, fontWeight:700, color:diffColor }}>
                      {diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : "—"}
                    </div>
                    <div style={{ fontSize:10, color:"var(--text3)" }}>{newPct}% new</div>
                  </div>
                  <span className={`tag ${oldPct<60?"tag-red":oldPct<75?"tag-amber":"tag-green"}`}
                        style={{ fontSize:10 }}>
                    {oldPct<60?"Weak":oldPct<75?"Average":"Strong"}
                  </span>
                </div>
              );
            })}

            <button className="btn btn-success btn-lg btn-full" style={{ marginTop:16 }}
                    onClick={handleUpdateMarks} disabled={updatingMarks}>
              {updatingMarks ? <><span className="spinner"></span> Calculating rewards…</> : "📈 Update Marks & Calculate Reward/Penalty"}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: REMINDERS ── */}
      {activeTab === "reminders" && (
        <div>
          <div className="sec-head" style={{ marginBottom:14 }}>
            <div className="sec-title"><span className="dot" style={{ background:"var(--accent4)" }}></span>
              Study Reminders
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleSetReminders}>
              🔔 Generate Reminders
            </button>
          </div>
          <div className="alert alert-info" style={{ marginBottom:16 }}>
            <span>ℹ</span>
            <div>Reminders are auto-generated based on your pending tasks and subject marks. Click "Generate Reminders" to refresh. Complete tasks before the due date to earn rewards — missing them triggers a penalty.</div>
          </div>
          {reminders.length === 0
            ? <div className="card-elevated" style={{ textAlign:"center", padding:40 }}>
                <div style={{ fontSize:36, marginBottom:12 }}>🔔</div>
                <p style={{ color:"var(--text2)" }}>No reminders yet. Click "Generate Reminders" to create them based on your current tasks and marks.</p>
              </div>
            : reminders.map((r, i) => {
                const pct = student?.subjects?.find(s=>s.name===r.subject);
                const isWeak = pct ? (pct.marks/pct.total)*100 < 60 : false;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"14px 16px",
                                        background: r.completed?"rgba(16,185,129,0.06)":"var(--bg3)",
                                        borderRadius:10, marginBottom:8, opacity:r.completed?0.6:1,
                                        border:`1px solid ${r.completed?"rgba(16,185,129,0.3)":isWeak?"rgba(239,68,68,0.3)":"var(--border)"}` }}>
                    <div style={{ fontSize:20, flexShrink:0 }}>
                      {r.completed?"✅":isWeak?"🔴":"📚"}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <span style={{ fontWeight:600, fontSize:14 }}>{r.subject}</span>
                        {isWeak && !r.completed && <span className="tag tag-red" style={{ fontSize:9 }}>Critical</span>}
                        {r.completed && <span className="tag tag-green" style={{ fontSize:9 }}>Done ✓</span>}
                      </div>
                      <div style={{ fontSize:13, color:"var(--text2)", lineHeight:1.6 }}>{r.message}</div>
                      {r.dueDate && (
                        <div style={{ fontSize:11, color:"var(--text3)", marginTop:4 }}>
                          Due: {new Date(r.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {!r.completed && (
                      <button className="btn btn-success btn-sm"
                        onClick={async(e)=>{ e.stopPropagation(); const res=await rewardAPI.markReminderDone(i); setReminders(res.data.reminders); }}>
                        Mark Done
                      </button>
                    )}
                  </div>
                );
              })
          }
        </div>
      )}

      {/* ── TAB: HISTORY ── */}
      {activeTab === "history" && (
        <div>
          <div className="sec-title" style={{ marginBottom:14 }}>
            <span className="dot" style={{ background:"var(--accent2)" }}></span>
            Recent Reward & Penalty History
          </div>
          {summary?.recentLogs?.length === 0
            ? <div className="alert alert-info"><span>ℹ</span><div>No reward history yet. Complete tasks or update marks to see logs here.</div></div>
            : (summary?.recentLogs||[]).map((log, i) => {
                const isReward = log.rlDelta >= 0;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"11px 16px",
                                        background:"var(--bg3)", borderRadius:10, marginBottom:8,
                                        border:`1px solid ${isReward?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.2)"}` }}>
                    <span style={{ fontSize:18 }}>{log.type==="reminder"?"🔔":isReward?"🎉":"📉"}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500 }}>{log.reason}</div>
                      {log.subject && <div style={{ fontSize:11, color:"var(--text3)" }}>Subject: {log.subject}</div>}
                      {log.improvement != null && log.improvement !== 0 && (
                        <div style={{ fontSize:11, color: log.improvement>0?"var(--accent3)":"var(--accent5)" }}>
                          Marks: {log.oldMarks} → {log.newMarks} ({log.improvement>0?"+":""}{log.improvement}%)
                        </div>
                      )}
                      <div style={{ fontSize:10, color:"var(--text3)", marginTop:2 }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:14, fontWeight:700, color: isReward?"var(--accent3)":"var(--accent5)" }}>
                        {log.rlDelta>0?"+":""}{log.rlDelta} RL
                      </div>
                      <div style={{ fontSize:12, color:"var(--accent4)" }}>
                        {log.xpDelta>0?"+":""}{log.xpDelta} XP
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}

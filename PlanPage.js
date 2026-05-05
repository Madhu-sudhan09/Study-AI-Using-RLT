// src/pages/PlanPage.js — Full RL Reward System UI
import React, { useState, useEffect, useCallback } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { planAPI, taskAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ["#4f8ef7","#10b981","#f59e0b","#7c3aed","#ef4444","#06b6d4","#f97316","#8b5cf6"];

// ── Reward Toast notification ──────────────────────────────
function RewardToast({ reward, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  if (!reward) return null;
  const isPositive = reward.delta > 0;

  return (
    <div style={{
      position:"fixed", top:20, right:20, zIndex:9999,
      background: isPositive ? "var(--bg2)" : "var(--bg2)",
      border:`2px solid ${isPositive?"var(--accent3)":"var(--accent5)"}`,
      borderRadius:14, padding:"16px 20px", minWidth:280, maxWidth:340,
      boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
      animation:"slideIn 0.35s ease both"
    }}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`}</style>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20}}>{isPositive ? "🎉" : "📉"}</span>
          <span style={{fontWeight:700,fontSize:14,color:isPositive?"var(--accent3)":"var(--accent5)"}}>
            {isPositive ? "Reward Earned!" : "Task Unmarked"}
          </span>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:16}}>✕</button>
      </div>

      {/* Reward breakdown */}
      {reward.breakdown?.map((r, i) => (
        <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                              padding:"5px 10px",borderRadius:7,marginBottom:4,
                              background:r.color+"15",border:`1px solid ${r.color}33`}}>
          <span style={{fontSize:12,color:r.color,fontWeight:600}}>{r.label}</span>
          <div style={{display:"flex",gap:8}}>
            <span style={{fontSize:11,color:r.color,fontWeight:700}}>
              {r.rl > 0 ? "+" : ""}{r.rl} RL
            </span>
            <span style={{fontSize:11,color:"var(--accent4)",fontWeight:700}}>
              {r.xp > 0 ? "+" : ""}{r.xp} XP
            </span>
          </div>
        </div>
      ))}

      {/* Totals */}
      <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid var(--border2)",
                   display:"flex",justifyContent:"space-between"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,color:"var(--text3)"}}>TOTAL RL REWARD</div>
          <div style={{fontSize:16,fontWeight:700,color:"var(--accent3)"}}>
            {reward.totalReward?.toFixed(0)}
          </div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,color:"var(--text3)"}}>TOTAL XP</div>
          <div style={{fontSize:16,fontWeight:700,color:"var(--accent4)"}}>
            {reward.totalXP} XP
          </div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,color:"var(--text3)"}}>STREAK</div>
          <div style={{fontSize:16,fontWeight:700,color:"var(--accent2)"}}>
            🔥 {reward.streakCount}
          </div>
        </div>
      </div>

      {/* All done bonus */}
      {reward.allDone && (
        <div style={{marginTop:10,padding:"8px 12px",background:"rgba(79,142,247,0.15)",
                     borderRadius:8,border:"1px solid rgba(79,142,247,0.3)",textAlign:"center"}}>
          <span style={{fontSize:12,color:"var(--accent)",fontWeight:700}}>
            🏆 All tasks completed! +50 XP bonus earned!
          </span>
        </div>
      )}
    </div>
  );
}

// ── Level Badge ─────────────────────────────────────────────
function LevelBadge({ totalXP, totalReward }) {
  const getLevel = (xp) => {
    if (xp >= 500) return { level:5, title:"Study Master",   icon:"🏆", next:null,   color:"#f59e0b" };
    if (xp >= 300) return { level:4, title:"Expert Learner", icon:"🎯", next:500,    color:"#7c3aed" };
    if (xp >= 150) return { level:3, title:"Active Student", icon:"📚", next:300,    color:"#4f8ef7" };
    if (xp >= 50)  return { level:2, title:"Rising Scholar", icon:"⭐", next:150,    color:"#10b981" };
    return               { level:1, title:"Beginner",        icon:"🌱", next:50,     color:"#94a3b8" };
  };
  const lvl  = getLevel(totalXP);
  const prog = lvl.next ? Math.min(100, Math.round((totalXP / lvl.next) * 100)) : 100;

  return (
    <div style={{padding:"14px 18px",background:"var(--bg3)",borderRadius:12,
                 border:`1px solid ${lvl.color}44`}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
        <div style={{fontSize:28}}>{lvl.icon}</div>
        <div>
          <div style={{fontSize:11,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.8px"}}>
            Level {lvl.level}
          </div>
          <div style={{fontSize:15,fontWeight:700,color:lvl.color}}>{lvl.title}</div>
        </div>
        <div style={{marginLeft:"auto",textAlign:"right"}}>
          <div style={{fontSize:11,color:"var(--text3)"}}>XP</div>
          <div style={{fontSize:18,fontWeight:700,color:"var(--accent4)"}}>{totalXP}</div>
        </div>
      </div>
      {/* XP Progress bar */}
      <div style={{marginBottom:6}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--text3)",marginBottom:4}}>
          <span>Progress to Level {lvl.level+1}</span>
          {lvl.next && <span>{totalXP} / {lvl.next} XP</span>}
        </div>
        <div style={{height:8,background:"var(--bg4)",borderRadius:4,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${prog}%`,background:lvl.color,borderRadius:4,
                       transition:"width 0.8s ease"}}></div>
        </div>
      </div>
      {/* RL Reward */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                   paddingTop:8,borderTop:"1px solid var(--border)"}}>
        <span style={{fontSize:11,color:"var(--text3)"}}>RL Cumulative Reward</span>
        <span style={{fontSize:13,fontWeight:700,color:"var(--accent3)"}}>
          {(totalReward||0).toFixed(0)} pts
        </span>
      </div>
    </div>
  );
}

// ── Reward Info Card ────────────────────────────────────────
function RewardInfoCard() {
  return (
    <div style={{padding:"14px 16px",background:"var(--bg3)",borderRadius:12,
                 border:"1px solid var(--border)"}}>
      <div style={{fontSize:12,fontWeight:700,color:"var(--text2)",marginBottom:10,
                   textTransform:"uppercase",letterSpacing:"0.8px"}}>
        🎮 Reward System (Q-Learning)
      </div>
      {[
        { icon:"✅", label:"Complete a task",       rl:"+10", xp:"+20 XP", color:"var(--accent3)" },
        { icon:"⚠️", label:"Weak subject task",      rl:"+5",  xp:"+15 XP", color:"var(--accent4)" },
        { icon:"🔥", label:"3-task streak",          rl:"+5",  xp:"+10 XP", color:"var(--accent2)" },
        { icon:"🏆", label:"All tasks done",         rl:"+15", xp:"+50 XP", color:"var(--accent)" },
        { icon:"❌", label:"Unmark a task",          rl:"-5",  xp:"-5 XP",  color:"var(--accent5)" },
      ].map((r,i) => (
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"5px 0",
                              borderBottom:i<4?"1px solid var(--border)":"none"}}>
          <span style={{fontSize:14,width:20,textAlign:"center"}}>{r.icon}</span>
          <span style={{flex:1,fontSize:12,color:"var(--text2)"}}>{r.label}</span>
          <span style={{fontSize:11,fontWeight:700,color:r.color,minWidth:36}}>{r.rl}</span>
          <span style={{fontSize:11,color:"var(--accent4)",minWidth:50}}>{r.xp}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────
export default function PlanPage() {
  const { student } = useAuth();
  const [plan,    setPlan]    = useState(null);
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);
  const [rewardSummary, setRewardSummary] = useState({ totalReward:0, totalXP:0, streakCount:0 });

  const fetchData = useCallback(async () => {
    try {
      const [p, t, r] = await Promise.all([
        planAPI.getActive(),
        taskAPI.getAll(),
        taskAPI.getRewardSummary ? taskAPI.getRewardSummary() : Promise.resolve({ data:{ summary:{} } })
      ]);
      setPlan(p.data.plan);
      setTasks(t.data.tasks);
      if (r.data?.summary) {
        setRewardSummary({
          totalReward: r.data.summary.totalRLReward || 0,
          totalXP:     r.data.summary.totalXP       || 0,
          streakCount: r.data.summary.currentStreak || 0
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleTask = async (id) => {
    try {
      const res = await taskAPI.toggle(id);
      const { task, reward } = res.data;
      setTasks(prev => prev.map(t => t._id === id ? task : t));
      if (reward) {
        setToast(reward);
        setRewardSummary({
          totalReward: reward.totalReward || 0,
          totalXP:     reward.totalXP     || 0,
          streakCount: reward.streakCount || 0
        });
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",gap:12,color:"var(--text2)"}}>
      <span className="spinner"></span> Loading study plan from MongoDB...
    </div>
  );

  if (!plan) return (
    <div className="card-elevated" style={{textAlign:"center",padding:48}}>
      <div style={{fontSize:40,marginBottom:16}}>📋</div>
      <h3 style={{marginBottom:8}}>No Study Plan Yet</h3>
      <p style={{color:"var(--text2)",marginBottom:20}}>
        Go to Setup and click "Generate AI Study Plan" to create your personalized plan
      </p>
    </div>
  );

  const done    = tasks.filter(t => t.completed).length;
  const pct     = tasks.length ? Math.round((done/tasks.length)*100) : 0;
  const pieData = {
    labels:   plan.subjectAllocations.map(s => s.subjectName),
    datasets: [{ data: plan.subjectAllocations.map(s => s.hoursPerDay),
                 backgroundColor: COLORS, borderWidth:2, borderColor:"rgba(10,14,26,0.85)" }]
  };

  // Identify weak subject names
  const weakSubjectNames = student?.subjects
    ?.filter(s => (s.marks/s.total)*100 < 60)
    .map(s => s.name) || [];

  return (
    <div className="fade-up">
      {/* Reward Toast */}
      {toast && <RewardToast reward={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="sec-head">
        <div>
          <h2 style={{fontSize:22,marginBottom:4}}>Personalized Study Plan</h2>
          <p style={{color:"var(--text2)",fontSize:13}}>
            Generated & stored in MongoDB · LLM-powered · RL Reward Active 🎮
          </p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <span className="tag tag-blue">{plan.daysLeft} Days Left</span>
          <span className="tag tag-green">{plan.totalHrsDay} Hrs/Day</span>
          <span className="tag tag-amber">🔥 {rewardSummary.streakCount} Streak</span>
        </div>
      </div>

      {/* Top stat cards */}
      <div className="grid4" style={{marginBottom:20}}>
        {[
          { label:"Subjects",    value:plan.subjectAllocations.length,   color:"blue" },
          { label:"Completed",   value:pct+"%",                          color:"green" },
          { label:"RL Reward",   value:(rewardSummary.totalReward||0).toFixed(0)+" pts", color:"purple" },
          { label:"Total XP",    value:(rewardSummary.totalXP||0)+" XP", color:"amber" }
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Level + Reward Info Row */}
      <div className="grid2" style={{gap:16,marginBottom:20}}>
        <LevelBadge totalXP={rewardSummary.totalXP||0} totalReward={rewardSummary.totalReward||0} />
        <RewardInfoCard />
      </div>

      {/* LLM + Pie Row */}
      <div className="grid2" style={{gap:20,marginBottom:20}}>
        <div className="card-elevated">
          <div className="sec-title" style={{marginBottom:14}}>
            <span className="dot" style={{background:"var(--accent2)"}}></span>
            LLM Recommendations
            <span className="tag tag-purple" style={{fontSize:10,marginLeft:6}}>AI</span>
          </div>
          {plan.llmRecommendation
            ? <div style={{fontSize:13,lineHeight:1.9,color:"var(--text2)",whiteSpace:"pre-wrap",
                           maxHeight:220,overflowY:"auto"}}>{plan.llmRecommendation}</div>
            : <div className="alert alert-warning">
                <span>⚠</span>
                <div>Set ANTHROPIC_API_KEY in backend/.env to enable LLM recommendations</div>
              </div>
          }
        </div>

        <div className="card-elevated">
          <div className="sec-title" style={{marginBottom:14}}>
            <span className="dot" style={{background:"var(--accent4)"}}></span>Time Allocation
          </div>
          <div style={{height:180}}>
            <Pie data={pieData} options={{responsive:true,maintainAspectRatio:false,
              plugins:{legend:{display:false}}}} />
          </div>
          <div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:5}}>
            {plan.subjectAllocations.map((s,i) => (
              <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,
                                    fontSize:11,color:"var(--text2)"}}>
                <span style={{width:8,height:8,borderRadius:2,
                              background:COLORS[i%COLORS.length],display:"inline-block"}}></span>
                {s.subjectName}: {s.hoursPerDay}h
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Subject priority bars */}
      <div className="card-elevated" style={{marginBottom:20}}>
        <div className="sec-title" style={{marginBottom:14}}>
          <span className="dot" style={{background:"var(--accent3)"}}></span>
          Smart Time Recommendation
        </div>
        <div className="grid2" style={{gap:12}}>
          {plan.subjectAllocations.map((s,i) => {
            const col = s.priority==="Critical"?"var(--accent5)"
                       :s.priority==="Moderate"?"var(--accent4)":"var(--accent3)";
            const isWeak = weakSubjectNames.includes(s.subjectName);
            return (
              <div key={i}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontWeight:600,fontSize:13}}>{s.subjectName}</span>
                    <span className="tag" style={{background:col+"22",color:col,fontSize:10}}>
                      {s.priority}
                    </span>
                    {isWeak && (
                      <span className="tag tag-amber" style={{fontSize:9}}>+Bonus XP</span>
                    )}
                  </div>
                  <span style={{color:col,fontWeight:700,fontSize:13}}>{s.hoursPerDay}h/day</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill"
                       style={{width:`${(s.hoursPerDay/plan.totalHrsDay)*100}%`,background:col}}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task List */}
      <div className="card-elevated">
        <div className="sec-head">
          <div className="sec-title">
            <span className="dot"></span>
            Daily Tasks
            <span style={{fontSize:12,color:"var(--text2)",fontWeight:400,marginLeft:8}}>
              Click to complete and earn rewards
            </span>
          </div>
          <span className={`tag ${pct>=80?"tag-green":pct>=40?"tag-amber":"tag-blue"}`}>
            {done}/{tasks.length} Done · {pct}%
          </span>
        </div>

        {tasks.length === 0
          ? <p style={{color:"var(--text2)"}}>No tasks yet. Generate a plan first.</p>
          : tasks.map(t => {
              const isWeak = weakSubjectNames.includes(t.subject);
              return (
                <div key={t._id} onClick={() => toggleTask(t._id)}
                  style={{
                    display:"flex", alignItems:"center", gap:14,
                    padding:"13px 16px",
                    background: t.completed ? "rgba(16,185,129,0.06)" : "var(--bg3)",
                    borderRadius:10, marginBottom:8,
                    border:`1px solid ${t.completed?"rgba(16,185,129,0.3)":"var(--border)"}`,
                    cursor:"pointer", transition:"all 0.2s",
                    opacity: t.completed ? 0.75 : 1
                  }}>

                  {/* Checkbox */}
                  <div style={{
                    width:24, height:24, borderRadius:7, flexShrink:0,
                    border:`2px solid ${t.completed?"var(--accent3)":"var(--border2)"}`,
                    background: t.completed?"var(--accent3)":"transparent",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:12, color:"#fff", fontWeight:700, transition:"all 0.2s"
                  }}>
                    {t.completed ? "✓" : ""}
                  </div>

                  {/* Task info */}
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontWeight:600,fontSize:14,
                                    textDecoration:t.completed?"line-through":"none",
                                    color:t.completed?"var(--text2)":"var(--text)"}}>
                        {t.subject}
                      </span>
                      {isWeak && !t.completed && (
                        <span className="tag tag-amber" style={{fontSize:9}}>⚡ +5 RL +15 XP</span>
                      )}
                    </div>
                    <div style={{fontSize:12,color:"var(--text3)"}}>
                      {t.action} · {t.topic}
                      {t.completed && t.completedAt && (
                        <span style={{marginLeft:8,color:"var(--accent3)"}}>
                          ✓ {new Date(t.completedAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Duration */}
                  <div style={{fontSize:12,color:"var(--accent)",fontWeight:700}}>
                    {t.duration}
                  </div>

                  {/* Reward preview (not yet completed) */}
                  {!t.completed && (
                    <div style={{fontSize:11,color:"var(--text3)",textAlign:"right",lineHeight:1.5}}>
                      <div style={{color:"var(--accent3)"}}>+10 RL</div>
                      <div style={{color:"var(--accent4)"}}>+20 XP</div>
                    </div>
                  )}

                  {/* Status badge */}
                  <span className={`tag ${t.completed?"tag-green":"tag-blue"}`}
                        style={{fontSize:10,minWidth:52,justifyContent:"center"}}>
                    {t.completed ? "Done ✓" : "Pending"}
                  </span>
                </div>
              );
            })
        }

        {/* Progress summary footer */}
        {tasks.length > 0 && (
          <div style={{marginTop:14,padding:"12px 16px",background:"var(--bg4)",
                       borderRadius:10,border:"1px solid var(--border)",
                       display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:13,color:"var(--text2)"}}>
              <strong style={{color:"var(--text)"}}>{done}</strong> of <strong style={{color:"var(--text)"}}>{tasks.length}</strong> tasks completed
              {rewardSummary.streakCount >= 3 && (
                <span style={{marginLeft:10,color:"var(--accent2)",fontWeight:600}}>
                  🔥 {rewardSummary.streakCount} task streak!
                </span>
              )}
            </div>
            <div style={{display:"flex",gap:14}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:10,color:"var(--text3)"}}>RL REWARD</div>
                <div style={{fontSize:15,fontWeight:700,color:"var(--accent3)"}}>
                  {(rewardSummary.totalReward||0).toFixed(0)}
                </div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:10,color:"var(--text3)"}}>XP EARNED</div>
                <div style={{fontSize:15,fontWeight:700,color:"var(--accent4)"}}>
                  {rewardSummary.totalXP||0}
                </div>
              </div>
              <div style={{height:36,width:36,borderRadius:"50%",
                           background:`conic-gradient(var(--accent3) ${pct*3.6}deg, var(--bg4) 0deg)`,
                           display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"var(--bg4)",
                             display:"flex",alignItems:"center",justifyContent:"center",
                             fontSize:9,fontWeight:700,color:"var(--accent3)"}}>
                  {pct}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

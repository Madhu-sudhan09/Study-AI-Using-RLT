// src/pages/RLPage.js
import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from "chart.js";
import { rlAPI } from "../services/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const ACTIONS = ["Study Weak Subject","Review Notes","Practice Problems","Take Mock Test","Rest & Consolidate"];

export default function RLPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    rlAPI.getResult().then(r => setResult(r.data.rlResult)).catch(()=>{}).finally(()=>setFetching(false));
  }, []);

  const run = async () => {
    setLoading(true);
    try { const r = await rlAPI.run(); setResult(r.data.rlResult); }
    catch (e) { alert(e.response?.data?.message || e.message); }
    setLoading(false);
  };

  if (fetching) return <div style={{display:"flex",gap:12,alignItems:"center",color:"var(--text2)"}}><span className="spinner"></span>Loading RL results...</div>;

  const lineData = result ? {
    labels: result.rewardHistory.map((_,i) => (i+1)*6),
    datasets: [{
      label: "Cumulative Reward",
      data: result.rewardHistory,
      borderColor: "#10b981",
      backgroundColor: "rgba(16,185,129,0.10)",
      fill: true, tension: 0.42, pointRadius: 0, borderWidth: 2
    }]
  } : null;

  const qVals = result?.qTable ? (() => {
    const firstKey = Object.keys(result.qTable)[0];
    return firstKey ? (result.qTable[firstKey] || []) : [];
  })() : [];
  const maxQ = qVals.length ? Math.max(...qVals) : 0;

  return (
    <div className="fade-up">
      <div className="sec-head">
        <div><h2 style={{fontSize:22,marginBottom:4}}>Reinforcement Learning Engine</h2>
          <p style={{color:"var(--text2)",fontSize:13}}>Q-Learning with ε-greedy · Results saved in MongoDB</p></div>
        <button className="btn btn-success" onClick={run} disabled={loading}>
          {loading ? <><span className="spinner"></span> Running…</> : "▶ Run Q-Learning"}
        </button>
      </div>

      {result && <>
        <div className="grid4" style={{marginBottom:20}}>
          {[
            {label:"Episodes",     value:result.episodes,                       color:"var(--accent)"},
            {label:"Total Reward", value:Math.round(result.totalReward),        color:"var(--accent3)"},
            {label:"Epsilon (ε)",  value:(result.epsilon||0).toFixed(4),        color:"var(--accent4)"},
            {label:"Avg Q-Value",  value:(result.avgQValue||0).toFixed(3),      color:"var(--accent2)"}
          ].map(s => (
            <div key={s.label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,
                                       padding:16,background:"var(--bg3)",borderRadius:10,border:"1px solid var(--border)",textAlign:"center"}}>
              <div style={{fontSize:26,fontWeight:700,fontFamily:"var(--font2)",color:s.color}}>{s.value}</div>
              <div style={{fontSize:10,color:"var(--text3)",textTransform:"uppercase",letterSpacing:0.9,fontWeight:600}}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid2" style={{gap:20,marginBottom:20}}>
          <div className="card-elevated">
            <div className="sec-title" style={{marginBottom:14}}><span className="dot"></span>Reward per Episode (Cumulative)</div>
            <div style={{height:230}}>
              <Line data={lineData} options={{responsive:true,maintainAspectRatio:false,
                plugins:{legend:{display:false}},
                scales:{y:{ticks:{color:"#64748b"},grid:{color:"rgba(255,255,255,0.05)"}},
                        x:{ticks:{color:"#64748b",maxTicksLimit:8},grid:{display:false}}}}}/>
            </div>
          </div>

          <div className="card-elevated">
            <div className="sec-title" style={{marginBottom:14}}><span className="dot" style={{background:"var(--accent2)"}}></span>Q-Learning Details</div>
            <div style={{fontSize:12,color:"var(--text2)",lineHeight:2,marginBottom:14,padding:"12px 14px",
                         background:"var(--bg3)",borderRadius:9,border:"1px solid var(--border)"}}>
              <span style={{color:"var(--accent)",fontWeight:600}}>Agent:</span> Study Planner<br/>
              <span style={{color:"var(--accent)",fontWeight:600}}>State:</span> (marks_level, weak_count)<br/>
              <span style={{color:"var(--accent)",fontWeight:600}}>Actions:</span> {ACTIONS.join(", ")}<br/>
              <span style={{color:"var(--accent4)",fontWeight:600}}>Reward:</span> +10 task done, -5 missed, +15 exam ready<br/>
              <span style={{color:"var(--accent3)",fontWeight:600}}>α:</span> 0.1 &nbsp;|&nbsp; <span style={{color:"var(--accent3)",fontWeight:600}}>γ:</span> 0.9
            </div>
            <div style={{fontSize:11,color:"var(--text3)",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.8px"}}>Q-Values</div>
            {ACTIONS.map((a,i) => {
              const qv = qVals[i] || 0;
              const isMax = qv === maxQ && maxQ > 0;
              return (
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                                     padding:"8px 12px",marginBottom:6,borderRadius:8,
                                     background:isMax?"rgba(79,142,247,0.12)":"var(--bg3)",
                                     border:`1px solid ${isMax?"rgba(79,142,247,0.35)":"var(--border)"}`}}>
                  <span style={{fontSize:12,fontWeight:isMax?700:400,color:isMax?"var(--accent)":"var(--text2)"}}>{a}</span>
                  <span style={{fontSize:13,fontWeight:700,color:isMax?"var(--accent)":"var(--text2)"}}>{qv.toFixed ? qv.toFixed(3) : qv}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* NBA */}
        <div className="card-elevated" style={{border:"1px solid rgba(79,142,247,0.25)",boxShadow:"0 0 30px rgba(79,142,247,0.06)"}}>
          <div className="sec-title" style={{marginBottom:14}}><span className="dot" style={{background:"var(--accent3)"}}></span>Next Best Action — Q-Learning Optimal Policy</div>
          <div style={{display:"flex",alignItems:"center",gap:16,padding:18,background:"rgba(79,142,247,0.08)",
                       border:"1px solid rgba(79,142,247,0.25)",borderRadius:12,marginBottom:16}}>
            <div style={{fontSize:32,flexShrink:0}}>🎯</div>
            <div>
              <div style={{fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Optimal Action</div>
              <div style={{fontSize:18,fontWeight:700,fontFamily:"var(--font2)"}}>{result.bestAction}</div>
              {result.nbaSchedule && <div style={{fontSize:12,color:"var(--text2)",marginTop:5}}>
                Tomorrow: <strong style={{color:"var(--text)"}}>{result.nbaSchedule.tomorrow}</strong> · This Week: <strong style={{color:"var(--text)"}}>{result.nbaSchedule.thisWeek}</strong>
              </div>}
            </div>
          </div>
          <div className="grid3" style={{gap:10}}>
            {["Today","Tomorrow","This Week"].map((t,i) => {
              const actions = result.nbaSchedule;
              const a = i===0?actions?.today:i===1?actions?.tomorrow:actions?.thisWeek;
              return (
                <div key={t} style={{padding:14,background:"var(--bg3)",borderRadius:10,border:"1px solid var(--border)",textAlign:"center"}}>
                  <div style={{fontSize:10,color:"var(--text3)",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.8px"}}>{t}</div>
                  <div style={{fontSize:12,fontWeight:600}}>{a || "-"}</div>
                  <div style={{fontSize:10,color:"var(--accent4)",marginTop:5}}>ε={((result.epsilon||0)*(Math.pow(0.975,i*5))).toFixed(4)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </>}

      {!result && !loading && (
        <div className="card-elevated" style={{textAlign:"center",padding:48}}>
          <div style={{fontSize:40,marginBottom:16}}>🎮</div>
          <h3 style={{marginBottom:8}}>No RL Results Yet</h3>
          <p style={{color:"var(--text2)",marginBottom:20}}>Click "Run Q-Learning" to train the RL agent</p>
          <button className="btn btn-success" onClick={run}>▶ Run Q-Learning</button>
        </div>
      )}
    </div>
  );
}

// src/pages/AnalyticsPage.js
import React, { useState, useEffect } from "react";
import { Bar, Radar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend } from "chart.js";
import { analyticsAPI } from "../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend);

export default function AnalyticsPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getDashboard()
      .then(r => setData(r.data.analytics))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{display:"flex",gap:12,alignItems:"center",color:"var(--text2)"}}><span className="spinner"></span>Loading analytics from MongoDB...</div>;
  if (!data) return <div className="card-elevated" style={{textAlign:"center",padding:48}}>
    <p style={{color:"var(--text2)"}}>No analytics data yet. Generate a study plan first.</p>
  </div>;

  const subs = data.subjectBreakdown || [];
  const pcts = subs.map(s => s.pct);

  const barData = {
    labels: subs.map(s => s.name),
    datasets: [{
      label:"Score (%)",
      data: pcts,
      backgroundColor: pcts.map(p => p>=75?"rgba(16,185,129,0.8)":p>=60?"rgba(245,158,11,0.8)":"rgba(239,68,68,0.8)"),
      borderRadius:7, borderSkipped:false
    }]
  };

  const radarData = {
    labels: subs.map(s => s.name),
    datasets: [
      { label:"Current", data:pcts, borderColor:"#4f8ef7", backgroundColor:"rgba(79,142,247,0.15)", pointBackgroundColor:"#4f8ef7", borderWidth:2 },
      { label:"Target (80%)", data:subs.map(()=>80), borderColor:"rgba(16,185,129,0.5)", backgroundColor:"transparent", borderDash:[5,5], pointRadius:0 }
    ]
  };

  const doughnutData = {
    labels:["Weak (<60%)","Average (60-74%)","Strong (≥75%)"],
    datasets:[{
      data:[data.weakSubjectsCount, data.avgSubjectsCount, data.strongSubjectsCount],
      backgroundColor:["rgba(239,68,68,0.8)","rgba(245,158,11,0.8)","rgba(16,185,129,0.8)"],
      borderWidth:2, borderColor:"rgba(10,14,26,0.85)"
    }]
  };

  const sorted = [...subs].sort((a,b)=>a.pct-b.pct);

  return (
    <div className="fade-up">
      <div className="sec-head">
        <div><h2 style={{fontSize:22,marginBottom:4}}>Advanced Analytics Dashboard</h2>
          <p style={{color:"var(--text2)",fontSize:13}}>Real-time insights from MongoDB · ML + RL combined</p></div>
        <span className="tag tag-green">
          <span style={{width:6,height:6,borderRadius:"50%",background:"var(--accent3)",display:"inline-block"}}></span>Live
        </span>
      </div>

      <div className="grid4" style={{marginBottom:20}}>
        {[
          {label:"Learning Efficiency", value:(data.learningEfficiency||0)+"%", color:"blue"},
          {label:"Strong Subjects",     value:data.strongSubjectsCount,          color:"green"},
          {label:"Weak Subjects",       value:data.weakSubjectsCount,            color:"red"},
          {label:"RL Reward Trend",     value:data.rlRewardTrend!=null?"↑ "+data.rlRewardTrend:"N/A", color:"purple"}
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid2" style={{gap:20,marginBottom:20}}>
        <div className="card-elevated">
          <div className="sec-title" style={{marginBottom:14}}><span className="dot"></span>Subject Performance</div>
          <div style={{height:230}}><Bar data={barData} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:0,max:100,ticks:{color:"#64748b",callback:v=>v+"%"},grid:{color:"rgba(255,255,255,0.05)"}},x:{ticks:{color:"#94a3b8"},grid:{display:false}}}}}/></div>
        </div>
        <div className="card-elevated">
          <div className="sec-title" style={{marginBottom:14}}><span className="dot" style={{background:"var(--accent3)"}}></span>Readiness Radar</div>
          <div style={{height:230}}><Radar data={radarData} options={{responsive:true,maintainAspectRatio:false,scales:{r:{ticks:{color:"#64748b",backdropColor:"transparent",stepSize:20},grid:{color:"rgba(255,255,255,0.08)"},pointLabels:{color:"#94a3b8",font:{size:11}},min:0,max:100}},plugins:{legend:{display:false}}}}/></div>
        </div>
      </div>

      <div className="grid2" style={{gap:20}}>
        <div className="card-elevated">
          <div className="sec-title" style={{marginBottom:14}}><span className="dot" style={{background:"var(--accent4)"}}></span>Weak vs Strong Analysis</div>
          {sorted.map((s,i) => {
            const col = s.pct>=75?"var(--accent3)":s.pct>=60?"var(--accent4)":"var(--accent5)";
            const tc  = s.pct>=75?"tag-green":s.pct>=60?"tag-amber":"tag-red";
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:5}}>{s.name}</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width:`${s.pct}%`,background:col}}></div>
                  </div>
                </div>
                <span style={{fontWeight:700,color:col,minWidth:40,textAlign:"right"}}>{s.pct}%</span>
                <span className={`tag ${tc}`}>{s.level}</span>
              </div>
            );
          })}
        </div>

        <div className="card-elevated">
          <div className="sec-title" style={{marginBottom:14}}><span className="dot" style={{background:"var(--accent2)"}}></span>Study Load Distribution</div>
          <div style={{height:190}}><Doughnut data={doughnutData} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},cutout:"65%"}}/></div>
          <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:10,fontSize:11,color:"var(--text2)"}}>
            {[["Weak","rgba(239,68,68,0.8)"],["Average","rgba(245,158,11,0.8)"],["Strong","rgba(16,185,129,0.8)"]].map(([l,c])=>(
              <span key={l} style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:9,height:9,borderRadius:2,background:c,display:"inline-block"}}></span>{l}
              </span>
            ))}
          </div>

          <div className="divider" style={{margin:"16px 0"}}></div>
          <div className="grid2" style={{gap:10}}>
            {[
              {label:"Task Completion", value:(data.taskCompletionRate||0)+"%", note:`${data.completedTasks}/${data.totalTasks} tasks`},
              {label:"ML Best Accuracy",value:data.mlBestAccuracy!=null?data.mlBestAccuracy+"%":"N/A", note:"Random Forest"},
              {label:"RL Best Action",  value:data.rlBestAction||"N/A",         note:"Q-Learning policy"},
              {label:"Avg Performance", value:(data.avgPerformance||0)+"%",     note:"Across all subjects"}
            ].map(s => (
              <div key={s.label} style={{padding:12,background:"var(--bg3)",borderRadius:8,border:"1px solid var(--border)"}}>
                <div style={{fontSize:10,color:"var(--text3)",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.7px"}}>{s.label}</div>
                <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{s.value}</div>
                <div style={{fontSize:10,color:"var(--text3)"}}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

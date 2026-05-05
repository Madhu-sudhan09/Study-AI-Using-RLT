// src/pages/MLPage.js
import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { mlAPI } from "../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const fmt = v => v != null ? (v*100).toFixed(1)+"%" : "-";

export default function MLPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    mlAPI.getResult().then(r => setResult(r.data.mlResult)).catch(()=>{}).finally(()=>setFetching(false));
  }, []);

  const train = async () => {
    setLoading(true);
    try { const r = await mlAPI.train(); setResult(r.data.mlResult); }
    catch (e) { alert(e.response?.data?.message || e.message); }
    setLoading(false);
  };

  if (fetching) return <div style={{display:"flex",gap:12,alignItems:"center",color:"var(--text2)"}}><span className="spinner"></span>Loading ML results...</div>;

  const models = result ? [
    { label:"Logistic Regression", ...result.models.logisticRegression, color:"#7c3aed" },
    { label:"Decision Tree",       ...result.models.decisionTree,       color:"#f59e0b" },
    { label:"Random Forest",       ...result.models.randomForest,       color:"#4f8ef7" }
  ] : [];

  const barData = {
    labels: ["Logistic Regression","Decision Tree","Random Forest"],
    datasets: [
      { label:"Accuracy", data: models.map(m=>+(m.accuracy*100).toFixed(1)), backgroundColor:models.map(m=>m.color), borderRadius:7, borderSkipped:false },
      { label:"F1-Score", data: models.map(m=>+(m.f1*100).toFixed(1)),       backgroundColor:models.map(m=>m.color+"66"), borderRadius:7, borderSkipped:false }
    ]
  };

  return (
    <div className="fade-up">
      <div className="sec-head">
        <div><h2 style={{fontSize:22,marginBottom:4}}>Machine Learning Evaluation</h2>
          <p style={{color:"var(--text2)",fontSize:13}}>Models trained server-side · Results stored in MongoDB</p></div>
        <button className="btn btn-purple" onClick={train} disabled={loading}>
          {loading ? <><span className="spinner"></span> Training…</> : "▶ Train & Evaluate"}
        </button>
      </div>

      {result && <>
        <div className="grid4" style={{marginBottom:20}}>
          {[
            {label:"Best Accuracy",  value:fmt(result.models.randomForest.accuracy),  color:"blue"},
            {label:"Best F1-Score",  value:fmt(result.models.randomForest.f1),         color:"green"},
            {label:"Precision",      value:fmt(result.models.randomForest.precision),   color:"amber"},
            {label:"Recall",         value:fmt(result.models.randomForest.recall),      color:"purple"}
          ].map(s=>(
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">Random Forest</div>
            </div>
          ))}
        </div>

        <div className="alert alert-info">
          <span>🔬</span>
          <div>Trained on {result.datasetSize} synthetic student records (features: marks, study_time, completion_rate) with 80/20 train-test split. Results saved to MongoDB.</div>
        </div>

        <div className="grid2" style={{gap:20,marginBottom:20}}>
          {/* Bar chart */}
          <div className="card-elevated">
            <div className="sec-title" style={{marginBottom:16}}><span className="dot"></span>Model Accuracy Comparison</div>
            <div style={{height:210}}>
              <Bar data={barData} options={{responsive:true,maintainAspectRatio:false,
                plugins:{legend:{display:false}},
                scales:{y:{min:60,max:100,ticks:{color:"#64748b",callback:v=>v+"%"},grid:{color:"rgba(255,255,255,0.05)"}},
                        x:{ticks:{color:"#94a3b8"},grid:{display:false}}}}}/>
            </div>
          </div>

          {/* Detailed metrics */}
          <div className="card-elevated">
            <div className="sec-title" style={{marginBottom:14}}><span className="dot" style={{background:"var(--accent3)"}}></span>Detailed Metrics</div>
            {models.map((m,i) => (
              <div key={i} style={{paddingBottom:12,marginBottom:12,borderBottom:"1px solid var(--border)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontWeight:600,fontSize:13,color:i===2?"var(--accent)":"var(--text)"}}>{m.label}{i===2?" 🏆":""}</span>
                  <span style={{fontWeight:700,color:i===2?"var(--accent)":"var(--text)"}}>{fmt(m.accuracy)}</span>
                </div>
                <div className="progress-bar" style={{marginBottom:6}}>
                  <div className="progress-fill" style={{width:`${(m.accuracy-0.6)*250}%`,background:m.color}}></div>
                </div>
                <div style={{fontSize:11,color:"var(--text3)"}}>
                  F1: {fmt(m.f1)} · Precision: {fmt(m.precision)} · Recall: {fmt(m.recall)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid2" style={{gap:20}}>
          {/* Confusion matrix */}
          <div className="card-elevated">
            <div className="sec-title" style={{marginBottom:14}}><span className="dot" style={{background:"var(--accent2)"}}></span>Confusion Matrix — Random Forest</div>
            {result.confusionMatrix && <ConfusionMatrix cm={result.confusionMatrix} />}
          </div>

          {/* Per-subject classification */}
          <div className="card-elevated">
            <div className="sec-title" style={{marginBottom:14}}><span className="dot" style={{background:"var(--accent4)"}}></span>Performance Classification</div>
            {result.subjectClassifications.map((s,i) => {
              const col = s.level==="High"?"var(--accent3)":s.level==="Medium"?"var(--accent4)":"var(--accent5)";
              const tc  = s.level==="High"?"tag-green":s.level==="Medium"?"tag-amber":"tag-red";
              return (
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
                  <span style={{fontSize:13,fontWeight:500}}>{s.subjectName}</span>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:12,color:"var(--text2)"}}>{s.score}%</span>
                    <div className="progress-bar" style={{width:80,margin:0}}>
                      <div className="progress-fill" style={{width:`${s.score}%`,background:col}}></div>
                    </div>
                    <span className={`tag ${tc}`}>{s.level}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>}

      {!result && !loading && (
        <div className="card-elevated" style={{textAlign:"center",padding:48}}>
          <div style={{fontSize:40,marginBottom:16}}>🧠</div>
          <h3 style={{marginBottom:8}}>No ML Results Yet</h3>
          <p style={{color:"var(--text2)",marginBottom:20}}>Click "Train & Evaluate" to run all three classifiers</p>
          <button className="btn btn-purple" onClick={train}>▶ Train Models</button>
        </div>
      )}
    </div>
  );
}

function ConfusionMatrix({ cm }) {
  const { classes, matrix } = cm;
  const maxVal = Math.max(...matrix.flat());
  const BGCOLORS = [
    a => `rgba(239,68,68,${a})`,
    a => `rgba(245,158,11,${a})`,
    a => `rgba(16,185,129,${a})`
  ];
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <div style={{fontSize:11,color:"var(--text3)"}}>Predicted →</div>
      <table style={{borderCollapse:"separate",borderSpacing:6}}>
        <thead>
          <tr>
            <td></td>
            {classes.map(c => <td key={c} style={{textAlign:"center",fontSize:11,color:"var(--text2)",padding:"0 4px"}}>{c}</td>)}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row,i) => (
            <tr key={i}>
              <td style={{fontSize:11,color:"var(--text2)",paddingRight:8,textAlign:"right"}}>{classes[i]}</td>
              {row.map((v,j) => {
                const isDiag = i===j;
                const intensity = maxVal>0?v/maxVal:0;
                const bg = isDiag ? BGCOLORS[i](0.25+intensity*0.65) : "rgba(30,45,69,0.6)";
                return (
                  <td key={j}><div style={{width:76,height:56,display:"flex",alignItems:"center",justifyContent:"center",
                                           background:bg,borderRadius:7,fontSize:18,fontWeight:700,color:isDiag?"white":"var(--text2)"}}>
                    {v}
                  </div></td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{fontSize:11,color:"var(--text3)"}}>Diagonal = correct predictions</div>
    </div>
  );
}

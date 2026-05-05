// src/pages/LoginPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, register, guestLogin, student } = useAuth();
  const nav = useNavigate();
  const [mode, setMode]     = useState("login"); // login | register
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [form, setForm]     = useState({ name:"", email:"", password:"", studyLevel:"Undergraduate", studyHoursPerDay:6 });

  if (student) { nav("/dashboard"); return null; }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form);
      nav("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const handleGuest = async () => {
    setLoading(true);
    try { await guestLogin("Guest Student"); nav("/dashboard"); }
    catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
                  background:"radial-gradient(ellipse at 20% 50%, rgba(79,142,247,0.08) 0%, transparent 60%), var(--bg)",
                  padding:20 }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:56,height:56,background:"linear-gradient(135deg,var(--accent),var(--accent2))",
                        borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:26,margin:"0 auto 14px",boxShadow:"0 0 30px rgba(79,142,247,0.3)" }}>🎓</div>
          <h1 style={{ fontFamily:"var(--font2)",fontSize:26,fontWeight:800,marginBottom:6 }}>StudyAI</h1>
          <p style={{ color:"var(--text2)",fontSize:13 }}>AI-Powered Study Planner · Research Edition</p>
        </div>

        {/* Card */}
        <div className="card-elevated" style={{ padding:28 }}>
          {/* Mode toggle */}
          <div style={{ display:"flex",gap:4,background:"var(--bg3)",borderRadius:10,padding:4,marginBottom:22 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{ flex:1,padding:"8px 0",borderRadius:7,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,
                         fontFamily:"var(--font)",transition:"all 0.2s",
                         background: mode===m ? "var(--accent)" : "transparent",
                         color: mode===m ? "#fff" : "var(--text2)" }}>
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-danger" style={{marginBottom:14}}>⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Arjun Sharma" value={form.name} onChange={set("name")} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} required />
            </div>
            {mode === "register" && (
              <div className="grid2" style={{ gap:10 }}>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Study Level</label>
                  <select className="form-input" value={form.studyLevel} onChange={set("studyLevel")}>
                    <option>High School</option>
                    <option>Undergraduate</option>
                    <option>Postgraduate</option>
                    <option>Competitive Exam</option>
                  </select>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Hours/Day</label>
                  <input className="form-input" type="number" min="1" max="16" value={form.studyHoursPerDay} onChange={set("studyHoursPerDay")} />
                </div>
              </div>
            )}
            <button className="btn btn-primary btn-lg btn-full" type="submit" disabled={loading} style={{marginTop:18}}>
              {loading ? <><span className="spinner"></span> Please wait…</> : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </form>

          <div style={{ display:"flex",alignItems:"center",gap:10,margin:"16px 0" }}>
            <div className="divider" style={{flex:1,margin:0}}></div>
            <span style={{color:"var(--text3)",fontSize:12}}>or</span>
            <div className="divider" style={{flex:1,margin:0}}></div>
          </div>

          <button className="btn btn-secondary btn-full" onClick={handleGuest} disabled={loading}>
            ⚡ Continue as Guest (No signup needed)
          </button>
        </div>

        <p style={{ textAlign:"center",color:"var(--text3)",fontSize:12,marginTop:16 }}>
          ML · RL · LLM · MongoDB · Node.js · React
        </p>
      </div>
    </div>
  );
}

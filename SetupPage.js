// src/pages/SetupPage.js — with PDF upload + API key config
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { studentAPI, planAPI, taskAPI, mlAPI, rlAPI, llmAPI, pdfAPI } from "../services/api";

export default function SetupPage() {
  const { student, refreshStudent } = useAuth();
  const nav = useNavigate();

  const [profile, setProfile]   = useState({ name:"", studyLevel:"Undergraduate", studyHoursPerDay:6, examDate:"", syllabus:"" });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState({ type:"", text:"" });

  // PDF state
  const [pdfInfo, setPdfInfo]       = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfAnalysis, setPdfAnalysis] = useState("");
  const [analyzingPdf, setAnalyzingPdf] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (student) {
      setProfile({
        name:             student.name || "",
        studyLevel:       student.studyLevel || "Undergraduate",
        studyHoursPerDay: student.studyHoursPerDay || 6,
        examDate:         student.examDate ? student.examDate.split("T")[0] : "",
        syllabus:         student.syllabus || ""
      });
      setSubjects(student.subjects?.length ? student.subjects : [
        { name:"Mathematics", marks:62, total:100 },
        { name:"Physics",     marks:74, total:100 },
        { name:"Chemistry",   marks:58, total:100 },
        { name:"Biology",     marks:81, total:100 },
        { name:"English",     marks:88, total:100 }
      ]);
      // Load PDF info
      pdfAPI.getInfo().then(r => { if (r.data.hasPdf) setPdfInfo(r.data); }).catch(()=>{});
    }
  }, [student]);

  const addSubject    = () => setSubjects(s => [...s, { name:"New Subject", marks:70, total:100 }]);
  const removeSubject = i  => setSubjects(s => s.filter((_,idx) => idx !== i));
  const updateSubject = (i, k, v) => setSubjects(s => s.map((sub, idx) => idx===i ? { ...sub, [k]: k==="name"?v:+v } : sub));
  const pf = k => e => setProfile(p => ({ ...p, [k]: e.target.value }));

  const showMsg = (type, text, ms=4000) => {
    setMsg({ type, text });
    if (ms) setTimeout(() => setMsg({ type:"", text:"" }), ms);
  };

  // PDF upload handler
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") { showMsg("danger", "Please select a PDF file"); return; }
    if (file.size > 10 * 1024 * 1024) { showMsg("danger", "PDF too large. Max 10MB."); return; }

    setPdfLoading(true);
    showMsg("info", `Uploading and parsing ${file.name}...`, 0);
    try {
      const r = await pdfAPI.upload(file);
      setPdfInfo({ hasPdf:true, fileName:r.data.fileName, pages:r.data.pageCount, words:r.data.wordCount, preview:r.data.preview });
      showMsg("success", `✓ PDF parsed: ${r.data.pageCount} pages, ${r.data.wordCount} words extracted`);
    } catch (e) {
      showMsg("danger", e.response?.data?.message || "PDF upload failed: " + e.message);
    }
    setPdfLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyzePdf = async () => {
    setAnalyzingPdf(true);
    setPdfAnalysis("");
    showMsg("info", "Analyzing PDF with AI...", 0);
    try {
      const r = await pdfAPI.analyze();
      setPdfAnalysis(r.data.analysis);
      showMsg("success", "✓ PDF analyzed successfully");
    } catch (e) {
      showMsg("danger", e.response?.data?.message || e.message);
    }
    setAnalyzingPdf(false);
  };

  const handleRemovePdf = async () => {
    try { await pdfAPI.remove(); setPdfInfo(null); setPdfAnalysis(""); showMsg("success","PDF removed"); }
    catch (e) { showMsg("danger", e.message); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await studentAPI.updateProfile(profile);
      await studentAPI.updateSubjects({ subjects });
      await refreshStudent();
      showMsg("success", "Profile saved to MongoDB ✓");
    } catch (e) { showMsg("danger", e.response?.data?.message || e.message); }
    setSaving(false);
  };

  const generateAll = async () => {
    setLoading(true);
    showMsg("info", "Saving profile to MongoDB...", 0);
    try {
      await studentAPI.updateProfile(profile);
      await studentAPI.updateSubjects({ subjects });
      await refreshStudent();

      showMsg("info", "Generating study plan...", 0);
      await planAPI.generate();

      showMsg("info", "Creating daily tasks...", 0);
      const getPct = s => Math.round((s.marks/s.total)*100);
      const totalW = subjects.reduce((a,s)=>{const p=getPct(s);return a+(p<50?2.5:p<65?1.9:p<80?1.3:1.0);},0);
      const actions = ["Study","Review Notes","Practice Problems","Solve Past Papers"];
      const tasks   = subjects.map(s => {
        const p=getPct(s); const w=p<50?2.5:p<65?1.9:p<80?1.3:1.0;
        const h=+((w/totalW)*(profile.studyHoursPerDay||6)).toFixed(1);
        return { subject:s.name, action:actions[Math.floor(Math.random()*3)], topic:"Core topics", duration:h+"h", completed:false };
      });
      await taskAPI.bulkCreate(tasks);

      showMsg("info", "Training ML models...", 0);
      await mlAPI.train();

      showMsg("info", "Running RL Q-Learning...", 0);
      await rlAPI.run();

      showMsg("info", "Generating LLM recommendations...", 0);
      try { await llmAPI.generateStudyPlan(); } catch {}

      showMsg("success", "✓ All systems ready! Redirecting to Study Plan...", 2000);
      setTimeout(() => nav("/dashboard/plan"), 1500);
    } catch (e) {
      showMsg("danger", e.response?.data?.message || e.message);
    }
    setLoading(false);
  };

  return (
    <div className="fade-up">
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, marginBottom:6 }}>Student Profile Setup</h2>
        <p style={{ color:"var(--text2)", fontSize:13 }}>Configure your academic profile — all data stored in MongoDB</p>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom:16 }}>
          <span>{msg.type==="success"?"✓":msg.type==="danger"?"✕":msg.type==="info"?"⏳":"⚠"}</span>
          <div>{msg.text}</div>
        </div>
      )}

      <div className="grid2" style={{ gap:22, alignItems:"start" }}>
        {/* LEFT COLUMN */}
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

          {/* Personal Info */}
          <div className="card-elevated">
            <div className="sec-head"><div className="sec-title"><span className="dot"></span>Personal Info</div></div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={profile.name} onChange={pf("name")} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label className="form-label">Study Level</label>
              <select className="form-input" value={profile.studyLevel} onChange={pf("studyLevel")}>
                {["High School","Undergraduate","Postgraduate","Competitive Exam"].map(l=><option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="grid2" style={{ gap:10 }}>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Study Hours/Day</label>
                <input className="form-input" type="number" min="1" max="16" value={profile.studyHoursPerDay} onChange={pf("studyHoursPerDay")} />
              </div>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Exam Date</label>
                <input className="form-input" type="date" value={profile.examDate} onChange={pf("examDate")} />
              </div>
            </div>
          </div>

          {/* API Key Config */}
          <div className="card-elevated">
            <div className="sec-head">
              <div className="sec-title"><span className="dot" style={{ background:"var(--accent3)" }}></span>LLM API Configuration</div>
              <span className="tag tag-green" style={{ fontSize:10 }}>Secure</span>
            </div>
            <div className="alert alert-info" style={{ fontSize:12, marginBottom:12 }}>
              <span>🔑</span>
              <div>API key is stored securely in <strong>backend/.env</strong> — never sent to the browser</div>
            </div>
            <div style={{ background:"var(--bg3)", borderRadius:8, padding:"12px 14px", border:"1px solid var(--border)", marginBottom:12 }}>
              <div style={{ fontSize:11, color:"var(--text3)", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.7px" }}>backend/.env</div>
              <code style={{ fontSize:12, color:"var(--accent3)", fontFamily:"monospace" }}>ANTHROPIC_API_KEY=sk-ant-api03-...</code>
            </div>
            <div style={{ fontSize:12, color:"var(--text2)" }}>
              Get your key at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer"
                style={{ color:"var(--accent)" }}>console.anthropic.com</a> → API Keys → Create Key
            </div>
            <div style={{ marginTop:10, padding:"8px 12px", borderRadius:7,
                          background: student?.pdfSyllabusText || profile.syllabus ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                          border: `1px solid ${student?.pdfSyllabusText || profile.syllabus ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
                          fontSize:12, color: student?.pdfSyllabusText || profile.syllabus ? "var(--accent3)" : "var(--accent4)" }}>
              {pdfInfo?.hasPdf ? `📄 PDF loaded: ${pdfInfo.fileName}` : "💡 Tip: Upload a syllabus PDF below for AI topic analysis"}
            </div>
          </div>

          {/* PDF Upload */}
          <div className="card-elevated">
            <div className="sec-head">
              <div className="sec-title"><span className="dot" style={{ background:"var(--accent2)" }}></span>📄 Syllabus PDF Upload</div>
              {pdfInfo?.hasPdf && (
                <button className="btn btn-secondary btn-sm" onClick={handleRemovePdf} style={{ color:"var(--accent5)" }}>✕ Remove</button>
              )}
            </div>

            {!pdfInfo?.hasPdf ? (
              <div>
                <div style={{ border:"2px dashed var(--border2)", borderRadius:10, padding:24, textAlign:"center",
                              cursor:"pointer", transition:"all 0.2s", marginBottom:12 }}
                     onClick={() => fileInputRef.current?.click()}
                     onDragOver={e=>e.preventDefault()}
                     onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f){const inp=fileInputRef.current;const dt=new DataTransfer();dt.items.add(f);inp.files=dt.files;handlePdfUpload({target:inp});}}}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
                  <div style={{ fontWeight:600, marginBottom:4 }}>Drop your syllabus PDF here</div>
                  <div style={{ fontSize:12, color:"var(--text3)", marginBottom:14 }}>or click to browse · Max 10MB</div>
                  <button className="btn btn-secondary btn-sm" disabled={pdfLoading}>
                    {pdfLoading ? <><span className="spinner"></span> Uploading…</> : "📁 Choose PDF File"}
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf" style={{ display:"none" }} onChange={handlePdfUpload} />
                <p style={{ fontSize:11, color:"var(--text3)", textAlign:"center" }}>
                  Upload your course syllabus, exam schedule, or study guide PDF
                </p>
              </div>
            ) : (
              <div>
                <div style={{ padding:"12px 14px", background:"rgba(16,185,129,0.08)", borderRadius:9,
                              border:"1px solid rgba(16,185,129,0.25)", marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:"var(--accent3)" }}>✓ {pdfInfo.fileName}</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <span className="tag tag-green">{pdfInfo.pages} pages</span>
                      <span className="tag tag-blue">{pdfInfo.words} words</span>
                    </div>
                  </div>
                  {pdfInfo.preview && (
                    <div style={{ fontSize:11, color:"var(--text2)", lineHeight:1.6,
                                  background:"var(--bg3)", padding:"8px 10px", borderRadius:6,
                                  maxHeight:80, overflow:"hidden" }}>
                      {pdfInfo.preview}
                    </div>
                  )}
                </div>
                <button className="btn btn-purple btn-full" onClick={handleAnalyzePdf} disabled={analyzingPdf}>
                  {analyzingPdf ? <><span className="spinner"></span> Analyzing with AI…</> : "🤖 Analyze PDF with AI"}
                </button>
                {pdfAnalysis && (
                  <div style={{ marginTop:14, padding:14, background:"var(--bg3)", borderRadius:9,
                                border:"1px solid var(--border2)", fontSize:13, lineHeight:1.8,
                                color:"var(--text2)", whiteSpace:"pre-wrap", maxHeight:300, overflowY:"auto" }}>
                    {pdfAnalysis}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid2" style={{ gap:10 }}>
            <button className="btn btn-secondary" onClick={saveProfile} disabled={saving}>
              {saving ? <><span className="spinner"></span> Saving…</> : "💾 Save Profile"}
            </button>
            <button className="btn btn-primary" onClick={generateAll} disabled={loading}>
              {loading ? <><span className="spinner"></span> Running…</> : "✨ Generate All"}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="card-elevated">
          <div className="sec-head">
            <div className="sec-title"><span className="dot" style={{ background:"var(--accent4)" }}></span>Subjects & Marks</div>
            <button className="btn btn-secondary btn-sm" onClick={addSubject}>＋ Add</button>
          </div>

          <div style={{ maxHeight:340, overflowY:"auto", marginBottom:16 }}>
            {subjects.map((s, i) => {
              const pct = Math.round((s.marks/s.total)*100);
              const col = pct>=75?"var(--accent3)":pct>=60?"var(--accent4)":"var(--accent5)";
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px",
                                      background:"var(--bg3)", borderRadius:10, marginBottom:8,
                                      border:`1px solid ${pct<60?"rgba(239,68,68,0.3)":"var(--border)"}` }}>
                  <div style={{ width:4, height:36, borderRadius:2, background:col, flexShrink:0 }}></div>
                  <input className="form-input" style={{ flex:1 }} value={s.name}
                         onChange={e=>updateSubject(i,"name",e.target.value)} placeholder="Subject name" />
                  <input className="form-input" style={{ width:60, textAlign:"center", padding:"8px 4px" }}
                         type="number" value={s.marks} min="0" max={s.total}
                         onChange={e=>updateSubject(i,"marks",e.target.value)} />
                  <span style={{ color:"var(--text3)", fontSize:12 }}>/</span>
                  <input className="form-input" style={{ width:60, textAlign:"center", padding:"8px 4px" }}
                         type="number" value={s.total} min="1"
                         onChange={e=>updateSubject(i,"total",e.target.value)} />
                  <span style={{ fontSize:11, fontWeight:700, color:col, minWidth:34, textAlign:"center" }}>{pct}%</span>
                  <button className="btn btn-secondary btn-sm" style={{ padding:"6px 9px" }} onClick={()=>removeSubject(i)}>✕</button>
                </div>
              );
            })}
          </div>

          {/* Performance summary bar */}
          {subjects.length > 0 && (
            <div style={{ padding:"10px 12px", background:"var(--bg3)", borderRadius:8, border:"1px solid var(--border)", marginBottom:16 }}>
              <div style={{ fontSize:11, color:"var(--text3)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.7px" }}>Performance Overview</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {subjects.map((s,i) => {
                  const p=Math.round((s.marks/s.total)*100);
                  const c=p>=75?"var(--accent3)":p>=60?"var(--accent4)":"var(--accent5)";
                  return <span key={i} style={{ fontSize:11, padding:"2px 8px", borderRadius:20,
                    background:c+"22", color:c, fontWeight:600 }}>{s.name} {p}%</span>;
                })}
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom:16 }}>
            <label className="form-label">Syllabus Topics (manual — or upload PDF above)</label>
            <textarea className="form-input" rows={4} value={profile.syllabus} onChange={pf("syllabus")}
              placeholder={"Math: Calculus, Algebra, Trigonometry\nPhysics: Mechanics, Optics, Thermodynamics\nChemistry: Organic, Inorganic"} />
          </div>

          <button className="btn btn-primary btn-lg btn-full" onClick={generateAll} disabled={loading}>
            {loading ? <><span className="spinner"></span> Running All AI Engines…</> : "✨ Generate AI Study Plan & Full Analysis"}
          </button>
        </div>
      </div>
    </div>
  );
}

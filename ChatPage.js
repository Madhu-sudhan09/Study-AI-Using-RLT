// src/pages/ChatPage.js — improved with better UI and context display
import React, { useState, useEffect, useRef } from "react";
import { chatAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const SESSION_ID = "session_" + Date.now();

const SUGGESTIONS = [
  { icon:"📊", text:"What are my weakest subjects and how should I improve them?" },
  { icon:"📅", text:"Create a detailed daily study schedule for me" },
  { icon:"🧠", text:"Explain my ML model results and what they mean" },
  { icon:"🎮", text:"What does the RL engine recommend for this week?" },
  { icon:"📚", text:"Give me the best techniques for memorizing difficult topics" },
  { icon:"⏱", text:"How can I improve my exam time management and score higher?" },
  { icon:"🎯", text:"Which subjects should I prioritize and why?" },
  { icon:"📈", text:"Give me a 30-day improvement plan based on my marks" }
];

export default function ChatPage() {
  const { student } = useAuth();
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [clearing, setClearing]   = useState(false);
  const [apiStatus, setApiStatus] = useState("unknown"); // "llm" | "fallback" | "unknown"
  const endRef  = useRef(null);
  const inputRef = useRef(null);

  const avg    = student?.subjects?.reduce((a,s)=>a+(s.marks/s.total)*100,0)/Math.max(1,student?.subjects?.length||1);
  const weak   = student?.subjects?.filter(s=>(s.marks/s.total)*100<60) || [];
  const strong = student?.subjects?.filter(s=>(s.marks/s.total)*100>=75) || [];

  useEffect(() => {
    // Welcome message
    const welcome = {
      role:"assistant", _id:"init",
      content:`👋 Hi ${student?.name || "there"}! I'm your AI Study Assistant.\n\nI have full access to your academic profile:\n${student?.subjects?.map(s=>`• ${s.name}: ${s.marks}/${s.total} = ${Math.round((s.marks/s.total)*100)}%`).join("\n") || "• No subjects yet — set them up in Setup tab"}\n\n${weak.length>0?`⚠️ Focus areas: ${weak.map(s=>s.name).join(", ")}\n`:""}${strong.length>0?`✅ Strong in: ${strong.map(s=>s.name).join(", ")}\n`:""}\nAsk me anything specific about your studies!`
    };
    setMessages([welcome]);

    // Load history
    chatAPI.getHistory(SESSION_ID)
      .then(r => { if (r.data.messages?.length) setMessages(prev => [...prev, ...r.data.messages]); })
      .catch(()=>{});
  }, [student]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const send = async (msgText) => {
    const msg = (msgText || input).trim();
    if (!msg || loading) return;
    setInput("");
    const userMsg = { role:"user", content:msg, _id: Date.now()+"u" };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const r = await chatAPI.send(msg, SESSION_ID);
      setApiStatus(r.data.usedLLM ? "llm" : "fallback");
      setMessages(prev => [...prev, { role:"assistant", content:r.data.reply, _id:Date.now()+"a", usedLLM:r.data.usedLLM }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role:"assistant", content:"❌ Error: " + (e.response?.data?.message || e.message),
        _id: Date.now()+"e"
      }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const clearHistory = async () => {
    if (!window.confirm("Clear all chat history?")) return;
    setClearing(true);
    try {
      await chatAPI.clearHistory();
      const welcome = messages[0];
      setMessages([welcome]);
    } catch (e) { alert(e.message); }
    setClearing(false);
  };

  return (
    <div className="fade-up">
      {/* Header */}
      <div className="sec-head" style={{ marginBottom:16 }}>
        <div>
          <h2 style={{ fontSize:22, marginBottom:4 }}>AI Study Assistant</h2>
          <p style={{ color:"var(--text2)", fontSize:13 }}>
            Powered by Claude via backend · Chat history saved in MongoDB
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {apiStatus !== "unknown" && (
            <span className={`tag ${apiStatus==="llm"?"tag-green":"tag-amber"}`}>
              {apiStatus==="llm"?"✦ Claude AI":"⚡ Smart Fallback"}
            </span>
          )}
          <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--text2)" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"var(--accent3)", display:"inline-block" }}></span>
            Online
          </span>
          <button className="btn btn-secondary btn-sm" onClick={clearHistory} disabled={clearing}>
            {clearing ? <span className="spinner"></span> : "🗑 Clear"}
          </button>
        </div>
      </div>

      {/* Student context strip */}
      {student?.subjects?.length > 0 && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14, padding:"10px 14px",
                      background:"var(--bg2)", borderRadius:9, border:"1px solid var(--border)" }}>
          <span style={{ fontSize:11, color:"var(--text3)", marginRight:4, alignSelf:"center" }}>Context:</span>
          {student.subjects.map((s,i) => {
            const p=Math.round((s.marks/s.total)*100);
            const c=p>=75?"var(--accent3)":p>=60?"var(--accent4)":"var(--accent5)";
            return <span key={i} style={{ fontSize:11, padding:"2px 9px", borderRadius:20,
              background:c+"18", color:c, fontWeight:600 }}>{s.name} {p}%</span>;
          })}
        </div>
      )}

      {/* Chat window */}
      <div style={{ display:"flex", flexDirection:"column", height:450, marginBottom:16 }}>
        <div style={{ flex:1, overflowY:"auto", padding:"16px 18px", display:"flex", flexDirection:"column", gap:14,
                      background:"var(--bg3)", borderRadius:"12px 12px 0 0",
                      border:"1px solid var(--border2)", borderBottom:"none" }}>
          {messages.map((m, idx) => (
            <div key={m._id||idx}
                 style={{ display:"flex", gap:10, alignItems:"flex-start",
                          flexDirection: m.role==="user" ? "row-reverse" : "row",
                          animation:"fadeUp 0.3s ease both" }}>
              <div style={{ width:32, height:32, borderRadius:9, display:"flex", alignItems:"center",
                            justifyContent:"center", fontSize:14, flexShrink:0,
                            background: m.role==="user"
                              ? "linear-gradient(135deg,var(--accent3),#059669)"
                              : "linear-gradient(135deg,var(--accent),var(--accent2))" }}>
                {m.role==="user" ? "👤" : "🎓"}
              </div>
              <div style={{ maxWidth:"78%", display:"flex", flexDirection:"column",
                            alignItems: m.role==="user" ? "flex-end" : "flex-start", gap:4 }}>
                <div style={{ padding:"11px 15px", borderRadius:12, fontSize:13, lineHeight:1.75,
                              whiteSpace:"pre-wrap", wordWrap:"break-word",
                              background: m.role==="user"
                                ? "linear-gradient(135deg,var(--accent),#3b6fd4)"
                                : "var(--bg4)",
                              color: m.role==="user" ? "#fff" : "var(--text)",
                              border: m.role==="user" ? "none" : "1px solid var(--border2)" }}>
                  {m.content}
                </div>
                {m.usedLLM !== undefined && m.role==="assistant" && (
                  <span style={{ fontSize:10, color:"var(--text3)", padding:"1px 6px" }}>
                    {m.usedLLM ? "✦ Claude AI" : "⚡ Local AI"}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display:"flex", gap:10, alignItems:"flex-start", animation:"fadeUp 0.3s ease both" }}>
              <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,var(--accent),var(--accent2))",
                            display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🎓</div>
              <div style={{ padding:"12px 16px", borderRadius:12, background:"var(--bg4)", border:"1px solid var(--border2)", display:"flex", gap:4, alignItems:"center" }}>
                {[0,200,400].map(d => (
                  <span key={d} style={{ width:6, height:6, borderRadius:"50%", background:"var(--text2)", display:"inline-block",
                                         animation:`blink 1.3s ${d}ms infinite` }}></span>
                ))}
                <style>{`@keyframes blink{0%,60%,100%{opacity:0.2}30%{opacity:1}}`}</style>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ display:"flex", gap:10, padding:"12px 14px", background:"var(--bg4)",
                      border:"1px solid var(--border2)", borderRadius:"0 0 12px 12px" }}>
          <input ref={inputRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about your marks, study strategies, ML/RL results, exam tips..."
            disabled={loading}
            style={{ flex:1, background:"var(--bg3)", border:"1px solid var(--border2)", borderRadius:8,
                     padding:"10px 14px", color:"var(--text)", fontFamily:"var(--font)", fontSize:13, outline:"none" }} />
          <button className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()}>
            {loading ? <span className="spinner"></span> : "Send ↗"}
          </button>
        </div>
      </div>

      {/* Suggestion chips */}
      <div>
        <p style={{ fontSize:11, color:"var(--text3)", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.8px" }}>
          Quick questions
        </p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} className="btn btn-secondary btn-sm"
                    onClick={() => send(s.text)} disabled={loading}
                    style={{ fontSize:12 }}>
              {s.icon} {s.text.length > 40 ? s.text.slice(0,38)+"…" : s.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

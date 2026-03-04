import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from '../supabaseClient';

const BACKEND_URL = "https://ai-powered-personalized-learning-path-gb1i.onrender.com";

function AssessmentResults() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [expandedQ, setExpandedQ] = useState(null);
  const result = state?.result;

  if (!result) {
    return (
      <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f0fafa,#f8fafc,#e8f5f5)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui" }}>
        <div style={{ textAlign:"center", background:"#fff", borderRadius:20, padding:"48px 40px", border:"1.5px solid #e5e7eb", boxShadow:"0 4px 24px rgba(0,0,0,.06)" }}>
          <div style={{ fontSize:56, marginBottom:16 }}>warning</div>
          <h2 style={{ margin:"0 0 8px", color:"#111", fontSize:22, fontWeight:800 }}>No Result Found</h2>
          <p style={{ color:"#6b7280", marginBottom:28 }}>Assessment result was not received.</p>
          <button onClick={() => navigate("/assessment")} style={{ padding:"12px 28px", background:"#2B7A78", color:"#fff", border:"none", borderRadius:12, cursor:"pointer", fontWeight:700 }}>
            Retake Assessment
          </button>
        </div>
      </div>
    );
  }

  const assessmentId = result.assessment_id || result.id || null;
  const attemptNumber = result.attempt_number ?? result.attempt ?? null;
  const learner = result.learner || {};
  const learnerName = learner.name || learner.full_name || result.name || "---";
  const learnerEmail = learner.email || result.email || "---";
  const domain = result.domain || result.target_role || learner.target_role || "---";

  const correct = typeof result.correct === "number" ? result.correct
    : typeof result.correct_answers === "number" ? result.correct_answers
    : typeof result.score === "number" ? result.score : null;
  const total = typeof result.total === "number" ? result.total
    : typeof result.total_questions === "number" ? result.total_questions
    : (result.questions && result.questions.length) || null;
  const percentage = typeof result.overall_percentage === "number"
    ? Math.round(result.overall_percentage)
    : (typeof correct === "number" && typeof total === "number" && total > 0)
    ? Math.round((correct / total) * 100) : 0;

  const timeTakenSeconds = result.time_taken_seconds ?? result.time_taken ?? 0;
  const minutes = Math.floor(timeTakenSeconds / 60);
  const seconds = timeTakenSeconds % 60;
  const difficultyBreakdown = result.difficulty_breakdown || result.difficulty || {};
  const skillReport = result.skill_report || [];
  const questionDetails = result.question_details || result.questionDetails || [];

  const scoreLabel = percentage >= 80
    ? { text:"Excellent! 🚀", color:"#059669", bg:"rgba(5,150,105,.15)" }
    : percentage >= 60
    ? { text:"Good Progress 👍", color:"#d97706", bg:"rgba(217,119,6,.15)" }
    : { text:"Keep Practicing 💪", color:"#dc2626", bg:"rgba(220,38,38,.15)" };

  const card = { background:"#fff", borderRadius:16, border:"1.5px solid #e5e7eb", padding:"24px", marginBottom:16, boxShadow:"0 2px 8px rgba(0,0,0,.04)" };
  const circumference = 2 * Math.PI * 48;

  const downloadPDF = async () => {
    if (!assessmentId) { alert("No assessment ID."); return; }
    try {
      const resp = await fetch(BACKEND_URL + "/assessment/" + assessmentId + "/report.pdf");
      if (!resp.ok) throw new Error("Failed");
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "assessment_" + assessmentId + ".pdf";
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); window.URL.revokeObjectURL(url);
    } catch { alert("PDF download failed"); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f0fafa 0%,#f8fafc 60%,#e8f5f5 100%)", fontFamily:"system-ui,sans-serif" }}>

      <header style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:860, margin:"0 auto", padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:38, height:38, background:"linear-gradient(135deg,#2B7A78,#3aafa9)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:18, fontWeight:900 }}>+</div>
            <span style={{ fontSize:18, fontWeight:800, color:"#111" }}>SkillPath AI</span>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            {assessmentId && <button onClick={downloadPDF} style={{ padding:"8px 16px", background:"rgba(43,122,120,.1)", color:"#2B7A78", border:"1.5px solid rgba(43,122,120,.2)", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13 }}>Download PDF</button>}
            <button onClick={() => navigate("/")} style={{ padding:"8px 16px", background:"#fff", color:"#374151", border:"1.5px solid #e5e7eb", borderRadius:10, cursor:"pointer", fontWeight:600, fontSize:13 }}>Home</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"32px 20px" }}>

        <div style={{ marginBottom:24 }}>
          <h1 style={{ margin:0, fontSize:28, fontWeight:900, color:"#111" }}>Assessment Results</h1>
          <p style={{ margin:"6px 0 0", color:"#6b7280", fontSize:15 }}>Detailed breakdown of your performance</p>
        </div>

        <div style={{ background:"linear-gradient(135deg,#2B7A78 0%,#3aafa9 100%)", borderRadius:20, padding:"32px", marginBottom:16, color:"#fff", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-20, right:-20, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,.08)" }} />
          <div style={{ display:"flex", alignItems:"center", gap:28, flexWrap:"wrap", position:"relative" }}>
            <div style={{ position:"relative", width:110, height:110, flexShrink:0 }}>
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="48" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="8"/>
                <circle cx="55" cy="55" r="48" fill="none" stroke="#fff" strokeWidth="8"
                  strokeDasharray={circumference} strokeDashoffset={circumference*(1-percentage/100)}
                  strokeLinecap="round" transform="rotate(-90 55 55)" />
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:22, fontWeight:900 }}>{percentage}%</span>
              </div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, opacity:.8, fontWeight:600, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Your Score</div>
              <div style={{ fontSize:32, fontWeight:900, lineHeight:1 }}>{correct ?? "?"} / {total ?? "?"} correct</div>
              <div style={{ marginTop:8, fontSize:14, opacity:.9 }}>{minutes}m {seconds}s · {domain}</div>
              <div style={{ marginTop:12, display:"inline-block", background:scoreLabel.bg, color:scoreLabel.color, padding:"6px 16px", borderRadius:20, fontSize:13, fontWeight:800 }}>{scoreLabel.text}</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, minWidth:150 }}>
              {[["Learner", learnerName], ["Attempt", "#" + (attemptNumber ?? "?")], ["ID", assessmentId ? assessmentId.slice(0,8)+"..." : "?"]].map(function(item) {
                return (
                  <div key={item[0]} style={{ background:"rgba(255,255,255,.15)", borderRadius:10, padding:"8px 14px" }}>
                    <div style={{ fontSize:10, opacity:.7, fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>{item[0]}</div>
                    <div style={{ fontSize:14, fontWeight:700, marginTop:2 }}>{item[1]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          <div style={{ ...card, marginBottom:0 }}>
            <h3 style={{ margin:"0 0 18px", fontSize:15, fontWeight:800, color:"#111" }}>Performance by Difficulty</h3>
            {["Easy","Medium","Hard"].map(function(lvl) {
              var d = difficultyBreakdown[lvl] || { correct:0, total:0 };
              var pct = d.total > 0 ? Math.round((d.correct/d.total)*100) : 0;
              var clrs = { Easy:"#059669", Medium:"#d97706", Hard:"#dc2626" };
              var bgs = { Easy:"#dcfce7", Medium:"#fef3c7", Hard:"#fee2e2" };
              return (
                <div key={lvl} style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"#374151" }}>{lvl}</span>
                    <span style={{ fontSize:12, fontWeight:700, padding:"2px 10px", borderRadius:20, background:bgs[lvl], color:clrs[lvl] }}>{d.correct}/{d.total} · {pct}%</span>
                  </div>
                  <div style={{ height:8, background:"#f3f4f6", borderRadius:99, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:pct+"%", background:clrs[lvl], borderRadius:99 }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ ...card, marginBottom:0 }}>
            <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:800, color:"#111" }}>Learner Info</h3>
            {[["Name", learnerName],["Email", learnerEmail],["Domain", domain],["Assessment ID", assessmentId || "?"]].map(function(item) {
              return (
                <div key={item[0]} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid #f3f4f6" }}>
                  <span style={{ fontSize:12, color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:.5 }}>{item[0]}</span>
                  <span style={{ fontSize:13, color:"#111", fontWeight:600, maxWidth:180, textAlign:"right", wordBreak:"break-all" }}>{item[1]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={card}>
          <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:800, color:"#111" }}>Skill Gap Analysis <span style={{ fontSize:12, color:"#9ca3af", fontWeight:400 }}>pass: 60%</span></h3>
          {skillReport.length === 0
            ? <p style={{ color:"#9ca3af", fontSize:14, margin:0 }}>No skill data available.</p>
            : skillReport.map(function(s, i) {
                var cur = s.percentage != null ? s.percentage : (s.perc != null ? s.perc : 0);
                var pass = cur >= 60;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderRadius:12, marginBottom:10, background:pass?"#f0fdf4":"#fff5f5", border:"1.5px solid "+(pass?"#bbf7d0":"#fecaca") }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontSize:14, fontWeight:700, color:"#111" }}>{s.skill || s.name}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:pass?"#059669":"#dc2626" }}>{cur}%</span>
                      </div>
                      <div style={{ height:7, background:pass?"#dcfce7":"#fee2e2", borderRadius:99, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:cur+"%", background:pass?"#059669":"#ef4444", borderRadius:99 }} />
                      </div>
                    </div>
                    <span style={{ fontSize:11, fontWeight:800, padding:"5px 12px", borderRadius:20, background:pass?"#059669":"#dc2626", color:"#fff", whiteSpace:"nowrap" }}>{pass?"PASS":"NEEDS WORK"}</span>
                  </div>
                );
              })
          }
        </div>

        <div style={card}>
          <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:800, color:"#111" }}>Answer Review <span style={{ fontSize:12, color:"#9ca3af", fontWeight:400 }}>click to expand</span></h3>
          {questionDetails.length === 0
            ? <p style={{ color:"#9ca3af", fontSize:14, margin:0 }}>No question details available.</p>
            : questionDetails.map(function(q, idx) {
                var isCorrect = !!q.is_correct;
                var your = String(q.your_answer || "?").toUpperCase();
                var correctAns = String(q.correct_answer || "?").toUpperCase();
                var options = q.options || {};
                var isExpanded = expandedQ === idx;
                return (
                  <div key={idx} style={{ borderRadius:12, marginBottom:8, border:"1.5px solid "+(isCorrect?"#bbf7d0":"#fecaca"), overflow:"hidden" }}>
                    <div onClick={function(){ setExpandedQ(isExpanded ? null : idx); }}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px", background:isCorrect?"#f0fdf4":"#fff5f5", cursor:"pointer", userSelect:"none" }}>
                      <span style={{ width:26, height:26, borderRadius:"50%", background:isCorrect?"#059669":"#dc2626", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, flexShrink:0 }}>
                        {isCorrect ? "V" : "X"}
                      </span>
                      <span style={{ fontSize:14, fontWeight:600, color:"#111", flex:1 }}>
                        Q{idx+1}. {q.question_text ? q.question_text.slice(0,80) + (q.question_text.length > 80 ? "..." : "") : ""}
                      </span>
                      <span style={{ color:"#9ca3af" }}>{isExpanded ? "^" : "v"}</span>
                    </div>
                    {isExpanded && (
                      <div style={{ padding:"16px", background:"#fff", borderTop:"1px solid "+(isCorrect?"#bbf7d0":"#fecaca") }}>
                        <p style={{ margin:"0 0 14px", fontSize:14, fontWeight:600, color:"#111", lineHeight:1.6 }}>{q.question_text}</p>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                          {["A","B","C","D"].map(function(lbl) {
                            var isYours = your === lbl;
                            var isRight = correctAns === lbl;
                            return (
                              <div key={lbl} style={{ padding:"10px 14px", borderRadius:10, fontSize:13, border:"2px solid "+(isRight?"#059669":isYours&&!isRight?"#dc2626":"#e5e7eb"), background:isRight?"#f0fdf4":isYours&&!isRight?"#fff5f5":"#f9fafb", color:isRight?"#059669":isYours&&!isRight?"#dc2626":"#374151", fontWeight:isYours||isRight?700:400 }}>
                                <strong>{lbl}.</strong> {options[lbl] || ""}
                                {isRight && <div style={{ fontSize:11, marginTop:4 }}>Correct answer</div>}
                                {isYours && !isRight && <div style={{ fontSize:11, marginTop:4 }}>Your answer</div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          }
        </div>

        <div style={{ display:"flex", gap:12, marginTop:8 }}>
          <button onClick={function(){ navigate("/learning-path"); }} style={{ flex:1, padding:"15px", background:"#2B7A78", color:"#fff", border:"none", borderRadius:14, cursor:"pointer", fontWeight:800, fontSize:16, boxShadow:"0 4px 14px rgba(43,122,120,.3)" }}>
            View Learning Path
          </button>
          <button onClick={function(){ navigate("/assessment"); }} style={{ padding:"15px 28px", background:"#fff", color:"#374151", border:"2px solid #e5e7eb", borderRadius:14, cursor:"pointer", fontWeight:700, fontSize:15 }}>
            Retake
          </button>
        </div>

        <p style={{ textAlign:"center", fontSize:11, color:"#9ca3af", marginTop:28 }}>
          2026 SkillPath AI Learning Systems. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default AssessmentResults;
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles, CheckCircle2, Circle, ExternalLink,
  BookOpen, Play, FileText, Code, Target, ChevronRight,
  Trophy, Flame, ArrowLeft, Zap, BarChart2,
  ChevronDown, ChevronUp, Loader2, AlertCircle,
  ListVideo, RefreshCw, Check
} from "lucide-react";
import supabase from "../supabaseClient";

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
function normalizeType(rawType, platform) {
  const t = (rawType ?? "").toLowerCase().trim();
  const p = (platform ?? "").toLowerCase().trim();
  if (t === "video" || t.startsWith("youtube") || p.includes("youtube")) return "video";
  if (t === "article" || t === "text" || t === "blog") return "article";
  if (t === "course") return "course";
  if (t === "project") return "project";
  // ── practice types — checked BEFORE falling back to "article" ──
  if (t === "practice" || t === "exercise" || t === "quiz" || t === "challenge" || t === "problem") return "practice";
  return "article";
}

// Skill match — exact case-insensitive
const skillMatches = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

// ─────────────────────────────────────────────────────────────────────────────
// PHASE FILTER
// Phase 0 (Basics)       → all resources, filtered by learning style (unchanged)
// Phase 1 (Intermediate) → resource_type = 'practice' (+ platform/url fallback)
// Phase 2+ (Advanced)    → resource_type = 'project'  (+ platform/url fallback)
// ─────────────────────────────────────────────────────────────────────────────
const PRACTICE_PLATFORMS = [
  "leetcode","hackerrank","kaggle","freecodecamp","codechef","codeforces",
  "interviewbit","geeksforgeeks","exercism","codewars","topcoder","codesignal","hackerearth"
];
const PROJECT_PLATFORMS = ["github","gitlab","bitbucket"];

function isPracticeResource(r) {
  // PRIMARY: check resource_type column directly
  const t = (r.resource_type ?? "").toLowerCase().trim();
  if (t === "practice" || t === "exercise" || t === "quiz" || t === "challenge" || t === "problem") return true;
  // SECONDARY: check platform / url
  const p = (r.platform ?? "").toLowerCase();
  const u = (r.url ?? "").toLowerCase();
  return PRACTICE_PLATFORMS.some(pl => p.includes(pl) || u.includes(pl));
}

function isProjectResource(r) {
  // PRIMARY: check resource_type column directly
  const t = (r.resource_type ?? "").toLowerCase().trim();
  if (t === "project") return true;
  // SECONDARY: check platform / url
  const p = (r.platform ?? "").toLowerCase();
  const u = (r.url ?? "").toLowerCase();
  return PROJECT_PLATFORMS.some(pl => p.includes(pl) || u.includes(pl));
}

// Apply phase-based filter to a set of resources that already matched a skill
function applyPhaseFilter(resources, phaseIndex) {
  if (phaseIndex === 0) return resources; // Basics: no change

  if (phaseIndex === 1) {
    // Intermediate: practice only
    const practice = resources.filter(r => isPracticeResource(r));
    return practice.length > 0 ? practice : resources; // fallback: all if none found
  }

  // Advanced (2+): projects only
  const projects = resources.filter(r => isProjectResource(r));
  return projects.length > 0 ? projects : resources; // fallback: all if none found
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPE CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_CFG = {
  video:    { icon: Play,     color: "bg-red-50 text-red-600 border-red-100",             label: "Video"    },
  article:  { icon: FileText, color: "bg-blue-50 text-blue-600 border-blue-100",          label: "Article"  },
  course:   { icon: BookOpen, color: "bg-purple-50 text-purple-600 border-purple-100",    label: "Course"   },
  project:  { icon: Code,     color: "bg-orange-50 text-orange-600 border-orange-100",    label: "Project"  },
  practice: { icon: Target,   color: "bg-emerald-50 text-emerald-600 border-emerald-100", label: "Practice" },
};

const DIFF_CFG = {
  easy:         "bg-green-50 text-green-700 border-green-100",
  medium:       "bg-yellow-50 text-yellow-700 border-yellow-100",
  hard:         "bg-red-50 text-red-700 border-red-100",
  beginner:     "bg-green-50 text-green-700 border-green-100",
  intermediate: "bg-yellow-50 text-yellow-700 border-yellow-100",
  advanced:     "bg-red-50 text-red-700 border-red-100",
};

const STYLE_TYPE_MAP = {
  Video:    ["video"],
  Text:     ["article"],
  Projects: ["project"],
  Mixed:    ["video", "article", "course", "project", "practice"],
};

/* ─────────────────────────────────────────────────────────────────────────────
   LOCALSTORAGE
───────────────────────────────────────────────────────────────────────────── */
function saveProgressToLS(pathId, phaseIndex, completedIds, allActiveIds) {
  try {
    localStorage.setItem(`lp_progress_${pathId}_phase_${phaseIndex}`, JSON.stringify([...completedIds]));
    localStorage.setItem(`lp_resources_${pathId}_phase_${phaseIndex}`, JSON.stringify(allActiveIds));
  } catch {}
}

function loadProgressFromLS(pathId, phaseIndex) {
  try {
    const raw = localStorage.getItem(`lp_progress_${pathId}_phase_${phaseIndex}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

/* ─────────────────────────────────────────────────────────────────────────────
   SVG RING
───────────────────────────────────────────────────────────────────────────── */
function Ring({ pct, size = 68, stroke = 6, color = "white" }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.9s ease" }} />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PLAYLIST PICKER MODAL
───────────────────────────────────────────────────────────────────────────── */
function PlaylistPickerModal({ skillPlaylists, onConfirm }) {
  const skills = Object.keys(skillPlaylists);
  const [selections, setSelections] = useState(() => {
    const init = {};
    skills.forEach(s => { init[s] = skillPlaylists[s][0]?.id ?? null; });
    return init;
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "white", borderRadius: "24px", width: "100%", maxWidth: "540px", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.25)" }}>
        <div style={{ background: "linear-gradient(135deg,#2B7A78,#3aafa9)", padding: "24px 28px", borderRadius: "24px 24px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <ListVideo style={{ width: "20px", height: "20px", color: "white" }} />
            <h2 style={{ color: "white", fontWeight: 900, fontSize: "18px", margin: 0 }}>Pick Your Playlists</h2>
          </div>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: 0, lineHeight: 1.5 }}>
            Multiple YouTube playlists found. Pick one per skill — switch anytime using <strong style={{ color: "white" }}>More Options</strong>.
          </p>
        </div>
        <div style={{ overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {skills.map(skill => (
            <div key={skill}>
              <p style={{ fontWeight: 900, fontSize: "12px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>{skill}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {skillPlaylists[skill].map(r => {
                  const active = selections[skill] === r.id;
                  return (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "12px", border: `2px solid ${active ? "#2B7A78" : "#e5e7eb"}`, background: active ? "#f0fdfa" : "white", transition: "all 0.15s" }}>
                      <button onClick={() => setSelections(p => ({ ...p, [skill]: r.id }))} style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "8px", flexShrink: 0, background: active ? "#2B7A78" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Play style={{ width: "14px", height: "14px", color: active ? "white" : "#9ca3af" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: "12px", color: active ? "#2B7A78" : "#374151", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</p>
                          {r.platform && <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0" }}>{r.platform}</p>}
                        </div>
                      </button>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                        <a href={r.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: active ? "#2B7A78" : "#6b7280", background: active ? "white" : "#f9fafb", border: `1px solid ${active ? "#99f6e4" : "#e5e7eb"}`, padding: "5px 10px", borderRadius: "7px", textDecoration: "none" }}>
                          <ExternalLink style={{ width: "10px", height: "10px" }} /> Preview
                        </a>
                        {active ? <Check style={{ width: "16px", height: "16px", color: "#2B7A78" }} /> : <div style={{ width: "16px" }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 28px", borderTop: "1px solid #f3f4f6" }}>
          <button onClick={() => onConfirm(selections)} style={{ width: "100%", background: "#2B7A78", color: "white", fontWeight: 900, fontSize: "14px", padding: "14px", borderRadius: "12px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Check style={{ width: "16px", height: "16px" }} /> Start Learning with These Playlists
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   RESOURCE CARD
───────────────────────────────────────────────────────────────────────────── */
function ResourceCard({ resource, isCompleted, onToggle }) {
  const nType     = normalizeType(resource.resource_type, resource.platform);
  const cfg       = TYPE_CFG[nType] ?? TYPE_CFG.article;
  const Icon      = cfg.icon;
  const diffKey   = (resource.difficulty ?? "").toLowerCase();
  const diffClass = DIFF_CFG[diffKey] ?? "";

  return (
    <div style={{ background: "white", borderRadius: "16px", border: `2px solid ${isCompleted ? "#a7f3d0" : "#f3f4f6"}`, overflow: "hidden", transition: "all 0.2s", boxShadow: isCompleted ? "none" : "0 1px 4px rgba(0,0,0,0.06)" }}>
      {isCompleted && <div style={{ height: "3px", background: "linear-gradient(to right,#34d399,#2dd4bf)" }} />}
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div className={`rounded-xl border flex items-center justify-center ${cfg.color}`} style={{ width: "40px", height: "40px", flexShrink: 0 }}>
            <Icon style={{ width: "16px", height: "16px" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginBottom: "7px" }}>
              <span className={`border rounded-full uppercase font-black ${cfg.color}`} style={{ fontSize: "10px", padding: "2px 8px" }}>{cfg.label}</span>
              {diffClass && <span className={`border rounded-full uppercase font-black ${diffClass}`} style={{ fontSize: "10px", padding: "2px 8px" }}>{resource.difficulty}</span>}
              {resource.platform && <span style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 700, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "9999px", padding: "2px 8px" }}>{resource.platform}</span>}
            </div>
            <h3 style={{ fontWeight: 900, fontSize: "13px", lineHeight: 1.4, marginBottom: "12px", color: isCompleted ? "#9ca3af" : "#111827", textDecoration: isCompleted ? "line-through" : "none" }}>{resource.title}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#2B7A78", background: "#f0fdfa", border: "1px solid #99f6e4", padding: "6px 12px", borderRadius: "8px", textDecoration: "none" }}>
                Open Resource <ExternalLink style={{ width: "11px", height: "11px" }} />
              </a>
              <button onClick={() => onToggle(resource.id)} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, padding: "6px 12px", borderRadius: "8px", cursor: "pointer", border: "1px solid", background: isCompleted ? "#ecfdf5" : "#f9fafb", color: isCompleted ? "#059669" : "#6b7280", borderColor: isCompleted ? "#a7f3d0" : "#e5e7eb", transition: "all 0.15s" }}>
                {isCompleted
                  ? <><CheckCircle2 style={{ width: "12px", height: "12px" }} /> Completed</>
                  : <><Circle style={{ width: "12px", height: "12px" }} /> Mark Done</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SKILL GROUP
───────────────────────────────────────────────────────────────────────────── */
function SkillGroup({ skill, resources, completed, onToggle, selectedPlaylistId, onChangePlaylist }) {
  const [open, setOpen]               = useState(true);
  const [showMoreRes, setShowMoreRes] = useState(false);

  const ytResources    = resources.filter(r => normalizeType(r.resource_type, r.platform) === "video" && (r.platform ?? "").toLowerCase().includes("youtube"));
  const nonYtResources = resources.filter(r => !(normalizeType(r.resource_type, r.platform) === "video" && (r.platform ?? "").toLowerCase().includes("youtube")));

  const hasYt     = ytResources.length > 0;
  const activeYt  = hasYt ? (ytResources.find(r => r.id === selectedPlaylistId) ?? ytResources[0]) : null;
  const otherYt   = hasYt ? ytResources.filter(r => r.id !== activeYt?.id) : [];
  const countable = [...(activeYt ? [activeYt] : []), ...nonYtResources];
  const done      = countable.filter(r => completed.has(r.id)).length;
  const total     = countable.length;
  const pct       = total ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{ borderRadius: "16px", border: "1px solid #f3f4f6", background: "rgba(249,250,251,0.5)" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "none", border: "none", cursor: "pointer", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1, overflow: "hidden" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: pct === 100 ? "#10b981" : "#2B7A78", flexShrink: 0 }} />
          <span style={{ fontWeight: 900, fontSize: "13px", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{skill}</span>
          <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600, flexShrink: 0 }}>{done}/{total}</span>
          {pct === 100 && <Trophy style={{ width: "13px", height: "13px", color: "#eab308", flexShrink: 0 }} />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <div style={{ width: "72px", height: "5px", background: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#10b981" : "#2B7A78", borderRadius: "9999px", transition: "width 0.5s ease" }} />
          </div>
          {open ? <ChevronUp style={{ width: "15px", height: "15px", color: "#9ca3af" }} /> : <ChevronDown style={{ width: "15px", height: "15px", color: "#9ca3af" }} />}
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {hasYt && activeYt && <ResourceCard resource={activeYt} isCompleted={completed.has(activeYt.id)} onToggle={onToggle} />}
          {hasYt && otherYt.length > 0 && (
            <div style={{ marginTop: "2px" }}>
              <button onClick={() => setShowMoreRes(v => !v)} style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "12px", fontWeight: 700, color: "#6b7280", background: "white", border: "1px solid #e5e7eb", padding: "7px 13px", borderRadius: "10px", cursor: "pointer" }}>
                <ListVideo style={{ width: "13px", height: "13px", color: "#9ca3af" }} />
                More Resources
                <span style={{ background: "#f3f4f6", color: "#374151", fontSize: "10px", fontWeight: 900, borderRadius: "9999px", padding: "1px 7px" }}>{otherYt.length}</span>
                {showMoreRes ? <ChevronUp style={{ width: "11px", height: "11px", color: "#9ca3af" }} /> : <ChevronDown style={{ width: "11px", height: "11px", color: "#9ca3af" }} />}
              </button>
              {showMoreRes && (
                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 2px 2px" }}>Switch to a different playlist</p>
                  {otherYt.map(r => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "12px", background: "white", border: "1.5px solid #f3f4f6", borderRadius: "14px", padding: "12px 14px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Play style={{ width: "14px", height: "14px", color: "#ef4444" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: "12px", color: "#374151", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</p>
                        {r.platform && <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0" }}>{r.platform}</p>}
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "#2B7A78", background: "#f0fdfa", border: "1px solid #99f6e4", padding: "5px 10px", borderRadius: "7px", textDecoration: "none" }}>
                          <ExternalLink style={{ width: "10px", height: "10px" }} /> Preview
                        </a>
                        <button onClick={() => { onChangePlaylist(skill, r.id); setShowMoreRes(false); }} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "white", background: "#2B7A78", border: "none", padding: "5px 10px", borderRadius: "7px", cursor: "pointer" }}>
                          <RefreshCw style={{ width: "10px", height: "10px" }} /> Switch
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {nonYtResources.map(r => <ResourceCard key={r.id} resource={r} isCompleted={completed.has(r.id)} onToggle={onToggle} />)}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROGRESS SIDEBAR
───────────────────────────────────────────────────────────────────────────── */
function ProgressSidebar({ allResources, completed, onToggle, selectedPlaylists, bySkill, learningStyle, totalDone, activeResources }) {
  const total = activeResources.length;
  const done  = totalDone;
  const pct   = total ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "sticky", top: "72px" }}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div style={{ background: "linear-gradient(135deg,#2B7A78,#3aafa9)", padding: "20px" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Your Progress</p>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Ring pct={pct} size={68} stroke={6} color="white" />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "white", fontWeight: 900, fontSize: "18px", lineHeight: 1 }}>{pct}%</span>
              </div>
            </div>
            <div>
              <p style={{ color: "white", fontWeight: 900, fontSize: "24px", lineHeight: 1 }}>{done}/{total}</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", fontWeight: 600, marginTop: "4px" }}>resources done</p>
              {done === total && total > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "8px" }}>
                  <Trophy style={{ width: "14px", height: "14px", color: "#fde68a" }} />
                  <span style={{ color: "#fde68a", fontSize: "11px", fontWeight: 900 }}>All gaps covered!</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: "16px", background: "rgba(255,255,255,0.2)", borderRadius: "9999px", height: "6px", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "white", borderRadius: "9999px", transition: "width 0.7s ease" }} />
          </div>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {Object.entries(bySkill).map(([skill, items]) => {
            const ytItems    = items.filter(r => normalizeType(r.resource_type, r.platform) === "video" && (r.platform ?? "").toLowerCase().includes("youtube"));
            const nonYtItems = items.filter(r => !(normalizeType(r.resource_type, r.platform) === "video" && (r.platform ?? "").toLowerCase().includes("youtube")));
            const activeYtId = selectedPlaylists[skill] ?? ytItems[0]?.id;
            const sidebarItems = ytItems.length > 0
              ? [...nonYtItems, ...ytItems.filter(r => r.id === activeYtId)]
              : items;
            const sd = sidebarItems.filter(r => completed.has(r.id)).length;
            const sp = sidebarItems.length ? Math.round((sd / sidebarItems.length) * 100) : 0;
            return (
              <div key={skill}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 900, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "8px" }}>{skill}</p>
                  <span style={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af" }}>{sd}/{sidebarItems.length}</span>
                </div>
                <div style={{ background: "#f3f4f6", borderRadius: "9999px", height: "5px", overflow: "hidden" }}>
                  <div style={{ width: `${sp}%`, height: "100%", background: sp === 100 ? "#10b981" : "#2B7A78", borderRadius: "9999px", transition: "width 0.5s ease" }} />
                </div>
                <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {sidebarItems.map(r => (
                    <button key={r.id} onClick={() => onToggle(r.id)} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: "2px 0", cursor: "pointer", textAlign: "left" }}>
                      {completed.has(r.id)
                        ? <CheckCircle2 style={{ width: "13px", height: "13px", color: "#10b981", flexShrink: 0 }} />
                        : <Circle       style={{ width: "13px", height: "13px", color: "#d1d5db", flexShrink: 0 }} />}
                      <span style={{ fontSize: "11px", color: completed.has(r.id) ? "#9ca3af" : "#4b5563", textDecoration: completed.has(r.id) ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {done > 0 && (
        <div style={{ background: "white", borderRadius: "16px", padding: "20px", border: "1px solid #f3f4f6", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Flame style={{ width: "15px", height: "15px", color: "#f97316" }} />
            <span style={{ fontWeight: 900, fontSize: "13px", color: "#111827" }}>Keep Going!</span>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {activeResources.map(r => (
              <div key={r.id} style={{ width: "16px", height: "16px", borderRadius: "4px", background: completed.has(r.id) ? "#2B7A78" : "#f3f4f6", transition: "background 0.3s" }} />
            ))}
          </div>
          <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 500, marginTop: "10px" }}>
            {total - done > 0 ? `${total - done} resources remaining` : "All resources completed! 🚀"}
          </p>
        </div>
      )}

      <div style={{ background: "white", borderRadius: "16px", padding: "16px 20px", border: "1px solid #f3f4f6", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <p style={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Your Learning Style</p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2B7A78" }} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{learningStyle}</span>
        </div>
        <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
          {learningStyle === "Video"    && "Resources filtered for video content."}
          {learningStyle === "Text"     && "Resources filtered for articles & text."}
          {learningStyle === "Projects" && "Resources filtered for hands-on projects."}
          {learningStyle === "Mixed"    && "All resource types shown for variety."}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function LearningResourcesPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const phaseIndex     = parseInt(searchParams.get("phase") ?? "0");

  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);
  const [allResources,      setAllResources]      = useState([]);
  const [skillGaps,         setSkillGaps]         = useState([]);
  const [learningStyle,     setLearningStyle]     = useState("Mixed");
  const [completed,         setCompleted]         = useState(new Set());
  const [selectedPlaylists, setSelectedPlaylists] = useState({});
  const [showPicker,        setShowPicker]        = useState(false);
  const [pathId,            setPathId]            = useState(null);

  const activeResourceIds = useMemo(() => {
    const firstYt = {};
    allResources.forEach(r => {
      const isYt = normalizeType(r.resource_type, r.platform) === "video" && (r.platform ?? "").toLowerCase().includes("youtube");
      if (isYt && !firstYt[r.skill]) firstYt[r.skill] = r.id;
    });
    return allResources
      .filter(r => {
        const isThisYt = normalizeType(r.resource_type, r.platform) === "video" && (r.platform ?? "").toLowerCase().includes("youtube");
        if (!isThisYt) return true;
        return r.id === (selectedPlaylists[r.skill] ?? firstYt[r.skill]);
      })
      .map(r => r.id);
  }, [allResources, selectedPlaylists]);

  useEffect(() => {
    if (!pathId) return;
    saveProgressToLS(pathId, phaseIndex, completed, activeResourceIds);
  }, [completed, activeResourceIds, pathId, phaseIndex]);

  const toggle = useCallback((id) => {
    setCompleted(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  /* ── Fetch ── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }

        const { data: ld, error: ldErr } = await supabase
          .from("learners").select("id, learning_style")
          .eq("user_id", user.id).maybeSingle();
        if (ldErr || !ld) { navigate("/login"); return; }

        const style = ld.learning_style ?? "Mixed";
        setLearningStyle(style);

        const { data: lp } = await supabase
          .from("learning_paths").select("id")
          .eq("learner_id", ld.id)
          .order("created_at", { ascending: false })
          .limit(1).maybeSingle();
        const pid = lp?.id ?? null;
        setPathId(pid);

        if (pid) {
          const saved = loadProgressFromLS(pid, phaseIndex);
          if (saved.size > 0) setCompleted(saved);
        }

        const { data: result } = await supabase
          .from("assessment_results").select("skill_gaps")
          .eq("learner_id", ld.id)
          .order("created_at", { ascending: false })
          .limit(1).maybeSingle();

        const gaps = result?.skill_gaps
          ? (Array.isArray(result.skill_gaps)
              ? result.skill_gaps.map(g => typeof g === "string" ? g : g.skill ?? String(g))
              : [])
          : [];
        setSkillGaps(gaps);
        if (!gaps.length) { setLoading(false); return; }

        const { data: dbRes, error: resErr } = await supabase.from("resources").select("*");
        if (resErr) throw resErr;

        // Step 1: match ALL resources to skill gaps
        const matched = (dbRes ?? []).filter(r => gaps.some(g => skillMatches(r.skill, g)));

        // Step 2: apply phase filter
        let filtered;
        if (phaseIndex === 0) {
          // BASICS — unchanged: apply learning-style filter
          const preferredTypes = STYLE_TYPE_MAP[style] ?? STYLE_TYPE_MAP.Mixed;
          filtered = style === "Mixed"
            ? matched
            : matched.filter(r => preferredTypes.includes(normalizeType(r.resource_type, r.platform)));
        } else {
          // INTERMEDIATE / ADVANCED — group by skill first, filter per skill group
          // This ensures ALL skills show up, even if only some resources match
          const bySkillTemp = {};
          matched.forEach(r => {
            if (!bySkillTemp[r.skill]) bySkillTemp[r.skill] = [];
            bySkillTemp[r.skill].push(r);
          });

          // Apply phase filter per skill group independently
          filtered = [];
          Object.entries(bySkillTemp).forEach(([skill, skillResources]) => {
            const phaseFiltered = applyPhaseFilter(skillResources, phaseIndex);
            filtered.push(...phaseFiltered);
          });
        }

        setAllResources(filtered);

        const map = {};
        filtered.forEach(r => { if (!map[r.skill]) map[r.skill] = []; map[r.skill].push(r); });

        const initSel = {};
        let needPicker = false;
        Object.entries(map).forEach(([skill, items]) => {
          const ytItems = items.filter(r => normalizeType(r.resource_type, r.platform) === "video" && (r.platform ?? "").toLowerCase().includes("youtube"));
          if (ytItems.length > 0) {
            initSel[skill] = ytItems[0].id;
            if (ytItems.length > 1) needPicker = true;
          }
        });
        setSelectedPlaylists(initSel);
        if (needPicker) setShowPicker(true);

      } catch (e) {
        console.error(e);
        setError(e.message ?? "Failed to load resources.");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, phaseIndex]);

  const bySkill = useMemo(() => {
    const m = {};
    allResources.forEach(r => { if (!m[r.skill]) m[r.skill] = []; m[r.skill].push(r); });
    return m;
  }, [allResources]);

  const activeResources = useMemo(() => {
    const firstYt = {};
    allResources.forEach(r => {
      const isYt = normalizeType(r.resource_type, r.platform) === "video" && (r.platform ?? "").toLowerCase().includes("youtube");
      if (isYt && !firstYt[r.skill]) firstYt[r.skill] = r.id;
    });
    return allResources.filter(r => {
      const isThisYt = normalizeType(r.resource_type, r.platform) === "video" && (r.platform ?? "").toLowerCase().includes("youtube");
      if (!isThisYt) return true;
      return r.id === (selectedPlaylists[r.skill] ?? firstYt[r.skill]);
    });
  }, [allResources, selectedPlaylists]);

  const totalDone = activeResources.filter(r => completed.has(r.id)).length;
  const totalPct  = activeResources.length ? Math.round((totalDone / activeResources.length) * 100) : 0;

  const ytPlaylistsMap = useMemo(() => {
    const out = {};
    Object.entries(bySkill).forEach(([skill, items]) => {
      const ytItems = items.filter(r => normalizeType(r.resource_type, r.platform) === "video" && (r.platform ?? "").toLowerCase().includes("youtube"));
      if (ytItems.length > 1) out[skill] = ytItems;
    });
    return out;
  }, [bySkill]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-[#2B7A78] to-[#3aafa9] rounded-2xl flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <Loader2 className="w-5 h-5 text-[#2B7A78] animate-spin" />
        <p className="text-sm text-gray-400 font-semibold">Loading your resources…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-red-100 p-8 max-w-sm text-center shadow-sm">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="font-bold text-gray-800 mb-1">Failed to load resources</p>
        <p className="text-sm text-gray-400 mb-5">{error}</p>
        <button onClick={() => navigate("/learning-path")} className="bg-[#2B7A78] text-white font-bold px-6 py-2.5 rounded-xl text-sm">Back to Roadmap</button>
      </div>
    </div>
  );

  const phaseTypeLabel =
    phaseIndex === 0 ? null :
    phaseIndex === 1 ? "Practice resources" :
    "Project resources";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {showPicker && Object.keys(ytPlaylistsMap).length > 0 && (
        <PlaylistPickerModal
          skillPlaylists={ytPlaylistsMap}
          onConfirm={(sel) => { setSelectedPlaylists(p => ({ ...p, ...sel })); setShowPicker(false); }}
        />
      )}

      {/* ── Header — back arrow goes to /learning-path ── */}
      <header style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* ← Back to Roadmap */}
            <button onClick={() => navigate("/learning-path")} style={{ width: "34px", height: "34px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowLeft style={{ width: "15px", height: "15px", color: "#374151" }} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg,#2B7A78,#3aafa9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles style={{ width: "14px", height: "14px", color: "white" }} />
              </div>
              <span style={{ fontWeight: 900, color: "#111827", fontSize: "14px" }}>SkillPath AI</span>
            </div>
            <ChevronRight style={{ width: "13px", height: "13px", color: "#d1d5db" }} />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#6b7280" }}>Learning Resources</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "6px 12px" }}>
              <BarChart2 style={{ width: "13px", height: "13px", color: "#2B7A78" }} />
              <span style={{ fontSize: "12px", fontWeight: 900, color: "#374151" }}>{totalDone}/{activeResources.length}</span>
              <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600 }}>completed</span>
            </div>
            <button onClick={() => navigate("/dashboard")} style={{ fontSize: "13px", fontWeight: 700, color: "#2B7A78", border: "1px solid rgba(43,122,120,0.3)", padding: "6px 14px", background: "white", borderRadius: "10px", cursor: "pointer" }}>
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 24px" }}>
        {/* Hero */}
        <div style={{ borderRadius: "24px", overflow: "hidden", marginBottom: "28px", background: "linear-gradient(135deg,#2B7A78,#3aafa9)", position: "relative" }}>
          <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", background: "rgba(255,255,255,0.08)", borderRadius: "50%", filter: "blur(40px)" }} />
          <div style={{ padding: "28px 36px", position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
            <div>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px" }}>Learning Resources · Phase {phaseIndex + 1}</p>
              <h1 style={{ color: "white", fontWeight: 900, fontSize: "26px", lineHeight: 1.2, margin: 0 }}>Your Skill Gap Resources</h1>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 600, marginTop: "6px" }}>
                {activeResources.length} {phaseTypeLabel ?? `resource${activeResources.length !== 1 ? "s" : ""}`} tailored to your skill gaps
                {phaseIndex === 0 && learningStyle !== "Mixed" ? ` · ${learningStyle} style` : ""}
              </p>
              {skillGaps.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px" }}>
                  {skillGaps.map((s, i) => (
                    <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "white", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "9999px", padding: "4px 10px" }}>
                      <Zap style={{ width: "10px", height: "10px" }} />{s}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ position: "relative" }}>
                <Ring pct={totalPct} size={64} stroke={6} color="white" />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "white", fontWeight: 900, fontSize: "15px" }}>{totalPct}%</span>
                </div>
              </div>
              <div>
                <p style={{ color: "white", fontWeight: 900, fontSize: "20px", lineHeight: 1 }}>{totalDone}/{activeResources.length}</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 600 }}>resources done</p>
              </div>
            </div>
          </div>
          <div style={{ margin: "0 36px 24px", background: "rgba(255,255,255,0.2)", borderRadius: "9999px", height: "5px", overflow: "hidden" }}>
            <div style={{ width: `${totalPct}%`, height: "100%", background: "white", borderRadius: "9999px", transition: "width 0.7s ease" }} />
          </div>
        </div>

        {/* Complete banner */}
        {totalPct === 100 && activeResources.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "linear-gradient(to right,#ecfdf5,#f0fdfa)", border: "2px solid #a7f3d0", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
            <div style={{ width: "48px", height: "48px", background: "#10b981", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trophy style={{ width: "24px", height: "24px", color: "white" }} />
            </div>
            <div>
              <p style={{ fontWeight: 900, color: "#065f46", fontSize: "14px" }}>All skill gaps covered! 🎉</p>
              <p style={{ color: "#059669", fontSize: "12px", fontWeight: 600, marginTop: "2px" }}>You've completed all recommended resources.</p>
            </div>
            <button onClick={() => navigate("/learning-path")} style={{ marginLeft: "auto", flexShrink: 0, background: "#059669", color: "white", fontWeight: 900, fontSize: "12px", padding: "10px 16px", borderRadius: "10px", border: "none", cursor: "pointer" }}>
              Back to Roadmap
            </button>
          </div>
        )}

        {/* Empty state */}
        {allResources.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-700 mb-1">
              {skillGaps.length === 0
                ? "No skill gaps found"
                : phaseIndex === 1
                  ? "No practice resources found for your skill gaps"
                  : phaseIndex >= 2
                    ? "No project resources found for your skill gaps"
                    : "No resources found for your skill gaps"}
            </p>
            {skillGaps.length > 0 && (
              <p className="text-xs text-gray-300 mb-2">
                Gaps: {skillGaps.join(", ")}<br />
                {phaseIndex === 1 && "Ensure your DB has rows with resource_type = 'practice' for these skills."}
                {phaseIndex >= 2 && "Ensure your DB has rows with resource_type = 'project' for these skills."}
              </p>
            )}
            <button onClick={() => navigate(skillGaps.length === 0 ? "/assessment" : "/learning-path")}
              className="inline-flex items-center gap-2 bg-[#2B7A78] text-white font-bold text-sm px-6 py-3 rounded-xl mt-4">
              {skillGaps.length === 0 ? "Take Assessment" : "Back to Roadmap"}
            </button>
          </div>
        )}

        {/* Two-col layout */}
        {allResources.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px", alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "white", borderRadius: "16px", padding: "20px", border: "1px solid #f3f4f6", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <BookOpen style={{ width: "15px", height: "15px", color: "#2B7A78" }} />
                  <span style={{ fontWeight: 900, fontSize: "10px", color: "#111827", textTransform: "uppercase", letterSpacing: "0.1em" }}>Curated For You</span>
                </div>
                <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.7, margin: 0 }}>
                  {phaseIndex === 0 &&
                    "These resources match your identified skill gaps" +
                    (learningStyle !== "Mixed" ? ` and are filtered for your ${learningStyle} learning style` : "") +
                    "." +
                    (Object.keys(ytPlaylistsMap).length > 0 ? ' For YouTube skills, tap "More Options" to switch between playlists anytime.' : "")}
                  {phaseIndex === 1 &&
                    "Practice resources for your skill gaps — exercises, challenges and problem sets from real platforms."}
                  {phaseIndex >= 2 &&
                    "Project resources for your skill gaps — hands-on builds to apply and deepen your advanced knowledge."}
                </p>
              </div>

              {Object.entries(bySkill).map(([skill, items]) => (
                <SkillGroup
                  key={skill}
                  skill={skill}
                  resources={items}
                  completed={completed}
                  onToggle={toggle}
                  selectedPlaylistId={selectedPlaylists[skill] ?? null}
                  onChangePlaylist={(sk, id) => setSelectedPlaylists(p => ({ ...p, [sk]: id }))}
                />
              ))}
            </div>

            <ProgressSidebar
              allResources={allResources}
              completed={completed}
              onToggle={toggle}
              selectedPlaylists={selectedPlaylists}
              bySkill={bySkill}
              learningStyle={learningStyle}
              totalDone={totalDone}
              activeResources={activeResources}
            />
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: "11px", color: "#d1d5db", paddingBottom: "16px", marginTop: "32px" }}>
          © 2026 SkillPath AI Learning Systems. All rights reserved.
        </p>
      </main>
    </div>
  );
}
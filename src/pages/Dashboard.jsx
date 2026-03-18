import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, BookOpen, Target, ArrowRight,
  BarChart2, TrendingUp, Zap, Map,
  LogOut, User, ChevronRight, Briefcase, Brain,
  Trophy, Clock, CheckCircle2, Lock, Flame,
  Play, CheckCheck, RotateCcw
} from 'lucide-react';
import supabase from '../supabaseClient';

const STATUS = { completed: 'completed', active: 'active', locked: 'locked' };

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const getPhaseStatusKey = (pathId) => `lp_phase_statuses_${pathId}`;

function loadPhaseStatuses(pathId, phases) {
  try {
    const raw = localStorage.getItem(getPhaseStatusKey(pathId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return phases.map((p, i) => p.status ?? (i === 0 ? STATUS.active : STATUS.locked));
}

function savePhaseStatuses(pathId, statuses) {
  try { localStorage.setItem(getPhaseStatusKey(pathId), JSON.stringify(statuses)); }
  catch { /* ignore */ }
}

function getResourceProgress(pathId, phaseIndex) {
  try {
    const done  = localStorage.getItem(`lp_progress_${pathId}_phase_${phaseIndex}`);
    const total = localStorage.getItem(`lp_resources_${pathId}_phase_${phaseIndex}`);
    const doneCount  = done  ? JSON.parse(done).length  : 0;
    const totalCount = total ? JSON.parse(total).length : 0;
    return { doneCount, totalCount, pct: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0 };
  } catch { return { doneCount: 0, totalCount: 0, pct: 0 }; }
}

// ─── Mini progress ring ───────────────────────────────────────────────────────
function MiniRing({ pct, size = 56, stroke = 5, color = '#2B7A78' }) {
  const r = (size - stroke * 2) / 2, circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  );
}

function ProgressBar({ pct, height = 'h-1.5' }) {
  return (
    <div className={`bg-gray-100 rounded-full ${height} overflow-hidden`}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : '#2B7A78' }} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-black text-gray-900 leading-none mb-1">{value ?? '—'}</p>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Phase progress card ──────────────────────────────────────────────────────
function PhaseProgressCard({ phase, index, pathId, status, onClick, onMarkComplete, onRevertPhase }) {
  const title  = phase.title ?? phase.name ?? phase.phase ?? `Phase ${index + 1}`;
  const weeks  = phase.duration_weeks ?? phase.weeks ?? null;
  const { doneCount, totalCount, pct } = getResourceProgress(pathId, index);

  const cfg = {
    completed: { border: 'border-emerald-200 bg-emerald-50/30', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: '✓ Completed', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
    active:    { border: 'border-[#2B7A78]/25 bg-white',        badge: 'bg-teal-50 text-[#2B7A78] border-teal-200',           text: 'In Progress', icon: <div className="w-4 h-4 rounded-full bg-[#2B7A78] flex items-center justify-center"><span className="text-white font-black text-[8px]">{index + 1}</span></div> },
    locked:    { border: 'border-gray-100 bg-gray-50/70',       badge: 'bg-gray-100 text-gray-400 border-gray-200',           text: 'Upcoming',    icon: <Lock className="w-4 h-4 text-gray-300" /> },
  }[status] ?? { border: 'border-gray-100 bg-gray-50/70', badge: 'bg-gray-100 text-gray-400 border-gray-200', text: 'Upcoming', icon: <Lock className="w-4 h-4 text-gray-300" /> };

  return (
    <div
      className={`rounded-2xl border-2 ${cfg.border} p-4 transition-all ${status !== STATUS.locked ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}`}
      onClick={() => status !== STATUS.locked && onClick(index)}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{cfg.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wide ${cfg.badge}`}>{cfg.text}</span>
            {weeks && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                <Clock className="w-2.5 h-2.5" />{weeks}w
              </span>
            )}
          </div>
          <p className={`font-black text-sm leading-tight ${status === STATUS.locked ? 'text-gray-400' : 'text-gray-900'}`}>{title}</p>

          {/* Progress bar — only for unlocked phases */}
          {status !== STATUS.locked && (
            <div className="mt-2">
              {totalCount > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400 font-semibold">{doneCount}/{totalCount} resources</span>
                    <span className={`text-[10px] font-black ${pct === 100 ? 'text-emerald-600' : 'text-[#2B7A78]'}`}>{pct}%</span>
                  </div>
                  <ProgressBar pct={pct} />
                </>
              ) : (
                // No resource data yet — show empty bar without ?
                <ProgressBar pct={0} />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1" onClick={e => e.stopPropagation()}>
          {status === STATUS.active && (
            <button
              onClick={() => onMarkComplete(index)}
              className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg px-2 py-1 transition-all whitespace-nowrap"
            >
              <CheckCheck className="w-3 h-3" /> Done
            </button>
          )}
          {status === STATUS.completed && (
            <button
              onClick={() => onRevertPhase(index)}
              className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg px-2 py-1 transition-all whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3" /> Revert
            </button>
          )}
          {status !== STATUS.locked && <ChevronRight className="w-4 h-4 text-gray-300" />}
        </div>
      </div>
    </div>
  );
}

function GapChip({ gap }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-50 text-red-600 border border-red-100 rounded-full px-3 py-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
      {typeof gap === 'string' ? gap : gap.skill ?? String(gap)}
    </span>
  );
}

// ─── Overall progress sidebar ─────────────────────────────────────────────────
function OverallProgress({ phases, phaseStatuses, pathId, navigate }) {
  const done   = phaseStatuses.filter(s => s === STATUS.completed).length;
  const pct    = phases.length ? Math.round((done / phases.length) * 100) : 0;

  let totalResDone = 0, totalRes = 0;
  phases.forEach((_, i) => {
    const { doneCount, totalCount } = getResourceProgress(pathId, i);
    totalResDone += doneCount;
    totalRes     += totalCount;
  });
  const resPct = totalRes > 0 ? Math.round((totalResDone / totalRes) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#2B7A78]" />
          <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Overall Progress</h3>
        </div>
        <button onClick={() => navigate('/learning-path')}
          className="text-xs font-bold text-[#2B7A78] hover:underline flex items-center gap-1">
          Full Roadmap <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Phases ring */}
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-2">
            <MiniRing pct={pct} size={64} stroke={6} color="#2B7A78" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black text-gray-900 leading-none">{pct}%</span>
            </div>
          </div>
          <p className="text-xs font-black text-gray-700">{done}/{phases.length}</p>
          <p className="text-[10px] text-gray-400 font-semibold">phases</p>
        </div>

        {/* Resources ring — no ? when totalRes is 0 */}
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-2">
            <MiniRing pct={resPct} size={64} stroke={6} color="#10b981" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black text-gray-900 leading-none">{resPct}%</span>
            </div>
          </div>
          {/* Only show count when we have data; otherwise show a neutral label */}
          <p className="text-xs font-black text-gray-700">
            {totalRes > 0 ? `${totalResDone}/${totalRes}` : '—'}
          </p>
          <p className="text-[10px] text-gray-400 font-semibold">resources</p>
        </div>
      </div>

      {/* Per-phase breakdown */}
      <div className="space-y-2.5 pt-3 border-t border-gray-100">
        {phases.map((p, i) => {
          const s     = phaseStatuses[i] ?? STATUS.locked;
          const title = p.title ?? p.phase ?? `Phase ${i + 1}`;
          const { pct: rPct } = getResourceProgress(pathId, i);
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[11px] font-bold truncate max-w-[160px] ${s === STATUS.locked ? 'text-gray-300' : 'text-gray-700'}`}>{title}</span>
                <span className={`text-[10px] font-black ml-2 shrink-0 ${s === STATUS.completed ? 'text-emerald-500' : s === STATUS.active ? 'text-[#2B7A78]' : 'text-gray-300'}`}>
                  {s === STATUS.completed ? '✓' : s === STATUS.active ? `${rPct}%` : '—'}
                </span>
              </div>
              <ProgressBar pct={s === STATUS.completed ? 100 : s === STATUS.active ? rPct : 0} />
            </div>
          );
        })}
      </div>

      {totalResDone > 0 && (
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 mt-4">
          <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <p className="text-xs font-bold text-orange-700">{totalResDone} resources completed!</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [learner,       setLearner]       = useState(null);
  const [roadmap,       setRoadmap]       = useState(null);
  const [assessment,    setAssessment]    = useState(null);
  const [phaseStatuses, setPhaseStatuses] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const pollRef = useRef(null);

  const startPolling = useCallback((pathId, totalPhases) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      setPhaseStatuses(prev => {
        const next = [...prev];
        let changed = false;
        for (let i = 0; i < totalPhases; i++) {
          if (next[i] === STATUS.active) {
            const { pct } = getResourceProgress(pathId, i);
            if (pct === 100) {
              next[i] = STATUS.completed;
              if (i + 1 < totalPhases && next[i + 1] === STATUS.locked) next[i + 1] = STATUS.active;
              changed = true;
            }
          }
        }
        if (changed) savePhaseStatuses(pathId, next);
        return changed ? next : prev;
      });
    }, 3000);
  }, []);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }
        const { data: ld } = await supabase.from('learners').select('*').eq('user_id', user.id).maybeSingle();
        if (!ld) { navigate('/login'); return; }
        setLearner(ld);

        const [{ data: rm }, { data: ar }] = await Promise.all([
          supabase.from('learning_paths').select('*').eq('learner_id', ld.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('assessment_results').select('*').eq('learner_id', ld.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ]);
        setRoadmap(rm);
        setAssessment(ar);

        if (rm) {
          const phases = Array.isArray(rm.phases) ? rm.phases : Object.values(rm.phases ?? {});
          setPhaseStatuses(loadPhaseStatuses(rm.id, phases));
          startPolling(rm.id, phases.length);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [navigate, startPolling]);

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate('/login'); };
  const handlePhaseClick = (i) => navigate(`/learn?phase=${i}`);

  const handleMarkComplete = useCallback((phaseIndex) => {
    if (!roadmap) return;
    setPhaseStatuses(prev => {
      const next = [...prev];
      next[phaseIndex] = STATUS.completed;
      if (phaseIndex + 1 < next.length && next[phaseIndex + 1] === STATUS.locked) next[phaseIndex + 1] = STATUS.active;
      savePhaseStatuses(roadmap.id, next);
      return next;
    });
    try {
      const phases = Array.isArray(roadmap.phases) ? roadmap.phases : Object.values(roadmap.phases ?? {});
      supabase.from('learning_paths').update({
        phases: phases.map((p, i) => {
          if (i === phaseIndex) return { ...p, status: STATUS.completed };
          if (i === phaseIndex + 1 && (p.status ?? STATUS.locked) === STATUS.locked) return { ...p, status: STATUS.active };
          return p;
        }),
      }).eq('id', roadmap.id);
    } catch { /* ignore */ }
  }, [roadmap]);

  const handleRevertPhase = useCallback((phaseIndex) => {
    if (!roadmap) return;
    setPhaseStatuses(prev => {
      const next = [...prev];
      next[phaseIndex] = STATUS.active;
      if (phaseIndex + 1 < next.length && next[phaseIndex + 1] === STATUS.active)
        next[phaseIndex + 1] = STATUS.locked;
      savePhaseStatuses(roadmap.id, next);
      return next;
    });
    try {
      const phases = Array.isArray(roadmap.phases) ? roadmap.phases : Object.values(roadmap.phases ?? {});
      supabase.from('learning_paths').update({
        phases: phases.map((p, i) => {
          if (i === phaseIndex) return { ...p, status: STATUS.active };
          if (i === phaseIndex + 1 && (p.status ?? STATUS.active) === STATUS.active) return { ...p, status: STATUS.locked };
          return p;
        }),
      }).eq('id', roadmap.id);
    } catch { /* ignore */ }
  }, [roadmap]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-[#2B7A78] to-[#3aafa9] rounded-2xl flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="w-5 h-5 border-2 border-[#2B7A78] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  let phases = [];
  if (Array.isArray(roadmap?.phases)) phases = roadmap.phases;
  else if (roadmap?.phases) phases = Object.entries(roadmap.phases).map(([k, v]) => ({ ...v, title: v.title ?? v.name ?? k }));

  const done      = phaseStatuses.filter(s => s === STATUS.completed).length;
  const pct       = phases.length ? Math.round((done / phases.length) * 100) : 0;
  const score     = assessment?.overall_percentage ?? null;
  const skillGaps = assessment?.skill_gaps ?? [];
  const firstName = (learner?.full_name ?? learner?.name ?? 'Learner').split(' ')[0];
  const sp        = roadmap?.success_probability != null
    ? `${(parseFloat(roadmap.success_probability) < 1 ? parseFloat(roadmap.success_probability) * 100 : parseFloat(roadmap.success_probability)).toFixed(0)}%`
    : '—';

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  const activePhaseIndex = phaseStatuses.findIndex(s => s === STATUS.active);
  const safeIdx          = activePhaseIndex < 0 ? 0 : activePhaseIndex;
  const activePhase      = phases[safeIdx];
  const activeSkills     = activePhase?.skills ?? activePhase?.key_skills ?? [];

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2B7A78] to-[#3aafa9] rounded-lg flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-gray-900 text-base hidden sm:block">SkillPath AI</span>
          </div>
          <nav className="flex items-center gap-2">
            <button onClick={() => navigate('/learning-path')}
              className="text-sm font-bold text-gray-500 hover:text-[#2B7A78] px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-all flex items-center gap-1.5">
              <Map className="w-4 h-4" /> Roadmap
            </button>
            <button onClick={() => navigate('/assessment')}
              className="text-sm font-bold text-gray-500 hover:text-[#2B7A78] px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-all flex items-center gap-1.5">
              <Brain className="w-4 h-4" /> Assessment
            </button>
            <button onClick={handleSignOut}
              className="text-sm font-bold text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all flex items-center gap-1.5 ml-2">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Welcome hero */}
        <div className="rounded-3xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg,#2B7A78 0%,#3aafa9 60%,#17c3b2 100%)' }}>
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative px-8 py-8 md:px-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            <div className="flex-1">
              <p className="text-white/60 text-sm font-semibold mb-1">{greeting()},</p>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-2">{firstName} 👋</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-white/80" />
                  <span className="text-xs font-bold text-white">{learner?.target_job_role ?? 'Career Goal'}</span>
                </div>
                {score !== null && (
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-white/80" />
                    <span className="text-xs font-bold text-white">Assessment: {score.toFixed(0)}%</span>
                  </div>
                )}
                {pct === 100 && phases.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                    <Trophy className="w-3.5 h-3.5 text-yellow-300" />
                    <span className="text-xs font-bold text-white">Roadmap Complete!</span>
                  </div>
                )}
              </div>
              {roadmap && (
                <div className="mt-5 max-w-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white/60 text-xs font-semibold">{done}/{phases.length} phases complete</span>
                    <span className="text-white font-black text-xs">{pct}%</span>
                  </div>
                  <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
            </div>
            {roadmap && (
              <div className="flex items-center gap-5 shrink-0">
                <div className="relative">
                  <MiniRing pct={pct} size={80} stroke={7} color="white" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-white leading-none">{pct}%</span>
                    <span className="text-white/50 text-[9px] font-bold">done</span>
                  </div>
                </div>
                <div>
                  <p className="text-white font-black text-lg leading-none">{done}/{phases.length}</p>
                  <p className="text-white/60 text-xs font-semibold mt-0.5">phases complete</p>
                  {activePhase && (
                    <button onClick={() => handlePhaseClick(safeIdx)}
                      className="mt-3 flex items-center gap-1.5 bg-white text-[#2B7A78] text-xs font-black px-4 py-2 rounded-xl hover:bg-teal-50 transition-colors shadow-lg">
                      Continue Learning <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
            {!roadmap && (
              <button onClick={() => navigate('/learning-path')}
                className="shrink-0 bg-white text-[#2B7A78] font-black text-sm px-6 py-3 rounded-2xl hover:bg-teal-50 transition-colors shadow-lg flex items-center gap-2">
                Generate My Roadmap <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <StatCard icon={Map}        label="Roadmap Phases" value={phases.length || '—'} sub="total milestones"                    accent="bg-[#2B7A78]" />
          <StatCard icon={BarChart2}  label="Success Rate"   value={sp}                   sub="predicted"                           accent="bg-teal-500" />
          <StatCard icon={Target}     label="Assessment"     value={score !== null ? `${score.toFixed(0)}%` : '—'} sub="overall"   accent="bg-indigo-500" />
          <StatCard icon={TrendingUp} label="Skill Gaps"     value={skillGaps.length || '—'} sub="identified"                      accent="bg-orange-400" />
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-5">

            {/* Current phase */}
            {activePhase && roadmap && (
              <div className="bg-white rounded-2xl border-2 border-[#2B7A78]/20 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#2B7A78] animate-pulse" />
                    <h2 className="font-black text-gray-900 text-sm uppercase tracking-widest">Currently Learning</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleMarkComplete(safeIdx)}
                      className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-black px-3 py-2 rounded-xl transition-all">
                      <CheckCheck className="w-3.5 h-3.5" /> Mark Done
                    </button>
                    <button onClick={() => handlePhaseClick(safeIdx)}
                      className="flex items-center gap-1.5 bg-[#2B7A78] text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-[#1f5a58] transition-all shadow-md shadow-[#2B7A78]/20">
                      Continue <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-black text-xl text-gray-900 mb-1">
                  {activePhase.title ?? activePhase.phase ?? `Phase ${safeIdx + 1}`}
                </h3>
                {activePhase.description && (
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{activePhase.description}</p>
                )}

                {activeSkills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Skills in this phase</p>
                    <div className="flex flex-wrap gap-2">
                      {activeSkills.map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs font-bold bg-teal-50 text-[#2B7A78] border border-teal-100 rounded-full px-3 py-1.5">
                          <Zap className="w-2.5 h-2.5" />
                          {typeof s === 'string' ? s : s.name ?? String(s)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(() => {
                  const { doneCount, totalCount, pct: rPct } = getResourceProgress(roadmap?.id, safeIdx);
                  if (totalCount === 0) return null;
                  return (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-gray-600">Resource Progress</span>
                        <span className="text-xs font-black text-[#2B7A78]">{doneCount}/{totalCount} · {rPct}%</span>
                      </div>
                      <ProgressBar pct={rPct} />
                    </div>
                  );
                })()}
              </div>
            )}

            {/* All phases */}
            {phases.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#2B7A78]" />
                    <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">All Phases</h3>
                  </div>
                  <button onClick={() => navigate('/learning-path')}
                    className="text-xs font-bold text-[#2B7A78] hover:underline flex items-center gap-1">
                    Full Roadmap <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {phases.map((p, i) => (
                    <PhaseProgressCard
                      key={i} phase={p} index={i} pathId={roadmap?.id}
                      status={phaseStatuses[i] ?? (i === 0 ? STATUS.active : STATUS.locked)}
                      onClick={handlePhaseClick}
                      onMarkComplete={handleMarkComplete}
                      onRevertPhase={handleRevertPhase}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Skill gaps */}
            {skillGaps.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-[#2B7A78]" />
                  <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Your Skill Gaps</h3>
                  <span className="text-xs text-gray-400 font-semibold ml-auto">Addressed by your roadmap</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillGaps.map((gap, i) => <GapChip key={i} gap={gap} />)}
                </div>
                <button onClick={() => handlePhaseClick(safeIdx)}
                  className="mt-4 flex items-center gap-2 text-xs font-bold text-[#2B7A78] hover:underline">
                  <Play className="w-3 h-3" /> Start learning to close these gaps
                </button>
              </div>
            )}
          </div>

          {/* RIGHT sidebar */}
          <div className="space-y-4">
            {roadmap && (
              <OverallProgress phases={phases} phaseStatuses={phaseStatuses} pathId={roadmap?.id} navigate={navigate} />
            )}

            {/* Quick actions */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Continue Learning', icon: Play,      onClick: () => handlePhaseClick(safeIdx),  color: 'text-white',      bg: 'bg-[#2B7A78] hover:bg-[#1f5a58]', primary: true },
                  { label: 'View Full Roadmap',  icon: Map,       onClick: () => navigate('/learning-path'), color: 'text-[#2B7A78]',  bg: 'hover:bg-teal-50' },
                  { label: 'Retake Assessment',  icon: Brain,     onClick: () => navigate('/assessment'),   color: 'text-indigo-600', bg: 'hover:bg-indigo-50' },
                  { label: 'View Results',       icon: BarChart2, onClick: () => navigate('/results'),      color: 'text-orange-600', bg: 'hover:bg-orange-50' },
                ].map((a, i) => (
                  <button key={i} onClick={a.onClick}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${a.bg} ${a.primary ? 'shadow-md shadow-[#2B7A78]/20' : ''}`}>
                    <a.icon className={`w-4 h-4 ${a.color}`} />
                    <span className={`text-sm font-bold ${a.color}`}>{a.label}</span>
                    {!a.primary && <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Learner profile */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-[#2B7A78]" />
                <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Profile</h3>
              </div>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: 'Name',       value: learner?.full_name ?? learner?.name },
                  { label: 'Goal',       value: learner?.target_job_role },
                  { label: 'Education',  value: learner?.education_level },
                  { label: 'Hours/week', value: learner?.hours_per_week ? `${learner.hours_per_week}h` : null },
                  { label: 'Timeline',   value: learner?.timeline_months ? `${learner.timeline_months} months` : null },
                  { label: 'Style',      value: learner?.learning_style },
                ].filter(r => r.value).map((row, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <span className="text-gray-400 font-semibold shrink-0">{row.label}</span>
                    <span className="text-gray-800 font-bold text-right truncate">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">© 2026 SkillPath AI Learning Systems. All rights reserved.</p>
      </main>
    </div>
  );
}
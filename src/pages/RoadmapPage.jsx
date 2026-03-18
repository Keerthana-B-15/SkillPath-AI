import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, CheckCircle2, Lock, ChevronDown, ChevronUp,
  Clock, Target, Award, Loader2, AlertCircle,
  Zap, ArrowRight, BarChart2, BookOpen, Map, CheckCheck, RotateCcw
} from 'lucide-react';
import supabase from '../supabaseClient';

const STATUS = { completed: 'completed', active: 'active', locked: 'locked' };

function buildSkillLevelMap(skillReport, diffMap) {
  const map = {};
  if (diffMap && typeof diffMap === 'object') {
    Object.entries(diffMap).forEach(([skill, level]) => {
      if (skill && level) map[skill.trim()] = String(level).toLowerCase();
    });
  }
  if (Array.isArray(skillReport)) {
    skillReport.forEach(item => {
      const skill = item?.skill ?? item?.name ?? item?.topic;
      const level = item?.level ?? item?.difficulty ?? item?.proficiency ?? item?.category;
      if (skill && level) map[String(skill).trim()] = String(level).toLowerCase();
    });
  }
  return map;
}

function getLevelBucket(levelStr) {
  const l = (levelStr ?? '').toLowerCase();
  if (l.includes('adv'))                                                    return 'advanced';
  if (l.includes('inter') || l.includes('mid'))                             return 'intermediate';
  if (l.includes('beg') || l.includes('found') || l.includes('basic') || l.includes('easy')) return 'beginner';
  return 'beginner';
}

function classifySkillsAcrossPhases(allGaps, skillLevelMap, totalPhases) {
  const buckets = Array.from({ length: totalPhases }, () => []);
  const gaps = allGaps
    .map(g => (typeof g === 'string' ? g : g?.skill ?? g?.name ?? String(g)))
    .filter(s => s && s.trim().length > 0);

  if (gaps.length === 0 || totalPhases === 0) return buckets;

  const byLevel = { beginner: [], intermediate: [], advanced: [] };
  gaps.forEach(skill => {
    const matchKey = Object.keys(skillLevelMap).find(k => k.toLowerCase() === skill.toLowerCase());
    const level = matchKey ? getLevelBucket(skillLevelMap[matchKey]) : 'beginner';
    byLevel[level].push(skill);
  });

  if (totalPhases === 1) {
    buckets[0] = gaps;
  } else if (totalPhases === 2) {
    buckets[0] = [...byLevel.beginner, ...byLevel.intermediate];
    buckets[1] = byLevel.advanced.length > 0 ? byLevel.advanced : [...byLevel.beginner];
  } else {
    buckets[0] = byLevel.beginner.length > 0     ? byLevel.beginner     : [];
    buckets[1] = byLevel.intermediate.length > 0 ? byLevel.intermediate : [];
    const adv         = byLevel.advanced.length > 0 ? byLevel.advanced : [];
    const extraPhases = totalPhases - 2;
    const chunkSize   = Math.ceil(adv.length / Math.max(extraPhases, 1));
    for (let i = 0; i < extraPhases; i++) {
      buckets[2 + i] = adv.slice(i * chunkSize, (i + 1) * chunkSize);
    }
  }

  for (let i = 0; i < buckets.length; i++) {
    if (buckets[i].length === 0) {
      const prev = i > 0 ? buckets[i - 1] : [];
      const next = i < buckets.length - 1 ? buckets[i + 1] : [];
      buckets[i] = prev.length > 0 ? prev : next.length > 0 ? next : gaps;
    }
  }
  return buckets;
}



// ─────────────────────────────────────────────────────────────────────────────
// LOCALSTORAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const getPhaseStatusKey = (pathId) => `lp_phase_statuses_${pathId}`;

function loadPhaseStatuses(pathId, phases) {
  try {
    const raw = localStorage.getItem(getPhaseStatusKey(pathId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return phases.map((p, i) => p.status ?? (i === 0 ? STATUS.active : STATUS.locked));
}

function savePhaseStatuses(pathId, statuses) {
  try { localStorage.setItem(getPhaseStatusKey(pathId), JSON.stringify(statuses)); } catch {}
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

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    active:    'bg-teal-50 text-[#2B7A78] border-teal-200',
    locked:    'bg-gray-100 text-gray-400 border-gray-200',
  };
  const labels = { completed: '✓ Completed', active: 'In Progress', locked: 'Upcoming' };
  return (
    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cfg[status] ?? cfg.locked}`}>
      {labels[status] ?? 'Upcoming'}
    </span>
  );
}

function TimelineNode({ status, index }) {
  if (status === STATUS.completed)
    return (
      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
        <CheckCircle2 className="w-5 h-5 text-white" />
      </div>
    );
  if (status === STATUS.active)
    return (
      <div className="w-10 h-10 rounded-full bg-[#2B7A78] flex items-center justify-center shadow-md shadow-[#2B7A78]/30 shrink-0 ring-4 ring-[#2B7A78]/10">
        <span className="text-white font-black text-sm">{index + 1}</span>
      </div>
    );
  return (
    <div className="w-10 h-10 rounded-full bg-white border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0">
      <Lock className="w-3.5 h-3.5 text-gray-300" />
    </div>
  );
}

function SkillChip({ label, skillLevelMap }) {
  const matchKey = Object.keys(skillLevelMap ?? {}).find(
    k => k.toLowerCase() === label.toLowerCase()
  );
  const level = matchKey ? getLevelBucket(skillLevelMap[matchKey]) : null;
  const style = {
    advanced:     'bg-purple-50 text-purple-600 border-purple-100',
    intermediate: 'bg-amber-50 text-amber-600 border-amber-100',
    beginner:     'bg-blue-50 text-blue-600 border-blue-100',
  }[level] ?? 'bg-teal-50 text-[#2B7A78] border-teal-200';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold border rounded-full px-3 py-1.5 ${style}`}>
      <Zap className="w-3 h-3 shrink-0" />{label}
    </span>
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

// ─────────────────────────────────────────────────────────────────────────────
// PHASE CARD
// ─────────────────────────────────────────────────────────────────────────────
function PhaseCard({ phase, index, total, status, navigate, pathId, onMarkComplete, onRevertPhase, skillLevelMap }) {
  const [open,      setOpen]      = useState(status === STATUS.active);
  const [marking,   setMarking]   = useState(false);
  const [reverting, setReverting] = useState(false);
  const prevStatus                = useRef(status);

  useEffect(() => {
    if (prevStatus.current !== STATUS.active && status === STATUS.active) setOpen(true);
    prevStatus.current = status;
  }, [status]);

  const title     = phase.title ?? phase.phase ?? phase.name ?? `Phase ${index + 1}`;
  const desc      = phase.description ?? phase.objective ?? '';
  const skills    = phase.skills ?? phase.key_skills ?? phase.topics ?? [];
  const resources = phase.resources ?? phase.materials ?? [];
  const weeks     = phase.duration_weeks ?? phase.weeks ?? null;
  const { doneCount, totalCount, pct } = getResourceProgress(pathId, index);

  const cardStyle = {
    completed: 'border-emerald-200 bg-white',
    active:    'border-[#2B7A78]/35 bg-white shadow-lg shadow-[#2B7A78]/6',
    locked:    'border-gray-100 bg-gray-50/60',
  }[status] ?? 'border-gray-100 bg-gray-50/60';

  const handleMarkComplete = async (e) => {
    e.stopPropagation();
    setMarking(true);
    await onMarkComplete(index);
    setMarking(false);
  };

  const handleRevert = async (e) => {
    e.stopPropagation();
    setReverting(true);
    await onRevertPhase(index);
    setReverting(false);
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center pt-1">
        <TimelineNode status={status} index={index} />
        {index < total - 1 && (
          <div className="w-px flex-1 mt-2.5" style={{
            background: status === STATUS.completed
              ? 'linear-gradient(to bottom,#10b981,#d1fae5)'
              : 'linear-gradient(to bottom,#e2e8f0,transparent)',
            minHeight: 32,
          }} />
        )}
      </div>

      <div className={`flex-1 mb-6 rounded-2xl border-2 overflow-hidden transition-all duration-300 ${cardStyle}`}>
        {/* Header */}
        <button
          onClick={() => status !== STATUS.locked && setOpen(o => !o)}
          className={`w-full text-left px-5 py-4 flex items-start justify-between gap-3 ${status === STATUS.locked ? 'cursor-default' : 'cursor-pointer group'}`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Phase {index + 1}</span>
              <StatusPill status={status} />
              {weeks && (
                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                  <Clock className="w-3 h-3" />{weeks}w
                </span>
              )}
            </div>
            <h3 className={`font-black text-base leading-snug ${status === STATUS.locked ? 'text-gray-400' : 'text-gray-900'}`}>
              {title}
            </h3>
            {status !== STATUS.locked && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  {totalCount > 0 ? (
                    <>
                      <span className="text-[10px] text-gray-400 font-semibold">{doneCount} / {totalCount} resources</span>
                      <span className={`text-[10px] font-black tabular-nums ${pct === 100 ? 'text-emerald-600' : 'text-[#2B7A78]'}`}>{pct}%</span>
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-300 font-semibold">Progress tracked once you start</span>
                  )}
                </div>
                <ProgressBar pct={totalCount > 0 ? pct : 0} />
              </div>
            )}
          </div>
          {status !== STATUS.locked && (
            <ChevronDown className={`w-4 h-4 mt-1 text-gray-300 group-hover:text-[#2B7A78] transition-all duration-200 shrink-0 ${open ? 'rotate-180 text-[#2B7A78]' : ''}`} />
          )}
        </button>

        {/* Body */}
        {open && status !== STATUS.locked && (
          <div className="px-5 pb-5 border-t border-gray-100 space-y-4 pt-4">
            {desc && <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>}

            {/* ── Skills & Topics: ONLY shown for Phase 0 (Basics) ── */}
            {index === 0 && skills.length > 0 && (
              <div>
                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2.5">Skills &amp; Topics</p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => {
                    const label = typeof s === 'string' ? s : s.name ?? String(s);
                    return <SkillChip key={i} label={label} skillLevelMap={skillLevelMap} />;
                  })}
                </div>
              </div>
            )}

            {resources.length > 0 && (
              <div>
                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2.5">Resources</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {resources.map((r, i) => {
                    const icons = { video: '🎬', article: '📄', course: '📚', project: '🛠️', quiz: '✅' };
                    const icon  = icons[r?.type?.toLowerCase()] ?? '📌';
                    const label = typeof r === 'string' ? r : r?.title ?? JSON.stringify(r);
                    return (
                      <div key={i} className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                        <span className="text-base shrink-0">{icon}</span>
                        <span className="truncate text-xs font-medium text-gray-600">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {status === STATUS.active && (
                <>
                  <button
                    onClick={() => navigate(`/learn?phase=${index}`)}
                    className="inline-flex items-center gap-2 bg-[#2B7A78] hover:bg-[#1f5a58] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-[#2B7A78]/20 hover:-translate-y-0.5 active:scale-95"
                  >
                    Continue Learning <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleMarkComplete}
                    disabled={marking}
                    className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
                  >
                    {marking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                    Mark Complete
                  </button>
                </>
              )}
              {status === STATUS.completed && (
                <>
                  <button
                    onClick={() => navigate(`/learn?phase=${index}`)}
                    className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
                  >
                    Review Resources <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRevert}
                    disabled={reverting}
                    className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200 text-sm font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
                  >
                    {reverting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    Revert
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPLANATION CARD
// ─────────────────────────────────────────────────────────────────────────────
function ExplanationCard({ basics, intermediate, advanced, outcomes }) {
  const [expanded, setExpanded] = useState(false);
  const sections = [
    { label: 'Basics',       value: basics },
    { label: 'Intermediate', value: intermediate },
    { label: 'Advanced',     value: advanced },
    { label: 'Outcomes',     value: outcomes },
  ].filter(s => s.value);
  if (sections.length === 0) return null;
  const visible = expanded ? sections : sections.slice(0, 1);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-[#2B7A78]" />
        <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Why This Roadmap?</h3>
      </div>
      <div className="px-6 py-5 space-y-5">
        {visible.map((sec, i) => (
          <div key={i}>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-[#2B7A78]/10 text-[#2B7A78] text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
              <p className="font-bold text-gray-900 text-sm">{sec.label}</p>
            </div>
            <p className="pl-8 text-sm text-gray-500 leading-relaxed">{sec.value}</p>
          </div>
        ))}
      </div>
      {sections.length > 1 && (
        <button onClick={() => setExpanded(e => !e)}
          className="w-full border-t border-gray-100 py-3 text-xs font-bold text-[#2B7A78] hover:bg-teal-50/50 transition-colors flex items-center justify-center gap-1.5">
          {expanded
            ? <><ChevronUp className="w-3.5 h-3.5" />Show less</>
            : <><ChevronDown className="w-3.5 h-3.5" />Read more · {sections.length - 1} more section{sections.length > 2 ? 's' : ''}</>}
        </button>
      )}
    </div>
  );
}

function ProgressRing({ pct }) {
  const r = 36, circ = 2 * Math.PI * r;
  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke="white" strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-white leading-none">{pct}%</span>
        <span className="text-white/50 text-[10px] font-semibold mt-0.5">done</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[#2B7A78]" />
        <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{label}</span>
      </div>
      <p className="text-2xl font-black text-gray-900 truncate leading-none mb-1">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 font-medium">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function RoadmapPage() {
  const navigate = useNavigate();
  const [loading,       setLoading]       = useState(true);
  const [loadingMsg,    setLoadingMsg]    = useState('Loading your profile...');
  const [error,         setError]         = useState(null);
  const [roadmap,       setRoadmap]       = useState(null);
  const [learner,       setLearner]       = useState(null);
  const [phaseStatuses, setPhaseStatuses] = useState([]);
  const [skillLevelMap, setSkillLevelMap] = useState({});
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
        if (!user) { navigate('/register'); return; }

        const { data: ld } = await supabase.from('learners').select('*').eq('user_id', user.id).maybeSingle();
        if (!ld?.id) throw new Error('Learner profile not found.');
        setLearner(ld);

        setLoadingMsg('Checking for existing roadmap...');
        const { data: existing } = await supabase
          .from('learning_paths').select('*')
          .eq('learner_id', ld.id).order('created_at', { ascending: false }).limit(1).maybeSingle();

        setLoadingMsg('Fetching your assessment results...');
        const { data: ar } = await supabase
          .from('assessment_results')
          .select('skill_gaps, difficulty_breakdown, overall_percentage, skill_report')
          .eq('learner_id', ld.id).order('created_at', { ascending: false }).limit(1).maybeSingle();

        const dm          = ar?.difficulty_breakdown ?? {};
        const skillReport = ar?.skill_report ?? [];
        const slMap       = buildSkillLevelMap(skillReport, dm);
        setSkillLevelMap(slMap);

        const allGaps = (ar?.skill_gaps ?? [])
          .map(g => (typeof g === 'string' ? g : g?.skill ?? g?.name ?? String(g)))
          .filter(Boolean);

        if (existing) {
          const rawPhases = Array.isArray(existing.phases) ? existing.phases : Object.values(existing.phases ?? {});
          const hasRealData = rawPhases.length > 0 && (rawPhases[0]?.title || rawPhases[0]?.phase);

          if (hasRealData) {
            const skillBuckets = classifySkillsAcrossPhases(allGaps, slMap, rawPhases.length);
            const patched = rawPhases.map((p, i) => ({
              ...p,
              skills: skillBuckets[i]?.length > 0 ? skillBuckets[i] : allGaps,
            }));
            const rm       = { ...existing, phases: patched };
            const statuses = loadPhaseStatuses(existing.id, patched);
            setRoadmap(rm);
            setPhaseStatuses(statuses);
            startPolling(existing.id, patched.length);
            return;
          }
          await supabase.from('learning_paths').delete().eq('id', existing.id);
        }

        const payload = {
          user_id: ld.user_id, learner_id: ld.id,
          hours_per_week: ld.hours_per_week || 10, timeline_months: ld.timeline_months || 6,
          target_job_role: ld.target_job_role || ld.target_role || '',
          current_skills: ld.current_skills || [], education_level: ld.education_level || '',
          learning_style: ld.learning_style || '', full_name: ld.full_name || ld.name || '',
          skill_gaps: allGaps, difficulty_breakdown: dm,
          overall_percentage: ar?.overall_percentage ?? 0, skill_report: skillReport,
        };

        setLoadingMsg('Generating your personalised roadmap... (this may take up to 60s)');
        const res = await fetch('https://ai-powered-personalized-learning-path-qr7d.onrender.com/generate-path', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), signal: AbortSignal.timeout(120000),
        });
        if (!res.ok) throw new Error('Path generation failed (' + res.status + '): ' + await res.text());

        const generated    = await res.json();
        const rawPhases    = generated.phases ?? generated.data?.phases ?? [];
        const skillBuckets = classifySkillsAcrossPhases(allGaps, slMap, rawPhases.length);

        const phases = rawPhases.map((p, i) => ({
          ...p,
          title:          p.title ?? p.phase ?? p.name ?? `Phase ${i + 1}`,
          description:    p.description ?? p.objective ?? '',
          skills:         skillBuckets[i]?.length > 0 ? skillBuckets[i] : allGaps,
          resources:      p.resources ?? p.materials ?? [],
          duration_weeks: p.duration_weeks ?? p.weeks ?? null,
        }));

        const extractText = (val) => {
          if (!val) return null;
          if (typeof val === 'string') return val;
          return val?.text ?? val?.content ?? JSON.stringify(val);
        };
        const root = generated.data ?? generated;

        setLoadingMsg('Saving your roadmap...');
        const { data: saved, error: se } = await supabase.from('learning_paths').insert({
          learner_id: ld.id, phases,
          explanation_basics:       extractText(root.explanation_basics),
          explanation_intermediate: extractText(root.explanation_intermediate),
          explanation_advanced:     extractText(root.explanation_advanced),
          explanation_outcomes:     extractText(root.explanation_outcomes),
          estimated_duration_weeks: root.estimated_duration_weeks ?? null,
          success_probability:      root.success_probability      ?? null,
        }).select().maybeSingle();
        if (se) throw se;

        const statuses = loadPhaseStatuses(saved.id, phases);
        setRoadmap(saved);
        setPhaseStatuses(statuses);
        startPolling(saved.id, phases.length);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, startPolling]);

  const handleMarkComplete = useCallback(async (phaseIndex) => {
    if (!roadmap) return;
    setPhaseStatuses(prev => {
      const next = [...prev];
      next[phaseIndex] = STATUS.completed;
      if (phaseIndex + 1 < next.length && next[phaseIndex + 1] === STATUS.locked)
        next[phaseIndex + 1] = STATUS.active;
      savePhaseStatuses(roadmap.id, next);
      return next;
    });
    try {
      const phases = Array.isArray(roadmap.phases) ? roadmap.phases : Object.values(roadmap.phases ?? {});
      await supabase.from('learning_paths').update({
        phases: phases.map((p, i) => {
          if (i === phaseIndex) return { ...p, status: STATUS.completed };
          if (i === phaseIndex + 1 && (p.status ?? STATUS.locked) === STATUS.locked) return { ...p, status: STATUS.active };
          return p;
        }),
      }).eq('id', roadmap.id);
    } catch {}
  }, [roadmap]);

  const handleRevertPhase = useCallback(async (phaseIndex) => {
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
      await supabase.from('learning_paths').update({
        phases: phases.map((p, i) => {
          if (i === phaseIndex) return { ...p, status: STATUS.active };
          if (i === phaseIndex + 1 && (p.status ?? STATUS.active) === STATUS.active) return { ...p, status: STATUS.locked };
          return p;
        }),
      }).eq('id', roadmap.id);
    } catch {}
  }, [roadmap]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-14 h-14 bg-gradient-to-br from-[#2B7A78] to-[#3aafa9] rounded-2xl flex items-center justify-center shadow-xl shadow-[#2B7A78]/30">
        <Sparkles className="w-7 h-7 text-white" />
      </div>
      <Loader2 className="w-6 h-6 text-[#2B7A78] animate-spin" />
      <p className="text-gray-800 text-sm font-semibold">{loadingMsg}</p>
      {loadingMsg.includes('60s') && (
        <p className="text-gray-400 text-xs max-w-xs mt-1">The AI server may be waking up. Please wait and do not refresh.</p>
      )}
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <p className="font-bold text-gray-800">Couldn't load your roadmap</p>
      <p className="text-gray-400 text-sm max-w-sm">{error}</p>
      <div className="flex gap-3 mt-2">
        <button onClick={() => window.location.reload()} className="text-sm text-white bg-[#2B7A78] px-4 py-2 rounded-lg font-semibold">Try Again</button>
        <button onClick={() => navigate(-1)} className="text-sm text-[#2B7A78] font-semibold underline underline-offset-2">Go back</button>
      </div>
    </div>
  );

  const phases = Array.isArray(roadmap?.phases) ? roadmap.phases : Object.values(roadmap?.phases ?? {});
  const done   = phaseStatuses.filter(s => s === STATUS.completed).length;
  const pct    = phases.length ? Math.round((done / phases.length) * 100) : 0;
  const sp     = roadmap?.success_probability != null
    ? `${(parseFloat(roadmap.success_probability) < 1 ? parseFloat(roadmap.success_probability) * 100 : parseFloat(roadmap.success_probability)).toFixed(0)}%`
    : '—';
  const hasLevelData = Object.keys(skillLevelMap).length > 0;

  return (
    <div className="min-h-screen bg-gray-50/60">
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2B7A78] to-[#3aafa9] rounded-lg flex items-center justify-center shadow-md shadow-[#2B7A78]/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-gray-900 text-base hidden sm:block">SkillPath AI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 font-medium hidden sm:block">Your Learning Roadmap</span>
            <button onClick={() => navigate('/dashboard')}
              className="text-sm font-bold text-gray-700 border border-gray-200 hover:border-[#2B7A78] hover:text-[#2B7A78] px-4 py-1.5 rounded-lg transition-all">
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {/* Hero */}
        <div className="rounded-3xl px-7 py-8 md:px-10 md:py-9 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#2B7A78 0%,#3aafa9 100%)' }}>
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-7 md:gap-10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 opacity-75">
                <Map className="w-3.5 h-3.5 text-white" />
                <span className="text-[10px] font-black tracking-widest text-white uppercase">Your Roadmap</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                {learner?.target_job_role ?? 'Your Career Path'}
              </h1>
              <p className="text-white/60 text-sm font-semibold mt-1.5">
                {phases.length} phase{phases.length !== 1 ? 's' : ''} · {roadmap?.estimated_duration_weeks ?? '—'}w estimated
              </p>
              <div className="mt-4 max-w-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white/60 text-xs font-semibold">{done}/{phases.length} phases complete</span>
                  <span className="text-white font-black text-xs">{pct}%</span>
                </div>
                <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
            <ProgressRing pct={pct} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Clock}     label="Duration" value={roadmap?.estimated_duration_weeks ? `${roadmap.estimated_duration_weeks}w` : '—'} sub="estimated" />
          <StatCard icon={BarChart2} label="Success"  value={sp}           sub="probability" />
          <StatCard icon={Target}    label="Phases"   value={phases.length} sub="total milestones" />
          <StatCard icon={Award}     label="Goal"     value={learner?.target_job_role ?? '—'} />
        </div>

        <ExplanationCard
          basics={roadmap?.explanation_basics}
          intermediate={roadmap?.explanation_intermediate}
          advanced={roadmap?.explanation_advanced}
          outcomes={roadmap?.explanation_outcomes}
        />

        {hasLevelData && (
          <div className="flex flex-wrap items-center gap-3 px-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Skill levels:</span>
            {[
              { label: 'Beginner',     cls: 'bg-blue-50 text-blue-600 border-blue-100' },
              { label: 'Intermediate', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
              { label: 'Advanced',     cls: 'bg-purple-50 text-purple-600 border-purple-100' },
            ].map(({ label, cls }) => (
              <span key={label} className={`inline-flex items-center gap-1 text-xs font-semibold border rounded-full px-2.5 py-1 ${cls}`}>
                <Zap className="w-2.5 h-2.5" />{label}
              </span>
            ))}
          </div>
        )}

        {/* Phases */}
        <div>
          <div className="flex items-center gap-2.5 mb-5">
            <BookOpen className="w-5 h-5 text-[#2B7A78]" />
            <h2 className="text-xl font-black text-gray-900">Learning Phases</h2>
            {done > 0 && (
              <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                {done} completed 🎉
              </span>
            )}
          </div>

          {phases.length === 0 ? (
            <div className="text-center py-20 text-gray-300">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No phases found in this roadmap.</p>
            </div>
          ) : (
            phases.map((phase, i) => (
              <PhaseCard
                key={i}
                phase={phase}
                index={i}
                total={phases.length}
                status={phaseStatuses[i] ?? (i === 0 ? STATUS.active : STATUS.locked)}
                navigate={navigate}
                pathId={roadmap?.id}
                onMarkComplete={handleMarkComplete}
                onRevertPhase={handleRevertPhase}
                skillLevelMap={skillLevelMap}
              />
            ))
          )}
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">© 2026 SkillPath AI Learning Systems. All rights reserved.</p>
      </main>
    </div>
  );
}
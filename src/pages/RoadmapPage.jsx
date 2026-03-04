import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, CheckCircle2, Lock, ChevronDown, ChevronUp,
  Clock, Target, Award, Loader2, AlertCircle,
  Zap, ArrowRight, BarChart2, BookOpen, Map
} from 'lucide-react';
import supabase from '../supabaseClient';


// ─── Phase status ────────────────────────────────────────────────────────────
const STATUS = { completed: 'completed', active: 'active', locked: 'locked' };
function getStatus(phase, index) {
  if (phase.status) return phase.status;
  return index === 0 ? STATUS.active : STATUS.locked;
}

// ─── StatusPill ──────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = {
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    active:    'bg-teal-50   text-[#2B7A78]   border-teal-200',
    locked:    'bg-gray-100  text-gray-400    border-gray-200',
  };
  const labels = { completed: '✓ Completed', active: 'In Progress', locked: 'Upcoming' };
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${cfg[status] ?? cfg.locked}`}>
      {labels[status] ?? 'Upcoming'}
    </span>
  );
}

// ─── TimelineNode ─────────────────────────────────────────────────────────────
function TimelineNode({ status, index }) {
  if (status === STATUS.completed)
    return (
      <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200 shrink-0">
        <CheckCircle2 className="w-5 h-5 text-white" />
      </div>
    );
  if (status === STATUS.active)
    return (
      <div className="w-11 h-11 rounded-full bg-[#2B7A78] flex items-center justify-center shadow-lg shadow-[#2B7A78]/30 shrink-0 ring-4 ring-[#2B7A78]/15">
        <span className="text-white font-black text-sm">{index + 1}</span>
      </div>
    );
  return (
    <div className="w-11 h-11 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0">
      <Lock className="w-4 h-4 text-gray-300" />
    </div>
  );
}

// ─── SkillChip ────────────────────────────────────────────────────────────────
function SkillChip({ label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-teal-50 text-[#2B7A78] border border-teal-200 rounded-full px-3 py-1.5">
      <Zap className="w-3 h-3 shrink-0" />
      {label}
    </span>
  );
}

// ─── PhaseCard ────────────────────────────────────────────────────────────────
function PhaseCard({ phase, index, total }) {
  const status = getStatus(phase, index);
  const [open, setOpen] = useState(status === STATUS.active);

  const title     = phase.title ?? phase.phase ?? phase.name ?? `Phase ${index + 1}`;
  const desc      = phase.description ?? phase.objective ?? '';
  const skills    = phase.skills ?? phase.key_skills ?? phase.topics ?? [];
  const resources = phase.resources ?? phase.materials ?? [];
  const weeks     = phase.duration_weeks ?? phase.weeks ?? null;

  const cardBorder = {
    completed: 'border-emerald-200',
    active:    'border-[#2B7A78]/40 shadow-xl shadow-[#2B7A78]/8',
    locked:    'border-gray-200',
  };
  const cardBg = {
    completed: 'bg-white',
    active:    'bg-white',
    locked:    'bg-gray-50/70',
  };

  return (
    <div className="flex gap-5">
      {/* spine */}
      <div className="flex flex-col items-center pt-0.5">
        <TimelineNode status={status} index={index} />
        {index < total - 1 && (
          <div
            className="w-px flex-1 mt-3"
            style={{
              background: status === STATUS.completed
                ? 'linear-gradient(to bottom,#10b981,#d1fae5)'
                : 'linear-gradient(to bottom,#e5e7eb,transparent)',
              minHeight: 36,
            }}
          />
        )}
      </div>

      {/* card */}
      <div className={`flex-1 mb-7 rounded-2xl border-2 overflow-hidden transition-all duration-300 ${cardBorder[status]} ${cardBg[status]}`}>
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full text-left px-6 py-5 flex items-center justify-between gap-3 group"
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-black tracking-widest text-gray-400 uppercase">Phase {index + 1}</span>
              <StatusPill status={status} />
              {weeks && (
                <span className="flex items-center gap-1 text-xs text-gray-400 font-semibold">
                  <Clock className="w-3 h-3" />{weeks}w
                </span>
              )}
            </div>
            <h3 className={`font-black text-lg leading-tight ${status === STATUS.locked ? 'text-gray-400' : 'text-gray-900'}`}>
              {title}
            </h3>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-300 group-hover:text-[#2B7A78] transition-all duration-200 ${open ? 'rotate-180 text-[#2B7A78]' : ''}`}
          />
        </button>

        {open && (
          <div className="px-6 pb-6 pt-1 border-t border-gray-100 space-y-5">
            {desc && <p className="text-sm text-gray-600 leading-relaxed pt-3">{desc}</p>}

            {skills.length > 0 && (
              <div>
                <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase mb-3">Skills &amp; Topics</p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <SkillChip key={i} label={typeof s === 'string' ? s : s.name ?? String(s)} />
                  ))}
                </div>
              </div>
            )}

            {resources.length > 0 && (
              <div>
                <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase mb-3">Resources</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {resources.map((r, i) => {
                    const icons = { video: '🎬', article: '📄', course: '📚', project: '🛠️', quiz: '✅' };
                    const icon  = icons[r?.type?.toLowerCase()] ?? '📌';
                    const label = typeof r === 'string' ? r : r?.title ?? JSON.stringify(r);
                    return (
                      <div key={i} className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700">
                        <span>{icon}</span>
                        <span className="truncate font-medium">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {status === STATUS.active && (
              <button className="inline-flex items-center gap-2 bg-[#2B7A78] hover:bg-[#1f5a58] text-white text-sm font-bold px-6 py-3 rounded-xl transition-all duration-150 shadow-lg shadow-[#2B7A78]/25 hover:-translate-y-0.5 active:scale-95">
                Continue Learning <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Explanation Card (4 sections) ───────────────────────────────────────────
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
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-6 h-6 rounded-full bg-[#2B7A78]/10 text-[#2B7A78] text-xs font-black flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <p className="font-bold text-gray-900 text-sm">{sec.label}</p>
            </div>
            <p className="pl-9 text-sm text-gray-600 leading-relaxed">{sec.value}</p>
          </div>
        ))}
      </div>
      {sections.length > 1 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full border-t border-gray-100 py-3.5 text-sm font-bold text-[#2B7A78] hover:bg-teal-50/60 transition-colors flex items-center justify-center gap-1.5"
        >
          {expanded
            ? <><ChevronUp className="w-4 h-4" />Show less</>
            : <><ChevronDown className="w-4 h-4" />Read more · {sections.length - 1} more section{sections.length > 2 ? 's' : ''}</>}
        </button>
      )}
    </div>
  );
}

// ─── Progress ring ───────────────────────────────────────────────────────────
function ProgressRing({ pct }) {
  const r    = 36;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none" stroke="white" strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-white leading-none">{pct}%</span>
        <span className="text-white/50 text-[10px] font-semibold mt-0.5">done</span>
      </div>
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[#2B7A78]" />
        <span className="text-[11px] font-black tracking-widest text-gray-400 uppercase">{label}</span>
      </div>
      <p className="text-2xl font-black text-gray-900 truncate leading-none mb-1">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 font-medium">{sub}</p>}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function RoadmapPage() {
  const navigate = useNavigate();
  const [loading,    setLoading]    = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Loading your profile...');
  const [error,      setError]      = useState(null);
  const [roadmap,    setRoadmap]    = useState(null);
  const [learner,    setLearner]    = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/register'); return; }

        const { data: ld } = await supabase
          .from('learners').select('*').eq('user_id', user.id).maybeSingle();
        if (!ld?.id) throw new Error('Learner profile not found.');
        setLearner(ld);

        setLoadingMsg('Checking for existing roadmap...');
        const { data: existing } = await supabase
          .from('learning_paths').select('*')
          .eq('learner_id', ld.id)
          .order('created_at', { ascending: false })
          .limit(1).maybeSingle();
        // Only reuse if it has real phase data with actual titles
        if (existing) {
          const existingPhases = Array.isArray(existing.phases)
            ? existing.phases : Object.values(existing.phases ?? {});
          const hasRealData = existingPhases.length > 0 &&
            (existingPhases[0]?.title || existingPhases[0]?.phase) &&
            existingPhases[0]?.skills?.length > 0;
          if (hasRealData) { setRoadmap(existing); return; }
          // Delete bad row so we regenerate
          await supabase.from('learning_paths').delete().eq('id', existing.id);
        }

        setLoadingMsg('Fetching your assessment results...');
        const { data: ar } = await supabase
          .from('assessment_results')
          .select('skill_gaps, difficulty_breakdown, overall_percentage, skill_report')
          .eq('learner_id', ld.id)
          .order('created_at', { ascending: false })
          .limit(1).maybeSingle();

        const payload = {
          user_id:              ld.user_id,
          learner_id:           ld.id,
          hours_per_week:       ld.hours_per_week  || 10,
          timeline_months:      ld.timeline_months || 6,
          target_job_role:      ld.target_job_role || ld.target_role || '',
          current_skills:       ld.current_skills  || [],
          education_level:      ld.education_level || '',
          learning_style:       ld.learning_style  || '',
          full_name:            ld.full_name || ld.name || '',
          skill_gaps:           ar ? (ar.skill_gaps || []) : [],
          difficulty_breakdown: ar ? (ar.difficulty_breakdown || {}) : {},
          overall_percentage:   ar ? (ar.overall_percentage || 0) : 0,
          skill_report:         ar ? (ar.skill_report || []) : [],
        };

        setLoadingMsg('Generating your personalised roadmap... (this may take up to 60s)');
        // USE this instead
        const res = await fetch(
          'https://ai-powered-personalized-learning-path-qr7d.onrender.com/generate-path',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(120000), // 2 min timeout
          }
        );
        if (!res.ok) {
          const errText = await res.text();
          throw new Error('Path generation failed (' + res.status + '): ' + errText);
        }
        const generated = await res.json();
        console.log('Backend response:', JSON.stringify(generated, null, 2));

        // ── Normalize phases: map 'phase' key → 'title' ──────────────────
        const rawPhases = generated.phases ?? generated.data?.phases ?? [];
        const phases = rawPhases.map(p => ({
          ...p,
          title: p.title ?? p.phase ?? p.name ?? 'Phase',
          description: p.description ?? p.objective ?? '',
          skills: p.skills ?? p.key_skills ?? [],
          resources: p.resources ?? p.materials ?? [],
          duration_weeks: p.duration_weeks ?? p.weeks ?? null,
        }));

        // ── Extract explanation text (handles both string and {text:...} ) ─
        const extractText = (val) => {
          if (!val) return null;
          if (typeof val === 'string') return val;
          if (typeof val === 'object') return val.text ?? val.content ?? JSON.stringify(val);
          return String(val);
        };

        const root = generated.data ?? generated;

        setLoadingMsg('Saving your roadmap...');
        const { data: saved, error: se } = await supabase
          .from('learning_paths')
          .insert({
            learner_id:               ld.id,
            phases:                   phases,
            explanation_basics:       extractText(root.explanation_basics),
            explanation_intermediate: extractText(root.explanation_intermediate),
            explanation_advanced:     extractText(root.explanation_advanced),
            explanation_outcomes:     extractText(root.explanation_outcomes),
            estimated_duration_weeks: root.estimated_duration_weeks ?? null,
            success_probability:      root.success_probability      ?? null,
          })
          .select().maybeSingle();
        if (se) throw se;
        setRoadmap(saved);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

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
        <button onClick={() => navigate(-1)} className="mt-1 text-sm text-[#2B7A78] font-semibold underline underline-offset-2">Go back</button>
      </div>
    </div>
  );

  const phases = Array.isArray(roadmap?.phases)
    ? roadmap.phases
    : Object.values(roadmap?.phases ?? {});

  const done = phases.filter(p => (p.status ?? '') === STATUS.completed).length;
  const pct  = phases.length ? Math.round((done / phases.length) * 100) : 0;
  const sp   = roadmap?.success_probability != null
    ? `${parseFloat(roadmap.success_probability).toFixed(2)}%`
    : '—';

  return (
    <div className="min-h-screen bg-gray-50/60">

      {/* Header */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2B7A78] to-[#3aafa9] rounded-lg flex items-center justify-center shadow-md shadow-[#2B7A78]/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-gray-900 text-base hidden sm:block">SkillPath AI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 font-medium hidden sm:block">Your Learning Roadmap</span>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm font-bold text-gray-700 border border-gray-300 hover:border-[#2B7A78] hover:text-[#2B7A78] px-4 py-1.5 rounded-lg transition-all"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-10 space-y-6">

        {/* Hero */}
        <div
          className="rounded-3xl px-7 py-8 md:px-10 md:py-9 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #2B7A78 0%, #3aafa9 100%)' }}
        >
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-20 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center gap-7 md:gap-10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2.5 opacity-75">
                <Map className="w-4 h-4 text-white" />
                <span className="text-xs font-black tracking-widest text-white uppercase">Your Roadmap</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                {learner?.target_job_role ?? 'Your Career Path'}
              </h1>
              <p className="text-white/60 text-sm font-semibold mt-1.5">
                {phases.length} phase{phases.length !== 1 ? 's' : ''} &nbsp;·&nbsp; {roadmap?.estimated_duration_weeks ?? '—'}w estimated
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <ProgressRing pct={pct} />
              <span className="text-white/55 text-xs font-bold">{done}/{phases.length} phases done</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <StatCard icon={Clock}     label="Duration" value={roadmap?.estimated_duration_weeks ? `${roadmap.estimated_duration_weeks}w` : '—'} sub="estimated" />
          <StatCard icon={BarChart2} label="Success"  value={sp}            sub="probability" />
          <StatCard icon={Target}    label="Phases"   value={phases.length}  sub="total milestones" />
          <StatCard icon={Award}     label="Goal"     value={learner?.target_job_role ?? '—'} />
        </div>

        {/* Explanation — 4 columns */}
        <ExplanationCard
          basics={roadmap?.explanation_basics}
          intermediate={roadmap?.explanation_intermediate}
          advanced={roadmap?.explanation_advanced}
          outcomes={roadmap?.explanation_outcomes}
        />

        {/* Phases */}
        <div>
          <div className="flex items-center gap-2.5 mb-6">
            <BookOpen className="w-5 h-5 text-[#2B7A78]" />
            <h2 className="text-xl font-black text-gray-900">Learning Phases</h2>
          </div>
          {phases.length === 0 ? (
            <div className="text-center py-20 text-gray-300">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No phases found in this roadmap.</p>
            </div>
          ) : (
            phases.map((phase, i) => <PhaseCard key={i} phase={phase} index={i} total={phases.length} />)
          )}
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">
          © 2026 SkillPath AI Learning Systems. All rights reserved.
        </p>
      </main>
    </div>
  );
}
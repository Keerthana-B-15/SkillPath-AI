import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, BarChart2, Target, ChevronDown,
  AlertCircle, Loader2, ArrowRight, Brain, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Calendar, Award
} from 'lucide-react';
import supabase from '../supabaseClient';


function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ScoreBadge({ score }) {
  if (score >= 80) return <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Excellent</span>;
  if (score >= 60) return <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Good</span>;
  return <span className="text-xs font-black px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">Needs Work</span>;
}

function ScoreRing({ score, size = 72 }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : '#f97316';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-black text-gray-900 leading-none">{score?.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function DifficultyBar({ label, data, color }) {
  const pct = data?.total ? Math.round((data.correct / data.total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-gray-600">{label}</span>
        <span className="text-xs font-black text-gray-800">{data?.correct ?? 0}/{data?.total ?? 0}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: pct + '%' }} />
      </div>
    </div>
  );
}

function AttemptCard({ attempt, index, isLatest }) {
  const [open, setOpen] = useState(isLatest);
  const score    = attempt.overall_percentage ?? 0;
  const gaps     = attempt.skill_gaps ?? [];
  const report   = attempt.skill_report ?? [];
  const diff     = attempt.difficulty_breakdown ?? {};
  const date     = formatDate(attempt.created_at);

  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all shadow-sm hover:shadow-md
      ${isLatest ? 'border-[#2B7A78]/40' : 'border-gray-200'}`}>

      {/* Card header */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full text-left px-6 py-5 flex items-center gap-4 group">

        <ScoreRing score={score} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[11px] font-black tracking-widest text-gray-400 uppercase">
              Attempt {index + 1}
            </span>
            {isLatest && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#2B7A78] text-white uppercase tracking-wide">
                Latest
              </span>
            )}
            <ScoreBadge score={score} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
            <Calendar className="w-3 h-3" />
            {date}
          </div>
          {gaps.length > 0 && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              Gaps: {gaps.slice(0, 3).join(', ')}{gaps.length > 3 ? ` +${gaps.length - 3} more` : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-2xl font-black text-gray-900 leading-none">{score?.toFixed(1)}%</p>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">overall score</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-300 group-hover:text-[#2B7A78] transition-all duration-200
            ${open ? 'rotate-180 text-[#2B7A78]' : ''}`} />
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100 space-y-5">

          {/* Difficulty breakdown */}
          {Object.keys(diff).length > 0 && (
            <div>
              <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase mb-3">Difficulty Breakdown</p>
              <div className="space-y-3">
                {diff.Easy   && <DifficultyBar label="Easy"   data={diff.Easy}   color="bg-emerald-400" />}
                {diff.Medium && <DifficultyBar label="Medium" data={diff.Medium} color="bg-amber-400" />}
                {diff.Hard   && <DifficultyBar label="Hard"   data={diff.Hard}   color="bg-red-400" />}
              </div>
            </div>
          )}

          {/* Skill report */}
          {report.length > 0 && (
            <div>
              <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase mb-3">Skill Performance</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {report.map((s, i) => {
                  const pct = s.percentage ?? 0;
                  const pass = pct >= 60;
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border
                      ${pass ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                      {pass
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{s.skill}</p>
                        <div className="h-1.5 bg-white/60 rounded-full mt-1 overflow-hidden">
                          <div className={`h-full rounded-full ${pass ? 'bg-emerald-400' : 'bg-red-400'}`}
                            style={{ width: pct + '%' }} />
                        </div>
                      </div>
                      <span className={`text-xs font-black shrink-0 ${pass ? 'text-emerald-700' : 'text-red-600'}`}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Skill gaps */}
          {gaps.length > 0 && (
            <div>
              <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase mb-3">Skill Gaps</p>
              <div className="flex flex-wrap gap-2">
                {gaps.map((g, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-50 text-red-600 border border-red-100 rounded-full px-3 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {typeof g === 'string' ? g : g.skill ?? String(g)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResultsHistoryPage() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [learner,  setLearner]  = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }

        const { data: ld } = await supabase
          .from('learners').select('*').eq('user_id', user.id).maybeSingle();
        if (!ld) { navigate('/login'); return; }
        setLearner(ld);

        const { data: results } = await supabase
          .from('assessment_results')
          .select('*')
          .eq('learner_id', ld.id)
          .order('created_at', { ascending: false });

        setAttempts(results ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-[#2B7A78] to-[#3aafa9] rounded-2xl flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <Loader2 className="w-5 h-5 text-[#2B7A78] animate-spin" />
      </div>
    </div>
  );

  
  const best    = attempts.length ? Math.max(...attempts.map(a => a.overall_percentage ?? 0)) : null;
  const avg     = attempts.length ? attempts.reduce((s, a) => s + (a.overall_percentage ?? 0), 0) / attempts.length : null;
  const trend   = attempts.length >= 2
    ? (attempts[0].overall_percentage ?? 0) - (attempts[1].overall_percentage ?? 0)
    : null;

  return (
    <div className="min-h-screen bg-gray-50/60">

      {/* Header */}
      <header className="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2B7A78] to-[#3aafa9] rounded-lg flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-gray-900 text-base hidden sm:block">SkillPath AI</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
              className="text-sm font-bold text-gray-600 border border-gray-300 hover:border-[#2B7A78] hover:text-[#2B7A78] px-4 py-1.5 rounded-lg transition-all">
              Dashboard
            </button>
            <button onClick={() => navigate('/assessment')}
              className="text-sm font-bold text-white bg-[#2B7A78] hover:bg-[#1f5a58] px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" /> Retake
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-black text-gray-900">Assessment History</h1>
          <p className="text-gray-400 text-sm font-semibold mt-1">
            {learner?.target_job_role && `Goal: ${learner.target_job_role} · `}
            {attempts.length} attempt{attempts.length !== 1 ? 's' : ''} recorded
          </p>
        </div>

        {/* Summary stats */}
        {attempts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Award,      label: 'Best Score',  value: best !== null ? `${best.toFixed(1)}%` : '—',  accent: 'bg-emerald-500' },
              { icon: BarChart2,  label: 'Average',     value: avg  !== null ? `${avg.toFixed(1)}%`  : '—',  accent: 'bg-blue-500' },
              { icon: Target,     label: 'Attempts',    value: attempts.length,                               accent: 'bg-[#2B7A78]' },
              {
                icon: trend !== null && trend >= 0 ? TrendingUp : TrendingDown,
                label: 'Trend',
                value: trend !== null ? `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%` : '—',
                accent: trend !== null && trend >= 0 ? 'bg-emerald-500' : 'bg-orange-400'
              },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${s.accent}`}>
                  <s.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xl font-black text-gray-900 leading-none">{s.value}</p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Attempt cards */}
        {attempts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-700 mb-1">No assessment results yet</p>
            <p className="text-sm text-gray-400 mb-5">Take your first assessment to see results here.</p>
            <button onClick={() => navigate('/assessment')}
              className="inline-flex items-center gap-2 bg-[#2B7A78] text-white font-bold text-sm px-6 py-3 rounded-xl">
              Start Assessment <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((a, i) => (
              <AttemptCard key={a.id ?? i} attempt={a} index={i} isLatest={i === 0} />
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pb-4">
          © 2026 SkillPath AI Learning Systems. All rights reserved.
        </p>
      </main>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, BookOpen, Target, Award, Clock, ArrowRight,
  BarChart2, CheckCircle2, TrendingUp, Zap, Map,
  LogOut, User, ChevronRight, Star, Briefcase, Brain
} from 'lucide-react';
import supabase from '../supabaseClient';


// ─── Role-based recommendations ───────────────────────────────────────────────
const ROLE_RECS = {
  default: [
    { icon: '📘', title: 'Build Strong Fundamentals', desc: 'Master core concepts before advancing to specialised topics.', tag: 'Foundation' },
    { icon: '🛠️', title: 'Work on Real Projects', desc: 'Apply your skills by building portfolio projects from scratch.', tag: 'Practical' },
    { icon: '🤝', title: 'Join a Community', desc: 'Engage with peers on Discord, Reddit, or LinkedIn groups.', tag: 'Networking' },
    { icon: '📝', title: 'Document Your Journey', desc: 'Write blogs or LinkedIn posts to solidify learning and build visibility.', tag: 'Growth' },
  ],
  'software': [
    { icon: '💻', title: 'Master Data Structures & Algorithms', desc: 'Practice on LeetCode and HackerRank daily — essential for FAANG interviews.', tag: 'Core Skills', link: 'https://leetcode.com' },
    { icon: '🌐', title: 'Build Full-Stack Projects', desc: 'Create end-to-end apps using React, Node.js, and a database to show versatility.', tag: 'Portfolio', link: 'https://github.com' },
    { icon: '☁️', title: 'Learn Cloud Basics', desc: 'AWS or GCP fundamentals are now expected in most software engineer roles.', tag: 'In Demand', link: 'https://aws.amazon.com/training' },
    { icon: '🔀', title: 'Contribute to Open Source', desc: 'Pick a GitHub project you use and submit your first PR this week.', tag: 'Visibility', link: 'https://github.com/explore' },
  ],
  'data': [
    { icon: '🐍', title: 'Deepen Python & SQL Skills', desc: 'Pandas, NumPy, and advanced SQL queries are the backbone of data work.', tag: 'Core Skills', link: 'https://kaggle.com' },
    { icon: '📊', title: 'Build a Kaggle Portfolio', desc: 'Participate in competitions and publish notebooks to demonstrate expertise.', tag: 'Portfolio', link: 'https://kaggle.com/competitions' },
    { icon: '🤖', title: 'Learn Machine Learning Basics', desc: 'Scikit-learn and basic ML workflows will differentiate you from pure analysts.', tag: 'Upskill', link: 'https://scikit-learn.org' },
    { icon: '📈', title: 'Master a BI Tool', desc: 'Tableau or Power BI proficiency opens doors to analyst and scientist roles alike.', tag: 'In Demand', link: 'https://public.tableau.com' },
  ],
  'design': [
    { icon: '🎨', title: 'Build a Figma Portfolio', desc: 'Create 3–5 high-quality case studies showing your full design process.', tag: 'Portfolio', link: 'https://figma.com' },
    { icon: '🔬', title: 'Study User Research Methods', desc: 'Learn to conduct interviews and usability tests — employers value research skills heavily.', tag: 'Core Skills' },
    { icon: '📱', title: 'Design for Mobile First', desc: 'Practice responsive and mobile-first design patterns across device sizes.', tag: 'Practical' },
    { icon: '🤝', title: 'Collaborate with Developers', desc: 'Learn basic HTML/CSS to communicate better and handoff designs effectively.', tag: 'Growth' },
  ],
  'product': [
    { icon: '📋', title: 'Write Product Specs', desc: 'Practice writing PRDs and user stories. Share them publicly for feedback.', tag: 'Core Skills' },
    { icon: '📊', title: 'Learn Product Analytics', desc: 'Get hands-on with Mixpanel, Amplitude, or Google Analytics — data drives decisions.', tag: 'In Demand', link: 'https://mixpanel.com' },
    { icon: '🧪', title: 'Run A/B Tests', desc: 'Understand experiment design and statistical significance for product decisions.', tag: 'Upskill' },
    { icon: '🗣️', title: 'Talk to Users Weekly', desc: 'Schedule user interviews consistently. Nothing replaces direct customer feedback.', tag: 'Growth' },
  ],
  'marketing': [
    { icon: '📣', title: 'Master SEO Fundamentals', desc: 'Keyword research, on-page SEO, and link building are evergreen marketing skills.', tag: 'Core Skills', link: 'https://ahrefs.com/blog' },
    { icon: '📧', title: 'Build an Email Campaign', desc: 'Create a real email sequence and measure open rates, CTR, and conversions.', tag: 'Practical' },
    { icon: '📱', title: 'Learn Paid Social Ads', desc: 'Run a small Meta or Google Ads campaign and optimise for ROAS.', tag: 'In Demand' },
    { icon: '✍️', title: 'Develop a Content Strategy', desc: 'Plan and publish consistently — content compounds over time.', tag: 'Growth' },
  ],
};

function getRecsForRole(role) {
  if (!role) return ROLE_RECS.default;
  const r = role.toLowerCase();
  if (r.includes('software') || r.includes('engineer') || r.includes('developer') || r.includes('backend') || r.includes('frontend')) return ROLE_RECS.software;
  if (r.includes('data') || r.includes('analyst') || r.includes('scientist') || r.includes('ml') || r.includes('machine')) return ROLE_RECS.data;
  if (r.includes('design') || r.includes('ux') || r.includes('ui')) return ROLE_RECS.design;
  if (r.includes('product') || r.includes('pm ') || r.includes(' pm')) return ROLE_RECS.product;
  if (r.includes('market') || r.includes('growth') || r.includes('seo')) return ROLE_RECS.marketing;
  return ROLE_RECS.default;
}

// ─── Mini progress ring ───────────────────────────────────────────────────────
function MiniRing({ pct, size = 56, stroke = 5, color = '#2B7A78' }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all group">
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

// ─── Recommendation card ─────────────────────────────────────────────────────
function RecCard({ rec }) {
  const tagColors = {
    'Core Skills': 'bg-blue-50 text-blue-700',
    'Portfolio':   'bg-purple-50 text-purple-700',
    'In Demand':   'bg-orange-50 text-orange-700',
    'Practical':   'bg-teal-50 text-[#2B7A78]',
    'Upskill':     'bg-pink-50 text-pink-700',
    'Growth':      'bg-emerald-50 text-emerald-700',
    'Networking':  'bg-indigo-50 text-indigo-700',
    'Visibility':  'bg-amber-50 text-amber-700',
    'Foundation':  'bg-gray-100 text-gray-600',
  };
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#2B7A78]/30 transition-all group">
      <div className="flex items-start gap-4">
        <div className="text-2xl shrink-0 mt-0.5">{rec.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="font-bold text-gray-900 text-sm leading-tight">{rec.title}</h4>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">{rec.desc}</p>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide ${tagColors[rec.tag] ?? 'bg-gray-100 text-gray-500'}`}>
              {rec.tag}
            </span>
            {rec.link && (
              <a href={rec.link} target="_blank" rel="noopener noreferrer"
                className="text-xs font-bold text-[#2B7A78] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Visit <ArrowRight className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Phase row (mini) ─────────────────────────────────────────────────────────
function PhaseRow({ phase, index }) {
  const status = phase.status ?? (index === 0 ? 'active' : 'locked');
  const title  = phase.title ?? phase.name ?? phase.phase_name ?? `Phase ${index + 1}`;
  const weeks  = phase.duration_weeks ?? phase.weeks ?? null;
  const statusCfg = {
    completed: { dot: 'bg-emerald-500', text: 'Completed', badge: 'bg-emerald-50 text-emerald-700' },
    active:    { dot: 'bg-[#2B7A78]',   text: 'In Progress', badge: 'bg-teal-50 text-[#2B7A78]' },
    locked:    { dot: 'bg-gray-200',    text: 'Upcoming', badge: 'bg-gray-100 text-gray-400' },
  };
  const cfg = statusCfg[status] ?? statusCfg.locked;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${status === 'locked' ? 'text-gray-400' : 'text-gray-800'}`}>{title}</p>
        {weeks && <p className="text-xs text-gray-400">{weeks} weeks</p>}
      </div>
      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${cfg.badge}`}>
        {cfg.text}
      </span>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [learner,    setLearner]    = useState(null);
  const [roadmap,    setRoadmap]    = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }

        const { data: ld } = await supabase
          .from('learners').select('*').eq('user_id', user.id).maybeSingle();
        if (!ld) { navigate('/login'); return; }
        setLearner(ld);

        const [{ data: rm }, { data: ar }] = await Promise.all([
          supabase.from('learning_paths').select('*')
            .eq('learner_id', ld.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('assessment_results').select('*')
            .eq('learner_id', ld.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ]);

        setRoadmap(rm);
        setAssessment(ar);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

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

  // Compute stats
  let phases = [];
  if (Array.isArray(roadmap?.phases)) phases = roadmap.phases;
  else if (roadmap?.phases && typeof roadmap.phases === 'object')
    phases = Object.entries(roadmap.phases).map(([k, v]) => ({ ...v, title: v.title ?? v.name ?? k }));

  const done       = phases.filter(p => p.status === 'completed').length;
  const pct        = phases.length ? Math.round((done / phases.length) * 100) : 0;
  const score      = assessment?.overall_percentage ?? null;
  const skillGaps  = assessment?.skill_gaps ?? [];
  const recs       = getRecsForRole(learner?.target_job_role);
  const firstName  = (learner?.full_name ?? learner?.name ?? 'Learner').split(' ')[0];
  const sp         = roadmap?.success_probability != null
    ? `${parseFloat(roadmap.success_probability).toFixed(0)}%` : '—';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Welcome hero */}
        <div className="rounded-3xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #2B7A78 0%, #3aafa9 60%, #17c3b2 100%)' }}>
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-48 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
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
                    <Star className="w-3.5 h-3.5 text-white/80" />
                    <span className="text-xs font-bold text-white">Assessment: {score.toFixed(0)}%</span>
                  </div>
                )}
              </div>
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
                  <button onClick={() => navigate('/learning-path')}
                    className="mt-3 flex items-center gap-1.5 bg-white text-[#2B7A78] text-xs font-black px-4 py-2 rounded-xl hover:bg-teal-50 transition-colors shadow-lg">
                    View Roadmap <ArrowRight className="w-3.5 h-3.5" />
                  </button>
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

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <StatCard icon={Map}       label="Roadmap Phases" value={phases.length || '—'} sub="total milestones" accent="bg-[#2B7A78]" />
          <StatCard icon={BarChart2} label="Success Rate"   value={sp}                   sub="predicted"        accent="bg-teal-500" />
          <StatCard icon={Target}    label="Assessment"     value={score !== null ? `${score.toFixed(0)}%` : '—'} sub="overall score" accent="bg-indigo-500" />
          <StatCard icon={TrendingUp} label="Skill Gaps"    value={skillGaps.length || '—'} sub="identified"   accent="bg-orange-400" />
        </div>

        {/* Main 2-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Recommendations (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#2B7A78]" />
                <h2 className="text-lg font-black text-gray-900">
                  Recommendations for {learner?.target_job_role ?? 'You'}
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recs.map((rec, i) => <RecCard key={i} rec={rec} />)}
            </div>

            {/* Skill gaps */}
            {skillGaps.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mt-2">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-[#2B7A78]" />
                  <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Your Skill Gaps</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillGaps.map((gap, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-50 text-red-600 border border-red-100 rounded-full px-3 py-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      {typeof gap === 'string' ? gap : gap.skill ?? String(gap)}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">These are areas where your assessment showed room for improvement. Your roadmap is tailored to address them.</p>
              </div>
            )}
          </div>

          {/* Right — Roadmap snapshot (1/3 width) */}
          <div className="space-y-4">

            {/* Roadmap phases mini */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#2B7A78]" />
                  <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Your Path</h3>
                </div>
                <button onClick={() => navigate('/learning-path')}
                  className="text-xs font-bold text-[#2B7A78] hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {phases.length > 0 ? (
                <div>
                  {phases.slice(0, 5).map((p, i) => <PhaseRow key={i} phase={p} index={i} />)}
                  {phases.length > 5 && (
                    <p className="text-xs text-gray-400 text-center mt-2">+{phases.length - 5} more phases</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Map className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 mb-3">No roadmap yet</p>
                  <button onClick={() => navigate('/learning-path')}
                    className="text-xs font-bold text-white bg-[#2B7A78] px-4 py-2 rounded-lg">
                    Generate Roadmap
                  </button>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'View Full Roadmap', icon: Map, route: '/learning-path', color: 'text-[#2B7A78]', bg: 'hover:bg-teal-50' },
                  { label: 'Retake Assessment', icon: Brain, route: '/assessment', color: 'text-indigo-600', bg: 'hover:bg-indigo-50' },
                  { label: 'View Results', icon: BarChart2, route: '/results', color: 'text-orange-600', bg: 'hover:bg-orange-50' },
                ].map((a, i) => (
                  <button key={i} onClick={() => navigate(a.route)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${a.bg} group`}>
                    <a.icon className={`w-4 h-4 ${a.color}`} />
                    <span className={`text-sm font-bold ${a.color}`}>{a.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 ml-auto" />
                  </button>
                ))}
              </div>
            </div>

            {/* Learner info */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-[#2B7A78]" />
                <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Profile</h3>
              </div>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: 'Name', value: learner?.full_name ?? learner?.name },
                  { label: 'Goal', value: learner?.target_job_role },
                  { label: 'Education', value: learner?.education_level },
                  { label: 'Hours/week', value: learner?.hours_per_week ? `${learner.hours_per_week}h` : null },
                  { label: 'Timeline', value: learner?.timeline_months ? `${learner.timeline_months} months` : null },
                  { label: 'Style', value: learner?.learning_style },
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

        <p className="text-center text-xs text-gray-300 pb-4">
          © 2026 SkillPath AI Learning Systems. All rights reserved.
        </p>
      </main>
    </div>
  );
}
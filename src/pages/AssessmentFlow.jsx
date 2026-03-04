import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';


const BACKEND_URL = 'https://ai-powered-personalized-learning-path-gb1i.onrender.com';

// ─── STEP CONSTANTS ───────────────────────────────────────────────────────────
const STEP_CAREER_GOAL = 1;
const STEP_ASSESSMENT_START = 2;
const STEP_QUIZ = 3;

// ─── ICONS (inline SVG to avoid extra deps) ───────────────────────────────────
const SparklesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.09 3.26L16.5 7.5l-3.41 1.24L12 12l-1.09-3.26L7.5 7.5l3.41-1.24z"/>
    <path d="M5 17l.55 1.64L7.19 19l-1.64.36L5 21l-.55-1.64L2.81 19l1.64-.36z"/>
    <path d="M19 2l.55 1.64L21.19 4l-1.64.36L19 6l-.55-1.64L16.81 4l1.64-.36z"/>
  </svg>
);

const TargetIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── STEP INDICATOR ──────────────────────────────────────────────────────────
function StepIndicator({ currentStep }) {
  const steps = [
    { num: 1, label: 'Career Goal' },
    { num: 2, label: 'Overview' },
    { num: 3, label: 'Assessment' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 36 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.num}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 15, transition: 'all .3s',
              background: currentStep > s.num ? '#2B7A78' : currentStep === s.num ? '#2B7A78' : '#e5e7eb',
              color: currentStep >= s.num ? '#fff' : '#9ca3af',
              boxShadow: currentStep === s.num ? '0 0 0 4px rgba(43,122,120,.18)' : 'none',
            }}>
              {currentStep > s.num ? <CheckIcon /> : s.num}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: currentStep >= s.num ? '#2B7A78' : '#9ca3af', whiteSpace: 'nowrap' }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              height: 2, width: 64, marginBottom: 20, background: currentStep > s.num ? '#2B7A78' : '#e5e7eb', transition: 'background .3s'
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── STEP 1: CAREER GOAL ──────────────────────────────────────────────────────
function CareerGoalStep({ onNext, userId }) {
  const [formData, setFormData] = useState({
    targetJobRole: '',
    timeline: '',
    salaryExpectation: 500000,
    jobType: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const jobRoles = [
    { value: 'Software Development Engineer', nsqf: 'NSQF 4-7' },
    { value: 'Data Analyst', nsqf: 'NSQF 5-6' },
    { value: 'AI Engineer', nsqf: 'NSQF 5' },
    { value: 'Backend Developer', nsqf: 'NSQF 4-5' },
    { value: 'Frontend Developer', nsqf: 'NSQF 4-5' },
    { value: 'Full Stack Developer', nsqf: 'NSQF 4.5/5' },
  ];
  const timelines = [
    { value: '3', label: '3 months' },
    { value: '6', label: '6 months' },
    { value: '12', label: '12 months' }
  ];
  const jobTypes = [
    { value: 'Full-time', icon: '💼' },
    { value: 'Remote', icon: '🌐' },
    { value: 'Internship', icon: '🎓' }
  ];

  // Load existing data
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from('learners')
        .select('target_job_role, timeline_months, salary_expectation, job_type')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) {
        setFormData({
          targetJobRole: data.target_job_role || '',
          timeline: data.timeline_months?.toString() || '',
          salaryExpectation: data.salary_expectation || 500000,
          jobType: data.job_type || ''
        });
      }
    })();
  }, [userId]);

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.targetJobRole) newErrors.targetJobRole = 'Please select a target job role';
    if (!formData.timeline) newErrors.timeline = 'Please select a timeline';
    if (!formData.jobType) newErrors.jobType = 'Please select a job type';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('learners')
        .update({
          target_job_role: formData.targetJobRole,
          timeline_months: parseInt(formData.timeline),
          salary_expectation: formData.salaryExpectation,
          job_type: formData.jobType,
          onboarding_step: 5,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      if (error) throw error;
      sessionStorage.setItem('careerGoal', JSON.stringify(formData));
      onNext(formData);
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = (hasErr) => ({
    width: '100%', padding: '11px 16px', border: `2px solid ${hasErr ? '#fca5a5' : '#e5e7eb'}`,
    borderRadius: 12, fontSize: 15, outline: 'none', background: '#fff', boxSizing: 'border-box',
    appearance: 'none', WebkitAppearance: 'none', transition: 'border .2s',
    color: '#111', cursor: 'pointer',
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ background: 'rgba(43,122,120,.1)', borderRadius: 10, padding: 10, display: 'flex' }}>
          <TargetIcon />
        </div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111' }}>What's your career target?</h2>
      </div>
      <p style={{ color: '#6b7280', marginBottom: 32, marginTop: 4, fontSize: 15 }}>
        Define your goals so we can tailor a personalized assessment for you.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Target Job Role */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>
            Target Job Role <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={formData.targetJobRole}
              onChange={e => { setFormData({ ...formData, targetJobRole: e.target.value }); setErrors({ ...errors, targetJobRole: '' }); }}
              disabled={isSubmitting}
              style={inputStyle(errors.targetJobRole)}
            >
              <option value="">Select target job role</option>
              {jobRoles.map(r => <option key={r.value} value={r.value}>{r.value} ({r.nsqf})</option>)}
            </select>
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>▾</div>
          </div>
          {errors.targetJobRole && <p style={{ marginTop: 5, fontSize: 12, color: '#ef4444' }}>{errors.targetJobRole}</p>}
        </div>

        {/* Timeline */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>
            Timeline <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={formData.timeline}
              onChange={e => { setFormData({ ...formData, timeline: e.target.value }); setErrors({ ...errors, timeline: '' }); }}
              disabled={isSubmitting}
              style={inputStyle(errors.timeline)}
            >
              <option value="">Select timeline</option>
              {timelines.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>▾</div>
          </div>
          {errors.timeline && <p style={{ marginTop: 5, fontSize: 12, color: '#ef4444' }}>{errors.timeline}</p>}
        </div>

        {/* Salary Slider */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>
            Salary Expectation: <span style={{ color: '#2B7A78', fontWeight: 800 }}>₹{(formData.salaryExpectation / 100000).toFixed(1)}L</span>
          </label>
          <input
            type="range" min="200000" max="1500000" step="50000"
            value={formData.salaryExpectation}
            onChange={e => setFormData({ ...formData, salaryExpectation: parseInt(e.target.value) })}
            disabled={isSubmitting}
            style={{ width: '100%', accentColor: '#2B7A78', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
            <span>₹2L</span><span>₹8L</span><span>₹15L</span>
          </div>
        </div>

        {/* Job Type */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
            Job Type <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {jobTypes.map(t => (
              <button key={t.value} type="button" disabled={isSubmitting}
                onClick={() => { setFormData({ ...formData, jobType: t.value }); setErrors({ ...errors, jobType: '' }); }}
                style={{
                  padding: '14px 8px', borderRadius: 12, border: `2px solid ${formData.jobType === t.value ? '#2B7A78' : '#e5e7eb'}`,
                  background: formData.jobType === t.value ? 'rgba(43,122,120,.06)' : '#fff',
                  cursor: 'pointer', transition: 'all .2s', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 5 }}>{t.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: formData.jobType === t.value ? '#2B7A78' : '#374151' }}>{t.value}</div>
              </button>
            ))}
          </div>
          {errors.jobType && <p style={{ marginTop: 5, fontSize: 12, color: '#ef4444' }}>{errors.jobType}</p>}
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={isSubmitting} style={{
          width: '100%', padding: '14px', background: isSubmitting ? '#9ca3af' : '#2B7A78',
          color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 12, border: 'none',
          cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'background .2s', marginTop: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          {isSubmitting ? 'Saving...' : 'Continue to Assessment Overview →'}
        </button>
      </div>
    </div>
  );
}

// ─── STEP 2: ASSESSMENT START ─────────────────────────────────────────────────
function AssessmentStartStep({ careerGoal, onNext, onBack }) {
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState(null);

  const [attempt, setAttempt] = useState(1);
  const [countdown, setCountdown] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAssessment(1); }, []);

  const fetchAssessment = async (attemptNum) => {
    const learnerId = localStorage.getItem('learner_id');
    if (!learnerId) { setError('Please complete your profile first'); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetch(`${BACKEND_URL}/assessment/start/${learnerId}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('Failed to load assessment');
      const data = await res.json();
      setQuizData(data);
    } catch (err) {
      if (attemptNum < 3) {
        setAttempt(attemptNum + 1);
        let secs = 15;
        setCountdown(secs);
        const interval = setInterval(() => {
          secs--;
          if (secs <= 0) { clearInterval(interval); setCountdown(null); fetchAssessment(attemptNum + 1); }
          else setCountdown(secs);
        }, 1000);
      } else {
        setError('Server is taking too long. Please click Try Again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 16, animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
      <h3 style={{ color: '#374151', margin: 0 }}>Preparing your assessment...</h3>
      <p style={{ color: '#9ca3af', marginTop: 8 }}>The server may take up to 60s to wake up (free tier)</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (countdown !== null) return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔄</div>
      <h3 style={{ color: '#374151', margin: 0 }}>Server is waking up...</h3>
      <p style={{ color: '#9ca3af', marginTop: 8 }}>Attempt {attempt} of 3 — retrying in {countdown}s</p>
      <div style={{ marginTop: 16, height: 6, background: '#e5e7eb', borderRadius: 99, maxWidth: 200, margin: '16px auto 0' }}>
        <div style={{ height: '100%', width: `${(countdown / 15) * 100}%`, background: '#2B7A78', borderRadius: 99, transition: 'width 1s' }} />
      </div>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
      <h3 style={{ color: '#374151' }}>Error Loading Assessment</h3>
      <p style={{ color: '#ef4444' }}>{error}</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '10px 24px', background: '#2B7A78', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
        Try Again
      </button>
    </div>
  );

  if (!quizData) return null;

  const handleStart = () => {
    localStorage.setItem('assessment_start_time', Date.now().toString());
    onNext(quizData);
  };

  const cardStyle = { background: '#f9fafb', borderRadius: 14, padding: '20px 24px', marginBottom: 14 };
  const badgeStyle = { display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'rgba(43,122,120,.12)', color: '#2B7A78' };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🧠</div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111' }}>Skill Assessment</h2>
        <p style={{ color: '#6b7280', marginTop: 6, fontSize: 15 }}>Personalized evaluation based on your target role</p>
      </div>

      {/* Learner Info */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#374151' }}>Welcome, {quizData.learner?.name} 👋</h3>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div><span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>EMAIL </span><br/><span style={{ fontSize: 14, color: '#374151' }}>{quizData.learner?.email}</span></div>
          <div><span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>TARGET ROLE </span><br/><span style={{ fontSize: 14, color: '#374151' }}>{quizData.domain_name}</span></div>
        </div>
      </div>

      {/* Assessment Details */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#374151' }}>📋 Assessment Details</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>❓</span>
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>TOTAL QUESTIONS</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{quizData.total_questions}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🎯</span>
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>DOMAIN</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{quizData.domain_name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Tested */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#374151' }}>🧠 Skills Being Tested</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(quizData.skills_tested || []).map((skill, idx) => (
            <span key={idx} style={badgeStyle}>{skill}</span>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div style={{ ...cardStyle, background: 'rgba(43,122,120,.05)', border: '1.5px solid rgba(43,122,120,.15)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: '#2B7A78' }}>📌 Instructions</h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#374151', fontSize: 14, lineHeight: 1.8 }}>
          <li>Answer all questions carefully</li>
          <li>Each question has only one correct answer</li>
          <li>Results will show skill gaps and recommendations</li>
        </ul>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button onClick={onBack} style={{ padding: '13px 20px', borderRadius: 12, border: '2px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          ← Back
        </button>
        <button onClick={handleStart} style={{ flex: 1, padding: '14px', background: '#2B7A78', color: '#fff', fontWeight: 700, fontSize: 16, borderRadius: 12, border: 'none', cursor: 'pointer' }}>
          🚀 Start Assessment
        </button>
      </div>
    </div>
  );
}

// ─── STEP 3: QUIZ ─────────────────────────────────────────────────────────────
function QuizStep({ quizData, onBack }) {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const question = quizData.questions[currentQuestion];
  const questionId = question.q_id;
  const answeredCount = Object.keys(answers).length;
  const progress = ((currentQuestion + 1) / quizData.total_questions) * 100;

  const optionMap = { A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (answeredCount === 0) { alert('Please answer at least one question'); return; }
    setIsSubmitting(true);
    const learnerId = localStorage.getItem('learner_id');
    const startTime = parseInt(localStorage.getItem('assessment_start_time'));
    const timeTaken = isNaN(startTime) ? 0 : Math.floor((Date.now() - startTime) / 1000);
    try {
      const res = await fetch(`${BACKEND_URL}/assess/${quizData.domain}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learner_id: learnerId, time_taken_seconds: timeTaken, answers })
      });
      if (!res.ok) throw new Error('Submit failed');
      const result = await res.json();
      navigate('/assessment/results', { state: { result } });
    } catch (err) {
      alert('Submission failed: ' + err.message);
      setIsSubmitting(false);
    }
  };

  const diffColors = { Easy: { bg: '#dcfce7', color: '#166534' }, Medium: { bg: '#fef9c3', color: '#854d0e' }, Hard: { bg: '#fee2e2', color: '#991b1b' } };
  const diff = diffColors[question.difficulty] || diffColors.Medium;

  return (
    <div>
      {/* Quiz Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111' }}>📝 {quizData.domain_name}</h2>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>Question {currentQuestion + 1} of {quizData.total_questions}</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#2B7A78', background: 'rgba(43,122,120,.1)', padding: '5px 12px', borderRadius: 20 }}>
          {answeredCount}/{quizData.total_questions} answered
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 6, background: '#e5e7eb', borderRadius: 99, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #2B7A78, #3aafa9)', borderRadius: 99, transition: 'width .3s' }} />
      </div>

      {/* Question Card */}
      <div style={{ background: '#fff', border: '2px solid #f3f4f6', borderRadius: 16, padding: '22px 22px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', letterSpacing: 1 }}>Q {currentQuestion + 1}</span>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: diff.bg, color: diff.color }}>{question.difficulty}</span>
        </div>
        <p style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 600, color: '#111', lineHeight: 1.6 }}>{question.question_text}</p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {['A', 'B', 'C', 'D'].map(opt => {
            const isSelected = answers[questionId] === opt;
            return (
              <label key={opt} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, cursor: 'pointer',
                border: `2px solid ${isSelected ? '#2B7A78' : '#e5e7eb'}`,
                background: isSelected ? 'rgba(43,122,120,.06)' : '#fff', transition: 'all .15s'
              }}>
                <input type="radio" checked={isSelected} onChange={() => setAnswers(prev => ({ ...prev, [questionId]: opt }))} style={{ display: 'none' }} />
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13, border: `2px solid ${isSelected ? '#2B7A78' : '#d1d5db'}`,
                  background: isSelected ? '#2B7A78' : '#fff', color: isSelected ? '#fff' : '#6b7280', transition: 'all .15s'
                }}>{opt}</div>
                <span style={{ fontSize: 14, color: '#374151', fontWeight: isSelected ? 600 : 400 }}>{optionMap[opt]}</span>
              </label>
            );
          })}
        </div>

        <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f3f4f6', padding: '5px 12px', borderRadius: 20 }}>
          <span style={{ fontSize: 12 }}>📚</span>
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{question.skill_name}</span>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button onClick={() => setCurrentQuestion(p => p - 1)} disabled={currentQuestion === 0}
          style={{ padding: '11px 20px', borderRadius: 10, border: '2px solid #e5e7eb', background: '#fff', color: currentQuestion === 0 ? '#d1d5db' : '#374151', fontWeight: 600, cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer', fontSize: 14 }}>
          ← Previous
        </button>
        {currentQuestion < quizData.total_questions - 1 ? (
          <button onClick={() => setCurrentQuestion(p => p + 1)}
            style={{ padding: '11px 24px', borderRadius: 10, background: '#2B7A78', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 14 }}>
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={isSubmitting}
            style={{ padding: '12px 24px', borderRadius: 10, background: isSubmitting ? '#9ca3af' : '#059669', color: '#fff', fontWeight: 700, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: 14 }}>
            {isSubmitting ? 'Submitting...' : '✅ Submit Assessment'}
          </button>
        )}
      </div>

      {/* Question Navigator Grid */}
      <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#9ca3af', letterSpacing: 1 }}>QUESTION NAVIGATOR</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {quizData.questions.map((q, idx) => {
            const isAnswered = !!answers[q.q_id];
            const isCurrent = idx === currentQuestion;
            return (
              <button key={q.q_id} onClick={() => setCurrentQuestion(idx)} style={{
                width: 34, height: 34, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
                background: isCurrent ? '#2B7A78' : isAnswered ? '#dcfce7' : '#e5e7eb',
                color: isCurrent ? '#fff' : isAnswered ? '#166534' : '#6b7280',
                outline: isCurrent ? '2px solid #2B7A78' : 'none', outlineOffset: 2,
              }}>
                {idx + 1}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
          {[['#2B7A78', '#fff', 'Current'], ['#dcfce7', '#166534', 'Answered'], ['#e5e7eb', '#6b7280', 'Not answered']].map(([bg, color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: `1px solid ${color}` }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMBINED FLOW ───────────────────────────────────────────────────────
export default function AssessmentFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEP_CAREER_GOAL);
  const [userId, setUserId] = useState(null);
  const [careerGoal, setCareerGoal] = useState(null);
  const [quizData, setQuizData] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Fetch the learners table id (different from auth user.id)
        const { data: learnerRow } = await supabase
          .from('learners')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (learnerRow?.id) {
          localStorage.setItem('learner_id', learnerRow.id);
        } else {
          localStorage.setItem('learner_id', user.id); // fallback
        }
      } else {
        alert('Please complete registration first');
        navigate('/register');
      }
    })();
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fafa 0%, #f8fafc 60%, #e8f5f5 100%)', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #2B7A78, #3aafa9)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <SparklesIcon />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>SkillPath AI</span>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate('/'); }}
            style={{ background: 'none', border: 'none', color: '#2B7A78', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            Sign Out →
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px' }}>
        <StepIndicator currentStep={step} />

        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,.06)', padding: '36px 36px 32px' }}>
          {step === STEP_CAREER_GOAL && (
            <CareerGoalStep
              userId={userId}
              onNext={(goal) => { setCareerGoal(goal); setStep(STEP_ASSESSMENT_START); }}
            />
          )}
          {step === STEP_ASSESSMENT_START && (
            <AssessmentStartStep
              careerGoal={careerGoal}
              onNext={(quiz) => { setQuizData(quiz); setStep(STEP_QUIZ); }}
              onBack={() => setStep(STEP_CAREER_GOAL)}
            />
          )}
          {step === STEP_QUIZ && quizData && (
            <QuizStep quizData={quizData} onBack={() => setStep(STEP_ASSESSMENT_START)} />
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 28 }}>
          © 2026 SkillPath AI Learning Systems. All rights reserved.
        </p>
      </div>
    </div>
  );
}
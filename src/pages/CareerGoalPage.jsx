import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Target, Loader2 } from 'lucide-react';
import supabase from '../supabaseClient';


export default function CareerGoalPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    targetJobRole: '',
    timeline: '',
    salaryExpectation: 500000, // ₹5L default
    jobType: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);


  const jobRoles = [
    { value: 'Software Development Engineer', nsqf: 'NSQF 4-7', skillsNeeded: 5 },
    { value: 'Data Analyst', nsqf: 'NSQF 5-6', skillsNeeded: 5 },
    { value: 'AI Engineer', nsqf: 'NSQF 5', skillsNeeded: 5 },
    { value: 'Backend Developer', nsqf: 'NSQF 4-5', skillsNeeded: 7 },
    { value: 'Frontend Developer', nsqf: 'NSQF 4-5', skillsNeeded: 8 },
    { value: 'Full Stack Developer', nsqf: 'NSQF 4.5/5', skillsNeeded: 10 },
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

  // Get current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadExistingData(user.id);
      } else {
        alert('Please complete registration first');
        navigate('/register');
      }
    };
    getCurrentUser();
  }, [navigate]);

  // Load existing data
  const loadExistingData = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('learners')
        .select('current_skills, target_job_role, timeline_months, salary_expectation, job_type')
        .eq('user_id', uid)
        .maybeSingle();

      if (data && !error) {
        setFormData({
          targetJobRole: data.target_job_role || '',
          timeline: data.timeline_months?.toString() || '',
          salaryExpectation: data.salary_expectation || 500000,
          jobType: data.job_type || ''
        });
      }
    } catch (err) {
      console.error('Error loading career goal data:', err);
    }
  };

  const handleSubmit = async () => {
    const newErrors = {};

    if (!formData.targetJobRole) {
      newErrors.targetJobRole = 'Please select a target job role';
    }
    if (!formData.timeline) {
      newErrors.timeline = 'Please select a timeline';
    }
    if (!formData.jobType) {
      newErrors.jobType = 'Please select a job type';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!userId) {
      alert('User session not found. Please register again.');
      navigate('/register');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update learners table with career goals
      const { error } = await supabase
        .from('learners')
        .update({
          target_job_role: formData.targetJobRole,
          timeline_months: parseInt(formData.timeline),
          salary_expectation: formData.salaryExpectation,
          job_type: formData.jobType,
          onboarding_completed: true,
          onboarding_step: 5, // All steps completed
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Save to session storage as backup
      sessionStorage.setItem('careerGoal', JSON.stringify(formData));
      
      // Navigate to assessment page
      navigate('/assessment');
      
    } catch (error) {
      console.error('Error saving career goals:', error);
      alert(`Failed to save: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#2B7A78] to-[#3aafa9] rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">SkillPath AI</span>
          </div>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/');
            }}
            className="text-[#2B7A78] hover:text-[#1f5a58] font-medium"
          >
            Sign Out →
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Card */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#2B7A78]/10 p-3 rounded-lg">
              <Target className="w-6 h-6 text-[#2B7A78]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              What's your career target?
            </h1>
          </div>
          <p className="text-gray-600 mb-8">
            Define your career goals and see live insights about job market, salary trends, and success probability.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Target Job Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Target Job Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.targetJobRole}
                  onChange={(e) => {
                    setFormData({ ...formData, targetJobRole: e.target.value });
                    if (errors.targetJobRole) {
                      setErrors({ ...errors, targetJobRole: '' });
                    }
                  }}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.targetJobRole
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-[#2B7A78] focus:ring-[#2B7A78]/20'
                  }`}
                >
                  <option value="">Select target job role</option>
                  {jobRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.value} ({role.nsqf})
                    </option>
                  ))}
                </select>
                {errors.targetJobRole && (
                  <p className="mt-2 text-sm text-red-600">{errors.targetJobRole}</p>
                )}
              </div>

              {/* Timeline */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Timeline <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.timeline}
                  onChange={(e) => {
                    setFormData({ ...formData, timeline: e.target.value });
                    if (errors.timeline) {
                      setErrors({ ...errors, timeline: '' });
                    }
                  }}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.timeline
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-[#2B7A78] focus:ring-[#2B7A78]/20'
                  }`}
                >
                  <option value="">Select timeline</option>
                  {timelines.map((timeline) => (
                    <option key={timeline.value} value={timeline.value}>
                      {timeline.label}
                    </option>
                  ))}
                </select>
                {errors.timeline && (
                  <p className="mt-2 text-sm text-red-600">{errors.timeline}</p>
                )}
              </div>

              {/* Salary Expectation Slider */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Salary Expectation: <span className="text-[#2B7A78] font-bold">₹{(formData.salaryExpectation / 100000).toFixed(1)}L</span>
                </label>
                <div className="relative pt-2">
                  <input
                    type="range"
                    min="200000"
                    max="1500000"
                    step="50000"
                    value={formData.salaryExpectation}
                    onChange={(e) => setFormData({ ...formData, salaryExpectation: parseInt(e.target.value) })}
                    disabled={isSubmitting}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                    style={{
                      background: `linear-gradient(to right, #2B7A78 0%, #2B7A78 ${((formData.salaryExpectation - 200000) / 1300000) * 100}%, #e5e7eb ${((formData.salaryExpectation - 200000) / 1300000) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>₹2L</span>
                    <span>₹8L</span>
                    <span>₹15L</span>
                  </div>
                </div>
              </div>

              {/* Job Type Radio Buttons */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Job Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {jobTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, jobType: type.value });
                        if (errors.jobType) {
                          setErrors({ ...errors, jobType: '' });
                        }
                      }}
                      disabled={isSubmitting}
                      className={`p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        formData.jobType === type.value
                          ? 'border-[#2B7A78] bg-[#2B7A78]/5 shadow-md'
                          : 'border-gray-200 hover:border-[#2B7A78]/50 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <p className={`font-semibold text-sm ${
                        formData.jobType === type.value ? 'text-[#2B7A78]' : 'text-gray-700'
                      }`}>
                        {type.value}
                      </p>
                    </button>
                  ))}
                </div>
                {errors.jobType && (
                  <p className="mt-2 text-sm text-red-600">{errors.jobType}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-[#2B7A78] hover:bg-[#1f5a58] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-[#2B7A78]/20 hover:shadow-xl hover:shadow-[#2B7A78]/30 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Start Assessment →'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-gray-500 mt-8">
          © 2026 SkillPath AI Learning Systems. All rights reserved.
        </p>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Clock, BookOpen, Video, FileText, Code, Layers, Globe, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://uchrywxwbllkpwgcqeje.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjaHJ5d3h3Ymxsa3B3Z2NxZWplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwODk2NDcsImV4cCI6MjA4NDY2NTY0N30.8IH6FSB6aMQhF7o7HG9yPwNoiagg0askPaBZsdA7QeM'
);

export default function ProfilePreferencesPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    hoursPerWeek: 10,
    learningStyle: '',
    preferredLanguage: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);

  const learningStyles = [
    { value: 'Video', icon: <Video className="w-5 h-5" />, label: 'Video Tutorials' },
    { value: 'Text', icon: <FileText className="w-5 h-5" />, label: 'Text & Articles' },
    { value: 'Projects', icon: <Code className="w-5 h-5" />, label: 'Hands-on Projects' },
    { value: 'Mixed', icon: <Layers className="w-5 h-5" />, label: 'Mixed Approach' }
  ];

  const languages = [
    'English',
    'Hindi',
    'Kannada',
    'Tamil',
    'Telugu'
  ];

  // Get current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Load existing data if any
        loadExistingData(user.id);
      } else {
        // No user logged in, redirect to registration
        alert('Please complete registration first');
        navigate('/register');
      }
    };
    getCurrentUser();
  }, [navigate]);

  // Load existing profile data if available
  const loadExistingData = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('learners')
        .select('hours_per_week, learning_style, preferred_language')
        .eq('user_id', uid)
        .single();

      if (data && !error) {
        setFormData({
          hoursPerWeek: data.hours_per_week || 10,
          learningStyle: data.learning_style || '',
          preferredLanguage: data.preferred_language || ''
        });
      }
    } catch (err) {
      console.error('Error loading preferences data:', err);
    }
  };

  const handleBack = () => {
    // Save current data to session storage as backup
    sessionStorage.setItem('profilePreferences', JSON.stringify(formData));
    // Navigate back using React Router
    navigate('/profile/personal');
  };

  const handleNext = async () => {
    const newErrors = {};

    if (!formData.learningStyle) {
      newErrors.learningStyle = 'Please select a learning style';
    }
    if (!formData.preferredLanguage) {
      newErrors.preferredLanguage = 'Please select your preferred language';
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
      // Update learners table with preferences
      const { error } = await supabase
        .from('learners')
        .update({
          hours_per_week: formData.hoursPerWeek,
          learning_style: formData.learningStyle,
          preferred_language: formData.preferredLanguage,
          onboarding_step: 3, // Update onboarding progress
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Save to session storage as backup
      sessionStorage.setItem('profilePreferences', JSON.stringify(formData));
      
      // Get previous data for logging
      const personalInfo = JSON.parse(sessionStorage.getItem('profilePersonal') || '{}');
      console.log('Complete profile so far:', { ...personalInfo, ...formData });
      
      // Success message and navigate to next page
      alert('Profile preferences saved successfully!');
      navigate('/profile/skills'); // Uncomment when skills page is ready
      
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert(`Failed to save preferences: ${error.message}`);
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#2B7A78] font-semibold uppercase tracking-wide">
              Profile Setup
            </span>
            <span className="text-sm text-gray-500 font-medium">67% Complete</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-[#2B7A78] rounded-full transition-all duration-500"></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Step 2 of 3</p>
          <p className="text-[#2B7A78] font-medium mt-1">Learning Preferences</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#2B7A78]/10 p-3 rounded-lg">
              <BookOpen className="w-6 h-6 text-[#2B7A78]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              How do you prefer to learn?
            </h1>
          </div>
          <p className="text-gray-600 mb-8">
            Customize your learning experience to match your style and schedule.
          </p>

          <div className="space-y-8">
            {/* Hours per Week Slider */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#2B7A78]" />
                  <span>Hours per Week: <span className="text-[#2B7A78] font-bold">{formData.hoursPerWeek} hours</span></span>
                </div>
              </label>
              <div className="relative pt-2">
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={formData.hoursPerWeek}
                  onChange={(e) => setFormData({ ...formData, hoursPerWeek: parseInt(e.target.value) })}
                  disabled={isSubmitting}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  style={{
                    background: `linear-gradient(to right, #2B7A78 0%, #2B7A78 ${((formData.hoursPerWeek - 5) / 20) * 100}%, #e5e7eb ${((formData.hoursPerWeek - 5) / 20) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>5 hrs</span>
                  <span>15 hrs</span>
                  <span>25 hrs</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                💡 Recommended: 10-15 hours per week for optimal progress
              </p>
            </div>

            {/* Learning Style Radio Buttons */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Learning Style <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {learningStyles.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, learningStyle: style.value });
                      if (errors.learningStyle) {
                        setErrors({ ...errors, learningStyle: '' });
                      }
                    }}
                    disabled={isSubmitting}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      formData.learningStyle === style.value
                        ? 'border-[#2B7A78] bg-[#2B7A78]/5 shadow-md'
                        : 'border-gray-200 hover:border-[#2B7A78]/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`flex-shrink-0 p-2 rounded-lg ${
                      formData.learningStyle === style.value
                        ? 'bg-[#2B7A78] text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {style.icon}
                    </div>
                    <div className="text-left">
                      <p className={`font-semibold ${
                        formData.learningStyle === style.value
                          ? 'text-[#2B7A78]'
                          : 'text-gray-900'
                      }`}>
                        {style.label}
                      </p>
                    </div>
                    {formData.learningStyle === style.value && (
                      <div className="ml-auto">
                        <div className="w-6 h-6 bg-[#2B7A78] rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {errors.learningStyle && (
                <p className="mt-2 text-sm text-red-600">{errors.learningStyle}</p>
              )}
            </div>

            {/* Preferred Language Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Preferred Language <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <select
                  value={formData.preferredLanguage}
                  onChange={(e) => {
                    setFormData({ ...formData, preferredLanguage: e.target.value });
                    if (errors.preferredLanguage) {
                      setErrors({ ...errors, preferredLanguage: '' });
                    }
                  }}
                  disabled={isSubmitting}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.preferredLanguage
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-[#2B7A78] focus:ring-[#2B7A78]/20'
                  }`}
                >
                  <option value="">Select your preferred language</option>
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
              {errors.preferredLanguage && (
                <p className="mt-2 text-sm text-red-600">{errors.preferredLanguage}</p>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex-1 bg-white border-2 border-gray-300 hover:border-[#2B7A78] text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex-1 bg-[#2B7A78] hover:bg-[#1f5a58] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-[#2B7A78]/20 hover:shadow-xl hover:shadow-[#2B7A78]/30 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Next: Current Skills →'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-gray-500 mt-8">
          © 2024 SkillPath AI Learning Systems. All rights reserved.
        </p>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, User, MapPin, GraduationCap, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://uchrywxwbllkpwgcqeje.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjaHJ5d3h3Ymxsa3B3Z2NxZWplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwODk2NDcsImV4cCI6MjA4NDY2NTY0N30.8IH6FSB6aMQhF7o7HG9yPwNoiagg0askPaBZsdA7QeM'
);

export default function ProfilePersonalPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    age: 25,
    location: '',
    educationLevel: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);

  const locations = [
    'Bangalore',
    'Pune',
    'Mumbai',
    'Delhi',
    'Hyderabad',
    'Chennai'
  ];

  const educationLevels = [
    '10th',
    '12th',
    'Diploma',
    'Graduate',
    'Post-Graduate'
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
        alert('Please register first');
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
        .select('full_name, age, location, education_level')
        .eq('user_id', uid)
        .single();

      if (data && !error) {
        setFormData({
          fullName: data.full_name || '',
          age: data.age || 25,
          location: data.location || '',
          educationLevel: data.education_level || ''
        });
      }
    } catch (err) {
      console.error('Error loading profile data:', err);
    }
  };

  const handleNext = async () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.location) {
      newErrors.location = 'Please select a location';
    }
    if (!formData.educationLevel) {
      newErrors.educationLevel = 'Please select your education level';
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
      // Update learners table with personal information
      const { error } = await supabase
        .from('learners')
        .update({
          full_name: formData.fullName.trim(),
          age: formData.age,
          location: formData.location,
          education_level: formData.educationLevel,
          onboarding_step: 2, // Update onboarding progress
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Save to session storage as backup
      sessionStorage.setItem('profilePersonal', JSON.stringify(formData));
      
      // Navigate to next page
      navigate('/profile/preferences');
      
    } catch (error) {
      console.error('Error saving personal info:', error);
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#2B7A78] font-semibold uppercase tracking-wide">
              Profile Setup
            </span>
            <span className="text-sm text-gray-500 font-medium">50% Complete</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-[#2B7A78] rounded-full transition-all duration-500"></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Step 1 of 3</p>
          <p className="text-[#2B7A78] font-medium mt-1">Personal Information</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#2B7A78]/10 p-3 rounded-lg">
              <User className="w-6 h-6 text-[#2B7A78]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tell us about yourself
            </h1>
          </div>
          <p className="text-gray-600 mb-8">
            Help us personalize your learning journey with some basic information.
          </p>

          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (errors.fullName) {
                      setErrors({ ...errors, fullName: '' });
                    }
                  }}
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.fullName
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-[#2B7A78] focus:ring-[#2B7A78]/20'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Age Slider */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Age: <span className="text-[#2B7A78] font-bold">{formData.age} years</span>
              </label>
              <div className="relative pt-2">
                <input
                  type="range"
                  min="18"
                  max="35"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  disabled={isSubmitting}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  style={{
                    background: `linear-gradient(to right, #2B7A78 0%, #2B7A78 ${((formData.age - 18) / 17) * 100}%, #e5e7eb ${((formData.age - 18) / 17) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>18</span>
                  <span>35</span>
                </div>
              </div>
            </div>

            {/* Location Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <select
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                    if (errors.location) {
                      setErrors({ ...errors, location: '' });
                    }
                  }}
                  disabled={isSubmitting}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.location
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-[#2B7A78] focus:ring-[#2B7A78]/20'
                  }`}
                >
                  <option value="">Select your location</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
              {errors.location && (
                <p className="mt-2 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Education Level Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Education Level <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <select
                  value={formData.educationLevel}
                  onChange={(e) => {
                    setFormData({ ...formData, educationLevel: e.target.value });
                    if (errors.educationLevel) {
                      setErrors({ ...errors, educationLevel: '' });
                    }
                  }}
                  disabled={isSubmitting}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.educationLevel
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-[#2B7A78] focus:ring-[#2B7A78]/20'
                  }`}
                >
                  <option value="">Select your education level</option>
                  {educationLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              {errors.educationLevel && (
                <p className="mt-2 text-sm text-red-600">{errors.educationLevel}</p>
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="w-full bg-[#2B7A78] hover:bg-[#1f5a58] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-[#2B7A78]/20 hover:shadow-xl hover:shadow-[#2B7A78]/30 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Next: Learning Preferences →'
              )}
            </button>
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
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Award, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://uchrywxwbllkpwgcqeje.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjaHJ5d3h3Ymxsa3B3Z2NxZWplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwODk2NDcsImV4cCI6MjA4NDY2NTY0N30.8IH6FSB6aMQhF7o7HG9yPwNoiagg0askPaBZsdA7QeM'
);

export default function ProfileSkillsPage() {
  const navigate = useNavigate();
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [noSkills, setNoSkills] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);

  const skillCategories = [
    {
      category: 'Office Skills',
      skills: ['Excel Basic', 'Excel Advanced', 'Google Sheets', 'PowerPoint', 'Word Processing']
    },
    {
      category: 'Programming',
      skills: ['Python', 'SQL', 'JavaScript', 'Java', 'C++']
    },
    {
      category: 'Data Skills',
      skills: ['Data Analysis', 'Data Visualization', 'Statistics', 'Power BI', 'Tableau']
    },
    {
      category: 'Other Skills',
      skills: ['Communication', 'Project Management', 'Problem Solving', 'Critical Thinking', 'Time Management']
    }
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

  // Load existing skills data if available
  const loadExistingData = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('learners')
        .select('current_skills')
        .eq('user_id', uid)
        .single();

      if (data && !error && data.current_skills) {
        const skills = Array.isArray(data.current_skills) ? data.current_skills : [];
        setSelectedSkills(skills);
        setNoSkills(skills.length === 0 || skills.includes('No skills yet'));
      }
    } catch (err) {
      console.error('Error loading skills data:', err);
    }
  };

  const handleSkillToggle = (skill) => {
    if (noSkills) return; // Don't allow skill selection if "No skills yet" is checked

    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else {
        return [...prev, skill];
      }
    });
  };

  const handleNoSkillsToggle = () => {
    setNoSkills(!noSkills);
    if (!noSkills) {
      setSelectedSkills([]);
    }
  };

  const handleBack = () => {
    navigate('/profile/preferences');
  };

  const handleNext = async () => {
    if (!userId) {
      alert('User session not found. Please register again.');
      navigate('/register');
      return;
    }

    setIsSubmitting(true);

    try {
      const skillsToSave = noSkills ? ['No skills yet'] : selectedSkills;

      // Update learners table with current skills
      const { error } = await supabase
        .from('learners')
        .update({
          current_skills: skillsToSave,
          onboarding_step: 4, // Update onboarding progress
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Save to session storage as backup
      sessionStorage.setItem('profileSkills', JSON.stringify({ skills: skillsToSave }));
      
      // Navigate to career goal page
      navigate('/career-goal');
      
    } catch (error) {
      console.error('Error saving skills:', error);
      alert(`Failed to save skills: ${error.message}`);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#2B7A78] font-semibold uppercase tracking-wide">
              Profile Setup
            </span>
            <span className="text-sm text-gray-500 font-medium">83% Complete</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-5/6 bg-[#2B7A78] rounded-full transition-all duration-500"></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Step 3 of 3</p>
          <p className="text-[#2B7A78] font-medium mt-1">Current Skills</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#2B7A78]/10 p-3 rounded-lg">
              <Award className="w-6 h-6 text-[#2B7A78]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              What skills do you already have?
            </h1>
          </div>
          <p className="text-gray-600 mb-8">
            Select all the skills you're comfortable with. This helps us create your personalized learning path.
          </p>

          <div className="space-y-8">
            {/* No Skills Checkbox */}
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={noSkills}
                  onChange={handleNoSkillsToggle}
                  disabled={isSubmitting}
                  className="w-5 h-5 text-[#2B7A78] border-gray-300 rounded focus:ring-[#2B7A78] disabled:opacity-50"
                />
                <span className="ml-3 text-base font-semibold text-gray-700">
                  I don't have any of these skills yet (Starting fresh)
                </span>
              </label>
            </div>

            {/* Skills by Category */}
            {skillCategories.map((category, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-[#2B7A78] rounded-full"></div>
                  {category.category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {category.skills.map((skill) => (
                    <label
                      key={skill}
                      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        noSkills
                          ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                          : selectedSkills.includes(skill)
                          ? 'border-[#2B7A78] bg-[#2B7A78]/5'
                          : 'border-gray-200 hover:border-[#2B7A78]/50 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill)}
                        onChange={() => handleSkillToggle(skill)}
                        disabled={noSkills || isSubmitting}
                        className="w-5 h-5 text-[#2B7A78] border-gray-300 rounded focus:ring-[#2B7A78] disabled:opacity-50"
                      />
                      <span className={`ml-3 font-medium ${
                        selectedSkills.includes(skill) ? 'text-[#2B7A78]' : 'text-gray-700'
                      }`}>
                        {skill}
                      </span>
                      {selectedSkills.includes(skill) && (
                        <CheckCircle2 className="w-5 h-5 text-[#2B7A78] ml-auto" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {/* Skills Count */}
            {!noSkills && selectedSkills.length > 0 && (
              <div className="bg-[#2B7A78]/10 rounded-xl p-4 border-2 border-[#2B7A78]/20">
                <p className="text-[#2B7A78] font-semibold text-center">
                  ✓ {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}

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
                  'Next: Career Goals →'
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
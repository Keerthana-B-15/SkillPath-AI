import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';


export default function SignInPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.toLowerCase(),
        password: formData.password,
      });

      if (authError) throw authError;

      const user = authData.user;

      // 2. Get learner profile
      const { data: ld } = await supabase
        .from('learners')
        .select('id, onboarding_completed, onboarding_step')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!ld) {
        // No learner profile — send to registration
        navigate('/register');
        return;
      }

      // 3. Check if learning path already exists
      const { data: path } = await supabase
        .from('learning_paths')
        .select('id')
        .eq('learner_id', ld.id)
        .limit(1)
        .maybeSingle();

      if (path) {
        // Has a learning path → go straight to roadmap
        navigate('/learning-path');
        return;
      }

      // 4. Check if assessment was completed
      const { data: assessment } = await supabase
        .from('assessment_results')
        .select('id')
        .eq('learner_id', ld.id)
        .limit(1)
        .maybeSingle();

      if (assessment) {
        // Has assessment but no path yet → generate path
        navigate('/learning-path');
        return;
      }

      // 5. Check onboarding completion
      if (!ld.onboarding_completed) {
        navigate('/assessment');
        return;
      }

      // 6. Fallback → dashboard
      navigate('/dashboard');

    } catch (err) {
      console.error('Sign in error:', err);
      if (err.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Please try again.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Please verify your email before signing in.');
      } else {
        setError(err.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
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
            onClick={() => navigate('/register')}
            className="text-[#2B7A78] hover:text-[#1f5a58] font-medium"
          >
            Create Account →
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Main Card */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-8">

          {/* Logo accent */}
          <div className="w-14 h-14 bg-gradient-to-br from-[#2B7A78] to-[#3aafa9] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#2B7A78]/20">
            <Sparkles className="w-7 h-7 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600 mb-8">
            Sign in to continue your learning journey.
          </p>

          <div className="space-y-5">

            {/* Global error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="your.email@example.com"
                disabled={isSubmitting}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-[#2B7A78] focus:ring-[#2B7A78]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Password <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  className="text-xs text-[#2B7A78] hover:underline font-medium"
                  onClick={() => alert('Please contact support to reset your password.')}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-[#2B7A78] focus:ring-[#2B7A78]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-[#2B7A78] hover:bg-[#1f5a58] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-[#2B7A78]/20 hover:shadow-xl hover:shadow-[#2B7A78]/30 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Redirect to register */}
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-[#2B7A78] hover:underline font-medium"
              >
                Create one
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          © 2026 SkillPath AI Learning Systems. All rights reserved.
        </p>
      </div>
    </div>
  );
}
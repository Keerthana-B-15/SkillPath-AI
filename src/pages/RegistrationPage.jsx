import React, { useState } from 'react';
import { Eye, EyeOff, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';


export default function RegistrationPage() {
    const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false
  });

  const [emailStatus, setEmailStatus] = useState(''); // 'checking', 'available', 'taken'
  const [passwordStrength, setPasswordStrength] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check email availability in Supabase
const checkEmailAvailability = async (email) => {
  if (!email || !email.includes('@') || !email.includes('.')) {
    setEmailStatus('');
    return;
  }

  setEmailStatus('checking');

  try {
    const { data, error } = await supabase
      .from('learners')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      // Any error — just mark as available and move on
      setEmailStatus('available');
      return;
    }

    if (data) {
      setEmailStatus('taken');
    } else {
      setEmailStatus('available');
    }
  } catch (err) {
    console.error('Email check error:', err);
    setEmailStatus('available'); // Don't block user on error
  }
};

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    if (password.length < 8) return 'weak';
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, email: value });
    
    // Clear previous error
    if (errors.email) {
      setErrors({ ...errors, email: '' });
    }
    
    // Debounce email check
    clearTimeout(window.emailCheckTimeout);
    window.emailCheckTimeout = setTimeout(() => {
      checkEmailAvailability(value);
    }, 500);
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, password: value });
    setPasswordStrength(calculatePasswordStrength(value));
    
    if (errors.password) {
      setErrors({ ...errors, password: '' });
    }
  };

  const handleSubmit = async () => {
    const newErrors = {};
    
    // Validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    } else if (emailStatus !== 'available') {
      newErrors.email = 'Please use a valid, available email';
    }
    
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and privacy policy';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase(),
        password: formData.password,
        options: {
          data: {
            email_confirmed: false
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // 2. Insert user profile into learners table
      const { error: insertError } = await supabase
        .from('learners')
        .insert([
          {
            user_id: authData.user.id,
            email: formData.email.toLowerCase(),
            created_at: new Date().toISOString(),
            onboarding_completed: false,
            onboarding_step: 1 // Registration completed
          }
        ]);

      if (insertError) throw insertError;

      // Success!
       // Success!
        alert('Account created successfully! Redirecting to profile setup...');
        navigate('/profile/personal');
      
      // Navigate to Profile Setup Page 1
      // window.location.href = '/profile-setup';
      
    } catch (error) {
  console.error('Registration error:', error);
  
  if (error.message.includes('already registered') || 
      error.message.includes('User already registered')) {
    setErrors({ email: 'This email is already registered. Please use a different email or sign in.' });
  } else if (error.message.includes('foreign key constraint')) {
    setErrors({ email: 'Account setup incomplete. Please contact support or use a different email.' });
  } else {
    alert(`Registration failed: ${error.message}`);
  }
}
  };

  const getStrengthColor = () => {
    if (passwordStrength === 'weak') return 'bg-red-500';
    if (passwordStrength === 'medium') return 'bg-yellow-500';
    if (passwordStrength === 'strong') return 'bg-green-500';
    return 'bg-gray-300';
  };

  const getStrengthWidth = () => {
    if (passwordStrength === 'weak') return 'w-1/3';
    if (passwordStrength === 'medium') return 'w-2/3';
    if (passwordStrength === 'strong') return 'w-full';
    return 'w-0';
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
          <button className="text-[#2B7A78] hover:text-[#1f5a58] font-medium">
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
              Onboarding Flow
            </span>
            <span className="text-sm text-gray-500 font-medium">25% Complete</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-1/4 bg-[#2B7A78] rounded-full transition-all duration-500"></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Step 1 of 4</p>
          <p className="text-[#2B7A78] font-medium mt-1">Account Creation</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Account
          </h1>
          <p className="text-gray-600 mb-8">
            Join thousands of learners unlocking their career potential with AI-powered guidance.
          </p>

          <div className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  placeholder="your.email@example.com"
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : emailStatus === 'available'
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                      : emailStatus === 'taken'
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-[#2B7A78] focus:ring-[#2B7A78]/20'
                  }`}
                />
                {emailStatus === 'checking' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  </div>
                )}
                {emailStatus === 'available' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-green-600">
                    <Check className="w-5 h-5" />
                  </div>
                )}
                {emailStatus === 'taken' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-red-600">
                    <X className="w-5 h-5" />
                  </div>
                )}
              </div>
              {emailStatus === 'available' && (
                <p className="mt-2 text-sm text-green-600 flex items-center">
                  <Check className="w-4 h-4 mr-1" /> Email available
                </p>
              )}
              {emailStatus === 'taken' && (
                <p className="mt-2 text-sm text-red-600">Email already exists</p>
              )}
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handlePasswordChange}
                  placeholder="Create a strong password"
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:border-[#2B7A78] focus:ring-[#2B7A78]/20'
                  }`}
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
              
              {/* Password Strength Meter */}
              {formData.password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password Strength:</span>
                    <span className={`text-xs font-semibold ${
                      passwordStrength === 'weak' ? 'text-red-600' :
                      passwordStrength === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength.toUpperCase()}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${getStrengthWidth()} ${getStrengthColor()} transition-all duration-300`}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">At least 8 characters, mix of letters, numbers & symbols</p>
                </div>
              )}
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: '' });
                    }
                  }}
                  placeholder="Re-enter your password"
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.confirmPassword
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                      : 'border-gray-300 focus:border-[#2B7A78] focus:ring-[#2B7A78]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-2 text-sm text-green-600 flex items-center">
                  <Check className="w-4 h-4 mr-1" /> Passwords match
                </p>
              )}
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                checked={formData.agreedToTerms}
                onChange={(e) => {
                  setFormData({ ...formData, agreedToTerms: e.target.checked });
                  if (errors.terms) {
                    setErrors({ ...errors, terms: '' });
                  }
                }}
                disabled={isSubmitting}
                className="w-5 h-5 text-[#2B7A78] border-gray-300 rounded focus:ring-[#2B7A78] mt-0.5 disabled:opacity-50"
              />
              <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
                I agree to the{' '}
                <button type="button" className="text-[#2B7A78] hover:underline font-medium">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button type="button" className="text-[#2B7A78] hover:underline font-medium">
                  Privacy Policy
                </button>
                <span className="text-red-500 ml-1">*</span>
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-600 -mt-3">{errors.terms}</p>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || emailStatus === 'checking'}
              className="w-full bg-[#2B7A78] hover:bg-[#1f5a58] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-[#2B7A78]/20 hover:shadow-xl hover:shadow-[#2B7A78]/30 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-[#2B7A78] hover:underline font-medium">
                Sign In
              </button>
            </p>
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
// src/pages/LandingPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // ADD THIS LINE
import { ArrowRight, Users, TrendingUp, BookOpen, Globe } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate(); // ADD THIS LINE

  // ADD THIS FUNCTION
  const handleStartJourney = () => {
    navigate('/register');
  };

  const problemStats = [
    {
      icon: <Users className="w-8 h-8" />,
      stat: "50 crore Indian workers lack personalized guidance",
      color: "from-red-50 to-red-100"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      stat: "35% NSQF certified learners remain unemployed",
      color: "from-orange-50 to-orange-100"
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      stat: "90% struggle to choose right training pathway",
      color: "from-yellow-50 to-yellow-100"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      stat: "300M non-English speakers excluded from digital learning",
      color: "from-blue-50 to-blue-100"
    }
  ];

  const solutionBenefits = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "AI Skills Assessment",
      description: "Get your current skills assessed in just 25 minutes with our AI-powered evaluation system"
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Personalized Learning Path",
      description: "Receive a customized 15-skill roadmap tailored to your career goals and current proficiency"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Real-time Job Insights",
      description: "Access live job market data - 4,250 Data Analyst jobs in Bangalore with salary insights"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Success Prediction",
      description: "Get AI-powered job success probability predictions up to 87% accuracy"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-700 to-teal-900 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
              Unlock Your Career with<br />
              <span className="text-teal-200">AI-Powered Skill Paths</span>
            </h1>
            <p className="text-xl sm:text-2xl mb-12 text-teal-100 max-w-3xl mx-auto">
              Personalized learning roadmaps powered by AI to transform your career journey. 
              Get assessed, upskill strategically, and land your dream job.
            </p>
            <button
              onClick={handleStartJourney}
              className="inline-flex items-center gap-2 bg-white text-teal-800 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-teal-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              <span>🚀 Start My Journey</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      {/* Problem Statistics Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            The Challenge We're Solving
          </h2>
          <p className="text-xl text-gray-600">
            Millions face barriers in their career development journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problemStats.map((item, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${item.color} p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200`}
            >
              <div className="text-teal-700 mb-4">{item.icon}</div>
              <p className="text-gray-800 font-semibold text-lg leading-relaxed">
                {item.stat}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Solution Preview Section */}
      <div className="bg-gradient-to-br from-teal-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Your Personalized Career Solution
            </h2>
            <p className="text-xl text-gray-600">
              AI-powered tools to accelerate your professional growth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutionBenefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-teal-100 hover:border-teal-300"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-teal-700 text-white p-3 rounded-lg flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-teal-700 to-teal-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl mb-10 text-teal-100">
            Join thousands of learners who've successfully upskilled and landed their dream jobs
          </p>
          <button
            onClick={handleStartJourney}
            className="inline-flex items-center gap-2 bg-white text-teal-800 px-10 py-5 rounded-lg text-xl font-semibold hover:bg-teal-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            <span>🚀 Start My Journey</span>
            <ArrowRight className="w-6 h-6" />
          </button>
          <p className="mt-6 text-teal-200 text-sm">
            Takes only 30 minutes to get your personalized career roadmap
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>&copy; 2026 SkillPathAI. Empowering careers through AI-driven learning.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
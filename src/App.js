import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import ProfilePersonalPage from './pages/ProfilePersonalPage';
import ProfilePreferencesPage from './pages/ProfilePreferencesPage';
import ProfileSkillsPage from './pages/ProfileSkillsPage';
import RoadmapPage from './pages/RoadmapPage';
import AssessmentFlow from './pages/AssessmentFlow';
import AssessmentResults from './pages/AssessmentResults';
import SignInPage from './pages/SignInPage';
import Dashboard from './pages/Dashboard';
import ResultsHistoryPage from './pages/ResultsHistoryPage';
import LearningResourcesPage from './pages/LearningResourcesPage';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/profile/personal" element={<ProfilePersonalPage />} />
        <Route path="/profile/preferences" element={<ProfilePreferencesPage />} />
        <Route path="/profile/skills" element={<ProfileSkillsPage />} />
        <Route path="/assessment" element={<AssessmentFlow />} />
        <Route path="/assessment/results" element={<AssessmentResults />} />
        <Route path="/learning-path" element={<RoadmapPage />} />
        <Route path="/login" element={<SignInPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/results" element={<ResultsHistoryPage />} />
        <Route path="/learn" element={<LearningResourcesPage />} />
      </Routes>
    </Router>
  );
}

export default App;
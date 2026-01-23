import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import ProfilePersonalPage from './pages/ProfilePersonalPage';
import ProfilePreferencesPage from './pages/ProfilePreferencesPage';
import ProfileSkillsPage from './pages/ProfileSkillsPage';
import CareerGoalPage from './pages/CareerGoalPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/profile/personal" element={<ProfilePersonalPage />} />
        <Route path="/profile/preferences" element={<ProfilePreferencesPage />} />
        <Route path="/profile/skills" element={<ProfileSkillsPage />} />
        <Route path="/career-goal" element={<CareerGoalPage />} />
      </Routes>
    </Router>
  );
}

export default App;
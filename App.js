//This is src/App.js


// Updated App.js with proper routing and navigation
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './pages/UserContext';
import WebRTCTest from './components/WebRTCTest';
// Import your components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import AboutPage from './pages/AboutPage';

<WebRTCTest />
// Simple LogoutPage component
const LogoutPage = () => {
  React.useEffect(() => {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    
    // Redirect to home after a brief delay
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #6a1b9a, #ab47bc)',
      color: 'white',
      fontSize: '24px',
      fontFamily: 'Poppins, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Logging you out...</h2>
        <p>Please wait while we sign you out securely.</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          {/* Home routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          
          {/* Protected routes */}
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* Public routes */}
          <Route path="/about" element={<AboutPage />} />
          
          {/* Fallback route */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
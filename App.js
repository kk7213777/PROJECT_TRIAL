// Updated App.js with proper routing, navigation, and socket integration
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './pages/UserContext';
import { SocketProvider } from './contexts/SocketContext';

// Import your components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import AboutPage from './pages/AboutPage';

// Simple LogoutPage component
const LogoutPage = () => {
  React.useEffect(() => {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('currentUser');
    
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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Socket Protected Route Component (for routes that need socket connection)
const SocketProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <SocketProvider>
      {children}
    </SocketProvider>
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
          
          {/* Socket-enabled protected routes */}
          <Route 
            path="/chat" 
            element={
              <SocketProtectedRoute>
                <ChatPage />
              </SocketProtectedRoute>
            } 
          />
          
          {/* Regular protected routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
          
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
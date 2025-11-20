import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import ADSDashboard from './components/ADSDashboard';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve token from session storage on initial load
    const storedToken = sessionStorage.getItem('authToken');
    if (storedToken) setToken(storedToken);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Login route */}
        <Route
          path="/login"
          element={
            token ? (
              // If user already has token, redirect to dashboard
              <Navigate to="/dashboard" replace />
            ) : (
              // Otherwise, show login page
              <LoginPage
                onLoginSuccess={(newToken: string) => {
                  sessionStorage.setItem('authToken', newToken);
                  setToken(newToken);
                }}
              />
            )
          }
        />

        {/* Protected dashboard route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute token={token}>
              <ADSDashboard setToken={setToken} />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route: redirect to login if path doesn't match */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;

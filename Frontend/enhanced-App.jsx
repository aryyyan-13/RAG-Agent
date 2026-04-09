import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import { Loader } from 'lucide-react';
import './styles/App.css';

function App() {
  const { isAuthenticated, initAuth, isLoading } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <Loader className="spinner" size={48} />
        <p>Initializing RAG Assistant...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/chat/:domainId"
          element={isAuthenticated ? <Chat /> : <Navigate to="/" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

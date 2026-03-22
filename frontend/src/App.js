import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import TrackerPage from './pages/TrackerPage';
import DashboardPage from './pages/DashboardPage';
import FriendsPage from './pages/FriendsPage';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0a0f1e', color: '#4ade80',
      fontSize: '18px', fontFamily: 'monospace'
    }}>
      ⛰️ Loading...
    </div>
  );
  return user ? children : <Navigate to="/auth" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <TrackerPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/friends" element={
            <PrivateRoute>
              <Layout>
                <FriendsPage />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
};

const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const navItems = [
    { to: '/', label: 'Today', icon: '⏱️', end: true },
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/friends', label: 'Friends', icon: '👥' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f1e',
      color: '#e2e8f0',
      fontFamily: '"DM Sans", "Segoe UI", sans-serif'
    }}>
      {/* Top navigation */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,15,30,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: '8px',
        height: '60px'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '20px' }}>
          <span style={{ fontSize: '22px' }}>🏔️</span>
          <span style={{ fontSize: '16px', fontWeight: '800', color: '#f1f5f9', letterSpacing: '-0.02em' }}>
            Peak<span style={{ color: '#4ade80' }}>Tracker</span>
          </span>
        </div>

        {/* Nav links */}
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '9px',
              textDecoration: 'none', fontSize: '13px', fontWeight: '600',
              background: isActive ? 'rgba(74,222,128,0.12)' : 'transparent',
              color: isActive ? '#4ade80' : '#94a3b8',
              transition: 'all 0.2s'
            })}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Points indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: '8px',
          background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)'
        }}>
          <span style={{ fontSize: '14px' }}>⭐</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24', fontFamily: 'monospace' }}>
            {user?.totalPoints || 0}
          </span>
        </div>

        {/* User menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '5px 12px', borderRadius: '9px', border: 'none',
              background: showProfile ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.06)',
              color: '#e2e8f0', cursor: 'pointer', fontSize: '13px', fontWeight: '600'
            }}
          >
            <span style={{
              width: '26px', height: '26px', borderRadius: '7px',
              background: 'rgba(74,222,128,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px'
            }}>🧗</span>
            {user?.username}
            <span style={{ fontSize: '10px', color: '#64748b' }}>▼</span>
          </button>

          {showProfile && (
            <div style={{
              position: 'absolute', top: '44px', right: 0, minWidth: '180px',
              background: 'rgba(15,23,42,0.98)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#f1f5f9' }}>{user?.username}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{user?.email}</div>
              </div>
              <div style={{ padding: '6px' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: '8px',
                    border: 'none', background: 'transparent',
                    color: '#f87171', cursor: 'pointer', fontSize: '13px',
                    textAlign: 'left', fontWeight: '600'
                  }}
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Click outside to close profile */}
      {showProfile && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setShowProfile(false)}
        />
      )}

      {/* Page content */}
      <main style={{ minHeight: 'calc(100vh - 60px)' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;

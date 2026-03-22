import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px', color: '#e2e8f0',
    fontSize: '14px', outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Space Grotesk", sans-serif',
      padding: '20px'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none'
      }}>
        {/* Mountain silhouette */}
        <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.15 }}
          viewBox="0 0 1440 400" preserveAspectRatio="none" width="100%" height="300">
          <polygon points="0,400 200,400 720,50 1240,400 1440,400" fill="#334155" />
          <polygon points="200,400 600,400 720,150 840,400 1240,400" fill="#1e293b" />
        </svg>

        {/* Stars */}
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 60}%`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            borderRadius: '50%',
            background: 'white',
            opacity: 0.3 + Math.random() * 0.7,
            animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`
          }} />
        ))}
      </div>

      <div style={{
        background: 'rgba(15,23,42,0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        position: 'relative', zIndex: 1
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏔️</div>
          <h1 style={{
            fontSize: '26px', fontWeight: '800', color: '#f1f5f9',
            margin: 0, letterSpacing: '-0.02em'
          }}>
            Peak Tracker
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '6px 0 0' }}>
            Climb your productivity mountain
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.04)',
          borderRadius: '10px', padding: '4px', marginBottom: '24px'
        }}>
          {['Login', 'Register'].map(tab => (
            <button
              key={tab}
              onClick={() => { setIsLogin(tab === 'Login'); setError(''); }}
              style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '8px',
                background: (tab === 'Login') === isLogin ? 'rgba(74,222,128,0.15)' : 'transparent',
                color: (tab === 'Login') === isLogin ? '#4ade80' : '#64748b',
                fontWeight: (tab === 'Login') === isLogin ? '700' : '400',
                cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
            style={inputStyle}
          />

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '13px', borderRadius: '10px', border: 'none',
              background: loading ? '#374151' : 'linear-gradient(135deg, #4ade80, #22c55e)',
              color: '#0f172a', fontWeight: '800', fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.02em', transition: 'all 0.2s',
              marginTop: '4px'
            }}
          >
            {loading ? '⏳ Please wait...' : (isLogin ? '🏔️ Start Climbing' : '🚀 Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;

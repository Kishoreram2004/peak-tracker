import React, { useState, useEffect } from 'react';
import HourBlock from '../components/HourBlock';
import MountainClimber from '../components/MountainClimber';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const TrackerPage = () => {
  const { user, updateUserPoints } = useAuth();
  const { on, off } = useSocket();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed

  const currentHour = new Date().getHours();

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    const handleFriendUpdate = () => loadSession();
    on('friend_session_updated', handleFriendUpdate);
    return () => off('friend_session_updated', handleFriendUpdate);
  }, []);

  const loadSession = async () => {
    try {
      const { data } = await api.getTodaySession();
      setSession(data);
      if (data.totalPoints !== undefined) {
        updateUserPoints(data.totalPoints);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleBlockUpdate = (updatedSession) => {
    setSession(updatedSession);
    if (updatedSession.totalPoints !== undefined) {
      updateUserPoints(updatedSession.totalPoints);
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const completedHours = session?.hourBlocks?.filter(b => b.completed).length || 0;
  const totalPoints = session?.totalPoints || 0;
  const avgRating = completedHours > 0
    ? (session.hourBlocks.filter(b => b.completed).reduce((s, b) => s + b.rating, 0) / completedHours).toFixed(1)
    : 0;

  const filteredBlocks = session?.hourBlocks?.filter(b => {
    if (filter === 'active') return b.hourIndex === currentHour;
    if (filter === 'completed') return b.completed;
    // Default: show current hour + completed + nearby hours
    return true;
  }) || [];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: '#4ade80', fontSize: '18px' }}>⛰️ Loading your mountain...</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '13px', color: '#64748b', fontFamily: 'monospace', marginBottom: '4px' }}>
          {today}
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#f1f5f9', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Today's Climb
        </h1>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'Hours Done', value: completedHours, unit: 'hrs', color: '#4ade80' },
            { label: 'Total Points', value: totalPoints, unit: 'pts', color: '#fbbf24' },
            { label: 'Avg Rating', value: avgRating, unit: '★', color: '#a78bfa' },
            { label: 'Progress', value: `${Math.round((totalPoints / 800) * 100)}`, unit: '%', color: '#60a5fa' },
          ].map(stat => (
            <div key={stat.label} style={{
              flex: '1', minWidth: '120px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '14px 16px'
            }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: stat.color, fontFamily: 'monospace' }}>
                {stat.value}<span style={{ fontSize: '13px', marginLeft: '2px' }}>{stat.unit}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mountain + blocks layout */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Mountain visual */}
        <div style={{
          flex: '0 0 auto', position: 'sticky', top: '80px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '16px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
        }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Your Progress
          </div>
          <MountainClimber
            points={totalPoints}
            maxPoints={800}
            username={user?.username || 'You'}
            color="#4ade80"
            size="large"
          />
          <div style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px', height: '4px', overflow: 'hidden'
          }}>
            <div style={{
              height: '100%', background: 'linear-gradient(90deg, #4ade80, #22c55e)',
              width: `${Math.min((totalPoints / 800) * 100, 100)}%`,
              transition: 'width 0.5s ease', borderRadius: '8px'
            }} />
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
            {totalPoints} / 800 pts to summit
          </div>
        </div>

        {/* Hour blocks */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            {['all', 'active', 'completed'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '5px 14px', borderRadius: '8px', border: 'none',
                background: filter === f ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)',
                color: filter === f ? '#4ade80' : '#64748b',
                cursor: 'pointer', fontSize: '12px', fontWeight: filter === f ? '700' : '400',
                textTransform: 'capitalize'
              }}>
                {f === 'all' ? `All (${session?.hourBlocks?.length || 24})` : f === 'completed' ? `Done (${completedHours})` : 'Current'}
              </button>
            ))}
          </div>

          {filteredBlocks.map(block => (
            <HourBlock
              key={block.hourIndex}
              block={block}
              onUpdate={handleBlockUpdate}
              isCurrentHour={block.hourIndex === currentHour}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackerPage;

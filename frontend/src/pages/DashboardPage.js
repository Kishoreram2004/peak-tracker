import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import MountainClimber from '../components/MountainClimber';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px', padding: '10px 14px'
      }}>
        <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 4px' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: '13px', fontWeight: 'bold', margin: '2px 0' }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendSessions, setFriendSessions] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateSession, setDateSession] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [histRes, friendsRes] = await Promise.all([
        api.getSessionHistory(),
        api.getFriends()
      ]);
      setHistory(histRes.data);
      setFriends(friendsRes.data);

      // Load today's sessions for all friends
      const friendSessionMap = {};
      await Promise.all(
        friendsRes.data.map(async (friend) => {
          try {
            const { data } = await api.getFriendTodaySession(friend._id);
            if (data) friendSessionMap[friend._id] = data;
          } catch {}
        })
      );
      setFriendSessions(friendSessionMap);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadDateSession = async (date) => {
    setSelectedDate(date);
    try {
      const { data } = await api.getSessionByDate(date);
      setDateSession(data);
    } catch {
      setDateSession(null);
    }
  };

  // Chart data: last 14 days
  const chartData = history.slice(0, 14).reverse().map(s => ({
    date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    points: s.totalPoints,
    hours: s.hoursCompleted,
    avg: s.hoursCompleted > 0
      ? (s.hourBlocks.filter(b => b.completed).reduce((acc, b) => acc + b.rating, 0) / s.hoursCompleted).toFixed(1)
      : 0
  }));

  // Hourly heatmap data (which hours are most productive)
  const hourlyData = Array.from({ length: 24 }, (_, h) => {
    const allBlocks = history.flatMap(s => s.hourBlocks.filter(b => b.hourIndex === h && b.completed));
    const avgRating = allBlocks.length > 0
      ? allBlocks.reduce((s, b) => s + b.rating, 0) / allBlocks.length
      : 0;
    return {
      hour: `${String(h).padStart(2, '0')}:00`,
      rating: parseFloat(avgRating.toFixed(2)),
      count: allBlocks.length
    };
  });

  // Radar chart data for current week productivity patterns
  const radarData = [
    { subject: 'Morning\n(6-12)', A: calcPeriodScore(history, 6, 12) },
    { subject: 'Afternoon\n(12-17)', A: calcPeriodScore(history, 12, 17) },
    { subject: 'Evening\n(17-21)', A: calcPeriodScore(history, 17, 21) },
    { subject: 'Night\n(21-24)', A: calcPeriodScore(history, 21, 24) },
    { subject: 'Early\n(0-6)', A: calcPeriodScore(history, 0, 6) },
  ];

  function calcPeriodScore(sessions, startH, endH) {
    const blocks = sessions.flatMap(s =>
      s.hourBlocks.filter(b => b.hourIndex >= startH && b.hourIndex < endH && b.completed)
    );
    if (blocks.length === 0) return 0;
    return parseFloat((blocks.reduce((s, b) => s + b.rating, 0) / blocks.length * 20).toFixed(1));
  }

  const totalAllTime = history.reduce((s, sess) => s + sess.totalPoints, 0);
  const totalDays = history.length;
  const totalHours = history.reduce((s, sess) => s + sess.hoursCompleted, 0);
  const bestDay = history.reduce((best, s) => s.totalPoints > (best?.totalPoints || 0) ? s : best, null);

  // Mountain comparison: all climbers on one mountain
  const allClimbers = [
    { username: user?.username || 'You', points: user?.totalPoints || 0, color: '#4ade80' },
    ...friends.map((f, i) => ({
      username: f.username,
      points: f.totalPoints || 0,
      color: ['#60a5fa', '#f472b6', '#fb923c', '#a78bfa'][i % 4]
    }))
  ].sort((a, b) => b.points - a.points);

  const maxClimberPoints = Math.max(...allClimbers.map(c => c.points), 1200);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: '#4ade80', fontSize: '18px' }}>📊 Loading dashboard...</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#f1f5f9', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
        Dashboard
      </h1>
      <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '28px' }}>
        Your complete productivity overview
      </p>

      {/* All-time stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Total Points', value: totalAllTime, icon: '⭐', color: '#fbbf24' },
          { label: 'Days Tracked', value: totalDays, icon: '📅', color: '#60a5fa' },
          { label: 'Hours Completed', value: totalHours, icon: '⏱️', color: '#4ade80' },
          { label: 'Best Day', value: bestDay ? bestDay.totalPoints + ' pts' : '—', icon: '🏆', color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px', padding: '18px'
          }}>
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{s.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: s.color, fontFamily: 'monospace' }}>
              {s.value}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Mountain comparison */}
      {allClimbers.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '20px', marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 16px' }}>
            🏔️ Mountain Race — All Climbers
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {allClimbers.map((climber, i) => (
              <div key={climber.username} style={{ textAlign: 'center' }}>
                {i === 0 && (
                  <div style={{ fontSize: '11px', color: '#fbbf24', marginBottom: '4px', fontWeight: 'bold' }}>
                    👑 LEADING
                  </div>
                )}
                <MountainClimber
                  points={climber.points}
                  maxPoints={maxClimberPoints}
                  username={climber.username}
                  color={climber.color}
                  size="small"
                />
              </div>
            ))}
          </div>

          {/* Leaderboard */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {allClimbers.map((climber, i) => (
              <div key={climber.username} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px', borderRadius: '8px',
                background: climber.username === user?.username ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${climber.username === user?.username ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)'}`
              }}>
                <span style={{ fontSize: '16px', minWidth: '24px' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <span style={{ flex: 1, fontSize: '13px', color: climber.color, fontWeight: '600' }}>
                  {climber.username} {climber.username === user?.username ? '(you)' : ''}
                </span>
                <div style={{ flex: 2, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: climber.color,
                    width: `${(climber.points / maxClimberPoints) * 100}%`,
                    borderRadius: '3px', transition: 'width 0.5s ease'
                  }} />
                </div>
                <span style={{ fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace', minWidth: '70px', textAlign: 'right' }}>
                  {climber.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Points over time */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '20px'
        }}>
          <h3 style={{ fontSize: '14px', color: '#f1f5f9', margin: '0 0 16px', fontWeight: '700' }}>
            📈 Points per Day (Last 14 days)
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="points" stroke="#4ade80" strokeWidth={2.5}
                  dot={{ fill: '#4ade80', r: 4 }} name="Points" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
              No data yet — start tracking!
            </div>
          )}
        </div>

        {/* Hours completed bar chart */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '20px'
        }}>
          <h3 style={{ fontSize: '14px', color: '#f1f5f9', margin: '0 0 16px', fontWeight: '700' }}>
            ⏱️ Hours Completed per Day
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hours" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Hourly heatmap + Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Hourly productivity */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '20px'
        }}>
          <h3 style={{ fontSize: '14px', color: '#f1f5f9', margin: '0 0 16px', fontWeight: '700' }}>
            🕐 Hourly Productivity Heatmap
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {hourlyData.map(h => {
              const intensity = h.rating / 5;
              return (
                <div key={h.hour} title={`${h.hour}: avg ${h.rating}★ (${h.count} sessions)`} style={{
                  width: '36px', height: '36px', borderRadius: '6px',
                  background: `rgba(74, 222, 128, ${0.05 + intensity * 0.7})`,
                  border: `1px solid rgba(74, 222, 128, ${0.1 + intensity * 0.4})`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', cursor: 'default'
                }}>
                  <span style={{ fontSize: '8px', color: '#64748b', lineHeight: 1 }}>{h.hour.slice(0, 2)}</span>
                  {h.rating > 0 && (
                    <span style={{ fontSize: '9px', color: '#4ade80', lineHeight: 1, fontWeight: 'bold' }}>
                      {h.rating}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px' }}>
            Darker green = higher average rating. Hover for details.
          </div>
        </div>

        {/* Radar chart */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '20px'
        }}>
          <h3 style={{ fontSize: '14px', color: '#f1f5f9', margin: '0 0 4px', fontWeight: '700' }}>
            🕸️ Time-of-Day Performance
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9 }} />
              <Radar name="Score" dataKey="A" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calendar history */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px', padding: '20px'
      }}>
        <h3 style={{ fontSize: '14px', color: '#f1f5f9', margin: '0 0 16px', fontWeight: '700' }}>
          📅 Session History
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {history.map(s => {
            const intensity = s.totalPoints / 600; // Half of max = full green
            const isSelected = selectedDate === s.date;
            return (
              <button
                key={s.date}
                onClick={() => loadDateSession(s.date)}
                style={{
                  padding: '8px 12px', borderRadius: '10px', border: 'none',
                  background: isSelected ? 'rgba(74,222,128,0.2)' : `rgba(74,222,128,${0.05 + Math.min(intensity, 1) * 0.2})`,
                  border: `1px solid ${isSelected ? '#4ade80' : `rgba(74,222,128,${0.1 + Math.min(intensity, 1) * 0.4})`}`,
                  color: '#e2e8f0', cursor: 'pointer', fontSize: '12px',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: '700', fontFamily: 'monospace' }}>
                  {new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {s.totalPoints}pts · {s.hoursCompleted}h
                </div>
              </button>
            );
          })}
          {history.length === 0 && (
            <div style={{ color: '#475569', fontSize: '13px' }}>No sessions yet. Start tracking today!</div>
          )}
        </div>

        {/* Selected date details */}
        {selectedDate && dateSession && (
          <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            <h4 style={{ color: '#f1f5f9', margin: '0 0 12px', fontSize: '14px' }}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              <span style={{ color: '#4ade80', marginLeft: '8px' }}>{dateSession.totalPoints} pts</span>
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {dateSession.hourBlocks.filter(b => b.completed).map(b => (
                <div key={b.hourIndex} style={{
                  padding: '6px 10px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: '12px'
                }}>
                  <span style={{ color: '#94a3b8' }}>{b.startTime}</span>
                  <span style={{ color: '#fbbf24', margin: '0 4px' }}>{'★'.repeat(b.rating)}</span>
                  <span style={{ color: '#e2e8f0' }}>{b.activity || 'No label'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

import React, { useState, useEffect, useRef } from 'react';

const PomodoroTimer = ({ onPhaseComplete, hourIndex }) => {
  const [phase, setPhase] = useState('idle'); // idle, study, break
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const STUDY_TIME = 45 * 60;
  const BREAK_TIME = 15 * 60;

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(intervalRef.current);
      handlePhaseEnd();
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  const handlePhaseEnd = () => {
    if (phase === 'study') {
      setPhase('break');
      setTimeLeft(BREAK_TIME);
      setIsRunning(true);
      onPhaseComplete && onPhaseComplete('study');
      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification('⏰ Study time done!', { body: 'Take a 15 min break!' });
      }
    } else if (phase === 'break') {
      setPhase('idle');
      setIsRunning(false);
      setTimeLeft(STUDY_TIME);
      onPhaseComplete && onPhaseComplete('break');
      if (Notification.permission === 'granted') {
        new Notification('🏔️ Break over!', { body: 'Ready for the next hour?' });
      }
    }
  };

  const start = () => {
    if (phase === 'idle') {
      setPhase('study');
      setTimeLeft(STUDY_TIME);
    }
    setIsRunning(true);
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const pause = () => setIsRunning(false);

  const reset = () => {
    clearInterval(intervalRef.current);
    setPhase('idle');
    setTimeLeft(STUDY_TIME);
    setIsRunning(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const totalTime = phase === 'break' ? BREAK_TIME : STUDY_TIME;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const phaseColor = phase === 'study' ? '#4ade80' : phase === 'break' ? '#60a5fa' : '#94a3b8';
  const circumference = 2 * Math.PI * 45;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px'
    }}>
      {/* Circular progress */}
      <div style={{ position: 'relative', width: '120px', height: '120px' }}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
          <circle
            cx="60" cy="60" r="45" fill="none"
            stroke={phaseColor}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: phaseColor, fontFamily: 'monospace' }}>
            {formatTime(timeLeft)}
          </div>
          <div style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'monospace', textTransform: 'uppercase' }}>
            {phase === 'idle' ? 'Ready' : phase}
          </div>
        </div>
      </div>

      {/* Phase indicator */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <span style={{
          padding: '2px 8px', borderRadius: '10px', fontSize: '10px',
          background: phase === 'study' ? '#4ade8033' : 'rgba(255,255,255,0.05)',
          color: phase === 'study' ? '#4ade80' : '#94a3b8',
          border: `1px solid ${phase === 'study' ? '#4ade8055' : 'transparent'}`
        }}>📚 45 min study</span>
        <span style={{
          padding: '2px 8px', borderRadius: '10px', fontSize: '10px',
          background: phase === 'break' ? '#60a5fa33' : 'rgba(255,255,255,0.05)',
          color: phase === 'break' ? '#60a5fa' : '#94a3b8',
          border: `1px solid ${phase === 'break' ? '#60a5fa55' : 'transparent'}`
        }}>☕ 15 min break</span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {!isRunning ? (
          <button onClick={start} style={{
            padding: '6px 18px', borderRadius: '8px', border: 'none',
            background: phaseColor, color: '#0f172a', fontWeight: 'bold',
            cursor: 'pointer', fontSize: '13px'
          }}>
            {phase === 'idle' ? '▶ Start' : '▶ Resume'}
          </button>
        ) : (
          <button onClick={pause} style={{
            padding: '6px 18px', borderRadius: '8px', border: 'none',
            background: '#fbbf24', color: '#0f172a', fontWeight: 'bold',
            cursor: 'pointer', fontSize: '13px'
          }}>
            ⏸ Pause
          </button>
        )}
        <button onClick={reset} style={{
          padding: '6px 14px', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'transparent', color: '#94a3b8',
          cursor: 'pointer', fontSize: '13px'
        }}>
          ↺ Reset
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;

import React from 'react';

// Max points = 24 hours * 5 stars * 10 = 1200 per day
// We show progress along mountain path
const MountainClimber = ({ points = 0, maxPoints = 1200, username = 'You', color = '#4ade80', size = 'large' }) => {
  const progress = Math.min(points / maxPoints, 1); // 0 to 1
  
  // Mountain path from bottom-right to top
  // SVG viewBox: 0 0 400 350
  const pathPoints = [
    { x: 340, y: 320 }, // base
    { x: 300, y: 280 },
    { x: 260, y: 240 },
    { x: 220, y: 210 },
    { x: 180, y: 175 },
    { x: 150, y: 145 },
    { x: 120, y: 115 },
    { x: 100, y: 90 },
    { x: 80, y: 65 },
    { x: 65, y: 45 },  // summit
  ];

  // Interpolate position along path
  const getPosition = (t) => {
    if (pathPoints.length < 2) return pathPoints[0];
    const totalSegments = pathPoints.length - 1;
    const scaledT = t * totalSegments;
    const segment = Math.min(Math.floor(scaledT), totalSegments - 1);
    const segmentT = scaledT - segment;
    const p1 = pathPoints[segment];
    const p2 = pathPoints[segment + 1];
    return {
      x: p1.x + (p2.x - p1.x) * segmentT,
      y: p1.y + (p2.y - p1.y) * segmentT
    };
  };

  const climberPos = getPosition(progress);
  const isAtTop = progress >= 0.95;

  const w = size === 'small' ? 200 : 400;
  const h = size === 'small' ? 175 : 350;
  const scale = size === 'small' ? 0.5 : 1;

  return (
    <svg
      viewBox="0 0 400 350"
      width={w}
      height={h}
      style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))' }}
    >
      {/* Sky gradient */}
      <defs>
        <linearGradient id={`sky-${username}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
        <linearGradient id={`snow-${username}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id={`rock-${username}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        {/* Stars */}
        <radialGradient id="starGlow">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background sky */}
      <rect width="400" height="350" fill={`url(#sky-${username})`} />

      {/* Stars in sky */}
      {[
        [30, 30], [80, 20], [120, 40], [200, 15], [250, 35],
        [300, 20], [350, 40], [370, 60], [15, 70], [160, 25]
      ].map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r={1} fill="white" opacity={0.6 + Math.random() * 0.4} />
      ))}

      {/* Moon */}
      <circle cx={360} cy={30} r={14} fill="#fef3c7" opacity={0.9} />
      <circle cx={367} cy={26} r={11} fill={`url(#sky-${username})`} opacity={0.6} />

      {/* Mountain body */}
      <polygon
        points="65,45 30,330 370,330"
        fill="url(#rock-${username})"
        stroke="#1e293b"
        strokeWidth="1"
      />
      <polygon
        points="65,45 30,330 370,330"
        fill="url(#rock-${username})"
      />

      {/* Snow cap */}
      <polygon
        points="65,45 50,110 80,100 100,130 120,115 100,90 80,65"
        fill={`url(#snow-${username})`}
        opacity={0.9}
      />

      {/* Mountain texture lines */}
      <line x1="150" y1="200" x2="100" y2="150" stroke="#3d5470" strokeWidth="1" opacity={0.5} />
      <line x1="200" y1="240" x2="140" y2="180" stroke="#3d5470" strokeWidth="1" opacity={0.5} />
      <line x1="250" y1="270" x2="180" y2="210" stroke="#3d5470" strokeWidth="1" opacity={0.4} />

      {/* Path/trail on mountain */}
      <polyline
        points={pathPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
        strokeDasharray="5,5"
      />

      {/* Progress trail (climbed portion) */}
      <polyline
        points={pathPoints.slice(0, Math.ceil(progress * (pathPoints.length - 1)) + 1)
          .map(p => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        opacity={0.7}
      />

      {/* Flag at summit */}
      <line x1="65" y1="20" x2="65" y2="45" stroke="#94a3b8" strokeWidth="2" />
      <polygon
        points="65,20 90,27 65,34"
        fill={isAtTop ? '#fbbf24' : '#ef4444'}
        style={{ filter: isAtTop ? 'drop-shadow(0 0 6px #fbbf24)' : 'none' }}
      />
      {isAtTop && (
        <circle cx="65" cy="27" r="12" fill="url(#starGlow)" opacity={0.5} />
      )}

      {/* Climber figure */}
      <g transform={`translate(${climberPos.x}, ${climberPos.y})`}>
        {/* Glow under climber */}
        <circle cx={0} cy={2} r={8} fill={color} opacity={0.3} />

        {/* Body */}
        <circle cx={0} cy={-12} r={4} fill={color} /> {/* head */}
        <line x1={0} y1={-8} x2={0} y2={-2} stroke={color} strokeWidth={2.5} strokeLinecap="round" /> {/* torso */}
        {/* Arms */}
        <line x1={0} y1={-6} x2={-4} y2={-2} stroke={color} strokeWidth={2} strokeLinecap="round" />
        <line x1={0} y1={-6} x2={4} y2={-3} stroke={color} strokeWidth={2} strokeLinecap="round" />
        {/* Legs */}
        <line x1={0} y1={-2} x2={-3} y2={3} stroke={color} strokeWidth={2} strokeLinecap="round" />
        <line x1={0} y1={-2} x2={3} y2={3} stroke={color} strokeWidth={2} strokeLinecap="round" />

        {/* Username label */}
        <text
          x={0}
          y={15}
          textAnchor="middle"
          fill={color}
          fontSize="8"
          fontWeight="bold"
          fontFamily="monospace"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}
        >
          {username.length > 8 ? username.slice(0, 7) + '…' : username}
        </text>
      </g>

      {/* Points display */}
      <rect x="5" y="305" width="100" height="22" rx="4" fill="rgba(0,0,0,0.5)" />
      <text x="55" y="320" textAnchor="middle" fill={color} fontSize="10" fontWeight="bold" fontFamily="monospace">
        {points} pts • {Math.round(progress * 100)}%
      </text>

      {/* Summit label */}
      <text x="80" y="42" fill="#fef3c7" fontSize="9" fontFamily="monospace" opacity={0.8}>
        SUMMIT
      </text>
    </svg>
  );
};

export default MountainClimber;

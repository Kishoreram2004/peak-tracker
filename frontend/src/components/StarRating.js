import React, { useState } from 'react';

const StarRating = ({ rating = 0, onRate, size = 20, readonly = false }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => !readonly && onRate && onRate(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            fontSize: `${size}px`,
            cursor: readonly ? 'default' : 'pointer',
            color: star <= (hovered || rating) ? '#fbbf24' : 'rgba(255,255,255,0.2)',
            transition: 'color 0.15s, transform 0.1s',
            transform: star <= (hovered || rating) ? 'scale(1.15)' : 'scale(1)',
            display: 'inline-block',
            userSelect: 'none'
          }}
        >
          ★
        </span>
      ))}
      {!readonly && (
        <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}>
          {rating > 0 ? ['', 'Poor', 'Fair', 'Good', 'Great', 'Perfect!'][rating] : 'Rate'}
        </span>
      )}
    </div>
  );
};

export default StarRating;

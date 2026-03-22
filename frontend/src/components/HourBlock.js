import React, { useState } from 'react';
import PomodoroTimer from './PomodoroTimer';
import StarRating from './StarRating';
import { api } from '../api';

const HourBlock = ({ block, onUpdate, isCurrentHour }) => {
  const [expanded, setExpanded] = useState(isCurrentHour);
  const [editing, setEditing] = useState(false);
  const [activity, setActivity] = useState(block.activity || '');
  const [notes, setNotes] = useState(block.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.updateHourBlock(block.hourIndex, {
        activity,
        notes,
        completed: block.rating > 0
      });
      onUpdate && onUpdate(data);
      setEditing(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleRate = async (rating) => {
    try {
      const { data } = await api.updateHourBlock(block.hourIndex, {
        rating,
        completed: rating > 0
      });
      onUpdate && onUpdate(data);
    } catch (err) {
      console.error(err);
    }
  };

  const points = block.completed ? block.rating * 10 : 0;

  const blockBg = isCurrentHour
    ? 'rgba(74, 222, 128, 0.08)'
    : block.completed
    ? 'rgba(255,255,255,0.04)'
    : 'rgba(255,255,255,0.02)';

  const borderColor = isCurrentHour
    ? 'rgba(74, 222, 128, 0.4)'
    : block.completed
    ? 'rgba(251, 191, 36, 0.3)'
    : 'rgba(255,255,255,0.08)';

  return (
    <div style={{
      background: blockBg,
      border: `1px solid ${borderColor}`,
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
    }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 16px', cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        {/* Time */}
        <div style={{
          fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold',
          color: isCurrentHour ? '#4ade80' : '#94a3b8',
          minWidth: '100px'
        }}>
          {block.startTime} – {block.endTime}
          {isCurrentHour && (
            <span style={{
              marginLeft: '6px', fontSize: '9px',
              background: '#4ade8033', color: '#4ade80',
              padding: '1px 5px', borderRadius: '6px'
            }}>NOW</span>
          )}
        </div>

        {/* Activity summary */}
        <div style={{ flex: 1, fontSize: '13px', color: block.activity ? '#e2e8f0' : '#475569' }}>
          {block.activity || (isCurrentHour ? 'Click to add activity...' : '—')}
        </div>

        {/* Stars */}
        <StarRating rating={block.rating} readonly size={14} />

        {/* Points badge */}
        {block.completed && (
          <span style={{
            fontSize: '11px', fontWeight: 'bold',
            color: '#fbbf24', background: 'rgba(251,191,36,0.1)',
            padding: '2px 8px', borderRadius: '8px', minWidth: '50px',
            textAlign: 'center'
          }}>
            +{points}pts
          </span>
        )}

        {/* Expand arrow */}
        <span style={{ color: '#475569', fontSize: '12px', transition: 'transform 0.2s',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ paddingTop: '16px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {/* Timer section */}
            <div style={{ flex: '0 0 auto' }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pomodoro Timer
              </div>
              <PomodoroTimer hourIndex={block.hourIndex} onPhaseComplete={(phase) => {
                if (phase === 'break') {
                  // Auto-prompt to log activity
                  setEditing(true);
                }
              }} />
            </div>

            {/* Activity & Rating section */}
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                What did you do?
              </div>

              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    value={activity}
                    onChange={e => setActivity(e.target.value)}
                    placeholder="e.g. React hooks, Chapter 3 notes..."
                    style={{
                      width: '100%', padding: '8px 12px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px', color: '#e2e8f0',
                      fontSize: '13px', outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Notes (optional)..."
                    rows={2}
                    style={{
                      width: '100%', padding: '8px 12px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px', color: '#94a3b8',
                      fontSize: '12px', outline: 'none', resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        padding: '6px 16px', borderRadius: '8px', border: 'none',
                        background: '#4ade80', color: '#0f172a', fontWeight: 'bold',
                        cursor: 'pointer', fontSize: '12px'
                      }}
                    >
                      {saving ? '...' : '✓ Save'}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      style={{
                        padding: '6px 12px', borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'transparent', color: '#94a3b8',
                        cursor: 'pointer', fontSize: '12px'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    onClick={() => setEditing(true)}
                    style={{
                      padding: '8px 12px', borderRadius: '8px',
                      border: '1px dashed rgba(255,255,255,0.12)',
                      color: block.activity ? '#e2e8f0' : '#475569',
                      fontSize: '13px', cursor: 'pointer', marginBottom: '10px',
                      minHeight: '36px'
                    }}
                  >
                    {block.activity || 'Click to add activity...'}
                  </div>
                  {block.notes && (
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                      📝 {block.notes}
                    </div>
                  )}
                </div>
              )}

              {/* Rating */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Rate this hour
                </div>
                <StarRating rating={block.rating} onRate={handleRate} size={22} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HourBlock;

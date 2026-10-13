import React from 'react';
import { X, Calendar, Clock, Coffee, Brain, Sparkles } from 'lucide-react';
import { FocusSession } from '../../types';

interface DailyDetailModalProps {
  date: string | null;
  sessions: FocusSession[];
  onClose: () => void;
}

export const DailyDetailModal: React.FC<DailyDetailModalProps> = ({
  date,
  sessions,
  onClose
}) => {
  if (!date) return null;

  const totalMinutes = sessions.reduce((acc, s) => acc + s.focusMinutes, 0);
  const totalBreaks = sessions.reduce((acc, s) => acc + s.breaks.length, 0);
  const avgScore = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + s.evaluation.score, 0) / sessions.length) 
    : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass-panel-glow" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--accent-purple)" />
              <h2 style={{ fontSize: '1.3rem', color: '#ffffff' }}>Daily Focus Breakdown</h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Date: <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{date}</span>
            </p>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{ padding: '6px', borderRadius: 'var(--radius-full)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Day Stats Banner */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '14px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '18px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)' }}>
              {totalMinutes}m
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Total Focused</div>
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              {sessions.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Sessions</div>
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
              {avgScore} / 100
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Avg Quality Score</div>
          </div>
        </div>

        {/* Sessions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No focus sessions logged for this day.
            </div>
          ) : (
            sessions.map((s, idx) => {
              const timeFormatted = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div 
                  key={s.id || idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#ffffff' }}>
                      {s.taskGoal || 'Focus Session'}
                    </div>
                    <span className="badge badge-flow" style={{ fontSize: '0.7rem' }}>
                      {s.mode.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} color="var(--accent-purple)" />
                      {timeFormatted} • {s.focusMinutes}m
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Coffee size={13} color="var(--accent-emerald)" />
                      {s.breaks.length} breaks ({s.breakMinutes}m)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      <Brain size={13} />
                      Score: {s.evaluation.score}%
                    </span>
                  </div>

                  {s.evaluation.aiFeedback && (
                    <div style={{
                      marginTop: '8px',
                      padding: '6px 10px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      color: 'var(--text-dim)',
                      lineHeight: 1.4
                    }}>
                      "{s.evaluation.aiFeedback}"
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

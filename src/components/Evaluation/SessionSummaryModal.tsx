import React from 'react';
import { Award, CheckCircle, TrendingUp, Sparkles, Brain, Clock, ShieldAlert } from 'lucide-react';
import { FocusSession, Badge } from '../../types';

interface SessionSummaryModalProps {
  session: FocusSession | null;
  newBadges: Badge[];
  xpEarned: number;
  onClose: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  session,
  newBadges,
  xpEarned,
  onClose
}) => {
  if (!session) return null;

  const { evaluation, focusMinutes, breakMinutes, breaks, taskGoal } = session;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'var(--accent-emerald)';
    if (score >= 65) return 'var(--accent-cyan)';
    if (score >= 45) return 'var(--accent-amber)';
    return 'var(--accent-rose)';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass-panel-glow" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--gradient-neuro)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            boxShadow: '0 0 25px rgba(139, 92, 246, 0.5)'
          }}>
            <Brain size={32} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#ffffff' }}>Session Neural Evaluation</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Mission: <span style={{ color: 'var(--text-accent)' }}>"{taskGoal}"</span>
          </p>
        </div>

        {/* Big Score Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          marginBottom: '20px'
        }}>
          {/* Quality Score */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '3rem',
              fontWeight: 800,
              color: getScoreColor(evaluation.score),
              lineHeight: 1
            }}>
              {evaluation.score}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '6px' }}>
              Focus Quality Score
            </div>
          </div>

          <div style={{ width: '1px', height: '60px', background: 'var(--border-subtle)' }} />

          {/* XP Gained */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '2.5rem',
              fontWeight: 800,
              color: 'var(--accent-purple)',
              lineHeight: 1
            }}>
              +{xpEarned}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '6px' }}>
              XP Gained
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <Clock size={16} color="var(--accent-cyan)" style={{ margin: '0 auto 4px auto' }} />
            <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {focusMinutes}m
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Focus Time</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <TrendingUp size={16} color="var(--accent-emerald)" style={{ margin: '0 auto 4px auto' }} />
            <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {evaluation.focusPercent}%
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Gaze Alignment</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <ShieldAlert size={16} color="var(--accent-amber)" style={{ margin: '0 auto 4px auto' }} />
            <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {breaks.length} ({breakMinutes}m)
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Rest Periods</div>
          </div>
        </div>

        {/* AI Prefrontal Feedback */}
        <div style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles size={16} color="var(--accent-purple)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-accent)' }}>
              AI Neuro-Cognitive Review
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#ffffff', lineHeight: 1.5 }}>
            {evaluation.aiFeedback}
          </p>

          {/* Key Strengths */}
          {evaluation.keyStrengths?.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                Observed Strengths:
              </div>
              <ul style={{ paddingLeft: '18px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {evaluation.keyStrengths.map((str, i) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Newly Unlocked Badges */}
        {newBadges.length > 0 && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', marginBottom: '8px' }}>
              🏆 New Achievement Unlocked!
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {newBadges.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '1.2rem' }}>{b.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>{b.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{b.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save / Close Button */}
        <button
          className="btn btn-primary"
          onClick={onClose}
          style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
        >
          <CheckCircle size={18} /> Confirm & Save to Cloud Calendar
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Award, CheckCircle, TrendingUp, Sparkles, Brain, Clock, ShieldAlert, Zap, Flame, Compass } from 'lucide-react';
import { FocusSession, Badge, SkillNode } from '../../types';
import { SkillTreeGraph } from '../SkillTree/SkillTreeGraph';

interface SessionSummaryModalProps {
  session: FocusSession | null;
  newBadges: Badge[];
  xpEarned: number;
  skillNodes?: Record<string, SkillNode>;
  totalSkillXp?: number;
  onOpenKuaKua?: () => void;
  onClose: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  session,
  newBadges,
  xpEarned,
  skillNodes,
  totalSkillXp = 0,
  onOpenKuaKua,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'evaluation' | 'skills'>('evaluation');

  if (!session) return null;

  const { evaluation, focusMinutes, breakMinutes, breaks, taskGoal, kuaKua } = session;

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
        style={{
          maxWidth: activeTab === 'skills' ? '740px' : '580px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          transition: 'max-width 0.25s ease'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--gradient-neuro)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px auto',
            boxShadow: '0 0 25px rgba(139, 92, 246, 0.5)'
          }}>
            <Brain size={30} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', color: '#ffffff' }}>Session Neural Evaluation</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Mission: <span style={{ color: 'var(--text-accent)' }}>"{taskGoal}"</span>
          </p>
        </div>

        {/* Tab Navigation Switcher */}
        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => setActiveTab('evaluation')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'evaluation' ? 'var(--gradient-neuro)' : 'transparent',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Brain size={15} /> Neural Metrics & Feedback
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'skills' ? 'var(--gradient-neuro)' : 'transparent',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Compass size={15} /> Radial Skill Tree
          </button>
        </div>

        {/* TAB 1: EVALUATION VIEW */}
        {activeTab === 'evaluation' && (
          <div>
            {/* Big Score Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              marginBottom: '18px'
            }}>
              {/* Quality Score */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.8rem',
                  fontWeight: 800,
                  color: getScoreColor(evaluation.score),
                  lineHeight: 1
                }}>
                  {evaluation.score}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '6px' }}>
                  Focus Quality Score
                </div>
              </div>

              <div style={{ width: '1px', height: '55px', background: 'var(--border-subtle)' }} />

              {/* XP Gained */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: 'var(--accent-purple)',
                  lineHeight: 1
                }}>
                  +{xpEarned}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '6px' }}>
                  XP Gained
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '18px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <Clock size={16} color="var(--accent-cyan)" style={{ margin: '0 auto 4px auto' }} />
                <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
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
                <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
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
                <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
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
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Sparkles size={16} color="var(--accent-purple)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-accent)' }}>
                  AI Neuro-Cognitive Review
                </span>
              </div>
              <p style={{ fontSize: '0.86rem', color: '#ffffff', lineHeight: 1.5, margin: 0 }}>
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

            {/* Kua Kua Praise Preview / Launcher Button */}
            {kuaKua && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(139, 92, 246, 0.15) 100%)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                borderRadius: '14px',
                padding: '14px 16px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#f472b6', fontWeight: 700, textTransform: 'uppercase' }}>
                    <Flame size={14} /> AI Kua Kua Praise Ready
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#ffffff', marginTop: '2px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '340px' }}>
                    "{kuaKua.praiseQuoteZh}"
                  </div>
                </div>
                {onOpenKuaKua && (
                  <button
                    className="btn btn-primary"
                    onClick={onOpenKuaKua}
                    style={{ padding: '6px 14px', fontSize: '0.78rem', background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }}
                  >
                    View Praise 🔥
                  </button>
                )}
              </div>
            )}

            {/* Newly Unlocked Badges */}
            {newBadges.length > 0 && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: '18px'
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
          </div>
        )}

        {/* TAB 2: SKILL TREE RADIAL VIEW */}
        {activeTab === 'skills' && skillNodes && (
          <div style={{ marginBottom: '18px' }}>
            <SkillTreeGraph
              nodes={skillNodes}
              totalSkillXp={totalSkillXp}
              highlightedSkillIds={
                kuaKua
                  ? [
                      ...kuaKua.hardSkillsGained.map(h => h.skill.toLowerCase()),
                      ...kuaKua.softSkillsGained.map(s => s.skill.toLowerCase())
                    ]
                  : []
              }
            />
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

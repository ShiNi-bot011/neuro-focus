import React, { useState } from 'react';
import { Plus, Sparkles, CheckCircle2, Circle, Trash2, RefreshCw } from 'lucide-react';
import { GoalItem } from '../../types';
import { GoalModal } from './GoalModal';
import { triggerConfetti } from '../../hooks/useGamification';

interface VisionBoardViewProps {
  goals: GoalItem[];
  onAddGoal: (goal: GoalItem) => void;
  onToggleGoal: (id: string) => void;
  onDeleteGoal: (id: string) => void;
}

export const VisionBoardView: React.FC<VisionBoardViewProps> = ({
  goals,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleToggle = (id: string, completedBefore: boolean) => {
    onToggleGoal(id);
    if (!completedBefore) {
      triggerConfetti();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff' }}>Neural Vision Board</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Multi-sensory cognitive anchors generated with Gemini AI to reinforce dopamine drive.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setModalOpen(true)}
          style={{ padding: '10px 20px', fontSize: '0.9rem' }}
        >
          <Plus size={18} /> Add Goal with AI
        </button>
      </div>

      {/* Mosaic Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
        gap: '18px'
      }}>
        {goals.map(goal => (
          <div
            key={goal.id}
            className="glass-panel"
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '340px',
              border: goal.completed ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
              boxShadow: goal.completed ? '0 0 20px rgba(16, 185, 129, 0.2)' : 'var(--shadow-glass)'
            }}
          >
            {/* Visual Wallpaper Image */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '190px',
              overflow: 'hidden',
              background: '#090d1f'
            }}>
              <img
                src={goal.imageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop'}
                alt={goal.text}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: goal.completed ? 0.6 : 0.85,
                  transition: 'transform 0.5s ease',
                  filter: goal.completed ? 'grayscale(40%)' : 'none'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              />

              {/* Gradient Overlay for Text Readability */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(7, 9, 19, 0.2) 0%, rgba(7, 9, 19, 0.95) 100%)'
              }} />

              {/* Category Badge */}
              <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem', backdropFilter: 'blur(8px)' }}>
                  {goal.category}
                </span>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => onDeleteGoal(goal.id)}
                title="Remove Goal"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(6px)',
                  border: 'none',
                  color: 'var(--text-dim)',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Card Content & Affirmation */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: goal.completed ? 'var(--text-muted)' : '#ffffff',
                  textDecoration: goal.completed ? 'line-through' : 'none',
                  lineHeight: 1.35
                }}>
                  {goal.text}
                </div>

                {goal.motivationalQuote && (
                  <p style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-accent)',
                    fontStyle: 'italic',
                    marginTop: '10px',
                    lineHeight: 1.45,
                    borderLeft: '2px solid var(--accent-purple)',
                    paddingLeft: '10px'
                  }}>
                    "{goal.motivationalQuote}"
                  </p>
                )}
              </div>

              {/* Complete Goal Toggle Action */}
              <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <button
                  type="button"
                  onClick={() => handleToggle(goal.id, goal.completed)}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    background: goal.completed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: goal.completed ? '#6ee7b7' : 'var(--text-muted)',
                    border: `1px solid ${goal.completed ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`
                  }}
                >
                  {goal.completed ? (
                    <><CheckCircle2 size={14} color="var(--accent-emerald)" /> Goal Accomplished</>
                  ) : (
                    <><Circle size={14} /> Mark as Reached</>
                  )}
                </button>

                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(goal.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Quick Add Placeholder Card */}
        <div
          onClick={() => setModalOpen(true)}
          style={{
            minHeight: '340px',
            border: '2px dashed rgba(139, 92, 246, 0.3)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: '24px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.01)',
            transition: 'var(--transition)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--accent-purple)';
            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
          }}
        >
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            color: 'var(--accent-purple)'
          }}>
            <Plus size={24} />
          </div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>Add New Vision Anchor</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px', maxWidth: '200px' }}>
            Gemini AI will synthesize wallpaper and neuro-affirmation
          </div>
        </div>
      </div>

      <GoalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddGoal={onAddGoal}
      />
    </div>
  );
};

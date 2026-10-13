import React, { useState } from 'react';
import { X, Sparkles, Target, Compass, Wand2 } from 'lucide-react';
import { generateVisionBoardItem } from '../../lib/gemini';
import { GoalItem } from '../../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGoal: (goal: GoalItem) => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onAddGoal
}) => {
  const [goalText, setGoalText] = useState('');
  const [category, setCategory] = useState<GoalItem['category']>('Career');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const categories: GoalItem['category'][] = ['Career', 'Health', 'Mindset', 'Creativity', 'Wealth', 'General'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalText.trim()) return;

    setLoading(true);
    try {
      const generated = await generateVisionBoardItem(goalText, category);
      const newGoal: GoalItem = {
        id: 'goal_' + Date.now(),
        text: goalText.trim(),
        category,
        imageUrl: generated.imageUrl,
        motivationalQuote: generated.motivationalQuote,
        completed: false,
        createdAt: Date.now()
      };
      onAddGoal(newGoal);
      onClose();
    } catch (err) {
      console.warn('Failed to generate goal visual:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass-panel-glow" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: '#ffffff' }}>Add Vision Board Goal</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Gemini AI will synthesize a motivational visual and affirmation.
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Goal Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Your Target Aspiration:
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Launch my AI startup to 10k users, run a full marathon, master Mandarin..."
              value={goalText}
              onChange={e => setGoalText(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(10, 15, 30, 0.7)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {/* Category Chips */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Category:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {categories.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-full)',
                    background: category === c ? 'var(--accent-purple)' : 'rgba(255, 255, 255, 0.04)',
                    color: category === c ? '#ffffff' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ padding: '12px', marginTop: '6px' }}
          >
            <Wand2 size={16} />
            {loading ? 'Synthesizing with Gemini AI...' : 'Generate Vision Card'}
          </button>
        </form>
      </div>
    </div>
  );
};

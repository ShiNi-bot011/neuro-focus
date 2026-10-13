import React, { useState } from 'react';
import { X, Coffee, Eye, Sparkles, Footprints, PenTool } from 'lucide-react';
import { BreakType } from '../../types';

interface BreakSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBreak: (type: BreakType, label: string, minutes: number) => void;
}

export const BreakSelector: React.FC<BreakSelectorProps> = ({
  isOpen,
  onClose,
  onStartBreak
}) => {
  const [selectedType, setSelectedType] = useState<BreakType>('toilet');
  const [customLabel, setCustomLabel] = useState('');
  const [breakDuration, setBreakDuration] = useState(5);

  if (!isOpen) return null;

  const breakOptions: { type: BreakType; label: string; icon: string; defaultMin: number; desc: string }[] = [
    {
      type: 'toilet',
      label: 'Bathroom / Toilet Break',
      icon: '🚽',
      defaultMin: 5,
      desc: 'Quick bodily reset without cognitive distraction.'
    },
    {
      type: 'snack',
      label: 'Snack / Hydration Break',
      icon: '🍎',
      defaultMin: 10,
      desc: 'Glucose replenishment & water intake for the brain.'
    },
    {
      type: 'eye_rest',
      label: '20-20-20 Eye Rest & NSDR',
      icon: '👁️',
      defaultMin: 3,
      desc: 'Look 20 feet away for 20 seconds to relax ciliary optic muscles.'
    },
    {
      type: 'stretch',
      label: 'Body Stretch & Posture Reset',
      icon: '🧘',
      defaultMin: 5,
      desc: 'Release spinal tension and open thoracic diaphragm.'
    },
    {
      type: 'custom',
      label: 'Custom Break Label',
      icon: '✏️',
      defaultMin: 5,
      desc: 'Define your own intentional restorative break.'
    }
  ];

  const handleSelectType = (opt: typeof breakOptions[0]) => {
    setSelectedType(opt.type);
    setBreakDuration(opt.defaultMin);
  };

  const handleConfirm = () => {
    const finalLabel = selectedType === 'custom' 
      ? (customLabel.trim() || 'Custom Break') 
      : (breakOptions.find(o => o.type === selectedType)?.label || 'Break');
    
    onStartBreak(selectedType, finalLabel, breakDuration);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass-panel-glow" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', color: '#ffffff' }}>Select Break Period</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Protect dopamine levels: step away from feeds and recharge.
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

        {/* Options Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {breakOptions.map(opt => {
            const isSelected = selectedType === opt.type;
            return (
              <div
                key={opt.type}
                onClick={() => handleSelectType(opt)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isSelected ? 'var(--accent-purple)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>{opt.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? '#ffffff' : 'var(--text-main)' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {opt.desc}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.78rem',
                  color: isSelected ? 'var(--accent-cyan)' : 'var(--text-dim)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {opt.defaultMin}m
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Label Input */}
        {selectedType === 'custom' && (
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Custom Break Activity:
            </label>
            <input
              type="text"
              placeholder="e.g. Making green tea, Sun gazing, Breathwork"
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(10, 15, 30, 0.7)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>
        )}

        {/* Duration Slider */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Planned Duration:</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)' }}>
              {breakDuration} Minutes
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={breakDuration}
            onChange={e => setBreakDuration(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            <span>1 min (Micro)</span>
            <span>15 min</span>
            <span>30 min (Long)</span>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleConfirm}
          style={{ width: '100%', padding: '12px' }}
        >
          Begin Break Period
        </button>
      </div>
    </div>
  );
};

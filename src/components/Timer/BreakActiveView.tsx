import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Heart } from 'lucide-react';
import { BreakRecord } from '../../types';

interface BreakActiveViewProps {
  activeBreak: BreakRecord | null;
  breakSecondsElapsed: number;
  onEndBreak: () => void;
}

export const BreakActiveView: React.FC<BreakActiveViewProps> = ({
  activeBreak,
  breakSecondsElapsed,
  onEndBreak
}) => {
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  useEffect(() => {
    const cycle = setInterval(() => {
      const sec = Math.floor(Date.now() / 1000) % 12;
      if (sec < 4) setBreathPhase('Inhale');
      else if (sec < 8) setBreathPhase('Hold');
      else setBreathPhase('Exhale');
    }, 1000);
    return () => clearInterval(cycle);
  }, []);

  const minutes = Math.floor(breakSecondsElapsed / 60);
  const seconds = breakSecondsElapsed % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const getBreakIcon = (type?: string) => {
    switch (type) {
      case 'toilet': return '🚽';
      case 'snack': return '🍎';
      case 'eye_rest': return '👁️';
      case 'stretch': return '🧘';
      default: return '☕';
    }
  };

  return (
    <div className="glass-panel-glow" style={{
      padding: '40px 30px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '380px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Soft Glow */}
      <div style={{
        position: 'absolute',
        width: '280px',
        height: '280px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Break Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
          {getBreakIcon(activeBreak?.type)}
        </div>
        <h2 style={{ fontSize: '1.6rem', color: '#ffffff' }}>
          {activeBreak?.label || 'Rest Period Active'}
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
          NSDR Neuro-Reset Mode • Dopamine Preservation
        </p>
      </div>

      {/* Breathing Guidance Circle */}
      <div style={{
        position: 'relative',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        border: '2px solid rgba(16, 185, 129, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '10px 0 25px 0'
      }} className="animate-breathe">
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '2.2rem',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '-0.02em'
        }}>
          {timeString}
        </div>
        <div style={{
          fontSize: '0.78rem',
          color: 'var(--accent-emerald)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 600,
          marginTop: '4px'
        }}>
          {breathPhase}
        </div>
      </div>

      <p style={{
        fontSize: '0.84rem',
        color: 'var(--text-muted)',
        maxWidth: '360px',
        lineHeight: 1.5,
        marginBottom: '26px'
      }}>
        {activeBreak?.type === 'eye_rest' 
          ? 'Look 20 feet (6 meters) into the distance to fully unlock ciliary muscles and reduce brain strain.'
          : 'Avoid phones and social algorithms. Let your prefrontal cortex clear residual working memory.'}
      </p>

      {/* Resume Button */}
      <button
        className="btn btn-success"
        onClick={onEndBreak}
        style={{
          padding: '12px 28px',
          fontSize: '1rem',
          boxShadow: '0 0 25px rgba(16, 185, 129, 0.35)'
        }}
      >
        <Play size={18} /> Finish Break & Resume Focus
      </button>
    </div>
  );
};

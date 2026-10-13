import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, Flame, Zap, Award, ArrowRight, Brain, Clock, ShieldCheck } from 'lucide-react';
import { KuaKuaData } from '../../types/skills';

interface KuaKuaModalProps {
  data: KuaKuaData | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSkillTree?: () => void;
}

export const KuaKuaModal: React.FC<KuaKuaModalProps> = ({
  data,
  isOpen,
  onClose,
  onOpenSkillTree
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire celebratory confetti explosion
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899']
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899']
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen]);

  if (!isOpen || !data) return null;

  return (
    <div 
      className="modal-overlay"
      style={{
        zIndex: 1000,
        backgroundColor: 'rgba(5, 7, 18, 0.88)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel-glow"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '24px',
          padding: '36px 32px',
          border: '1.5px solid rgba(139, 92, 246, 0.45)',
          boxShadow: '0 0 60px rgba(139, 92, 246, 0.25), 0 20px 40px rgba(0,0,0,0.8)',
          position: 'relative'
        }}
      >
        {/* Ambient Top Glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '320px',
          height: '140px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Celebration Header Badge */}
        <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative' }}>
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: data.isDailyGoalChampion 
              ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' 
              : 'var(--gradient-neuro)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 35px rgba(139, 92, 246, 0.6), 0 0 15px rgba(6, 182, 212, 0.5)',
            animation: 'pulseGlow 3s infinite ease-in-out'
          }}>
            {data.isDailyGoalChampion ? (
              <Trophy size={40} color="#ffffff" />
            ) : (
              <Flame size={40} color="#ffffff" />
            )}
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.08)', padding: '4px 14px', borderRadius: '20px', marginBottom: '10px' }}>
            <Sparkles size={14} color="#f59e0b" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#f59e0b' }}>
              {data.isDailyGoalChampion ? 'DAILY CHAMPION MILESTONE' : 'AI KUA KUA • 夸夸大仙专属赞美'}
            </span>
          </div>

          <h2 style={{
            fontSize: '1.9rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #67e8f9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
            lineHeight: 1.25,
            marginTop: '4px'
          }}>
            {data.headline}
          </h2>
        </div>

        {/* Chinese Praise Banner (夸夸精华) */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.16) 0%, rgba(6, 182, 212, 0.12) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '16px',
          padding: '18px 22px',
          marginBottom: '20px',
          position: 'relative',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>💬</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              PREFRONTAL HYPE / 极致夸夸
            </span>
          </div>
          <p style={{
            fontSize: '1.02rem',
            color: '#f8fafc',
            lineHeight: 1.65,
            fontWeight: 500,
            margin: 0
          }}>
            "{data.praiseQuoteZh}"
          </p>
          <p style={{
            fontSize: '0.84rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            marginTop: '10px',
            fontStyle: 'italic',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '8px',
            marginBottom: 0
          }}>
            "{data.praiseQuote}"
          </p>
        </div>

        {/* Timeline Reconstructed by Gemini Vision */}
        {data.timelineObservations?.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '18px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Clock size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AI Optical Timeline — Observed Focus Milestones
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.timelineObservations.map((obs, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  borderLeft: '3px solid var(--accent-cyan)'
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--accent-cyan)',
                    background: 'rgba(6, 182, 212, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    whiteSpace: 'nowrap'
                  }}>
                    Min {obs.minute}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.84rem', color: '#ffffff' }}>
                      {obs.activity}
                    </div>
                  </div>
                  <span className="badge badge-flow" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                    {obs.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills XP Gained Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {/* Hard Skills */}
          <div style={{
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: '14px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Zap size={15} color="var(--accent-purple)" />
              <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-purple)' }}>
                Hard Skills Exercised
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.hardSkillsGained.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <span style={{ color: '#ffffff', fontWeight: 500 }}>{h.skill}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-purple)' }}>
                    +{h.xp} XP
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Soft Skills */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '14px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <ShieldCheck size={15} color="var(--accent-emerald)" />
              <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-emerald)' }}>
                Cognitive Soft Skills
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.softSkillsGained.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <span style={{ color: '#ffffff', fontWeight: 500 }}>{s.skill}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    +{s.xp} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Neuro-Coaching Tip */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Brain size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.82rem', color: '#fef3c7', lineHeight: 1.45 }}>
            <span style={{ fontWeight: 700, color: '#f59e0b' }}>Neuro-Optimization: </span>
            {data.coachingTip}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {onOpenSkillTree && (
            <button
              className="btn btn-outline"
              onClick={() => {
                onClose();
                onOpenSkillTree();
              }}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '0.92rem',
                borderColor: 'var(--accent-purple)',
                color: '#ffffff'
              }}
            >
              <Award size={18} color="var(--accent-purple)" />
              Inspect Radial Skill Tree
            </button>
          )}

          <button
            className="btn btn-primary"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 24px',
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            Claim Rewards & Continue <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

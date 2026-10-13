import React from 'react';
import { Camera, CameraOff, RefreshCw, Eye, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { AttentionSnapshot } from '../../types';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraActive: boolean;
  cameraError: string | null;
  onStartCamera: () => void;
  onStopCamera: () => void;
  lastSnapshot: AttentionSnapshot | null;
  isAnalyzing: boolean;
  onEvaluateNow: () => void;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  videoRef,
  cameraActive,
  cameraError,
  onStartCamera,
  onStopCamera,
  lastSnapshot,
  isAnalyzing,
  onEvaluateNow
}) => {
  const getStatusColor = (state?: string) => {
    switch (state) {
      case 'Deep_Flow': return 'var(--accent-purple)';
      case 'Focused': return 'var(--accent-emerald)';
      case 'Distracted': return 'var(--accent-rose)';
      case 'Away': return 'var(--accent-amber)';
      case 'Drowsy': return 'var(--accent-cyan)';
      default: return 'var(--text-dim)';
    }
  };

  return (
    <div className="glass-panel" style={{
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      position: 'relative'
    }}>
      {/* HUD Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1rem', color: '#ffffff' }}>Neural Vision Sensor</h3>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {cameraActive && (
            <button
              className="btn btn-secondary"
              onClick={onEvaluateNow}
              disabled={isAnalyzing}
              title="Trigger instant Gemini multimodal attention evaluation"
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
            >
              <RefreshCw size={13} className={isAnalyzing ? 'animate-spin' : ''} />
              {isAnalyzing ? 'Scanning...' : 'Scan Now'}
            </button>
          )}

          <button
            className={`btn ${cameraActive ? 'btn-danger' : 'btn-primary'}`}
            onClick={cameraActive ? onStopCamera : onStartCamera}
            style={{ padding: '6px 14px', fontSize: '0.78rem' }}
          >
            {cameraActive ? <><CameraOff size={14} /> Turn Off</> : <><Camera size={14} /> Enable Camera</>}
          </button>
        </div>
      </div>

      {/* Video Viewport / Cyber Overlay */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '240px',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: '#04060d',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Real Video Element */}
        <video
          ref={videoRef as React.LegacyRef<HTMLVideoElement>}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)', // Mirror effect
            display: cameraActive ? 'block' : 'none'
          }}
        />

        {/* If Camera Off */}
        {!cameraActive && (
          <div style={{ textAlign: 'center', padding: '20px', zIndex: 10 }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              border: '1px solid var(--border-subtle)'
            }}>
              <Camera size={26} color="var(--text-dim)" />
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Optical Sensor Offline
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', maxWidth: '240px', margin: '4px auto 14px auto' }}>
              Enable camera to track gaze, detect away periods, and evaluate focus in real-time.
            </div>
            <button
              className="btn btn-primary"
              onClick={onStartCamera}
              style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            >
              Open Camera
            </button>
          </div>
        )}

        {/* Cyber HUD Overlays (When Camera Active) */}
        {cameraActive && (
          <>
            {/* Corner Brackets */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', width: '20px', height: '20px', borderTop: '2px solid var(--accent-cyan)', borderLeft: '2px solid var(--accent-cyan)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '10px', right: '10px', width: '20px', height: '20px', borderTop: '2px solid var(--accent-cyan)', borderRight: '2px solid var(--accent-cyan)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '20px', height: '20px', borderBottom: '2px solid var(--accent-cyan)', borderLeft: '2px solid var(--accent-cyan)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '20px', height: '20px', borderBottom: '2px solid var(--accent-cyan)', borderRight: '2px solid var(--accent-cyan)', pointerEvents: 'none' }} />

            {/* Scanning line animation */}
            {isAnalyzing && (
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #06b6d4, #8b5cf6, transparent)',
                boxShadow: '0 0 10px #06b6d4',
                animation: 'scannerSweep 1.5s infinite ease-in-out',
                pointerEvents: 'none'
              }} />
            )}

            {/* Live Reticle Center Target */}
            <div style={{
              position: 'absolute',
              width: '80px',
              height: '80px',
              border: '1px dashed rgba(6, 182, 212, 0.4)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />

            {/* Live Status Badge overlay on video */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(5, 7, 15, 0.75)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${getStatusColor(lastSnapshot?.attentionState)}`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: getStatusColor(lastSnapshot?.attentionState)
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'currentColor',
                boxShadow: '0 0 6px currentColor'
              }} />
              {lastSnapshot ? lastSnapshot.attentionState.replace('_', ' ') : 'ALIGNING SENSOR...'}
            </div>

            {/* Presence indicator overlay */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(5, 7, 15, 0.75)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: lastSnapshot?.isPresent === false ? 'var(--accent-rose)' : 'var(--accent-emerald)'
            }}>
              {lastSnapshot?.isPresent === false ? '⚠️ AWAY FROM DESK' : '✓ AT DESK'}
            </div>
          </>
        )}
      </div>

      {/* Camera Error Alert */}
      {cameraError && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#fda4af',
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={15} />
          <span>{cameraError} — Please allow browser camera permissions.</span>
        </div>
      )}

      {/* AI Feedback Ticker */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px'
      }}>
        <Activity size={16} color="var(--accent-purple)" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Gemini Cognitive Feedback
          </div>
          <div style={{ fontSize: '0.82rem', color: '#ffffff', marginTop: '2px', lineHeight: 1.4 }}>
            {lastSnapshot?.feedback || 'Sensor standing by. Start session to calibrate attention trajectory.'}
          </div>
          {lastSnapshot?.expression && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Detected Expression: <span style={{ color: 'var(--text-accent)' }}>{lastSnapshot.expression}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

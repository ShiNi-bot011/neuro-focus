import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Database, Key } from 'lucide-react';
import { isUsingRealFirebase } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<unknown>;
  onRegister: (email: string, pass: string, name: string) => Promise<unknown>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFirebaseInfo, setShowFirebaseInfo] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister(email, password, displayName);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isReal = isUsingRealFirebase();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass-panel-glow" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: '#ffffff' }}>
              {mode === 'login' ? 'Sync Across Devices' : 'Create Neuro Account'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Access your focus records, vision boards, and streaks anywhere.
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

        {/* Sync Engine Status Indicator */}
        <div style={{
          background: isReal ? 'rgba(16, 185, 129, 0.12)' : 'rgba(139, 92, 246, 0.12)',
          border: `1px solid ${isReal ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={15} color={isReal ? 'var(--accent-emerald)' : 'var(--accent-purple)'} />
            <span>
              {isReal ? 'Connected to Firebase Cloud' : 'Multi-Device Account Cloud (Ready)'}
            </span>
          </div>
          <button 
            type="button"
            onClick={() => setShowFirebaseInfo(!showFirebaseInfo)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--accent-cyan)', 
              fontSize: '0.75rem', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {showFirebaseInfo ? 'Hide' : 'Info'}
          </button>
        </div>

        {showFirebaseInfo && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5
          }}>
            <p>💡 <strong>Universal Cross-Device Access:</strong> Any account registered here syncs state, focus sessions, heatmap history, and generated vision boards seamlessly.</p>
            <p style={{ marginTop: '6px' }}>To link directly to your own Firebase console, provide `VITE_FIREBASE_API_KEY` and project variables in `.env`.</p>
          </div>
        )}

        {/* Mode Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            className="btn"
            style={{
              padding: '8px',
              fontSize: '0.85rem',
              background: mode === 'login' ? 'var(--accent-purple)' : 'transparent',
              color: mode === 'login' ? '#ffffff' : 'var(--text-muted)'
            }}
            onClick={() => { setMode('login'); setError(null); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className="btn"
            style={{
              padding: '8px',
              fontSize: '0.85rem',
              background: mode === 'register' ? 'var(--accent-purple)' : 'transparent',
              color: mode === 'register' ? '#ffffff' : 'var(--text-muted)'
            }}
            onClick={() => { setMode('register'); setError(null); }}
          >
            Register
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.82rem',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Display Name / Moniker
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Neo or Dr. Focus"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'rgba(10, 15, 30, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  background: 'rgba(10, 15, 30, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  background: 'rgba(10, 15, 30, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: '8px', padding: '12px' }}
          >
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In & Load Profile' : 'Initialize Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            🔒 End-to-end synced profile • Cross-device session persistence
          </p>
        </div>
      </div>
    </div>
  );
};

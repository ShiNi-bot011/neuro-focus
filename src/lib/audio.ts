/**
 * Web Audio API synthesizer for Neuro Focus Engine
 * Generates organic binaural tones, alert chimes, and flow gong entirely in-browser.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private binauralOsc1: OscillatorNode | null = null;
  private binauralOsc2: OscillatorNode | null = null;
  private binauralGain: GainNode | null = null;
  public isBinauralPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** Soft meditative bell for session start */
  public playFocusStart() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, now); // 528 Hz - "Love/Repair" Solfeggio frequency
      osc.frequency.exponentialRampToValueAtTime(264, now + 1.8);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 2.0);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  /** Calming break chime */
  public playBreakChime() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      const notes = [440, 554.37, 659.25]; // A major triad
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        gain.gain.setValueAtTime(0.2, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 1.2);
      });
    } catch {
      // Audio context error ignore
    }
  }

  /** Attention alert (discrete gentle double chime when looking away) */
  public playAttentionAlert() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;

      [600, 750].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.2, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.35);
      });
    } catch {
      // Audio error
    }
  }

  /** Level Up / Achievement Fanfare */
  public playLevelUp() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const notes = [440, 554, 659, 880];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.25, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.8);
      });
    } catch {
      // Audio error
    }
  }

  /** Alpha Waves (10 Hz Binaural Beat) toggle for deep focus immersion */
  public toggleBinauralAlpha(enable: boolean) {
    const ctx = this.initCtx();
    if (!enable) {
      if (this.binauralOsc1) {
        this.binauralOsc1.stop();
        this.binauralOsc1.disconnect();
        this.binauralOsc1 = null;
      }
      if (this.binauralOsc2) {
        this.binauralOsc2.stop();
        this.binauralOsc2.disconnect();
        this.binauralOsc2 = null;
      }
      this.isBinauralPlaying = false;
      return;
    }

    if (this.isBinauralPlaying) return;

    try {
      const now = ctx.currentTime;
      const merger = ctx.createChannelMerger(2);
      this.binauralGain = ctx.createGain();
      this.binauralGain.gain.setValueAtTime(0.05, now); // Gentle background volume

      // Left ear: 200 Hz
      this.binauralOsc1 = ctx.createOscillator();
      this.binauralOsc1.frequency.setValueAtTime(200, now);
      this.binauralOsc1.connect(merger, 0, 0);

      // Right ear: 210 Hz -> 10 Hz Alpha frequency difference
      this.binauralOsc2 = ctx.createOscillator();
      this.binauralOsc2.frequency.setValueAtTime(210, now);
      this.binauralOsc2.connect(merger, 0, 1);

      merger.connect(this.binauralGain);
      this.binauralGain.connect(ctx.destination);

      this.binauralOsc1.start();
      this.binauralOsc2.start();
      this.isBinauralPlaying = true;
    } catch {
      this.isBinauralPlaying = false;
    }
  }
}

export const soundFx = new SoundSynthesizer();

/**
 * Web Audio API synthesizer for interactive classroom sound effects.
 * 100% self-contained, no external audio files required.
 */

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public playTone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.3) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const effectiveGain = gainVal * this.volume;
      gain.gain.setValueAtTime(effectiveGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context might be restricted before first user interaction
    }
  }

  /**
   * Cheerful ascending chime for correct answers: C5 -> E5 -> G5 -> C6
   */
  public playCorrect() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.25, 'triangle', 0.25);
      }, idx * 70);
    });
  }

  /**
   * Subtle descending buzz for incorrect attempts
   */
  public playIncorrect() {
    if (this.isMuted) return;
    this.playTone(220, 0.2, 'sawtooth', 0.15);
    setTimeout(() => {
      this.playTone(180, 0.3, 'sawtooth', 0.15);
    }, 150);
  }

  /**
   * High-pitch star ping when positive points are awarded
   */
  public playPointAwarded() {
    if (this.isMuted) return;
    this.playTone(880, 0.15, 'sine', 0.25);
    setTimeout(() => {
      this.playTone(1174.66, 0.3, 'triangle', 0.25);
    }, 80);
  }

  /**
   * Soft warning tone for deductions
   */
  public playPointDeducted() {
    if (this.isMuted) return;
    this.playTone(320, 0.25, 'sine', 0.2);
  }

  /**
   * Subtle tick for timer or spinner
   */
  public playTick() {
    if (this.isMuted) return;
    this.playTone(1000, 0.03, 'sine', 0.05);
  }

  /**
   * Timer urgent warning (last 3 seconds)
   */
  public playWarningTick() {
    if (this.isMuted) return;
    this.playTone(660, 0.08, 'square', 0.12);
  }

  /**
   * Timer finished bell chime
   */
  public playTimerEnded() {
    if (this.isMuted) return;
    const freqs = [587.33, 880, 1174.66];
    freqs.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.6, 'sine', 0.25), i * 120);
    });
  }

  /**
   * Group victory fanfare
   */
  public playVictoryFanfare() {
    if (this.isMuted) return;
    const melody = [
      { f: 523.25, d: 0.12 },
      { f: 523.25, d: 0.12 },
      { f: 523.25, d: 0.12 },
      { f: 659.25, d: 0.35 },
      { f: 587.33, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.5 }
    ];

    let t = 0;
    melody.forEach(item => {
      setTimeout(() => {
        this.playTone(item.f, item.d, 'triangle', 0.3);
      }, t);
      t += item.d * 1000 * 0.9;
    });
  }
}

export const soundEffects = new SoundEffectsManager();

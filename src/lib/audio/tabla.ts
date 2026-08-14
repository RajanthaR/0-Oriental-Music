/**
 * Web Audio Synthetic Tabla Engine
 * Synthesizes classic Indian percussion strokes (Dayan & Bayan physical modeling).
 * 100% browser-native Web Audio without recorded samples.
 */

class TablaSynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  /**
   * Synthesize Dayan (Treble Drum) open ringing stroke (Na / Ta)
   */
  private playDayanOpen(baseFreq: number = 293.66, duration: number = 0.5) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const gain = this.ctx.createGain();
    gain.connect(this.masterGain);

    // Fundamental and rim overtone
    const osc1 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(baseFreq, now);

    const osc2 = this.ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(baseFreq * 2.89, now); // Anharmonic rim overtone

    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.3, now);
    osc2.connect(g2);
    g2.connect(gain);
    osc1.connect(gain);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.8, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  /**
   * Synthesize Dayan closed/damped stroke (Tin / Te / Ke)
   */
  private playDayanClosed(baseFreq: number = 293.66, duration: number = 0.15) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const gain = this.ctx.createGain();
    gain.connect(this.masterGain);

    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.connect(gain);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.6, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  /**
   * Synthesize Bayan (Bass Drum) resonant resonant stroke with gentle modulation (Ge / Ghe)
   */
  private playBayanBass(pitchBend: boolean = true, duration: number = 0.6) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const gain = this.ctx.createGain();
    gain.connect(this.masterGain);

    const osc = this.ctx.createOscillator();
    osc.type = "sine";

    const startFreq = 80;
    const peakFreq = pitchBend ? 120 : 85;
    const endFreq = 65;

    osc.frequency.setValueAtTime(startFreq, now);
    if (pitchBend) {
      osc.frequency.exponentialRampToValueAtTime(peakFreq, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    } else {
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    }

    osc.connect(gain);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.9, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  /**
   * Play any standard Tabla Bol
   */
  public playBol(bolName: string) {
    if (typeof window === "undefined") return;
    this.initContext();
    const clean = bolName.trim().toLowerCase();

    if (clean === "dha" || clean === "ධා") {
      this.playBayanBass(true, 0.65);
      this.playDayanOpen(293.66, 0.5);
    } else if (clean === "dhin" || clean === "ධින්") {
      this.playBayanBass(false, 0.55);
      this.playDayanClosed(293.66, 0.3);
    } else if (clean === "ge" || clean === "ගේ" || clean === "ghe") {
      this.playBayanBass(true, 0.6);
    } else if (clean === "na" || clean === "නා" || clean === "ta" || clean === "තා") {
      this.playDayanOpen(293.66, 0.45);
    } else if (clean === "tin" || clean === "තින්") {
      this.playDayanClosed(293.66, 0.35);
    } else if (clean === "te" || clean === "තෙ" || clean === "ti" || clean === "කේ" || clean === "ke") {
      this.playDayanClosed(220, 0.12);
    } else {
      // General click
      this.playDayanClosed(260, 0.2);
    }
  }
}

export const tablaSynth = new TablaSynthEngine();

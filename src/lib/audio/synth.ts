/**
 * Web Audio Swara Synthesizer
 * Provides pure browser-native synthesis for Swaras in Indian/Sri Lankan Classical Music.
 * No external sound files or copyrighted samples are used.
 */

export interface SwaraPitchInfo {
  swara_si: string;
  swara_en: string;
  type: "shuddha" | "komal" | "teevra" | "achala";
  semitonesFromSa: number;
}

export const SWARA_SEMITONES: Record<string, SwaraPitchInfo> = {
  // Achala Swaras
  "S": { swara_si: "ස", swara_en: "Sa", type: "achala", semitonesFromSa: 0 },
  "P": { swara_si: "ප", swara_en: "Pa", type: "achala", semitonesFromSa: 7 },

  // Komal & Shuddha Pairs
  "r": { swara_si: "රි (කෝ)", swara_en: "re (komal)", type: "komal", semitonesFromSa: 1 },
  "R": { swara_si: "රි", swara_en: "Re (shuddha)", type: "shuddha", semitonesFromSa: 2 },
  "g": { swara_si: "ග (කෝ)", swara_en: "ga (komal)", type: "komal", semitonesFromSa: 3 },
  "G": { swara_si: "ග", swara_en: "Ga (shuddha)", type: "shuddha", semitonesFromSa: 4 },
  "M": { swara_si: "ම", swara_en: "Ma (shuddha)", type: "shuddha", semitonesFromSa: 5 },
  "m": { swara_si: "ම (තී)", swara_en: "ma (teevra)", type: "teevra", semitonesFromSa: 6 },
  "d": { swara_si: "ධ (කෝ)", swara_en: "dha (komal)", type: "komal", semitonesFromSa: 8 },
  "D": { swara_si: "ධ", swara_en: "Dha (shuddha)", type: "shuddha", semitonesFromSa: 9 },
  "n": { swara_si: "නි (කෝ)", swara_en: "ni (komal)", type: "komal", semitonesFromSa: 10 },
  "N": { swara_si: "නි", swara_en: "Ni (shuddha)", type: "shuddha", semitonesFromSa: 11 },

  // Tara Saptaka Sa
  "S'": { swara_si: "ස̇ (තාර)", swara_en: "Sa' (tara)", type: "achala", semitonesFromSa: 12 },
  // Mandra Saptaka Sa
  ".S": { swara_si: "ස̣ (මන්ද්‍ර)", swara_en: ".Sa (mandra)", type: "achala", semitonesFromSa: -12 },
};

// Root Sa standard frequency: Middle C (C4 = 261.63Hz) or C#4 (277.18Hz)
export const DEFAULT_ROOT_FREQ = 261.63; // C4

export function getSwaraFrequency(swaraNotation: string, rootFreq: number = DEFAULT_ROOT_FREQ): number {
  const safeRootFreq = typeof rootFreq === "number" && isFinite(rootFreq) && rootFreq > 0 ? rootFreq : DEFAULT_ROOT_FREQ;
  if (!swaraNotation || typeof swaraNotation !== "string") return safeRootFreq;

  let clean = swaraNotation.trim();
  let octaveShift = 0;

  if (clean.endsWith("'") || clean.endsWith("̇")) {
    octaveShift = 12;
    clean = clean.replace(/['̇]/g, "");
  } else if (clean.startsWith(".") || clean.endsWith("̣")) {
    octaveShift = -12;
    clean = clean.replace(/[.̣]/g, "");
  }

  const info = SWARA_SEMITONES[clean];
  if (!info) return safeRootFreq;

  const totalSemitones = info.semitonesFromSa + octaveShift;
  return safeRootFreq * Math.pow(2, totalSemitones / 12);
}

export class SwaraSynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private async initContext(): Promise<boolean> {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return false;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") await this.ctx.resume();
      return this.ctx.state !== "closed";
    } catch {
      const failedContext = this.ctx;
      this.ctx = null;
      this.masterGain = null;
      if (failedContext && failedContext.state !== "closed") {
        try {
          await failedContext.close();
        } catch {
          // The context is already unusable; clearing the references is the fail-closed path.
        }
      }
      return false;
    }
  }

  /**
   * Play a single swara tone with harmonium-like acoustic rich overtones
   */
  public async playSwaraTone(
    swara: string,
    durationSec: number = 0.8,
    rootFreq: number = DEFAULT_ROOT_FREQ,
    timbre: "harmonium" | "flute" | "sitar" | "pure" = "harmonium"
  ): Promise<boolean> {
    if (typeof window === "undefined" || !swara || typeof swara !== "string") return false;
    if (!(await this.initContext()) || !this.ctx || !this.masterGain) return false;

    const freq = getSwaraFrequency(swara, rootFreq);
    if (!isFinite(freq) || freq <= 0) return false;

    try {
      const now = this.ctx.currentTime;

      const noteGain = this.ctx.createGain();
      noteGain.connect(this.masterGain);

      if (timbre === "harmonium") {
      // Additive harmonics for reedy harmonium texture
      const harmonics = [1, 2, 3, 4, 5, 6];
      const gains = [0.4, 0.35, 0.2, 0.15, 0.08, 0.04];

      harmonics.forEach((h, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = idx % 2 === 0 ? "sawtooth" : "triangle";
        osc.frequency.setValueAtTime(freq * h, now);

        const hGain = this.ctx.createGain();
        hGain.gain.setValueAtTime(gains[idx], now);
        osc.connect(hGain);
        hGain.connect(noteGain);

        osc.start(now);
        osc.stop(now + durationSec + 0.1);
      });

      // Envelope
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.5, now + 0.05);
      noteGain.gain.setValueAtTime(0.45, now + durationSec * 0.8);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
      } else if (timbre === "flute") {
      // Gentle sine + slight octave harmonic with breath-like attack
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      const osc2 = this.ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 2, now);

      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0.1, now);

      osc.connect(noteGain);
      osc2.connect(g2);
      g2.connect(noteGain);

      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.4, now + 0.1);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + durationSec + 0.05);
      osc2.stop(now + durationSec + 0.05);
      } else {
      // Default pure tone
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(noteGain);

      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.4, now + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.start(now);
      osc.stop(now + durationSec + 0.05);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Play a sequence of swaras (e.g. Aarohana / Avarohana / Pakad)
   */
  public async playSequence(
    swaras: string[],
    noteDurationSec: number = 0.6,
    onStep?: (index: number, swara: string) => void,
    rootFreq: number = DEFAULT_ROOT_FREQ,
    timbre: "harmonium" | "flute" | "sitar" | "pure" = "harmonium"
  ): Promise<boolean> {
    for (let i = 0; i < swaras.length; i++) {
      const swara = swaras[i];
      if (onStep) onStep(i, swara);
      const played = await this.playSwaraTone(swara, noteDurationSec, rootFreq, timbre);
      if (!played) return false;
      await new Promise((resolve) => setTimeout(resolve, noteDurationSec * 1000));
    }
    return true;
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }
}

export const swaraSynth = new SwaraSynthEngine();

/**
 * Web Audio Tanpura Drone Synthesizer
 * Generates continuous meditative overtone-rich acoustic Tanpura drone without recorded loops.
 */

export type TanpuraFirstString = "Pa" | "Ma" | "Ni" | "Sa";

export interface TanpuraSettings {
  rootPitchName: string; // "C", "C#", "D", "D#", "E"
  rootFreq: number; // e.g. 130.81 (C3) or 138.59 (C#3)
  firstString: TanpuraFirstString;
  tempoSec: number; // Pluck interval between strings (default 1.2s)
  volume: number; // 0.0 to 1.0
}

import { resumeAudioContext } from "./context";

export const ROOT_PITCHES: { name: string; freq: number }[] = [
  { name: "C (ස)", freq: 130.81 },
  { name: "C# (ස - සුලබ)", freq: 138.59 },
  { name: "D (රි)", freq: 146.83 },
  { name: "D# (රි - කෝ)", freq: 155.56 },
  { name: "E (ග)", freq: 164.81 },
  { name: "F (ම)", freq: 174.61 },
  { name: "G (ප)", freq: 196.00 },
  { name: "A (ධ)", freq: 220.00 },
];

class TanpuraEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initPromise: Promise<boolean> | null = null;
  private isRunning: boolean = false;
  private timerId: NodeJS.Timeout | number | null = null;
  private currentStringIndex: number = 0;
  private settings: TanpuraSettings = {
    rootPitchName: "C# (ස - සුලබ)",
    rootFreq: 138.59,
    firstString: "Pa",
    tempoSec: 1.1,
    volume: 0.7,
  };
  private onPluckCallback?: (stringIndex: number, stringName: string) => void;

  private async runContextInit(): Promise<boolean> {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return false;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.settings.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") await resumeAudioContext(this.ctx);
      return this.ctx.state !== "closed";
    } catch {
      return false;
    }
  }

  private async initContext(): Promise<boolean> {
    if (this.initPromise) return this.initPromise;
    const attempt = this.runContextInit();
    this.initPromise = attempt;
    void attempt.finally(() => {
      if (this.initPromise === attempt) this.initPromise = null;
    });
    return attempt;
  }

  public getSettings(): TanpuraSettings {
    return { ...this.settings };
  }

  public setSettings(newSettings: Partial<TanpuraSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (this.masterGain && this.ctx && newSettings.volume !== undefined) {
      this.masterGain.gain.setValueAtTime(newSettings.volume, this.ctx.currentTime);
    }
  }

  public setOnPluck(callback: (stringIndex: number, stringName: string) => void) {
    this.onPluckCallback = callback;
  }

  /**
   * Pluck a single Tanpura string with Jawari overtone buzz simulation
   */
  private pluckString(freq: number, durationSec: number = 3.5) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const stringGain = this.ctx.createGain();
    stringGain.connect(this.masterGain);

    // Jawari harmonic profile with subtle detuning for shimmer
    const harmonics = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const amplitudes = [0.5, 0.4, 0.3, 0.25, 0.18, 0.12, 0.08, 0.05, 0.03, 0.02];

    harmonics.forEach((h, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      // Alternate sawtooth and sine for metallic string buzz
      osc.type = i % 2 === 0 ? "sawtooth" : "sine";
      
      // Slight chorus detune for organic buzz
      const detune = (Math.random() - 0.5) * 3;
      osc.frequency.setValueAtTime(freq * h, now);
      osc.detune.setValueAtTime(detune, now);

      const hGain = this.ctx.createGain();
      hGain.gain.setValueAtTime(amplitudes[i], now);
      osc.connect(hGain);
      hGain.connect(stringGain);

      osc.start(now);
      osc.stop(now + durationSec);
    });

    // String pluck envelope: snappy attack, long resonant exponential decay
    stringGain.gain.setValueAtTime(0.0001, now);
    stringGain.gain.linearRampToValueAtTime(0.6, now + 0.03);
    stringGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
  }

  private stepPluck() {
    if (!this.isRunning || !this.ctx) return;

    // String definitions based on tuning:
    // String 0: First string (Pa / Ma / Ni / Sa)
    // String 1: Middle string 1 (Madhya/Tara Sa - octave higher than root)
    // String 2: Middle string 2 (Madhya/Tara Sa - octave higher than root)
    // String 3: Mandra Sa (Root fundamental)
    let freq = this.settings.rootFreq;
    let stringName = "";

    if (this.currentStringIndex === 0) {
      if (this.settings.firstString === "Pa") {
        freq = this.settings.rootFreq * 1.5; // Perfect 5th
        stringName = "ප (Pa - පඤ්චම)";
      } else if (this.settings.firstString === "Ma") {
        freq = this.settings.rootFreq * (4 / 3); // Perfect 4th
        stringName = "ම (Ma - මධ්‍යම)";
      } else if (this.settings.firstString === "Ni") {
        freq = this.settings.rootFreq * (15 / 8); // Major 7th
        stringName = "නි (Ni - නිෂාද)";
      } else {
        freq = this.settings.rootFreq * 2;
        stringName = "ස (Sa - තාර)";
      }
    } else if (this.currentStringIndex === 1 || this.currentStringIndex === 2) {
      freq = this.settings.rootFreq * 2; // Tara Sa
      stringName = `ස̇ (Sa' - ජෝඩි ${this.currentStringIndex})`;
    } else {
      freq = this.settings.rootFreq; // Mandra / Kharaj Sa
      stringName = "ස̣ (Kharaj Sa - මන්ද්‍ර)";
    }

    if (this.onPluckCallback) {
      this.onPluckCallback(this.currentStringIndex, stringName);
    }

    this.pluckString(freq);

    this.currentStringIndex = (this.currentStringIndex + 1) % 4;

    this.timerId = setTimeout(() => {
      this.stepPluck();
    }, this.settings.tempoSec * 1000);
  }

  public async start(): Promise<void> {
    if (typeof window === "undefined") return;
    const ok = await this.initContext();
    if (!ok) return;
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentStringIndex = 0;
    this.stepPluck();
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId as number);
      this.timerId = null;
    }
  }

  public toggle(): boolean {
    if (this.isRunning) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }
}

export const tanpuraSynth = new TanpuraEngine();

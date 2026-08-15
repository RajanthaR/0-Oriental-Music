/**
 * Web Audio Synthetic Tabla Engine
 * Synthesizes classic Indian percussion strokes (Dayan & Bayan physical modeling).
 * 100% browser-native Web Audio without recorded samples.
 */

export type TablaStrokeKind =
  | "rest"
  | "combined-open"
  | "combined-closed"
  | "bass"
  | "open"
  | "closed"
  | "fallback";

export interface PlannedTablaStroke {
  bol: string;
  kind: TablaStrokeKind;
  delayMs: number;
}

export interface TablaTimerApi<TTimer = number> {
  set: (callback: () => void, delayMs: number) => TTimer;
  clear: (timer: TTimer) => void;
}

export function scheduleTablaPlan<TTimer>(
  plan: PlannedTablaStroke[],
  onStroke: (stroke: PlannedTablaStroke) => void,
  timerApi: TablaTimerApi<TTimer>
): () => void {
  const timers: TTimer[] = [];
  plan.forEach((stroke) => {
    if (stroke.delayMs === 0) onStroke(stroke);
    else timers.push(timerApi.set(() => onStroke(stroke), stroke.delayMs));
  });
  return () => timers.forEach((timer) => timerApi.clear(timer));
}

export function expandTablaBol(bolName: string): string[] {
  const clean = typeof bolName === "string" ? bolName.trim().toLowerCase() : "";
  if (!clean || clean === "-" || clean === "s") return [];
  const compoundCells: Record<string, string[]> = {
    "ධන්න": ["ධ", "න", "න"],
    "ධනක": ["ධ", "න", "ක"],
    "තන්න": ["ත", "න", "න"],
  };
  return compoundCells[clean] ?? [clean];
}

export function classifyTablaBol(bolName: string): TablaStrokeKind {
  const clean = typeof bolName === "string" ? bolName.trim().toLowerCase() : "";
  if (!clean || clean === "-" || clean === "s") return "rest";
  if (["dha", "ධා", "ධ"].includes(clean)) return "combined-open";
  if (["dhin", "ධින්", "ධී", "ධි"].includes(clean)) return "combined-closed";
  if (["ge", "ගේ", "ගෙ", "ග", "ghe"].includes(clean)) return "bass";
  if (["na", "නා", "න", "ta", "තා", "ත", "නක"].includes(clean)) return "open";
  if (
    [
      "tin",
      "තින්",
      "තී",
      "ති",
      "තන්න",
      "te",
      "තෙ",
      "ti",
      "කේ",
      "කෙ",
      "ක",
      "ke",
      "කත්",
      "තූ",
      "තු",
    ].includes(clean)
  ) {
    return "closed";
  }
  return "fallback";
}

export function planTablaBol(bolName: string, matraDurationMs: number = 500): PlannedTablaStroke[] {
  const expanded = expandTablaBol(bolName);
  if (expanded.length === 0) return [];
  const subdivisionMs = Math.max(1, matraDurationMs) / expanded.length;
  return expanded.map((bol, index) => ({
    bol,
    kind: classifyTablaBol(bol),
    delayMs: Math.round(index * subdivisionMs),
  }));
}

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
  private playStroke(strokeKind: TablaStrokeKind) {
    if (strokeKind === "combined-open") {
      this.playBayanBass(true, 0.65);
      this.playDayanOpen(293.66, 0.5);
    } else if (strokeKind === "combined-closed") {
      this.playBayanBass(false, 0.55);
      this.playDayanClosed(293.66, 0.3);
    } else if (strokeKind === "bass") {
      this.playBayanBass(true, 0.6);
    } else if (strokeKind === "open") {
      this.playDayanOpen(293.66, 0.45);
    } else if (strokeKind === "closed") {
      this.playDayanClosed(293.66, 0.25);
    } else if (strokeKind === "fallback") {
      this.playDayanClosed(260, 0.2);
    }
  }

  public playBol(bolName: string, matraDurationMs: number = 500): () => void {
    if (typeof window === "undefined" || !bolName || typeof bolName !== "string") return () => undefined;
    const plan = planTablaBol(bolName, matraDurationMs);
    if (plan.length === 0) return () => undefined;

    this.initContext();
    return scheduleTablaPlan(plan, (stroke) => this.playStroke(stroke.kind), {
      set: (callback, delayMs) => window.setTimeout(callback, delayMs),
      clear: (timer) => window.clearTimeout(timer),
    });
  }
}

export const tablaSynth = new TablaSynthEngine();

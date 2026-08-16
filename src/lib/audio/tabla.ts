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

export type TablaPlaybackHandle = (() => void) & {
  ready: Promise<boolean>;
};

type ActiveTablaStroke = {
  cancel: () => void;
  finished: Promise<void>;
};

function createPlaybackHandle(cancel: () => void, ready: Promise<boolean>): TablaPlaybackHandle {
  return Object.assign(cancel, { ready });
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

export class TablaSynthEngine {
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
   * Synthesize Dayan (Treble Drum) open ringing stroke (Na / Ta)
   */
  private createActiveStroke(
    oscillators: AudioScheduledSourceNode[],
    gains: GainNode[],
    durationMs: number
  ): ActiveTablaStroke {
    let finished = false;
    let resolveFinished!: () => void;
    const finishedPromise = new Promise<void>((resolve) => { resolveFinished = resolve; });
    const cleanup = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timerId);
      oscillators.forEach((oscillator) => {
        try { oscillator.stop(); } catch { /* already stopped */ }
        try { oscillator.disconnect(); } catch { /* browser teardown */ }
      });
      gains.forEach((gain) => {
        try { gain.disconnect(); } catch { /* browser teardown */ }
      });
      resolveFinished();
    };
    const timerId = window.setTimeout(cleanup, durationMs);
    return { cancel: cleanup, finished: finishedPromise };
  }

  private playDayanOpen(baseFreq: number = 293.66, duration: number = 0.5): ActiveTablaStroke | undefined {
    if (!this.ctx || !this.masterGain) return undefined;
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
    return this.createActiveStroke([osc1, osc2], [gain, g2], (duration + 0.1) * 1000);
  }

  /**
   * Synthesize Dayan closed/damped stroke (Tin / Te / Ke)
   */
  private playDayanClosed(baseFreq: number = 293.66, duration: number = 0.15): ActiveTablaStroke | undefined {
    if (!this.ctx || !this.masterGain) return undefined;
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
    return this.createActiveStroke([osc], [gain], (duration + 0.07) * 1000);
  }

  /**
   * Synthesize Bayan (Bass Drum) resonant resonant stroke with gentle modulation (Ge / Ghe)
   */
  private playBayanBass(pitchBend: boolean = true, duration: number = 0.6): ActiveTablaStroke | undefined {
    if (!this.ctx || !this.masterGain) return undefined;
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
    return this.createActiveStroke([osc], [gain], (duration + 0.1) * 1000);
  }

  /**
   * Play any standard Tabla Bol
   */
  private playStroke(strokeKind: TablaStrokeKind): ActiveTablaStroke | undefined {
    const strokes: ActiveTablaStroke[] = [];
    const add = (stroke: ActiveTablaStroke | undefined) => {
      if (stroke) strokes.push(stroke);
    };
    if (strokeKind === "combined-open") {
      add(this.playBayanBass(true, 0.65));
      add(this.playDayanOpen(293.66, 0.5));
    } else if (strokeKind === "combined-closed") {
      add(this.playBayanBass(false, 0.55));
      add(this.playDayanClosed(293.66, 0.3));
    } else if (strokeKind === "bass") {
      add(this.playBayanBass(true, 0.6));
    } else if (strokeKind === "open") {
      add(this.playDayanOpen(293.66, 0.45));
    } else if (strokeKind === "closed") {
      add(this.playDayanClosed(293.66, 0.25));
    } else if (strokeKind === "fallback") {
      add(this.playDayanClosed(260, 0.2));
    }
    if (strokes.length === 0) return undefined;
    return {
      cancel: () => strokes.forEach((stroke) => stroke.cancel()),
      finished: Promise.all(strokes.map((stroke) => stroke.finished)).then(() => undefined),
    };
  }

  public playBol(
    bolName: string,
    matraDurationMs: number = 500,
    onUnavailable?: () => void
  ): TablaPlaybackHandle {
    let cancelled = false;
    const unavailable = () => {
      if (cancelled) return false;
      onUnavailable?.();
      return false;
    };
    if (typeof window === "undefined" || !bolName || typeof bolName !== "string") {
      return createPlaybackHandle(() => undefined, Promise.resolve(unavailable()));
    }
    const plan = planTablaBol(bolName, matraDurationMs);
    if (plan.length === 0) return createPlaybackHandle(() => undefined, Promise.resolve(true));

    let cancelScheduled: () => void = () => undefined;
    const activeStrokes = new Set<ActiveTablaStroke>();
    const ready = this.initContext().then((available) => {
      if (cancelled) return false;
      if (!available) return unavailable();
      cancelScheduled = scheduleTablaPlan(plan, (stroke) => {
        if (cancelled) return;
        try {
          const activeStroke = this.playStroke(stroke.kind);
          if (activeStroke) {
            activeStrokes.add(activeStroke);
            void activeStroke.finished.then(() => activeStrokes.delete(activeStroke));
          }
        } catch {
          onUnavailable?.();
        }
      }, {
        set: (callback, delayMs) => window.setTimeout(callback, delayMs),
        clear: (timer) => window.clearTimeout(timer),
      });
      return true;
    }).catch(() => unavailable());

    return createPlaybackHandle(() => {
      cancelled = true;
      cancelScheduled();
      activeStrokes.forEach((stroke) => stroke.cancel());
      activeStrokes.clear();
    }, ready);
  }
}

export const tablaSynth = new TablaSynthEngine();

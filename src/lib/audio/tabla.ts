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
  /** Resolves only after scheduled strokes and their nodes are cleaned up. */
  finished: Promise<void>;
};

type ActiveTablaStroke = {
  cancel: () => void;
  finished: Promise<void>;
};

function createPlaybackHandle(
  cancel: () => void,
  ready: Promise<boolean>,
  finished: Promise<void>
): TablaPlaybackHandle {
  return Object.assign(cancel, { ready, finished });
}

export function scheduleTablaPlan<TTimer>(
  plan: PlannedTablaStroke[],
  onStroke: (stroke: PlannedTablaStroke) => void,
  timerApi: TablaTimerApi<TTimer>
): () => void {
  type TimerEntry = {
    timer: TTimer;
    active: boolean;
  };

  const timers: TimerEntry[] = [];
  let cancelled = false;
  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    // A timer implementation is outside this module's control. Best effort
    // cleanup is deliberately isolated per timer so one throwing clear does
    // not prevent the remaining registrations from being reclaimed.
    timers.splice(0).forEach((entry) => {
      if (!entry.active) return;
      entry.active = false;
      try {
        timerApi.clear(entry.timer);
      } catch {
        // The timer may already have fired or the host may be tearing down.
      }
    });
  };

  try {
    plan.forEach((stroke) => {
      if (cancelled) return;
      if (stroke.delayMs === 0) onStroke(stroke);
      else {
        let entry: TimerEntry | null = null;
        let callbackCompleted = false;
        const run = () => {
          if (cancelled || (entry && !entry.active)) return;
          if (entry) entry.active = false;
          try {
            onStroke(stroke);
          } catch (error) {
            // Delayed callbacks execute outside the registration try/catch.
            // Cancel the remaining plan before preserving the original error.
            cancel();
            throw error;
          } finally {
            if (entry) {
              const index = timers.indexOf(entry);
              if (index >= 0) timers.splice(index, 1);
            }
            callbackCompleted = true;
          }
        };
        const timer = timerApi.set(run, stroke.delayMs);
        entry = { timer, active: !cancelled && !callbackCompleted };
        if (entry.active) timers.push(entry);
        else {
          try {
            timerApi.clear(timer);
          } catch {
            // The timer may have fired synchronously during registration.
          }
        }
      }
    });
  } catch (error) {
    // Registration is transactional: if an immediate callback or a later
    // timer registration fails, no earlier timer may survive the failed plan.
    cancel();
    throw error;
  }

  return cancel;
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
  if (typeof matraDurationMs !== "number" || !Number.isFinite(matraDurationMs) || matraDurationMs <= 0) return [];
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
  private initPromise: Promise<boolean> | null = null;

  private async runContextInit(): Promise<boolean> {
    let attemptedContext: AudioContext | null = null;
    let attemptedMasterGain: GainNode | null = null;
    try {
      if (this.ctx && this.ctx.state !== "closed") {
        attemptedContext = this.ctx;
        attemptedMasterGain = this.masterGain;
      } else {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return false;
        attemptedContext = new AudioCtx();
        const masterGain = attemptedContext.createGain();
        attemptedMasterGain = masterGain;
        masterGain.gain.setValueAtTime(0.7, attemptedContext.currentTime);
        masterGain.connect(attemptedContext.destination);
        this.ctx = attemptedContext;
        this.masterGain = masterGain;
      }
      if (attemptedContext.state === "suspended") await attemptedContext.resume();
      return attemptedContext.state !== "closed" && this.ctx === attemptedContext;
    } catch {
      // Never clear or close a replacement installed after this attempt began.
      if (attemptedContext && this.ctx === attemptedContext) {
        this.ctx = null;
        this.masterGain = null;
      }
      if (attemptedMasterGain) {
        try {
          attemptedMasterGain.disconnect();
        } catch {
          // The graph may have failed before the gain was connected.
        }
      }
      if (attemptedContext && attemptedContext.state !== "closed") {
        try {
          await attemptedContext.close();
        } catch {
          // The context is already unusable; fail closed for this attempt.
        }
      }
      return false;
    }
  }

  private initContext(): Promise<boolean> {
    if (this.initPromise) return this.initPromise;
    const attempt = this.runContextInit();
    this.initPromise = attempt;
    void attempt.finally(() => {
      if (this.initPromise === attempt) this.initPromise = null;
    });
    return attempt;
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
      try {
        try {
          window.clearTimeout(timerId);
        } catch {
          // Timer cancellation is best-effort; owned nodes still need cleanup.
        }
        this.cleanupNodes(oscillators, gains);
      } finally {
        resolveFinished();
      }
    };
    const timerId = window.setTimeout(cleanup, durationMs);
    return { cancel: cleanup, finished: finishedPromise };
  }

  private cleanupNodes(
    oscillators: AudioScheduledSourceNode[],
    gains: GainNode[]
  ): void {
    oscillators.forEach((oscillator) => {
      try { oscillator.stop(); } catch { /* already stopped or partially started */ }
      try { oscillator.disconnect(); } catch { /* browser teardown */ }
    });
    gains.forEach((gain) => {
      try { gain.disconnect(); } catch { /* browser teardown */ }
    });
  }

  private playDayanOpen(baseFreq: number = 293.66, duration: number = 0.5): ActiveTablaStroke | undefined {
    if (!this.ctx || !this.masterGain) return undefined;
    const context = this.ctx;
    const masterGain = this.masterGain;
    const oscillators: AudioScheduledSourceNode[] = [];
    const gains: GainNode[] = [];
    try {
      const now = context.currentTime;
      const gain = context.createGain();
      gains.push(gain);
      gain.connect(masterGain);

      // Fundamental and rim overtone
      const osc1 = context.createOscillator();
      oscillators.push(osc1);
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(baseFreq, now);

      const osc2 = context.createOscillator();
      oscillators.push(osc2);
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(baseFreq * 2.89, now); // Anharmonic rim overtone

      const g2 = context.createGain();
      gains.push(g2);
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
      return this.createActiveStroke(oscillators, gains, (duration + 0.1) * 1000);
    } catch (error) {
      this.cleanupNodes(oscillators, gains);
      throw error;
    }
  }

  /**
   * Synthesize Dayan closed/damped stroke (Tin / Te / Ke)
   */
  private playDayanClosed(baseFreq: number = 293.66, duration: number = 0.15): ActiveTablaStroke | undefined {
    if (!this.ctx || !this.masterGain) return undefined;
    const context = this.ctx;
    const masterGain = this.masterGain;
    const oscillators: AudioScheduledSourceNode[] = [];
    const gains: GainNode[] = [];
    try {
      const now = context.currentTime;
      const gain = context.createGain();
      gains.push(gain);
      gain.connect(masterGain);

      const osc = context.createOscillator();
      oscillators.push(osc);
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.connect(gain);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.6, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.start(now);
      osc.stop(now + duration + 0.02);
      return this.createActiveStroke(oscillators, gains, (duration + 0.07) * 1000);
    } catch (error) {
      this.cleanupNodes(oscillators, gains);
      throw error;
    }
  }

  /**
   * Synthesize Bayan (Bass Drum) resonant resonant stroke with gentle modulation (Ge / Ghe)
   */
  private playBayanBass(pitchBend: boolean = true, duration: number = 0.6): ActiveTablaStroke | undefined {
    if (!this.ctx || !this.masterGain) return undefined;
    const context = this.ctx;
    const masterGain = this.masterGain;
    const oscillators: AudioScheduledSourceNode[] = [];
    const gains: GainNode[] = [];
    try {
      const now = context.currentTime;
      const gain = context.createGain();
      gains.push(gain);
      gain.connect(masterGain);

      const osc = context.createOscillator();
      oscillators.push(osc);
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
      return this.createActiveStroke(oscillators, gains, (duration + 0.1) * 1000);
    } catch (error) {
      this.cleanupNodes(oscillators, gains);
      throw error;
    }
  }

  /**
   * Play any standard Tabla Bol
   */
  private playStroke(strokeKind: TablaStrokeKind): ActiveTablaStroke | undefined {
    const strokes: ActiveTablaStroke[] = [];
    const add = (stroke: ActiveTablaStroke | undefined) => {
      if (stroke) strokes.push(stroke);
    };
    try {
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
    } catch (error) {
      // A combined bol may have started one side before the other side
      // failed. Roll the completed side back before propagating the failure.
      strokes.forEach((stroke) => {
        try {
          stroke.cancel();
        } catch {
          // Preserve the original construction failure after best-effort rollback.
        }
      });
      throw error;
    }
    if (strokes.length === 0) return undefined;
    return {
      cancel: () => strokes.forEach((stroke) => {
        try {
          stroke.cancel();
        } catch {
          // One child cancellation must not strand the remaining owned stroke.
        }
      }),
      finished: Promise.all(strokes.map((stroke) => stroke.finished)).then(() => undefined),
    };
  }

  public playBol(
    bolName: string,
    matraDurationMs: number = 500,
    onUnavailable?: () => void
  ): TablaPlaybackHandle {
    let cancelled = false;
    let failed = false;
    let unavailableReported = false;
    let resolveFinished!: () => void;
    let finishedResolved = false;
    const finished = new Promise<void>((resolve) => {
      resolveFinished = resolve;
    });
    const finishIfIdle = (pendingDelayed: { current: number }, activeStrokes: Set<ActiveTablaStroke>) => {
      if (!finishedResolved && pendingDelayed.current === 0 && activeStrokes.size === 0) {
        finishedResolved = true;
        resolveFinished();
      }
    };
    let cancelScheduled: () => void = () => undefined;
    const pendingDelayed = { current: 0 };
    const activeStrokes = new Set<ActiveTablaStroke>();
    const cancelActiveStrokes = () => {
      activeStrokes.forEach((stroke) => {
        try {
          stroke.cancel();
        } catch {
          // One child cancellation must not strand the remaining owned strokes.
        }
      });
      activeStrokes.clear();
    };
    const clearScheduled = () => {
      try {
        cancelScheduled();
      } catch {
        // Scheduling cleanup is best-effort; owned active strokes still settle.
      }
    };
    const unavailable = () => {
      if (cancelled || unavailableReported) return false;
      failed = true;
      unavailableReported = true;
      // Observer/UI callbacks are not allowed to break the ownership
      // contract. Always tear down scheduled work and active nodes even when
      // the callback itself throws, and never leak that observer error to the
      // promise chain or the browser event loop.
      try {
        onUnavailable?.();
      } catch {
        // Treat observer failure as an unavailable audio result.
      } finally {
        clearScheduled();
        pendingDelayed.current = 0;
        cancelActiveStrokes();
        finishIfIdle(pendingDelayed, activeStrokes);
      }
      return false;
    };
    if (typeof window === "undefined" || !bolName || typeof bolName !== "string") {
      const ready = typeof window === "undefined" ? Promise.resolve(false) : Promise.resolve(unavailable());
      if (!finishedResolved) {
        finishedResolved = true;
        resolveFinished();
      }
      return createPlaybackHandle(() => {
        cancelled = true;
      }, ready, finished);
    }
    const unavailableHandle = (): TablaPlaybackHandle => {
      const ready = Promise.resolve(unavailable());
      if (!finishedResolved) {
        finishedResolved = true;
        resolveFinished();
      }
      return createPlaybackHandle(() => {
        cancelled = true;
      }, ready, finished);
    };
    const invalidDuration = typeof matraDurationMs !== "number" || !Number.isFinite(matraDurationMs) || matraDurationMs <= 0;
    if (invalidDuration) return unavailableHandle();
    let plan: PlannedTablaStroke[];
    try {
      plan = planTablaBol(bolName, matraDurationMs);
    } catch {
      return unavailableHandle();
    }
    if (plan.length === 0) {
      finishedResolved = true;
      resolveFinished();
      return createPlaybackHandle(() => undefined, Promise.resolve(true), finished);
    }
    pendingDelayed.current = plan.filter((stroke) => stroke.delayMs > 0).length;
    const ready = this.initContext().then((available) => {
      if (cancelled) return false;
      if (!available) return unavailable();
      cancelScheduled = scheduleTablaPlan(plan, (stroke) => {
        if (stroke.delayMs > 0) pendingDelayed.current = Math.max(0, pendingDelayed.current - 1);
        if (cancelled || failed) {
          finishIfIdle(pendingDelayed, activeStrokes);
          return;
        }
        try {
          const activeStroke = this.playStroke(stroke.kind);
          if (activeStroke) {
            activeStrokes.add(activeStroke);
            void activeStroke.finished.then(() => {
              activeStrokes.delete(activeStroke);
              finishIfIdle(pendingDelayed, activeStrokes);
            });
          }
        } catch {
          unavailable();
        }
        finishIfIdle(pendingDelayed, activeStrokes);
      }, {
        set: (callback, delayMs) => window.setTimeout(callback, delayMs),
        clear: (timer) => window.clearTimeout(timer),
      });
      if (failed) {
        clearScheduled();
        pendingDelayed.current = 0;
        finishIfIdle(pendingDelayed, activeStrokes);
      }
      return !failed;
    }).catch(() => unavailable());

    return createPlaybackHandle(() => {
      if (cancelled) return;
      cancelled = true;
      clearScheduled();
      pendingDelayed.current = 0;
      cancelActiveStrokes();
      if (!finishedResolved) {
        finishedResolved = true;
        resolveFinished();
      }
    }, ready, finished);
  }
}

export const tablaSynth = new TablaSynthEngine();

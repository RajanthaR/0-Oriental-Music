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

export type SwaraTimbre = "harmonium" | "flute" | "sitar" | "pure";

/**
 * A caller-owned Swara playback operation.
 *
 * The function is intentionally callable so it mirrors the Tabla playback
 * contract already used by the interactive components. Calling it more than
 * once is safe; `ready` resolves to false when the operation is cancelled or
 * Web Audio cannot be started.
 */
export type SwaraPlaybackHandle = (() => void) & {
  ready: Promise<boolean>;
};

function createPlaybackHandle(cancel: () => void, ready: Promise<boolean>): SwaraPlaybackHandle {
  return Object.assign(cancel, { ready });
}

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

  private createVoiceCleanup(
    oscillators: AudioScheduledSourceNode[],
    gains: GainNode[],
    timerId?: number
  ): () => void {
    let cleaned = false;
    return () => {
      if (cleaned) return;
      cleaned = true;
      if (timerId !== undefined && typeof window !== "undefined") {
        window.clearTimeout(timerId);
      }
      oscillators.forEach((oscillator) => {
        try {
          oscillator.stop();
        } catch {
          // The oscillator may already have reached its scheduled stop time.
        }
        try {
          oscillator.disconnect();
        } catch {
          // Disconnection is best-effort during browser teardown.
        }
      });
      gains.forEach((gain) => {
        try {
          gain.disconnect();
        } catch {
          // Disconnection is best-effort during browser teardown.
        }
      });
    };
  }

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
    timbre: SwaraTimbre = "harmonium"
  ): Promise<boolean> {
    return this.playSwaraToneHandle(swara, durationSec, rootFreq, timbre).ready;
  }

  /**
   * Schedule a single tone and return an operation that owns every node it
   * creates. This keeps delayed Web Audio work cancellable by React callers.
   */
  public playSwaraToneHandle(
    swara: string,
    durationSec: number = 0.8,
    rootFreq: number = DEFAULT_ROOT_FREQ,
    timbre: SwaraTimbre = "harmonium"
  ): SwaraPlaybackHandle {
    let cancelled = false;
    let cleanupVoice: (() => void) | undefined;
    let resolveReady!: (played: boolean) => void;
    const ready = new Promise<boolean>((resolve) => {
      resolveReady = resolve;
    });

    const fail = () => {
      resolveReady(false);
      return false;
    };

    if (typeof window === "undefined" || !swara || typeof swara !== "string") {
      return createPlaybackHandle(() => {
        cancelled = true;
      }, Promise.resolve(false));
    }

    void (async () => {
      try {
        if (!(await this.initContext()) || cancelled || !this.ctx || !this.masterGain) {
          fail();
          return;
        }

        const freq = getSwaraFrequency(swara, rootFreq);
        const safeDuration = typeof durationSec === "number" && isFinite(durationSec) && durationSec > 0
          ? durationSec
          : 0.8;
        if (!isFinite(freq) || freq <= 0) {
          fail();
          return;
        }

        const now = this.ctx.currentTime;
        const noteGain = this.ctx.createGain();
        const oscillators: AudioScheduledSourceNode[] = [];
        const gains: GainNode[] = [noteGain];
        noteGain.connect(this.masterGain);

        const addOscillator = (
          frequency: number,
          type: OscillatorType,
          targetGain: GainNode = noteGain
        ) => {
          if (!this.ctx) return;
          const oscillator = this.ctx.createOscillator();
          oscillator.type = type;
          oscillator.frequency.setValueAtTime(frequency, now);
          oscillator.connect(targetGain);
          oscillator.start(now);
          oscillator.stop(now + safeDuration + 0.1);
          oscillators.push(oscillator);
        };

        if (timbre === "harmonium") {
          const harmonics = [1, 2, 3, 4, 5, 6];
          const harmonicGains = [0.4, 0.35, 0.2, 0.15, 0.08, 0.04];
          harmonics.forEach((harmonic, index) => {
            const harmonicGain = this.ctx?.createGain();
            if (!harmonicGain) return;
            harmonicGain.gain.setValueAtTime(harmonicGains[index], now);
            harmonicGain.connect(noteGain);
            gains.push(harmonicGain);
            addOscillator(freq * harmonic, index % 2 === 0 ? "sawtooth" : "triangle", harmonicGain);
          });
          noteGain.gain.setValueAtTime(0.0001, now);
          noteGain.gain.linearRampToValueAtTime(0.5, now + 0.05);
          noteGain.gain.setValueAtTime(0.45, now + safeDuration * 0.8);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + safeDuration);
        } else if (timbre === "flute") {
          const octaveGain = this.ctx.createGain();
          gains.push(octaveGain);
          octaveGain.gain.setValueAtTime(0.1, now);
          octaveGain.connect(noteGain);
          addOscillator(freq, "sine");
          addOscillator(freq * 2, "sine", octaveGain);
          noteGain.gain.setValueAtTime(0.0001, now);
          noteGain.gain.linearRampToValueAtTime(0.4, now + 0.1);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + safeDuration);
        } else {
          addOscillator(freq, "sine");
          noteGain.gain.setValueAtTime(0.0001, now);
          noteGain.gain.linearRampToValueAtTime(0.4, now + 0.02);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + safeDuration);
        }

        if (cancelled || oscillators.length === 0) {
          cleanupVoice = this.createVoiceCleanup(oscillators, gains);
          cleanupVoice();
          fail();
          return;
        }

        const naturalCleanupTimer = window.setTimeout(() => {
          cleanupVoice?.();
          cleanupVoice = undefined;
        }, (safeDuration + 0.2) * 1000);
        cleanupVoice = this.createVoiceCleanup(oscillators, gains, naturalCleanupTimer);
        if (cancelled) {
          cleanupVoice();
          fail();
          return;
        }
        resolveReady(true);
      } catch {
        cleanupVoice?.();
        cleanupVoice = undefined;
        fail();
      }
    })();

    return createPlaybackHandle(() => {
      if (cancelled) return;
      cancelled = true;
      cleanupVoice?.();
      cleanupVoice = undefined;
      resolveReady(false);
    }, ready);
  }

  /**
   * Play a sequence of swaras (e.g. Aarohana / Avarohana / Pakad)
   */
  public async playSequence(
    swaras: string[],
    noteDurationSec: number = 0.6,
    onStep?: (index: number, swara: string) => void,
    rootFreq: number = DEFAULT_ROOT_FREQ,
    timbre: SwaraTimbre = "harmonium"
  ): Promise<boolean> {
    return this.playSequenceHandle(swaras, noteDurationSec, onStep, rootFreq, timbre).ready;
  }

  /**
   * Play a sequence with caller-owned cancellation. The sequence owns the
   * current tone handle and its inter-note timer, so cancellation cannot leave
   * a later note or callback running after the caller has gone away.
   */
  public playSequenceHandle(
    swaras: string[],
    noteDurationSec: number = 0.6,
    onStep?: (index: number, swara: string) => void,
    rootFreq: number = DEFAULT_ROOT_FREQ,
    timbre: SwaraTimbre = "harmonium"
  ): SwaraPlaybackHandle {
    let cancelled = false;
    let currentTone: SwaraPlaybackHandle | undefined;
    let timerId: number | undefined;
    let resolveDelay: (() => void) | undefined;
    let resolveReady!: (played: boolean) => void;
    const ready = new Promise<boolean>((resolve) => {
      resolveReady = resolve;
    });
    const safeDuration = typeof noteDurationSec === "number" && isFinite(noteDurationSec) && noteDurationSec > 0
      ? noteDurationSec
      : 0.6;

    void (async () => {
      try {
        for (let index = 0; index < swaras.length; index += 1) {
          if (cancelled) {
            resolveReady(false);
            return;
          }
          const swara = swaras[index];
          onStep?.(index, swara);
          if (cancelled) {
            resolveReady(false);
            return;
          }
          currentTone = this.playSwaraToneHandle(swara, safeDuration, rootFreq, timbre);
          const played = await currentTone.ready;
          if (!played || cancelled) {
            currentTone = undefined;
            resolveReady(false);
            return;
          }
          await new Promise<void>((resolve) => {
            resolveDelay = resolve;
            timerId = window.setTimeout(() => {
              timerId = undefined;
              resolveDelay = undefined;
              resolve();
            }, safeDuration * 1000);
          });
          currentTone = undefined;
        }
        resolveReady(!cancelled);
      } catch {
        if (timerId !== undefined) {
          window.clearTimeout(timerId);
          timerId = undefined;
        }
        resolveDelay?.();
        resolveDelay = undefined;
        currentTone?.();
        currentTone = undefined;
        resolveReady(false);
      }
    })();

    return createPlaybackHandle(() => {
      if (cancelled) return;
      cancelled = true;
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
        timerId = undefined;
      }
      resolveDelay?.();
      resolveDelay = undefined;
      currentTone?.();
      currentTone = undefined;
      resolveReady(false);
    }, ready);
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }
}

export const swaraSynth = new SwaraSynthEngine();

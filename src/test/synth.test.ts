import { describe, it, expect, vi } from "vitest";
import { SWARA_SEMITONES, SwaraSynthEngine, swaraSynth, getSwaraFrequency } from "@/lib/audio/synth";
import { ROOT_PITCHES } from "@/lib/audio/tanpura";
import { TablaSynthEngine, tablaSynth } from "@/lib/audio/tabla";
import { normalizePracticeBpm } from "@/lib/audio/tempo";

describe("Audio Synthesis Engine & Tuning Suite", () => {
  it("should have correct semitone mapping for standard 12 swaras", () => {
    expect(SWARA_SEMITONES["S"].semitonesFromSa).toBe(0);
    expect(SWARA_SEMITONES["r"].semitonesFromSa).toBe(1);
    expect(SWARA_SEMITONES["R"].semitonesFromSa).toBe(2);
    expect(SWARA_SEMITONES["g"].semitonesFromSa).toBe(3);
    expect(SWARA_SEMITONES["G"].semitonesFromSa).toBe(4);
    expect(SWARA_SEMITONES["M"].semitonesFromSa).toBe(5);
    expect(SWARA_SEMITONES["m"].semitonesFromSa).toBe(6);
    expect(SWARA_SEMITONES["P"].semitonesFromSa).toBe(7);
    expect(SWARA_SEMITONES["d"].semitonesFromSa).toBe(8);
    expect(SWARA_SEMITONES["D"].semitonesFromSa).toBe(9);
    expect(SWARA_SEMITONES["n"].semitonesFromSa).toBe(10);
    expect(SWARA_SEMITONES["N"].semitonesFromSa).toBe(11);
    expect(SWARA_SEMITONES["S'"].semitonesFromSa).toBe(12);
  });

  it("should calculate exact frequencies for octaves", () => {
    const baseFreq = 261.63; // C4
    const taraSaFreq = baseFreq * Math.pow(2, 12 / 12);
    expect(Math.round(taraSaFreq)).toBe(523);

    const mandraSaFreq = baseFreq * Math.pow(2, -12 / 12);
    expect(Math.round(mandraSaFreq)).toBe(131);
  });

  it("should define valid Tanpura root pitches", () => {
    expect(ROOT_PITCHES.length).toBeGreaterThan(5);
    const cPitch = ROOT_PITCHES.find((p) => p.name.startsWith("C (ස)"));
    expect(cPitch).toBeDefined();
    expect(cPitch?.freq).toBeCloseTo(130.81, 1);
  });

  it("should gracefully handle defensive inputs in getSwaraFrequency", () => {
    // Empty, non-string, or unknown swara returns safe root frequency
    expect(getSwaraFrequency("")).toBe(261.63);
    expect(getSwaraFrequency("unknown")).toBe(261.63);
    // @ts-expect-error - testing invalid runtime input
    expect(getSwaraFrequency(null)).toBe(261.63);
    // @ts-expect-error - testing invalid runtime input
    expect(getSwaraFrequency(undefined, NaN)).toBe(261.63);

    // Mandra octave notes calculation
    const mandraDha = getSwaraFrequency(".D", 261.63);
    expect(mandraDha).toBeCloseTo(261.63 * Math.pow(2, (9 - 12) / 12), 2);

    const mandraNi = getSwaraFrequency(".n", 261.63);
    expect(mandraNi).toBeCloseTo(261.63 * Math.pow(2, (10 - 12) / 12), 2);
  });

  it("fails Web Audio initialization closed without throwing and bounds hostile BPM", async () => {
    const originalAudioContext = window.AudioContext;
    const originalWebkitAudioContext = (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    class ThrowingAudioContext {
      constructor() { throw new Error("audio unavailable"); }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: ThrowingAudioContext });
    Object.defineProperty(window, "webkitAudioContext", { configurable: true, value: ThrowingAudioContext });
    await expect(swaraSynth.playSwaraTone("S")).resolves.toBe(false);
    const playback = tablaSynth.playBol("ධා");
    await expect(playback.ready).resolves.toBe(false);
    expect(() => playback()).not.toThrow();
    Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
    Object.defineProperty(window, "webkitAudioContext", { configurable: true, value: originalWebkitAudioContext });

    expect(normalizePracticeBpm(-1, 80)).toBe(80);
    expect(normalizePracticeBpm(Number.POSITIVE_INFINITY, 80)).toBe(80);
    expect(normalizePracticeBpm(9999, 80)).toBe(80);
  });

  it("closes rejected AudioContexts and suppresses callbacks after cancellation", async () => {
    const originalAudioContext = window.AudioContext;
    const close = vi.fn().mockResolvedValue(undefined);
    class RejectingAudioContext {
      state = "suspended";
      currentTime = 0;
      destination = {};
      createGain() {
        return {
          gain: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
        };
      }
      resume(): Promise<void> { return Promise.reject(new Error("blocked")); }
      close() { return close(); }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: RejectingAudioContext });
    await expect(new SwaraSynthEngine().playSwaraTone("S")).resolves.toBe(false);
    await expect(new TablaSynthEngine().playBol("ධා").ready).resolves.toBe(false);
    expect(close).toHaveBeenCalledTimes(2);

    let releaseResume: (() => void) | undefined;
    class DeferredAudioContext extends RejectingAudioContext {
      resume() {
        return new Promise<void>((resolve) => { releaseResume = resolve; });
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: DeferredAudioContext });
    const unavailable = vi.fn();
    const handle = new TablaSynthEngine().playBol("ධා", 500, unavailable);
    handle();
    releaseResume?.();
    await expect(handle.ready).resolves.toBe(false);
    expect(unavailable).not.toHaveBeenCalled();
    Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
  });

  it("returns idempotent Swara handles that stop active nodes", async () => {
    const originalAudioContext = window.AudioContext;
    const oscillators: Array<{ stop: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = [];
    class FakeAudioContext {
      state = "running";
      currentTime = 0;
      destination = {};
      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
          disconnect: vi.fn(),
        };
      }
      createOscillator() {
        const oscillator = {
          type: "sine",
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          disconnect: vi.fn(),
        };
        oscillators.push(oscillator);
        return oscillator;
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FakeAudioContext });
    try {
      const engine = new SwaraSynthEngine();
      const handle = engine.playSwaraToneHandle("S", 2);
      await expect(handle.ready).resolves.toBe(true);
      const scheduledStopCounts = oscillators.map((oscillator) => oscillator.stop.mock.calls.length);
      handle();
      handle();
      expect(oscillators.length).toBeGreaterThan(0);
      oscillators.forEach((oscillator, index) => {
        expect(oscillator.stop).toHaveBeenCalledTimes(scheduledStopCounts[index] + 1);
        expect(oscillator.disconnect).toHaveBeenCalledTimes(1);
      });
    } finally {
      Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
    }
  });

  it("cancels Swara initialization before any voice or callback can start", async () => {
    const originalAudioContext = window.AudioContext;
    let releaseResume: (() => void) | undefined;
    const createOscillator = vi.fn();
    const close = vi.fn().mockResolvedValue(undefined);
    class DeferredAudioContext {
      state = "suspended";
      currentTime = 0;
      destination = {};
      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
          disconnect: vi.fn(),
        };
      }
      createOscillator = createOscillator;
      resume() {
        return new Promise<void>((resolve) => { releaseResume = resolve; });
      }
      close() { return close(); }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: DeferredAudioContext });
    try {
      const handle = new SwaraSynthEngine().playSwaraToneHandle("S", 1);
      handle();
      handle();
      await expect(handle.ready).resolves.toBe(false);
      releaseResume?.();
      await Promise.resolve();
      await Promise.resolve();
      expect(createOscillator).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
    }
  });

  it("lets a Tabla owner stop and disconnect an active stroke", async () => {
    const originalAudioContext = window.AudioContext;
    const oscillators: Array<{ stop: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = [];
    class FakeAudioContext {
      state = "running";
      currentTime = 0;
      destination = {};
      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
          disconnect: vi.fn(),
        };
      }
      createOscillator() {
        const oscillator = {
          type: "sine",
          frequency: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          disconnect: vi.fn(),
        };
        oscillators.push(oscillator);
        return oscillator;
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FakeAudioContext });
    vi.useFakeTimers();
    try {
      const handle = new TablaSynthEngine().playBol("ධා");
      await expect(handle.ready).resolves.toBe(true);
      const scheduledStops = oscillators.map((oscillator) => oscillator.stop.mock.calls.length);
      handle();
      handle();
      expect(oscillators.length).toBeGreaterThan(0);
      oscillators.forEach((oscillator, index) => {
        expect(oscillator.stop).toHaveBeenCalledTimes(scheduledStops[index] + 1);
        expect(oscillator.disconnect).toHaveBeenCalledTimes(1);
      });
    } finally {
      vi.useRealTimers();
      Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
    }
  });

  it("cancels sequence delays and suppresses later notes and callbacks", async () => {
    const originalAudioContext = window.AudioContext;
    const oscillators: Array<{ stop: ReturnType<typeof vi.fn> }> = [];
    class FakeAudioContext {
      state = "running";
      currentTime = 0;
      destination = {};
      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
          disconnect: vi.fn(),
        };
      }
      createOscillator() {
        const oscillator = {
          type: "sine",
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          disconnect: vi.fn(),
        };
        oscillators.push(oscillator);
        return oscillator;
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FakeAudioContext });
    vi.useFakeTimers();
    try {
      const engine = new SwaraSynthEngine();
      const steps: string[] = [];
      const handle = engine.playSequenceHandle(["S", "R", "G"], 0.5, (_index, swara) => steps.push(swara));
      await Promise.resolve();
      await Promise.resolve();
      expect(steps).toEqual(["S"]);
      const scheduledStopCounts = oscillators.map((oscillator) => oscillator.stop.mock.calls.length);
      handle();
      handle();
      await expect(handle.ready).resolves.toBe(false);
      oscillators.forEach((oscillator, index) => {
        expect(oscillator.stop).toHaveBeenCalledTimes(scheduledStopCounts[index] + 1);
      });
      vi.advanceTimersByTime(2000);
      expect(steps).toEqual(["S"]);
    } finally {
      vi.useRealTimers();
      Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
    }
  });
});

import { describe, it, expect, vi } from "vitest";
import { SWARA_SEMITONES, SwaraSynthEngine, getSwaraFrequency } from "@/lib/audio/synth";
import { ROOT_PITCHES } from "@/lib/audio/tanpura";

describe("Swara Synthesis Tuning & Playback Lifecycle", () => {
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

  it("fails closed for malformed Swara sequence inputs before callbacks or audio", async () => {
    const malformedInputs: Array<[string, unknown]> = [
      ["empty", []],
      ["non-array string", "S"],
      ["array-like object", { length: 1, 0: "S" }],
      ["sparse array", new Array(1)],
      ["malformed token", ["S", 42]],
      ["unknown token", ["X"]],
      ["overlong array", new Array(257).fill("S")],
    ];

    for (const [label, input] of malformedInputs) {
      const steps: unknown[] = [];
      const handle = new SwaraSynthEngine().playSequenceHandle(
        input as string[],
        0.01,
        (_index, swara) => steps.push(swara),
      );

      await expect(handle.ready, label).resolves.toBe(false);
      await expect(handle.finished, label).resolves.toBeUndefined();
      expect(steps, label).toEqual([]);
      expect(() => handle(), label).not.toThrow();
    }
  });

  it("settles Swara cleanup when clearTimeout throws", async () => {
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
    vi.useFakeTimers();
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FakeAudioContext });
    const originalClearTimeout = window.clearTimeout;
    const clearTimeoutMock = vi.fn(() => {
      throw new Error("timer clear failed");
    });
    Object.defineProperty(window, "clearTimeout", { configurable: true, value: clearTimeoutMock });
    try {
      const handle = new SwaraSynthEngine().playSwaraToneHandle("S", 1);
      await expect(handle.ready).resolves.toBe(true);
      expect(() => handle()).not.toThrow();
      let finished = false;
      void handle.finished.then(() => { finished = true; });
      await Promise.resolve();
      expect(finished).toBe(true);
      expect(clearTimeoutMock).toHaveBeenCalled();
      oscillators.forEach((oscillator) => expect(oscillator.disconnect).toHaveBeenCalledTimes(1));
    } finally {
      Object.defineProperty(window, "clearTimeout", { configurable: true, value: originalClearTimeout });
      vi.clearAllTimers();
      vi.useRealTimers();
      Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
    }
  });

  it("settles Swara sequence ownership when timer clearing throws", async () => {
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
    vi.useFakeTimers();
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FakeAudioContext });
    const originalClearTimeout = window.clearTimeout;
    const clearTimeoutMock = vi.fn(() => {
      throw new Error("timer clear failed");
    });
    Object.defineProperty(window, "clearTimeout", { configurable: true, value: clearTimeoutMock });
    try {
      const handle = new SwaraSynthEngine().playSequenceHandle(["S", "R"], 1);
      await Promise.resolve();
      await Promise.resolve();
      expect(() => handle()).not.toThrow();
      await expect(handle.ready).resolves.toBe(false);
      let finished = false;
      void handle.finished.then(() => { finished = true; });
      await Promise.resolve();
      expect(finished).toBe(true);
      expect(clearTimeoutMock).toHaveBeenCalled();
      oscillators.forEach((oscillator) => expect(oscillator.disconnect).toHaveBeenCalledTimes(1));
    } finally {
      Object.defineProperty(window, "clearTimeout", { configurable: true, value: originalClearTimeout });
      vi.clearAllTimers();
      vi.useRealTimers();
      Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
    }
  });

  it("defers the first sequence callback until the caller owns the handle", async () => {
    const steps: string[] = [];
    let handle: ReturnType<SwaraSynthEngine["playSequenceHandle"]> | undefined;
    handle = new SwaraSynthEngine().playSequenceHandle(["S", "R"], 0.5, (_index, swara) => {
      steps.push(swara);
      handle?.();
    });

    await expect(handle.ready).resolves.toBe(false);
    expect(steps).toEqual(["S"]);
  });

  it("keeps a Swara owner until the voice cleanup actually finishes", async () => {
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
      const handle = new SwaraSynthEngine().playSwaraToneHandle("S", 1);
      await expect(handle.ready).resolves.toBe(true);
      let finished = false;
      void handle.finished.then(() => { finished = true; });
      await Promise.resolve();
      expect(finished).toBe(false);
      vi.advanceTimersByTime(1199);
      await Promise.resolve();
      expect(finished).toBe(false);
      vi.advanceTimersByTime(1);
      await Promise.resolve();
      expect(finished).toBe(true);
      expect(oscillators[0].stop).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
      Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
    }
  });
});

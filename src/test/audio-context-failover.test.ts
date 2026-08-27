import { describe, it, expect, vi } from "vitest";
import { swaraSynth, SwaraSynthEngine } from "@/lib/audio/synth";
import { TablaSynthEngine, tablaSynth } from "@/lib/audio/tabla";
import { normalizePracticeBpm } from "@/lib/audio/tempo";

describe("AudioContext Initialization, Replacement & Failure Atomicity", () => {
  it("fails Web Audio initialization closed without throwing and bounds hostile BPM", async () => {
    const originalAudioContext = window.AudioContext;
    const originalWebkitAudioContext = (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    class ThrowingAudioContext {
      constructor() { throw new Error("audio unavailable"); }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: ThrowingAudioContext });
    Object.defineProperty(window, "webkitAudioContext", { configurable: true, value: ThrowingAudioContext });
    try {
      await expect(swaraSynth.playSwaraTone("S")).resolves.toBe(false);
      const playback = tablaSynth.playBol("ධා");
      await expect(playback.ready).resolves.toBe(false);
      expect(() => playback()).not.toThrow();
    } finally {
      Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
      Object.defineProperty(window, "webkitAudioContext", { configurable: true, value: originalWebkitAudioContext });
    }

    expect(normalizePracticeBpm(-1, 80)).toBe(80);
    expect(normalizePracticeBpm(Number.POSITIVE_INFINITY, 80)).toBe(80);
    expect(normalizePracticeBpm(9999, 80)).toBe(80);
  });

  it("swallows a throwing Tabla unavailable observer after completing cleanup", async () => {
    const originalAudioContext = window.AudioContext;
    class ThrowingAudioContext {
      constructor() { throw new Error("audio unavailable"); }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: ThrowingAudioContext });
    try {
      const onUnavailable = vi.fn(() => { throw new Error("observer failed"); });
      const handle = new TablaSynthEngine().playBol("ධා", 500, onUnavailable);
      await expect(handle.ready).resolves.toBe(false);
      await expect(handle.finished).resolves.toBeUndefined();
      expect(onUnavailable).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
    }
  });

  it("closes rejected AudioContexts and suppresses callbacks after cancellation", async () => {
    const originalAudioContext = window.AudioContext;
    const close = vi.fn().mockResolvedValue(undefined);
    try {
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
    } finally {
      Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
    }
  });

  it("rolls back partially constructed Swara and Tabla graphs", async () => {
    const originalAudioContext = window.AudioContext;
    const swaraOscillators: Array<{ stop: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = [];
    let swaraOscillatorCount = 0;
    class PartialSwaraAudioContext {
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
        swaraOscillatorCount += 1;
        if (swaraOscillatorCount === 2) throw new Error("partial Swara construction");
        const oscillator = {
          type: "sine",
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          disconnect: vi.fn(),
        };
        swaraOscillators.push(oscillator);
        return oscillator;
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: PartialSwaraAudioContext });
    try {
      const swaraHandle = new SwaraSynthEngine().playSwaraToneHandle("S");
      await expect(swaraHandle.ready).resolves.toBe(false);
      await swaraHandle.finished;
      expect(swaraOscillators).toHaveLength(1);
      expect(swaraOscillators[0].stop).toHaveBeenCalled();
      expect(swaraOscillators[0].disconnect).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
    }

    const tablaOscillators: Array<{ stop: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = [];
    let tablaOscillatorCount = 0;
    class PartialTablaAudioContext {
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
        tablaOscillatorCount += 1;
        if (tablaOscillatorCount === 2) throw new Error("partial Tabla construction");
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
        tablaOscillators.push(oscillator);
        return oscillator;
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: PartialTablaAudioContext });
    try {
      const unavailable = vi.fn();
      const tablaHandle = new TablaSynthEngine().playBol("ධා", 500, unavailable);
      await expect(tablaHandle.ready).resolves.toBe(false);
      await tablaHandle.finished;
      expect(unavailable).toHaveBeenCalledTimes(1);
      expect(tablaOscillators).toHaveLength(1);
      expect(tablaOscillators[0].stop).toHaveBeenCalled();
      expect(tablaOscillators[0].disconnect).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
    }
  });

  it("deduplicates failed context initialization before allowing a replacement", async () => {
    const originalAudioContext = window.AudioContext;
    let instances = 0;
    const closed: number[] = [];
    class RacingAudioContext {
      readonly id = ++instances;
      state = this.id === 1 ? "suspended" : "running";
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
        return {
          type: "sine",
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          disconnect: vi.fn(),
        };
      }
      resume() {
        return this.id === 1
          ? Promise.reject(new Error("first context blocked"))
          : Promise.resolve();
      }
      close() {
        closed.push(this.id);
        this.state = "closed";
        return Promise.resolve();
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: RacingAudioContext });
    try {
      const engine = new SwaraSynthEngine();
      const first = engine.playSwaraToneHandle("S");
      const second = engine.playSwaraToneHandle("R");
      await expect(Promise.all([first.ready, second.ready])).resolves.toEqual([false, false]);
      expect(instances).toBe(1);
      expect(closed).toEqual([1]);

      const replacement = engine.playSwaraToneHandle("G");
      await expect(replacement.ready).resolves.toBe(true);
      expect(instances).toBe(2);
      expect(closed).toEqual([1]);
      replacement();
    } finally {
      Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
    }
  });

  it("guards Tabla replacement contexts from an older failed initializer", async () => {
    const originalAudioContext = window.AudioContext;
    let instances = 0;
    const closed: number[] = [];
    class RacingTablaAudioContext {
      readonly id = ++instances;
      state = this.id === 1 ? "suspended" : "running";
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
        return {
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
      }
      resume() {
        return this.id === 1
          ? Promise.reject(new Error("first Tabla context blocked"))
          : Promise.resolve();
      }
      close() {
        closed.push(this.id);
        this.state = "closed";
        return Promise.resolve();
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: RacingTablaAudioContext });
    try {
      const engine = new TablaSynthEngine();
      const first = engine.playBol("ධා");
      const second = engine.playBol("ධා");
      await expect(Promise.all([first.ready, second.ready])).resolves.toEqual([false, false]);
      expect(instances).toBe(1);
      expect(closed).toEqual([1]);

      const replacement = engine.playBol("ධා");
      await expect(replacement.ready).resolves.toBe(true);
      expect(instances).toBe(2);
      expect(closed).toEqual([1]);
      replacement();
    } finally {
      Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
    }
  });
});

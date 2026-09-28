import { describe, it, expect, vi } from "vitest";
import { TablaSynthEngine, planTablaBol, expandTablaBol, scheduleTablaPlan } from "@/lib/audio/tabla";

describe("Tabla Bol Planning & Scheduling Ownership", () => {
  it.each([
    "__proto__",
    "constructor",
    "prototype",
    "toString",
    "valueOf",
    "hasOwnProperty",
    "propertyIsEnumerable",
  ])("fails closed for the prototype-key Tabla bol %s without throwing", (hostileBol) => {
    // A plain-object lookup resolved `__proto__` to Object.prototype and
    // `constructor` to Object, so `?? [clean]` never fired and the planner threw
    // while trying to map an inherited non-array value.
    expect(() => expandTablaBol(hostileBol)).not.toThrow();
    const expanded = expandTablaBol(hostileBol);
    expect(Array.isArray(expanded)).toBe(true);
    expect(expanded).toEqual([hostileBol.toLowerCase()]);

    expect(() => planTablaBol(hostileBol, 500)).not.toThrow();
    const plan = planTablaBol(hostileBol, 500);
    expect(Array.isArray(plan)).toBe(true);
    expect(plan).toEqual([{ bol: hostileBol.toLowerCase(), kind: "fallback", delayMs: 0 }]);
  });

  it("keeps unknown and compound Tabla bols on the closed compound lookup", () => {
    expect(expandTablaBol("ධන්න")).toEqual(["ධ", "න", "න"]);
    expect(expandTablaBol("නොදන්නා")).toEqual(["නොදන්නා"]);
    expect(expandTablaBol("-")).toEqual([]);
    expect(expandTablaBol("s")).toEqual([]);
    // The returned cells must be a fresh array so a caller cannot mutate the registry.
    const first = expandTablaBol("ධන්න");
    first[0] = "mutated";
    expect(expandTablaBol("ධන්න")).toEqual(["ධ", "න", "න"]);
  });

  it("cannot strand Tabla playback ownership when a timer callback registers synchronously", () => {
    // A timer API that fires its callback during registration must not leave the
    // settled entry inside the active timer list, and cancelling afterwards must
    // stay safe and idempotent.
    const cleared: number[] = [];
    let nextTimer = 1;
    const strokes: string[] = [];
    const timerApi = {
      set: (callback: () => void) => {
        const timer = nextTimer++;
        callback();
        return timer;
      },
      clear: (timer: number) => { cleared.push(timer); },
    };

    const cancel = scheduleTablaPlan(
      [
        { bol: "පළමු", kind: "open", delayMs: 100 },
        { bol: "දෙවන", kind: "open", delayMs: 200 },
      ],
      (stroke) => { strokes.push(stroke.bol); },
      timerApi,
    );

    expect(strokes).toEqual(["පළමු", "දෙවන"]);
    expect(() => cancel()).not.toThrow();
    expect(() => cancel()).not.toThrow();
    // Every synchronously-settled timer was released at registration time, so
    // cancellation has no surviving ownership left to clear.
    expect(cleared).toEqual([1, 2]);
  });

  it("rolls back a Tabla schedule when registration fails after earlier timers", () => {
    const cleared: number[] = [];
    let nextTimer = 1;
    const timerApi = {
      set: (callback: () => void) => {
        if (nextTimer === 2) throw new Error("timer registration failed");
        return nextTimer++;
      },
      clear: (timer: number) => { cleared.push(timer); },
    };

    expect(() => scheduleTablaPlan(
      planTablaBol("ධනක", 600),
      () => undefined,
      timerApi,
    )).toThrow("timer registration failed");
    expect(cleared).toEqual([1]);
  });

  it("rolls back earlier Tabla timers when an immediate stroke callback fails", () => {
    const cleared: number[] = [];
    let nextTimer = 1;
    const timerApi = {
      set: (callback: () => void) => nextTimer++,
      clear: (timer: number) => { cleared.push(timer); },
    };

    expect(() => scheduleTablaPlan(
      [
        { bol: "පළමු", kind: "open", delayMs: 100 },
        { bol: "දෙවන", kind: "open", delayMs: 0 },
        { bol: "තෙවන", kind: "open", delayMs: 200 },
      ],
      (stroke) => {
        if (stroke.bol === "දෙවන") throw new Error("immediate stroke failed");
      },
      timerApi,
    )).toThrow("immediate stroke failed");
    expect(cleared).toEqual([1]);
  });

  it("cancels remaining Tabla timers when a delayed stroke callback fails", () => {
    const callbacks = new Map<number, () => void>();
    const cleared: number[] = [];
    let nextTimer = 0;
    const timerApi = {
      set: (callback: () => void) => {
        const timer = nextTimer++;
        callbacks.set(timer, callback);
        return timer;
      },
      clear: (timer: number) => {
        cleared.push(timer);
        callbacks.delete(timer);
      },
    };

    scheduleTablaPlan(
      [
        { bol: "පළමු", kind: "open", delayMs: 100 },
        { bol: "දෙවන", kind: "open", delayMs: 200 },
        { bol: "තෙවන", kind: "open", delayMs: 300 },
      ],
      (stroke) => {
        if (stroke.bol === "පළමු") throw new Error("stroke callback failed");
      },
      timerApi,
    );

    expect(() => callbacks.get(0)?.()).toThrow("stroke callback failed");
    expect(cleared).toEqual([1, 2]);
    expect(callbacks.has(1)).toBe(false);
    expect(callbacks.has(2)).toBe(false);
    expect(() => callbacks.get(0)?.()).not.toThrow();
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

  it("returns failure-atomic handles for hostile Tabla durations", async () => {
    const hostileDurations: unknown[] = [
      Symbol("hostile"),
      Number.NaN,
      Number.POSITIVE_INFINITY,
      0,
      -100,
      {},
      { valueOf: () => 250 },
      { valueOf: () => { throw new Error("coercion failed"); } },
    ];

    for (const duration of hostileDurations) {
      let handle: ReturnType<TablaSynthEngine["playBol"]> | undefined;
      expect(() => {
        handle = new TablaSynthEngine().playBol("ධා", duration as number);
      }).not.toThrow();
      expect(handle).toBeDefined();
      await expect(handle!.ready).resolves.toBe(false);
      await expect(handle!.finished).resolves.toBeUndefined();
      expect(() => handle!()).not.toThrow();
    }
  });

  it("settles Tabla ownership when active-stroke timer clearing throws", async () => {
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
    vi.useFakeTimers();
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FakeAudioContext });
    const originalClearTimeout = window.clearTimeout;
    const clearTimeoutMock = vi.fn(() => {
      throw new Error("timer clear failed");
    });
    Object.defineProperty(window, "clearTimeout", { configurable: true, value: clearTimeoutMock });
    try {
      const handle = new TablaSynthEngine().playBol("ධා");
      await expect(handle.ready).resolves.toBe(true);
      expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
      let finished = false;
      void handle.finished.then(() => { finished = true; });
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
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

  it("isolates Tabla owner cancellation when timer clearing throws", async () => {
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
    vi.useFakeTimers();
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FakeAudioContext });
    const originalClearTimeout = window.clearTimeout;
    const clearTimeoutMock = vi.fn(() => {
      throw new Error("timer clear failed");
    });
    Object.defineProperty(window, "clearTimeout", { configurable: true, value: clearTimeoutMock });
    try {
      const handle = new TablaSynthEngine().playBol("ධනක", 600);
      await expect(handle.ready).resolves.toBe(true);
      expect(() => handle()).not.toThrow();
      let finished = false;
      void handle.finished.then(() => { finished = true; });
      await Promise.resolve();
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
});

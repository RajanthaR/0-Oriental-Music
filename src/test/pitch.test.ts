import { afterEach, describe, expect, it, vi } from "vitest";
import { PitchDetector } from "@/lib/audio/pitch";

type TestTrack = { stop: ReturnType<typeof vi.fn> };

const createStream = () => {
  const track: TestTrack = { stop: vi.fn() };
  const stream = {
    getTracks: () => [track],
  } as unknown as MediaStream;
  return { stream, track };
};

const originalMediaDevices = navigator.mediaDevices;
const originalAudioContext = window.AudioContext;
const originalWebkitAudioContext = (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

afterEach(() => {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: originalMediaDevices,
  });
  Object.defineProperty(window, "AudioContext", { configurable: true, value: originalAudioContext });
  Object.defineProperty(window, "webkitAudioContext", { configurable: true, value: originalWebkitAudioContext });
  Object.defineProperty(globalThis, "requestAnimationFrame", {
    configurable: true,
    writable: true,
    value: originalRequestAnimationFrame,
  });
  Object.defineProperty(globalThis, "cancelAnimationFrame", {
    configurable: true,
    writable: true,
    value: originalCancelAnimationFrame,
  });
  vi.restoreAllMocks();
});

describe("PitchDetector resource ownership", () => {
  it("returns false for denied permission without retaining browser resources", async () => {
    const getUserMedia = vi.fn().mockRejectedValue(new Error("permission denied"));
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const detector = new PitchDetector();
    await expect(detector.startListening(() => undefined)).resolves.toBe(false);
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(() => detector.stopListening()).not.toThrow();
    expect(error).toHaveBeenCalledWith("Microphone access error:", expect.any(Error));
  });

  it("stops a stream and closes the context when graph initialization fails", async () => {
    const { stream, track } = createStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });

    const close = vi.fn().mockResolvedValue(undefined);
    class FailingContext {
      state = "running";
      sampleRate = 44100;
      close = close;
      createMediaStreamSource() {
        throw new Error("source setup failed");
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FailingContext });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new PitchDetector().startListening(() => undefined)).resolves.toBe(false);
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("stops a late stream when stopped while permission is pending", async () => {
    const { stream, track } = createStream();
    let resolveStream!: (value: MediaStream) => void;
    const getUserMedia = vi.fn(() => new Promise<MediaStream>((resolve) => {
      resolveStream = resolve;
    }));
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });

    const detector = new PitchDetector();
    const start = detector.startListening(() => undefined);
    detector.stopListening();
    resolveStream(stream);

    await expect(start).resolves.toBe(false);
    expect(track.stop).toHaveBeenCalledTimes(1);
  });

  it("lets only the newest pending start acquire ownership and emit callbacks", async () => {
    const first = createStream();
    const second = createStream();
    const pending: Array<(value: MediaStream) => void> = [];
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn(() => new Promise<MediaStream>((resolve) => pending.push(resolve))),
      },
    });

    const close = vi.fn().mockResolvedValue(undefined);
    class WorkingContext {
      state = "running";
      sampleRate = 44100;
      close = close;
      createMediaStreamSource() {
        return { connect: vi.fn(), disconnect: vi.fn() };
      }
      createAnalyser() {
        return { fftSize: 2048, getFloatTimeDomainData: (buffer: Float32Array) => buffer.fill(0) };
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: WorkingContext });
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      configurable: true,
      writable: true,
      value: vi.fn(() => 7),
    });

    const firstCallback = vi.fn();
    const secondCallback = vi.fn();
    const detector = new PitchDetector();
    const firstStart = detector.startListening(firstCallback);
    const secondStart = detector.startListening(secondCallback);
    pending[0](first.stream);
    await expect(firstStart).resolves.toBe(false);
    pending[1](second.stream);
    await expect(secondStart).resolves.toBe(true);

    expect(first.track.stop).toHaveBeenCalledTimes(1);
    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledTimes(1);
    detector.stopListening();
    expect(second.track.stop).toHaveBeenCalledTimes(1);
  });

  it("cancels animation frame zero and suppresses callbacks after stop", async () => {
    const { stream, track } = createStream();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });

    let scheduled: (() => void) | undefined;
    const cancelAnimationFrame = vi.fn();
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      configurable: true,
      writable: true,
      value: vi.fn((callback: () => void) => {
        scheduled = callback;
        return 0;
      }),
    });
    Object.defineProperty(globalThis, "cancelAnimationFrame", {
      configurable: true,
      writable: true,
      value: cancelAnimationFrame,
    });

    const close = vi.fn().mockResolvedValue(undefined);
    class WorkingContext {
      state = "running";
      sampleRate = 44100;
      close = close;
      createMediaStreamSource() {
        return { connect: vi.fn(), disconnect: vi.fn() };
      }
      createAnalyser() {
        return {
          fftSize: 2048,
          getFloatTimeDomainData: (buffer: Float32Array) => buffer.fill(0),
        };
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: WorkingContext });

    const onPitchDetected = vi.fn();
    const detector = new PitchDetector();
    await expect(detector.startListening(onPitchDetected)).resolves.toBe(true);
    expect(onPitchDetected).toHaveBeenCalledTimes(1);

    detector.stopListening();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(0);
    scheduled?.();
    expect(onPitchDetected).toHaveBeenCalledTimes(1);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("cleans all resources when a detection callback throws", async () => {
    const { stream, track } = createStream();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });

    const close = vi.fn().mockResolvedValue(undefined);
    class WorkingContext {
      state = "running";
      sampleRate = 44100;
      close = close;
      createMediaStreamSource() {
        return { connect: vi.fn(), disconnect: vi.fn() };
      }
      createAnalyser() {
        return {
          fftSize: 2048,
          getFloatTimeDomainData: (buffer: Float32Array) => buffer.fill(0),
        };
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: WorkingContext });
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      configurable: true,
      writable: true,
      value: vi.fn(() => 1),
    });

    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(new PitchDetector().startListening(() => {
      throw new Error("consumer failed");
    })).resolves.toBe(false);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith("Pitch detection error:", expect.any(Error));
  });

  it("cleans the active generation when a later animation callback fails", async () => {
    const { stream, track } = createStream();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    let scheduled: (() => void) | undefined;
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      configurable: true,
      writable: true,
      value: vi.fn((callback: () => void) => {
        scheduled = callback;
        return 3;
      }),
    });

    const close = vi.fn().mockResolvedValue(undefined);
    class WorkingContext {
      state = "running";
      sampleRate = 44100;
      close = close;
      createMediaStreamSource() {
        return { connect: vi.fn(), disconnect: vi.fn() };
      }
      createAnalyser() {
        return { fftSize: 2048, getFloatTimeDomainData: (buffer: Float32Array) => buffer.fill(0) };
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: WorkingContext });

    const callback = vi.fn()
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => { throw new Error("later consumer failure"); });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const detector = new PitchDetector();
    await expect(detector.startListening(callback)).resolves.toBe(true);
    scheduled?.();

    expect(callback).toHaveBeenCalledTimes(2);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith("Pitch detection error:", expect.any(Error));
  });

  it("keeps cleanup idempotent when browser resource cleanup itself fails", async () => {
    const track = { stop: vi.fn(() => { throw new Error("already stopped"); }) };
    const stream = { getTracks: () => [track] } as unknown as MediaStream;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    const close = vi.fn().mockRejectedValue(new Error("already closed"));
    class WorkingContext {
      state = "running";
      sampleRate = 44100;
      close = close;
      createMediaStreamSource() {
        return { connect: vi.fn(), disconnect: vi.fn(() => { throw new Error("already disconnected"); }) };
      }
      createAnalyser() {
        return { fftSize: 2048, getFloatTimeDomainData: (buffer: Float32Array) => buffer.fill(0) };
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: WorkingContext });
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      configurable: true,
      writable: true,
      value: vi.fn(() => 4),
    });

    const detector = new PitchDetector();
    await expect(detector.startListening(() => undefined)).resolves.toBe(true);
    expect(() => detector.stopListening()).not.toThrow();
    expect(() => detector.stopListening()).not.toThrow();
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });
});

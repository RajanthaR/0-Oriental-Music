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
  it.each([
    ["missing mediaDevices", undefined],
    ["missing getUserMedia", {}],
  ])("returns false when the browser microphone API is %s", async (_label, mediaDevices) => {
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: mediaDevices });
    const callback = vi.fn();

    await expect(new PitchDetector().startListening(callback)).resolves.toBe(false);
    expect(callback).not.toHaveBeenCalled();
  });

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

  it("stops the permission stream when AudioContext is unavailable", async () => {
    const { stream, track } = createStream();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    Object.defineProperty(window, "AudioContext", { configurable: true, value: undefined });
    Object.defineProperty(window, "webkitAudioContext", { configurable: true, value: undefined });
    const callback = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new PitchDetector().startListening(callback)).resolves.toBe(false);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalled();
  });

  it("stops the permission stream when AudioContext construction throws", async () => {
    const { stream, track } = createStream();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    class ThrowingContext {
      constructor() {
        throw new Error("context construction failed");
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: ThrowingContext });
    const callback = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new PitchDetector().startListening(callback)).resolves.toBe(false);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalled();
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

  it("disconnects a source and closes the context when analyser creation fails", async () => {
    const { stream, track } = createStream();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    const source = { connect: vi.fn(), disconnect: vi.fn() };
    const close = vi.fn().mockResolvedValue(undefined);
    class FailingAnalyserContext {
      state = "running";
      sampleRate = 44100;
      close = close;
      createMediaStreamSource() {
        return source;
      }
      createAnalyser() {
        throw new Error("analyser setup failed");
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FailingAnalyserContext });
    const callback = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new PitchDetector().startListening(callback)).resolves.toBe(false);
    expect(source.connect).not.toHaveBeenCalled();
    expect(source.disconnect).toHaveBeenCalledTimes(1);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalled();
  });

  it("disconnects a source and closes the context when source connection fails", async () => {
    const { stream, track } = createStream();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    const source = {
      connect: vi.fn(() => { throw new Error("source connection failed"); }),
      disconnect: vi.fn(),
    };
    const close = vi.fn().mockResolvedValue(undefined);
    class FailingConnectionContext {
      state = "running";
      sampleRate = 44100;
      close = close;
      createMediaStreamSource() {
        return source;
      }
      createAnalyser() {
        return {
          fftSize: 2048,
          getFloatTimeDomainData: (buffer: Float32Array) => buffer.fill(0),
        };
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FailingConnectionContext });
    const callback = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new PitchDetector().startListening(callback)).resolves.toBe(false);
    expect(source.connect).toHaveBeenCalledTimes(1);
    expect(source.disconnect).toHaveBeenCalledTimes(1);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalled();
  });

  it("disconnects a source and closes the context when analyser configuration fails", async () => {
    const { stream, track } = createStream();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    const source = { connect: vi.fn(), disconnect: vi.fn() };
    const analyser: { fftSize: number; getFloatTimeDomainData: (buffer: Float32Array) => void } = {
      fftSize: 0,
      getFloatTimeDomainData: (buffer: Float32Array) => buffer.fill(0),
    };
    Object.defineProperty(analyser, "fftSize", {
      configurable: true,
      set: vi.fn(() => { throw new Error("analyser configuration failed"); }),
    });
    const close = vi.fn().mockResolvedValue(undefined);
    class FailingConfigurationContext {
      state = "running";
      sampleRate = 44100;
      close = close;
      createMediaStreamSource() {
        return source;
      }
      createAnalyser() {
        return analyser;
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FailingConfigurationContext });
    const callback = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new PitchDetector().startListening(callback)).resolves.toBe(false);
    expect(source.connect).not.toHaveBeenCalled();
    expect(source.disconnect).toHaveBeenCalledTimes(1);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalled();
  });

  it("cleans the active graph when analyser sampling throws", async () => {
    const { stream, track } = createStream();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    const source = { connect: vi.fn(), disconnect: vi.fn() };
    const close = vi.fn().mockResolvedValue(undefined);
    class ThrowingSamplingContext {
      state = "running";
      sampleRate = 44100;
      close = close;
      createMediaStreamSource() {
        return source;
      }
      createAnalyser() {
        return {
          fftSize: 2048,
          getFloatTimeDomainData: () => { throw new Error("analyser sampling failed"); },
        };
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: ThrowingSamplingContext });
    const callback = vi.fn();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new PitchDetector().startListening(callback)).resolves.toBe(false);
    expect(source.disconnect).toHaveBeenCalledTimes(1);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith("Pitch detection error:", expect.any(Error));
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

  it("releases an active session before installing a replacement", async () => {
    const first = createStream();
    const second = createStream();
    const getUserMedia = vi.fn()
      .mockResolvedValueOnce(first.stream)
      .mockResolvedValueOnce(second.stream);
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });

    const contexts: Array<{ close: ReturnType<typeof vi.fn>; source: { connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> } }> = [];
    class WorkingContext {
      state = "running";
      sampleRate = 44100;
      source = { connect: vi.fn(), disconnect: vi.fn() };
      close = vi.fn().mockResolvedValue(undefined);

      constructor() {
        contexts.push(this);
      }

      createMediaStreamSource() {
        return this.source;
      }

      createAnalyser() {
        return {
          fftSize: 2048,
          getFloatTimeDomainData: (buffer: Float32Array) => buffer.fill(0),
        };
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: WorkingContext });
    const frames: Array<() => void> = [];
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      configurable: true,
      writable: true,
      value: vi.fn((callback: () => void) => {
        frames.push(callback);
        return frames.length - 1;
      }),
    });
    Object.defineProperty(globalThis, "cancelAnimationFrame", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });

    const firstCallback = vi.fn();
    const secondCallback = vi.fn();
    const detector = new PitchDetector();
    await expect(detector.startListening(firstCallback)).resolves.toBe(true);
    const firstCallbackCount = firstCallback.mock.calls.length;
    await expect(detector.startListening(secondCallback)).resolves.toBe(true);

    expect(first.track.stop).toHaveBeenCalledTimes(1);
    expect(contexts[0].source.disconnect).toHaveBeenCalledTimes(1);
    expect(contexts[0].close).toHaveBeenCalledTimes(1);
    expect(secondCallback).toHaveBeenCalledTimes(1);
    frames[0]?.();
    expect(firstCallback).toHaveBeenCalledTimes(firstCallbackCount);

    detector.stopListening();
    expect(second.track.stop).toHaveBeenCalledTimes(1);
    expect(contexts[1].close).toHaveBeenCalledTimes(1);
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

  it("rechecks ownership when stop is re-entered during frame registration", async () => {
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
        return { fftSize: 2048, getFloatTimeDomainData: (buffer: Float32Array) => buffer.fill(0) };
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: WorkingContext });
    const cancelAnimationFrame = vi.fn();
    let detector!: PitchDetector;
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      configurable: true,
      writable: true,
      value: vi.fn(() => {
        detector.stopListening();
        return 9;
      }),
    });
    Object.defineProperty(globalThis, "cancelAnimationFrame", {
      configurable: true,
      writable: true,
      value: cancelAnimationFrame,
    });

    const callback = vi.fn();
    detector = new PitchDetector();
    await expect(detector.startListening(callback)).resolves.toBe(false);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(9);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("cleans the active graph when requestAnimationFrame setup fails", async () => {
    const { stream, track } = createStream();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    const source = { connect: vi.fn(), disconnect: vi.fn() };
    const close = vi.fn().mockResolvedValue(undefined);
    class WorkingContext {
      state = "running";
      sampleRate = 44100;
      close = close;
      createMediaStreamSource() {
        return source;
      }
      createAnalyser() {
        return {
          fftSize: 2048,
          getFloatTimeDomainData: (buffer: Float32Array) => buffer.fill(0),
        };
      }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: WorkingContext });
    const request = vi.fn(() => { throw new Error("animation scheduling failed"); });
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      configurable: true,
      writable: true,
      value: request,
    });
    const callback = vi.fn();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(new PitchDetector().startListening(callback)).resolves.toBe(false);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(null);
    expect(request).toHaveBeenCalledTimes(1);
    expect(source.disconnect).toHaveBeenCalledTimes(1);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith("Pitch detection error:", expect.any(Error));
  });

  it("does not upload microphone data through a network API", async () => {
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
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network upload is forbidden"));
    const xhrOpenSpy = vi.spyOn(XMLHttpRequest.prototype, "open");
    const xhrSendSpy = vi.spyOn(XMLHttpRequest.prototype, "send");
    const websocketDescriptor = Object.getOwnPropertyDescriptor(globalThis, "WebSocket");
    const websocketSpy = vi.fn(function () { throw new Error("network upload is forbidden"); });
    Object.defineProperty(globalThis, "WebSocket", { configurable: true, writable: true, value: websocketSpy });
    const beaconDescriptor = Object.getOwnPropertyDescriptor(navigator, "sendBeacon");
    const beaconSpy = vi.fn(() => { throw new Error("network upload is forbidden"); });
    Object.defineProperty(navigator, "sendBeacon", { configurable: true, writable: true, value: beaconSpy });

    try {
      const detector = new PitchDetector();
      await expect(detector.startListening(() => undefined)).resolves.toBe(true);
      detector.stopListening();
      expect(track.stop).toHaveBeenCalledTimes(1);

      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: { getUserMedia: vi.fn().mockRejectedValue(new Error("permission denied")) },
      });
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      await expect(new PitchDetector().startListening(() => undefined)).resolves.toBe(false);

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(xhrOpenSpy).not.toHaveBeenCalled();
      expect(xhrSendSpy).not.toHaveBeenCalled();
      expect(websocketSpy).not.toHaveBeenCalled();
      expect(beaconSpy).not.toHaveBeenCalled();
    } finally {
      if (websocketDescriptor) Object.defineProperty(globalThis, "WebSocket", websocketDescriptor);
      else delete (globalThis as { WebSocket?: unknown }).WebSocket;
      if (beaconDescriptor) Object.defineProperty(navigator, "sendBeacon", beaconDescriptor);
      else delete (navigator as { sendBeacon?: unknown }).sendBeacon;
    }
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

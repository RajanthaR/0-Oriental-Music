import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { PitchDetectorView } from "@/components/audio/PitchDetectorView";
import {
  pitchResultFixture,
  resetAudioComponentMocks,
  PitchCallback,
} from "./support/audio-component-mocks";

const routeParams = vi.hoisted(() => ({ id: "inst-tabla" }));

const audioMocks = vi.hoisted(() => ({
  playBol: vi.fn(),
  playSwaraTone: vi.fn(),
  playSequence: vi.fn(),
  playSwaraToneHandle: vi.fn(() => Object.assign(vi.fn(), { ready: Promise.resolve(true) })),
  playSequenceHandle: vi.fn(() => Object.assign(vi.fn(), { ready: Promise.resolve(true) })),
}));

const pitchMocks = vi.hoisted(() => ({
  PitchDetector: vi.fn(),
}));

vi.mock("@/lib/audio/tabla", () => ({
  tablaSynth: audioMocks,
}));

vi.mock("@/lib/audio/synth", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/audio/synth")>();
  return {
    ...original,
    swaraSynth: {
      playSwaraTone: audioMocks.playSwaraTone,
      playSequence: audioMocks.playSequence,
      playSwaraToneHandle: audioMocks.playSwaraToneHandle,
      playSequenceHandle: audioMocks.playSequenceHandle,
    },
  };
});

vi.mock("@/lib/audio/pitch", () => ({
  PitchDetector: pitchMocks.PitchDetector,
}));

vi.mock("next/navigation", () => ({
  useParams: () => routeParams,
}));

afterEach(() =>
  resetAudioComponentMocks({ routeParams, audioMocks, pitchMocks }),
);

describe("PitchDetectorView microphone ownership", () => {
  it("keeps a newer microphone session active when an older start resolves later", async () => {
    let resolveFirst!: (success: boolean) => void;
    let resolveSecond!: (success: boolean) => void;
    const callbacks: PitchCallback[] = [];
    const detector = {
      startListening: vi.fn((callback: PitchCallback) => {
        callbacks.push(callback);
        return new Promise<boolean>((resolve) => {
          if (callbacks.length === 1) resolveFirst = resolve;
          else resolveSecond = resolve;
        });
      }),
      stopListening: vi.fn(),
    };
    const onTargetMatched = vi.fn();
    // Vitest 4 (@vitest/spy v4) invokes mocked constructors with real `new`
    // semantics: an arrow-function implementation is not constructable and
    // throws "() => detector is not a constructor". A regular function whose
    // body returns an object makes `new` yield that object, preserving the
    // exact fixture contract the Vitest 3 mock relied on.
    pitchMocks.PitchDetector.mockImplementation(function () {
      return detector;
    });

    render(<PitchDetectorView onTargetMatched={onTargetMatched} />);
    const startButton = screen.getByRole("button", { name: "මයික්‍රෆෝනය අරඹන්න" });
    fireEvent.click(startButton);
    fireEvent.click(startButton);
    expect(detector.startListening).toHaveBeenCalledTimes(2);
    expect(callbacks).toHaveLength(2);

    await act(async () => {
      resolveSecond(true);
      await Promise.resolve();
    });
    expect(screen.getByRole("button", { name: "මයික්‍රෆෝනය නවත්වන්න" })).toBeInTheDocument();
    expect(detector.stopListening).not.toHaveBeenCalled();
    act(() => callbacks[1](pitchResultFixture()));
    expect(onTargetMatched).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst(true);
      await Promise.resolve();
    });
    expect(screen.getByRole("button", { name: "මයික්‍රෆෝනය නවත්වන්න" })).toBeInTheDocument();
    expect(detector.stopListening).not.toHaveBeenCalled();
    act(() => callbacks[0](pitchResultFixture()));
    expect(onTargetMatched).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "මයික්‍රෆෝනය නවත්වන්න" }));
    expect(detector.stopListening).toHaveBeenCalledTimes(1);
  });

  it("suppresses a retained microphone callback after the user stops", async () => {
    let resolveStart!: (success: boolean) => void;
    let callback!: PitchCallback;
    const detector = {
      startListening: vi.fn((nextCallback: PitchCallback) => {
        callback = nextCallback;
        return new Promise<boolean>((resolve) => { resolveStart = resolve; });
      }),
      stopListening: vi.fn(),
    };
    const onTargetMatched = vi.fn();
    // Vitest 4 (@vitest/spy v4) invokes mocked constructors with real `new`
    // semantics: an arrow-function implementation is not constructable and
    // throws "() => detector is not a constructor". A regular function whose
    // body returns an object makes `new` yield that object, preserving the
    // exact fixture contract the Vitest 3 mock relied on.
    pitchMocks.PitchDetector.mockImplementation(function () {
      return detector;
    });

    render(<PitchDetectorView onTargetMatched={onTargetMatched} />);
    fireEvent.click(screen.getByRole("button", { name: "මයික්‍රෆෝනය අරඹන්න" }));
    await act(async () => {
      resolveStart(true);
      await Promise.resolve();
    });
    act(() => callback(pitchResultFixture()));
    expect(onTargetMatched).toHaveBeenCalledTimes(1);
    expect(screen.getByText("ස (Sa)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "මයික්‍රෆෝනය නවත්වන්න" }));
    act(() => callback(pitchResultFixture()));
    expect(onTargetMatched).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("ස (Sa)")).not.toBeInTheDocument();
    expect(detector.stopListening).toHaveBeenCalledTimes(1);
  });

  it("suppresses a callback and a pending start completion after unmount", async () => {
    let resolveStart!: (success: boolean) => void;
    let callback!: PitchCallback;
    const detector = {
      startListening: vi.fn((nextCallback: PitchCallback) => {
        callback = nextCallback;
        return new Promise<boolean>((resolve) => { resolveStart = resolve; });
      }),
      stopListening: vi.fn(),
    };
    const onTargetMatched = vi.fn();
    // Vitest 4 (@vitest/spy v4) invokes mocked constructors with real `new`
    // semantics: an arrow-function implementation is not constructable and
    // throws "() => detector is not a constructor". A regular function whose
    // body returns an object makes `new` yield that object, preserving the
    // exact fixture contract the Vitest 3 mock relied on.
    pitchMocks.PitchDetector.mockImplementation(function () {
      return detector;
    });

    const { unmount } = render(<PitchDetectorView onTargetMatched={onTargetMatched} />);
    fireEvent.click(screen.getByRole("button", { name: "මයික්‍රෆෝනය අරඹන්න" }));
    expect(callback).toEqual(expect.any(Function));
    unmount();
    expect(detector.stopListening).toHaveBeenCalledTimes(1);

    act(() => callback(pitchResultFixture()));
    await act(async () => {
      resolveStart(true);
      await Promise.resolve();
    });
    expect(onTargetMatched).not.toHaveBeenCalled();
  });
});

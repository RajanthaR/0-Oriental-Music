import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { TalaVisualizer } from "@/components/audio/TalaVisualizer";
import { RhythmTapGame } from "@/components/audio/RhythmTapGame";
import type { Tala } from "@/types/content";
import {
  getKhemtaFixture,
  readyCancel,
  rejectingPlayback,
  resetAudioComponentMocks,
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

describe("RhythmTapGame playback ownership", () => {
  it("keeps a co-mounted rhythm caller advancing when the Tala visualizer stops", () => {
    const tala = getKhemtaFixture();
    audioMocks.playBol.mockImplementation(() => readyCancel());
    vi.useFakeTimers();
    render(
      <>
        <TalaVisualizer tala={tala} />
        <RhythmTapGame bpm={100} totalBeats={8} />
      </>
    );
    fireEvent.click(screen.getByRole("button", { name: "අරඹන්න" }));
    act(() => { vi.advanceTimersByTime(600); });
    expect(screen.getByText("ස්පන්දනය: 1 / 8")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    fireEvent.click(screen.getByRole("button", { name: "නවත්වන්න" }));
    act(() => { vi.advanceTimersByTime(600); });
    expect(screen.getByText("ස්පන්දනය: 2 / 8")).toBeInTheDocument();
  });

  it("finishes the rhythm game once and cancels owned playback on reset", () => {
    vi.useFakeTimers();
    const cancels: Array<ReturnType<typeof vi.fn>> = [];
    audioMocks.playBol.mockImplementation(() => {
      const cancel = vi.fn();
      cancels.push(cancel);
      return readyCancel(cancel);
    });
    const onComplete = vi.fn();
    render(<RhythmTapGame bpm={120} totalBeats={1} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: "අරඹන්න" }));
    act(() => { vi.advanceTimersByTime(500); });
    expect(cancels).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "නැවත මුලට" }));
    expect(cancels[0]).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "අරඹන්න" }));
    act(() => { vi.advanceTimersByTime(500); });
    fireEvent.click(screen.getByRole("button", { name: "තාල පහරට තට්ටු කරන්න" }));
    act(() => { vi.advanceTimersByTime(1000); });
    expect(onComplete).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("keeps an active rhythm session when only the completion callback changes", () => {
    vi.useFakeTimers();
    audioMocks.playBol.mockImplementation(() => readyCancel());
    const firstComplete = vi.fn();
    const secondComplete = vi.fn();
    const view = render(<RhythmTapGame bpm={120} totalBeats={3} onComplete={firstComplete} />);

    fireEvent.click(screen.getByRole("button", { name: "අරඹන්න" }));
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText("ස්පන්දනය: 1 / 3")).toBeInTheDocument();

    view.rerender(<RhythmTapGame bpm={120} totalBeats={3} onComplete={secondComplete} />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText("ස්පන්දනය: 2 / 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "තාල පහරට තට්ටු කරන්න" }));
    fireEvent.click(screen.getByRole("button", { name: "අවසන් කරන්න" }));
    expect(firstComplete).not.toHaveBeenCalled();
    expect(secondComplete).toHaveBeenCalledTimes(1);
    expect(secondComplete).toHaveBeenCalledWith(expect.any(Number));
    view.unmount();
  });

  it("removes completed rhythm playback handles before reset", async () => {
    vi.useFakeTimers();
    let resolveFinished!: () => void;
    const finished = new Promise<void>((resolve) => { resolveFinished = resolve; });
    const completedCancel = vi.fn();
    audioMocks.playBol
      .mockReturnValueOnce(Object.assign(completedCancel, { ready: Promise.resolve(true), finished }))
      .mockImplementation(() => readyCancel());

    const view = render(<RhythmTapGame bpm={120} totalBeats={1} />);
    fireEvent.click(screen.getByRole("button", { name: "අරඹන්න" }));
    act(() => { vi.advanceTimersByTime(500); });
    await act(async () => {
      resolveFinished();
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole("button", { name: "නැවත මුලට" }));
    expect(completedCancel).not.toHaveBeenCalled();
    view.unmount();
  });

  it("continues Rhythm cleanup when an owned handle cancellation throws", () => {
    vi.useFakeTimers();
    const firstCancel = vi.fn(() => { throw new Error("first cancellation failed"); });
    const secondCancel = vi.fn();
    const neverFinished = new Promise<void>(() => undefined);
    audioMocks.playBol
      .mockReturnValueOnce(Object.assign(firstCancel, { ready: Promise.resolve(true), finished: neverFinished }))
      .mockReturnValueOnce(Object.assign(secondCancel, { ready: Promise.resolve(true), finished: neverFinished }));

    const view = render(<RhythmTapGame bpm={120} totalBeats={4} />);
    fireEvent.click(screen.getByRole("button", { name: "අරඹන්න" }));
    act(() => { vi.advanceTimersByTime(500); });
    fireEvent.click(screen.getByRole("button", { name: "තාල පහරට තට්ටු කරන්න" }));
    expect(() => fireEvent.click(screen.getByRole("button", { name: "නැවත මුලට" }))).not.toThrow();
    expect(firstCancel).toHaveBeenCalledTimes(1);
    expect(secondCancel).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it("keeps Rhythm visual timing available when Tabla creation throws", () => {
    vi.useFakeTimers();
    audioMocks.playBol.mockImplementation(() => { throw new Error("tabla creation failed"); });
    const view = render(<RhythmTapGame bpm={120} totalBeats={2} />);

    fireEvent.click(screen.getByRole("button", { name: "අරඹන්න" }));
    expect(() => act(() => { vi.advanceTimersByTime(500); })).not.toThrow();
    expect(screen.getByText("මෙම උපාංගයේ තබ්ලා නාදය ආරම්භ කළ නොහැක. දෘශ්‍ය ස්පන්දනයට අනුව පුහුණු වන්න.")).toBeInTheDocument();
    view.unmount();
  });

  it("keeps RhythmTapGame playback ownership isolated when Tabla promises reject", async () => {
    vi.useFakeTimers();
    const first = rejectingPlayback();
    const second = rejectingPlayback();
    audioMocks.playBol
      .mockReturnValueOnce(first.handle)
      .mockReturnValueOnce(second.handle);

    const view = render(<RhythmTapGame bpm={120} totalBeats={2} />);
    fireEvent.click(screen.getByRole("button", { name: "අරඹන්න" }));
    act(() => { vi.advanceTimersByTime(500); });
    expect(audioMocks.playBol).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "නැවත මුලට" }));
    expect(first.handle).toHaveBeenCalledTimes(1);
    await act(async () => {
      first.rejectReady(new Error("stale ready after rhythm reset"));
      first.rejectFinished(new Error("stale finished after rhythm reset"));
      await Promise.resolve();
    });
    expect(screen.getByText("ආරම්භ කිරීමට 'අරඹන්න' ඔබන්න")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "අරඹන්න" }));
    act(() => { vi.advanceTimersByTime(500); });
    expect(audioMocks.playBol).toHaveBeenCalledTimes(2);
    expect(first.handle).toHaveBeenCalledTimes(1);
    expect(second.handle).not.toHaveBeenCalled();

    view.unmount();
    expect(second.handle).toHaveBeenCalledTimes(1);
    await act(async () => {
      second.rejectReady(new Error("stale ready after rhythm unmount"));
      second.rejectFinished(new Error("stale finished after rhythm unmount"));
      await Promise.resolve();
    });
  });

  it("suppresses stale Rhythm unavailable callbacks after reset", () => {
    vi.useFakeTimers();
    const unavailableCallbacks: Array<() => void> = [];
    audioMocks.playBol.mockImplementation((_bol, _duration, onUnavailable) => {
      unavailableCallbacks.push(onUnavailable ?? (() => undefined));
      return readyCancel();
    });
    render(<RhythmTapGame bpm={120} totalBeats={1} />);

    fireEvent.click(screen.getByRole("button", { name: "අරඹන්න" }));
    act(() => { vi.advanceTimersByTime(500); });
    fireEvent.click(screen.getByRole("button", { name: "නැවත මුලට" }));
    act(() => { unavailableCallbacks[0](); });
    expect(screen.queryByText("මෙම උපාංගයේ තබ්ලා නාදය ආරම්භ කළ නොහැක. දෘශ්‍ය ස්පන්දනයට අනුව පුහුණු වන්න.")).not.toBeInTheDocument();
  });
});

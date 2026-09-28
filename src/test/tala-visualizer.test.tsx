import React, { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { TalaVisualizer } from "@/components/audio/TalaVisualizer";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
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

describe("TalaVisualizer playback and hydration ownership", () => {
  it("maps the evidence-supported tala into the visualizer and discloses practice-only BPM", () => {
    const khemta = getKhemtaFixture();
    render(<TalaVisualizer tala={khemta} />);
    expect(screen.getByText(/මාත්‍රා 4 \| විභාග 2 \(2\+2\)/)).toBeInTheDocument();
    expect(screen.getByText(/යෙදුමේ පුහුණු වේගය:/)).toBeInTheDocument();
    expect(screen.getByText(/මූලාශ්‍රයෙන් සනාථ කළ ලය වර්ගීකරණයක් නොවේ/)).toBeInTheDocument();
  });

  it("keeps each TalaVisualizer playback handle owned by its lifecycle", () => {
    const tala = getKhemtaFixture();
    const cancels: Array<ReturnType<typeof vi.fn>> = [];
    audioMocks.playBol.mockImplementation(() => {
      const cancel = vi.fn();
      cancels.push(cancel);
      return readyCancel(cancel);
    });
    vi.useFakeTimers();
    const { unmount } = render(<TalaVisualizer tala={tala} />);
    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    expect(audioMocks.playBol).toHaveBeenCalledTimes(1);
    expect(cancels[0]).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(800); });
    expect(audioMocks.playBol).toHaveBeenCalledTimes(2);
    expect(cancels[0]).toHaveBeenCalledTimes(1);
    expect(cancels[1]).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "නවත්වන්න" }));
    expect(cancels[1]).toHaveBeenCalledTimes(1);
    unmount();
    expect(cancels[1]).toHaveBeenCalledTimes(1);
  });

  it("cancels active audio on audio-off without stopping visual timing", () => {
    const tala = getKhemtaFixture();
    const cancels: Array<ReturnType<typeof vi.fn>> = [];
    audioMocks.playBol.mockImplementation(() => {
      const cancel = vi.fn();
      cancels.push(cancel);
      return readyCancel(cancel);
    });
    vi.useFakeTimers();
    render(<TalaVisualizer tala={tala} />);
    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    expect(audioMocks.playBol).toHaveBeenLastCalledWith(tala.bols[0].bol_si, 600, expect.any(Function));
    act(() => { vi.advanceTimersByTime(300); });
    fireEvent.click(screen.getByRole("button", { name: "තබ්ලා නාදය පාලනය" }));
    expect(cancels[0]).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(299); });
    expect(screen.getByText(/මාත්‍රා 1 \/ 4/)).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByText(/මාත්‍රා 2 \/ 4/)).toBeInTheDocument();
    expect(audioMocks.playBol).toHaveBeenCalledTimes(1);
  });

  it("cancels the caller-owned stroke when BPM changes while playing", () => {
    const tala = getKhemtaFixture();
    const cancel = vi.fn();
    audioMocks.playBol.mockReturnValue(readyCancel(cancel));
    vi.useFakeTimers();
    render(<TalaVisualizer tala={tala} />);
    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    expect(cancel).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(400); });
    fireEvent.change(screen.getByRole("slider", { name: "තාලයේ වේගය (BPM)" }), {
      target: { value: "120" },
    });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/මාත්‍රා 1 \/ 4/)).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(499); });
    expect(screen.getByText(/මාත්‍රා 1 \/ 4/)).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByText(/මාත්‍රා 2 \/ 4/)).toBeInTheDocument();
  });

  it("resets playback when a same-ID tala is replaced", () => {
    const tala = getKhemtaFixture();
    const cancel = vi.fn();
    audioMocks.playBol.mockReturnValue(readyCancel(cancel));
    const { rerender } = render(<TalaVisualizer tala={tala} />);
    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    rerender(<TalaVisualizer tala={{ ...tala, bols: tala.bols.map((bol, index) => index === 0 ? { ...bol, bol_si: `${bol.bol_si} වෙනස්` } : bol) }} />);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "තාලය අරඹන්න" })).toBeInTheDocument();
    expect(screen.getByText(/මාත්‍රා 1 \/ 4/)).toBeInTheDocument();
  });

  it("cancels playback on Reset, tala change, and unmount", () => {
    const tala = getKhemtaFixture();
    const cancels: Array<ReturnType<typeof vi.fn>> = [];
    audioMocks.playBol.mockImplementation(() => {
      const cancel = vi.fn();
      cancels.push(cancel);
      return readyCancel(cancel);
    });
    vi.useFakeTimers();
    const { rerender, unmount } = render(<TalaVisualizer tala={tala} />);
    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    fireEvent.click(screen.getByRole("button", { name: "නැවත මුලට" }));
    expect(cancels[0]).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/මාත්‍රා 1 \/ 4/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    rerender(<TalaVisualizer tala={{ ...tala, id: "tala-khemta-review-copy" }} />);
    expect(cancels[1]).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "තාලය අරඹන්න" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    unmount();
    expect(cancels[2]).toHaveBeenCalledTimes(1);
  });

  it("keeps co-mounted TalaVisualizer playback cancellation isolated", () => {
    const tala = getKhemtaFixture();
    const cancels: Array<ReturnType<typeof vi.fn>> = [];
    audioMocks.playBol.mockImplementation(() => {
      const cancel = vi.fn();
      cancels.push(cancel);
      return readyCancel(cancel);
    });
    const { unmount } = render(
      <>
        <TalaVisualizer tala={tala} />
        <TalaVisualizer tala={{ ...tala, id: "tala-khemta-second", name_si: "දෙවන ඛෙම්ටෝ තාලය" }} />
      </>
    );
    const starts = screen.getAllByRole("button", { name: "තාලය අරඹන්න" });
    fireEvent.click(starts[0]);
    fireEvent.click(starts[1]);
    expect(cancels).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "නවත්වන්න" })[0]);
    expect(cancels[0]).toHaveBeenCalledTimes(1);
    expect(cancels[1]).not.toHaveBeenCalled();
    unmount();
    expect(cancels[1]).toHaveBeenCalledTimes(1);
  });

  it("serializes circular beat coordinates deterministically", async () => {
    const { getCircularBeatStyle } = await import("@/components/audio/TalaVisualizer");
    expect(getCircularBeatStyle(1, 16)).toEqual({ transform: "translate(30.614675px, -73.910363px)" });
  });

  it("hydrates the TalaVisualizer without coordinate mismatch warnings", async () => {
    const base = getKhemtaFixture();
    const tala: Tala = {
      ...base,
      id: "tala-hydration-16",
      matras: 16,
      vibhagCount: 4,
      vibhagStructure: [4, 4, 4, 4],
      taliKhali_si: ["X", "2", "0", "3"],
      bols: Array.from({ length: 16 }, (_, index) => ({
        ...base.bols[index % base.bols.length],
        matra: index + 1,
        vibhagIndex: Math.floor(index / 4),
        isSam: index === 0,
        isTali: index === 4 || index === 12,
        isKhali: index === 8,
      })),
    };
    const container = document.createElement("div");
    container.innerHTML = renderToString(<TalaVisualizer tala={tala} />);
    document.body.appendChild(container);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(container, <TalaVisualizer tala={tala} />);
    });
    const hydrationMessages = consoleError.mock.calls
      .flat()
      .map(String)
      .filter((message) => /hydration|did not match|server html/i.test(message));
    expect(hydrationMessages).toEqual([]);
    await act(async () => root?.unmount());
    container.remove();
    consoleError.mockRestore();
  });

  it("exposes 44px controls, pressed mode state, and bounded invalid BPM", () => {
    const tala = getKhemtaFixture();
    render(<TalaVisualizer tala={tala} initialBpm={-500} />);
    expect(screen.getByText(/යෙදුමේ පුහුණු වේගය: 100 BPM/)).toBeInTheDocument();
    const circular = screen.getByRole("button", { name: "චක්‍රාකාර" });
    const linear = screen.getByRole("button", { name: "සරල රේඛීය" });
    expect(circular).toHaveAttribute("aria-pressed", "true");
    expect(circular.className).toContain("min-h-[44px]");
    expect(screen.getByRole("button", { name: "තබ්ලා නාදය පාලනය" }).className).toContain("min-w-[44px]");
    fireEvent.click(linear);
    expect(linear).toHaveAttribute("aria-pressed", "true");
  });

  it("survives rapid StrictMode start-stop-start and reports unavailable Web Audio", async () => {
    const tala = getKhemtaFixture();
    const cancels: Array<ReturnType<typeof vi.fn>> = [];
    audioMocks.playBol.mockImplementation((_bol, _duration, onUnavailable) => {
      const cancel = vi.fn();
      cancels.push(cancel);
      onUnavailable?.();
      return Object.assign(cancel, { ready: Promise.resolve(false) });
    });
    render(<StrictMode><TalaVisualizer tala={tala} /></StrictMode>);
    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    expect(await screen.findByRole("status")).toHaveTextContent("තබ්ලා නාදය ආරම්භ කළ නොහැක");
    fireEvent.click(screen.getByRole("button", { name: "නවත්වන්න" }));
    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    expect(cancels).toHaveLength(2);
    expect(cancels[0]).toHaveBeenCalledTimes(1);
    expect(cancels[1]).not.toHaveBeenCalled();
  });

  it("releases a Tala handle only after ready and finished settle", async () => {
    const tala = getKhemtaFixture();
    let resolveReady!: (played: boolean) => void;
    let resolveFinished!: () => void;
    const cancel = vi.fn();
    const handle = Object.assign(cancel, {
      ready: new Promise<boolean>((resolve) => { resolveReady = resolve; }),
      finished: new Promise<void>((resolve) => { resolveFinished = resolve; }),
    });
    audioMocks.playBol.mockReturnValue(handle);
    const view = render(<TalaVisualizer tala={tala} />);

    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    await act(async () => {
      resolveReady(true);
      await Promise.resolve();
    });
    expect(cancel).not.toHaveBeenCalled();

    await act(async () => {
      resolveFinished();
      await Promise.resolve();
    });
    view.unmount();
    expect(cancel).not.toHaveBeenCalled();
  });

  it("contains throwing Tala cleanup and reports synchronous Tabla failure", async () => {
    const tala = getKhemtaFixture();
    const cancel = vi.fn(() => { throw new Error("cancel failed"); });
    audioMocks.playBol.mockReturnValue(Object.assign(cancel, {
      ready: Promise.resolve(true),
      finished: new Promise<void>(() => undefined),
    }));
    const view = render(<TalaVisualizer tala={tala} />);
    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    expect(() => fireEvent.click(screen.getByRole("button", { name: "නවත්වන්න" }))).not.toThrow();
    expect(cancel).toHaveBeenCalledTimes(1);
    view.unmount();

    audioMocks.playBol.mockImplementation(() => { throw new Error("tabla setup failed"); });
    const replacement = render(<TalaVisualizer tala={tala} />);
    expect(() => fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }))).not.toThrow();
    expect(await screen.findByRole("status")).toHaveTextContent("තබ්ලා නාදය ආරම්භ කළ නොහැක");
    replacement.unmount();
  });

  it("suppresses stale Tala unavailable callbacks after reset and replacement", () => {
    const unavailableCallbacks: Array<() => void> = [];
    audioMocks.playBol.mockImplementation((_bol, _duration, onUnavailable) => {
      unavailableCallbacks.push(onUnavailable ?? (() => undefined));
      return readyCancel();
    });
    const tala = getKhemtaFixture();
    render(<TalaVisualizer tala={tala} />);

    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    fireEvent.click(screen.getByRole("button", { name: "නවත්වන්න" }));
    act(() => { unavailableCallbacks[0](); });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    act(() => { unavailableCallbacks[0](); });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    act(() => { unavailableCallbacks[1](); });
    expect(screen.getByRole("status")).toHaveTextContent("තබ්ලා නාදය ආරම්භ කළ නොහැක");
  });

  it("suppresses queued Tala callbacks after completion and unmount", async () => {
    const tala = getKhemtaFixture();
    const unavailableCallbacks: Array<() => void> = [];
    let resolveFinished!: () => void;
    audioMocks.playBol.mockImplementation((_bol, _duration, onUnavailable) => {
      unavailableCallbacks.push(onUnavailable ?? (() => undefined));
      return Object.assign(vi.fn(), {
        ready: Promise.resolve(true),
        finished: new Promise<void>((resolve) => { resolveFinished = resolve; }),
      });
    });
    const view = render(<TalaVisualizer tala={tala} />);

    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    await act(async () => {
      resolveFinished();
      await Promise.resolve();
    });
    act(() => { unavailableCallbacks[0]?.(); });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    view.unmount();
    act(() => { unavailableCallbacks[0]?.(); });
  });

  it("contains rejected Tala ready and finished promises across reset, replacement, and unmount", async () => {
    const tala = getKhemtaFixture();
    const first = rejectingPlayback();
    const second = rejectingPlayback();
    const third = rejectingPlayback();
    audioMocks.playBol
      .mockReturnValueOnce(first.handle)
      .mockReturnValueOnce(second.handle)
      .mockReturnValueOnce(third.handle);

    const view = render(<TalaVisualizer tala={tala} />);
    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    fireEvent.click(screen.getByRole("button", { name: "නැවත මුලට" }));
    expect(first.handle).toHaveBeenCalledTimes(1);

    await act(async () => {
      first.rejectReady(new Error("stale ready after reset"));
      first.rejectFinished(new Error("stale finished after reset"));
      await Promise.resolve();
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    expect(audioMocks.playBol).toHaveBeenCalledTimes(2);
    view.rerender(<TalaVisualizer tala={{ ...tala, id: "tala-khemta-replacement" }} />);
    expect(second.handle).toHaveBeenCalledTimes(1);
    expect(first.handle).toHaveBeenCalledTimes(1);

    await act(async () => {
      second.rejectReady(new Error("stale ready after replacement"));
      second.rejectFinished(new Error("stale finished after replacement"));
      await Promise.resolve();
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    expect(audioMocks.playBol).toHaveBeenCalledTimes(3);
    view.unmount();
    expect(third.handle).toHaveBeenCalledTimes(1);

    await act(async () => {
      third.rejectReady(new Error("stale ready after unmount"));
      third.rejectFinished(new Error("stale finished after unmount"));
      await Promise.resolve();
    });
  });
});

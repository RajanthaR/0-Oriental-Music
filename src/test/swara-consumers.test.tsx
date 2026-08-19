import React, { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SwaraKeyboard } from "@/components/audio/SwaraKeyboard";
import { NotationArranger } from "@/components/audio/NotationArranger";
import { EarTrainingModule } from "@/components/audio/EarTrainingModule";
import LessonDetailPage from "@/app/lessons/[id]/page";
import RagaDetailPage from "@/app/ragas/[id]/page";
import InstrumentDetailPage from "@/app/instruments/[id]/page";
import { repository } from "@/lib/data/repository";
import instrumentsData from "@/data/instruments.json";
import type { Instrument } from "@/types/content";

const routeParams = vi.hoisted(() => ({ id: "les-intro-01" }));

const audioMocks = vi.hoisted(() => ({
  playSwaraToneHandle: vi.fn(),
  playSequenceHandle: vi.fn(),
  playBol: vi.fn(),
}));

vi.mock("@/lib/audio/synth", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/audio/synth")>();
  return {
    ...original,
    swaraSynth: {
      playSwaraToneHandle: audioMocks.playSwaraToneHandle,
      playSequenceHandle: audioMocks.playSequenceHandle,
    },
  };
});

vi.mock("@/lib/audio/tabla", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/audio/tabla")>();
  return {
    ...original,
    tablaSynth: { playBol: audioMocks.playBol },
  };
});

vi.mock("next/navigation", () => ({
  useParams: () => routeParams,
}));

const resolvedPlayback = () => Object.assign(vi.fn(), {
  ready: Promise.resolve(true),
  finished: Promise.resolve(),
});

/**
 * A handle whose cancellation throws and whose `finished` promise never settles,
 * so the consumer keeps owning it until cleanup explicitly releases it. This is
 * the exact shape that used to strand ownership and abort later cleanup steps.
 */
const throwingPlayback = () => {
  const cancel = vi.fn(() => { throw new Error("cancellation failed"); });
  return Object.assign(cancel, {
    ready: Promise.resolve(true),
    finished: new Promise<void>(() => undefined),
  });
};

const throwingPlaybackFactory = () => {
  const cancels: Array<ReturnType<typeof vi.fn>> = [];
  const create = () => {
    const handle = throwingPlayback();
    cancels.push(handle);
    return handle;
  };
  return { cancels, create };
};

const rejectingPlayback = () => {
  let rejectReady!: (reason?: unknown) => void;
  let rejectFinished!: (reason?: unknown) => void;
  const ready = new Promise<boolean>((_, reject) => { rejectReady = reject; });
  const finished = new Promise<void>((_, reject) => { rejectFinished = reject; });
  const cancel = vi.fn();
  return {
    handle: Object.assign(cancel, { ready, finished }),
    rejectReady,
    rejectFinished,
  };
};

const rejectPlayback = async (playback: ReturnType<typeof rejectingPlayback>) => {
  await act(async () => {
    playback.rejectReady(new Error("ready rejected"));
    await Promise.resolve();
    playback.rejectFinished(new Error("finished rejected"));
    await Promise.resolve();
  });
};

afterEach(() => {
  vi.useRealTimers();
  routeParams.id = "les-intro-01";
  audioMocks.playSwaraToneHandle.mockReset().mockImplementation(resolvedPlayback);
  audioMocks.playSequenceHandle.mockReset().mockImplementation(resolvedPlayback);
  audioMocks.playBol.mockReset().mockImplementation(resolvedPlayback);
});

describe("Swara playback rejection consumers", () => {
  it("releases a rejected keyboard scale and reports unavailable audio", async () => {
    const playback = rejectingPlayback();
    audioMocks.playSequenceHandle.mockReturnValueOnce(playback.handle);
    const view = render(<SwaraKeyboard />);

    fireEvent.click(screen.getAllByRole("button", { name: "ආරෝහණය අසන්න" })[0]);
    expect(screen.getByRole("button", { name: "වාදනය වේ..." })).toBeDisabled();
    await rejectPlayback(playback);

    expect(await screen.findByRole("alert")).toHaveTextContent("නාදය ආරම්භ කළ නොහැක");
    await waitFor(() => expect(screen.getAllByRole("button", { name: "ආරෝහණය අසන්න" })[0]).not.toBeDisabled());
    view.unmount();
  });

  it("contains a rejected keyboard direct-tone lifecycle", async () => {
    const playback = rejectingPlayback();
    audioMocks.playSwaraToneHandle.mockReturnValueOnce(playback.handle);
    const view = render(<SwaraKeyboard />);

    fireEvent.click(screen.getByRole("button", { name: "ස (ෂඩ්ජ) ස්වරය" }));
    await rejectPlayback(playback);

    expect(await screen.findByRole("alert")).toHaveTextContent("නාදය ආරම්භ කළ නොහැක");
    view.unmount();
  });

  it("contains rejected NotationArranger tone promises", async () => {
    const playback = rejectingPlayback();
    audioMocks.playSwaraToneHandle.mockReturnValueOnce(playback.handle);
    const view = render(<NotationArranger />);

    fireEvent.click(screen.getByRole("button", { name: "ස" }));
    await rejectPlayback(playback);

    expect(await screen.findByRole("alert")).toHaveTextContent("නාදය ආරම්භ කළ නොහැක");
    view.unmount();
  });

  it("cancels a NotationArranger tone when its arranged item is removed", () => {
    const cancel = vi.fn();
    const neverSettled = new Promise<void>(() => undefined);
    audioMocks.playSwaraToneHandle.mockReturnValueOnce(Object.assign(cancel, {
      ready: Promise.resolve(true),
      finished: neverSettled,
    }));
    const view = render(<NotationArranger />);

    fireEvent.click(screen.getByRole("button", { name: "ස" }));
    expect(cancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTitle("ඉවත් කිරීමට ක්ලික් කරන්න"));
    expect(cancel).toHaveBeenCalledTimes(1);

    view.unmount();
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("releases a Swara tone when onNotePlay throws", () => {
    const cancel = vi.fn();
    const neverReady = new Promise<boolean>(() => undefined);
    const neverFinished = new Promise<void>(() => undefined);
    audioMocks.playSwaraToneHandle.mockReturnValueOnce(Object.assign(cancel, {
      ready: neverReady,
      finished: neverFinished,
    }));
    const view = render(<SwaraKeyboard onNotePlay={() => { throw new Error("consumer failed"); }} />);

    expect(() => fireEvent.click(screen.getByRole("button", { name: "ස (ෂඩ්ජ) ස්වරය" }))).not.toThrow();
    expect(cancel).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("does not schedule owned Swara work after a synchronous unmount callback", () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const neverReady = new Promise<boolean>(() => undefined);
    const neverFinished = new Promise<void>(() => undefined);
    audioMocks.playSwaraToneHandle.mockReturnValueOnce(Object.assign(cancel, {
      ready: neverReady,
      finished: neverFinished,
    }));

    const Parent = () => {
      const [visible, setVisible] = useState(true);
      return visible ? <SwaraKeyboard onNotePlay={() => setVisible(false)} /> : null;
    };
    const view = render(<Parent />);
    fireEvent.click(screen.getByRole("button", { name: "ස (ෂඩ්ජ) ස්වරය" }));
    act(() => { vi.advanceTimersByTime(1000); });

    expect(cancel).toHaveBeenCalledTimes(1);
    view.unmount();
    vi.useRealTimers();
  });

  it("contains rejected EarTraining tone promises", async () => {
    const playback = rejectingPlayback();
    audioMocks.playSwaraToneHandle.mockReturnValueOnce(playback.handle);
    const view = render(<EarTrainingModule />);

    fireEvent.click(screen.getByRole("button", { name: /නාදය අසන්න/ }));
    await rejectPlayback(playback);

    expect(await screen.findByRole("alert")).toHaveTextContent("නාදය ආරම්භ කළ නොහැක");
    view.unmount();
  });

  it("resets a rejected lesson sequence in a finally path", async () => {
    const playback = rejectingPlayback();
    audioMocks.playSequenceHandle.mockReturnValueOnce(playback.handle);
    routeParams.id = "les-intro-01";
    const view = render(<LessonDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: "ආදර්ශනයට සවන් දෙන්න" }));
    expect(screen.getByRole("button", { name: "ශ්‍රවණය වෙමින් පවතී..." })).toBeDisabled();
    await rejectPlayback(playback);

    expect(await screen.findByRole("status")).toHaveTextContent("නාදය ආරම්භ කළ නොහැක");
    await waitFor(() => expect(screen.getByRole("button", { name: "ආදර්ශනයට සවන් දෙන්න" })).not.toBeDisabled());
    view.unmount();
  });

  it("resets a rejected Raga sequence in a finally path", async () => {
    const playback = rejectingPlayback();
    audioMocks.playSequenceHandle.mockReturnValueOnce(playback.handle);
    routeParams.id = "raga-bilawal";
    const view = render(<RagaDetailPage />);

    fireEvent.click(screen.getAllByRole("button", { name: "ආරෝහණය අසන්න" })[0]);
    expect(screen.getByRole("button", { name: "වාදනය වේ..." })).toBeDisabled();
    await rejectPlayback(playback);

    expect(await screen.findByRole("status")).toHaveTextContent("රාග නාදය ආරම්භ කළ නොහැක");
    await waitFor(() => expect(screen.getAllByRole("button", { name: "ආරෝහණය අසන්න" })[0]).not.toBeDisabled());
    view.unmount();
  });
});

describe("failure-atomic consumer audio cleanup", () => {
  it("continues EarTraining cleanup after Next, replacement, and unmount cancellations throw", () => {
    const playback = throwingPlaybackFactory();
    audioMocks.playSwaraToneHandle.mockImplementation(playback.create);
    const view = render(<EarTrainingModule />);
    const listen = screen.getByRole("button", { name: /නාදය අසන්න/ });

    fireEvent.click(listen);
    expect(playback.cancels).toHaveLength(1);

    // Replacement releases the first session; its throwing cancellation must not
    // prevent the replacement from being installed.
    expect(() => fireEvent.click(listen)).not.toThrow();
    expect(playback.cancels).toHaveLength(2);
    expect(playback.cancels[0]).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "ග (ගාන්ධාර)" }));
    // Next releases the second session; the throwing cancellation must not stop
    // the challenge from advancing.
    expect(() => fireEvent.click(screen.getByRole("button", { name: /මීළඟ අභ්‍යාසය/ }))).not.toThrow();
    expect(playback.cancels[1]).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "ම (මධ්‍යම)" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /නාදය අසන්න/ }));
    expect(playback.cancels).toHaveLength(3);
    // Unmount releases the third session; a throwing cancel must not escape the
    // effect cleanup.
    expect(() => view.unmount()).not.toThrow();
    expect(playback.cancels[2]).toHaveBeenCalledTimes(1);
  });

  it("contains a throwing lesson sequence cancellation on replacement and unmount", () => {
    const playback = throwingPlaybackFactory();
    audioMocks.playSequenceHandle.mockImplementation(playback.create);
    routeParams.id = "les-intro-01";
    const view = render(<LessonDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: "ආදර්ශනයට සවන් දෙන්න" }));
    expect(playback.cancels).toHaveLength(1);
    expect(() => view.unmount()).not.toThrow();
    expect(playback.cancels[0]).toHaveBeenCalledTimes(1);
  });

  it("contains a throwing Raga sequence cancellation on unmount", () => {
    const playback = throwingPlaybackFactory();
    audioMocks.playSequenceHandle.mockImplementation(playback.create);
    routeParams.id = "raga-bilawal";
    const view = render(<RagaDetailPage />);

    fireEvent.click(screen.getAllByRole("button", { name: "ආරෝහණය අසන්න" })[0]);
    expect(playback.cancels).toHaveLength(1);
    expect(() => view.unmount()).not.toThrow();
    expect(playback.cancels[0]).toHaveBeenCalledTimes(1);
  });

  it("clears every remaining instrument timer when an owned Tabla cancellation throws", () => {
    // Instruments are quarantined by the publication policy, so the route's audio
    // lifecycle is reached through a stubbed public projection. This exercises the
    // component's cleanup wiring, not the policy decision.
    const rawTabla = (instrumentsData as unknown as Instrument[]).find((item) => item.id === "inst-tabla");
    if (!rawTabla) throw new Error("Missing inst-tabla fixture");
    const instrumentSpy = vi.spyOn(repository, "getInstrumentById").mockReturnValue(rawTabla);
    const sourceSpy = vi.spyOn(repository, "getSourceById").mockReturnValue(undefined);
    const playback = throwingPlaybackFactory();
    audioMocks.playBol.mockImplementation(playback.create);

    try {
      vi.useFakeTimers();
      routeParams.id = "inst-tabla";
      const view = render(<InstrumentDetailPage />);
      fireEvent.click(screen.getByRole("button", { name: "ආදර්ශ නාද රටාව අසන්න" }));

      // Four stroke timers at 0/400/800/1200ms. Completion is now driven by
      // handle settlement, not a wall-clock timer. Advance far enough to own
      // two Tabla handles and leave two timers pending.
      act(() => { vi.advanceTimersByTime(400); });
      expect(playback.cancels).toHaveLength(2);

      const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
      expect(() => view.unmount()).not.toThrow();

      // Both throwing handle cancellations ran, and neither prevented the two
      // pending stroke timers from being cleared.
      expect(playback.cancels[0]).toHaveBeenCalledTimes(1);
      expect(playback.cancels[1]).toHaveBeenCalledTimes(1);
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
      clearTimeoutSpy.mockRestore();
    } finally {
      instrumentSpy.mockRestore();
      sourceSpy.mockRestore();
    }
  });
});

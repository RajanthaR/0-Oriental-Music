import React, { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { SwaraKeyboard } from "@/components/audio/SwaraKeyboard";
import { DroneController } from "@/components/audio/DroneController";
import { EarTrainingModule } from "@/components/audio/EarTrainingModule";
import { NotationArranger } from "@/components/audio/NotationArranger";
import InstrumentDetailPage from "@/app/instruments/[id]/page";
import LessonDetailPage from "@/app/lessons/[id]/page";
import RagaDetailPage from "@/app/ragas/[id]/page";
import { repository } from "@/lib/data/repository";
import instrumentsData from "@/data/instruments.json";
import {
  deferredPlayback,
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

describe("Swara synthesis and detail-route audio consumers", () => {
  it("renders SwaraKeyboard with Sinhala key labels", () => {
    render(<SwaraKeyboard />);
    expect(screen.getByText("ස්වර යතුරුපුවරුව (Swara Keyboard)")).toBeInTheDocument();
    expect(screen.getByText("ස")).toBeInTheDocument();
    expect(screen.getByText("ප")).toBeInTheDocument();
  });

  it("renders DroneController with Tanpura controls and string labels", () => {
    render(<DroneController />);
    expect(screen.getByText("තාන්පුර ශ්‍රැති මෙවලම (Tanpura Drone)")).toBeInTheDocument();
    expect(screen.getByText("අරඹන්න")).toBeInTheDocument();
  });

  it("maps a public raga scale into the keyboard highlight contract", () => {
    const yaman = repository.getRagaById("raga-yaman");
    expect(yaman).toBeDefined();
    if (!yaman) return;
    render(
      <SwaraKeyboard
        highlightNotes={yaman.arohana_swaras}
        selectedRagaName={yaman.name_si}
      />
    );
    expect(screen.getByText(`${yaman.name_si} ස්වර ඉස්මතු කර ඇත`)).toBeInTheDocument();
  });

  it("cancels owned Swara tone and scale work on replacement and unmount", () => {
    vi.useFakeTimers();
    const toneCancels: Array<ReturnType<typeof vi.fn>> = [];
    const scaleCancels: Array<ReturnType<typeof vi.fn>> = [];
    const neverReady = new Promise<boolean>(() => undefined);
    audioMocks.playSwaraToneHandle.mockImplementation(() => {
      const cancel = vi.fn();
      toneCancels.push(cancel);
      return Object.assign(cancel, { ready: neverReady });
    });
    audioMocks.playSequenceHandle.mockImplementation(() => {
      const cancel = vi.fn();
      scaleCancels.push(cancel);
      return Object.assign(cancel, { ready: neverReady });
    });

    const { unmount } = render(<SwaraKeyboard />);
    fireEvent.click(screen.getByRole("button", { name: "ස (ෂඩ්ජ) ස්වරය" }));
    fireEvent.click(screen.getByRole("button", { name: "ආරෝහණය අසන්න" }));
    expect(toneCancels[0]).toHaveBeenCalledTimes(1);
    expect(scaleCancels[0]).not.toHaveBeenCalled();
    unmount();
    expect(scaleCancels[0]).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(5000); });
  });

  it("keeps co-mounted Swara keyboard cancellation isolated", () => {
    const cancels: Array<ReturnType<typeof vi.fn>> = [];
    const neverReady = new Promise<boolean>(() => undefined);
    audioMocks.playSwaraToneHandle.mockImplementation(() => {
      const cancel = vi.fn();
      cancels.push(cancel);
      return Object.assign(cancel, { ready: neverReady });
    });
    const { unmount } = render(
      <>
        <SwaraKeyboard />
        <SwaraKeyboard />
      </>
    );
    fireEvent.click(screen.getAllByRole("button", { name: "ස (ෂඩ්ජ) ස්වරය" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "ස (ෂඩ්ජ) ස්වරය" })[1]);
    expect(cancels).toHaveLength(2);
    expect(cancels[0]).not.toHaveBeenCalled();
    expect(cancels[1]).not.toHaveBeenCalled();
    unmount();
    expect(cancels[0]).toHaveBeenCalledTimes(1);
    expect(cancels[1]).toHaveBeenCalledTimes(1);
  });

  it("keeps active Swara playback when an equivalent highlight array is recreated", () => {
    const cancel = vi.fn();
    const neverReady = new Promise<boolean>(() => undefined);
    audioMocks.playSequenceHandle.mockReturnValue(Object.assign(cancel, { ready: neverReady }));
    const { rerender, unmount } = render(<SwaraKeyboard highlightNotes={["S", "R", "G"]} />);
    fireEvent.click(screen.getByRole("button", { name: "ආරෝහණය අසන්න" }));
    rerender(<SwaraKeyboard highlightNotes={["S", "R", "G"]} />);
    expect(cancel).not.toHaveBeenCalled();
    rerender(<SwaraKeyboard highlightNotes={["S", "R", "M"]} />);
    expect(cancel).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("owns Swara playback across StrictMode replacement and unmount", async () => {
    let resolveFirst!: (played: boolean) => void;
    const firstReady = new Promise<boolean>((resolve) => { resolveFirst = resolve; });
    const firstCancel = vi.fn();
    const secondCancel = vi.fn();
    audioMocks.playSwaraToneHandle
      .mockReturnValueOnce(Object.assign(firstCancel, { ready: firstReady }))
      .mockReturnValueOnce(Object.assign(secondCancel, { ready: new Promise<boolean>(() => undefined) }));

    const view = render(<StrictMode><SwaraKeyboard /></StrictMode>);
    fireEvent.click(screen.getByRole("button", { name: "ස (ෂඩ්ජ) ස්වරය" }));
    fireEvent.click(screen.getByRole("button", { name: "රි (ශුද්ධ) ස්වරය" }));
    expect(firstCancel).toHaveBeenCalledTimes(1);
    expect(secondCancel).not.toHaveBeenCalled();
    resolveFirst(false);
    await act(async () => Promise.resolve());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    view.unmount();
    expect(secondCancel).toHaveBeenCalledTimes(1);
  });

  it("retains ready Swara ownership until finished on every direct-tone consumer", async () => {
    const toneCancels: Array<ReturnType<typeof vi.fn>> = [];
    audioMocks.playSwaraToneHandle.mockImplementation(() => {
      const cancel = vi.fn();
      toneCancels.push(cancel);
      return Object.assign(cancel, {
        ready: Promise.resolve(true),
        finished: new Promise<void>(() => undefined),
      });
    });

    const keyboard = render(<SwaraKeyboard />);
    fireEvent.click(screen.getByRole("button", { name: "ස (ෂඩ්ජ) ස්වරය" }));
    await act(async () => Promise.resolve());
    keyboard.unmount();

    const arranger = render(<NotationArranger />);
    fireEvent.click(screen.getByRole("button", { name: "ස" }));
    await act(async () => Promise.resolve());
    arranger.unmount();

    const earTraining = render(<EarTrainingModule />);
    fireEvent.click(screen.getByRole("button", { name: /නාදය අසන්න/ }));
    await act(async () => Promise.resolve());
    earTraining.unmount();

    expect(toneCancels).toHaveLength(3);
    toneCancels.forEach((cancel) => expect(cancel).toHaveBeenCalledTimes(1));
  });

  it("does not report a Tabla unavailable error when the demo intentionally cancels", async () => {
    vi.useFakeTimers();
    const tabla = (instrumentsData as Array<{ id: string }>).find((instrument) => instrument.id === "inst-tabla");
    const instrumentLookup = vi.spyOn(repository, "getInstrumentById").mockReturnValue(tabla as never);
    const sourceLookup = vi.spyOn(repository, "getSourceById").mockReturnValue({ title: "test source" } as never);
    audioMocks.playBol.mockImplementation(() => {
      let resolveReady!: (played: boolean) => void;
      let resolveFinished!: () => void;
      const ready = new Promise<boolean>((resolve) => { resolveReady = resolve; });
      const finished = new Promise<void>((resolve) => { resolveFinished = resolve; });
      const cancel = vi.fn(() => {
        resolveReady(false);
        resolveFinished();
      });
      return Object.assign(cancel, { ready, finished });
    });
    const view = render(<InstrumentDetailPage />);
    fireEvent.click(screen.getByRole("button", { name: "ආදර්ශ නාද රටාව අසන්න" }));
    await act(async () => { vi.advanceTimersByTime(2000); });
    await act(async () => Promise.resolve());
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    view.unmount();
    instrumentLookup.mockRestore();
    sourceLookup.mockRestore();
  });

  it.each([
    {
      label: "lesson",
      id: "les-intro-01",
      replacementId: "missing-lesson",
      page: () => <LessonDetailPage />,
      button: "ආදර්ශනයට සවන් දෙන්න",
      canPlayReplacement: false,
    },
    {
      label: "raga",
      id: "raga-bilawal",
      replacementId: "raga-bhupali",
      page: () => <RagaDetailPage />,
      button: "ආරෝහණය අසන්න",
      canPlayReplacement: true,
    },
  ])("owns $label page sequence through replacement and unmount", async ({ id, replacementId, page, button, canPlayReplacement }) => {
    routeParams.id = id;
    const first = deferredPlayback();
    const second = deferredPlayback();
    audioMocks.playSequenceHandle
      .mockReturnValueOnce(first.handle)
      .mockReturnValueOnce(second.handle);

    const view = render(page());
    fireEvent.click(screen.getAllByRole("button", { name: button })[0]);
    expect(audioMocks.playSequenceHandle).toHaveBeenCalledTimes(1);

    routeParams.id = replacementId;
    view.rerender(page());
    expect(first.handle).toHaveBeenCalledTimes(1);

    if (canPlayReplacement) {
      fireEvent.click(screen.getAllByRole("button", { name: button })[0]);
      expect(audioMocks.playSequenceHandle).toHaveBeenCalledTimes(2);
    }
    view.unmount();
    if (canPlayReplacement) expect(second.handle).toHaveBeenCalledTimes(1);

    first.resolveReady(false);
    first.resolveFinished();
    second.resolveReady(false);
    second.resolveFinished();
    await act(async () => Promise.resolve());
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it.each([
    { id: "inst-flute", timbre: "flute" },
    { id: "inst-harmonium", timbre: "harmonium" },
  ])("owns instrument $id sequence until finished and unmount", async ({ id, timbre }) => {
    const fixture = (instrumentsData as Array<Record<string, unknown>>).find(
      (instrument) => instrument.id === "inst-harmonium"
    );
    expect(fixture).toBeDefined();
    const instrumentLookup = vi.spyOn(repository, "getInstrumentById").mockImplementation((candidateId) => (
      fixture ? { ...fixture, id: candidateId } as never : undefined
    ));
    routeParams.id = id;
    const playback = deferredPlayback();
    audioMocks.playSequenceHandle.mockReturnValue(playback.handle);
    const view = render(<InstrumentDetailPage />);
    fireEvent.click(screen.getByRole("button", { name: "ආදර්ශ නාද රටාව අසන්න" }));
    expect(audioMocks.playSequenceHandle).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Number),
      undefined,
      261.63,
      timbre,
    );
    playback.resolveReady(true);
    await act(async () => Promise.resolve());
    view.unmount();
    expect(playback.handle).toHaveBeenCalledTimes(1);
    playback.resolveFinished();
    instrumentLookup.mockRestore();
  });

  it("owns instrument Tabla timers and handles through delayed failure and unmount", async () => {
    vi.useFakeTimers();
    const tabla = (instrumentsData as Array<{ id: string }>).find((instrument) => instrument.id === "inst-tabla");
    const instrumentLookup = vi.spyOn(repository, "getInstrumentById").mockReturnValue(tabla as never);
    routeParams.id = "inst-tabla";
    const playback = deferredPlayback();
    audioMocks.playBol.mockReturnValue(playback.handle);
    const view = render(<InstrumentDetailPage />);
    fireEvent.click(screen.getByRole("button", { name: "ආදර්ශ නාද රටාව අසන්න" }));
    await act(async () => { vi.advanceTimersByTime(0); });
    expect(audioMocks.playBol).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(playback.handle).toHaveBeenCalledTimes(1);
    await act(async () => Promise.resolve());
    instrumentLookup.mockRestore();
  });

  it("contains rejected instrument Tabla promises after route replacement and unmount", async () => {
    vi.useFakeTimers();
    const tabla = (instrumentsData as Array<{ id: string }>).find((instrument) => instrument.id === "inst-tabla");
    const instrumentLookup = vi.spyOn(repository, "getInstrumentById").mockImplementation((candidateId) => (
      candidateId === "inst-tabla" ? tabla as never : undefined
    ));
    const first = rejectingPlayback();
    const second = rejectingPlayback();
    audioMocks.playBol
      .mockReturnValueOnce(first.handle)
      .mockReturnValueOnce(second.handle);
    routeParams.id = "inst-tabla";

    const view = render(<InstrumentDetailPage />);
    fireEvent.click(screen.getByRole("button", { name: "ආදර්ශ නාද රටාව අසන්න" }));
    await act(async () => { vi.advanceTimersByTime(0); });
    expect(audioMocks.playBol).toHaveBeenCalledTimes(1);

    routeParams.id = "missing-instrument";
    view.rerender(<InstrumentDetailPage />);
    expect(first.handle).toHaveBeenCalledTimes(1);
    await act(async () => {
      first.rejectReady(new Error("stale instrument ready after replacement"));
      first.rejectFinished(new Error("stale instrument finished after replacement"));
      await Promise.resolve();
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    routeParams.id = "inst-tabla";
    view.rerender(<InstrumentDetailPage />);
    fireEvent.click(screen.getByRole("button", { name: "ආදර්ශ නාද රටාව අසන්න" }));
    await act(async () => { vi.advanceTimersByTime(0); });
    expect(audioMocks.playBol).toHaveBeenCalledTimes(2);

    view.unmount();
    expect(second.handle).toHaveBeenCalledTimes(1);
    await act(async () => {
      second.rejectReady(new Error("stale instrument ready after unmount"));
      second.rejectFinished(new Error("stale instrument finished after unmount"));
      await Promise.resolve();
    });
    instrumentLookup.mockRestore();
  });

  it("keeps arranger and ear-training Swara ownership isolated", async () => {
    let resolveArranger!: (played: boolean) => void;
    let resolveEar!: (played: boolean) => void;
    const arrangerCancel = vi.fn();
    const earCancel = vi.fn();
    audioMocks.playSwaraToneHandle
      .mockReturnValueOnce(Object.assign(arrangerCancel, {
        ready: new Promise<boolean>((resolve) => { resolveArranger = resolve; }),
      }))
      .mockReturnValueOnce(Object.assign(earCancel, {
        ready: new Promise<boolean>((resolve) => { resolveEar = resolve; }),
      }));

    const view = render(
      <>
        <NotationArranger />
        <EarTrainingModule />
      </>
    );
    fireEvent.click(screen.getByRole("button", { name: "ස" }));
    fireEvent.click(screen.getByRole("button", { name: /නාදය අසන්න/ }));
    fireEvent.click(screen.getByRole("button", { name: "නැවත" }));
    expect(arrangerCancel).toHaveBeenCalledTimes(1);
    expect(earCancel).not.toHaveBeenCalled();
    resolveArranger(false);
    await act(async () => Promise.resolve());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    view.unmount();
    expect(earCancel).toHaveBeenCalledTimes(1);
    resolveEar(false);
    await act(async () => Promise.resolve());
  });
});

import React, { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { SwaraKeyboard } from "@/components/audio/SwaraKeyboard";
import { DroneController } from "@/components/audio/DroneController";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { TalaVisualizer } from "@/components/audio/TalaVisualizer";
import { RhythmTapGame } from "@/components/audio/RhythmTapGame";
import { repository } from "@/lib/data/repository";
import { EarTrainingModule } from "@/components/audio/EarTrainingModule";
import { NotationArranger } from "@/components/audio/NotationArranger";
import { PitchDetectorView } from "@/components/audio/PitchDetectorView";
import InstrumentDetailPage from "@/app/instruments/[id]/page";
import LessonDetailPage from "@/app/lessons/[id]/page";
import RagaDetailPage from "@/app/ragas/[id]/page";
import SearchPage from "@/app/search/page";
import { TalaDirectoryResults } from "@/components/tala/TalaDirectoryResults";
import talasData from "@/data/talas.json";
import instrumentsData from "@/data/instruments.json";
import type { Quiz, Tala } from "@/types/content";
import type { PitchMatchResult } from "@/lib/audio/pitch";

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

const getKhemtaFixture = (): Tala => {
  const tala = (talasData as Tala[]).find((candidate) => candidate.id === "tala-khemta");
  if (!tala) throw new Error("Missing raw Khemta test fixture");
  return tala;
};

const readyCancel = (cancel: ReturnType<typeof vi.fn> = vi.fn()) =>
  Object.assign(cancel, { ready: Promise.resolve(true) });

const deferredPlayback = () => {
  let resolveReady!: (played: boolean) => void;
  let resolveFinished!: () => void;
  const ready = new Promise<boolean>((resolve) => { resolveReady = resolve; });
  const finished = new Promise<void>((resolve) => { resolveFinished = resolve; });
  const cancel = vi.fn(() => {
    resolveReady(false);
    resolveFinished();
  });
  return {
    handle: Object.assign(cancel, { ready, finished }),
    resolveReady,
    resolveFinished,
  };
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

const pitchResultFixture = (): PitchMatchResult => ({
  frequency: 261.63,
  swara_si: "ස (Sa)",
  swara_en: "S",
  centsOff: 0,
  isInTune: true,
  clarity: 0.95,
});

type PitchCallback = (result: PitchMatchResult | null) => void;

afterEach(() => {
  routeParams.id = "inst-tabla";
  audioMocks.playBol.mockReset();
  audioMocks.playSwaraTone.mockReset().mockResolvedValue(true);
  audioMocks.playSequence.mockReset().mockResolvedValue(true);
  audioMocks.playSwaraToneHandle.mockReset().mockImplementation(() => readyCancel());
  audioMocks.playSequenceHandle.mockReset().mockImplementation(() => readyCancel());
  pitchMocks.PitchDetector.mockReset();
  vi.useRealTimers();
});

describe("Interactive Audio & Quiz Components Suite", () => {
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
    pitchMocks.PitchDetector.mockImplementation(() => detector);

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
    pitchMocks.PitchDetector.mockImplementation(() => detector);

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
    pitchMocks.PitchDetector.mockImplementation(() => detector);

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

  it("renders QuizRunner and first question properly", () => {
    const quizzes = repository.getQuizzes();
    if (quizzes.length === 0) {
      // All quizzes are contained during Phase 1 forensic remediation
      expect(quizzes).toHaveLength(0);
      return;
    }
    const quiz = quizzes[0];
    render(<QuizRunner quiz={quiz} />);
    expect(screen.getByText(quiz.questions[0].prompt_si)).toBeInTheDocument();
    expect(screen.getByText("පිළිතුර පරීක්ෂා කරන්න")).toBeInTheDocument();
  });

  it("requires an explicit learner ordering instead of auto-passing the format", () => {
    const onComplete = vi.fn();
    const quiz: Quiz = {
      id: "ordering-regression",
      title_si: "පිළිවෙළ",
      lessonId: "les-intro-01",
      gradeBands: ["10-11"],
      passingScorePercent: 70,
      questions: [{
        id: "q-order",
        type: "ordering",
        gradeBands: ["10-11"],
        difficulty: "පහසු",
        strandId: "strand-fundamentals",
        prompt_si: "නිවැරදි පිළිවෙළ සකසන්න",
        orderingItems: [
          { id: "first", text_si: "පළමු", correctIndex: 0 },
          { id: "second", text_si: "දෙවන", correctIndex: 1 },
        ],
        explanation_si: "පළමු අයිතමය පෙර යෙදේ.",
        sourceReference: { sourceId: "SRC-G10-NADA", pageOrSection: "sg10_emus_chap8_nadaya.pdf පිටුව 2" },
      }],
    };
    const firstRun = render(<QuizRunner quiz={quiz} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: "පිළිතුර පරීක්ෂා කරන්න" }));
    fireEvent.click(screen.getByRole("button", { name: "ප්‍රතිඵලය බලන්න" }));
    expect(onComplete).toHaveBeenLastCalledWith(0, 1, false);
    firstRun.unmount();

    render(<QuizRunner quiz={quiz} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: "පළමු ඉහළට ගෙනයන්න" }));
    fireEvent.click(screen.getByRole("button", { name: "පිළිතුර පරීක්ෂා කරන්න" }));
    fireEvent.click(screen.getByRole("button", { name: "ප්‍රතිඵලය බලන්න" }));
    expect(onComplete).toHaveBeenCalledWith(1, 1, true);
  });

  it("shows localized fallback feedback for unavailable public audio controls", async () => {
    audioMocks.playSwaraTone.mockResolvedValue(false);
    audioMocks.playSwaraToneHandle.mockReturnValue(Object.assign(vi.fn(), { ready: Promise.resolve(false) }));
    const keyboard = render(<SwaraKeyboard />);
    fireEvent.click(screen.getByRole("button", { name: "ස (ෂඩ්ජ) ස්වරය" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("නාදය ආරම්භ කළ නොහැක");
    keyboard.unmount();

    const arranger = render(<NotationArranger />);
    fireEvent.click(screen.getByRole("button", { name: "ස" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("නාදය ආරම්භ කළ නොහැක");
    arranger.unmount();

    render(<EarTrainingModule />);
    fireEvent.click(screen.getByRole("button", { name: /නාදය අසන්න/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("නාදය ආරම්භ කළ නොහැක");
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

  it("does not advertise quarantined Bhairav or Roopak claims in static public UI", () => {
    const { unmount } = render(<EarTrainingModule />);
    fireEvent.click(screen.getByText("ස (ෂඩ්ජ)"));
    fireEvent.click(screen.getByText("මීළඟ අභ්‍යාසය →"));
    expect(screen.queryByText(/ලාවනී තාලය|දාදරා තාලය/)).not.toBeInTheDocument();
    expect(screen.queryByText(/රූපක්/)).not.toBeInTheDocument();
    unmount();

    render(<SearchPage />);
    expect(screen.queryByText(/භෛරව්/)).not.toBeInTheDocument();
    expect(screen.queryByText(/රූපක්/)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/භෛරව්|රූපක්/)).not.toBeInTheDocument();
  });

  it("distinguishes an empty verified Tala catalog from a zero-result search", () => {
    const onClearSearch = vi.fn();
    const { rerender } = render(
      <TalaDirectoryResults allTalas={[]} talas={[]} onClearSearch={onClearSearch} />
    );
    expect(screen.getByText("දැනට ප්‍රසිද්ධ භාවිතයට සනාථ වූ තාල නොමැත.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "සෙවුම හිස් කරන්න" })).not.toBeInTheDocument();

    const khemta = getKhemtaFixture();
    rerender(<TalaDirectoryResults allTalas={[khemta]} talas={[]} onClearSearch={onClearSearch} />);
    fireEvent.click(screen.getByRole("button", { name: "සෙවුම හිස් කරන්න" }));
    expect(onClearSearch).toHaveBeenCalledTimes(1);
  });
});

import React from "react";
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
import SearchPage from "@/app/search/page";
import { TalaDirectoryResults } from "@/components/tala/TalaDirectoryResults";

const audioMocks = vi.hoisted(() => ({
  playBol: vi.fn(),
}));

vi.mock("@/lib/audio/tabla", () => ({
  tablaSynth: audioMocks,
}));

afterEach(() => {
  audioMocks.playBol.mockReset();
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
    const khemta = repository.getTalaById("tala-khemta");
    expect(khemta).toBeDefined();
    if (!khemta) return;
    render(<TalaVisualizer tala={khemta} />);
    expect(screen.getByText(/මාත්‍රා 4 \| විභාග 2 \(2\+2\)/)).toBeInTheDocument();
    expect(screen.getByText(/යෙදුමේ පුහුණු වේගය:/)).toBeInTheDocument();
    expect(screen.getByText(/මූලාශ්‍රයෙන් සනාථ කළ ලය වර්ගීකරණයක් නොවේ/)).toBeInTheDocument();
  });

  it("keeps each TalaVisualizer playback handle owned by its lifecycle", () => {
    const tala = repository.getTalaById("tala-khemta");
    expect(tala).toBeDefined();
    if (!tala) return;
    const cancels: Array<ReturnType<typeof vi.fn>> = [];
    audioMocks.playBol.mockImplementation(() => {
      const cancel = vi.fn();
      cancels.push(cancel);
      return cancel;
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
    const tala = repository.getTalaById("tala-khemta");
    expect(tala).toBeDefined();
    if (!tala) return;
    const cancels: Array<ReturnType<typeof vi.fn>> = [];
    audioMocks.playBol.mockImplementation(() => {
      const cancel = vi.fn();
      cancels.push(cancel);
      return cancel;
    });
    vi.useFakeTimers();
    render(<TalaVisualizer tala={tala} />);
    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    expect(audioMocks.playBol).toHaveBeenLastCalledWith(tala.bols[0].bol_si, 600);
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
    const tala = repository.getTalaById("tala-khemta");
    expect(tala).toBeDefined();
    if (!tala) return;
    const cancel = vi.fn();
    audioMocks.playBol.mockReturnValue(cancel);
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
    const tala = repository.getTalaById("tala-khemta");
    expect(tala).toBeDefined();
    if (!tala) return;
    const cancel = vi.fn();
    audioMocks.playBol.mockReturnValue(cancel);
    const { rerender } = render(<TalaVisualizer tala={tala} />);
    fireEvent.click(screen.getByRole("button", { name: "තාලය අරඹන්න" }));
    rerender(<TalaVisualizer tala={{ ...tala, bols: tala.bols.map((bol, index) => index === 0 ? { ...bol, bol_si: `${bol.bol_si} වෙනස්` } : bol) }} />);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "තාලය අරඹන්න" })).toBeInTheDocument();
    expect(screen.getByText(/මාත්‍රා 1 \/ 4/)).toBeInTheDocument();
  });

  it("cancels playback on Reset, tala change, and unmount", () => {
    const tala = repository.getTalaById("tala-khemta");
    expect(tala).toBeDefined();
    if (!tala) return;
    const cancels: Array<ReturnType<typeof vi.fn>> = [];
    audioMocks.playBol.mockImplementation(() => {
      const cancel = vi.fn();
      cancels.push(cancel);
      return cancel;
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
    const tala = repository.getTalaById("tala-khemta");
    expect(tala).toBeDefined();
    if (!tala) return;
    const cancels: Array<ReturnType<typeof vi.fn>> = [];
    audioMocks.playBol.mockImplementation(() => {
      const cancel = vi.fn();
      cancels.push(cancel);
      return cancel;
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
    const tala = repository.getTalaById("tala-khemta");
    expect(tala).toBeDefined();
    if (!tala) return;
    audioMocks.playBol.mockImplementation(() => vi.fn());
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
    expect(getCircularBeatStyle(3, 16)).toStrictEqual(getCircularBeatStyle(3, 16));
  });

  it("hydrates the TalaVisualizer without coordinate mismatch warnings", async () => {
    const tala = repository.getTalaById("tala-khemta");
    expect(tala).toBeDefined();
    if (!tala) return;
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

    const khemta = repository.getTalaById("tala-khemta");
    expect(khemta).toBeDefined();
    if (!khemta) return;
    rerender(<TalaDirectoryResults allTalas={[khemta]} talas={[]} onClearSearch={onClearSearch} />);
    fireEvent.click(screen.getByRole("button", { name: "සෙවුම හිස් කරන්න" }));
    expect(onClearSearch).toHaveBeenCalledTimes(1);
  });
});

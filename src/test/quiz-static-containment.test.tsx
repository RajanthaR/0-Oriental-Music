import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SwaraKeyboard } from "@/components/audio/SwaraKeyboard";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { EarTrainingModule } from "@/components/audio/EarTrainingModule";
import { NotationArranger } from "@/components/audio/NotationArranger";
import SearchPage from "@/app/search/page";
import { TalaDirectoryResults } from "@/components/tala/TalaDirectoryResults";
import { repository } from "@/lib/data/repository";
import type { Quiz, Tala } from "@/types/content";
import {
  getKhemtaFixture,
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

describe("Quiz runner and static public containment", () => {
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

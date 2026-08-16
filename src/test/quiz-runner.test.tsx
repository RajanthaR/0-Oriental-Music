import { afterEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { QuizRunner, QuizRunnerQuiz } from "@/components/quiz/QuizRunner";
import { ProgressStorage } from "@/lib/storage/progress-storage";
import type { Question, RawQuestion } from "@/types/content";

type Assert<T extends true> = T;
type IsNever<T> = [T] extends [never] ? true : false;
type RenderableQuestionOmitsForensicFields = Assert<
  IsNever<Extract<keyof Question, "audioNotes" | "audioTalaId" | "diagramSvg">>
>;

const renderableQuestionHasNoForensicFields: RenderableQuestionOmitsForensicFields = true;

function validQuestion(): Question {
  return {
    id: "q-1",
    type: "mcq",
    gradeBands: ["10-11"],
    difficulty: "පහසු",
    strandId: "strand-fundamentals",
    prompt_si: "ස්වරය තෝරන්න",
    options_si: [
      { id: "sa", text_si: "ස" },
      { id: "pa", text_si: "ප" },
    ],
    correctAnswerIds: ["sa"],
    explanation_si: "ස යනු ෂඩ්ජයයි.",
    sourceReference: {
      sourceId: "SRC-G10-NADA",
      pageOrSection: "sg10_emus_chap8_nadaya.pdf පිටුව 2",
    },
  };
}

function quizWithQuestions(questions: unknown): QuizRunnerQuiz {
  return {
    id: "quiz-runtime-boundary",
    title_si: "ස්වර පුහුණුව",
    passingScorePercent: 70,
    questions: questions as Question[],
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("QuizRunner runtime boundary", () => {
  it("keeps forensic fields on RawQuestion while excluding them from Question", () => {
    expect(renderableQuestionHasNoForensicFields).toBe(true);

    const rawQuestion: RawQuestion = {
      ...validQuestion(),
      audioNotes: ["S"],
      audioTalaId: "tala-review-only",
      diagramSvg: "<svg aria-label=\"notation\" />",
    };
    expect(rawQuestion.audioNotes).toEqual(["S"]);
    expect(rawQuestion.audioTalaId).toBe("tala-review-only");
    expect(rawQuestion.diagramSvg).toContain("notation");
  });

  it.each([
    ["empty", []],
    ["sparse", new Array(1)],
    ["undefined entry", [undefined]],
    ["null entry", [null]],
    ["malformed entry", [{ ...validQuestion(), prompt_si: null }]],
    ["mixed valid and malformed entries", [validQuestion(), { ...validQuestion(), type: "audio-id" }]],
  ])("renders a supportive unavailable state for %s question arrays", (_label, questions) => {
    const recordQuizAttempt = vi.spyOn(ProgressStorage, "recordQuizAttempt");

    render(<QuizRunner quiz={quizWithQuestions(questions)} />);

    expect(screen.getByRole("alert")).toHaveTextContent("මෙම ප්‍රශ්නාවලිය දැනට ලබා ගත නොහැක.");
    expect(screen.getByRole("alert")).toHaveTextContent("හොඳ උත්සාහයක්!");
    expect(screen.queryByRole("button", { name: "පිළිතුර පරීක්ෂා කරන්න" })).not.toBeInTheDocument();
    expect(recordQuizAttempt).not.toHaveBeenCalled();
  });

  it("renders a valid non-empty question array and records only a real attempt", () => {
    const recordQuizAttempt = vi.spyOn(ProgressStorage, "recordQuizAttempt");

    render(<QuizRunner quiz={quizWithQuestions([validQuestion()])} />);

    expect(screen.getByText("ස්වරය තෝරන්න")).toBeInTheDocument();
    expect(recordQuizAttempt).not.toHaveBeenCalled();
  });

  it.each([-1, 101, Number.NaN])("rejects an invalid runtime passing score %s", (passingScorePercent) => {
    const quiz = { ...quizWithQuestions([validQuestion()]), passingScorePercent };
    render(<QuizRunner quiz={quiz} />);
    expect(screen.getByRole("alert")).toHaveTextContent("මෙම ප්‍රශ්නාවලිය දැනට ලබා ගත නොහැක.");
  });
});

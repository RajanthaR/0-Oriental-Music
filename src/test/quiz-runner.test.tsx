import { afterEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { QuizRunner, QuizRunnerQuiz } from "@/components/quiz/QuizRunner";
import { ProgressStorage } from "@/lib/storage/progress-storage";
import { MAX_ARRAY_ITEMS } from "@/lib/validation/content-contracts";
import type { Question, RawQuestion } from "@/types/content";

type Assert<T extends true> = T;
type IsNever<T> = [T] extends [never] ? true : false;
type RenderableQuestionOmitsForensicFields = Assert<
  IsNever<Extract<keyof Question, "audioNotes" | "audioTalaId" | "diagramSvg">>
>;
type RenderableAnswerOmitsCorrectness = Assert<
  IsNever<Extract<keyof Extract<Question, { type: "mcq" }>["options_si"][number], "isCorrect">>
>;

const renderableQuestionHasNoForensicFields: RenderableQuestionOmitsForensicFields = true;
const renderableAnswerHasNoCorrectness: RenderableAnswerOmitsCorrectness = true;

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

function baseQuestionFields(id: string, prompt_si: string) {
  return {
    id,
    gradeBands: ["10-11"] as Question["gradeBands"],
    difficulty: "පහසු" as Question["difficulty"],
    strandId: "strand-fundamentals",
    prompt_si,
    explanation_si: "නිවැරදි පිළිතුර තෝරා ඇත.",
    sourceReference: {
      sourceId: "SRC-G10-NADA",
      pageOrSection: "sg10_emus_chap8_nadaya.pdf පිටුව 2",
    },
  };
}

function multiSelectQuestion(): Question {
  return {
    ...baseQuestionFields("q-multi-select", "ගැළපෙන ස්වර තෝරන්න"),
    type: "multi-select",
    options_si: [
      { id: "sa", text_si: "ස" },
      { id: "pa", text_si: "ප" },
    ],
    correctAnswerIds: ["sa", "pa"],
  };
}

function matchingQuestion(): Question {
  return {
    ...baseQuestionFields("q-matching", "පද ගළපන්න"),
    type: "matching",
    matchingPairs: [
      { left_si: "වම්", right_si: "දකුණ" },
      { left_si: "පහළ", right_si: "ඉහළ" },
    ],
  };
}

function orderingQuestion(): Question {
  return {
    ...baseQuestionFields("q-ordering", "නිවැරදි පිළිවෙළ සකසන්න"),
    type: "ordering",
    orderingItems: [
      { id: "first", text_si: "පළමු", correctIndex: 0 },
      { id: "second", text_si: "දෙවන", correctIndex: 1 },
    ],
  };
}

function trueFalseQuestion(): Question {
  return {
    ...baseQuestionFields("q-true-false", "මෙය සත්‍ය දැයි තෝරන්න"),
    type: "true-false",
    options_si: [
      { id: "true", text_si: "සත්‍ය" },
      { id: "false", text_si: "අසත්‍ය" },
    ],
    correctAnswerIds: ["true"],
  };
}

function shortAnswerQuestion(): Question {
  return {
    ...baseQuestionFields("q-short-answer", "ෂඩ්ජ ස්වරයේ සංකේතය ලියන්න"),
    type: "short-answer",
    correctShortAnswer_si: ["ස"],
  };
}

function expectCorrectCompletion(question: Question, selectCorrectAnswer: () => void) {
  const onComplete = vi.fn();
  const recordQuizAttempt = vi.spyOn(ProgressStorage, "recordQuizAttempt");

  render(<QuizRunner quiz={quizWithQuestions([question])} onComplete={onComplete} />);
  selectCorrectAnswer();
  fireEvent.click(screen.getByRole("button", { name: "පිළිතුර පරීක්ෂා කරන්න" }));
  fireEvent.click(screen.getByRole("button", { name: "ප්‍රතිඵලය බලන්න" }));

  expect(onComplete).toHaveBeenCalledWith(1, 1, true);
  expect(recordQuizAttempt).toHaveBeenCalledWith("quiz-runtime-boundary", 1, 1, true);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("QuizRunner runtime boundary", () => {
  it("keeps public answer options free of raw correctness flags at compile time", () => {
    expect(renderableQuestionHasNoForensicFields).toBe(true);
    expect(renderableAnswerHasNoCorrectness).toBe(true);
  });
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

  it("uses one detached question snapshot when a hostile proxy changes on later reads", () => {
    const target = validQuestion() as unknown as Record<string, unknown>;
    let ownKeysCalls = 0;
    const question = new Proxy(target, {
      ownKeys(current) {
        ownKeysCalls += 1;
        if (ownKeysCalls > 1) {
          current.type = "matching";
          delete current.options_si;
          delete current.correctAnswerIds;
        }
        return Reflect.ownKeys(current);
      },
    });

    render(<QuizRunner quiz={quizWithQuestions([question])} />);

    expect(screen.getByText("ස්වරය තෝරන්න")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ස" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(ownKeysCalls).toBe(1);
  });

  it("renders a safe unavailable state for duplicate question IDs", () => {
    const recordQuizAttempt = vi.spyOn(ProgressStorage, "recordQuizAttempt");

    render(<QuizRunner quiz={quizWithQuestions([validQuestion(), validQuestion()])} />);

    expect(screen.getByRole("alert")).toHaveTextContent("මෙම ප්‍රශ්නාවලිය දැනට ලබා ගත නොහැක.");
    expect(screen.queryByRole("button", { name: "පිළිතුර පරීක්ෂා කරන්න" })).not.toBeInTheDocument();
    expect(recordQuizAttempt).not.toHaveBeenCalled();
  });

  it("renders a safe unavailable state when questions exceed MAX_ARRAY_ITEMS", () => {
    const recordQuizAttempt = vi.spyOn(ProgressStorage, "recordQuizAttempt");
    const tooManyQuestions = Array.from(
      { length: MAX_ARRAY_ITEMS + 1 },
      (_, index) => ({ ...validQuestion(), id: `q-${index}` }),
    );

    render(<QuizRunner quiz={quizWithQuestions(tooManyQuestions)} />);

    expect(screen.getByRole("alert")).toHaveTextContent("මෙම ප්‍රශ්නාවලිය දැනට ලබා ගත නොහැක.");
    expect(screen.queryByRole("button", { name: "පිළිතුර පරීක්ෂා කරන්න" })).not.toBeInTheDocument();
    expect(recordQuizAttempt).not.toHaveBeenCalled();
  });

  it("renders passingScorePercent 0 as unavailable without recording an attempt", () => {
    const recordQuizAttempt = vi.spyOn(ProgressStorage, "recordQuizAttempt");
    const quiz = { ...quizWithQuestions([validQuestion()]), passingScorePercent: 0 };

    render(<QuizRunner quiz={quiz} />);

    expect(screen.getByRole("alert")).toHaveTextContent("මෙම ප්‍රශ්නාවලිය දැනට ලබා ගත නොහැක.");
    expect(screen.queryByRole("button", { name: "පිළිතුර පරීක්ෂා කරන්න" })).not.toBeInTheDocument();
    expect(recordQuizAttempt).not.toHaveBeenCalled();
  });

  it("scores a correct MCQ answer", () => {
    expectCorrectCompletion(validQuestion(), () => {
      fireEvent.click(screen.getByRole("button", { name: "ස" }));
    });
  });

  it("scores a correct multi-select answer", () => {
    expectCorrectCompletion(multiSelectQuestion(), () => {
      fireEvent.click(screen.getByRole("button", { name: "ස" }));
      fireEvent.click(screen.getByRole("button", { name: "ප" }));
    });
  });

  it("scores a correct matching answer", () => {
    expectCorrectCompletion(matchingQuestion(), () => {
      fireEvent.change(screen.getByRole("combobox", { name: "වම් සඳහා ගැළපුම තෝරන්න" }), {
        target: { value: "දකුණ" },
      });
      fireEvent.change(screen.getByRole("combobox", { name: "පහළ සඳහා ගැළපුම තෝරන්න" }), {
        target: { value: "ඉහළ" },
      });
    });
  });

  it("scores a correct ordering answer after the learner reorders items", () => {
    expectCorrectCompletion(orderingQuestion(), () => {
      fireEvent.click(screen.getByRole("button", { name: "පළමු ඉහළට ගෙනයන්න" }));
    });
  });

  it("scores a correct true-false answer", () => {
    expectCorrectCompletion(trueFalseQuestion(), () => {
      fireEvent.click(screen.getByRole("button", { name: "සත්‍ය" }));
    });
  });

  it("scores a correct short-answer response", () => {
    expectCorrectCompletion(shortAnswerQuestion(), () => {
      fireEvent.change(screen.getByPlaceholderText("ඔබේ පිළිතුර මෙතැන ලියන්න..."), {
        target: { value: "ස" },
      });
    });
  });

  it.each([-1, 101, Number.NaN])("rejects an invalid runtime passing score %s", (passingScorePercent) => {
    const quiz = { ...quizWithQuestions([validQuestion()]), passingScorePercent };
    render(<QuizRunner quiz={quiz} />);
    expect(screen.getByRole("alert")).toHaveTextContent("මෙම ප්‍රශ්නාවලිය දැනට ලබා ගත නොහැක.");
  });
});

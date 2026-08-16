"use client";

import React, { useState } from "react";
import { Quiz, Question } from "@/types/content";
import { CheckCircle2, XCircle, Award, RotateCcw, ArrowRight, ArrowUp, ArrowDown, Sparkles } from "lucide-react";
import { ProgressStorage } from "@/lib/storage/progress-storage";
import {
  isNonBlankString,
  isRecord,
  projectPublicRecord,
  validateContentRecord,
} from "@/lib/validation/content-contracts";

export type QuizRunnerQuiz = Omit<Pick<Quiz, "id" | "title_si" | "questions" | "passingScorePercent">, "questions"> & {
  questions: Question[];
};

export interface QuizRunnerProps {
  quiz: QuizRunnerQuiz;
  onComplete?: (score: number, maxScore: number, passed: boolean) => void;
}

function isDenseArray(value: unknown): value is unknown[] {
  if (!Array.isArray(value)) return false;
  try {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(value, index)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function getUsableQuiz(quiz: unknown): QuizRunnerQuiz | null {
  try {
    if (!isRecord(quiz) || !isNonBlankString(quiz.id) || !isNonBlankString(quiz.title_si) ||
      typeof quiz.passingScorePercent !== "number" || !Number.isFinite(quiz.passingScorePercent) ||
      quiz.passingScorePercent < 0 || quiz.passingScorePercent > 100) {
      return null;
    }

    const rawQuestions = quiz.questions;
    if (!isDenseArray(rawQuestions) || rawQuestions.length === 0) return null;

    const questions: Question[] = [];
    for (let index = 0; index < rawQuestions.length; index += 1) {
      const candidate = rawQuestions[index];
      if (!validateContentRecord(candidate, "question").isValid) return null;
      const projected = projectPublicRecord(candidate, "question");
      if (!projected) return null;
      questions.push(projected as Question);
    }

    return {
      id: quiz.id,
      title_si: quiz.title_si,
      passingScorePercent: quiz.passingScorePercent,
      questions,
    };
  } catch {
    return null;
  }
}

function QuizUnavailable() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-950" role="alert">
      <p className="font-bold">මෙම ප්‍රශ්නාවලිය දැනට ලබා ගත නොහැක.</p>
      <p className="mt-2 text-xs">හොඳ උත්සාහයක්! අන්තර්ගත සමාලෝචනය අවසන් වූ පසු නැවත උත්සාහ කරන්න.</p>
    </div>
  );
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({ quiz, onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | string[]>>({});
  const [matchingSelections, setMatchingSelections] = useState<Record<string, string>>({});
  const [orderedItems, setOrderedItems] = useState<Record<string, string[]>>({});
  const [shortAnswerInput, setShortAnswerInput] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [scoreCount, setScoreCount] = useState(0);

  const usableQuiz = getUsableQuiz(quiz);
  if (!usableQuiz) return <QuizUnavailable />;

  const question = usableQuiz.questions[currentIdx];
  const totalQuestions = usableQuiz.questions.length;
  if (!question) return <QuizUnavailable />;

  const handleSelectMCQ = (optId: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [question.id]: optId }));
  };

  const handleToggleMultiSelect = (optId: string) => {
    if (isSubmitted) return;
    const current = (selectedAnswers[question.id] as string[]) || [];
    const updated = current.includes(optId)
      ? current.filter((id) => id !== optId)
      : [...current, optId];
    setSelectedAnswers((prev) => ({ ...prev, [question.id]: updated }));
  };

  const handleMatchSelect = (left: string, right: string) => {
    if (isSubmitted) return;
    setMatchingSelections((prev) => ({ ...prev, [left]: right }));
  };

  const getOrderingIds = (target: Question): string[] =>
    target.type === "ordering"
      ? orderedItems[target.id] ?? [...target.orderingItems].reverse().map((item) => item.id)
      : [];

  const moveOrderingItem = (itemId: string, direction: -1 | 1) => {
    if (isSubmitted) return;
    const current = getOrderingIds(question);
    const index = current.indexOf(itemId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    setOrderedItems((previous) => ({ ...previous, [question.id]: next }));
  };

  const handleCheckCurrentAnswer = () => {
    setIsSubmitted(true);
    let isCorrect = false;

    if (question.type === "mcq" || question.type === "true-false") {
      const selected = selectedAnswers[question.id];
      isCorrect = question.correctAnswerIds?.includes(selected as string) ?? false;
    } else if (question.type === "multi-select") {
      const selected = (selectedAnswers[question.id] as string[]) || [];
      const correct = question.correctAnswerIds || [];
      isCorrect =
        selected.length === correct.length &&
        selected.every((id) => correct.includes(id));
    } else if (question.type === "matching") {
      const pairs = question.matchingPairs || [];
      isCorrect = pairs.every((p) => matchingSelections[p.left_si] === p.right_si);
    } else if (question.type === "ordering") {
      const expected = [...(question.orderingItems ?? [])]
        .sort((a, b) => a.correctIndex - b.correctIndex)
        .map((item) => item.id);
      const selected = getOrderingIds(question);
      isCorrect = selected.length === expected.length && selected.every((id, index) => id === expected[index]);
    } else if (question.type === "short-answer") {
      const input = shortAnswerInput.trim().toLowerCase();
      const valid = question.correctShortAnswer_si || [];
      isCorrect = valid.some((v) => input.includes(v.toLowerCase()));
    } else {
      isCorrect = false;
    }

    if (isCorrect) {
      setScoreCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setIsSubmitted(false);
    setShortAnswerInput("");
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsQuizCompleted(true);
      const finalScore = scoreCount;
      const passed = (finalScore / totalQuestions) * 100 >= (usableQuiz.passingScorePercent || 70);
      ProgressStorage.recordQuizAttempt(usableQuiz.id, finalScore, totalQuestions, passed);
      if (onComplete) onComplete(finalScore, totalQuestions, passed);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedAnswers({});
    setMatchingSelections({});
    setOrderedItems({});
    setShortAnswerInput("");
    setIsSubmitted(false);
    setIsQuizCompleted(false);
    setScoreCount(0);
  };

  if (isQuizCompleted) {
    const percent = Math.round((scoreCount / totalQuestions) * 100);
    const passed = percent >= (usableQuiz.passingScorePercent || 70);

    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border shadow-warm-lg text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-accent mx-auto flex items-center justify-center mb-4">
          <Award className="w-8 h-8" />
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-primary mb-2">
          {passed ? "විශිෂ්ටයි! ඔබ ප්‍රශ්නාවලිය සමත් විය!" : "හොඳ උත්සාහයක්!"}
        </h3>
        <p className="text-text-secondary text-sm mb-4">
          ඔබ ප්‍රශ්න {totalQuestions} න් {scoreCount} කට නිවැරදි පිළිතුරු ලබා දුන්නා. ({percent}%)
        </p>

        <div className="bg-surface-warm p-4 rounded-xl border border-border-light mb-6 text-xs text-text-muted">
          {passed
            ? "ඔබ මෙම පාඩමේ සංකල්ප මනාව ග්‍රහණය කරගෙන ඇත. මීළඟ පාඩමට පිවිසෙන්න!"
            : "තව වරක් පාඩම පරිශීලනය කර ප්‍රශ්නාවලියට නැවත පිළිතුරු දෙමු."}
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all mx-auto shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          නැවත පිළිතුරු දෙන්න
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-border shadow-warm-md w-full">
      {/* Header & Progress Indicator */}
      <div className="flex items-center justify-between border-b border-border-light pb-3 mb-4">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-wider block mb-0.5">
            ප්‍රශ්නාවලිය ({usableQuiz.title_si})
          </span>
          <span className="text-xs text-text-muted">
            ප්‍රශ්න {currentIdx + 1} / {totalQuestions}
          </span>
        </div>
        <span className="text-xs font-bold text-primary bg-primary-50 px-2.5 py-1 rounded-full">
          ලකුණු: {scoreCount}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-warm h-1.5 rounded-full overflow-hidden mb-5">
        <div
          style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
          className="h-full bg-accent transition-all duration-300"
        />
      </div>

      {/* Question Prompt */}
      <h4 className="text-base sm:text-lg font-bold text-text mb-4 leading-snug">
        {question.prompt_si}
      </h4>

      {/* Question Formats Rendering */}
      <div className="space-y-3 mb-5">
        {/* MCQ & True/False */}
        {(question.type === "mcq" || question.type === "true-false") && (
          <div className="space-y-2">
            {question.options_si?.map((opt) => {
              const isSelected = selectedAnswers[question.id] === opt.id;
              const isCorrect = question.correctAnswerIds?.includes(opt.id);

              let style = "bg-white border-border hover:border-accent text-text";
              if (isSubmitted) {
                if (isCorrect) {
                  style = "bg-green-50 border-forest-green text-green-900 font-bold";
                } else if (isSelected) {
                  style = "bg-red-50 border-red-400 text-red-900";
                }
              } else if (isSelected) {
                style = "bg-amber-50 border-accent text-text font-bold";
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectMCQ(opt.id)}
                  disabled={isSubmitted}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center justify-between text-xs sm:text-sm font-medium ${style}`}
                >
                  <span>{opt.text_si}</span>
                  {isSubmitted && (
                    isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-forest-green shrink-0" />
                    ) : isSelected ? (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    ) : null
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Multi-Select */}
        {question.type === "multi-select" && (
          <div className="space-y-2">
            {question.options_si?.map((opt) => {
              const selectedList = (selectedAnswers[question.id] as string[]) || [];
              const isSelected = selectedList.includes(opt.id);
              const isCorrect = question.correctAnswerIds?.includes(opt.id);

              let style = "bg-white border-border text-text";
              if (isSubmitted) {
                if (isCorrect) {
                  style = "bg-green-50 border-forest-green text-green-900 font-bold";
                } else if (isSelected) {
                  style = "bg-red-50 border-red-400 text-red-900";
                }
              } else if (isSelected) {
                style = "bg-amber-50 border-accent text-text font-bold";
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleToggleMultiSelect(opt.id)}
                  disabled={isSubmitted}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 text-xs sm:text-sm ${style}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="accent-primary w-4 h-4 rounded pointer-events-none"
                  />
                  <span>{opt.text_si}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Matching */}
        {question.type === "matching" && question.matchingPairs && (
          <div className="space-y-3">
            <p className="text-xs text-text-muted italic">සෑම වම්පස අයිතමයකටම ගැළපෙන දකුණුපස අයිතමය තෝරන්න:</p>
            <div className="grid grid-cols-1 gap-2.5">
              {question.matchingPairs.map((pair) => (
                <div key={pair.left_si} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-surface-warm rounded-xl border border-border-light">
                  <span className="font-bold text-xs sm:text-sm text-text">{pair.left_si}</span>
                  <select
                    value={matchingSelections[pair.left_si] || ""}
                    onChange={(e) => handleMatchSelect(pair.left_si, e.target.value)}
                    disabled={isSubmitted}
                    className="bg-white border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:ring-1 focus:ring-primary"
                    aria-label={`${pair.left_si} සඳහා ගැළපුම තෝරන්න`}
                  >
                    <option value="">-- තෝරන්න --</option>
                    {question.matchingPairs?.map((p) => (
                      <option key={p.right_si} value={p.right_si}>
                        {p.right_si}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Short Answer */}
        {question.type === "ordering" && question.orderingItems && (
          <div className="space-y-2" aria-label="අයිතම නිවැරදි පිළිවෙළට සකසන්න">
            {getOrderingIds(question).map((itemId, index, current) => {
              const item = question.orderingItems?.find((candidate) => candidate.id === itemId);
              if (!item) return null;
              return (
                <div key={item.id} className="flex min-h-[44px] items-center gap-2 rounded-xl border border-border bg-surface-warm p-2">
                  <span className="w-7 text-center text-xs font-bold text-primary">{index + 1}</span>
                  <span className="flex-1 text-xs sm:text-sm">{item.text_si}</span>
                  <button
                    type="button"
                    onClick={() => moveOrderingItem(item.id, -1)}
                    disabled={isSubmitted || index === 0}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border bg-white disabled:opacity-40"
                    aria-label={`${item.text_si} ඉහළට ගෙනයන්න`}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveOrderingItem(item.id, 1)}
                    disabled={isSubmitted || index === current.length - 1}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border bg-white disabled:opacity-40"
                    aria-label={`${item.text_si} පහළට ගෙනයන්න`}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Short Answer */}
        {question.type === "short-answer" && (
          <div className="space-y-2">
            <input
              type="text"
              value={shortAnswerInput}
              onChange={(e) => setShortAnswerInput(e.target.value)}
              disabled={isSubmitted}
              placeholder="ඔබේ පිළිතුර මෙතැන ලියන්න..."
              className="w-full bg-surface-warm border border-border rounded-xl p-3.5 text-xs sm:text-sm text-text focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Explanatory Feedback when Submitted */}
      {isSubmitted && (
        <div className="bg-surface-warm p-4 rounded-xl border border-border-light mb-5 text-xs">
          <span className="font-bold block text-text mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" /> විවරණය (Explanation):
          </span>
          <p className="text-text-secondary leading-relaxed">{question.explanation_si}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end pt-3 border-t border-border-light">
        {!isSubmitted ? (
          <button
            type="button"
            onClick={handleCheckCurrentAnswer}
            className="bg-accent hover:bg-accent-dark text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-sm transition-all"
          >
            පිළිතුර පරීක්ෂා කරන්න
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNextQuestion}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-sm transition-all"
          >
            {currentIdx < totalQuestions - 1 ? "මීළඟ ප්‍රශ්නය" : "ප්‍රතිඵලය බලන්න"}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

import { describe, it, expect } from "vitest";
import { repository } from "@/lib/data/repository";

describe("Learning Paths & Prerequisite Dependency Suite", () => {
  const paths = repository.getLearningPaths();
  const lessons = repository.getLessons();
  const lessonIds = new Set(lessons.map((l) => l.id));

  it("should ensure every learning path has valid existing lesson IDs in its steps", () => {
    paths.forEach((path) => {
      expect(path.steps.length).toBeGreaterThan(0);
      path.steps.forEach((step) => {
        expect(lessonIds.has(step.lessonId)).toBe(true);
      });
    });
  });

  it("should ensure all learning path diagnostic questions have valid correctIndex", () => {
    paths.forEach((path) => {
      const q = path.diagnosticQuestion;
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options_si.length);
    });
  });

  it("should ensure all quizzes have at least 3 questions with explanations", () => {
    const quizzes = repository.getQuizzes();
    quizzes.forEach((q) => {
      expect(q.questions.length).toBeGreaterThanOrEqual(3);
      q.questions.forEach((qu) => {
        expect(qu.explanation_si).toBeTruthy();
      });
    });
  });
});

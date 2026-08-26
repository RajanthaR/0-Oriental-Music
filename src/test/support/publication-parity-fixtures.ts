import { describe, expect, it } from "vitest";
import lessonsData from "@/data/lessons.json";
import ragasData from "@/data/ragas.json";
import talasData from "@/data/talas.json";
import instrumentsData from "@/data/instruments.json";
import culturalTraditionsData from "@/data/cultural-traditions.json";
import theatreTraditionsData from "@/data/theatre-traditions.json";
import glossaryData from "@/data/glossary.json";
import learningPathsData from "@/data/learning-paths.json";
import quizzesData from "@/data/quizzes.json";
import examPapersData from "@/data/exam-papers.json";
import sourcesData from "@/data/sources.json";
import sourceDocumentsData from "../../../data/source-documents.json";
import sourcePageQualityData from "../../../data/source-page-quality.json";
import musicalCoreFieldDispositionsData from "../../../data/musical-core-field-dispositions.json";
import { repository } from "@/lib/data/repository";
import {
  DEPENDENCY_FIELD_RULES,
  createPublicationEvaluationContext,
  evaluatePublicationBatch,
  evaluateSourceReference,
  getRecordPublicationDecision,
  getSourceCorpusInventory,
  getTalaFieldDisposition,
  sanitizePublicRecord,
  type PublicationCatalogSnapshot,
} from "@/lib/data/publication-policy";
import {
  inspectGraph,
  validateContentRecord,
  type ContentEntityKind,
} from "@/lib/validation/content-contracts";
import { inspectDispositionRegistry } from "@/lib/validation/disposition-registry";
import { validateMusicalCoreFieldDispositions } from "@/lib/validation/content-validator";

export type RawRecord = Record<string, unknown>;
export type RawCatalog = RawRecord[];

export const lessons = lessonsData as unknown as RawCatalog;
export const ragas = ragasData as unknown as RawCatalog;
export const talas = talasData as unknown as RawCatalog;
export const instruments = instrumentsData as unknown as RawCatalog;
export const culturalTraditions = culturalTraditionsData as unknown as RawCatalog;
export const theatreTraditions = theatreTraditionsData as unknown as RawCatalog;
export const glossary = glossaryData as unknown as RawCatalog;
export const learningPaths = learningPathsData as unknown as RawCatalog;
export const quizzes = quizzesData as unknown as RawCatalog;
export const examPapers = examPapersData as unknown as RawCatalog;
export const sources = sourcesData as unknown as RawCatalog;
export const sourceDocuments = sourceDocumentsData as unknown as RawCatalog;
export const sourcePageQuality = sourcePageQualityData as unknown as RawCatalog;
export const musicalCoreFieldDispositions = musicalCoreFieldDispositionsData as unknown as RawRecord;

export function clone<T>(value: T): T {
  return structuredClone(value);
}

export function recordById(records: RawCatalog, id: string): RawRecord {
  const record = records.find((candidate) => candidate.id === id);
  if (!record) throw new Error(`Missing publication parity fixture: ${id}`);
  return record;
}

export function recordChild(record: RawRecord, field: string): RawRecord {
  const child = record[field];
  if (!child || typeof child !== "object" || Array.isArray(child)) {
    throw new Error(`Missing object fixture field: ${field}`);
  }
  return child as RawRecord;
}

export function restoreRecord(target: RawRecord, snapshot: RawRecord): void {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.assign(target, clone(snapshot));
}

export function restoreCatalog(target: RawCatalog, snapshot: RawCatalog): void {
  target.splice(0, target.length, ...clone(snapshot));
}
export type DependencyFixture = {
  field: string;
  kind: ContentEntityKind;
  path: string;
  catalog: keyof PublicationCatalogSnapshot;
  blocking: boolean;
  availableId: string;
  make: (dependencyId: string) => RawRecord;
};

export const makeLesson = (): RawRecord => clone(recordById(lessons, "les-intro-01"));
export const makeLearningPath = (): RawRecord => clone(recordById(learningPaths, "path-sound-nada"));
export const makeQuiz = (): RawRecord => clone(recordById(quizzes, "quiz-les-intro-01"));

export const dependencyFixtures: DependencyFixture[] = [
  {
    field: "prerequisites",
    kind: "lesson",
    path: "prerequisites[0]",
    catalog: "lessons",
    blocking: true,
    availableId: "les-swara-01",
    make: (dependencyId) => {
      const candidate = makeLesson();
      candidate.prerequisites = [dependencyId];
      return candidate;
    },
  },
  {
    field: "steps[].lessonId",
    kind: "learning-path",
    path: "steps[0].lessonId",
    catalog: "lessons",
    blocking: true,
    availableId: "les-intro-01",
    make: (dependencyId) => {
      const candidate = makeLearningPath();
      const steps = candidate.steps;
      if (!Array.isArray(steps) || !steps[0] || typeof steps[0] !== "object") {
        throw new Error("Missing learning-path step fixture");
      }
      (steps[0] as RawRecord).lessonId = dependencyId;
      return candidate;
    },
  },
  {
    field: "nextRecommendedLessonId",
    kind: "lesson",
    path: "nextRecommendedLessonId",
    catalog: "lessons",
    blocking: false,
    availableId: "les-swara-01",
    make: (dependencyId) => {
      const candidate = makeLesson();
      candidate.nextRecommendedLessonId = dependencyId;
      return candidate;
    },
  },
  {
    field: "quizId",
    kind: "lesson",
    path: "quizId",
    catalog: "quizzes",
    blocking: false,
    availableId: "quiz-les-intro-01",
    make: (dependencyId) => {
      const candidate = makeLesson();
      candidate.quizId = dependencyId;
      return candidate;
    },
  },
  {
    field: "masteryQuizId",
    kind: "learning-path",
    path: "masteryQuizId",
    catalog: "quizzes",
    blocking: true,
    availableId: "quiz-les-intro-01",
    make: (dependencyId) => {
      const candidate = makeLearningPath();
      candidate.masteryQuizId = dependencyId;
      return candidate;
    },
  },
  {
    field: "nextRecommendedPathId",
    kind: "lesson",
    path: "nextRecommendedPathId",
    catalog: "learningPaths",
    blocking: false,
    availableId: "path-sound-nada",
    make: (dependencyId) => {
      const candidate = makeLesson();
      candidate.nextRecommendedPathId = dependencyId;
      return candidate;
    },
  },
  {
    field: "lessonId",
    kind: "quiz",
    path: "lessonId",
    catalog: "lessons",
    blocking: true,
    availableId: "les-intro-01",
    make: (dependencyId) => {
      const candidate = makeQuiz();
      candidate.lessonId = dependencyId;
      return candidate;
    },
  },
  {
    field: "talaId",
    kind: "lesson",
    path: "listenActivity.talaId",
    catalog: "talas",
    blocking: true,
    availableId: "tala-dadra",
    make: (dependencyId) => {
      const candidate = makeLesson();
      recordChild(candidate, "listenActivity").talaId = dependencyId;
      return candidate;
    },
  },
  {
    field: "targetTalaId",
    kind: "lesson",
    path: "guidedPractice.targetTalaId",
    catalog: "talas",
    blocking: true,
    availableId: "tala-dadra",
    make: (dependencyId) => {
      const candidate = makeLesson();
      recordChild(candidate, "guidedPractice").targetTalaId = dependencyId;
      return candidate;
    },
  },
  {
    field: "audioTalaId",
    kind: "quiz",
    path: "questions[0].audioTalaId",
    catalog: "talas",
    blocking: true,
    availableId: "tala-dadra",
    make: (dependencyId) => {
      const candidate = makeQuiz();
      const questions = candidate.questions;
      if (!Array.isArray(questions) || !questions[0] || typeof questions[0] !== "object") {
        throw new Error("Missing quiz question fixture");
      }
      (questions[0] as RawRecord).audioTalaId = dependencyId;
      return candidate;
    },
  },
  {
    field: "ragaId",
    kind: "lesson",
    path: "guidedPractice.ragaId",
    catalog: "ragas",
    blocking: true,
    availableId: "raga-bilawal",
    make: (dependencyId) => {
      const candidate = makeLesson();
      recordChild(candidate, "guidedPractice").ragaId = dependencyId;
      return candidate;
    },
  },
  {
    field: "targetRagaId",
    kind: "lesson",
    path: "guidedPractice.targetRagaId",
    catalog: "ragas",
    blocking: true,
    availableId: "raga-bilawal",
    make: (dependencyId) => {
      const candidate = makeLesson();
      recordChild(candidate, "guidedPractice").targetRagaId = dependencyId;
      return candidate;
    },
  },
  {
    field: "selectedRagaId",
    kind: "lesson",
    path: "guidedPractice.selectedRagaId",
    catalog: "ragas",
    blocking: true,
    availableId: "raga-bilawal",
    make: (dependencyId) => {
      const candidate = makeLesson();
      recordChild(candidate, "guidedPractice").selectedRagaId = dependencyId;
      return candidate;
    },
  },
];

// Lib re-exports so seam-split test files have exactly one import site.
export {
  DEPENDENCY_FIELD_RULES,
  createPublicationEvaluationContext,
  evaluatePublicationBatch,
  evaluateSourceReference,
  getRecordPublicationDecision,
  getSourceCorpusInventory,
  getTalaFieldDisposition,
  sanitizePublicRecord,
} from "@/lib/data/publication-policy";
export type { PublicationCatalogSnapshot } from "@/lib/data/publication-policy";
export { repository } from "@/lib/data/repository";
export { inspectGraph, validateContentRecord } from "@/lib/validation/content-contracts";
export type { ContentEntityKind } from "@/lib/validation/content-contracts";
export { inspectDispositionRegistry } from "@/lib/validation/disposition-registry";
export { validateMusicalCoreFieldDispositions } from "@/lib/validation/content-validator";

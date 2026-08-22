import { PUBLIC_GRADE_BAND_VALUES } from "@/lib/shared/bounded-values";

/**
 * One declarative dependency policy for every recognized nested reference.
 *
 * Extracted verbatim from publication-policy so the matrix lives beside the
 * catalogs it names while staying importable without pulling in the whole
 * publication engine. The runtime values are identical to Phase 2; blocking
 * versus nonblocking dispositions must never drift.
 */

export const PUBLIC_GRADE_BANDS = PUBLIC_GRADE_BAND_VALUES;

export type PublicationCatalogKey =
  | "sources"
  | "lessons"
  | "ragas"
  | "talas"
  | "instruments"
  | "culturalTraditions"
  | "theatreTraditions"
  | "glossary"
  | "learningPaths"
  | "quizzes"
  | "examPapers";

export type DependencyRule = {
  readonly blocking: boolean;
  readonly catalog: PublicationCatalogKey;
};

function freezeDependencyRules<T extends Record<string, DependencyRule>>(rules: T): Readonly<T> {
  Object.values(rules).forEach((rule) => Object.freeze(rule));
  return Object.freeze(rules);
}

const DEPENDENCY_RULE_TABLE = freezeDependencyRules({
  prerequisites: Object.freeze({ blocking: true, catalog: "lessons" } as const),
  "steps[].lessonId": Object.freeze({ blocking: true, catalog: "lessons" } as const),
  nextRecommendedLessonId: Object.freeze({ blocking: false, catalog: "lessons" } as const),
  quizId: Object.freeze({ blocking: false, catalog: "quizzes" } as const),
  masteryQuizId: Object.freeze({ blocking: true, catalog: "quizzes" } as const),
  nextRecommendedPathId: Object.freeze({ blocking: false, catalog: "learningPaths" } as const),
  lessonId: Object.freeze({ blocking: true, catalog: "lessons" } as const),
  talaId: Object.freeze({ blocking: true, catalog: "talas" } as const),
  targetTalaId: Object.freeze({ blocking: true, catalog: "talas" } as const),
  audioTalaId: Object.freeze({ blocking: true, catalog: "talas" } as const),
  ragaId: Object.freeze({ blocking: true, catalog: "ragas" } as const),
  targetRagaId: Object.freeze({ blocking: true, catalog: "ragas" } as const),
  selectedRagaId: Object.freeze({ blocking: true, catalog: "ragas" } as const),
});

/** One dependency policy for every recognized nested reference. */
export const DEPENDENCY_FIELD_RULES: ReadonlyMap<string, DependencyRule> = new Map<string, DependencyRule>(
  Object.entries(DEPENDENCY_RULE_TABLE).map(([field, rule]) => [field, rule]),
);

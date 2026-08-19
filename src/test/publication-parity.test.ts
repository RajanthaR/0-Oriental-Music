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
import sourceDocumentsData from "../../data/source-documents.json";
import sourcePageQualityData from "../../data/source-page-quality.json";
import musicalCoreFieldDispositionsData from "../../data/musical-core-field-dispositions.json";
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

type RawRecord = Record<string, unknown>;
type RawCatalog = RawRecord[];

const lessons = lessonsData as unknown as RawCatalog;
const ragas = ragasData as unknown as RawCatalog;
const talas = talasData as unknown as RawCatalog;
const instruments = instrumentsData as unknown as RawCatalog;
const culturalTraditions = culturalTraditionsData as unknown as RawCatalog;
const theatreTraditions = theatreTraditionsData as unknown as RawCatalog;
const glossary = glossaryData as unknown as RawCatalog;
const learningPaths = learningPathsData as unknown as RawCatalog;
const quizzes = quizzesData as unknown as RawCatalog;
const examPapers = examPapersData as unknown as RawCatalog;
const sources = sourcesData as unknown as RawCatalog;
const sourceDocuments = sourceDocumentsData as unknown as RawCatalog;
const sourcePageQuality = sourcePageQualityData as unknown as RawCatalog;
const musicalCoreFieldDispositions = musicalCoreFieldDispositionsData as unknown as RawRecord;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function recordById(records: RawCatalog, id: string): RawRecord {
  const record = records.find((candidate) => candidate.id === id);
  if (!record) throw new Error(`Missing publication parity fixture: ${id}`);
  return record;
}

function recordChild(record: RawRecord, field: string): RawRecord {
  const child = record[field];
  if (!child || typeof child !== "object" || Array.isArray(child)) {
    throw new Error(`Missing object fixture field: ${field}`);
  }
  return child as RawRecord;
}

function restoreRecord(target: RawRecord, snapshot: RawRecord): void {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.assign(target, clone(snapshot));
}

function restoreCatalog(target: RawCatalog, snapshot: RawCatalog): void {
  target.splice(0, target.length, ...clone(snapshot));
}

type DependencyFixture = {
  field: string;
  kind: ContentEntityKind;
  path: string;
  catalog: keyof PublicationCatalogSnapshot;
  blocking: boolean;
  availableId: string;
  make: (dependencyId: string) => RawRecord;
};

const makeLesson = (): RawRecord => clone(recordById(lessons, "les-intro-01"));
const makeLearningPath = (): RawRecord => clone(recordById(learningPaths, "path-sound-nada"));
const makeQuiz = (): RawRecord => clone(recordById(quizzes, "quiz-les-intro-01"));

const dependencyFixtures: DependencyFixture[] = [
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

describe("cycle-two publication parity and freshness", () => {
  it("keeps the declarative dependency table exhaustive", () => {
    expect(dependencyFixtures.map((fixture) => fixture.field).sort()).toEqual(
      Array.from(DEPENDENCY_FIELD_RULES.keys()).sort(),
    );
    for (const fixture of dependencyFixtures) {
      expect(DEPENDENCY_FIELD_RULES.get(fixture.field)).toMatchObject({
        blocking: fixture.blocking,
        catalog: fixture.catalog,
      });
    }
  });

  it.each(dependencyFixtures)(
    "proves %s through contract, decision, projection, and checked batch boundaries",
    (fixture) => {
      const missingId = `missing-${fixture.field.replace(/[^a-zA-Z0-9]/g, "-")}`;
      const available = fixture.make(fixture.availableId);
      const missing = fixture.make(missingId);

      expect(validateContentRecord(available, fixture.kind), fixture.field).toMatchObject({
        kind: fixture.kind,
        isValid: true,
      });
      expect(validateContentRecord(missing, fixture.kind), fixture.field).toMatchObject({
        kind: fixture.kind,
        isValid: true,
      });

      const availableDecision = getRecordPublicationDecision(available);
      const missingDecision = getRecordPublicationDecision(missing);
      const availableDisposition = availableDecision.nestedDispositions.find((item) => item.path === fixture.path);
      const missingDisposition = missingDecision.nestedDispositions.find((item) => item.path === fixture.path);
      expect(availableDisposition, `${fixture.field} available disposition`).toMatchObject({
        blocking: fixture.blocking,
      });
      expect(missingDisposition, `${fixture.field} missing disposition`).toMatchObject({
        blocking: fixture.blocking,
        isPublic: false,
        reasonCodes: expect.arrayContaining(["dependent-entity-unavailable"]),
      });
      expect(missingDecision.isPublic).toBe(fixture.blocking ? false : availableDecision.isPublic);

      const availableProjection = sanitizePublicRecord(available);
      const missingProjection = sanitizePublicRecord(missing);
      expect(availableProjection).toEqual(availableDecision.publicProjection);
      expect(missingProjection).toEqual(missingDecision.publicProjection);
      if (fixture.blocking) {
        expect(missingProjection).toBeUndefined();
      } else {
        expect(missingProjection).toBeDefined();
        expect(missingProjection).not.toHaveProperty(fixture.field);
      }

      for (const [candidate, directDecision] of [[available, availableDecision], [missing, missingDecision]] as const) {
        const batch = evaluatePublicationBatch([candidate]);
        expect(batch).toMatchObject({ isValid: true });
        expect(batch.decisions).toHaveLength(1);
        expect(batch.decisions[0]).toMatchObject({
          state: directDecision.state,
          isPublic: directDecision.isPublic,
          reasonCodes: directDecision.reasonCodes,
        });
      }
    },
  );

  it.each(dependencyFixtures)(
    "proves %s through repository list, lookup, search catalog, and summary boundaries",
    (fixture) => {
      const missingId = `missing-${fixture.field.replace(/[^a-zA-Z0-9]/g, "-")}`;
      const candidate = fixture.make(missingId);
      const parent = fixture.kind === "lesson"
        ? { catalog: lessons, id: "les-intro-01", summary: "lessons" as const, list: () => repository.getLessons(), direct: (id: string) => repository.getLessonById(id), search: "lessons" as const }
        : fixture.kind === "quiz"
        ? { catalog: quizzes, id: "quiz-les-intro-01", summary: "quizzes" as const, list: () => repository.getQuizzes(), direct: (id: string) => repository.getQuizById(id), search: undefined }
        : { catalog: learningPaths, id: "path-sound-nada", summary: "learningPaths" as const, list: () => repository.getLearningPaths(), direct: (id: string) => repository.getLearningPathById(id), search: undefined };
      const index = parent.catalog.findIndex((record) => record.id === parent.id);
      if (index < 0) throw new Error(`Missing repository dependency fixture: ${parent.id}`);
      const original = parent.catalog[index];
      candidate.id = parent.id;
      try {
        parent.catalog[index] = candidate;
        const decision = getRecordPublicationDecision(candidate);
        const list = parent.list();
        expect(list.some((record) => record.id === parent.id), `${fixture.field} list`).toBe(decision.isPublic);
        expect(Boolean(parent.direct(parent.id)), `${fixture.field} lookup`).toBe(decision.isPublic);
        expect(repository.getPublicationSummary()[parent.summary].public, `${fixture.field} summary`).toBe(list.length);
        if (parent.search) {
          expect(repository.getPublicSearchCatalogs()[parent.search].some((record) => record.id === parent.id), `${fixture.field} search catalog`)
            .toBe(decision.isPublic);
        }
        if (!fixture.blocking && decision.isPublic) {
          expect(parent.direct(parent.id)).not.toHaveProperty(fixture.field);
        }
      } finally {
        parent.catalog[index] = original;
      }
    },
  );

  it("keeps repository lists, direct lookups, search catalogs, and summaries aligned", () => {
    const searchable = [
      {
        key: "lessons" as const,
        list: () => repository.getLessons(),
        direct: (id: string) => repository.getLessonById(id),
        query: (record: RawRecord) => String(record.title_si),
      },
      {
        key: "ragas" as const,
        list: () => repository.getRagas(),
        direct: (id: string) => repository.getRagaById(id),
        query: (record: RawRecord) => String(record.name_si),
      },
      {
        key: "talas" as const,
        list: () => repository.getTalas(),
        direct: (id: string) => repository.getTalaById(id),
        query: (record: RawRecord) => String(record.name_si),
      },
      {
        key: "instruments" as const,
        list: () => repository.getInstruments(),
        direct: (id: string) => repository.getInstrumentById(id),
        query: (record: RawRecord) => String(record.name_si),
      },
      {
        key: "glossary" as const,
        list: () => repository.getGlossary(),
        direct: (id: string) => repository.getGlossary().find((term) => term.id === id),
        query: (record: RawRecord) => String(record.term_si),
      },
      {
        key: "culturalTraditions" as const,
        list: () => repository.getCulturalTraditions(),
        direct: (id: string) => repository.getCulturalTraditionById(id),
        query: (record: RawRecord) => String(record.title_si),
      },
    ];
    const searchCatalogs = repository.getPublicSearchCatalogs();
    const summary = repository.getPublicationSummary();

    for (const entry of searchable) {
      const list = entry.list();
      const searchCatalog = searchCatalogs[entry.key];
      expect(searchCatalog.map((record) => record.id).sort(), `${entry.key} search catalog`).toEqual(
        list.map((record) => record.id).sort(),
      );
      expect(summary[entry.key].public, `${entry.key} summary`).toBe(list.length);
      if (list.length === 0) continue;
      const first = list[0] as unknown as RawRecord;
      expect(entry.direct(String(first.id)), `${entry.key} direct lookup`).toBeDefined();
      expect(getRecordPublicationDecision(first).isPublic, `${entry.key} decision`).toBe(true);
      const result = entry.key === "lessons"
        ? repository.getLessons({ query: entry.query(first) })
        : entry.key === "ragas"
        ? repository.getRagas(entry.query(first))
        : entry.key === "talas"
        ? repository.getTalas(entry.query(first))
        : entry.key === "instruments"
        ? repository.getInstruments(entry.query(first))
        : entry.key === "culturalTraditions"
        ? repository.getCulturalTraditions(entry.query(first))
        : repository.getGlossary(entry.query(first));
      expect(result.some((record) => record.id === first.id), `${entry.key} search result`).toBe(true);
    }

    const theatre = repository.getTheatreTraditions();
    expect(summary.theatreTraditions.public).toBe(theatre.length);
    if (theatre[0]) {
      expect(repository.getTheatreTraditionById(theatre[0].id)).toBeDefined();
      expect(getRecordPublicationDecision(theatre[0]).isPublic).toBe(true);
    }

    const nonSearchable = [
      ["learningPaths", () => repository.getLearningPaths(), (id: string) => repository.getLearningPathById(id)],
      ["quizzes", () => repository.getQuizzes(), (id: string) => repository.getQuizById(id)],
      ["exams", () => repository.getExamPapers(), (id: string) => repository.getExamPaperById(id)],
    ] as const;
    for (const [key, listReader, directReader] of nonSearchable) {
      const list = listReader();
      expect(summary[key].public, `${key} summary`).toBe(list.length);
      if (list[0]) expect(directReader(list[0].id), `${key} direct lookup`).toBeDefined();
    }

    expect(repository.getSources().map((source) => source.id)).toEqual(
      sources.map((source) => String(source.id)),
    );
  });

  it("recomputes every content-catalog summary after a catalog mutation", () => {
    const cases = [
      ["lessons", lessons, "les-intro-01", (record: RawRecord) => { record.gradeBands = ["12-13"]; }],
      ["ragas", ragas, "raga-bilawal", (record: RawRecord) => { record.gradeBands = ["12-13"]; }],
      ["talas", talas, "tala-dadra", (record: RawRecord) => { record.gradeBands = ["12-13"]; }],
      ["instruments", instruments, "inst-gatabera", (record: RawRecord) => { record.gradeBands = ["12-13"]; }],
      ["culturalTraditions", culturalTraditions, "cult-goyam-kavi", (record: RawRecord) => { record.gradeBands = ["12-13"]; }],
      ["theatreTraditions", theatreTraditions, "th-nadagam", (record: RawRecord) => { record.gradeBands = ["12-13"]; }],
      ["glossary", glossary, "term-nada", (record: RawRecord) => { record.gradeBands = ["12-13"]; }],
      ["learningPaths", learningPaths, "path-sound-nada", (record: RawRecord) => { record.gradeBands = ["12-13"]; }],
      ["quizzes", quizzes, "quiz-les-intro-01", (record: RawRecord) => { record.gradeBands = ["12-13"]; }],
      ["exams", examPapers, "exam-ol-model-01", (record: RawRecord) => { record.gradeBand = "12-13"; }],
    ] as const;

    const before = repository.getPublicationSummary();
    for (const [summaryKey, catalog, id, mutate] of cases) {
      const target = recordById(catalog, id);
      const original = clone(target);
      try {
        mutate(target);
        const after = repository.getPublicationSummary();
        expect(after[summaryKey], `${summaryKey} should refresh`).not.toEqual(before[summaryKey]);
        expect(after[summaryKey].raw).toBe(before[summaryKey].raw);
      } finally {
        restoreRecord(target, original);
      }
    }
    expect(repository.getPublicationSummary()).toEqual(before);
  });

  it("refreshes source evidence and Tala dispositions without promoting quarantined Talas", () => {
    const page = sourcePageQuality.find(
      (candidate) => candidate.documentSlug === "grade_11_raga_identification" && candidate.pageNumber === 1,
    );
    expect(page).toBeDefined();
    if (!page) return;
    const originalConfidence = page.confidence;
    const before = repository.getPublicationSummary();
    const beforeSource = repository.getSourceById("SRC-G11-RAGA-ID");
    expect(beforeSource).toBeDefined();
    try {
      page.confidence = "D";
      const after = repository.getPublicationSummary();
      expect(after.ragas.public).toBeLessThan(before.ragas.public);
      expect(repository.getRagas()).toEqual([]);
      expect(repository.getSourceById("SRC-G11-RAGA-ID")?.evidenceQuality).not.toBe(beforeSource?.evidenceQuality);
    } finally {
      page.confidence = originalConfidence;
    }
    expect(repository.getPublicationSummary()).toEqual(before);

    const dispositionEntry = (musicalCoreFieldDispositions.talas as RawCatalog)
      .find((entry) => entry.talaId === "tala-dadra");
    expect(dispositionEntry).toBeDefined();
    if (!dispositionEntry) return;
    const registryBefore = clone(musicalCoreFieldDispositions);
    const beforeTalaSummary = repository.getPublicationSummary().talas;
    expect(getTalaFieldDisposition("tala-dadra")?.allRequiredFieldsVerified).toBe(false);
    try {
      musicalCoreFieldDispositions.unclosedRequiredFields = [];
      const entry = dispositionEntry;
      const theka = recordChild(entry, "theka");
      theka.status = "verified";
      const bols = entry.bols;
      if (!Array.isArray(bols)) throw new Error("Missing Tala disposition bols fixture");
      bols.forEach((bol) => {
        if (!bol || typeof bol !== "object") throw new Error("Malformed Tala disposition bol fixture");
        (bol as RawRecord).status = "verified";
      });
      expect(getTalaFieldDisposition("tala-dadra")?.allRequiredFieldsVerified).toBe(true);
      const afterTalaSummary = repository.getPublicationSummary().talas;
      expect(afterTalaSummary).not.toEqual(beforeTalaSummary);
      expect(repository.getTalaById("tala-dadra")).toBeDefined();
    } finally {
      restoreRecord(musicalCoreFieldDispositions, registryBefore);
    }

    const restoredSummary = repository.getPublicationSummary();
    expect(restoredSummary.talas).toEqual(beforeTalaSummary);
    expect(repository.getTalas()).toEqual([]);
    for (const tala of talas) {
      expect(repository.getTalaById(String(tala.id))).toBeUndefined();
      expect(getRecordPublicationDecision(tala).isPublic).toBe(false);
    }
  });

  it("fails the complete publication operation closed on malformed page-quality metadata", () => {
    const page = sourcePageQuality.find(
      (candidate) => candidate.documentSlug === "grade_10_nadaya" && candidate.pageNumber === 2,
    );
    expect(page).toBeDefined();
    if (!page) return;
    const original = page.hasSinhalaText;
    try {
      page.hasSinhalaText = "false";
      const summary = repository.getPublicationSummary();
      expect(Object.values(summary).every((entry) => entry.public === 0)).toBe(true);
      expect(repository.getLessons()).toEqual([]);
      expect(repository.getRagas()).toEqual([]);
    } finally {
      page.hasSinhalaText = original;
    }
    expect(repository.getPublicationSummary().lessons.public).toBeGreaterThan(0);
  });

  it("rejects duplicate, missing, unknown, and out-of-range source-page evidence", () => {
    const before = clone(sourcePageQuality);
    const pageOne = sourcePageQuality.find(
      (candidate) => candidate.documentSlug === "grade_7_violin" && candidate.pageNumber === 1,
    );
    expect(pageOne).toBeDefined();
    if (!pageOne) return;
    try {
      const retained = sourcePageQuality.filter(
        (candidate) => !(candidate.documentSlug === "grade_7_violin" && candidate.pageNumber === 2),
      );
      sourcePageQuality.splice(0, sourcePageQuality.length, ...retained, clone(pageOne), {
        ...clone(pageOne),
        pageNumber: 999,
      });
      const context = createPublicationEvaluationContext();
      expect(context.safe).toBe(false);
      expect(evaluateSourceReference({
        sourceId: "SRC-G07-VIOLIN",
        pageOrSection: "sg7_emus_chap2.1.2_violin.pdf පිටු 1, 2",
      }, context)).toMatchObject({ supportable: false, reasonCode: "unsafe-evaluation-context" });
      expect(repository.getInstruments()).toEqual([]);
    } finally {
      restoreCatalog(sourcePageQuality, before);
    }
  });

  it("fails Tala publication closed when disposition IDs are duplicated", () => {
    const registryBefore = clone(musicalCoreFieldDispositions);
    const entry = (musicalCoreFieldDispositions.talas as RawCatalog)
      .find((candidate) => candidate.talaId === "tala-khemta");
    expect(entry).toBeDefined();
    if (!entry) return;
    try {
      (musicalCoreFieldDispositions.talas as RawCatalog).push(clone(entry));
      const context = createPublicationEvaluationContext();
      expect(context.safe).toBe(false);
      expect(getTalaFieldDisposition("tala-khemta", context)).toBeUndefined();
      expect(evaluatePublicationBatch(context.catalogs.talas, context)).toMatchObject({
        isValid: false,
        failureReason: "unsafe-container",
      });
      expect(repository.getTalas()).toEqual([]);
    } finally {
      restoreRecord(musicalCoreFieldDispositions, registryBefore);
    }
  });

  it("enforces shared-DAG, cycle, depth, sparse-array, and node-budget boundaries", () => {
    const shared = { value: "same" };
    expect(inspectGraph({ left: shared, right: shared })).toMatchObject({ safe: true, nodes: 2 });

    const direct: RawRecord = {};
    direct.self = direct;
    const mutualA: RawRecord = {};
    const mutualB: RawRecord = {};
    mutualA.next = mutualB;
    mutualB.next = mutualA;
    expect(inspectGraph(direct)).toMatchObject({ safe: false, reason: "cycle" });
    expect(inspectGraph(mutualA)).toMatchObject({ safe: false, reason: "cycle" });
    expect(getRecordPublicationDecision(direct).reasonCodes).toContain("unsafe-container");

    const atDepthLimit: RawRecord = {};
    let cursor = atDepthLimit;
    for (let index = 0; index < 256; index += 1) {
      cursor.child = {};
      cursor = cursor.child as RawRecord;
    }
    expect(inspectGraph(atDepthLimit).safe).toBe(true);
    cursor.child = {};
    expect(inspectGraph(atDepthLimit)).toMatchObject({ safe: false, reason: "depth-limit" });

    const atNodeLimit: RawRecord = {};
    for (let index = 0; index < 9_999; index += 1) atNodeLimit[`node-${index}`] = {};
    expect(inspectGraph(atNodeLimit)).toMatchObject({ safe: true, nodes: 10_000 });
    atNodeLimit["node-over-limit"] = {};
    expect(inspectGraph(atNodeLimit)).toMatchObject({ safe: false, reason: "node-limit" });

    const sparse: unknown[] = [];
    sparse.length = 1_000_000;
    expect(inspectGraph(sparse)).toMatchObject({ safe: false, reason: "node-limit" });
    expect(inspectGraph(Array.from({ length: 10_001 }, () => "node"))).toMatchObject({
      safe: false,
      reason: "node-limit",
    });
  });

  it("reports an available source-corpus inventory for the current safe corpus", () => {
    const inventory = getSourceCorpusInventory();
    expect(inventory.available).toBe(true);
    if (!inventory.available) throw new Error("Expected an available source-corpus inventory");
    expect(inventory.sourceDocuments).toBe(sourceDocuments.length);
    expect(inventory.sourcePages).toBe(
      sourceDocuments.reduce((sum, document) => sum + Number(document.pageCount), 0),
    );
    expect(inventory.sourceRecords).toBeGreaterThan(0);
    expect(Object.values(inventory.qualityCounts).reduce((sum, count) => sum + count, 0))
      .toBe(sourcePageQuality.length);
  });

  it.each([
    [
      "a malformed source document",
      () => { sourceDocuments[0].pageCount = "17"; },
    ],
    [
      "a source document with a blank review status",
      () => { sourceDocuments[0].reviewStatus = "   "; },
    ],
    [
      "a duplicated source-document slug",
      () => { sourceDocuments[1].slug = sourceDocuments[0].slug; },
    ],
    [
      "a malformed page-quality row",
      () => { sourcePageQuality[0].confidence = "E"; },
    ],
    [
      "a page-quality row beyond its document page count",
      () => { sourcePageQuality[0].pageNumber = 100_000; },
    ],
    [
      "a duplicated Tala disposition ID",
      () => {
        const rows = musicalCoreFieldDispositions.talas as RawCatalog;
        rows.push(clone(rows[0]));
      },
    ],
  ])(
    "returns an explicit unavailable source-corpus inventory for %s",
    (_label, corrupt) => {
      const documentSnapshot = clone(sourceDocuments);
      const pageSnapshot = clone(sourcePageQuality);
      const dispositionSnapshot = clone(musicalCoreFieldDispositions);
      try {
        corrupt();
        // The counts must never be presented as an ordinary inventory once the
        // evaluation context can no longer certify the corpus.
        expect(getSourceCorpusInventory()).toEqual({
          available: false,
          reason: "unsafe-evaluation-context",
        });
      } finally {
        restoreCatalog(sourceDocuments, documentSnapshot);
        restoreCatalog(sourcePageQuality, pageSnapshot);
        restoreRecord(musicalCoreFieldDispositions, dispositionSnapshot);
      }
      expect(getSourceCorpusInventory().available).toBe(true);
    },
  );

  it("returns an unavailable inventory for a forged or foreign evaluation context", () => {
    const forged = Object.freeze({ catalogs: {}, safe: true }) as unknown as Parameters<
      typeof getSourceCorpusInventory
    >[0];
    expect(getSourceCorpusInventory(forged)).toEqual({
      available: false,
      reason: "unsafe-evaluation-context",
    });

    const unsafe = createPublicationEvaluationContext({ lessons: undefined });
    expect(unsafe.safe).toBe(false);
    expect(getSourceCorpusInventory(unsafe)).toEqual({
      available: false,
      reason: "unsafe-evaluation-context",
    });
  });
});

describe("central Tala disposition-registry contract", () => {
  const ALL_TALA_IDS = ["tala-dadra", "tala-keherwa", "tala-teental", "tala-jhaptal", "tala-deepchandi", "tala-roopak", "tala-lawani", "tala-khemta"];

  function withRegistry(mutate: (registry: RawRecord) => void, assert: () => void): void {
    const snapshot = clone(musicalCoreFieldDispositions);
    try {
      mutate(musicalCoreFieldDispositions);
      assert();
    } finally {
      restoreRecord(musicalCoreFieldDispositions, snapshot);
    }
    // The corpus is certifiable again once the mutation is reverted.
    expect(createPublicationEvaluationContext().safe).toBe(true);
  }

  it("accepts the shipped registry through one shared contract", () => {
    const inspection = inspectDispositionRegistry(musicalCoreFieldDispositions);
    expect(inspection.issues).toEqual([]);
    expect(inspection.ok).toBe(true);
    expect(inspection.entryById.size).toBe(ALL_TALA_IDS.length);
    // Both consumers reach the same verdict on the same registry.
    expect(createPublicationEvaluationContext().safe).toBe(true);
    expect(validateMusicalCoreFieldDispositions()).toEqual({ isValid: true, issues: [] });
  });

  it.each([
    ["a drifted policy string", (registry: RawRecord) => { registry.policy = "partial-field-quarantine"; }, "policy"],
    ["a missing policy declaration", (registry: RawRecord) => { delete registry.policy; }, "policy"],
    ["a reordered requiredFields list", (registry: RawRecord) => { registry.requiredFields = ["structure", "context", "theka", "bols"]; }, "requiredFields"],
    ["a truncated requiredFields list", (registry: RawRecord) => { registry.requiredFields = ["context", "theka", "bols"]; }, "requiredFields"],
    ["an unclosed field outside requiredFields", (registry: RawRecord) => { registry.unclosedRequiredFields = ["structure", "tempo"]; }, "unclosedRequiredFields"],
    ["a duplicated unclosed field", (registry: RawRecord) => { registry.unclosedRequiredFields = ["structure", "structure"]; }, "unclosedRequiredFields"],
    ["a missing unclosedRequiredFields list", (registry: RawRecord) => { delete registry.unclosedRequiredFields; }, "unclosedRequiredFields"],
    ["a non-integer version", (registry: RawRecord) => { registry.version = "1"; }, "version"],
    ["an emptied issue catalog", (registry: RawRecord) => { registry.issueCatalog = []; }, "issueCatalog"],
    ["an unresolvable ledger anchor", (registry: RawRecord) => {
      ((registry.issueCatalog as RawCatalog)[0]).ledgerIssueId = "P02-NOT-IN-LEDGER";
    }, "issueCatalog"],
    ["a duplicated issue-catalog ID", (registry: RawRecord) => {
      const catalog = registry.issueCatalog as RawCatalog;
      catalog.push(clone(catalog[0]));
    }, "issueCatalog"],
    ["a dangling row issue anchor", (registry: RawRecord) => {
      recordChild((registry.talas as RawCatalog)[0], "context").issueId = "P02-DANGLING-ISSUE";
    }, "context.issueId"],
    ["an out-of-domain row status", (registry: RawRecord) => {
      recordChild((registry.talas as RawCatalog)[0], "theka").status = "approved";
    }, "theka"],
    ["a blank row quality", (registry: RawRecord) => {
      recordChild((registry.talas as RawCatalog)[0], "theka").quality = "   ";
    }, "theka"],
    ["a denormalized row talaId", (registry: RawRecord) => {
      ((registry.talas as RawCatalog)[0]).talaId = " tala-dadra ";
    }, "talaId"],
    ["a duplicated row talaId", (registry: RawRecord) => {
      const rows = registry.talas as RawCatalog;
      rows.push(clone(rows[0]));
    }, "talaId"],
    ["an emptied bol list", (registry: RawRecord) => {
      ((registry.talas as RawCatalog)[0]).bols = [];
    }, "fields"],
    ["a non-sequential bol matra", (registry: RawRecord) => {
      (((registry.talas as RawCatalog)[0]).bols as RawCatalog)[1].matra = 7;
    }, "bols[1]"],
    ["a null bol row", (registry: RawRecord) => {
      (((registry.talas as RawCatalog)[0]).bols as unknown[])[0] = null;
    }, "bols[0]"],
    ["an emptied talas array", (registry: RawRecord) => { registry.talas = []; }, "talas"],
  ])(
    "makes the evaluation context unsafe for a verified-looking registry with %s",
    (_label, mutate, expectedField) => {
      withRegistry(mutate, () => {
        const inspection = inspectDispositionRegistry(musicalCoreFieldDispositions);
        expect(inspection.ok).toBe(false);
        expect(inspection.issues.some((issue) => issue.field === expectedField)).toBe(true);

        // Publication gating consumes the same verdict: the whole evaluation
        // context is unsafe, not merely one row.
        const context = createPublicationEvaluationContext();
        expect(context.safe).toBe(false);
        expect(getTalaFieldDisposition("tala-khemta", context)).toBeUndefined();
        expect(evaluatePublicationBatch(talas, context)).toMatchObject({
          isValid: false,
          failureReason: "unsafe-container",
        });
        expect(repository.getTalas()).toEqual([]);

        // Forensic validation reports the same structural defect.
        const validated = validateMusicalCoreFieldDispositions(talas, musicalCoreFieldDispositions);
        expect(validated.isValid).toBe(false);
        expect(validated.issues.some((issue) => issue.field === expectedField)).toBe(true);

        // Whole-entity quarantine is preserved for every Tala throughout.
        ALL_TALA_IDS.forEach((id) => {
          expect(repository.getTalaById(id)).toBeUndefined();
        });
        expect(repository.getPublicationSummary().talas.public).toBe(0);
      });
    },
  );

  it("never throws for hostile registry containers and stays deterministic", () => {
    const hostile: unknown[] = [
      null,
      undefined,
      42,
      "registry",
      [],
      { talas: null },
      { talas: [null] },
      Object.defineProperty({}, "talas", { get() { throw new Error("hostile talas"); }, enumerable: true }),
      new Proxy({}, { ownKeys() { throw new Error("hostile ownKeys"); } }),
    ];
    hostile.forEach((candidate) => {
      expect(() => inspectDispositionRegistry(candidate)).not.toThrow();
      const first = inspectDispositionRegistry(candidate);
      const second = inspectDispositionRegistry(candidate);
      expect(first.ok).toBe(false);
      expect(first.issues.length).toBeGreaterThan(0);
      expect(second.issues).toEqual(first.issues);
    });
  });

  it("keeps all eight Talas quarantined even when the registry closes the structure field", () => {
    // Dropping structure from unclosedRequiredFields is structurally legal, so the
    // shared contract stays satisfied. The forensic validator must still refuse it,
    // and per-Tala evidence must still decide publication.
    withRegistry((registry) => { registry.unclosedRequiredFields = []; }, () => {
      expect(inspectDispositionRegistry(musicalCoreFieldDispositions).ok).toBe(true);
      expect(createPublicationEvaluationContext().safe).toBe(true);

      const validated = validateMusicalCoreFieldDispositions(talas, musicalCoreFieldDispositions);
      expect(validated.isValid).toBe(false);
      expect(validated.issues.some((issue) => issue.field === "policy")).toBe(true);

      ALL_TALA_IDS.forEach((id) => {
        expect(repository.getTalaById(id)).toBeUndefined();
      });
      expect(repository.getPublicationSummary().talas.public).toBe(0);
    });
  });
});

describe("source-document freshness across every consumer", () => {
  const RAGA_SOURCE_ID = "SRC-G11-RAGA-ID";
  const RAGA_DOCUMENT_SLUG = "grade_11_raga_identification";
  const PUBLIC_RAGA_ID = "raga-bilawal";

  function ragaSourceReference(): RawRecord {
    const raga = recordById(ragas, PUBLIC_RAGA_ID);
    return clone(recordChild(raga, "sourceReference"));
  }

  function sourceDocument(): RawRecord {
    const document = sourceDocuments.find((candidate) => candidate.slug === RAGA_DOCUMENT_SLUG);
    if (!document) throw new Error(`Missing source-document fixture: ${RAGA_DOCUMENT_SLUG}`);
    return document;
  }

  /**
   * Read all six consumers through one operation each, so a stale memoized
   * result in any of them would show up as a disagreement.
   */
  function readEveryConsumer() {
    return {
      referenceDecision: evaluateSourceReference(ragaSourceReference() as never),
      projection: repository.getSources().find((source) => source.id === RAGA_SOURCE_ID),
      documentSummary: repository.getSourceDocumentSummary(RAGA_SOURCE_ID),
      inventory: getSourceCorpusInventory(),
      contentList: repository.getRagas().map((raga) => raga.id),
      directLookup: repository.getRagaById(PUBLIC_RAGA_ID)?.id,
      publicationSummary: repository.getPublicationSummary().ragas,
    };
  }

  function withDocumentMutation(mutate: (document: RawRecord) => void, assert: () => void): void {
    const documentSnapshot = clone(sourceDocuments);
    const pageSnapshot = clone(sourcePageQuality);
    try {
      mutate(sourceDocument());
      assert();
    } finally {
      restoreCatalog(sourceDocuments, documentSnapshot);
      restoreCatalog(sourcePageQuality, pageSnapshot);
    }
  }

  it("serves the baseline document state through all six consumers", () => {
    const before = readEveryConsumer();
    expect(before.referenceDecision.supportable).toBe(true);
    expect(before.projection?.id).toBe(RAGA_SOURCE_ID);
    expect(before.documentSummary).toMatchObject({
      documentSlug: RAGA_DOCUMENT_SLUG,
      reviewStatus: "Source Triaged",
      pageCount: 2,
    });
    expect(before.inventory.available).toBe(true);
    expect(before.contentList).toContain(PUBLIC_RAGA_ID);
    expect(before.directLookup).toBe(PUBLIC_RAGA_ID);
    expect(before.publicationSummary.public).toBeGreaterThan(0);

    // Nothing is memoized: a second read is a fresh object with equal content.
    const again = readEveryConsumer();
    expect(again.publicationSummary).not.toBe(before.publicationSummary);
    expect(again.publicationSummary).toStrictEqual(before.publicationSummary);
    expect(again.documentSummary).toStrictEqual(before.documentSummary);
  });

  it("refreshes every consumer when only the source-document reviewStatus changes", () => {
    const before = readEveryConsumer();
    expect(before.directLookup).toBe(PUBLIC_RAGA_ID);

    withDocumentMutation(
      (document) => { document.reviewStatus = "Review Required"; },
      () => {
        const after = readEveryConsumer();

        // 1. source reference decisions
        expect(after.referenceDecision.supportable).toBe(false);
        expect(after.referenceDecision.reasonCode).toBe("source-document-needs-review");
        // 2. source projection stays available but reports the new state
        expect(after.projection?.id).toBe(RAGA_SOURCE_ID);
        expect(after.projection?.evidenceState).not.toBe(before.projection?.evidenceState);
        // 3. document/source summary
        expect(after.documentSummary.reviewStatus).toBe("Review Required");
        // 4. source-corpus inventory stays certifiable; only evidence changed
        expect(after.inventory.available).toBe(true);
        // 5. content list and 6. direct lookup withhold the dependent record
        expect(after.contentList).not.toContain(PUBLIC_RAGA_ID);
        expect(after.directLookup).toBeUndefined();
        // 7. publication summary agrees with the list in the same operation
        expect(after.publicationSummary.public).toBeLessThan(before.publicationSummary.public);
        expect(after.publicationSummary.public).toBe(after.contentList.length);
        expect(after.publicationSummary.raw).toBe(before.publicationSummary.raw);
      },
    );

    // Reverting the single field restores every consumer with no stale result.
    expect(readEveryConsumer()).toStrictEqual(before);
  });

  it("refreshes every consumer when only the source-document pageCount shrinks", () => {
    const before = readEveryConsumer();

    withDocumentMutation(
      (document) => {
        // Shrink the document to one page and drop the now out-of-range page row,
        // so the page registry stays internally consistent and the cited page 2
        // becomes genuinely out of range rather than merely unregistered.
        document.pageCount = 1;
        const kept = sourcePageQuality.filter((page) =>
          page.documentSlug !== RAGA_DOCUMENT_SLUG || Number(page.pageNumber) <= 1);
        restoreCatalog(sourcePageQuality, kept);
      },
      () => {
        const after = readEveryConsumer();

        expect(after.referenceDecision.supportable).toBe(false);
        expect(after.referenceDecision.reasonCode).toBe("page-out-of-range");
        expect(after.documentSummary.pageCount).toBe(1);
        expect(after.inventory.available).toBe(true);
        if (!after.inventory.available) throw new Error("Expected an available inventory");
        if (!before.inventory.available) throw new Error("Expected an available baseline inventory");
        expect(after.inventory.sourcePages).toBe(before.inventory.sourcePages - 1);
        expect(after.contentList).not.toContain(PUBLIC_RAGA_ID);
        expect(after.directLookup).toBeUndefined();
        expect(after.publicationSummary.public).toBe(after.contentList.length);
        expect(after.publicationSummary.public).toBeLessThan(before.publicationSummary.public);
      },
    );

    expect(readEveryConsumer()).toStrictEqual(before);
  });

  it("fails the whole corpus closed when a shrunken pageCount contradicts its page registry", () => {
    const before = readEveryConsumer();

    withDocumentMutation(
      (document) => { document.pageCount = 1; },
      () => {
        // The page-quality registry still lists page 2, so the corpus can no
        // longer be certified at all.
        expect(createPublicationEvaluationContext().safe).toBe(false);
        const after = readEveryConsumer();
        expect(after.referenceDecision.supportable).toBe(false);
        expect(after.referenceDecision.reasonCode).toBe("unsafe-evaluation-context");
        expect(after.projection).toBeUndefined();
        expect(after.documentSummary).toEqual({
          reviewStatus: "Unverified / unsafe evaluation context",
          pageCount: 0,
          evidenceQuality: "missing",
        });
        expect(after.inventory).toEqual({
          available: false,
          reason: "unsafe-evaluation-context",
        });
        expect(after.contentList).toEqual([]);
        expect(after.directLookup).toBeUndefined();
        expect(after.publicationSummary.public).toBe(0);
      },
    );

    expect(readEveryConsumer()).toStrictEqual(before);
  });

  it("refreshes every consumer for a page-quality downgrade independent of the document row", () => {
    const before = readEveryConsumer();
    const pageSnapshot = clone(sourcePageQuality);
    try {
      const page = sourcePageQuality.find((candidate) =>
        candidate.documentSlug === RAGA_DOCUMENT_SLUG && Number(candidate.pageNumber) === 1);
      if (!page) throw new Error("Missing page-quality fixture");
      page.confidence = "D";

      const after = readEveryConsumer();
      // The document row is untouched, so its own state is unchanged...
      expect(after.documentSummary.reviewStatus).toBe("Source Triaged");
      expect(after.documentSummary.pageCount).toBe(2);
      // ...while the evidence decision and every dependent surface refresh.
      expect(after.referenceDecision.supportable).toBe(false);
      expect(after.contentList).not.toContain(PUBLIC_RAGA_ID);
      expect(after.directLookup).toBeUndefined();
      expect(after.publicationSummary.public).toBe(after.contentList.length);
    } finally {
      restoreCatalog(sourcePageQuality, pageSnapshot);
    }

    expect(readEveryConsumer()).toStrictEqual(before);
  });
});

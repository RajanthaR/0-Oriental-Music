import { describe, expect, it } from "vitest";
import {
  clone,
  recordById,
  recordChild,
  restoreRecord,
  restoreCatalog,
  RawRecord,
  RawCatalog,
  dependencyFixtures,
  lessons,
  ragas,
  talas,
  instruments,
  culturalTraditions,
  theatreTraditions,
  glossary,
  learningPaths,
  quizzes,
  examPapers,
  sources,
  sourceDocuments,
  sourcePageQuality,
  musicalCoreFieldDispositions,
  repository,
  DEPENDENCY_FIELD_RULES,
  createPublicationEvaluationContext,
  evaluatePublicationBatch,
  evaluateSourceReference,
  getRecordPublicationDecision,
  getSourceCorpusInventory,
  getTalaFieldDisposition,
  sanitizePublicRecord,
  inspectGraph,
  validateContentRecord,
  inspectDispositionRegistry,
  validateMusicalCoreFieldDispositions,
} from "./support/publication-parity-fixtures";


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

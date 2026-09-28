import { describe, expect, it } from "vitest";
import ragasData from "@/data/ragas.json";
import lessonsData from "@/data/lessons.json";
import { repository } from "@/lib/data/repository";
import {
  createPublicationEvaluationContext,
  evaluatePublicationBatch,
  getPublicationCatalogRawCount,
  getRecordPublicationDecision,
  sanitizeReviewRecord,
  toPublicationInput,
} from "@/lib/data/publication-policy";
import { validatePublicCollection } from "@/lib/validation/content-validator";

describe("publication checked batches, hostile containers, and CMS boundaries", () => {
  it("fails publication batches closed for whitespace-normalized duplicate IDs", () => {
    const first = structuredClone(ragasData[0]) as unknown as Record<string, unknown>;
    const second = structuredClone(ragasData[0]) as unknown as Record<string, unknown>;
    second.id = ` ${String(first.id)} `;
    const result = evaluatePublicationBatch([first, second]);
    expect(result).toMatchObject({ isValid: true });
    expect(result.decisions).toHaveLength(2);
    expect(result.decisions.every((decision) =>
      !decision.isPublic && decision.reasonCodes.includes("duplicate-record-id"))).toBe(true);
  });

  it("preserves stable failure reasons at the checked batch boundary", () => {
    const sparse: unknown[] = [];
    sparse.length = 2;
    expect(evaluatePublicationBatch(null)).toMatchObject({
      isValid: false,
      decisions: [],
      failureReason: "non-array",
    });
    expect(evaluatePublicationBatch(sparse)).toMatchObject({
      isValid: false,
      decisions: [],
      failureReason: "unsafe-container",
    });

    const unsafeContext = createPublicationEvaluationContext({ lessons: undefined });
    expect(getRecordPublicationDecision(lessonsData[0], unsafeContext)).toMatchObject({
      isPublic: false,
      reasonCodes: ["unsafe-container"],
    });
    expect(sanitizeReviewRecord(lessonsData[0], unsafeContext)).toBeUndefined();
  });

  it("derives raw catalog counts from the exact detached snapshot", () => {
    const target = [structuredClone(ragasData[0])];
    let mutated = false;
    const stateful = new Proxy(target, {
      ownKeys(current) {
        if (!mutated) {
          mutated = true;
          current.push(structuredClone(ragasData[1]));
        }
        return Reflect.ownKeys(current);
      },
    });
    const context = createPublicationEvaluationContext({ ragas: stateful });
    expect(context.safe).toBe(true);
    expect(getPublicationCatalogRawCount(context, "ragas")).toBe(context.catalogs.ragas.length);
    expect(context.catalogs.ragas).toHaveLength(2);
  });

  it("validates caller-owned catalog records with the same publication snapshot", () => {
    const customRaga = structuredClone(ragasData[0]) as unknown as Record<string, unknown>;
    customRaga.id = "raga-custom-snapshot";
    expect(validatePublicCollection("Raga", [customRaga])).toEqual({ isValid: true, issues: [] });
  });

  it("never substitutes trusted defaults for explicitly malformed catalog inputs", () => {
    const accessorBacked: Record<string, unknown> = {};
    Object.defineProperty(accessorBacked, "ragas", {
      enumerable: true,
      get() {
        throw new Error("catalog getter must not run");
      },
    });
    const inputs: unknown[] = [
      { ragas: undefined },
      { ragas: null },
      { ragas: Symbol("unsafe") },
      accessorBacked,
    ];
    for (const input of inputs) {
      const context = createPublicationEvaluationContext(input as never);
      expect(context.safe).toBe(false);
      expect(context.catalogs.ragas).toEqual([]);
      expect(evaluatePublicationBatch([ragasData[0]], context)).toMatchObject({
        isValid: false,
        decisions: [],
        failureReason: "unsafe-container",
      });
    }
  });

  it("uses one normalized identity index for context, batch, review, and repository reads", () => {
    const first = structuredClone(ragasData[0]) as unknown as Record<string, unknown>;
    const second = structuredClone(ragasData[0]) as unknown as Record<string, unknown>;
    second.id = ` ${String(first.id)} `;
    const context = createPublicationEvaluationContext({ ragas: [first, second] });
    expect(context.safe).toBe(true);
    expect(getRecordPublicationDecision(first, context)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["unknown-record-kind"]),
    });
    expect(evaluatePublicationBatch(context.catalogs.ragas, context).decisions.every(
      (decision) => decision.reasonCodes.includes("duplicate-record-id"),
    )).toBe(true);
    expect(sanitizeReviewRecord(first, context)).toBeUndefined();

    const mutableRepository = repository as unknown as { ragas: unknown[] };
    const original = mutableRepository.ragas;
    try {
      mutableRepository.ragas = [first, second];
      expect(repository.getRagas()).toEqual([]);
      expect(repository.getRagaById(String(first.id))).toBeUndefined();
      expect(repository.getPublicationSummary().ragas).toMatchObject({
        raw: 2,
        public: 0,
        needsReview: 2,
        failureReasons: ["duplicate-record-id"],
      });
    } finally {
      mutableRepository.ragas = original;
    }

    const mutableLessons = repository as unknown as { lessons: unknown[] };
    const originalLessons = mutableLessons.lessons;
    const lessonA = structuredClone(lessonsData[0]) as unknown as Record<string, unknown>;
    const lessonB = structuredClone(lessonsData[0]) as unknown as Record<string, unknown>;
    lessonB.id = ` ${String(lessonA.id)} `;
    try {
      mutableLessons.lessons = [lessonA, lessonB];
      expect(repository.getLessons({ visibility: "review" })).toEqual([]);
      expect(repository.updateLessonReviewStatus(String(lessonA.id), "Needs Revision", false)).toMatchObject({ ok: false });
    } finally {
      mutableLessons.lessons = originalLessons;
    }
  });

  it("exposes only frozen publication snapshots, not mutable evaluation caches", () => {
    const context = createPublicationEvaluationContext();
    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.catalogs)).toBe(true);
    expect(Object.isFrozen(context.catalogs.lessons)).toBe(true);
    for (const privateField of ["memo", "stack", "snapshots", "knownKinds", "sourceDocuments", "sourcePageQuality"]) {
      expect((context as unknown as Record<string, unknown>)[privateField]).toBeUndefined();
    }
  });

  it("fails CMS operations safely for hostile IDs and metadata containers", () => {
    const mutableRepository = repository as unknown as { lessons: Array<Record<string, unknown>> };
    const originalCatalog = mutableRepository.lessons;
    const lessonCatalog = structuredClone(originalCatalog);
    mutableRepository.lessons = lessonCatalog;
    const raw = lessonCatalog.find((lesson) => lesson.id === "les-intro-01") as Record<string, unknown>;
    const originalMetadata = raw.reviewMetadata;
    const hostileMetadata = new Proxy(structuredClone(originalMetadata) as Record<string, unknown>, {
      ownKeys() {
        throw new Error("hostile metadata");
      },
    });
    try {
      raw.reviewMetadata = hostileMetadata;
      expect(() => repository.updateLessonStatus("les-intro-01", "Needs Revision", "Reviewer", "Notes"))
        .not.toThrow();
      expect(repository.updateLessonStatus("les-intro-01", "Needs Revision", "Reviewer", "Notes")).toMatchObject({ ok: false });

      const hostileId = new Proxy({ toString: () => "les-intro-01" }, {
        getPrototypeOf() {
          throw new Error("hostile id");
        },
      });
      expect(() => (repository.updateLessonReviewStatus as unknown as (...args: unknown[]) => unknown)(
        hostileId,
        "Needs Revision",
        false,
      )).not.toThrow();
      expect((repository.updateLessonReviewStatus as unknown as (...args: unknown[]) => unknown)(
        hostileId,
        "Needs Revision",
        false,
      )).toMatchObject({ ok: false });
    } finally {
      raw.reviewMetadata = originalMetadata;
      mutableRepository.lessons = originalCatalog;
    }
  });

  it("returns stable structured CMS rejection reasons", () => {
    expect(repository.updateLessonReviewStatus("les-intro-01", "Published", false)).toMatchObject({
      ok: false,
      reasonCode: "status-publication-mismatch",
    });
    expect(repository.updateLessonReviewStatus("les-intro-01", "Published", true)).toMatchObject({
      ok: false,
      reasonCode: "missing-review-evidence",
    });
    expect(repository.updateLessonStatus("missing-lesson", "Needs Revision", "Reviewer", "Notes")).toMatchObject({
      ok: false,
      reasonCode: "record-not-found",
    });
  });

  it("replaces the validated lesson snapshot without writing through a mutable catalog", () => {
    const mutableRepository = repository as unknown as { lessons: unknown[] };
    const original = mutableRepository.lessons;
    const target = structuredClone(original);
    let numericWrites = 0;
    const hostileCatalog = new Proxy(target, {
      set(current, property, value, receiver) {
        if (typeof property === "string" && /^\d+$/.test(property)) numericWrites += 1;
        return Reflect.set(current, property, value, receiver);
      },
    });
    mutableRepository.lessons = hostileCatalog;
    try {
      expect(repository.updateLessonReviewStatus("les-intro-01", "Needs Revision", false)).toMatchObject({ ok: true });
      expect(numericWrites).toBe(0);
      expect(mutableRepository.lessons).not.toBe(hostileCatalog);
      expect(mutableRepository.lessons.map((candidate) =>
        candidate && typeof candidate === "object" ? (candidate as { id?: unknown }).id : undefined,
      )).toEqual(target.map((candidate) =>
        candidate && typeof candidate === "object" ? (candidate as { id?: unknown }).id : undefined,
      ));
    } finally {
      mutableRepository.lessons = original;
    }
  });

  it("keeps CMS publication evidence immutable and applies status changes atomically", () => {
    const mutableRepository = repository as unknown as { lessons: unknown[] };
    const originalCatalog = mutableRepository.lessons;
    mutableRepository.lessons = structuredClone(originalCatalog);
    const index = mutableRepository.lessons.findIndex(
      (candidate) => candidate && typeof candidate === "object" && (candidate as Record<string, unknown>).id === "les-intro-01",
    );
    const original = mutableRepository.lessons[index];
    const lesson = structuredClone(original) as Record<string, unknown>;
    const verifiedMetadata = {
      status: "Rights & Source Verification",
      reviewer: "Verified reviewer fixture",
      reviewDate: "2026-08-15",
      lastVerifiedDate: "2026-08-15",
      changeNotes: "Verified claim-level evidence fixture",
      license: "Verified educational licence fixture",
      reuseStatus: "Curriculum Canonical",
    };
    lesson.reviewMetadata = verifiedMetadata;
    Object.defineProperty(lesson, "published", {
      value: false,
      writable: false,
      configurable: true,
      enumerable: true,
    });
    mutableRepository.lessons[index] = lesson;
    try {
      expect(repository.updateLessonStatus(
        "les-intro-01",
        "Published",
        "FORGED REVIEWER",
        "forged notes",
      )).toMatchObject({ ok: false });
      expect(mutableRepository.lessons[index]).toBe(lesson);
      expect(lesson.reviewMetadata).toEqual(verifiedMetadata);
      expect(lesson.published).toBe(false);

      expect(repository.updateLessonStatus(
        "les-intro-01",
        "Published",
        verifiedMetadata.reviewer,
        verifiedMetadata.changeNotes,
      )).toMatchObject({ ok: true });
      const replacement = mutableRepository.lessons[index] as Record<string, unknown>;
      expect(replacement).not.toBe(lesson);
      expect(replacement.published).toBe(true);
      expect(replacement.reviewMetadata).toMatchObject({
        status: "Published",
        reviewer: verifiedMetadata.reviewer,
        changeNotes: verifiedMetadata.changeNotes,
      });
      expect(lesson.published).toBe(false);
      expect(lesson.reviewMetadata).toEqual(verifiedMetadata);
    } finally {
      mutableRepository.lessons = originalCatalog;
    }
  });

  it("evaluates CMS publication against the same repository source snapshot", () => {
    const mutableRepository = repository as unknown as { lessons: unknown[]; sources: unknown[] };
    const originalCatalog = mutableRepository.lessons;
    mutableRepository.lessons = structuredClone(originalCatalog);
    const index = mutableRepository.lessons.findIndex(
      (candidate) => candidate && typeof candidate === "object" && (candidate as Record<string, unknown>).id === "les-intro-01",
    );
    const originalLesson = mutableRepository.lessons[index];
    const originalSources = mutableRepository.sources;
    const lesson = structuredClone(originalLesson) as Record<string, unknown>;
    lesson.reviewMetadata = {
      status: "Rights & Source Verification",
      reviewer: "Verified reviewer fixture",
      reviewDate: "2026-08-15",
      lastVerifiedDate: "2026-08-15",
      changeNotes: "Verified claim-level evidence fixture",
      license: "Verified educational licence fixture",
      reuseStatus: "Curriculum Canonical",
    };
    lesson.published = false;
    mutableRepository.lessons[index] = lesson;
    mutableRepository.sources = [];
    try {
      expect(repository.updateLessonReviewStatus("les-intro-01", "Published", true)).toMatchObject({ ok: false });
      expect(repository.updateLessonStatus(
        "les-intro-01",
        "Published",
        "Verified reviewer fixture",
        "Verified claim-level evidence fixture",
      )).toMatchObject({ ok: false });
      expect(mutableRepository.lessons[index]).toBe(lesson);
      expect(lesson.published).toBe(false);
    } finally {
      mutableRepository.lessons = originalCatalog;
      mutableRepository.sources = originalSources;
    }
  });

  it("fails closed after a previously trusted raw record becomes accessor-backed", () => {
    const candidate = structuredClone(ragasData[0]) as Record<string, unknown>;
    expect(getRecordPublicationDecision(candidate).isPublic).toBe(true);
    let getterCalls = 0;
    Object.defineProperty(candidate, "id", {
      enumerable: true,
      configurable: true,
      get() {
        getterCalls += 1;
        throw new Error("hostile id getter");
      },
    });
    expect(getRecordPublicationDecision(candidate)).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["unsafe-container"]),
    });
    expect(getterCalls).toBe(0);
  });

  it("rebuilds identity containment when a catalog mutates without changing length", () => {
    const mutableRepository = repository as unknown as { lessons: Array<Record<string, unknown>> };
    const originalCatalog = mutableRepository.lessons;
    const catalog = structuredClone(originalCatalog);
    mutableRepository.lessons = catalog;
    const original = catalog[1];
    const replacement = structuredClone(catalog[0]);
    catalog[1] = replacement;
    try {
      const context = createPublicationEvaluationContext({ lessons: catalog });
      expect(getRecordPublicationDecision(replacement, context)).toMatchObject({
        isPublic: false,
        reasonCodes: expect.arrayContaining(["unknown-record-kind", "malformed-record"]),
      });
      expect(repository.getLessons()).toEqual([]);
      expect(repository.getPublicationSummary().lessons).toMatchObject({
        raw: catalog.length,
        public: 0,
        needsReview: catalog.length,
      });
    } finally {
      catalog[1] = original;
      mutableRepository.lessons = originalCatalog;
    }
  });

  it("bounds direct publication-input grade normalization", () => {
    const oversized = Array.from({ length: 10_001 }, () => "10-11");
    expect(toPublicationInput({ id: "oversized", gradeBands: oversized })).toEqual({
      id: "",
      gradeBands: [],
      sourceReference: undefined,
    });

    const sparse = new Array(2) as string[];
    sparse[1] = "10-11";
    expect(toPublicationInput({ id: "sparse", gradeBands: sparse }).gradeBands).toEqual([]);

    const hostile = new Proxy([], {
      get(_target, key) {
        if (key === "length") throw new Error("hostile length");
        return Reflect.get(_target, key);
      },
    });
    expect(() => toPublicationInput({ id: "hostile", gradeBands: hostile })).not.toThrow();
    expect(toPublicationInput({ id: "hostile", gradeBands: hostile }).gradeBands).toEqual([]);
  });

  it("rejects invisible-control record identities across the checked batch", () => {
    const first = structuredClone(ragasData.find((raga) => raga.id === "raga-bilawal"));
    const second = structuredClone(first) as typeof first;
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (!first || !second) return;
    second.id = `${first.id}\u200B`;
    const evaluation = evaluatePublicationBatch([first, second]);
    expect(evaluation.isValid).toBe(true);
    expect(evaluation.decisions[0]?.isPublic).toBe(true);
    expect(evaluation.decisions[1]).toMatchObject({
      isPublic: false,
      reasonCodes: expect.arrayContaining(["malformed-record"]),
    });
  });
});

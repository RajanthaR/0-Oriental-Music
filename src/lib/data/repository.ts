import {
  Lesson,
  Raga,
  Tala,
  Instrument,
  CulturalTradition,
  TheatreTradition,
  GlossaryTerm,
  LearningPath,
  Quiz,
  ExamPaper,
  GradeBandType,
  ReviewStatus,
  ReviewMetadata,
} from "@/types/content";

export {
  CURRICULUM_STRANDS,
  CURRICULUM_STRAND_IDS,
  type CurriculumStrandId,
  type StrandInfo,
} from "@/lib/data/curriculum-strands";
import { CURRICULUM_STRANDS } from "@/lib/data/curriculum-strands";
import type { StrandInfo } from "@/lib/data/curriculum-strands";

import sourcesData from "@/data/sources.json";
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
import { searchFilter } from "@/lib/search/search-engine";
import {
  getRecordPublicationDecision,
  getRecordPublicationDecisions,
  getSourceDocumentSummary,
  UNKNOWN_PROVENANCE,
  PUBLIC_GRADE_BANDS,
  sanitizePublicRecord,
  sanitizeReviewRecord,
  createUnverifiedReviewMetadata,
  type SourceDocumentSummary,
} from "@/lib/data/publication-policy";
import {
  isRecord,
  isReviewMetadata,
  inspectGraph,
  MAX_ARRAY_ITEMS,
  validateContentRecord,
  type ContentEntityKind,
} from "@/lib/validation/content-contracts";

const COMPLETED_REVIEW_STATUSES = new Set<ReviewStatus>([
  "Rights & Source Verification",
  "Published",
]);

function hasUniqueRecordIds(items: readonly unknown[]): boolean {
  const ids = new Set<string>();
  for (const item of items) {
    if (!isRecord(item)) return false;
    let rawId: unknown;
    try {
      rawId = item.id;
    } catch {
      return false;
    }
    const id = typeof rawId === "string" ? rawId.trim() : "";
    if (!id || ids.has(id)) return false;
    ids.add(id);
  }
  return true;
}

function hasKnownReviewEvidence(value: unknown): value is ReviewMetadata {
  try {
    if (!isReviewMetadata(value) || !isRecord(value)) return false;
    const metadata = value as unknown as ReviewMetadata;
    if (!COMPLETED_REVIEW_STATUSES.has(metadata.status)) return false;
    const isUnknown = (field: string): boolean => {
      const normalized = field.trim().toLowerCase();
      return normalized === UNKNOWN_PROVENANCE.toLowerCase() ||
        normalized === "unknown / unverified" || normalized === "unknown";
    };
    if ([
      metadata.reviewer,
      metadata.reviewDate,
      metadata.lastVerifiedDate,
      metadata.changeNotes,
      metadata.license,
    ].some(isUnknown)) return false;
    if (metadata.changeNotes.trim().startsWith("Publication containment baseline:")) return false;
    return !isUnknown(metadata.reuseStatus);
  } catch {
    return false;
  }
}

function readRawReviewMetadata(lesson: Record<string, unknown>): unknown {
  try {
    return lesson.reviewMetadata;
  } catch {
    return undefined;
  }
}

const FINGERPRINT_DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);

type FingerprintEntry = { key: string; value: unknown };

/**
 * Build a bounded, descriptor-only fingerprint for mutable test/runtime data.
 *
 * The repository's JSON imports are normally immutable application data, but
 * the CMS simulation and forensic tests intentionally mutate those objects.
 * A summary memo must therefore detect nested changes without invoking a
 * getter, accepting inherited data, or recursively walking an unbounded graph.
 */
function safeFingerprint(value: unknown): string | undefined {
  if (value === null || typeof value !== "object") return primitiveFingerprint(value);
  if (!inspectGraph(value).safe) return undefined;

  const ids = new WeakMap<object, number>();
  const frames: Array<{ value: object; id: number }> = [];
  const records: string[] = [];
  let nextId = 1;
  ids.set(value, nextId);
  frames.push({ value, id: nextId });
  nextId += 1;

  while (frames.length > 0) {
    const frame = frames.pop()!;
    const object = frame.value;
    let entries: FingerprintEntry[];
    let arrayLength = 0;
    try {
      const isArray = Array.isArray(object);
      const prototype = Object.getPrototypeOf(object);
      if ((isArray && prototype !== Array.prototype && prototype !== null) ||
          (!isArray && prototype !== Object.prototype && prototype !== null)) return undefined;

      const descriptors = Object.getOwnPropertyDescriptors(object);
      const keys = Reflect.ownKeys(descriptors);
      if (keys.some((key) => typeof key !== "string")) return undefined;

      if (isArray) {
        const lengthDescriptor = descriptors.length;
        if (!lengthDescriptor || !("value" in lengthDescriptor) ||
            typeof lengthDescriptor.value !== "number" ||
            !Number.isInteger(lengthDescriptor.value) ||
            lengthDescriptor.value < 0 || lengthDescriptor.value > MAX_ARRAY_ITEMS) return undefined;
        arrayLength = lengthDescriptor.value;
        if (keys.length !== arrayLength + 1) return undefined;
        entries = [];
        for (let index = 0; index < arrayLength; index += 1) {
          const key = String(index);
          const descriptor = descriptors[key];
          if (!descriptor || !descriptor.enumerable || !("value" in descriptor) ||
              Object.prototype.hasOwnProperty.call(descriptor, "get") ||
              Object.prototype.hasOwnProperty.call(descriptor, "set")) return undefined;
          entries.push({ key, value: descriptor.value });
        }
      } else {
        entries = [];
        for (const key of keys as string[]) {
          if (FINGERPRINT_DANGEROUS_KEYS.has(key)) return undefined;
          const descriptor = descriptors[key];
          if (!descriptor.enumerable || !("value" in descriptor) ||
              Object.prototype.hasOwnProperty.call(descriptor, "get") ||
              Object.prototype.hasOwnProperty.call(descriptor, "set")) return undefined;
          entries.push({ key, value: descriptor.value });
        }
      }
    } catch {
      return undefined;
    }

    const parts = [`${frame.id}:${arrayLength > 0 || Array.isArray(object) ? "a" : "o"}`];
    for (const entry of entries) {
      const child = entry.value;
      let encoded: string | undefined;
      if (child !== null && typeof child === "object") {
        let childId = ids.get(child);
        if (!childId) {
          childId = nextId;
          nextId += 1;
          ids.set(child, childId);
          frames.push({ value: child, id: childId });
        }
        encoded = `@${childId}`;
      } else {
        encoded = primitiveFingerprint(child);
      }
      if (encoded === undefined) return undefined;
      parts.push(`${JSON.stringify(entry.key)}=${encoded}`);
    }
    records[frame.id - 1] = parts.join(",");
  }
  return records.join("|");
}

function primitiveFingerprint(value: unknown): string | undefined {
  switch (typeof value) {
    case "undefined": return "u";
    case "string": return `s:${JSON.stringify(value)}`;
    case "number": return `n:${String(value)}`;
    case "boolean": return `b:${value ? "1" : "0"}`;
    case "bigint": return `i:${String(value)}`;
    case "function":
    case "symbol": return undefined;
    case "object": return value === null ? "null" : undefined;
    default: return undefined;
  }
}

function safeCollectionFingerprint(items: readonly unknown[]): string | undefined {
  const parts = [`length:${items.length}`];
  for (const item of items) {
    const fingerprint = safeFingerprint(item);
    if (fingerprint === undefined) return undefined;
    parts.push(fingerprint);
  }
  return parts.join(";");
}

export interface SourceCatalogView {
  id: string;
  title: string;
  originalFilename: string;
  publisher: string;
  grades: string[];
  year: string;
  language: string;
  tier: string;
  location: string;
  status: string;
  license: string;
  url?: string;
  evidenceState: string;
  evidenceQuality: string;
}

export interface PublicationCollectionSummary {
  raw: number;
  public: number;
  quarantined: number;
  needsReview: number;
}

export type LessonVisibility = "public" | "review";

class ContentRepository {
  private sources: unknown[] = sourcesData as unknown[];
  private lessons: unknown[] = lessonsData as unknown[];
  private ragas: unknown[] = ragasData as unknown[];
  private talas: unknown[] = talasData as unknown[];
  private instruments: unknown[] = instrumentsData as unknown[];
  private culturalTraditions: unknown[] = culturalTraditionsData as unknown[];
  private theatreTraditions: unknown[] = theatreTraditionsData as unknown[];
  private glossary: unknown[] = glossaryData as unknown[];
  private learningPaths: unknown[] = learningPathsData as unknown[];
  private quizzes: unknown[] = quizzesData as unknown[];
  private examPapers: unknown[] = examPapersData as unknown[];
  private publicationCacheGeneration = 0;
  private publicationSummaryCache?: {
    generation: number;
    fingerprint: string;
    summary: Record<string, PublicationCollectionSummary>;
  };

  private getPublicationFingerprint(): string | undefined {
    const collections = [
      this.sources,
      this.lessons,
      this.ragas,
      this.talas,
      this.instruments,
      this.culturalTraditions,
      this.theatreTraditions,
      this.glossary,
      this.learningPaths,
      this.quizzes,
      this.examPapers,
    ];
    const fingerprints = collections.map(safeCollectionFingerprint);
    return fingerprints.every((fingerprint): fingerprint is string => fingerprint !== undefined)
      ? fingerprints.join("||")
      : undefined;
  }

  private invalidatePublicationCache(): void {
    this.publicationCacheGeneration += 1;
    this.publicationSummaryCache = undefined;
  }

  private freezePublicationSummary(
    summary: Record<string, PublicationCollectionSummary>,
  ): Record<string, PublicationCollectionSummary> {
    for (const value of Object.values(summary)) Object.freeze(value);
    return Object.freeze(summary);
  }

  private selectPublic<T>(items: readonly unknown[]): T[] {
    if (!hasUniqueRecordIds(items)) return [];
    const decisions = getRecordPublicationDecisions(items);
    return items.flatMap((item, index) => {
      const decision = decisions[index];
      return decision.isPublic && decision.publicProjection
        ? [decision.publicProjection as T]
        : [];
    });
  }

  private selectForReview<T>(items: readonly unknown[], kind: ContentEntityKind): T[] {
    return items.flatMap((item) => {
      const projection = sanitizeReviewRecord(item);
      return validateContentRecord(projection, kind).isValid ? [projection as T] : [];
    });
  }

  private summarize(items: readonly unknown[]): PublicationCollectionSummary {
    if (!hasUniqueRecordIds(items)) {
      return { raw: items.length, public: 0, quarantined: 0, needsReview: items.length };
    }
    const decisions = getRecordPublicationDecisions(items);
    return {
      raw: items.length,
      public: decisions.filter((decision) => decision.state === "public").length,
      quarantined: decisions.filter((decision) => decision.state === "quarantined").length,
      needsReview: decisions.filter((decision) => decision.state === "needs-review").length,
    };
  }

  // Sources: public transparency metadata is deliberately sanitized. The raw
  // publisher/year/location/license values are not provenance evidence.
  public getSources(): SourceCatalogView[] {
    if (!hasUniqueRecordIds(this.sources)) return [];
    return this.sources.flatMap((candidate) => {
      if (!validateContentRecord(candidate, "source").isValid || !isRecord(candidate)) return [];
      const source = candidate as {
        id: string;
        title: string;
        originalFilename: string;
        grades: string[];
        language: string;
        url?: string;
      };
      const document = getSourceDocumentSummary(source.id);
      return [{
        id: source.id,
        title: source.title,
        originalFilename: source.originalFilename,
        publisher: UNKNOWN_PROVENANCE,
        grades: [...source.grades],
        year: UNKNOWN_PROVENANCE,
        language: source.language,
        tier: "මූලාශ්‍ර වාර්තාව (සනාථ නොකළ)",
        location: UNKNOWN_PROVENANCE,
        status: "Unverified / source review pending",
        license: UNKNOWN_PROVENANCE,
        url: source.url,
        evidenceState: document.reviewStatus,
        evidenceQuality: document.evidenceQuality,
      }];
    });
  }

  public getSourceById(id: string): SourceCatalogView | undefined {
    return this.getSources().find((source) => source.id === id);
  }

  // Strands are derived from publicly discoverable lessons, not from the raw
  // curriculum map. Empty is an honest state while the source review is open.
  public getStrands(): StrandInfo[] {
    const publicLessonStrands = new Set(this.getLessons().map((lesson) => lesson.strandId));
    return CURRICULUM_STRANDS
      .filter((strand) => publicLessonStrands.has(strand.id))
      .map((strand) => ({
        ...strand,
        gradeBands: strand.gradeBands.filter((grade) =>
          PUBLIC_GRADE_BANDS.includes(grade as (typeof PUBLIC_GRADE_BANDS)[number])
        ),
      }));
  }

  public getStrandById(id: string): StrandInfo | undefined {
    return this.getStrands().find((strand) => strand.id === id);
  }

  // Lessons
  public getLessons(filters?: {
    gradeBand?: GradeBandType;
    strandId?: string;
    visibility?: LessonVisibility;
    query?: string;
  }): Lesson[] {
    let list = filters?.visibility === "review"
      ? this.selectForReview<Lesson>(this.lessons, "lesson")
      : this.selectPublic<Lesson>(this.lessons);
    if (filters?.gradeBand) {
      list = list.filter((lesson) => lesson.gradeBands.includes(filters.gradeBand!));
    }
    if (filters?.strandId) {
      list = list.filter((lesson) => lesson.strandId === filters.strandId);
    }
    if (filters?.query) {
      list = searchFilter(list, filters.query, (lesson) => [
        lesson.title_si,
        lesson.title_en || "",
        lesson.summary_si,
        lesson.learningGoal_si,
      ]);
    }
    return list;
  }

  public getLessonById(id: string): Lesson | undefined {
    return this.getLessons().find((lesson) => lesson.id === id || lesson.slug === id);
  }

  // Ragas
  public getRagas(query?: string): Raga[] {
    let list = this.selectPublic<Raga>(this.ragas);
    if (query) {
      list = searchFilter(list, query, (raga) => [
        raga.name_si,
        raga.name_en,
        raga.thata_si,
        raga.vadi_si,
        raga.samvadi_si,
        raga.time_si,
      ]);
    }
    return list;
  }

  public getRagaById(id: string): Raga | undefined {
    return this.getRagas().find((raga) => raga.id === id);
  }

  // Talas
  public getTalas(query?: string): Tala[] {
    let list = this.selectPublic<Tala>(this.talas);
    if (query) {
      list = searchFilter(list, query, (tala) => [
        tala.name_si,
        tala.name_en,
        ...tala.aliases_si,
        tala.theka_si,
      ]);
    }
    return list;
  }

  public getTalaById(id: string): Tala | undefined {
    return this.getTalas().find((tala) => tala.id === id);
  }

  // Instruments
  public getInstruments(query?: string): Instrument[] {
    let list = this.selectPublic<Instrument>(this.instruments);
    if (query) {
      list = searchFilter(list, query, (instrument) => [
        instrument.name_si,
        instrument.name_en,
        instrument.category_si,
        instrument.origin_si,
        instrument.construction_si,
      ]);
    }
    return list;
  }

  public getInstrumentById(id: string): Instrument | undefined {
    return this.getInstruments().find((instrument) => instrument.id === id);
  }

  // Traditions
  public getCulturalTraditions(query?: string): CulturalTradition[] {
    let list = this.selectPublic<CulturalTradition>(this.culturalTraditions);
    if (query) {
      list = searchFilter(list, query, (tradition) => [
        tradition.title_si,
        tradition.title_en,
        tradition.category_si,
        tradition.description_si,
      ]);
    }
    return list;
  }

  public getCulturalTraditionById(id: string): CulturalTradition | undefined {
    return this.getCulturalTraditions().find((tradition) => tradition.id === id);
  }

  public getTheatreTraditions(query?: string): TheatreTradition[] {
    let list = this.selectPublic<TheatreTradition>(this.theatreTraditions);
    if (query) {
      list = searchFilter(list, query, (tradition) => [
        tradition.title_si,
        tradition.title_en,
        tradition.type_si,
        tradition.historicalBackground_si,
      ]);
    }
    return list;
  }

  public getTheatreTraditionById(id: string): TheatreTradition | undefined {
    return this.getTheatreTraditions().find((tradition) => tradition.id === id);
  }

  // Glossary
  public getGlossary(query?: string, category?: string): GlossaryTerm[] {
    let list = this.selectPublic<GlossaryTerm>(this.glossary);
    if (category) {
      list = list.filter((term) => term.category_si === category);
    }
    if (query) {
      list = searchFilter(list, query, (term) => [
        term.term_si,
        term.term_en,
        term.transliteration,
        term.definition_si,
        term.category_si,
      ]);
    }
    return list;
  }

  // Learning-path dependency closure is enforced by the central publication
  // decision, so every public surface consumes the same result.
  public getLearningPaths(gradeBand?: GradeBandType): LearningPath[] {
    let list = this.selectPublic<LearningPath>(this.learningPaths);
    if (gradeBand) {
      list = list.filter((path) => path.gradeBands.includes(gradeBand));
    }
    return list;
  }

  public getLearningPathById(id: string): LearningPath | undefined {
    return this.getLearningPaths().find((path) => path.id === id);
  }

  // Quizzes & Exams
  public getQuizzes(): Quiz[] {
    return this.selectPublic<Quiz>(this.quizzes);
  }

  public getQuizById(id: string): Quiz | undefined {
    return this.getQuizzes().find((quiz) => quiz.id === id);
  }

  public getExamPapers(gradeBand?: GradeBandType): ExamPaper[] {
    let list = this.selectPublic<ExamPaper>(this.examPapers);
    if (gradeBand) {
      list = list.filter((paper) => paper.gradeBand === gradeBand);
    }
    return list;
  }

  public getExamPaperById(id: string): ExamPaper | undefined {
    return this.getExamPapers().find((paper) => paper.id === id);
  }

  public getPublicationSummary(): Record<string, PublicationCollectionSummary> {
    const fingerprint = this.getPublicationFingerprint();
    if (fingerprint !== undefined &&
        this.publicationSummaryCache?.generation === this.publicationCacheGeneration &&
        this.publicationSummaryCache.fingerprint === fingerprint) {
      return this.publicationSummaryCache.summary;
    }

    const learningPaths = this.summarize(this.learningPaths);
    const summary = {
      lessons: this.summarize(this.lessons),
      ragas: this.summarize(this.ragas),
      talas: this.summarize(this.talas),
      instruments: this.summarize(this.instruments),
      culturalTraditions: this.summarize(this.culturalTraditions),
      theatreTraditions: this.summarize(this.theatreTraditions),
      glossary: this.summarize(this.glossary),
      learningPaths,
      quizzes: this.summarize(this.quizzes),
      exams: this.summarize(this.examPapers),
    };
    const frozenSummary = this.freezePublicationSummary(summary);
    if (fingerprint !== undefined) {
      this.publicationSummaryCache = {
        generation: this.publicationCacheGeneration,
        fingerprint,
        summary: frozenSummary,
      };
    }
    return frozenSummary;
  }

  public getSourceDocumentSummary(sourceId: string): SourceDocumentSummary {
    return getSourceDocumentSummary(sourceId);
  }

  public getPublicGradeBands(): readonly string[] {
    return PUBLIC_GRADE_BANDS;
  }

  // CMS Content Management Update Simulation. Public reads still pass through
  // the policy after an update; a UI action cannot bypass source containment.
  public updateLessonReviewStatus(
    lessonId: string,
    newStatus: ReviewStatus,
    isPublished: boolean = false
  ): boolean {
    const lesson = this.lessons.find((candidate) => isRecord(candidate) && candidate.id === lessonId);
    if (!isRecord(lesson) || typeof isPublished !== "boolean") return false;

    if ((newStatus === "Published") !== isPublished) return false;
    const requestsPublication = newStatus === "Published" || isPublished;
    const rawMetadata = readRawReviewMetadata(lesson);
    if (requestsPublication && !hasKnownReviewEvidence(rawMetadata)) return false;
    if (requestsPublication) {
      const publication = getRecordPublicationDecision(lesson);
      if (!publication.isPublic || !publication.sourceEvidence.supportable) return false;
    }

    const safeCandidate = sanitizeReviewRecord(lesson);
    if (!validateContentRecord(safeCandidate, "lesson").isValid || !isRecord(safeCandidate)) return false;
    const nextMetadata: ReviewMetadata = isReviewMetadata(rawMetadata)
      ? { ...(rawMetadata as unknown as ReviewMetadata) }
      : createUnverifiedReviewMetadata();
    nextMetadata.status = newStatus;
    nextMetadata.lastVerifiedDate = new Date().toISOString().split("T")[0];
    if (!isReviewMetadata(nextMetadata)) return false;
    lesson.reviewMetadata = nextMetadata;
    lesson.published = isPublished;
    this.invalidatePublicationCache();
    return true;
  }

  public updateLessonStatus(
    lessonId: string,
    newStatus: ReviewStatus,
    reviewer: string,
    notes: string
  ): boolean {
    const lesson = this.lessons.find((candidate) => isRecord(candidate) && candidate.id === lessonId);
    if (!isRecord(lesson)) return false;

    const rawMetadata = readRawReviewMetadata(lesson);
    if (newStatus === "Published") {
      if (!hasKnownReviewEvidence(rawMetadata)) return false;
      if (typeof reviewer !== "string" || typeof notes !== "string" ||
        !reviewer.trim() || !notes.trim() ||
        [UNKNOWN_PROVENANCE, "Unknown / Unverified", "unknown"].includes(reviewer.trim())) return false;
      const publication = getRecordPublicationDecision(lesson);
      if (!publication.isPublic || !publication.sourceEvidence.supportable) return false;
    }

    const safeCandidate = sanitizeReviewRecord(lesson);
    if (!validateContentRecord(safeCandidate, "lesson").isValid || !isRecord(safeCandidate)) return false;
    const nextMetadata: ReviewMetadata = isReviewMetadata(rawMetadata)
      ? { ...(rawMetadata as unknown as ReviewMetadata) }
      : createUnverifiedReviewMetadata();
    nextMetadata.status = newStatus;
    nextMetadata.reviewer = reviewer;
    nextMetadata.lastVerifiedDate = new Date().toISOString().split("T")[0];
    nextMetadata.changeNotes = notes;
    if (!isReviewMetadata(nextMetadata)) return false;
    lesson.reviewMetadata = nextMetadata;
    lesson.published = newStatus === "Published";
    this.invalidatePublicationCache();
    return true;
  }
}

export const repository = new ContentRepository();

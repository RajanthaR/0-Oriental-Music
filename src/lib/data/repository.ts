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
  evaluatePublicationBatch,
  createPublicationEvaluationContext,
  getPublicationCatalogRawCount,
  getSourceDocumentSummary,
  UNKNOWN_PROVENANCE,
  PUBLIC_GRADE_BANDS,
  sanitizePublicRecord,
  sanitizeReviewRecord,
  createUnverifiedReviewMetadata,
  type PublicationEvaluationContext,
  type PublicationCatalogInputs,
  type PublicationDecision,
  type PublicationReasonCode,
  type SourceDocumentSummary,
} from "@/lib/data/publication-policy";
import {
  isRecord,
  isReviewMetadata,
  cloneBoundedRecord,
  readOwnDataField,
  projectPublicRecord,
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
    const rawId = readOwnDataField(item, "id");
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
  return readOwnDataField(lesson, "reviewMetadata");
}

function normalizeRecordId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function findUniqueRecordIndex(items: readonly unknown[], id: string): number {
  const normalizedId = normalizeRecordId(id);
  if (!normalizedId) return -1;
  let match = -1;
  for (let index = 0; index < items.length; index += 1) {
    const candidate = items[index];
    if (!isRecord(candidate) || normalizeRecordId(readOwnDataField(candidate, "id")) !== normalizedId) continue;
    if (match !== -1) return -1;
    match = index;
  }
  return match;
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
  failureReasons: readonly string[];
}

export type CmsMutationReasonCode =
  | "updated"
  | "record-not-found"
  | "invalid-request"
  | "status-publication-mismatch"
  | "missing-review-evidence"
  | "publication-ineligible"
  | "malformed-review-metadata"
  | PublicationReasonCode;

export interface CmsMutationResult {
  ok: boolean;
  reasonCode: CmsMutationReasonCode;
  decision?: PublicationDecision;
}

function cmsFailure(reasonCode: CmsMutationReasonCode, decision?: PublicationDecision): CmsMutationResult {
  return { ok: false, reasonCode, ...(decision ? { decision } : {}) };
}

function cmsSuccess(): CmsMutationResult {
  return { ok: true, reasonCode: "updated" };
}

export interface PublicSearchCatalogs {
  lessons: Lesson[];
  ragas: Raga[];
  talas: Tala[];
  instruments: Instrument[];
  glossary: GlossaryTerm[];
  culturalTraditions: CulturalTradition[];
}

export type LessonVisibility = "public" | "review";
type PublicationCatalogKey = keyof PublicationEvaluationContext["catalogs"];

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

  private createEvaluationContext(overrides: PublicationCatalogInputs = {}): PublicationEvaluationContext {
    return createPublicationEvaluationContext({
      sources: this.sources,
      lessons: this.lessons,
      ragas: this.ragas,
      talas: this.talas,
      instruments: this.instruments,
      culturalTraditions: this.culturalTraditions,
      theatreTraditions: this.theatreTraditions,
      glossary: this.glossary,
      learningPaths: this.learningPaths,
      quizzes: this.quizzes,
      examPapers: this.examPapers,
      ...overrides,
    });
  }

  private freezePublicationSummary(
    summary: Record<string, PublicationCollectionSummary>,
  ): Record<string, PublicationCollectionSummary> {
    for (const value of Object.values(summary)) Object.freeze(value);
    return Object.freeze(summary);
  }

  private selectPublic<T>(
    catalog: PublicationCatalogKey,
    context = this.createEvaluationContext(),
  ): T[] {
    const items = context.catalogs[catalog];
    if (!context.safe) return [];
    if (!hasUniqueRecordIds(items)) return [];
    const batch = evaluatePublicationBatch(items, context);
    if (!batch.isValid || batch.decisions.length !== items.length) return [];
    const decisions = batch.decisions;
    return items.flatMap((item, index) => {
      const decision = decisions[index];
      return decision.isPublic && decision.publicProjection
        ? [decision.publicProjection as T]
        : [];
    });
  }

  private selectForReview<T>(
    catalog: PublicationCatalogKey,
    kind: ContentEntityKind,
    context = this.createEvaluationContext(),
  ): T[] {
    if (!context.safe) return [];
    const items = context.catalogs[catalog];
    if (!hasUniqueRecordIds(items)) return [];
    return items.flatMap((item) => {
      const projection = sanitizeReviewRecord(item, context);
      return validateContentRecord(projection, kind).isValid ? [projection as T] : [];
    });
  }

  private summarize(
    catalog: PublicationCatalogKey,
    context: PublicationEvaluationContext,
  ): PublicationCollectionSummary {
    const items = context.catalogs[catalog];
    const raw = getPublicationCatalogRawCount(context, catalog);
    if (!context.safe) {
      return { raw, public: 0, quarantined: 0, needsReview: raw, failureReasons: ["unsafe-container"] };
    }
    if (!hasUniqueRecordIds(items)) {
      return { raw, public: 0, quarantined: 0, needsReview: raw, failureReasons: ["duplicate-record-id"] };
    }
    const batch = evaluatePublicationBatch(items, context);
    if (!batch.isValid || batch.decisions.length !== items.length) {
      return {
        raw,
        public: 0,
        quarantined: 0,
        needsReview: raw,
        failureReasons: [batch.failureReason ?? "incomplete-decision-batch"],
      };
    }
    const decisions = batch.decisions;
    return {
      raw,
      public: decisions.filter((decision) => decision.state === "public").length,
      quarantined: decisions.filter((decision) => decision.state === "quarantined").length,
      needsReview: decisions.filter((decision) => decision.state === "needs-review").length,
      failureReasons: [],
    };
  }

  // Sources: public transparency metadata is deliberately sanitized. The raw
  // publisher/year/location/license values are not provenance evidence.
  public getSources(): SourceCatalogView[] {
    const context = this.createEvaluationContext();
    if (!context.safe || !hasUniqueRecordIds(context.catalogs.sources)) return [];
    return context.catalogs.sources.flatMap((candidate) => {
      if (!validateContentRecord(candidate, "source").isValid || !isRecord(candidate)) return [];
      const projected = projectPublicRecord(candidate, "source");
      if (!isRecord(projected)) return [];
      const source = projected as unknown as {
        id: string;
        title: string;
        originalFilename: string;
        grades: string[];
        language: string;
        url?: string;
        publisher: string;
        year: string;
        tier: string;
        location: string;
        status: string;
        license: string;
      };
      const document = getSourceDocumentSummary(source.id, context);
      return [{
        id: source.id,
        title: source.title,
        originalFilename: source.originalFilename,
        publisher: source.publisher,
        grades: [...source.grades],
        year: source.year,
        language: source.language,
        tier: source.tier,
        location: source.location,
        status: source.status,
        license: source.license,
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
    let gradeBand: GradeBandType | undefined;
    let strandId: string | undefined;
    let visibility: LessonVisibility | undefined;
    let query: unknown;
    try {
      if (filters !== undefined && (!filters || typeof filters !== "object")) return [];
      gradeBand = filters?.gradeBand;
      strandId = filters?.strandId;
      visibility = filters?.visibility;
      query = filters?.query;
    } catch {
      return [];
    }
    const context = this.createEvaluationContext();
    let list = visibility === "review"
      ? this.selectForReview<Lesson>("lessons", "lesson", context)
      : this.selectPublic<Lesson>("lessons", context);
    if (gradeBand) {
      list = list.filter((lesson) => lesson.gradeBands.includes(gradeBand));
    }
    if (strandId) {
      list = list.filter((lesson) => lesson.strandId === strandId);
    }
    return searchFilter(list, query, (lesson) => [
      lesson.title_si,
      lesson.title_en || "",
      lesson.summary_si,
      lesson.learningGoal_si,
    ]);
  }

  public getLessonById(id: string): Lesson | undefined {
    return this.getLessons().find((lesson) => lesson.id === id || lesson.slug === id);
  }

  // Ragas
  public getRagas(query?: string): Raga[] {
    return searchFilter(this.selectPublic<Raga>("ragas"), query, (raga) => [
      raga.name_si,
      raga.name_en,
      raga.thata_si,
      raga.vadi_si,
      raga.samvadi_si,
      raga.time_si,
    ]);
  }

  public getRagaById(id: string): Raga | undefined {
    return this.getRagas().find((raga) => raga.id === id);
  }

  // Talas
  public getTalas(query?: string): Tala[] {
    return searchFilter(this.selectPublic<Tala>("talas"), query, (tala) => [
      tala.name_si,
      tala.name_en,
      ...tala.aliases_si,
      tala.theka_si,
    ]);
  }

  public getTalaById(id: string): Tala | undefined {
    return this.getTalas().find((tala) => tala.id === id);
  }

  // Instruments
  public getInstruments(query?: string): Instrument[] {
    return searchFilter(this.selectPublic<Instrument>("instruments"), query, (instrument) => [
      instrument.name_si,
      instrument.name_en,
      instrument.category_si,
      instrument.origin_si,
      instrument.construction_si,
    ]);
  }

  public getInstrumentById(id: string): Instrument | undefined {
    return this.getInstruments().find((instrument) => instrument.id === id);
  }

  // Traditions
  public getCulturalTraditions(query?: string): CulturalTradition[] {
    return searchFilter(this.selectPublic<CulturalTradition>("culturalTraditions"), query, (tradition) => [
      tradition.title_si,
      tradition.title_en,
      tradition.category_si,
      tradition.description_si,
    ]);
  }

  public getCulturalTraditionById(id: string): CulturalTradition | undefined {
    return this.getCulturalTraditions().find((tradition) => tradition.id === id);
  }

  public getTheatreTraditions(query?: string): TheatreTradition[] {
    return searchFilter(this.selectPublic<TheatreTradition>("theatreTraditions"), query, (tradition) => [
      tradition.title_si,
      tradition.title_en,
      tradition.type_si,
      tradition.historicalBackground_si,
    ]);
  }

  public getTheatreTraditionById(id: string): TheatreTradition | undefined {
    return this.getTheatreTraditions().find((tradition) => tradition.id === id);
  }

  // Glossary
  public getGlossary(query?: string, category?: string): GlossaryTerm[] {
    let list = this.selectPublic<GlossaryTerm>("glossary");
    if (category) {
      list = list.filter((term) => term.category_si === category);
    }
    return searchFilter(list, query, (term) => [
      term.term_si,
      term.term_en,
      term.transliteration,
      term.definition_si,
      term.category_si,
    ]);
  }

  // Learning-path dependency closure is enforced by the central publication
  // decision, so every public surface consumes the same result.
  public getLearningPaths(gradeBand?: GradeBandType): LearningPath[] {
    let list = this.selectPublic<LearningPath>("learningPaths");
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
    return this.selectPublic<Quiz>("quizzes");
  }

  public getQuizById(id: string): Quiz | undefined {
    return this.getQuizzes().find((quiz) => quiz.id === id);
  }

  public getExamPapers(gradeBand?: GradeBandType): ExamPaper[] {
    let list = this.selectPublic<ExamPaper>("examPapers");
    if (gradeBand) {
      list = list.filter((paper) => paper.gradeBand === gradeBand);
    }
    return list;
  }

  public getExamPaperById(id: string): ExamPaper | undefined {
    return this.getExamPapers().find((paper) => paper.id === id);
  }

  public getPublicationSummary(): Record<string, PublicationCollectionSummary> {
    const context = this.createEvaluationContext();
    const learningPaths = this.summarize("learningPaths", context);
    const summary = {
      lessons: this.summarize("lessons", context),
      ragas: this.summarize("ragas", context),
      talas: this.summarize("talas", context),
      instruments: this.summarize("instruments", context),
      culturalTraditions: this.summarize("culturalTraditions", context),
      theatreTraditions: this.summarize("theatreTraditions", context),
      glossary: this.summarize("glossary", context),
      learningPaths,
      quizzes: this.summarize("quizzes", context),
      exams: this.summarize("examPapers", context),
    };
    return this.freezePublicationSummary(summary);
  }

  public getSourceDocumentSummary(sourceId: string): SourceDocumentSummary {
    return getSourceDocumentSummary(sourceId, this.createEvaluationContext());
  }

  /** One immutable evidence/catalog capture for a complete public search. */
  public getPublicSearchCatalogs(): PublicSearchCatalogs {
    const context = this.createEvaluationContext();
    return {
      lessons: this.selectPublic<Lesson>("lessons", context),
      ragas: this.selectPublic<Raga>("ragas", context),
      talas: this.selectPublic<Tala>("talas", context),
      instruments: this.selectPublic<Instrument>("instruments", context),
      glossary: this.selectPublic<GlossaryTerm>("glossary", context),
      culturalTraditions: this.selectPublic<CulturalTradition>("culturalTraditions", context),
    };
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
  ): CmsMutationResult {
    try {
      const context = this.createEvaluationContext();
      if (!context.safe) return cmsFailure("unsafe-container");
      if (!hasUniqueRecordIds(context.catalogs.lessons)) return cmsFailure("duplicate-record-id");
      const snapshotIndex = findUniqueRecordIndex(context.catalogs.lessons, lessonId);
      const lesson = snapshotIndex >= 0 && isRecord(context.catalogs.lessons[snapshotIndex])
        ? context.catalogs.lessons[snapshotIndex]
        : undefined;
      if (!lesson || snapshotIndex < 0) return cmsFailure("record-not-found");
      if (typeof isPublished !== "boolean") return cmsFailure("invalid-request");

      if ((newStatus === "Published") !== isPublished) return cmsFailure("status-publication-mismatch");
      const requestsPublication = newStatus === "Published" || isPublished;
      const rawMetadata = readRawReviewMetadata(lesson);
      if (requestsPublication && !hasKnownReviewEvidence(rawMetadata)) return cmsFailure("missing-review-evidence");
      if (requestsPublication) {
        const publication = getRecordPublicationDecision(lesson, context);
        if (!publication.isPublic || !publication.sourceEvidence.supportable) {
          return cmsFailure(publication.reasonCodes[0] ?? "publication-ineligible", publication);
        }
      }

      const safeCandidate = sanitizeReviewRecord(lesson, context);
      if (!safeCandidate || !validateContentRecord(safeCandidate, "lesson").isValid || !isRecord(safeCandidate)) {
        return cmsFailure("malformed-record");
      }
      const metadataSnapshot = cloneBoundedRecord(rawMetadata);
      const nextMetadata: ReviewMetadata = isReviewMetadata(metadataSnapshot)
        ? metadataSnapshot as unknown as ReviewMetadata
        : createUnverifiedReviewMetadata();
      nextMetadata.status = newStatus;
      if (!requestsPublication) nextMetadata.lastVerifiedDate = new Date().toISOString().split("T")[0];
      if (!isReviewMetadata(nextMetadata)) return cmsFailure("malformed-review-metadata");
      const replacement = cloneBoundedRecord(lesson);
      if (!isRecord(replacement)) return cmsFailure("malformed-record");
      replacement.reviewMetadata = nextMetadata;
      replacement.published = isPublished;
      if (!validateContentRecord(replacement, "lesson").isValid) return cmsFailure("malformed-record");
      const nextLessons = cloneBoundedRecord(context.catalogs.lessons);
      if (!Array.isArray(nextLessons)) return cmsFailure("unsafe-container");
      nextLessons[snapshotIndex] = replacement;
      this.lessons = nextLessons;
      return cmsSuccess();
    } catch {
      return cmsFailure("evaluation-failed");
    }
  }

  public updateLessonStatus(
    lessonId: string,
    newStatus: ReviewStatus,
    reviewer: string,
    notes: string
  ): CmsMutationResult {
    try {
      const context = this.createEvaluationContext();
      if (!context.safe) return cmsFailure("unsafe-container");
      if (!hasUniqueRecordIds(context.catalogs.lessons)) return cmsFailure("duplicate-record-id");
      const snapshotIndex = findUniqueRecordIndex(context.catalogs.lessons, lessonId);
      const lesson = snapshotIndex >= 0 && isRecord(context.catalogs.lessons[snapshotIndex])
        ? context.catalogs.lessons[snapshotIndex]
        : undefined;
      if (!lesson || snapshotIndex < 0) return cmsFailure("record-not-found");

      const rawMetadata = readRawReviewMetadata(lesson);
      if (newStatus === "Published") {
        if (!hasKnownReviewEvidence(rawMetadata) || !isRecord(rawMetadata)) return cmsFailure("missing-review-evidence");
        if (typeof reviewer !== "string" || typeof notes !== "string" ||
          !reviewer.trim() || !notes.trim() ||
          [UNKNOWN_PROVENANCE, "Unknown / Unverified", "unknown"].includes(reviewer.trim())) return cmsFailure("invalid-request");
        if (reviewer.trim() !== String(readOwnDataField(rawMetadata, "reviewer")).trim() ||
          notes.trim() !== String(readOwnDataField(rawMetadata, "changeNotes")).trim()) return cmsFailure("missing-review-evidence");
        const publication = getRecordPublicationDecision(lesson, context);
        if (!publication.isPublic || !publication.sourceEvidence.supportable) {
          return cmsFailure(publication.reasonCodes[0] ?? "publication-ineligible", publication);
        }
      }

      const safeCandidate = sanitizeReviewRecord(lesson, context);
      if (!safeCandidate || !validateContentRecord(safeCandidate, "lesson").isValid || !isRecord(safeCandidate)) {
        return cmsFailure("malformed-record");
      }
      const metadataSnapshot = cloneBoundedRecord(rawMetadata);
      const nextMetadata: ReviewMetadata = isReviewMetadata(metadataSnapshot)
        ? metadataSnapshot as unknown as ReviewMetadata
        : createUnverifiedReviewMetadata();
      nextMetadata.status = newStatus;
      if (newStatus !== "Published") {
        nextMetadata.reviewer = reviewer;
        nextMetadata.lastVerifiedDate = new Date().toISOString().split("T")[0];
        nextMetadata.changeNotes = notes;
      }
      if (!isReviewMetadata(nextMetadata)) return cmsFailure("malformed-review-metadata");
      const replacement = cloneBoundedRecord(lesson);
      if (!isRecord(replacement)) return cmsFailure("malformed-record");
      replacement.reviewMetadata = nextMetadata;
      replacement.published = newStatus === "Published";
      if (!validateContentRecord(replacement, "lesson").isValid) return cmsFailure("malformed-record");
      const nextLessons = cloneBoundedRecord(context.catalogs.lessons);
      if (!Array.isArray(nextLessons)) return cmsFailure("unsafe-container");
      nextLessons[snapshotIndex] = replacement;
      this.lessons = nextLessons;
      return cmsSuccess();
    } catch {
      return cmsFailure("evaluation-failed");
    }
  }
}

export const repository = new ContentRepository();

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
  getSourceDocumentSummary,
  UNKNOWN_PROVENANCE,
  PUBLIC_GRADE_BANDS,
  sanitizePublicRecord,
  sanitizeReviewRecord,
  createUnverifiedReviewMetadata,
  type PublicationEvaluationContext,
  type SourceDocumentSummary,
} from "@/lib/data/publication-policy";
import {
  isRecord,
  isReviewMetadata,
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
  try {
    return lesson.reviewMetadata;
  } catch {
    return undefined;
  }
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

  private freezePublicationSummary(
    summary: Record<string, PublicationCollectionSummary>,
  ): Record<string, PublicationCollectionSummary> {
    for (const value of Object.values(summary)) Object.freeze(value);
    return Object.freeze(summary);
  }

  private selectPublic<T>(
    catalog: PublicationCatalogKey,
    context = createPublicationEvaluationContext(),
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
    context = createPublicationEvaluationContext(),
  ): T[] {
    if (!context.safe) return [];
    const items = context.catalogs[catalog];
    return items.flatMap((item) => {
      const projection = sanitizeReviewRecord(item, context);
      return validateContentRecord(projection, kind).isValid ? [projection as T] : [];
    });
  }

  private summarize(
    items: readonly unknown[],
    context: PublicationEvaluationContext,
  ): PublicationCollectionSummary {
    if (!hasUniqueRecordIds(items)) {
      return { raw: items.length, public: 0, quarantined: 0, needsReview: items.length };
    }
    const batch = evaluatePublicationBatch(items, context);
    if (!batch.isValid || batch.decisions.length !== items.length) {
      return { raw: items.length, public: 0, quarantined: 0, needsReview: items.length };
    }
    const decisions = batch.decisions;
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
    const context = createPublicationEvaluationContext();
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
    const context = createPublicationEvaluationContext();
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
    const context = createPublicationEvaluationContext();
    const { catalogs } = context;
    const learningPaths = this.summarize(catalogs.learningPaths, context);
    const summary = {
      lessons: this.summarize(catalogs.lessons, context),
      ragas: this.summarize(catalogs.ragas, context),
      talas: this.summarize(catalogs.talas, context),
      instruments: this.summarize(catalogs.instruments, context),
      culturalTraditions: this.summarize(catalogs.culturalTraditions, context),
      theatreTraditions: this.summarize(catalogs.theatreTraditions, context),
      glossary: this.summarize(catalogs.glossary, context),
      learningPaths,
      quizzes: this.summarize(catalogs.quizzes, context),
      exams: this.summarize(catalogs.examPapers, context),
    };
    return this.freezePublicationSummary(summary);
  }

  public getSourceDocumentSummary(sourceId: string): SourceDocumentSummary {
    return getSourceDocumentSummary(sourceId);
  }

  /** One immutable evidence/catalog capture for a complete public search. */
  public getPublicSearchCatalogs(): PublicSearchCatalogs {
    const context = createPublicationEvaluationContext();
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
    return true;
  }
}

export const repository = new ContentRepository();

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
  ContentReviewStatus,
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
  validateContentRecord,
  type ContentEntityKind,
} from "@/lib/validation/content-contracts";

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

  private selectPublic<T>(items: readonly unknown[]): T[] {
    return items.flatMap((item) => {
      const decision = getRecordPublicationDecision(item);
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
    const decisions = items.map((item) => getRecordPublicationDecision(item));
    return {
      raw: items.length,
      public: decisions.filter((decision) => decision.state === "public").length,
      quarantined: decisions.filter((decision) => decision.state === "quarantined").length,
      needsReview: decisions.filter((decision) => decision.state === "needs-review").length,
    };
  }

  private summarizeQuizzes(): PublicationCollectionSummary {
    return this.summarize(this.quizzes);
  }

  // Sources: public transparency metadata is deliberately sanitized. The raw
  // publisher/year/location/license values are not provenance evidence.
  public getSources(): SourceCatalogView[] {
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
    return {
      lessons: this.summarize(this.lessons),
      ragas: this.summarize(this.ragas),
      talas: this.summarize(this.talas),
      instruments: this.summarize(this.instruments),
      culturalTraditions: this.summarize(this.culturalTraditions),
      theatreTraditions: this.summarize(this.theatreTraditions),
      glossary: this.summarize(this.glossary),
      learningPaths: {
        ...this.summarize(this.learningPaths),
        public: this.getLearningPaths().length,
      },
      quizzes: this.summarizeQuizzes(),
      exams: this.summarize(this.examPapers),
    };
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

    const safeCandidate = sanitizeReviewRecord(lesson);
    if (!validateContentRecord(safeCandidate, "lesson").isValid || !isRecord(safeCandidate)) return false;
    const nextMetadata: ReviewMetadata = isReviewMetadata(safeCandidate.reviewMetadata)
      ? { ...(safeCandidate.reviewMetadata as unknown as ReviewMetadata) }
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

    const safeCandidate = sanitizeReviewRecord(lesson);
    if (!validateContentRecord(safeCandidate, "lesson").isValid || !isRecord(safeCandidate)) return false;
    const nextMetadata: ReviewMetadata = isReviewMetadata(safeCandidate.reviewMetadata)
      ? { ...(safeCandidate.reviewMetadata as unknown as ReviewMetadata) }
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

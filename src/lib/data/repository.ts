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
  ContentReviewStatus,
} from "@/types/content";

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
  getQuizPublicationDecision,
  getSourceDocumentSummary,
  UNKNOWN_PROVENANCE,
  PUBLIC_GRADE_BANDS,
  sanitizePublicRecord,
  sanitizeReviewRecord,
  type SourceDocumentSummary,
} from "@/lib/data/publication-policy";

export interface StrandInfo {
  id: string;
  name_si: string;
  name_en: string;
  description_si: string;
  iconName: string;
  gradeBands: GradeBandType[];
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

export const CURRICULUM_STRANDS: StrandInfo[] = [
  {
    id: "strand-fundamentals",
    name_si: "මූලික සංගීත දැනුම",
    name_en: "Music Fundamentals",
    description_si: "නාදය, ශබ්දයේ ලක්ෂණ සහ සංගීත මූලධර්ම",
    iconName: "Volume2",
    gradeBands: ["6-7", "8-9"],
  },
  {
    id: "strand-swara-shruti",
    name_si: "ස්වර හා ශ්‍රැති",
    name_en: "Swara and Shruti",
    description_si: "සප්ත ස්වර, ශුද්ධ/කෝමල/තීව්‍ර ස්වර, සප්තක සහ ශ්‍රැති වාදය",
    iconName: "Music",
    gradeBands: ["6-7", "8-9", "10-11"],
  },
  {
    id: "strand-laya-tala",
    name_si: "ලය හා තාල",
    name_en: "Laya and Tala",
    description_si: "මාත්‍රා, විභාග, තාළි, ඛාලි සහ උත්තර භාරතීය තාල",
    iconName: "Activity",
    gradeBands: ["6-7", "8-9", "10-11"],
  },
  {
    id: "strand-ragas",
    name_si: "රාග ලෝකය",
    name_en: "World of Ragas",
    description_si: "ථාට 10, රාග ලක්ෂණ, ආරෝහණ/අවරෝහණ සහ පකඩ්",
    iconName: "Compass",
    gradeBands: ["8-9", "10-11"],
  },
  {
    id: "strand-vocal-instrumental",
    name_si: "ගායන හා වාදන පුහුණුව",
    name_en: "Vocal and Instrumental Practice",
    description_si: "හඬ පුහුණුව, ආසන, තාන්පුර ශ්‍රැතිය හා අලංකාර",
    iconName: "Mic",
    gradeBands: ["6-7", "8-9", "10-11"],
  },
  {
    id: "strand-instruments",
    name_si: "වාද්‍ය භාණ්ඩ",
    name_en: "Musical Instruments",
    description_si: "චතුර්විධ වර්ගීකරණය, සිතාරය, තබ්ලාව සහ දේශීය බෙර",
    iconName: "Radio",
    gradeBands: ["6-7", "8-9", "10-11"],
  },
  {
    id: "strand-folk-music",
    name_si: "ජන හා දේශීය සංගීතය",
    name_en: "Folk and Indigenous Music",
    description_si: "ගොයම්, කරත්ත, පාරු කවි, රබන් පද සහ ශාන්තිකර්ම",
    iconName: "Feather",
    gradeBands: ["6-7", "8-9", "10-11"],
  },
  {
    id: "strand-theatre-music",
    name_si: "නාට්‍ය හා රංග සංගීතය",
    name_en: "Theatre and Dramatic Music",
    description_si: "නාඩගම්, නූර්ති, සොකරි සහ කෝලම් සංගීත සම්ප්‍රදාය",
    iconName: "Drama",
    gradeBands: ["8-9", "10-11"],
  },
  {
    id: "strand-appreciation",
    name_si: "ගී රසවිඳීම හා ඉතිහාසය",
    name_en: "Music Appreciation and History",
    description_si: "ගීත විචාරය, සංගීතමය අංග සහ පුරෝගාමීන්",
    iconName: "Sparkles",
    gradeBands: ["10-11"],
  },
  {
    id: "strand-creativity-tech",
    name_si: "නිර්මාණ හා සංගීත තාක්ෂණය",
    name_en: "Creativity and Music Tech",
    description_si: "තනු හා රිද්ම නිර්මාණ, ප්‍රස්තාරගත කිරීම සහ ඩිජිටල් මෙවලම්",
    iconName: "Wand2",
    gradeBands: ["8-9", "10-11"],
  },
  {
    id: "strand-exam-practice",
    name_si: "ප්‍රශ්න හා විභාග පුහුණුව",
    name_en: "Exam Practice",
    description_si: "10–11 ශ්‍රේණි විභාග අභ්‍යාස සහ මූලාශ්‍ර සමාලෝචන සටහන්",
    iconName: "Award",
    gradeBands: ["10-11"],
  },
];

class ContentRepository {
  private sources = sourcesData;
  private lessons: Lesson[] = lessonsData as Lesson[];
  private ragas: Raga[] = ragasData as Raga[];
  private talas: Tala[] = talasData as Tala[];
  private instruments: Instrument[] = instrumentsData as Instrument[];
  private culturalTraditions: CulturalTradition[] = culturalTraditionsData as unknown as CulturalTradition[];
  private theatreTraditions: TheatreTradition[] = theatreTraditionsData as TheatreTradition[];
  private glossary: GlossaryTerm[] = glossaryData as GlossaryTerm[];
  private learningPaths: LearningPath[] = learningPathsData as LearningPath[];
  private quizzes: Quiz[] = quizzesData as Quiz[];
  private examPapers: ExamPaper[] = examPapersData as ExamPaper[];

  private selectPublic<T extends { id: string }>(items: T[]): T[] {
    return items.flatMap((item) => {
      const decision = getRecordPublicationDecision(item);
      return decision.isPublic && decision.publicProjection
        ? [decision.publicProjection as T]
        : [];
    });
  }

  private selectForReview<T extends { id: string }>(items: T[]): T[] {
    return items.map((item) => sanitizeReviewRecord(item));
  }

  private summarize<T extends { id: string }>(items: T[]): PublicationCollectionSummary {
    const decisions = items.map((item) => getRecordPublicationDecision(item));
    return {
      raw: items.length,
      public: decisions.filter((decision) => decision.state === "public").length,
      quarantined: decisions.filter((decision) => decision.state === "quarantined").length,
      needsReview: decisions.filter((decision) => decision.state === "needs-review").length,
    };
  }

  private summarizeQuizzes(): PublicationCollectionSummary {
    const decisions = this.quizzes.map((quiz) => getQuizPublicationDecision(quiz));
    return {
      raw: this.quizzes.length,
      public: decisions.filter((decision) => decision.state === "public").length,
      quarantined: decisions.filter((decision) => decision.state === "quarantined").length,
      needsReview: decisions.filter((decision) => decision.state === "needs-review").length,
    };
  }

  // Sources: public transparency metadata is deliberately sanitized. The raw
  // publisher/year/location/license values are not provenance evidence.
  public getSources(): SourceCatalogView[] {
    return this.sources.map((source) => {
      const document = getSourceDocumentSummary(source.id);
      return {
        id: source.id,
        title: source.title,
        originalFilename: source.originalFilename,
        publisher: UNKNOWN_PROVENANCE,
        grades: source.grades,
        year: UNKNOWN_PROVENANCE,
        language: source.language,
        tier: "මූලාශ්‍ර වාර්තාව (සනාථ නොකළ)",
        location: UNKNOWN_PROVENANCE,
        status: "Unverified / source review pending",
        license: UNKNOWN_PROVENANCE,
        url: source.url,
        evidenceState: document.reviewStatus,
        evidenceQuality: document.evidenceQuality,
      };
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
      ? this.selectForReview(this.lessons)
      : this.selectPublic(this.lessons);
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
    let list = this.selectPublic(this.ragas);
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
    let list = this.selectPublic(this.talas);
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
    let list = this.selectPublic(this.instruments);
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
    let list = this.selectPublic(this.culturalTraditions);
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
    let list = this.selectPublic(this.theatreTraditions);
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
    let list = this.selectPublic(this.glossary);
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
    let list = this.selectPublic(this.learningPaths);
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
    return this.quizzes.flatMap((quiz) => {
      const decision = getQuizPublicationDecision(quiz);
      return decision.isPublic && decision.publicProjection
        ? [decision.publicProjection as Quiz]
        : [];
    });
  }

  public getQuizById(id: string): Quiz | undefined {
    return this.getQuizzes().find((quiz) => quiz.id === id);
  }

  public getExamPapers(gradeBand?: GradeBandType): ExamPaper[] {
    let list = this.selectPublic(this.examPapers);
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
    const lesson = this.lessons.find((candidate) => candidate.id === lessonId);
    if (!lesson) return false;

    lesson.reviewMetadata.status = newStatus;
    lesson.published = isPublished;
    lesson.reviewMetadata.lastVerifiedDate = new Date().toISOString().split("T")[0];
    return true;
  }

  public updateLessonStatus(
    lessonId: string,
    newStatus: ReviewStatus,
    reviewer: string,
    notes: string
  ): boolean {
    const lesson = this.lessons.find((candidate) => candidate.id === lessonId);
    if (!lesson) return false;

    lesson.reviewMetadata.status = newStatus;
    lesson.reviewMetadata.reviewer = reviewer;
    lesson.reviewMetadata.lastVerifiedDate = new Date().toISOString().split("T")[0];
    lesson.reviewMetadata.changeNotes = notes;
    lesson.published = newStatus === "Published";
    return true;
  }
}

export const repository = new ContentRepository();

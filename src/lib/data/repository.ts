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

export interface StrandInfo {
  id: string;
  name_si: string;
  name_en: string;
  description_si: string;
  iconName: string;
  gradeBands: GradeBandType[];
}

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
    gradeBands: ["6-7", "8-9", "10-11", "12-13"],
  },
  {
    id: "strand-laya-tala",
    name_si: "ලය හා තාල",
    name_en: "Laya and Tala",
    description_si: "මාත්‍රා, විභාග, තාළි, ඛාලි සහ උත්තර භාරතීය තාල",
    iconName: "Activity",
    gradeBands: ["6-7", "8-9", "10-11", "12-13"],
  },
  {
    id: "strand-ragas",
    name_si: "රාග ලෝකය",
    name_en: "World of Ragas",
    description_si: "ථාට 10, රාග ලක්ෂණ, ආරෝහණ/අවරෝහණ සහ පකඩ්",
    iconName: "Compass",
    gradeBands: ["8-9", "10-11", "12-13"],
  },
  {
    id: "strand-vocal-instrumental",
    name_si: "ගායන හා වාදන පුහුණුව",
    name_en: "Vocal and Instrumental Practice",
    description_si: "හඬ පුහුණුව, ආසන, තාන්පුර ශ්‍රැතිය හා අලංකාර",
    iconName: "Mic",
    gradeBands: ["6-7", "8-9", "10-11", "12-13"],
  },
  {
    id: "strand-instruments",
    name_si: "වාද්‍ය භාණ්ඩ",
    name_en: "Musical Instruments",
    description_si: "චතුර්විධ වර්ගීකරණය, සිතාරය, තබ්ලාව සහ දේශීය බෙර",
    iconName: "Radio",
    gradeBands: ["6-7", "8-9", "10-11", "12-13"],
  },
  {
    id: "strand-folk-music",
    name_si: "ජන හා දේශීය සංගීතය",
    name_en: "Folk and Indigenous Music",
    description_si: "ගොයම්, කරත්ත, පාරු කවි, රබන් පද සහ ශාන්තිකර්ම",
    iconName: "Feather",
    gradeBands: ["6-7", "8-9", "10-11", "12-13"],
  },
  {
    id: "strand-theatre-music",
    name_si: "නාට්‍ය හා රංග සංගීතය",
    name_en: "Theatre and Dramatic Music",
    description_si: "නාඩගම්, නූර්ති, සොකරි සහ කෝලම් සංගීත සම්ප්‍රදාය",
    iconName: "Drama",
    gradeBands: ["8-9", "10-11", "12-13"],
  },
  {
    id: "strand-appreciation",
    name_si: "ගී රසවිඳීම හා ඉතිහාසය",
    name_en: "Music Appreciation and History",
    description_si: "ගීත විචාරය, සංගීතමය අංග සහ පුරෝගාමීන්",
    iconName: "Sparkles",
    gradeBands: ["10-11", "12-13"],
  },
  {
    id: "strand-creativity-tech",
    name_si: "නිර්මාණ හා සංගීත තාක්ෂණය",
    name_en: "Creativity and Music Tech",
    description_si: "තනු හා රිද්ම නිර්මාණ, ප්‍රස්තාරගත කිරීම සහ ඩිජිටල් මෙවලම්",
    iconName: "Wand2",
    gradeBands: ["8-9", "10-11", "12-13"],
  },
  {
    id: "strand-exam-practice",
    name_si: "ප්‍රශ්න හා විභාග පුහුණුව",
    name_en: "Exam Practice",
    description_si: "සාමාන්‍ය පෙළ හා උසස් පෙළ ආදර්ශ ප්‍රශ්න පත්‍ර සහ ලකුණු මාර්ගෝපදේශ",
    iconName: "Award",
    gradeBands: ["10-11", "12-13"],
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

  // Sources
  public getSources() {
    return this.sources;
  }
  public getSourceById(id: string) {
    return this.sources.find((s) => s.id === id);
  }

  // Strands
  public getStrands() {
    return CURRICULUM_STRANDS;
  }
  public getStrandById(id: string) {
    return CURRICULUM_STRANDS.find((s) => s.id === id);
  }

  // Lessons
  public getLessons(filters?: {
    gradeBand?: GradeBandType;
    strandId?: string;
    publishedOnly?: boolean;
    query?: string;
  }): Lesson[] {
    let list = this.lessons;
    if (filters?.publishedOnly !== false) {
      list = list.filter((l) => l.published);
    }
    if (filters?.gradeBand) {
      list = list.filter((l) => l.gradeBands.includes(filters.gradeBand!));
    }
    if (filters?.strandId) {
      list = list.filter((l) => l.strandId === filters.strandId);
    }
    if (filters?.query) {
      list = searchFilter(list, filters.query, (l) => [
        l.title_si,
        l.title_en || "",
        l.summary_si,
        l.learningGoal_si,
      ]);
    }
    return list;
  }

  public getLessonById(id: string): Lesson | undefined {
    return this.lessons.find((l) => l.id === id || l.slug === id);
  }

  // Ragas
  public getRagas(query?: string): Raga[] {
    let list = this.ragas;
    if (query) {
      list = searchFilter(list, query, (r) => [
        r.name_si,
        r.name_en,
        r.thata_si,
        r.vadi_si,
        r.samvadi_si,
        r.time_si,
      ]);
    }
    return list;
  }

  public getRagaById(id: string): Raga | undefined {
    return this.ragas.find((r) => r.id === id);
  }

  // Talas
  public getTalas(query?: string): Tala[] {
    let list = this.talas;
    if (query) {
      list = searchFilter(list, query, (t) => [t.name_si, t.name_en, t.theka_si]);
    }
    return list;
  }

  public getTalaById(id: string): Tala | undefined {
    return this.talas.find((t) => t.id === id);
  }

  // Instruments
  public getInstruments(query?: string): Instrument[] {
    let list = this.instruments;
    if (query) {
      list = searchFilter(list, query, (i) => [
        i.name_si,
        i.name_en,
        i.category_si,
        i.origin_si,
        i.construction_si,
      ]);
    }
    return list;
  }

  public getInstrumentById(id: string): Instrument | undefined {
    return this.instruments.find((i) => i.id === id);
  }

  // Traditions
  public getCulturalTraditions(query?: string): CulturalTradition[] {
    let list = this.culturalTraditions;
    if (query) {
      list = searchFilter(list, query, (c) => [c.title_si, c.title_en, c.category_si, c.description_si]);
    }
    return list;
  }

  public getCulturalTraditionById(id: string): CulturalTradition | undefined {
    return this.culturalTraditions.find((c) => c.id === id);
  }

  public getTheatreTraditions(query?: string): TheatreTradition[] {
    let list = this.theatreTraditions;
    if (query) {
      list = searchFilter(list, query, (t) => [t.title_si, t.title_en, t.type_si, t.historicalBackground_si]);
    }
    return list;
  }

  public getTheatreTraditionById(id: string): TheatreTradition | undefined {
    return this.theatreTraditions.find((t) => t.id === id);
  }

  // Glossary
  public getGlossary(query?: string, category?: string): GlossaryTerm[] {
    let list = this.glossary;
    if (category) {
      list = list.filter((g) => g.category_si === category);
    }
    if (query) {
      list = searchFilter(list, query, (g) => [
        g.term_si,
        g.term_en,
        g.transliteration,
        g.definition_si,
        g.category_si,
      ]);
    }
    return list;
  }

  // Learning Paths
  public getLearningPaths(gradeBand?: GradeBandType): LearningPath[] {
    let list = this.learningPaths;
    if (gradeBand) {
      list = list.filter((p) => p.gradeBands.includes(gradeBand));
    }
    return list;
  }

  public getLearningPathById(id: string): LearningPath | undefined {
    return this.learningPaths.find((p) => p.id === id);
  }

  // Quizzes & Exams
  public getQuizzes(): Quiz[] {
    return this.quizzes;
  }

  public getQuizById(id: string): Quiz | undefined {
    return this.quizzes.find((q) => q.id === id);
  }

  public getExamPapers(gradeBand?: GradeBandType): ExamPaper[] {
    let list = this.examPapers;
    if (gradeBand) {
      list = list.filter((e) => e.gradeBand === gradeBand);
    }
    return list;
  }

  public getExamPaperById(id: string): ExamPaper | undefined {
    return this.examPapers.find((e) => e.id === id);
  }

  // CMS Content Management Update Simulation
  public updateLessonReviewStatus(
    lessonId: string,
    newStatus: ContentReviewStatus,
    isPublished: boolean = false
  ): boolean {
    const lesson = this.lessons.find((l) => l.id === lessonId);
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
    const lesson = this.lessons.find((l) => l.id === lessonId);
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

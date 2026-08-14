export type GradeBandType = "6-7" | "8-9" | "10-11" | "12-13";

export type DifficultyLevel = "පහසු" | "මධ්‍යම" | "උසස්";

export type ContentReviewStatus =
  | "Draft"
  | "SME Review"
  | "Language Review"
  | "Pedagogical Review"
  | "Audio Verification"
  | "Accessibility & Mobile QA"
  | "Rights & Source Verification"
  | "Published";

export type ReviewStatus = ContentReviewStatus | "Source Checked" | "Sinhala Reviewed" | "Music Reviewed" | "Rights Checked" | "Needs Revision" | "Archived";

export interface SourceReference {
  sourceId: string;
  pageOrSection: string;
  notes?: string;
}

export interface ReviewMetadata {
  status: ReviewStatus;
  reviewer: string;
  reviewDate: string;
  lastVerifiedDate: string;
  changeNotes: string;
  license: string;
  reuseStatus: "Verified Original" | "Curriculum Canonical" | "Public Domain" | "Synthetic Web Audio";
}

export interface KeyTerm {
  term_si: string;
  meaning_si: string;
  term_en?: string;
  transliteration?: string;
}

export interface LessonSection {
  heading_si: string;
  content_si: string;
  keyTerms?: KeyTerm[];
  diagramSvg?: string;
  notationTable?: {
    rowLabel_si: string;
    notes: string[];
  }[];
}

export interface AudioActivity {
  type: "swara-demo" | "scale-play" | "raga-phrase" | "rhythm-loop" | "instrument-timbre";
  title_si: string;
  instruction_si: string;
  notes?: string[];
  rootNote?: string;
  speedBpm?: number;
  talaId?: string;
  instrumentType?: string;
  description_si?: string;
}

export interface PracticeTask {
  title_si: string;
  instruction_si: string;
  interactiveTool:
    | "swara-keyboard"
    | "tala-visualizer"
    | "rhythm-tap"
    | "pitch-detector"
    | "notation-arranger"
    | "ear-training";
  targetSequence?: string[];
  targetTalaId?: string;
  targetBpm?: number;
  targetNotes?: string[];
  puzzleData?: {
    prompt_si: string;
    shuffledItems: string[];
    correctOrder: string[];
  };
}

export interface DiagnosticQuestion {
  question_si: string;
  options_si: string[];
  correctIndex: number;
  explanation_si: string;
}

export interface Lesson {
  id: string;
  strandId: string;
  title_si: string;
  title_en?: string;
  slug: string;
  summary_si: string;
  learningGoal_si: string; // "මෙම පාඩම අවසානයේ ඔබට..."
  estimatedMinutes: number;
  gradeBands: GradeBandType[];
  difficulty: DifficultyLevel;
  prerequisites: string[];
  competencyIds: string[];
  diagnosticQuestion: DiagnosticQuestion;
  contentSections: LessonSection[];
  listenActivity: AudioActivity;
  performActivity?: AudioActivity;
  guidedPractice: PracticeTask;
  independentPractice: PracticeTask;
  quizId: string;
  recap_si: string[];
  sourceReference: SourceReference;
  reviewMetadata: ReviewMetadata;
  nextRecommendedLessonId?: string;
  published: boolean;
}

export interface Raga {
  id: string;
  name_si: string;
  name_en: string;
  thata_si: string;
  arohana_si: string;
  avarohana_si: string;
  arohana_swaras: string[];
  avarohana_swaras: string[];
  vadi_si: string;
  samvadi_si: string;
  jati_si: string;
  time_si: string;
  rasa_si: string;
  pakad_si: string;
  characteristics_si: string[];
  samplePhrases: {
    name_si: string;
    swaras: string[];
  }[];
  gradeBands: GradeBandType[];
  sourceReference: SourceReference;
  reviewMetadata: ReviewMetadata;
}

export interface TalaBol {
  matra: number;
  bol_si: string;
  vibhagIndex: number;
  isSam: boolean;
  isTali: boolean;
  isKhali: boolean;
  action_si: string; // "අත්පුඩි (Clap)", "වැනීම (Wave)"
}

export interface Tala {
  id: string;
  name_si: string;
  name_en: string;
  matras: number;
  vibhagCount: number;
  vibhagStructure: number[];
  taliKhali_si: string[];
  theka_si: string;
  bols: TalaBol[];
  layaVariants: {
    thah_bpm: number;
    dugun_bpm: number;
    chaugun_bpm: number;
  };
  gradeBands: GradeBandType[];
  sourceReference: SourceReference;
  reviewMetadata: ReviewMetadata;
}

export interface Instrument {
  id: string;
  name_si: string;
  name_en: string;
  category_si: "තත් භාණ්ඩ (Chordophone)" | "අවනද්ධ භාණ්ඩ (Membranophone)" | "සුශිර භාණ්ඩ (Aerophone)" | "ඝන භාණ්ඩ (Idiophone)";
  origin_si: "දේශීය / ශ්‍රී ලාංකීය" | "උත්තර භාරතීය" | "බටහිර / පෙරදිග ආභාසය";
  construction_si: string;
  soundProduction_si: string;
  playingPosition_si: string;
  musicalRole_si: string;
  tuningAndSwaras_si: string;
  maintenanceAndSafety_si: string;
  imageUrl?: string;
  sampleAudioPattern?: string[];
  gradeBands: GradeBandType[];
  sourceReference: SourceReference;
  reviewMetadata: ReviewMetadata;
}

export interface CulturalTradition {
  id: string;
  title_si: string;
  title_en: string;
  category_si: "ගැමි ගීත (Folk Songs)" | "ශාන්තිකර්ම (Ritual Music)" | "රබන් පද (Raban Traditions)" | "වැදි ගීත (Veddah Traditions)";
  description_si: string;
  musicalStyle_si: string;
  instrumentsUsed_si: string[] | string;
  verseExamples_si: {
    verseTitle_si: string;
    lyrics_si: string[];
    meaning_si: string;
    talaPattern_si?: string;
  }[];
  socialContext_si: string;
  gradeBands: GradeBandType[];
  sourceReference: SourceReference;
  reviewMetadata: ReviewMetadata;
}

export interface TheatreTradition {
  id: string;
  title_si: string;
  title_en: string;
  type_si: "නාඩගම් (Nadagam)" | "නූර්ති (Nurthi)" | "සොකරි (Sokari)" | "කෝලම් (Kolam)";
  historicalBackground_si: string;
  musicalCharacteristics_si: string;
  keyPersonalities_si: string[];
  featuredSongs_si: {
    songTitle_si: string;
    ragaOrRagadhari_si?: string;
    tala_si?: string;
    lyricsSnippet_si: string;
    context_si: string;
  }[];
  instruments_si: string[];
  gradeBands: GradeBandType[];
  sourceReference: SourceReference;
  reviewMetadata: ReviewMetadata;
}

export interface GlossaryTerm {
  id: string;
  term_si: string;
  term_en: string;
  transliteration: string;
  category_si: "ස්වර හා ශ්‍රැති" | "ලය හා තාල" | "රාග ශාස්ත්‍රය" | "වාද්‍ය භාණ්ඩ" | "දේශීය සංගීතය" | "නාට්‍ය සංගීතය" | "ශබ්දය හා ධ්වනි විද්‍යාව" | "සාමාන්‍ය දැනුම";
  definition_si: string;
  detailedNotes_si?: string;
  relatedTermIds?: string[];
  audioExample?: {
    type: "swara" | "phrase" | "rhythm";
    notes?: string[];
    talaId?: string;
  };
  sourceReference: SourceReference;
}

export interface LearningPathStep {
  stepNumber: number;
  lessonId: string;
  checkpointType: "lesson" | "practice" | "quiz" | "milestone";
  requiredForNext: boolean;
}

export interface LearningPath {
  id: string;
  title_si: string;
  title_en: string;
  goalStatement_si: string; // "මට ස්වර හඳුනාගැනීමට ඉගෙනගන්න ඕන"
  description_si: string;
  gradeBands: GradeBandType[];
  difficulty: DifficultyLevel;
  estimatedHours: number;
  diagnosticQuestion: DiagnosticQuestion;
  steps: LearningPathStep[];
  masteryQuizId: string;
  nextRecommendedPathId?: string;
  sourceReference: SourceReference;
  reviewMetadata: ReviewMetadata;
}

export type QuestionType =
  | "mcq"
  | "multi-select"
  | "matching"
  | "ordering"
  | "true-false"
  | "short-answer"
  | "audio-id"
  | "notation-id";

export interface AnswerOption {
  id: string;
  text_si: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  gradeBands: GradeBandType[];
  difficulty: DifficultyLevel;
  strandId: string;
  prompt_si: string;
  options_si?: AnswerOption[];
  correctAnswerIds?: string[]; // for mcq & multi-select
  matchingPairs?: { left_si: string; right_si: string }[];
  orderingItems?: { id: string; text_si: string; correctIndex: number }[];
  correctShortAnswer_si?: string[];
  audioNotes?: string[];
  audioTalaId?: string;
  diagramSvg?: string;
  explanation_si: string;
  markingPoints_si?: string[];
  sourceReference: SourceReference;
}

export interface Quiz {
  id: string;
  title_si: string;
  lessonId?: string;
  questions: Question[];
  passingScorePercent: number;
}

export interface ExamPaper {
  id: string;
  title_si: string;
  gradeBand: GradeBandType;
  timeLimitMinutes: number;
  instructions_si: string[];
  partA_MCQ: Question[];
  partB_Structured: Question[];
  sourceReference: SourceReference;
  reviewMetadata: ReviewMetadata;
}

export interface TeacherAssignment {
  id: string;
  code: string; // 6-character code
  title_si: string;
  teacherName_si: string;
  targetGradeBand: GradeBandType;
  lessonIds: string[];
  dueDate?: string;
  instructions_si: string;
  createdAt: string;
}

export interface LessonCollection {
  id: string;
  title_si: string;
  description_si: string;
  gradeBand: GradeBandType;
  competencyIds: string[];
  lessonIds: string[];
  createdDate: string;
}

export interface StudentProgress {
  completedLessonIds: string[];
  masteredConceptIds: string[];
  savedLessonIds: string[];
  learningPathProgress: Record<string, { currentStep: number; completed: boolean; score?: number }>;
  quizAttempts: Record<string, { score: number; maxScore: number; date: string; passed: boolean }>;
  streakDays: number;
  lastActiveDate: string;
  lowBandwidthMode: boolean;
}

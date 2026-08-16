import type { CurriculumStrandId } from "@/lib/data/curriculum-strands";
import { CURRICULUM_STRAND_IDS } from "@/lib/data/curriculum-strands";
import { normalizeSinhalaText } from "@/lib/search/normalize-sinhala";

/**
 * Runtime contracts for the JSON content boundary.
 *
 * This module deliberately does not import the repository or publication
 * policy.  Raw JSON is untrusted input and must be narrowed here before any
 * policy, route, or repository code dereferences a learner-visible field.
 */

export const MAX_GRAPH_DEPTH = 256;
export const MAX_GRAPH_NODES = 10_000;
export const MAX_ARRAY_ITEMS = 10_000;

export const UNKNOWN_PROVENANCE = "නොදනී / සනාථ වී නැත";

export const GRADE_BANDS = ["6-7", "8-9", "10-11", "12-13"] as const;
export type RuntimeGradeBand = (typeof GRADE_BANDS)[number];

export const DIFFICULTY_LEVELS = ["පහසු", "මධ්‍යම", "උසස්"] as const;
export type RuntimeDifficulty = (typeof DIFFICULTY_LEVELS)[number];

export const REVIEW_STATUSES = [
  "Draft",
  "SME Review",
  "Language Review",
  "Pedagogical Review",
  "Audio Verification",
  "Accessibility & Mobile QA",
  "Rights & Source Verification",
  "Published",
  "Source Checked",
  "Sinhala Reviewed",
  "Music Reviewed",
  "Rights Checked",
  "Needs Revision",
  "Archived",
] as const;

export const REUSE_STATUSES = [
  "Verified Original",
  "Curriculum Canonical",
  "Public Domain",
  "Synthetic Web Audio",
  "Unknown / Unverified",
] as const;

export const AUDIO_ACTIVITY_TYPES = [
  "swara-demo",
  "scale-play",
  "raga-phrase",
  "rhythm-loop",
  "instrument-timbre",
] as const;

export const PRACTICE_TOOLS = [
  "swara-keyboard",
  "tala-visualizer",
  "rhythm-tap",
  "pitch-detector",
  "notation-arranger",
  "ear-training",
] as const;

export const QUESTION_TYPES = [
  "mcq",
  "multi-select",
  "matching",
  "ordering",
  "true-false",
  "short-answer",
  "audio-id",
  "notation-id",
] as const;

export const INSTRUMENT_CATEGORIES = [
  "තත් භාණ්ඩ (Chordophone)",
  "අවනද්ධ භාණ්ඩ (Membranophone)",
  "සුෂිර භාණ්ඩ (Aerophone)",
  "ඝන භාණ්ඩ (Idiophone)",
] as const;

export const INSTRUMENT_ORIGINS = [
  "දේශීය / ශ්‍රී ලාංකීය",
  "උත්තර භාරතීය",
  "බටහිර / පෙරදිග ආභාසය",
] as const;

export const CULTURAL_CATEGORIES = [
  "ගැමි ගීත (Folk Songs)",
  "ශාන්තිකර්ම (Ritual Music)",
  "රබන් පද (Raban Traditions)",
  "වැදි ගීත (Veddah Traditions)",
] as const;

export const THEATRE_TYPES = [
  "නාඩගම් (Nadagam)",
  "නූර්ති (Nurthi)",
  "සොකරි (Sokari)",
  "කෝලම් (Kolam)",
] as const;

export const GLOSSARY_CATEGORIES = [
  "ස්වර හා ශ්‍රැති",
  "ලය හා තාල",
  "රාග ශාස්ත්‍රය",
  "වාද්‍ය භාණ්ඩ",
  "දේශීය සංගීතය",
  "නාට්‍ය සංගීතය",
  "ශබ්දය හා ධ්වනි විද්‍යාව",
  "සාමාන්‍ය දැනුම",
] as const;

export const CHECKPOINT_TYPES = ["lesson", "practice", "quiz", "milestone"] as const;

export type ContentEntityKind =
  | "lesson"
  | "raga"
  | "tala"
  | "instrument"
  | "cultural-tradition"
  | "theatre-tradition"
  | "glossary"
  | "learning-path"
  | "quiz"
  | "exam-paper"
  | "question"
  | "source";

export interface ContractIssue {
  field: string;
  message: string;
}

export interface ContentContractResult {
  kind?: ContentEntityKind;
  isValid: boolean;
  issues: ContractIssue[];
}

export type GraphFailureReason = "cycle" | "depth-limit" | "node-limit" | "unreadable";

export interface GraphSafetyResult {
  safe: boolean;
  nodes: number;
  reason?: GraphFailureReason;
  depth?: number;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(value: Record<string, unknown>, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, field);
}

function read(value: Record<string, unknown>, field: string): unknown {
  return value[field];
}

export function isNonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function isStringArray(value: unknown, allowEmpty = false): value is string[] {
  return Array.isArray(value) && (allowEmpty || value.length > 0) && value.every(isNonBlankString);
}

function isOptionalStringArray(value: unknown): boolean {
  return value === undefined || isStringArray(value, true);
}

function isGradeBand(value: unknown): value is RuntimeGradeBand {
  return isOneOf(GRADE_BANDS, value);
}

export function isGradeBandArray(value: unknown, allowEmpty = false): value is RuntimeGradeBand[] {
  return Array.isArray(value) && (allowEmpty || value.length > 0) && value.every(isGradeBand);
}

export function isCurriculumStrandId(value: unknown): value is CurriculumStrandId {
  return isOneOf(CURRICULUM_STRAND_IDS, value);
}

export function isSourceReference(value: unknown): value is { sourceId: string; pageOrSection: string; notes?: string } {
  if (!isRecord(value) || !hasOwn(value, "sourceId") || !hasOwn(value, "pageOrSection")) return false;
  return isNonBlankString(value.sourceId) && isNonBlankString(value.pageOrSection) &&
    (value.notes === undefined || isNonBlankString(value.notes));
}

export function isReviewMetadata(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const required = ["status", "reviewer", "reviewDate", "lastVerifiedDate", "changeNotes", "license", "reuseStatus"];
  return required.every((field) => hasOwn(value, field) && isNonBlankString(value[field])) &&
    isOneOf(REVIEW_STATUSES, value.status) && isOneOf(REUSE_STATUSES, value.reuseStatus);
}

function hasRequiredStrings(value: Record<string, unknown>, fields: readonly string[]): boolean {
  return fields.every((field) => hasOwn(value, field) && isNonBlankString(read(value, field)));
}

function isOptionalBoolean(value: unknown): boolean {
  return value === undefined || typeof value === "boolean";
}

function isOptionalFinitePositive(value: unknown): boolean {
  return value === undefined || isPositiveNumber(value);
}

const VALID_SWARA_TOKENS = new Set(["S", "r", "R", "g", "G", "M", "m", "P", "d", "D", "n", "N"]);

function isValidSwaraToken(value: unknown): value is string {
  if (!isNonBlankString(value)) return false;
  const hasMandra = value.startsWith(".");
  const hasTara = value.endsWith("'");
  if (hasMandra && hasTara) return false;
  const core = value.replace(/^\./, "").replace(/'$/, "");
  return VALID_SWARA_TOKENS.has(core) &&
    `${hasMandra ? "." : ""}${core}${hasTara ? "'" : ""}` === value;
}

function isKeyTerm(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return hasRequiredStrings(value, ["term_si", "meaning_si"]) &&
    (value.term_en === undefined || isNonBlankString(value.term_en)) &&
    (value.transliteration === undefined || isNonBlankString(value.transliteration));
}

function isNotationRow(value: unknown): boolean {
  return isRecord(value) && hasRequiredStrings(value, ["rowLabel_si"]) && isStringArray(value.notes, true);
}

function isLessonSection(value: unknown): boolean {
  if (!isRecord(value) || !hasRequiredStrings(value, ["heading_si", "content_si"])) return false;
  return (value.keyTerms === undefined || (Array.isArray(value.keyTerms) && value.keyTerms.every(isKeyTerm))) &&
    (value.diagramSvg === undefined || isNonBlankString(value.diagramSvg)) &&
    (value.notationTable === undefined || (Array.isArray(value.notationTable) && value.notationTable.every(isNotationRow)));
}

function isDiagnosticQuestion(value: unknown): boolean {
  if (!isRecord(value) || !hasRequiredStrings(value, ["question_si", "explanation_si"])) return false;
  return isStringArray(value.options_si) && isInteger(value.correctIndex) &&
    value.correctIndex >= 0 && value.correctIndex < value.options_si.length;
}

function isAudioActivity(value: unknown): boolean {
  if (!isRecord(value) || !hasRequiredStrings(value, ["type", "title_si", "instruction_si"])) return false;
  return isOneOf(AUDIO_ACTIVITY_TYPES, value.type) && isOptionalStringArray(value.notes) &&
    (value.rootNote === undefined || isNonBlankString(value.rootNote)) &&
    isOptionalFinitePositive(value.speedBpm) &&
    (value.talaId === undefined || isNonBlankString(value.talaId)) &&
    (value.instrumentType === undefined || isNonBlankString(value.instrumentType)) &&
    (value.description_si === undefined || isNonBlankString(value.description_si));
}

function isPuzzleData(value: unknown): boolean {
  return isRecord(value) && hasRequiredStrings(value, ["prompt_si"]) &&
    isStringArray(value.shuffledItems) && isStringArray(value.correctOrder);
}

function isPracticeTask(value: unknown): boolean {
  if (!isRecord(value) || !hasRequiredStrings(value, ["title_si", "instruction_si", "interactiveTool"])) return false;
  return isOneOf(PRACTICE_TOOLS, value.interactiveTool) &&
    isOptionalStringArray(value.targetSequence) &&
    isOptionalStringArray(value.targetNotes) &&
    isOptionalFinitePositive(value.targetBpm) &&
    (value.targetTalaId === undefined || isNonBlankString(value.targetTalaId)) &&
    (value.puzzleData === undefined || isPuzzleData(value.puzzleData));
}

function isAnswerOption(value: unknown): boolean {
  return isRecord(value) && hasRequiredStrings(value, ["id", "text_si"]) && isOptionalBoolean(value.isCorrect);
}

function isMatchingPair(value: unknown): boolean {
  return isRecord(value) && hasRequiredStrings(value, ["left_si", "right_si"]);
}

function isOrderingItem(value: unknown): boolean {
  return isRecord(value) && hasRequiredStrings(value, ["id", "text_si"]) && isInteger(value.correctIndex) && value.correctIndex >= 0;
}

function isQuestionShape(value: unknown): boolean {
  if (!isRecord(value) || !hasRequiredStrings(value, ["id", "type", "prompt_si", "explanation_si", "strandId"])) return false;
  if (!isOneOf(QUESTION_TYPES, value.type) || !isGradeBandArray(value.gradeBands) ||
      !isOneOf(DIFFICULTY_LEVELS, value.difficulty) || !isCurriculumStrandId(value.strandId) ||
      !isSourceReference(value.sourceReference)) return false;

  if (value.options_si !== undefined && (!Array.isArray(value.options_si) || !value.options_si.every(isAnswerOption))) return false;
  if (value.correctAnswerIds !== undefined && !isStringArray(value.correctAnswerIds)) return false;
  if (value.matchingPairs !== undefined && (!Array.isArray(value.matchingPairs) || !value.matchingPairs.every(isMatchingPair))) return false;
  if (value.orderingItems !== undefined && (!Array.isArray(value.orderingItems) || !value.orderingItems.every(isOrderingItem))) return false;
  if (value.correctShortAnswer_si !== undefined && !isStringArray(value.correctShortAnswer_si)) return false;
  if (value.audioNotes !== undefined && !isStringArray(value.audioNotes)) return false;
  if (value.audioTalaId !== undefined && !isNonBlankString(value.audioTalaId)) return false;
  if (value.diagramSvg !== undefined && !isNonBlankString(value.diagramSvg)) return false;
  if (value.markingPoints_si !== undefined && !isStringArray(value.markingPoints_si)) return false;

  const type = value.type;
  if (type === "mcq" || type === "multi-select" || type === "true-false") {
    if (!Array.isArray(value.options_si) || value.options_si.length < 2 || !value.options_si.every(isAnswerOption)) return false;
    const ids = value.options_si.map((option) => (option as Record<string, unknown>).id as string);
    if (new Set(ids).size !== ids.length || !isStringArray(value.correctAnswerIds)) return false;
    if (new Set(value.correctAnswerIds).size !== value.correctAnswerIds.length || !value.correctAnswerIds.every((id) => ids.includes(id))) return false;
    return type === "true-false" ? ids.length === 2 && value.correctAnswerIds.length === 1 :
      type === "mcq" ? value.correctAnswerIds.length === 1 : true;
  }
  if (type === "matching") {
    if (!Array.isArray(value.matchingPairs) || value.matchingPairs.length === 0 || !value.matchingPairs.every(isMatchingPair)) return false;
    const left = value.matchingPairs.map((pair) => normalizeSinhalaText((pair as Record<string, unknown>).left_si as string));
    const right = value.matchingPairs.map((pair) => normalizeSinhalaText((pair as Record<string, unknown>).right_si as string));
    return new Set(left).size === left.length && new Set(right).size === right.length;
  }
  if (type === "ordering") {
    if (!Array.isArray(value.orderingItems) || value.orderingItems.length < 2 || value.orderingItems.length > 50 || !value.orderingItems.every(isOrderingItem)) return false;
    const ids = value.orderingItems.map((item) => (item as Record<string, unknown>).id as string);
    const indices = value.orderingItems.map((item) => (item as Record<string, unknown>).correctIndex as number).sort((a, b) => a - b);
    return new Set(ids).size === ids.length && indices.every((index, position) => index === position);
  }
  if (type === "short-answer") {
    if (!isStringArray(value.correctShortAnswer_si)) return false;
    const answers = value.correctShortAnswer_si.map(normalizeSinhalaText);
    return new Set(answers).size === answers.length;
  }
  if (type === "audio-id") return isStringArray(value.audioNotes) || isNonBlankString(value.audioTalaId);
  return type === "notation-id" && (isStringArray(value.audioNotes) || isNonBlankString(value.diagramSvg));
}

export function isQuestion(value: unknown): boolean {
  return inspectGraph(value).safe && isQuestionShape(value);
}

function isTalaBol(value: unknown): boolean {
  return isRecord(value) && isInteger(value.matra) && value.matra > 0 && isNonBlankString(value.bol_si) &&
    isInteger(value.vibhagIndex) && value.vibhagIndex >= 0 && typeof value.isSam === "boolean" &&
    typeof value.isTali === "boolean" && typeof value.isKhali === "boolean" && isNonBlankString(value.action_si);
}

function isTala(value: Record<string, unknown>): boolean {
  if (!hasRequiredStrings(value, ["id", "name_si", "name_en", "theka_si"]) || !isGradeBandArray(value.gradeBands) ||
      !isStringArray(value.aliases_si, true) || !isStringArray(value.taliKhali_si) || !isSourceReference(value.sourceReference)) return false;
  if (!isInteger(value.matras) || value.matras < 1 || !isInteger(value.vibhagCount) || value.vibhagCount < 1 ||
      !Array.isArray(value.vibhagStructure) || value.vibhagStructure.length !== value.vibhagCount ||
      !value.vibhagStructure.every((size) => isInteger(size) && size > 0) ||
      value.vibhagStructure.reduce((sum, size) => sum + (size as number), 0) !== value.matras) return false;
  if (!Array.isArray(value.bols) || value.bols.length !== value.matras || !value.bols.every(isTalaBol)) return false;
  const expectedVibhags: number[] = [];
  value.vibhagStructure.forEach((size, group) => { for (let index = 0; index < (size as number); index += 1) expectedVibhags.push(group); });
  if (value.bols.some((bol, index) => {
    const candidate = bol as Record<string, unknown>;
    return candidate.matra !== index + 1 || candidate.vibhagIndex !== expectedVibhags[index];
  })) return false;
  const tempo = value.practiceTempoBpm;
  if (!isRecord(tempo) || !["thah_bpm", "dugun_bpm", "chaugun_bpm"].every((field) => isFiniteNumber(tempo[field]) && (tempo[field] as number) >= 40 && (tempo[field] as number) <= 240)) return false;
  const hasContext = value.context_si !== undefined;
  const hasContextReference = value.contextSourceReference !== undefined;
  return hasContext === hasContextReference && (!hasContext || (
    isNonBlankString(value.context_si) && isSourceReference(value.contextSourceReference)
  ));
}

function isRaga(value: Record<string, unknown>): boolean {
  if (!hasRequiredStrings(value, ["id", "name_si", "name_en", "thata_si", "arohana_si", "avarohana_si", "vadi_si", "samvadi_si", "jati_si", "time_si", "rasa_si", "pakad_si"]) ||
      !isGradeBandArray(value.gradeBands) || !isStringArray(value.characteristics_si) || !isSourceReference(value.sourceReference)) return false;
  if (!Array.isArray(value.arohana_swaras) || value.arohana_swaras.length === 0 || !value.arohana_swaras.every(isValidSwaraToken) ||
      !Array.isArray(value.avarohana_swaras) || value.avarohana_swaras.length === 0 || !value.avarohana_swaras.every(isValidSwaraToken)) return false;
  return Array.isArray(value.samplePhrases) && value.samplePhrases.length > 0 && value.samplePhrases.every((phrase) =>
    isRecord(phrase) && hasRequiredStrings(phrase, ["name_si"]) && isStringArray(phrase.swaras));
}

function isLesson(value: Record<string, unknown>): boolean {
  return hasRequiredStrings(value, ["id", "strandId", "title_si", "slug", "summary_si", "learningGoal_si", "quizId"]) &&
    (value.title_en === undefined || isNonBlankString(value.title_en)) &&
    isCurriculumStrandId(value.strandId) && typeof value.learningGoal_si === "string" && value.learningGoal_si.startsWith("මෙම පාඩම අවසානයේ ඔබට") &&
    isPositiveNumber(value.estimatedMinutes) && isGradeBandArray(value.gradeBands) && isOneOf(DIFFICULTY_LEVELS, value.difficulty) &&
    isStringArray(value.prerequisites, true) && isStringArray(value.competencyIds, true) && isDiagnosticQuestion(value.diagnosticQuestion) &&
    Array.isArray(value.contentSections) && value.contentSections.length > 0 && value.contentSections.every(isLessonSection) &&
    isAudioActivity(value.listenActivity) && (value.performActivity === undefined || isAudioActivity(value.performActivity)) &&
    isPracticeTask(value.guidedPractice) && isPracticeTask(value.independentPractice) && isStringArray(value.recap_si) &&
    isSourceReference(value.sourceReference) && isReviewMetadata(value.reviewMetadata) && typeof value.published === "boolean" &&
    (value.nextRecommendedLessonId === undefined || isNonBlankString(value.nextRecommendedLessonId));
}

function isInstrument(value: Record<string, unknown>): boolean {
  return hasRequiredStrings(value, ["id", "name_si", "name_en", "category_si", "origin_si", "construction_si", "soundProduction_si", "playingPosition_si", "musicalRole_si", "tuningAndSwaras_si", "maintenanceAndSafety_si"]) &&
    isOneOf(INSTRUMENT_CATEGORIES, value.category_si) && isOneOf(INSTRUMENT_ORIGINS, value.origin_si) &&
    isGradeBandArray(value.gradeBands) && isSourceReference(value.sourceReference) && isReviewMetadata(value.reviewMetadata) &&
    (value.imageUrl === undefined || isNonBlankString(value.imageUrl)) && isOptionalStringArray(value.sampleAudioPattern);
}

function isCulturalTradition(value: Record<string, unknown>): boolean {
  return hasRequiredStrings(value, ["id", "title_si", "title_en", "category_si", "description_si", "musicalStyle_si", "socialContext_si"]) &&
    isOneOf(CULTURAL_CATEGORIES, value.category_si) && (isNonBlankString(value.instrumentsUsed_si) || isStringArray(value.instrumentsUsed_si, true)) &&
    Array.isArray(value.verseExamples_si) && value.verseExamples_si.length > 0 && value.verseExamples_si.every((verse) =>
      isRecord(verse) && hasRequiredStrings(verse, ["verseTitle_si", "meaning_si"]) && isStringArray(verse.lyrics_si) &&
      (verse.talaPattern_si === undefined || isNonBlankString(verse.talaPattern_si))) &&
    isGradeBandArray(value.gradeBands) && isSourceReference(value.sourceReference) && isReviewMetadata(value.reviewMetadata);
}

function isTheatreTradition(value: Record<string, unknown>): boolean {
  return hasRequiredStrings(value, ["id", "title_si", "title_en", "type_si", "historicalBackground_si", "musicalCharacteristics_si"]) &&
    isOneOf(THEATRE_TYPES, value.type_si) && isStringArray(value.keyPersonalities_si) && isStringArray(value.instruments_si) &&
    Array.isArray(value.featuredSongs_si) && value.featuredSongs_si.length > 0 && value.featuredSongs_si.every((song) =>
      isRecord(song) && hasRequiredStrings(song, ["songTitle_si", "lyricsSnippet_si", "context_si"]) &&
      (song.ragaOrRagadhari_si === undefined || isNonBlankString(song.ragaOrRagadhari_si)) &&
      (song.tala_si === undefined || isNonBlankString(song.tala_si))) &&
    isGradeBandArray(value.gradeBands) && isSourceReference(value.sourceReference) && isReviewMetadata(value.reviewMetadata);
}

function isGlossary(value: Record<string, unknown>): boolean {
  return hasRequiredStrings(value, ["id", "term_si", "term_en", "transliteration", "category_si", "definition_si"]) &&
    isOneOf(GLOSSARY_CATEGORIES, value.category_si) && isGradeBandArray(value.gradeBands) && isSourceReference(value.sourceReference) &&
    (value.detailedNotes_si === undefined || isNonBlankString(value.detailedNotes_si)) &&
    (value.relatedTermIds === undefined || isStringArray(value.relatedTermIds, true)) &&
    (value.audioExample === undefined || (isRecord(value.audioExample) && isOneOf(["swara", "phrase", "rhythm"] as const, value.audioExample.type) &&
      isOptionalStringArray(value.audioExample.notes) && (value.audioExample.talaId === undefined || isNonBlankString(value.audioExample.talaId))));
}

function isLearningPath(value: Record<string, unknown>): boolean {
  return hasRequiredStrings(value, ["id", "title_si", "title_en", "goalStatement_si", "description_si", "masteryQuizId"]) &&
    isGradeBandArray(value.gradeBands) && isOneOf(DIFFICULTY_LEVELS, value.difficulty) && isPositiveNumber(value.estimatedHours) &&
    isDiagnosticQuestion(value.diagnosticQuestion) && Array.isArray(value.steps) && value.steps.length > 0 && value.steps.every((step, index) =>
      isRecord(step) && step.stepNumber === index + 1 && isNonBlankString(step.lessonId) && isOneOf(CHECKPOINT_TYPES, step.checkpointType) && typeof step.requiredForNext === "boolean") &&
    isSourceReference(value.sourceReference) && isReviewMetadata(value.reviewMetadata) &&
    (value.nextRecommendedPathId === undefined || isNonBlankString(value.nextRecommendedPathId));
}

function isQuiz(value: Record<string, unknown>): boolean {
  if (!hasRequiredStrings(value, ["id", "title_si", "lessonId"]) || !isGradeBandArray(value.gradeBands) ||
      !isFiniteNumber(value.passingScorePercent) || value.passingScorePercent < 1 || value.passingScorePercent > 100 ||
      !Array.isArray(value.questions) || value.questions.length === 0 || !value.questions.every(isQuestionShape)) return false;
  const ids = value.questions.map((question) => (question as Record<string, unknown>).id);
  return new Set(ids).size === ids.length;
}

function isExamPaper(value: Record<string, unknown>): boolean {
  if (!hasRequiredStrings(value, ["id", "title_si"]) || !isGradeBand(value.gradeBand) || !isPositiveNumber(value.timeLimitMinutes) ||
      !isStringArray(value.instructions_si) || !Array.isArray(value.partA_MCQ) || value.partA_MCQ.length === 0 || !value.partA_MCQ.every(isQuestionShape) ||
      !Array.isArray(value.partB_Structured) || value.partB_Structured.length === 0 || !value.partB_Structured.every(isQuestionShape) ||
      !isSourceReference(value.sourceReference) || !isReviewMetadata(value.reviewMetadata)) return false;
  const ids = [...value.partA_MCQ, ...value.partB_Structured].map((question) => (question as Record<string, unknown>).id);
  return new Set(ids).size === ids.length;
}

function isSource(value: Record<string, unknown>): boolean {
  return hasRequiredStrings(value, ["id", "title", "originalFilename", "language", "tier", "status", "license"]) &&
    isStringArray(value.grades) && (typeof value.year === "number" ? Number.isInteger(value.year) : isNonBlankString(value.year)) &&
    (value.publisher === undefined || isNonBlankString(value.publisher)) && (value.location === undefined || isNonBlankString(value.location)) &&
    (value.url === undefined || isNonBlankString(value.url));
}

const REQUIRED_METADATA_KINDS = new Set<ContentEntityKind>([
  "lesson", "raga", "tala", "instrument", "cultural-tradition", "theatre-tradition", "learning-path", "exam-paper",
]);

const KIND_SIGNATURES: Array<{ kind: ContentEntityKind; keys: string[] }> = [
  { kind: "lesson", keys: ["learningGoal_si", "contentSections", "listenActivity", "guidedPractice", "independentPractice"] },
  { kind: "raga", keys: ["arohana_swaras", "avarohana_swaras", "samplePhrases"] },
  { kind: "tala", keys: ["matras", "vibhagStructure", "bols"] },
  { kind: "instrument", keys: ["construction_si", "soundProduction_si", "tuningAndSwaras_si"] },
  { kind: "cultural-tradition", keys: ["verseExamples_si", "musicalStyle_si", "socialContext_si"] },
  { kind: "theatre-tradition", keys: ["featuredSongs_si", "historicalBackground_si", "keyPersonalities_si"] },
  { kind: "glossary", keys: ["term_si", "transliteration", "definition_si"] },
  { kind: "learning-path", keys: ["goalStatement_si", "steps", "masteryQuizId"] },
  { kind: "quiz", keys: ["questions", "lessonId", "passingScorePercent"] },
  { kind: "exam-paper", keys: ["partA_MCQ", "partB_Structured", "timeLimitMinutes"] },
  { kind: "question", keys: ["type", "prompt_si", "explanation_si", "strandId"] },
  { kind: "source", keys: ["originalFilename", "grades", "language"] },
];

export function identifyContentKind(value: unknown): ContentEntityKind | undefined {
  if (!isRecord(value)) return undefined;
  let matches: ContentEntityKind[] = [];
  try {
    const keys = new Set(Object.keys(value));
    matches = KIND_SIGNATURES.filter((signature) => signature.keys.every((key) => keys.has(key))).map((signature) => signature.kind);
  } catch {
    return undefined;
  }
  return matches.length === 1 ? matches[0] : undefined;
}

export function validateContentRecord(
  value: unknown,
  expectedKind?: ContentEntityKind,
  knownGraphSafety?: GraphSafetyResult
): ContentContractResult {
  const graph = knownGraphSafety ?? inspectGraph(value);
  if (!graph.safe) return { kind: expectedKind, isValid: false, issues: [{ field: "record", message: `Unsafe object graph: ${graph.reason ?? "unknown"}.` }] };
  const inferredKind = identifyContentKind(value);
  const kind = expectedKind ?? inferredKind;
  if (!kind || inferredKind !== kind || !isRecord(value)) {
    return { kind, isValid: false, issues: [{ field: "kind", message: "Record kind is unknown, ambiguous, or does not match the expected contract." }] };
  }
  let valid = false;
  switch (kind) {
    case "lesson": valid = isLesson(value); break;
    case "raga": valid = isRaga(value); break;
    case "tala": valid = isTala(value); break;
    case "instrument": valid = isInstrument(value); break;
    case "cultural-tradition": valid = isCulturalTradition(value); break;
    case "theatre-tradition": valid = isTheatreTradition(value); break;
    case "glossary": valid = isGlossary(value); break;
    case "learning-path": valid = isLearningPath(value); break;
    case "quiz": valid = isQuiz(value); break;
    case "exam-paper": valid = isExamPaper(value); break;
    case "question": valid = isQuestionShape(value); break;
    case "source": valid = isSource(value); break;
  }
  const issues: ContractIssue[] = [];
  if (REQUIRED_METADATA_KINDS.has(kind) && !isReviewMetadata(value.reviewMetadata)) {
    issues.push({ field: "reviewMetadata", message: "Metadata-bearing records require a complete, finite reviewMetadata object." });
  }
  if (!valid) issues.push({ field: "record", message: `Record does not satisfy the complete ${kind} runtime contract.` });
  return { kind, isValid: valid && issues.length === 0, issues };
}

/** Iterative cycle/depth/node guard shared by all public-boundary operations. */
export function inspectGraph(value: unknown): GraphSafetyResult {
  if (value === null || typeof value !== "object") return { safe: true, nodes: 0 };
  type Frame = { value: object; depth: number; keys: string[]; index: number };
  const colors = new WeakMap<object, 1 | 2>();
  const stack: Frame[] = [];
  let nodes = 0;
  const push = (candidate: object, depth: number): GraphSafetyResult | undefined => {
    if (depth > MAX_GRAPH_DEPTH) return { safe: false, nodes, reason: "depth-limit", depth };
    const color = colors.get(candidate);
    if (color === 1) return { safe: false, nodes, reason: "cycle", depth };
    if (color === 2) return undefined;
    if (nodes >= MAX_GRAPH_NODES) return { safe: false, nodes, reason: "node-limit", depth };
    if (Array.isArray(candidate)) {
      if (candidate.length > MAX_ARRAY_ITEMS) return { safe: false, nodes, reason: "node-limit", depth };
      let arrayKeys: string[];
      try { arrayKeys = Object.keys(candidate); } catch { return { safe: false, nodes, reason: "unreadable", depth }; }
      if (arrayKeys.length !== candidate.length || arrayKeys.some((key, index) => key !== String(index))) {
        return { safe: false, nodes, reason: "unreadable", depth };
      }
    }
    let keys: string[];
    try { keys = Object.keys(candidate); } catch { return { safe: false, nodes, reason: "unreadable", depth }; }
    if (keys.length > MAX_GRAPH_NODES) return { safe: false, nodes, reason: "node-limit", depth };
    nodes += 1;
    colors.set(candidate, 1);
    stack.push({ value: candidate, depth, keys, index: 0 });
    return undefined;
  };
  const initialFailure = push(value, 0);
  if (initialFailure) return initialFailure;
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    if (frame.index >= frame.keys.length) {
      colors.set(frame.value, 2);
      stack.pop();
      continue;
    }
    const key = frame.keys[frame.index++];
    let child: unknown;
    try { child = (frame.value as Record<string, unknown>)[key]; } catch { return { safe: false, nodes, reason: "unreadable", depth: frame.depth }; }
    if (child !== null && typeof child === "object") {
      const failure = push(child, frame.depth + 1);
      if (failure) return failure;
    }
  }
  return { safe: true, nodes };
}

const PUBLIC_FIELDS: Record<ContentEntityKind, readonly string[]> = {
  lesson: ["id", "strandId", "title_si", "title_en", "slug", "summary_si", "learningGoal_si", "estimatedMinutes", "gradeBands", "difficulty", "prerequisites", "competencyIds", "diagnosticQuestion", "contentSections", "listenActivity", "performActivity", "guidedPractice", "independentPractice", "quizId", "recap_si", "sourceReference", "reviewMetadata", "nextRecommendedLessonId", "published"],
  raga: ["id", "name_si", "name_en", "thata_si", "arohana_si", "avarohana_si", "arohana_swaras", "avarohana_swaras", "vadi_si", "samvadi_si", "jati_si", "time_si", "rasa_si", "pakad_si", "characteristics_si", "samplePhrases", "gradeBands", "sourceReference", "reviewMetadata"],
  tala: ["id", "name_si", "name_en", "aliases_si", "matras", "vibhagCount", "vibhagStructure", "taliKhali_si", "theka_si", "bols", "practiceTempoBpm", "context_si", "contextSourceReference", "gradeBands", "sourceReference", "reviewMetadata"],
  instrument: ["id", "name_si", "name_en", "category_si", "origin_si", "construction_si", "soundProduction_si", "playingPosition_si", "musicalRole_si", "tuningAndSwaras_si", "maintenanceAndSafety_si", "imageUrl", "sampleAudioPattern", "gradeBands", "sourceReference", "reviewMetadata"],
  "cultural-tradition": ["id", "title_si", "title_en", "category_si", "description_si", "musicalStyle_si", "instrumentsUsed_si", "verseExamples_si", "socialContext_si", "gradeBands", "sourceReference", "reviewMetadata"],
  "theatre-tradition": ["id", "title_si", "title_en", "type_si", "historicalBackground_si", "musicalCharacteristics_si", "keyPersonalities_si", "featuredSongs_si", "instruments_si", "gradeBands", "sourceReference", "reviewMetadata"],
  glossary: ["id", "term_si", "term_en", "transliteration", "category_si", "gradeBands", "definition_si", "detailedNotes_si", "relatedTermIds", "audioExample", "sourceReference"],
  "learning-path": ["id", "title_si", "title_en", "goalStatement_si", "description_si", "gradeBands", "difficulty", "estimatedHours", "diagnosticQuestion", "steps", "masteryQuizId", "nextRecommendedPathId", "sourceReference", "reviewMetadata"],
  quiz: ["id", "title_si", "lessonId", "gradeBands", "questions", "passingScorePercent"],
  "exam-paper": ["id", "title_si", "gradeBand", "timeLimitMinutes", "instructions_si", "partA_MCQ", "partB_Structured", "sourceReference", "reviewMetadata"],
  question: ["id", "type", "gradeBands", "difficulty", "strandId", "prompt_si", "options_si", "correctAnswerIds", "matchingPairs", "orderingItems", "correctShortAnswer_si", "audioNotes", "audioTalaId", "diagramSvg", "explanation_si", "markingPoints_si", "sourceReference"],
  source: ["id", "title", "originalFilename", "publisher", "grades", "year", "language", "tier", "location", "status", "license", "url"],
};

type ProjectionKind = ContentEntityKind | "metadata" | "source-reference" | "diagnostic" | "lesson-section" | "key-term" | "notation-row" | "audio-activity" | "practice-task" | "puzzle-data" | "sample-phrase" | "tala-bol" | "tempo" | "verse-example" | "featured-song" | "glossary-audio" | "path-step" | "answer-option" | "matching-pair" | "ordering-item";

const NESTED_FIELDS: Record<ProjectionKind, readonly string[]> = {
  metadata: ["status", "reviewer", "reviewDate", "lastVerifiedDate", "changeNotes", "license", "reuseStatus"],
  "source-reference": ["sourceId", "pageOrSection", "notes"],
  diagnostic: ["question_si", "options_si", "correctIndex", "explanation_si"],
  "lesson-section": ["heading_si", "content_si", "keyTerms", "diagramSvg", "notationTable"],
  "key-term": ["term_si", "meaning_si", "term_en", "transliteration"],
  "notation-row": ["rowLabel_si", "notes"],
  "audio-activity": ["type", "title_si", "instruction_si", "notes", "rootNote", "speedBpm", "talaId", "instrumentType", "description_si"],
  "practice-task": ["title_si", "instruction_si", "interactiveTool", "targetSequence", "targetTalaId", "targetBpm", "targetNotes", "puzzleData"],
  "puzzle-data": ["prompt_si", "shuffledItems", "correctOrder"],
  "sample-phrase": ["name_si", "swaras"],
  "tala-bol": ["matra", "bol_si", "vibhagIndex", "isSam", "isTali", "isKhali", "action_si"],
  tempo: ["thah_bpm", "dugun_bpm", "chaugun_bpm"],
  "verse-example": ["verseTitle_si", "lyrics_si", "meaning_si", "talaPattern_si"],
  "featured-song": ["songTitle_si", "ragaOrRagadhari_si", "tala_si", "lyricsSnippet_si", "context_si"],
  "glossary-audio": ["type", "notes", "talaId"],
  "path-step": ["stepNumber", "lessonId", "checkpointType", "requiredForNext"],
  "answer-option": ["id", "text_si", "isCorrect"],
  "matching-pair": ["left_si", "right_si"],
  "ordering-item": ["id", "text_si", "correctIndex"],
  lesson: PUBLIC_FIELDS.lesson,
  raga: PUBLIC_FIELDS.raga,
  tala: PUBLIC_FIELDS.tala,
  instrument: PUBLIC_FIELDS.instrument,
  "cultural-tradition": PUBLIC_FIELDS["cultural-tradition"],
  "theatre-tradition": PUBLIC_FIELDS["theatre-tradition"],
  glossary: PUBLIC_FIELDS.glossary,
  "learning-path": PUBLIC_FIELDS["learning-path"],
  quiz: PUBLIC_FIELDS.quiz,
  "exam-paper": PUBLIC_FIELDS["exam-paper"],
  question: PUBLIC_FIELDS.question,
  source: PUBLIC_FIELDS.source,
};

function nestedProjectionKind(parent: ProjectionKind, field: string): ProjectionKind | undefined {
  if (field === "reviewMetadata") return "metadata";
  if (["sourceReference", "contextSourceReference"].includes(field)) return "source-reference";
  if (parent === "lesson" && field === "diagnosticQuestion") return "diagnostic";
  if (parent === "lesson" && field === "contentSections") return "lesson-section";
  if (parent === "lesson" && ["listenActivity", "performActivity"].includes(field)) return "audio-activity";
  if (parent === "lesson" && ["guidedPractice", "independentPractice"].includes(field)) return "practice-task";
  if (parent === "raga" && field === "samplePhrases") return "sample-phrase";
  if (parent === "tala" && field === "bols") return "tala-bol";
  if (parent === "tala" && field === "practiceTempoBpm") return "tempo";
  if (parent === "instrument" || parent === "cultural-tradition" || parent === "theatre-tradition" || parent === "glossary" || parent === "learning-path" || parent === "quiz" || parent === "exam-paper" || parent === "question") {
    if (parent === "cultural-tradition" && field === "verseExamples_si") return "verse-example";
    if (parent === "theatre-tradition" && field === "featuredSongs_si") return "featured-song";
    if (parent === "glossary" && field === "audioExample") return "glossary-audio";
    if (parent === "learning-path" && field === "diagnosticQuestion") return "diagnostic";
    if (parent === "learning-path" && field === "steps") return "path-step";
    if ((parent === "quiz" || parent === "exam-paper") && ["questions", "partA_MCQ", "partB_Structured"].includes(field)) return "question";
    if (parent === "question" && field === "options_si") return "answer-option";
    if (parent === "question" && field === "matchingPairs") return "matching-pair";
    if (parent === "question" && field === "orderingItems") return "ordering-item";
  }
  if (parent === "lesson-section" && field === "keyTerms") return "key-term";
  if (parent === "lesson-section" && field === "notationTable") return "notation-row";
  if (parent === "practice-task" && field === "puzzleData") return "puzzle-data";
  return undefined;
}

/**
 * Build an allowlisted, detached public value.  The graph was already checked
 * iteratively, and this copy is also iterative so a malicious object cannot
 * overflow the call stack during sanitization.
 */
export function projectPublicRecord(value: unknown, kind: ContentEntityKind): unknown | undefined {
  const safety = inspectGraph(value);
  if (!safety.safe || !isRecord(value)) return undefined;
  const root: Record<string, unknown> = {};
  const seen = new WeakMap<object, unknown>();
  type Work = { source: Record<string, unknown>; target: Record<string, unknown>; kind: ProjectionKind };
  const work: Work[] = [{ source: value, target: root, kind }];
  seen.set(value, root);
  while (work.length > 0) {
    const current = work.pop() as Work;
    const fields = NESTED_FIELDS[current.kind];
    for (const field of fields) {
      if (!hasOwn(current.source, field)) continue;
      let child: unknown;
      try { child = current.source[field]; } catch { return undefined; }
      if (field === "reviewMetadata") {
        current.target[field] = createUnverifiedReviewMetadata();
        continue;
      }
      if (child === null || typeof child !== "object") {
        current.target[field] = child;
        continue;
      }
      const childKind = nestedProjectionKind(current.kind, field);
      if (!childKind && Array.isArray(child)) {
        if (child.every((item) => item === null || typeof item !== "object")) current.target[field] = [...child];
        continue;
      }
      if (!childKind) continue;
      const existing = seen.get(child);
      if (existing) {
        current.target[field] = existing;
        continue;
      }
      if (Array.isArray(child)) {
        const targetArray: unknown[] = [];
        seen.set(child, targetArray);
        current.target[field] = targetArray;
        for (let index = child.length - 1; index >= 0; index -= 1) {
          const item = child[index];
          if (item !== null && typeof item === "object") {
            const itemTarget: Record<string, unknown> = {};
            seen.set(item, itemTarget);
            targetArray[index] = itemTarget;
            work.push({ source: item as Record<string, unknown>, target: itemTarget, kind: childKind });
          } else targetArray[index] = item;
        }
      } else {
        const targetObject: Record<string, unknown> = {};
        seen.set(child, targetObject);
        current.target[field] = targetObject;
        work.push({ source: child as Record<string, unknown>, target: targetObject, kind: childKind });
      }
    }
    if (current.kind === "lesson" || current.kind === "raga" || current.kind === "tala" || current.kind === "instrument" || current.kind === "cultural-tradition" || current.kind === "theatre-tradition" || current.kind === "learning-path" || current.kind === "exam-paper") {
      if (Object.prototype.hasOwnProperty.call(current.source, "published")) current.target.published = false;
    }
  }
  return root;
}

export function createUnverifiedReviewMetadata(): Record<string, string> {
  return {
    status: "Needs Revision",
    reviewer: UNKNOWN_PROVENANCE,
    reviewDate: UNKNOWN_PROVENANCE,
    lastVerifiedDate: UNKNOWN_PROVENANCE,
    changeNotes: "Publication containment baseline: the previous review metadata is not evidence of a completed review.",
    license: UNKNOWN_PROVENANCE,
    reuseStatus: "Unknown / Unverified",
  };
}

/** Detached all-field copy for review/admin views; unlike the old clone this is iterative and bounded. */
export function cloneBoundedRecord<T>(value: T): T | undefined {
  if (value === null || typeof value !== "object") return value;
  if (!inspectGraph(value).safe) return undefined;
  const root = Array.isArray(value) ? [] : {};
  const seen = new WeakMap<object, unknown>();
  seen.set(value as object, root);
  const queue: Array<{ source: object; target: object }> = [{ source: value as object, target: root as object }];
  let cursor = 0;
  while (cursor < queue.length) {
    const current = queue[cursor++];
    let keys: string[];
    try { keys = Object.keys(current.source); } catch { return undefined; }
    for (const key of keys) {
      let child: unknown;
      try { child = (current.source as Record<string, unknown>)[key]; } catch { return undefined; }
      if (child !== null && typeof child === "object") {
        const existing = seen.get(child);
        if (existing) (current.target as Record<string, unknown>)[key] = existing;
        else {
          const next = Array.isArray(child) ? [] : {};
          seen.set(child, next);
          (current.target as Record<string, unknown>)[key] = next;
          queue.push({ source: child as object, target: next as object });
        }
      } else (current.target as Record<string, unknown>)[key] = child;
    }
  }
  return root as T;
}

export function isMetadataBearingKind(kind: ContentEntityKind | undefined): boolean {
  return !!kind && REQUIRED_METADATA_KINDS.has(kind);
}

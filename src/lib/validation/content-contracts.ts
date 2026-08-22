import type { CurriculumStrandId } from "@/lib/data/curriculum-strands";
import { CURRICULUM_STRAND_IDS } from "@/lib/data/curriculum-strands";
import { normalizeSinhalaText } from "@/lib/search/normalize-sinhala";
import {
  MAX_GRAPH_DEPTH,
  MAX_GRAPH_NODES,
  MAX_ARRAY_ITEMS,
  UNKNOWN_PROVENANCE,
  captureSafeSnapshot,
  cloneBoundedRecord,
  inspectGraph,
  isDenseArray,
  isGradeBand,
  isNonBlankString,
  isRecord,
  normalizeEntityId,
  normalizeRecordId,
  readOwnDataField,
  safeOwnEntries,
  type GraphFailureReason,
  type GraphSafetyResult,
} from "@/lib/shared/bounded-values";

/**
 * Runtime contracts for the JSON content boundary.
 *
 * This module deliberately does not import the repository or publication
 * policy.  Raw JSON is untrusted input and must be narrowed here before any
 * policy, route, or repository code dereferences a learner-visible field.
 *
 * Bounded-graph primitives (descriptor-safe own-entry reads, detached
 * snapshots, iterative traversal limits, identity normalization, dense-array
 * checks) live in `@/lib/shared/bounded-values`, which both this layer and
 * `lib/data` import without a cross-layer edge.  They are re-exported here so
 * every existing importer keeps its path and the forensic ledger's recorded
 * `path#symbol` anchors keep resolving at this file.
 */

export {
  MAX_GRAPH_DEPTH,
  MAX_GRAPH_NODES,
  MAX_ARRAY_ITEMS,
  UNKNOWN_PROVENANCE,
  cloneBoundedRecord,
  inspectGraph,
  isDenseArray,
  isNonBlankString,
  isRecord,
  normalizeEntityId,
  normalizeRecordId,
  readOwnDataField,
};
export type { GraphFailureReason, GraphSafetyResult };

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

export const PUBLIC_QUESTION_TYPES = [
  "mcq",
  "multi-select",
  "matching",
  "ordering",
  "true-false",
  "short-answer",
] as const;

export function isPublicQuestionType(value: unknown): boolean {
  return isOneOf(PUBLIC_QUESTION_TYPES, value);
}

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

function hasOwn(value: Record<string, unknown>, field: string): boolean {
  return readOwnDataField(value, field) !== undefined || (() => {
    try {
      return safeOwnEntries(value)?.entries.some((entry) => entry.key === field) ?? false;
    } catch {
      return false;
    }
  })();
}

function read(value: unknown, field: string): unknown {
  return readOwnDataField(value, field);
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

export function isGradeBandArray(value: unknown, allowEmpty = false): value is RuntimeGradeBand[] {
  const snapshot = captureSafeSnapshot(value);
  return Array.isArray(snapshot) && (allowEmpty || snapshot.length > 0) && snapshot.every(isGradeBand);
}

export function isCurriculumStrandId(value: unknown): value is CurriculumStrandId {
  return isOneOf(CURRICULUM_STRAND_IDS, value);
}

export function isSourceReference(value: unknown): value is { sourceId: string; pageOrSection: string; notes?: string } {
  if (!isRecord(value) || !hasOwn(value, "sourceId") || !hasOwn(value, "pageOrSection")) return false;
  const sourceId = read(value, "sourceId");
  const pageOrSection = read(value, "pageOrSection");
  const notes = read(value, "notes");
  return isNonBlankString(sourceId) && sourceId === sourceId.trim() &&
    isNonBlankString(pageOrSection) &&
    (notes === undefined || isNonBlankString(notes));
}

export function isReviewMetadata(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const required = ["status", "reviewer", "reviewDate", "lastVerifiedDate", "changeNotes", "license", "reuseStatus"];
  return required.every((field) => hasOwn(value, field) && isNonBlankString(read(value, field))) &&
    isOneOf(REVIEW_STATUSES, read(value, "status")) && isOneOf(REUSE_STATUSES, read(value, "reuseStatus"));
}

/**
 * Publication state is a contract invariant, not a UI hint.  A lesson may
 * only carry published=true when its review metadata explicitly says
 * Published, and a Published status may not be hidden behind published=false.
 */
export function isPublicationStateConsistent(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const published = read(value, "published");
  const metadata = read(value, "reviewMetadata");
  const status = isRecord(metadata) ? read(metadata, "status") : undefined;
  return typeof published === "boolean" &&
    typeof status === "string" &&
    published === (status === "Published");
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

function isSafeTempo(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 40 && value <= 240;
}

const VALID_SWARA_TOKENS = new Set(["S", "r", "R", "g", "G", "M", "m", "P", "d", "D", "n", "N"]);

export function isValidSwaraToken(value: unknown): value is string {
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
  const options = read(value, "options_si");
  const correctIndex = read(value, "correctIndex");
  return isStringArray(options) && isInteger(correctIndex) &&
    correctIndex >= 0 && correctIndex < options.length;
}

function isAudioActivity(value: unknown): boolean {
  if (!isRecord(value) || !hasRequiredStrings(value, ["type", "title_si", "instruction_si"])) return false;
  const type = read(value, "type");
  const notes = read(value, "notes");
  const rootNote = read(value, "rootNote");
  const speedBpm = read(value, "speedBpm");
  const talaId = read(value, "talaId");
  const instrumentType = read(value, "instrumentType");
  const description = read(value, "description_si");
  if (!isOneOf(AUDIO_ACTIVITY_TYPES, type) ||
      !isOptionalStringArray(notes) ||
      (notes !== undefined && (!isStringArray(notes) || !notes.every(isValidSwaraToken))) ||
      (rootNote !== undefined && !isNonBlankString(rootNote)) ||
      !isOptionalFinitePositive(speedBpm) ||
      (talaId !== undefined && !isNonBlankString(talaId)) ||
      (instrumentType !== undefined && !isNonBlankString(instrumentType)) ||
      (description !== undefined && !isNonBlankString(description))) return false;

  if (type === "rhythm-loop") {
    return (notes === undefined || isStringArray(notes, true)) && isSafeTempo(speedBpm) && isNonBlankString(talaId);
  }
  return isStringArray(notes) && notes.every(isValidSwaraToken);
}

function isPuzzleData(value: unknown): boolean {
  return isRecord(value) && hasRequiredStrings(value, ["prompt_si"]) &&
    isStringArray(read(value, "shuffledItems")) && isStringArray(read(value, "correctOrder"));
}

function isPracticeTask(value: unknown): boolean {
  if (!isRecord(value) || !hasRequiredStrings(value, ["title_si", "instruction_si", "interactiveTool"])) return false;
  const tool = read(value, "interactiveTool");
  const targetSequence = read(value, "targetSequence");
  const targetNotes = read(value, "targetNotes");
  const targetBpm = read(value, "targetBpm");
  const targetTalaId = read(value, "targetTalaId");
  const puzzleData = read(value, "puzzleData");
  if (!isOneOf(PRACTICE_TOOLS, tool) ||
      !isOptionalStringArray(targetSequence) ||
      (targetSequence !== undefined && (!isStringArray(targetSequence) || !targetSequence.every(isValidSwaraToken))) ||
      !isOptionalStringArray(targetNotes) ||
      (targetNotes !== undefined && (!isStringArray(targetNotes) || !targetNotes.every(isValidSwaraToken))) ||
      !isOptionalFinitePositive(targetBpm) ||
      (targetBpm !== undefined && !isSafeTempo(targetBpm)) ||
      (targetTalaId !== undefined && !isNonBlankString(targetTalaId)) ||
      (puzzleData !== undefined && !isPuzzleData(puzzleData))) return false;

  switch (tool) {
    case "swara-keyboard":
      return isStringArray(targetSequence) && targetSequence.every(isValidSwaraToken);
    case "tala-visualizer":
      return isNonBlankString(targetTalaId);
    case "rhythm-tap":
      return isSafeTempo(targetBpm);
    case "pitch-detector":
      return isStringArray(targetNotes) && targetNotes.every(isValidSwaraToken);
    case "notation-arranger":
      return isPuzzleData(puzzleData);
    case "ear-training":
      return true;
    default:
      return false;
  }
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

function canonicalQuestionIds(questions: readonly unknown[]): string[] | undefined {
  const ids: string[] = [];
  for (const question of questions) {
    if (!isRecord(question)) return undefined;
    const id = normalizeEntityId(read(question, "id"));
    if (!id) return undefined;
    ids.push(id);
  }
  return ids;
}

function isQuestionShape(value: unknown): boolean {
  if (!isRecord(value) || !hasRequiredStrings(value, ["id", "type", "prompt_si", "explanation_si", "strandId"])) return false;
  if (!normalizeEntityId(read(value, "id"))) return false;
  const type = read(value, "type");
  const gradeBands = read(value, "gradeBands");
  const difficulty = read(value, "difficulty");
  const strandId = read(value, "strandId");
  const sourceReference = read(value, "sourceReference");
  const options = read(value, "options_si");
  const correctAnswerIds = read(value, "correctAnswerIds");
  const matchingPairs = read(value, "matchingPairs");
  const orderingItems = read(value, "orderingItems");
  const correctShortAnswer = read(value, "correctShortAnswer_si");
  const audioNotes = read(value, "audioNotes");
  const audioTalaId = read(value, "audioTalaId");
  const diagramSvg = read(value, "diagramSvg");
  const markingPoints = read(value, "markingPoints_si");
  if (!isOneOf(QUESTION_TYPES, type) || !isGradeBandArray(gradeBands) ||
      !isOneOf(DIFFICULTY_LEVELS, difficulty) || !isCurriculumStrandId(strandId) ||
      !isSourceReference(sourceReference)) return false;

  if (options !== undefined && (!Array.isArray(options) || !options.every(isAnswerOption))) return false;
  if (correctAnswerIds !== undefined && !isStringArray(correctAnswerIds)) return false;
  if (matchingPairs !== undefined && (!Array.isArray(matchingPairs) || !matchingPairs.every(isMatchingPair))) return false;
  if (orderingItems !== undefined && (!Array.isArray(orderingItems) || !orderingItems.every(isOrderingItem))) return false;
  if (correctShortAnswer !== undefined && !isStringArray(correctShortAnswer)) return false;
  if (audioNotes !== undefined && (!isStringArray(audioNotes) || !audioNotes.every(isValidSwaraToken))) return false;
  if (audioTalaId !== undefined && !isNonBlankString(audioTalaId)) return false;
  if (diagramSvg !== undefined && !isNonBlankString(diagramSvg)) return false;
  if (markingPoints !== undefined && !isStringArray(markingPoints)) return false;

  if (type === "mcq" || type === "multi-select" || type === "true-false") {
    if (!Array.isArray(options) || options.length < 2 || !options.every(isAnswerOption)) return false;
    const ids = options.map((option) => read(option, "id") as string);
    if (new Set(ids).size !== ids.length || !isStringArray(correctAnswerIds)) return false;
    if (new Set(correctAnswerIds).size !== correctAnswerIds.length || !correctAnswerIds.every((id) => ids.includes(id))) return false;
    return type === "true-false" ? ids.length === 2 && correctAnswerIds.length === 1 :
      type === "mcq" ? correctAnswerIds.length === 1 : true;
  }
  if (type === "matching") {
    if (!Array.isArray(matchingPairs) || matchingPairs.length === 0 || !matchingPairs.every(isMatchingPair)) return false;
    const left = matchingPairs.map((pair) => normalizeSinhalaText(read(pair, "left_si") as string));
    const right = matchingPairs.map((pair) => normalizeSinhalaText(read(pair, "right_si") as string));
    return new Set(left).size === left.length && new Set(right).size === right.length;
  }
  if (type === "ordering") {
    if (!Array.isArray(orderingItems) || orderingItems.length < 2 || orderingItems.length > 50 || !orderingItems.every(isOrderingItem)) return false;
    const ids = orderingItems.map((item) => read(item, "id") as string);
    const indices = orderingItems.map((item) => read(item, "correctIndex") as number).sort((a, b) => a - b);
    return new Set(ids).size === ids.length && indices.every((index, position) => index === position);
  }
  if (type === "short-answer") {
    if (!isStringArray(correctShortAnswer)) return false;
    const answers = correctShortAnswer.map(normalizeSinhalaText);
    return new Set(answers).size === answers.length;
  }
  if (type === "audio-id") return isStringArray(audioNotes) || isNonBlankString(audioTalaId);
  return type === "notation-id" && (isStringArray(audioNotes) || isNonBlankString(diagramSvg));
}

export function isQuestion(value: unknown): boolean {
  try {
    return inspectGraph(value).safe && isQuestionShape(value);
  } catch {
    return false;
  }
}

/** Closed, dependency-free mirror of the tabla planner's intentional strokes. */
const VALID_TABLA_BOL_TOKENS = new Set([
  "-", "s",
  "dha", "ධා", "ධ", "dhin", "ධින්", "ධී", "ධි",
  "ge", "ගේ", "ගෙ", "ග", "ghe",
  "na", "නා", "න", "ta", "තා", "ත", "tin", "තින්", "තී", "ති",
  "තන්න", "te", "තෙ", "ti", "කේ", "කෙ", "ක", "ke", "කත්", "තූ", "තු", "නක",
  "ධන්න", "ධනක",
]);

export function isMappedTalaBolToken(value: unknown): value is string {
  return isNonBlankString(value) && VALID_TABLA_BOL_TOKENS.has(value.trim().toLocaleLowerCase());
}

function isTalaBol(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const matra = read(value, "matra");
  const bol = read(value, "bol_si");
  const vibhagIndex = read(value, "vibhagIndex");
  const isSam = read(value, "isSam");
  const isTali = read(value, "isTali");
  const isKhali = read(value, "isKhali");
  const action = read(value, "action_si");
  return isInteger(matra) && matra > 0 && isMappedTalaBolToken(bol) &&
    isInteger(vibhagIndex) && vibhagIndex >= 0 && typeof isSam === "boolean" &&
    typeof isTali === "boolean" && typeof isKhali === "boolean" && isNonBlankString(action);
}

function isTala(value: Record<string, unknown>): boolean {
  const matras = read(value, "matras");
  const vibhagCount = read(value, "vibhagCount");
  const vibhagStructure = read(value, "vibhagStructure");
  const bols = read(value, "bols");
  if (!hasRequiredStrings(value, ["id", "name_si", "name_en", "theka_si"]) || !isGradeBandArray(read(value, "gradeBands")) ||
      !isStringArray(read(value, "aliases_si"), true) || !isStringArray(read(value, "taliKhali_si")) || !isSourceReference(read(value, "sourceReference"))) return false;
  if (!isInteger(matras) || matras < 1 || !isInteger(vibhagCount) || vibhagCount < 1 ||
      !Array.isArray(vibhagStructure) || vibhagStructure.length !== vibhagCount ||
      !vibhagStructure.every((size) => isInteger(size) && size > 0) ||
      vibhagStructure.reduce((sum, size) => sum + (size as number), 0) !== matras) return false;
  if (!Array.isArray(bols) || bols.length !== matras || !bols.every(isTalaBol)) return false;
  const expectedVibhags: number[] = [];
  vibhagStructure.forEach((size, group) => { for (let index = 0; index < (size as number); index += 1) expectedVibhags.push(group); });
  if (bols.some((bol, index) => {
    const candidate = bol as Record<string, unknown>;
    return read(candidate, "matra") !== index + 1 || read(candidate, "vibhagIndex") !== expectedVibhags[index];
  })) return false;
  const samCount = bols.filter((bol) => read(bol, "isSam") === true).length;
  if (samCount !== 1 || bols.some((bol) => read(bol, "isTali") === true && read(bol, "isKhali") === true)) return false;
  const tempo = read(value, "practiceTempoBpm");
  if (!isRecord(tempo) || !["thah_bpm", "dugun_bpm", "chaugun_bpm"].every((field) => isSafeTempo(read(tempo, field)))) return false;
  const hasContext = read(value, "context_si") !== undefined;
  const hasContextReference = read(value, "contextSourceReference") !== undefined;
  return hasContext === hasContextReference && (!hasContext || (
    isNonBlankString(read(value, "context_si")) && isSourceReference(read(value, "contextSourceReference"))
  ));
}

function isRaga(value: Record<string, unknown>): boolean {
  if (!hasRequiredStrings(value, ["id", "name_si", "name_en", "thata_si", "arohana_si", "avarohana_si", "vadi_si", "samvadi_si", "jati_si", "time_si", "rasa_si", "pakad_si"]) ||
      !isGradeBandArray(read(value, "gradeBands")) || !isStringArray(read(value, "characteristics_si")) || !isSourceReference(read(value, "sourceReference"))) return false;
  const arohana = read(value, "arohana_swaras");
  const avarohana = read(value, "avarohana_swaras");
  const samplePhrases = read(value, "samplePhrases");
  if (!Array.isArray(arohana) || arohana.length === 0 || !arohana.every(isValidSwaraToken) ||
      !Array.isArray(avarohana) || avarohana.length === 0 || !avarohana.every(isValidSwaraToken)) return false;
  return Array.isArray(samplePhrases) && samplePhrases.length > 0 && samplePhrases.every((phrase) =>
    isRecord(phrase) && hasRequiredStrings(phrase, ["name_si"]) &&
    isStringArray(read(phrase, "swaras")) && (read(phrase, "swaras") as unknown[]).every(isValidSwaraToken));
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
  const ids = canonicalQuestionIds(value.questions);
  return !!ids && new Set(ids).size === ids.length;
}

function isExamPaper(value: Record<string, unknown>): boolean {
  if (!hasRequiredStrings(value, ["id", "title_si"]) || !isGradeBand(value.gradeBand) || !isPositiveNumber(value.timeLimitMinutes) ||
      !isStringArray(value.instructions_si) || !Array.isArray(value.partA_MCQ) || value.partA_MCQ.length === 0 || !value.partA_MCQ.every(isQuestionShape) ||
      !Array.isArray(value.partB_Structured) || value.partB_Structured.length === 0 || !value.partB_Structured.every(isQuestionShape) ||
      !isSourceReference(value.sourceReference) || !isReviewMetadata(value.reviewMetadata)) return false;
  const ids = canonicalQuestionIds([...value.partA_MCQ, ...value.partB_Structured]);
  return !!ids && new Set(ids).size === ids.length;
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
    const keys = new Set(safeOwnEntries(value)?.entries.map((entry) => entry.key) ?? []);
    matches = KIND_SIGNATURES.filter((signature) => signature.keys.every((key) => keys.has(key))).map((signature) => signature.kind);
  } catch {
    return undefined;
  }
  return matches.length === 1 ? matches[0] : undefined;
}

export function validateContentRecord(
  value: unknown,
  expectedKind?: ContentEntityKind,
): ContentContractResult {
  try {
    const snapshot = captureSafeSnapshot(value);
    if (snapshot === undefined) {
      return { kind: expectedKind, isValid: false, issues: [{ field: "record", message: "Record is not a safe plain-data snapshot." }] };
    }
    const inferredKind = identifyContentKind(snapshot);
    const kind = expectedKind ?? inferredKind;
    if (!kind || inferredKind !== kind || !isRecord(snapshot)) {
      return { kind, isValid: false, issues: [{ field: "kind", message: "Record kind is unknown, ambiguous, or does not match the expected contract." }] };
    }
    let valid = false;
    switch (kind) {
      case "lesson": valid = isLesson(snapshot); break;
      case "raga": valid = isRaga(snapshot); break;
      case "tala": valid = isTala(snapshot); break;
      case "instrument": valid = isInstrument(snapshot); break;
      case "cultural-tradition": valid = isCulturalTradition(snapshot); break;
      case "theatre-tradition": valid = isTheatreTradition(snapshot); break;
      case "glossary": valid = isGlossary(snapshot); break;
      case "learning-path": valid = isLearningPath(snapshot); break;
      case "quiz": valid = isQuiz(snapshot); break;
      case "exam-paper": valid = isExamPaper(snapshot); break;
      case "question": valid = isQuestionShape(snapshot); break;
      case "source": valid = isSource(snapshot); break;
      default: valid = false;
    }
    const issues: ContractIssue[] = [];
    if (REQUIRED_METADATA_KINDS.has(kind) && !isReviewMetadata(read(snapshot, "reviewMetadata"))) {
      issues.push({ field: "reviewMetadata", message: "Metadata-bearing records require a complete, finite reviewMetadata object." });
    }
    if (kind === "lesson" && !isPublicationStateConsistent(snapshot)) {
      issues.push({ field: "published", message: "Lesson published flag must agree with reviewMetadata.status." });
    }
    if (!valid) issues.push({ field: "record", message: `Record does not satisfy the complete ${kind} runtime contract.` });
    return { kind, isValid: valid && issues.length === 0, issues };
  } catch {
    return { kind: expectedKind, isValid: false, issues: [{ field: "record", message: "Record could not be safely validated." }] };
  }
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
  question: ["id", "type", "gradeBands", "difficulty", "strandId", "prompt_si", "options_si", "correctAnswerIds", "matchingPairs", "orderingItems", "correctShortAnswer_si", "explanation_si", "markingPoints_si", "sourceReference"],
  source: ["id", "title", "originalFilename", "publisher", "grades", "year", "language", "tier", "location", "status", "license", "url"],
};

const QUESTION_COMMON_PUBLIC_FIELDS = [
  "id", "type", "gradeBands", "difficulty", "strandId", "prompt_si",
  "explanation_si", "markingPoints_si", "sourceReference",
] as const;

const QUESTION_VARIANT_PUBLIC_FIELDS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  mcq: Object.freeze(["options_si", "correctAnswerIds"]),
  "multi-select": Object.freeze(["options_si", "correctAnswerIds"]),
  matching: Object.freeze(["matchingPairs"]),
  ordering: Object.freeze(["orderingItems"]),
  "true-false": Object.freeze(["options_si", "correctAnswerIds"]),
  "short-answer": Object.freeze(["correctShortAnswer_si"]),
});

function questionProjectionFields(source: Record<string, unknown>): readonly string[] | undefined {
  const type = read(source, "type");
  if (typeof type !== "string" || !isPublicQuestionType(type)) return undefined;
  const variantFields = QUESTION_VARIANT_PUBLIC_FIELDS[type];
  return variantFields ? [...QUESTION_COMMON_PUBLIC_FIELDS, ...variantFields] : undefined;
}

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
  "answer-option": ["id", "text_si"],
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
  const snapshot = captureSafeSnapshot(value);
  if (!snapshot || !isRecord(snapshot)) return undefined;
  const inferredKind = identifyContentKind(snapshot);
  if (!inferredKind || inferredKind !== kind) return undefined;
  if (kind === "question" && !isPublicQuestionType(read(snapshot, "type"))) return undefined;
  const root: Record<string, unknown> = {};
  const seen = new WeakMap<object, Map<ProjectionKind, unknown>>();
  let projectedNodes = 1;
  type Work = { source: Record<string, unknown>; target: Record<string, unknown>; kind: ProjectionKind };
  const remember = (source: object, projectionKind: ProjectionKind, target: unknown): void => {
    const byKind = seen.get(source) ?? new Map<ProjectionKind, unknown>();
    byKind.set(projectionKind, target);
    seen.set(source, byKind);
  };
  const lookup = (source: object, projectionKind: ProjectionKind): unknown => seen.get(source)?.get(projectionKind);
  const work: Work[] = [{ source: snapshot, target: root, kind }];
  remember(snapshot, kind, root);
  while (work.length > 0) {
    const current = work.pop() as Work;
    const fields = current.kind === "question"
      ? questionProjectionFields(current.source)
      : NESTED_FIELDS[current.kind];
    if (!fields) return undefined;
    for (const field of fields) {
      if (!hasOwn(current.source, field)) continue;
      const child = read(current.source, field);
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
      const existing = lookup(child, childKind);
      if (existing) {
        current.target[field] = existing;
        continue;
      }
      if (Array.isArray(child)) {
        if (projectedNodes >= MAX_GRAPH_NODES) return undefined;
        const targetArray: unknown[] = [];
        projectedNodes += 1;
        remember(child, childKind, targetArray);
        current.target[field] = targetArray;
        for (let index = child.length - 1; index >= 0; index -= 1) {
          const item = child[index];
          if (item !== null && typeof item === "object") {
            if (childKind === "question" && !isPublicQuestionType(read(item as Record<string, unknown>, "type"))) {
              return undefined;
            }
            const existingItem = lookup(item, childKind);
            if (existingItem) {
              targetArray[index] = existingItem;
              continue;
            }
            if (projectedNodes >= MAX_GRAPH_NODES) return undefined;
            const itemTarget: Record<string, unknown> = {};
            projectedNodes += 1;
            remember(item, childKind, itemTarget);
            targetArray[index] = itemTarget;
            work.push({ source: item as Record<string, unknown>, target: itemTarget, kind: childKind });
          } else targetArray[index] = item;
        }
      } else {
        if (projectedNodes >= MAX_GRAPH_NODES) return undefined;
        const targetObject: Record<string, unknown> = {};
        projectedNodes += 1;
        remember(child, childKind, targetObject);
        current.target[field] = targetObject;
        work.push({ source: child as Record<string, unknown>, target: targetObject, kind: childKind });
      }
    }
    if (current.kind === "lesson" || current.kind === "raga" || current.kind === "tala" || current.kind === "instrument" || current.kind === "cultural-tradition" || current.kind === "theatre-tradition" || current.kind === "learning-path" || current.kind === "exam-paper") {
      if (Object.prototype.hasOwnProperty.call(current.source, "published")) current.target.published = false;
    }
  }
  if (kind === "source") {
    root.publisher = UNKNOWN_PROVENANCE;
    root.year = UNKNOWN_PROVENANCE;
    root.location = UNKNOWN_PROVENANCE;
    root.license = UNKNOWN_PROVENANCE;
    root.tier = "මූලාශ්‍ර වාර්තාව (සනාථ නොකළ)";
    root.status = "Unverified / source review pending";
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

export function isMetadataBearingKind(kind: ContentEntityKind | undefined): boolean {
  return !!kind && REQUIRED_METADATA_KINDS.has(kind);
}

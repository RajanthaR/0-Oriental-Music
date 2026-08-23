import type { ReviewMetadata, SourceReference } from "@/types/content";
import {
  createUnverifiedReviewMetadata as createContractUnverifiedReviewMetadata,
  inspectGraph,
  isMetadataBearingKind,
  isPublicQuestionType,
  isQuestion,
  isSourceReference as isContractSourceReference,
  projectPublicRecord,
  validateContentRecord,
  type ContentEntityKind,
} from "@/lib/validation/content-contracts";
import {
  MAX_GRAPH_DEPTH,
  MAX_GRAPH_NODES,
  PUBLIC_GRADE_BAND_VALUES,
  cloneBoundedRecord,
  deepFreezeBoundedSnapshot,

  isRecord,
  normalizeRecordId,
  readOwnDataField,
  safeOwnEntries,
} from "@/lib/shared/bounded-values";
import {
  getEvidenceRegistrySnapshot,
  parseSourceLocator,
  type EvidenceQuality,
  type SourceDocumentRecord,
  type SourcePageQualityRecord,
} from "@/lib/evidence/source-evidence";
import sourcesData from "@/data/sources.json";
import lessonsData from "@/data/lessons.json";
import ragasData from "@/data/ragas.json";
import talasData from "@/data/talas.json";
import quizzesData from "@/data/quizzes.json";
import examPapersData from "@/data/exam-papers.json";
import instrumentsData from "@/data/instruments.json";
import culturalTraditionsData from "@/data/cultural-traditions.json";
import theatreTraditionsData from "@/data/theatre-traditions.json";
import glossaryData from "@/data/glossary.json";
import learningPathsData from "@/data/learning-paths.json";

export { UNKNOWN_PROVENANCE } from "@/lib/shared/bounded-values";
export type { EvidenceQuality } from "@/lib/evidence/source-evidence";

export {
  PUBLIC_GRADE_BANDS,
  type PublicGradeBand,
  type PublicationState,
  type SourceEvidenceFailureCode,
  type PublicationReasonCode,
  type SourceEvidenceReasonCode,
  type SourceEvidenceDecision,
  type PublicationDecision,
  type NestedPublicationDisposition,
  type SourceDocumentSummary,
  isKnownQuarantinedEntityId,
} from "@/lib/data/decision-types";
export type {
  PublicationCatalogSnapshot,
  PublicationCatalogInputs,
  PublicationEvaluationContext,
} from "@/lib/data/evaluation-state";
import {
  countSourceRecordsById,
  evaluateSourceReference as evaluateSourceReferenceImpl,
  getSourceCorpusInventory as getSourceCorpusInventoryImpl,
  getSourceDocumentSummary as getSourceDocumentSummaryImpl,
  getSourceRecordsById,
  unsafeContextEvidence as unsafeContextEvidenceShared,
} from "@/lib/data/source-evidence-policy";
import { captureEvaluationValue, captureEvaluationArray } from "@/lib/data/snapshot-capture";
export {
  getTalaFieldDisposition,
  type TalaFieldDispositionStatus,
  type TalaFieldDisposition,
  type TalaFieldDispositionField,
  type TalaBolFieldDisposition,
} from "@/lib/data/tala-disposition-policy";
import { getTalaFieldDisposition } from "@/lib/data/tala-disposition-policy";
import {
  getSafeEvaluationState,
  getEvaluationState,
  registerKnownKinds,
  setPublicationEvaluationState,
  type PublicationCatalogInputs,
  type PublicationCatalogSnapshot,
  type PublicationEvaluationContext,
  type PublicationEvaluationState,
} from "@/lib/data/evaluation-state";
import {
  PUBLIC_GRADE_BANDS as publicGradeBands,
  type PublicGradeBand,
  type PublicationState,
  type SourceEvidenceFailureCode,
  type PublicationReasonCode,
  type SourceEvidenceReasonCode,
  type SourceEvidenceDecision,
  type PublicationDecision,
  type NestedPublicationDisposition,
  type SourceDocumentSummary,
  isKnownQuarantinedEntityId,
} from "@/lib/data/decision-types";

export { DEPENDENCY_FIELD_RULES } from "@/lib/data/dependency-rules";
import { DEPENDENCY_FIELD_RULES as dependencyFieldRules } from "@/lib/data/dependency-rules";

const RAW_PUBLICATION_CATALOGS: Array<[ContentEntityKind, keyof PublicationCatalogSnapshot, unknown[]]> = [
  ["lesson", "lessons", lessonsData as unknown[]],
  ["raga", "ragas", ragasData as unknown[]],
  ["tala", "talas", talasData as unknown[]],
  ["instrument", "instruments", instrumentsData as unknown[]],
  ["cultural-tradition", "culturalTraditions", culturalTraditionsData as unknown[]],
  ["theatre-tradition", "theatreTraditions", theatreTraditionsData as unknown[]],
  ["glossary", "glossary", glossaryData as unknown[]],
  ["learning-path", "learningPaths", learningPathsData as unknown[]],
  ["quiz", "quizzes", quizzesData as unknown[]],
  ["exam-paper", "examPapers", examPapersData as unknown[]],
  ["source", "sources", sourcesData as unknown[]],
];

type CatalogInputRead = { present: boolean; safe: boolean; value?: unknown };

function readCatalogInput(
  inputs: PublicationCatalogInputs,
  key: keyof PublicationCatalogSnapshot,
): CatalogInputRead {
  try {
    if (!inputs || typeof inputs !== "object" || Array.isArray(inputs)) {
      return { present: true, safe: false };
    }
    const descriptor = Object.getOwnPropertyDescriptor(inputs, key);
    if (!descriptor) return { present: false, safe: true };
    if (!("value" in descriptor)) return { present: true, safe: false };
    return { present: true, safe: true, value: descriptor.value };
  } catch {
    return { present: true, safe: false };
  }
}

export function createPublicationEvaluationContext(
  catalogInputs: PublicationCatalogInputs = {},
): PublicationEvaluationContext {
  const capturedCatalogs = {} as { -readonly [K in keyof PublicationCatalogSnapshot]: unknown[] };
  const rawCounts = {} as Record<keyof PublicationCatalogSnapshot, number>;
  let safe = true;
  for (const [, key, defaultCatalog] of RAW_PUBLICATION_CATALOGS) {
    const supplied = readCatalogInput(catalogInputs, key);
    if (!supplied.safe) safe = false;
    const rawCatalog = supplied.present ? supplied.value : defaultCatalog;
    const snapshot = captureEvaluationArray(rawCatalog);
    if (!snapshot) safe = false;
    capturedCatalogs[key] = snapshot ?? [];
    rawCounts[key] = snapshot?.length ?? readDeclaredArrayLength(rawCatalog);
  }
  const evidence = getEvidenceRegistrySnapshot();
  const sourceDocuments = [...evidence.sourceDocuments] as SourceDocumentRecord[];
  const sourcePages = [...evidence.sourcePageQuality] as SourcePageQualityRecord[];
  if (!evidence.safe) safe = false;

  Object.freeze(capturedCatalogs);
  const context: PublicationEvaluationContext = Object.freeze({
    catalogs: capturedCatalogs,
    safe,
  });
  const state: PublicationEvaluationState = {
    sourceDocuments,
    sourcePageQuality: sourcePages,
    musicalCoreFieldDispositions: evidence.musicalCoreFieldDispositions,
    knownKinds: new Map<string, ContentEntityKind | "ambiguous">(),
    snapshots: new WeakMap<object, Record<string, unknown>>(),
    stack: new Set<string>(),
    memo: new WeakMap<object, PublicationDecision>(),
    rawCounts: Object.freeze(rawCounts),
  };
  setPublicationEvaluationState(context, state);

  for (const [kind, key] of RAW_PUBLICATION_CATALOGS) {
    const records = context.catalogs[key];
    registerKnownKinds(state.knownKinds, kind, records);
    records.forEach((record) => {
      if (isRecord(record)) state.snapshots.set(record, record);
    });
  }
  return context;
}

function readDeclaredArrayLength(value: unknown): number {
  try {
    if (!Array.isArray(value)) return 0;
    const descriptor = Object.getOwnPropertyDescriptor(value, "length");
    if (!descriptor || !("value" in descriptor)) return 0;
    return typeof descriptor.value === "number" && Number.isSafeInteger(descriptor.value) && descriptor.value >= 0
      ? descriptor.value
      : 0;
  } catch {
    return 0;
  }
}

export function getPublicationCatalogRawCount(
  context: PublicationEvaluationContext,
  catalog: keyof PublicationCatalogSnapshot,
): number {
  try {
    return getEvaluationState(context).rawCounts[catalog] ?? 0;
  } catch {
    return 0;
  }
}

function getKnownContentKind(
  record: unknown,
  context: PublicationEvaluationContext,
): ContentEntityKind | undefined {
  if (!isRecord(record)) return undefined;
  const id = readOwnDataField(record, "id");
  const normalizedId = normalizeRecordId(id);
  if (!normalizedId) return undefined;
  const known = getEvaluationState(context).knownKinds.get(normalizedId);
  return known === "ambiguous" ? undefined : known;
}

type PublicationRecordShape = {
  [key: string]: unknown;
  id?: unknown;
  lessonId?: unknown;
  gradeBand?: unknown;
  gradeBands?: unknown;
  partA_MCQ?: unknown;
  partB_Structured?: unknown;
  questions?: unknown;
  type?: unknown;
  prompt_si?: unknown;
  context_si?: unknown;
  contextSourceReference?: unknown;
  sourceReference?: unknown;
};


export interface ContextClaimPublicationDecision {
  present: boolean;
  isPublic: boolean;
  reasonCode: SourceEvidenceReasonCode | "no-context-claim" | "unpaired-context-claim";
  sourceEvidence: SourceEvidenceDecision;
}

import { toPublicationInput as toPublicationInputImpl, type PublicationInput } from "@/lib/data/source-evidence-policy";
export type { PublicationInput };

function hasUnsupportedGrade(gradeBands: string[]): boolean {
  return gradeBands.includes("12-13");
}

function isSourceReference(value: unknown): value is SourceReference {
  return isContractSourceReference(value);
}

function getRecordShape(record: unknown): PublicationRecordShape {
  return isRecord(record) ? (record as PublicationRecordShape) : {};
}

function getGradeBands(value: PublicationRecordShape): string[] {
  const bands = new Set<string>();
  const gradeBand = readOwnDataField(value, "gradeBand");
  const gradeBands = readOwnDataField(value, "gradeBands");
  if (typeof gradeBand === "string") bands.add(gradeBand);
  if (Array.isArray(gradeBands)) {
    gradeBands.forEach((band) => {
      if (typeof band === "string") bands.add(band);
    });
  }
  return Array.from(bands);
}

export function toPublicationInput(record: unknown): PublicationInput {
  return toPublicationInputImpl(record);
}

export function getSourceDocumentSummary(
  sourceId: string,
  context: PublicationEvaluationContext = createPublicationEvaluationContext(),
): SourceDocumentSummary {
  return getSourceDocumentSummaryImpl(sourceId, context);
}

export function getSourceCorpusInventory(
  context: PublicationEvaluationContext = createPublicationEvaluationContext(),
): SourceCorpusInventory {
  return getSourceCorpusInventoryImpl(context);
}

export type SourceCorpusUnavailableReason = "unsafe-evaluation-context" | "inventory-read-failed";

export type SourceCorpusInventory =
  | {
      available: true;
      sourceRecords: number;
      sourceDocuments: number;
      sourcePages: number;
      qualityCounts: Record<string, number>;
    }
  | {
      available: false;
      reason: SourceCorpusUnavailableReason;
    };
export function evaluateSourceReference(
  reference: SourceReference | undefined,
  context: PublicationEvaluationContext = createPublicationEvaluationContext(),
): SourceEvidenceDecision {
  return evaluateSourceReferenceImpl(reference, context);
}
function hasPublicGrade(gradeBands: string[]): boolean {
  return gradeBands.length > 0 && gradeBands.every(isPublicGradeBand);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isCanonicalGradeBandArray(value: unknown): value is PublicGradeBand[] {
  return Array.isArray(value) && value.length > 0 && value.every(
    (band) => typeof band === "string" && isPublicGradeBand(band)
  );
}

function hasCanonicalQuestionShape(question: unknown): boolean {
  return isQuestion(question) && isPublicQuestionType(readOwnDataField(question, "type"));
}

function bandContainsSourceGrade(band: string, sourceGrades: string[]): boolean {
  if (sourceGrades.includes(band)) return true;
  const match = band.match(/^(\d+)-(\d+)$/);
  if (!match) return false;
  const start = Number(match[1]);
  const end = Number(match[2]);
  return sourceGrades.some((grade) => {
    const numericGrade = Number(grade);
    return Number.isInteger(numericGrade) && numericGrade >= start && numericGrade <= end;
  });
}

function gradeScopeMatchesSource(
  gradeBands: string[],
  sourceId: string | undefined,
  context: PublicationEvaluationContext,
): boolean {
  if (!sourceId) return false;
  if (countSourceRecordsById(sourceId, context) !== 1) return false;
  const matches = getSourceRecordsById(sourceId, context);
  if (matches.length !== 1 || matches[0].grades.length === 0) return false;
  const source = matches[0];
  return gradeBands.every((band) => bandContainsSourceGrade(band, source.grades));
}


function collectDependencyDispositions(
  value: unknown,
  path: string,
  seen: WeakSet<object>,
  results: NestedPublicationDisposition[],
  decisionContext: PublicationEvaluationContext,
  graphSafety?: ReturnType<typeof inspectGraph>
): void {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  if (graphSafety && !graphSafety.safe) return;

  type PendingNode = { value: unknown; path: string; depth: number };
  const pending: PendingNode[] = [{ value, path, depth: 0 }];
  let nodes = 0;
  const addDependency = (
    dependencyId: unknown,
    dependencyPath: string,
    blocking: boolean,
    records: readonly unknown[]
  ): void => {
    const dependency = isNonBlankString(dependencyId)
      ? records.find((candidate) => {
          if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
          return normalizeRecordId(readOwnDataField(candidate, "id")) === normalizeRecordId(dependencyId);
        })
      : undefined;
    const decision = dependency ? getRecordPublicationDecisionInternal(dependency, decisionContext) : undefined;
    const isPublic = Boolean(decision?.isPublic);
    results.push({
      path: dependencyPath,
      isPublic,
      blocking,
      reasonCodes: isPublic ? [] : Array.from(new Set<PublicationReasonCode>([
        ...(decision?.reasonCodes ?? []),
        "dependent-entity-unavailable",
      ])),
    });
  };

  while (pending.length > 0) {
    const current = pending.pop() as PendingNode;
    if (!current.value || typeof current.value !== "object" || seen.has(current.value)) continue;
    if (current.depth > MAX_GRAPH_DEPTH || nodes >= MAX_GRAPH_NODES) return;
    seen.add(current.value);
    nodes += 1;
    if (Array.isArray(current.value)) {
      for (let index = current.value.length - 1; index >= 0; index -= 1) {
        pending.push({ value: current.value[index], path: `${current.path}[${index}]`, depth: current.depth + 1 });
      }
      continue;
    }
    const record = current.value as Record<string, unknown>;
    const prefix = current.path ? `${current.path}.` : "";
    const prerequisites = readOwnDataField(record, "prerequisites");
    const prerequisiteRule = dependencyFieldRules.get("prerequisites");
    if (prerequisiteRule && Array.isArray(prerequisites)) {
      prerequisites.forEach((dependencyId, index) => addDependency(
        dependencyId,
        `${prefix}prerequisites[${index}]`,
        prerequisiteRule.blocking,
        decisionContext.catalogs[prerequisiteRule.catalog],
      ));
    }
    const steps = readOwnDataField(record, "steps");
    const stepRule = dependencyFieldRules.get("steps[].lessonId");
    if (stepRule && Array.isArray(steps)) {
      steps.forEach((step, index) => {
        const lessonId = step && typeof step === "object" && !Array.isArray(step)
          ? readOwnDataField(step, "lessonId")
          : undefined;
        addDependency(
          lessonId,
          `${prefix}steps[${index}].lessonId`,
          stepRule.blocking,
          decisionContext.catalogs[stepRule.catalog],
        );
      });
    }
    // One descriptor snapshot per record: iterating safeOwnEntries() entries
    // keeps this walk linear. Re-reading each key through readOwnDataField()
    // here made wide records quadratic (O(keys²) descriptor reads), which is
    // what dominated the budget-scale boundary workload.
    const own = safeOwnEntries(record);
    if (!own) return;
    for (const { key, value: child } of own.entries) {
      if (key === "prerequisites" || key === "steps" || key === "lessonId") continue;
      const childPath = `${prefix}${key}`;
      const dependencyRule = dependencyFieldRules.get(key);
      if (dependencyRule) {
        addDependency(child, childPath, dependencyRule.blocking, decisionContext.catalogs[dependencyRule.catalog]);
      }
      if (child && typeof child === "object") pending.push({ value: child, path: childPath, depth: current.depth + 1 });
    }
  }
}

function hasCanonicalRuntimeShape(
  value: unknown,
  knownKind?: ContentEntityKind,
  context?: PublicationEvaluationContext,
): boolean {
  const kind = knownKind ?? (context ? getKnownContentKind(value, context) : undefined);
  return !!kind && validateContentRecord(value, kind).isValid;
}

/**
 * Evidence-only decision for a record that has already passed the complete
 * runtime contract at the caller boundary.  Keep this private: exposing the
 * reduced shape would let callers skip kind, metadata, graph, and dependency
 * checks.
 */
function getBasePublicationDecision(
  input: PublicationInput,
  context: PublicationEvaluationContext,
): PublicationDecision {
  try {
    const value = isRecord(input) ? input : {};
    const idValue = readOwnDataField(value, "id");
    const id = typeof idValue === "string" ? idValue : "";
    const gradeBands = getGradeBands(value);
    const referenceValue = readOwnDataField(value, "sourceReference");
    const sourceReference = isSourceReference(referenceValue) ? referenceValue : undefined;
    const sourceEvidence = evaluateSourceReference(sourceReference, context);
    const reasonCodes: PublicationReasonCode[] = [];

    if (hasUnsupportedGrade(gradeBands) || (gradeBands.length > 0 && !hasPublicGrade(gradeBands))) {
      reasonCodes.push("unsupported-grade");
    }
    if (isKnownQuarantinedEntityId(id)) reasonCodes.push("known-forensic-issue");
    if (gradeBands.length === 0) reasonCodes.push("missing-grade-scope");
    if (gradeBands.length > 0 && !gradeScopeMatchesSource(gradeBands, sourceReference ? readOwnDataField(sourceReference, "sourceId") as string : undefined, context)) {
      reasonCodes.push("source-grade-mismatch");
    }
    if (sourceEvidence.reasonCode !== "supportable") reasonCodes.push(sourceEvidence.reasonCode);

    const sourceId = sourceReference ? readOwnDataField(sourceReference, "sourceId") : undefined;
    const quarantined = hasUnsupportedGrade(gradeBands) || isKnownQuarantinedEntityId(id);
    const publicByEvidence =
      hasPublicGrade(gradeBands) &&
      gradeScopeMatchesSource(gradeBands, typeof sourceId === "string" ? sourceId : undefined, context) &&
      sourceEvidence.supportable;
    const state: PublicationState = quarantined
      ? "quarantined"
      : publicByEvidence
      ? "public"
      : "needs-review";

    return {
      state,
      isPublic: state === "public",
      gradeBands,
      reasonCodes: Array.from(new Set(reasonCodes)),
      sourceEvidence,
      reviewState: "needs-review",
      nestedDispositions: [],
      withheldFields: [],
    };
  } catch {
    return failClosedRecordDecision(["malformed-record"], context);
  }
}

function getQuizContainerPublicationDecision(
  record: unknown,
  context: PublicationEvaluationContext,
): PublicationDecision {
  const value = getRecordShape(record);
  const rawId = readOwnDataField(value, "id");
  const id = isNonBlankString(rawId) ? rawId : "";
  const gradeBands = getGradeBands(value);
  const reasonCodes: PublicationReasonCode[] = [];
  if (gradeBands.length === 0) reasonCodes.push("missing-grade-scope");
  if (!hasPublicGrade(gradeBands)) reasonCodes.push("unsupported-grade");
  if (isKnownQuarantinedEntityId(id)) reasonCodes.push("known-forensic-issue");
  const isPublic = hasPublicGrade(gradeBands) && !isKnownQuarantinedEntityId(id);
  return {
    state: isKnownQuarantinedEntityId(id) ? "quarantined" : isPublic ? "public" : "needs-review",
    isPublic,
    gradeBands,
    reasonCodes: Array.from(new Set(reasonCodes)),
    sourceEvidence: evaluateSourceReference(undefined, context),
    reviewState: "needs-review",
    nestedDispositions: [],
    withheldFields: [],
  };
}

function failClosedRecordDecision(
  reasonCodes: PublicationReasonCode[],
  context?: PublicationEvaluationContext,
): PublicationDecision {
  return {
    state: "needs-review",
    isPublic: false,
    gradeBands: [],
    reasonCodes: Array.from(new Set(reasonCodes)),
    sourceEvidence: evaluateSourceReference(undefined, context),
    reviewState: "needs-review",
    nestedDispositions: [],
    withheldFields: [],
  };
}

type PublicationDecisionContext = PublicationEvaluationContext;

function getRecordPublicationDecisionInternal(
  record: unknown,
  decisionContext: PublicationDecisionContext,
  knownSnapshot?: unknown,
): PublicationDecision {
  const state = getEvaluationState(decisionContext);
  const originalObject = record !== null && typeof record === "object" ? record as object : undefined;
  const cached = originalObject ? state.memo.get(originalObject) : undefined;
  if (cached) return cached;
  const finish = (decision: PublicationDecision, cacheable = true): PublicationDecision => {
    if (originalObject && cacheable) state.memo.set(originalObject, decision);
    return decision;
  };
  if (!decisionContext.safe) return finish(failClosedRecordDecision(["malformed-record"], decisionContext));
  const graphSafety = inspectGraph(record);
  if (!graphSafety.safe) return finish(failClosedRecordDecision(["malformed-record"], decisionContext));
  const safeRecord = (originalObject && state.snapshots.get(originalObject)) ??
    knownSnapshot ?? cloneBoundedRecord(record, graphSafety);
  if (!safeRecord || !isRecord(safeRecord)) return finish(failClosedRecordDecision(["malformed-record"], decisionContext));
  if (originalObject) state.snapshots.set(originalObject, safeRecord as Record<string, unknown>);
  const knownKind = getKnownContentKind(safeRecord, decisionContext);
  if (!knownKind) return finish(failClosedRecordDecision(["unknown-record-kind", "malformed-record"], decisionContext));

  const hasValidRuntimeShape = hasCanonicalRuntimeShape(safeRecord, knownKind, decisionContext);
  const value = getRecordShape(safeRecord);
  const rawRecordId = readOwnDataField(value, "id");
  const recordId = normalizeRecordId(rawRecordId);
  const isQuiz = decisionContext.catalogs.quizzes.some((quiz) => normalizeRecordId(readOwnDataField(quiz, "id")) === recordId);
  const baseDecision = isQuiz
    ? getQuizContainerPublicationDecision(safeRecord, decisionContext)
    : getBasePublicationDecision(toPublicationInputImpl(safeRecord), decisionContext);
  const reasonCodes = new Set(baseDecision.reasonCodes);
  const nestedDispositions = [...baseDecision.nestedDispositions];
  const withheldFields = [...baseDecision.withheldFields];
  if (recordId && state.stack.has(recordId)) {
    return {
      ...baseDecision,
      state: "needs-review",
      isPublic: false,
      reasonCodes: Array.from(new Set<PublicationReasonCode>([...baseDecision.reasonCodes, "dependency-cycle"])),
    };
  }
  if (state.stack.size >= 256) {
    return finish({
      ...baseDecision,
      state: "needs-review",
      isPublic: false,
      reasonCodes: Array.from(new Set<PublicationReasonCode>([...baseDecision.reasonCodes, "malformed-record"])),
    });
  }
  if (recordId) state.stack.add(recordId);
  try {
  if (!hasValidRuntimeShape) reasonCodes.add("malformed-record");
  if (Array.isArray(value.gradeBands) && !isCanonicalGradeBandArray(value.gradeBands)) {
    reasonCodes.add("unsupported-grade");
  }

  const contextDecision = getContextClaimPublicationDecision(safeRecord, decisionContext);
  if (contextDecision.present && !contextDecision.isPublic) {
    if (contextDecision.reasonCode === "no-context-claim" || contextDecision.reasonCode === "unpaired-context-claim") {
      reasonCodes.add("unpaired-context-claim");
    } else if (contextDecision.reasonCode !== "supportable") {
      reasonCodes.add(contextDecision.reasonCode);
    }
    withheldFields.push("context_si", "contextSourceReference");
  }

  const isTalaRecord = decisionContext.catalogs.talas.some((tala) => normalizeRecordId(readOwnDataField(tala, "id")) === normalizeRecordId(recordId));
  const talaDisposition = getTalaFieldDisposition(safeRecord, decisionContext);
  if (isTalaRecord && (!talaDisposition || !talaDisposition.allRequiredFieldsVerified)) {
    reasonCodes.add("field-disposition-needs-review");
    withheldFields.push("context", "theka", "bols");
  }

  collectDependencyDispositions(safeRecord, "", new WeakSet<object>(), nestedDispositions, decisionContext, graphSafety);
  const hasBlockingDependency = nestedDispositions.some(
    (disposition) => disposition.blocking && !disposition.isPublic
  );
  if (hasBlockingDependency) {
    reasonCodes.add("dependent-entity-unavailable");
  }
  if (nestedDispositions.some(
    (disposition) => disposition.blocking && disposition.reasonCodes.includes("dependency-cycle")
  )) {
    reasonCodes.add("dependency-cycle");
  }

  const isExam = decisionContext.catalogs.examPapers.some((paper) => normalizeRecordId(readOwnDataField(paper, "id")) === recordId);
  if (!isQuiz && !isExam) {
    const quarantined = baseDecision.state === "quarantined";
    const contextIsPublic = !contextDecision.present || contextDecision.isPublic;
    const talaFieldsArePublic = !isTalaRecord || Boolean(talaDisposition?.allRequiredFieldsVerified);
    const isPublic = baseDecision.isPublic && hasValidRuntimeShape && contextIsPublic &&
      talaFieldsArePublic && !hasBlockingDependency;
    const decision: PublicationDecision = {
      ...baseDecision,
      state: quarantined ? "quarantined" : isPublic ? "public" : "needs-review",
      isPublic,
      reasonCodes: Array.from(reasonCodes),
      nestedDispositions,
      withheldFields: Array.from(new Set(withheldFields)),
    };
    return finish(decision);
  }

  const lessonId = readOwnDataField(value, "lessonId");
  const normalizedLessonId = normalizeRecordId(lessonId);
  const parent = isQuiz && normalizedLessonId
    ? decisionContext.catalogs.lessons.find((lesson) => normalizeRecordId(readOwnDataField(lesson, "id")) === normalizedLessonId)
    : undefined;
  const parentIsActiveBacklink = isQuiz && !!normalizedLessonId && state.stack.has(normalizedLessonId);
  const parentIsPublic = !isQuiz || (!!parent && (
    parentIsActiveBacklink || getRecordPublicationDecisionInternal(parent, decisionContext, parent).isPublic
  ));
  if (isQuiz) {
    const parentRule = dependencyFieldRules.get("lessonId");
    if (!parentRule) throw new Error("Missing dependency rule for lessonId");
    nestedDispositions.push({
      path: "lessonId",
      isPublic: parentIsPublic,
      blocking: parentRule.blocking,
      reasonCodes: parentIsPublic ? [] : ["parent-lesson-unavailable", "dependent-entity-unavailable"],
    });
    if (!parentIsPublic) reasonCodes.add("parent-lesson-unavailable");
  }
  const nestedGroups = isQuiz
    ? [{ path: "questions", items: readOwnDataField(value, "questions") }]
    : [
        { path: "partA_MCQ", items: readOwnDataField(value, "partA_MCQ") },
        { path: "partB_Structured", items: readOwnDataField(value, "partB_Structured") },
      ];
  if (nestedGroups.some((group) => !Array.isArray(group.items) || group.items.length === 0)) {
    reasonCodes.add("empty-question-set");
  }

  const questionsArePublic = nestedGroups.every((group) => Array.isArray(group.items) && group.items.length > 0 && group.items.every((question, index) => {
    const questionShape = getRecordShape(question);
    const hasExplicitGrades = isCanonicalGradeBandArray(readOwnDataField(questionShape, "gradeBands"));
    const hasDirectSource = isSourceReference(readOwnDataField(questionShape, "sourceReference"));
    const hasValidQuestionShape = hasCanonicalQuestionShape(question);
    const decision = getBasePublicationDecision(toPublicationInputImpl(question), decisionContext);
    nestedDispositions.push({
      path: `${group.path}[${index}]`,
      isPublic: decision.isPublic,
      blocking: true,
      reasonCodes: decision.reasonCodes,
    });
    if (!hasValidQuestionShape) reasonCodes.add("malformed-record");
    return hasExplicitGrades && hasDirectSource && hasValidQuestionShape && decision.isPublic;
  }));
  if (!questionsArePublic) reasonCodes.add("nested-question-unpublishable");

  const isPublic = baseDecision.isPublic && hasValidRuntimeShape && parentIsPublic && questionsArePublic &&
    !nestedDispositions.some((disposition) => disposition.blocking && !disposition.isPublic);
  const decision: PublicationDecision = {
    ...baseDecision,
    state: isPublic ? "public" : baseDecision.state === "quarantined" ? "quarantined" : "needs-review",
    isPublic,
    reasonCodes: Array.from(reasonCodes),
    nestedDispositions,
    withheldFields: Array.from(new Set(withheldFields)),
  };
  const dependsOnActiveBacklink = parentIsActiveBacklink || nestedDispositions.some(
    (disposition) => disposition.reasonCodes.includes("dependency-cycle")
  );
  return finish(decision, !dependsOnActiveBacklink);
  } finally {
    if (recordId) state.stack.delete(recordId);
  }
}

export function getRecordPublicationDecision(
  record: unknown,
  evaluationContext: PublicationEvaluationContext = createPublicationEvaluationContext(),
): PublicationDecision {
  const evaluation = evaluatePublicationBatch([record], evaluationContext);
  return evaluation.decisions[0] ?? failClosedRecordDecision(
    [evaluation.failureReason ?? "malformed-record"],
    evaluationContext,
  );
}

/**
 * Structured result for the checked batch boundary.  The public decision-list
 * wrapper below intentionally returns an empty list for malformed outer
 * containers so callers cannot mistake partial evaluation for a complete one.
 */
export interface PublicationBatchEvaluation {
  isValid: boolean;
  decisions: PublicationDecision[];
  failureReason?: "non-array" | "unsafe-container" | "evaluation-failed";
}

export function evaluatePublicationBatch(
  records: unknown,
  evaluationContext: PublicationEvaluationContext = createPublicationEvaluationContext(),
): PublicationBatchEvaluation {
  try {
    if (!evaluationContext.safe) {
      return { isValid: false, decisions: [], failureReason: "unsafe-container" };
    }
    if (!Array.isArray(records)) {
      return { isValid: false, decisions: [], failureReason: "non-array" };
    }
    const trustedSnapshot = Object.values(evaluationContext.catalogs).find((catalog) => catalog === records);
    const snapshot = trustedSnapshot ?? captureEvaluationArray(records);
    if (!snapshot) return { isValid: false, decisions: [], failureReason: "unsafe-container" };
    const seenIds = new Set<string>();
    const hasDuplicateId = snapshot.some((record) => {
      if (!isRecord(record)) return false;
      const id = readOwnDataField(record, "id");
      if (typeof id !== "string" || !id.trim()) return false;
      const normalizedId = normalizeRecordId(id);
      if (!normalizedId) return false;
      if (seenIds.has(normalizedId)) return true;
      seenIds.add(normalizedId);
      return false;
    });
    if (hasDuplicateId) {
      return {
        isValid: true,
        decisions: snapshot.map(() => failClosedRecordDecision(["duplicate-record-id"], evaluationContext)),
      };
    }
    const decisions = snapshot.map((record) => {
      if (isRecord(record)) getEvaluationState(evaluationContext).snapshots.set(record, record);
      const decision = getRecordPublicationDecisionInternal(record, evaluationContext, record);
      if (!decision.isPublic) return decision;
      const publicProjection = sanitizePublicRecordWithDecision(record, decision, evaluationContext);
      if (!publicProjection) {
        return {
          ...decision,
          state: "needs-review" as const,
          isPublic: false,
          reasonCodes: Array.from(new Set([...decision.reasonCodes, "evaluation-failed" as const])),
        };
      }
      return {
        ...decision,
        publicProjection,
      };
    });
    return { isValid: true, decisions };
  } catch {
    return { isValid: false, decisions: [], failureReason: "evaluation-failed" };
  }
}

export function getRecordPublicationDecisions(
  records: unknown,
  evaluationContext?: PublicationEvaluationContext,
): PublicationDecision[] {
  const evaluation = evaluatePublicationBatch(records, evaluationContext ?? createPublicationEvaluationContext());
  return evaluation.isValid ? evaluation.decisions : [];
}

/**
 * Complete public-boundary decision API.  Callers must provide the raw record;
 * reduced PublicationInput values are intentionally treated as unknown kinds
 * and cannot bypass the runtime contract, metadata, graph, or dependency
 * gates.
 */
export function getPublicationDecision(record: unknown): PublicationDecision {
  return getRecordPublicationDecision(record);
}

export const getQuizPublicationDecision = getRecordPublicationDecision;

export function getContextClaimPublicationDecision(
  record: unknown,
  context: PublicationEvaluationContext = createPublicationEvaluationContext(),
): ContextClaimPublicationDecision {
  try {
    if (!getSafeEvaluationState(context)) {
      return {
        present: false,
        isPublic: false,
        reasonCode: "unsafe-evaluation-context",
        sourceEvidence: unsafeContextEvidenceShared(),
      };
    }
    const recordSnapshot = captureEvaluationValue(record, false);
    const value = getRecordShape(recordSnapshot);
    const contextValue = readOwnDataField(value, "context_si");
    const referenceValue = readOwnDataField(value, "contextSourceReference");
    const hasContext = typeof contextValue === "string" && contextValue.trim().length > 0;
    const hasReference = isSourceReference(referenceValue);
    const contextSourceReference: SourceReference | undefined = hasReference
      ? referenceValue
      : undefined;
    const hasOwnField = (field: string): boolean => {
      try {
        return Object.getOwnPropertyDescriptor(value, field) !== undefined;
      } catch {
        return false;
      }
    };
    const present = hasOwnField("context_si") || hasOwnField("contextSourceReference");
    const sourceEvidence = evaluateSourceReference(contextSourceReference, context);
    if (!present) {
      return { present: false, isPublic: false, reasonCode: "no-context-claim", sourceEvidence };
    }
    if (!hasContext || !hasReference) {
      return { present: true, isPublic: false, reasonCode: "unpaired-context-claim", sourceEvidence };
    }
    const declaredGrades = getGradeBands(value);
    const sourceId = readOwnDataField(contextSourceReference, "sourceId");
    if (!gradeScopeMatchesSource(declaredGrades, typeof sourceId === "string" ? sourceId : undefined, context)) {
      return {
        present: true,
        isPublic: false,
        reasonCode: "source-grade-mismatch",
        sourceEvidence,
      };
    }
    return {
      present: true,
      isPublic: sourceEvidence.supportable,
      reasonCode: sourceEvidence.reasonCode,
      sourceEvidence,
    };
  } catch {
    return {
      present: true,
      isPublic: false,
      reasonCode: "unpaired-context-claim",
      sourceEvidence: evaluateSourceReference(undefined, context),
    };
  }
}

export function createUnverifiedReviewMetadata(): ReviewMetadata {
  return createContractUnverifiedReviewMetadata() as unknown as ReviewMetadata;
}

export function sanitizePublicRecord<T>(record: T): T | undefined {
  const decisions = getRecordPublicationDecisions([record]);
  return decisions[0]?.publicProjection as T | undefined;
}

function sanitizePublicRecordWithDecision<T>(
  record: T,
  decision: PublicationDecision,
  context: PublicationEvaluationContext,
): T | undefined {
  if (!record || typeof record !== "object" || !decision.isPublic) return undefined;
  try {
    const kind = getKnownContentKind(record, context);
    if (!kind) return undefined;
    const projected = projectPublicRecord(record, kind);
    const value = (isRecord(projected) ? projected : undefined) as Record<string, unknown> | undefined;
    if (!value) return undefined;
    if (isMetadataBearingKind(kind)) value.reviewMetadata = createUnverifiedReviewMetadata();
    if ("published" in value) value.published = false;
    const contextDecision = getContextClaimPublicationDecision(record, context);
    if (contextDecision.present && !contextDecision.isPublic) {
      delete value.context_si;
      delete value.contextSourceReference;
    }
    decision.nestedDispositions.forEach((disposition) => {
      if (disposition.isPublic || disposition.blocking) return;
      if (disposition.path === "nextRecommendedLessonId") delete value.nextRecommendedLessonId;
      if (disposition.path === "quizId") delete value.quizId;
      if (disposition.path === "nextRecommendedPathId") delete value.nextRecommendedPathId;
    });
    return value as T;
  } catch {
    return undefined;
  }
}

export function sanitizeReviewRecord<T>(
  record: T,
  context: PublicationEvaluationContext = createPublicationEvaluationContext(),
): T | undefined {
  if (!record || typeof record !== "object") return undefined;
  try {
    if (!context.safe) return undefined;
    const value = captureEvaluationValue(record, false) as Record<string, unknown> | undefined;
    if (!value || !isRecord(value)) return undefined;
    const kind = getKnownContentKind(value, context);
    if (!kind) return undefined;
    if (isMetadataBearingKind(kind)) value.reviewMetadata = createUnverifiedReviewMetadata();
    if ("published" in value) value.published = false;
    return value as T;
  } catch {
    return undefined;
  }
}

export function formatPublicSourceReference(reference: SourceReference): string {
  const evidence = evaluateSourceReference(reference);
  if (!evidence.supportable || evidence.pageNumbers.length === 0) return "මූලාශ්‍ර පිටු සනාථ කර නොමැත";
  const pageLabel = evidence.pageNumbers.length === 1 ? "පිටුව" : "පිටු";
  return `${pageLabel} ${evidence.pageNumbers.join(", ")}`;
}

export function isPublicGradeBand(value: string): value is PublicGradeBand {
  return publicGradeBands.includes(value as PublicGradeBand);
}
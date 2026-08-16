import type { ReviewMetadata, SourceReference } from "@/types/content";
import {
  cloneBoundedRecord,
  createUnverifiedReviewMetadata as createContractUnverifiedReviewMetadata,
  inspectGraph,
  MAX_GRAPH_DEPTH,
  MAX_GRAPH_NODES,
  isMetadataBearingKind,
  isPublicQuestionType,
  isRecord,
  isQuestion,
  isSourceReference as isContractSourceReference,
  readOwnDataField,
  projectPublicRecord,
  validateContentRecord,
  type ContentEntityKind,
} from "@/lib/validation/content-contracts";
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
import sourceDocumentsData from "../../../data/source-documents.json";
import sourcePageQualityData from "../../../data/source-page-quality.json";
import musicalCoreFieldDispositionsData from "../../../data/musical-core-field-dispositions.json";

export const UNKNOWN_PROVENANCE = "නොදනී / සනාථ වී නැත";

export const PUBLIC_GRADE_BANDS = ["6-7", "8-9", "10-11"] as const;
export type PublicGradeBand = (typeof PUBLIC_GRADE_BANDS)[number];

export type PublicationState = "public" | "quarantined" | "needs-review";
export type EvidenceQuality = "A" | "B" | "C" | "D" | "mixed" | "missing";

export type SourceEvidenceFailureCode =
  | "missing-source-reference"
  | "unknown-source"
  | "ambiguous-source-record"
  | "ambiguous-source-document"
  | "source-document-needs-review"
  | "mismatched-source-document"
  | "missing-page-evidence"
  | "page-out-of-range"
  | "low-quality-page-evidence"
  | "source-grade-mismatch";

export type PublicationReasonCode =
  | "unsupported-grade"
  | "known-forensic-issue"
  | "missing-grade-scope"
  | "parent-lesson-unavailable"
  | "empty-question-set"
  | "nested-question-unpublishable"
  | "unpaired-context-claim"
  | "field-disposition-needs-review"
  | "dependent-entity-unavailable"
  | "dependency-cycle"
  | "malformed-record"
  | "unknown-record-kind"
  | SourceEvidenceFailureCode;

export type SourceEvidenceReasonCode = SourceEvidenceFailureCode | "supportable";

export interface SourceEvidenceDecision {
  sourceId?: string;
  documentId?: string;
  documentSlug?: string;
  pageNumbers: number[];
  quality: EvidenceQuality;
  supportable: boolean;
  reasonCode: SourceEvidenceReasonCode;
  reason: string;
}

export interface PublicationDecision {
  state: PublicationState;
  isPublic: boolean;
  gradeBands: string[];
  reasonCodes: PublicationReasonCode[];
  sourceEvidence: SourceEvidenceDecision;
  reviewState: "needs-review";
  nestedDispositions: NestedPublicationDisposition[];
  withheldFields: string[];
  /** The exact sanitized value public repositories may expose. */
  publicProjection?: unknown;
}

export interface NestedPublicationDisposition {
  path: string;
  isPublic: boolean;
  blocking: boolean;
  reasonCodes: PublicationReasonCode[];
}

export interface SourceDocumentSummary {
  documentId?: string;
  documentSlug?: string;
  reviewStatus: string;
  pageCount: number;
  evidenceQuality: EvidenceQuality;
}

/**
 * These identifiers are intentionally retained in the raw datasets and are
 * blocked centrally until a later phase supplies claim-level correction
 * evidence. A route must never decide this independently.
 */
export const KNOWN_QUARANTINED_ENTITY_IDS = new Set([
  "les-raga-bhairav",
  "les-exam-skills",
  "raga-bhairav",
  "tala-roopak",
  "tala-lawani",
  "tala-khemta",
  "exam-al-model-01",
  "path-exam-prep",
  "term-sound",
  "term-ahata-nada",
  "term-anahata-nada",
]);

type SourceDocumentRecord = {
  id: string;
  slug: string;
  originalFilename: string;
  pageCount: number;
  reviewStatus: string;
};

const sourceDocuments = sourceDocumentsData as SourceDocumentRecord[];

const sourcePageQuality = sourcePageQualityData as Array<{
  documentSlug: string;
  pageNumber: number;
  confidence: EvidenceQuality;
  hasSinhalaText: boolean;
}>;

type SourceRecord = {
  id: string;
  originalFilename: string;
  grades: string[];
};

function getValidatedSourceRecords(): SourceRecord[] {
  return (sourcesData as unknown[]).flatMap((candidate) =>
    validateContentRecord(candidate, "source").isValid && isRecord(candidate)
      ? [candidate as unknown as SourceRecord]
      : []
  );
}

function getSourceRecordsById(sourceId: string): SourceRecord[] {
  const matches: SourceRecord[] = [];
  for (const candidate of sourcesData as unknown[]) {
    if (!isRecord(candidate) || readOwnDataField(candidate, "id") !== sourceId) continue;
    if (!validateContentRecord(candidate, "source").isValid) continue;
    const detached = cloneBoundedRecord(candidate);
    if (detached && isRecord(detached)) matches.push(detached as unknown as SourceRecord);
  }
  return matches;
}

function countSourceRecordsById(sourceId: string): number {
  let count = 0;
  for (const candidate of sourcesData as unknown[]) {
    if (isRecord(candidate) && readOwnDataField(candidate, "id") === sourceId) count += 1;
  }
  return count;
}

const KNOWN_KIND_BY_ID = new Map<string, ContentEntityKind | "ambiguous">();
const registerKnownKinds = (kind: ContentEntityKind, records: unknown[]): void => {
  records.forEach((record) => {
    if (!isRecord(record)) return;
    const id = readOwnDataField(record, "id");
    if (typeof id !== "string" || !id) return;
    const previous = KNOWN_KIND_BY_ID.get(id);
    KNOWN_KIND_BY_ID.set(id, previous ? "ambiguous" : kind);
  });
};
registerKnownKinds("lesson", lessonsData);
registerKnownKinds("raga", ragasData);
registerKnownKinds("tala", talasData);
registerKnownKinds("instrument", instrumentsData);
registerKnownKinds("cultural-tradition", culturalTraditionsData);
registerKnownKinds("theatre-tradition", theatreTraditionsData);
registerKnownKinds("glossary", glossaryData);
registerKnownKinds("learning-path", learningPathsData);
registerKnownKinds("quiz", quizzesData);
registerKnownKinds("exam-paper", examPapersData);
registerKnownKinds("source", sourcesData);

const KNOWN_KIND_CATALOGS: Array<[ContentEntityKind, unknown[]]> = [
  ["lesson", lessonsData], ["raga", ragasData], ["tala", talasData],
  ["instrument", instrumentsData], ["cultural-tradition", culturalTraditionsData],
  ["theatre-tradition", theatreTraditionsData], ["glossary", glossaryData],
  ["learning-path", learningPathsData], ["quiz", quizzesData], ["exam-paper", examPapersData],
  ["source", sourcesData],
];
let knownKindCatalogLengths = KNOWN_KIND_CATALOGS.map(([, records]) => records.length);
function refreshKnownKindIndexIfCatalogSizesChanged(): void {
  const lengths = KNOWN_KIND_CATALOGS.map(([, records]) => records.length);
  if (lengths.every((length, index) => length === knownKindCatalogLengths[index])) return;
  KNOWN_KIND_BY_ID.clear();
  KNOWN_KIND_CATALOGS.forEach(([kind, records]) => registerKnownKinds(kind, records));
  knownKindCatalogLengths = lengths;
}

function getKnownContentKind(record: unknown): ContentEntityKind | undefined {
  if (!isRecord(record)) return undefined;
  const id = readOwnDataField(record, "id");
  if (typeof id !== "string" || !id) return undefined;
  refreshKnownKindIndexIfCatalogSizesChanged();
  const known = KNOWN_KIND_BY_ID.get(id);
  if (known === "ambiguous") return undefined;
  return known;
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

export type TalaFieldDispositionStatus = "verified" | "needs-review";

export interface TalaFieldDisposition {
  talaId: string;
  context: TalaFieldDispositionField;
  theka: TalaFieldDispositionField;
  bols: TalaBolFieldDisposition[];
  allRequiredFieldsVerified: boolean;
}

export interface TalaFieldDispositionField {
  status: TalaFieldDispositionStatus;
  value?: string;
  sourceReference?: SourceReference;
  quality: EvidenceQuality | "N/A";
  issueId: string;
  scope?: "claim" | "not-claimed";
}

export interface TalaBolFieldDisposition extends TalaFieldDispositionField {
  matra: number;
}

const talaFieldDispositions = musicalCoreFieldDispositionsData as {
  requiredFields: string[];
  unclosedRequiredFields: string[];
  talas: Array<{
    talaId: string;
    context: TalaFieldDispositionField;
    theka: TalaFieldDispositionField;
    bols: TalaBolFieldDisposition[];
  }>;
};

export interface ContextClaimPublicationDecision {
  present: boolean;
  isPublic: boolean;
  reasonCode: SourceEvidenceReasonCode | "no-context-claim" | "unpaired-context-claim";
  sourceEvidence: SourceEvidenceDecision;
}

export interface PublicationInput {
  id: string;
  gradeBands: string[];
  sourceReference?: SourceReference;
}

type SourceResolution =
  | { status: "missing-source" }
  | { status: "ambiguous-source-record" }
  | { status: "missing-document" }
  | { status: "ambiguous-document" }
  | { status: "found"; document: SourceDocumentRecord };

function resolveSourceDocument(sourceId: string): SourceResolution {
  if (countSourceRecordsById(sourceId) > 1) return { status: "ambiguous-source-record" };
  const sourceMatches = getSourceRecordsById(sourceId);
  if (sourceMatches.length === 0) return { status: "missing-source" };
  if (sourceMatches.length > 1) return { status: "ambiguous-source-record" };
  const source = sourceMatches[0];

  const matches = sourceDocuments.filter(
    (document) => document.originalFilename === source.originalFilename
  );
  if (matches.length === 0) return { status: "missing-document" };
  if (matches.length > 1) return { status: "ambiguous-document" };
  return { status: "found", document: matches[0] };
}

type LocatorParseResult = {
  pageNumbers: number[];
  mismatchedDocument: boolean;
  malformed: boolean;
};

function parseSourceLocator(pageOrSection: string, expectedFilename: string): LocatorParseResult {
  if (/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/.test(pageOrSection) || /[\uFF0E\uFE52\uFF61]/.test(pageOrSection)) {
    return { pageNumbers: [], mismatchedDocument: false, malformed: true };
  }

  const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pageList = "([0-9]+(?:\\s*[-–]\\s*[0-9]+)?(?:\\s*,\\s*[0-9]+(?:\\s*[-–]\\s*[0-9]+)?)*)";
  const exactPattern = new RegExp(
    `^${escapeRegex(expectedFilename.trim())}\\s+(?:පිටුව|පිටු|pdf\\s*pages?|pages?)\\s+${pageList}$`,
    "i"
  );
  const exactMatch = pageOrSection.trim().match(exactPattern);
  if (!exactMatch) {
    const pdfTokenCount = Array.from(pageOrSection.matchAll(/\.pdf/gi)).length;
    const startsWithExpected = pageOrSection.trim().toLocaleLowerCase().startsWith(expectedFilename.trim().toLocaleLowerCase());
    return { pageNumbers: [], mismatchedDocument: pdfTokenCount > 1 || (pdfTokenCount === 1 && !startsWithExpected), malformed: true };
  }

  const pageClause = exactMatch[1];
  if (!pageClause) {
    return { pageNumbers: [], mismatchedDocument: false, malformed: true };
  }
  const pages = new Set<number>();
  for (const token of pageClause.split(",")) {
    const range = token.trim().split(/\s*[-–]\s*/);
    const start = Number(range[0]);
    const end = range[1] === undefined ? start : Number(range[1]);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end - start > 1000) {
      return { pageNumbers: [], mismatchedDocument: false, malformed: true };
    }
    for (let page = start; page <= end; page += 1) pages.add(page);
  }

  return {
    pageNumbers: Array.from(pages).sort((a, b) => a - b),
    mismatchedDocument: false,
    malformed: false,
  };
}

function explicitPageReferences(pageOrSection: string, expectedFilename: string): LocatorParseResult {
  return parseSourceLocator(pageOrSection, expectedFilename);
}


function qualityForPages(documentSlug: string, pageNumbers: number[]): EvidenceQuality {
  const qualities = sourcePageQuality
    .filter((page) => page.documentSlug === documentSlug && pageNumbers.includes(page.pageNumber))
    .map((page) => page.confidence);

  if (qualities.length === 0) return "missing";
  
  const uniqueQualities = new Set(qualities);
  if (uniqueQualities.has("D")) return uniqueQualities.size === 1 ? "D" : "mixed";
  if (uniqueQualities.has("C")) return uniqueQualities.size === 1 ? "C" : "mixed";
  if (uniqueQualities.has("B")) return uniqueQualities.size === 1 ? "B" : "mixed";
  return "A";
}

function hasReadablePages(documentSlug: string, pageNumbers: number[]): boolean {
  const citedPages = sourcePageQuality.filter(
    (page) => page.documentSlug === documentSlug && pageNumbers.includes(page.pageNumber)
  );
  return (
    citedPages.length === pageNumbers.length &&
    citedPages.every(
      (page) => (page.confidence === "A" || page.confidence === "B") && page.hasSinhalaText
    )
  );
}

function getRecordShape(record: unknown): PublicationRecordShape {
  return isRecord(record) ? (record as PublicationRecordShape) : {};
}

function isSourceReference(value: unknown): value is SourceReference {
  return isContractSourceReference(value);
}

function resolveRecordSourceReference(value: PublicationRecordShape): SourceReference | undefined {
  const reference = readOwnDataField(value, "sourceReference");
  return isSourceReference(reference) ? reference : undefined;
}

export function toPublicationInput(record: unknown): PublicationInput {
  try {
    const value = getRecordShape(record);
    const id = readOwnDataField(value, "id");
    return {
      id: typeof id === "string" ? id : "",
      gradeBands: getGradeBands(value),
      sourceReference: resolveRecordSourceReference(value),
    };
  } catch {
    return { id: "", gradeBands: [], sourceReference: undefined };
  }
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

export function getSourceDocumentSummary(sourceId: string): SourceDocumentSummary {
  const resolution = resolveSourceDocument(sourceId);
  if (resolution.status === "missing-source") {
    return {
      reviewStatus: "No matching source record",
      pageCount: 0,
      evidenceQuality: "missing",
    };
  }
  if (resolution.status !== "found") {
    return {
      reviewStatus:
        resolution.status === "missing-document"
          ? "No matching extracted document"
          : resolution.status === "ambiguous-source-record"
          ? "Ambiguous source record ID"
          : "Ambiguous extracted document mapping",
      pageCount: 0,
      evidenceQuality: "missing",
    };
  }

  const document = resolution.document;
  const pages = sourcePageQuality.filter((page) => page.documentSlug === document.slug);
  const quality = pages.length === 0
    ? "missing"
    : pages.some((page) => page.confidence === "D")
    ? "mixed"
    : pages.some((page) => page.confidence === "C")
    ? "C"
    : pages.some((page) => page.confidence === "B")
    ? "B"
    : "A";

  return {
    documentId: document.id,
    documentSlug: document.slug,
    reviewStatus: document.reviewStatus,
    pageCount: document.pageCount,
    evidenceQuality: quality,
  };
}

export function getSourceCorpusInventory() {
  const qualityCounts = sourcePageQuality.reduce<Record<string, number>>((counts, page) => {
    counts[page.confidence] = (counts[page.confidence] || 0) + 1;
    return counts;
  }, {});
  return {
    sourceRecords: getValidatedSourceRecords().length,
    sourceDocuments: sourceDocuments.length,
    sourcePages: sourceDocuments.reduce((sum, document) => sum + document.pageCount, 0),
    qualityCounts,
  };
}

export function evaluateSourceReference(
  reference: SourceReference | undefined
): SourceEvidenceDecision {
  try {
    const sourceIdValue = isSourceReference(reference) ? readOwnDataField(reference, "sourceId") : undefined;
    const pageOrSectionValue = isSourceReference(reference) ? readOwnDataField(reference, "pageOrSection") : undefined;
    const sourceId = typeof sourceIdValue === "string" ? sourceIdValue : undefined;
    const pageOrSection = typeof pageOrSectionValue === "string" ? pageOrSectionValue : undefined;
    if (!sourceId || !pageOrSection?.trim()) {
      return {
        pageNumbers: [],
        quality: "missing",
        supportable: false,
        reasonCode: "missing-source-reference",
        reason: "Claim-level source ID and exact page/section evidence are required.",
      };
    }

    const resolution = resolveSourceDocument(sourceId);
    if (resolution.status !== "found") {
      const isAmbiguous = resolution.status === "ambiguous-document" || resolution.status === "ambiguous-source-record";
      return {
        sourceId,
        pageNumbers: [],
        quality: "missing",
        supportable: false,
        reasonCode: isAmbiguous
          ? resolution.status === "ambiguous-source-record" ? "ambiguous-source-record" : "ambiguous-source-document"
          : "unknown-source",
        reason:
          resolution.status === "missing-source"
            ? "The source ID is not present in the canonical source catalog."
            : resolution.status === "missing-document"
            ? "The supplied source catalog has no matching extracted document."
            : resolution.status === "ambiguous-source-record"
            ? "The source ID maps to more than one canonical source record."
            : "The source filename maps to more than one extracted document.",
      };
    }

    const document = resolution.document;
    const locator = explicitPageReferences(pageOrSection, document.originalFilename);
    if (locator.mismatchedDocument) {
      return {
        sourceId,
        documentId: document.id,
        documentSlug: document.slug,
        pageNumbers: [],
        quality: "missing",
        supportable: false,
        reasonCode: "mismatched-source-document",
        reason: "The page locator names a PDF other than the document selected by its source ID.",
      };
    }

    const pageNumbers = locator.pageNumbers;
    const inRangePages = pageNumbers.filter((page) => page <= document.pageCount);
    const quality = qualityForPages(document.slug, inRangePages);

    if (locator.malformed || pageNumbers.length === 0) {
      return {
        sourceId,
        documentId: document.id,
        documentSlug: document.slug,
        pageNumbers: [],
        quality: "missing",
        supportable: false,
        reasonCode: "missing-page-evidence",
        reason: "No exact numeric page evidence was supplied.",
      };
    }

    if (inRangePages.length !== pageNumbers.length) {
      return {
        sourceId,
        documentId: document.id,
        documentSlug: document.slug,
        pageNumbers: [],
        quality: "missing",
        supportable: false,
        reasonCode: "page-out-of-range",
        reason: "At least one cited page number falls outside the extracted document page range.",
      };
    }

    if (document.reviewStatus !== "Source Triaged") {
      return {
        sourceId,
        documentId: document.id,
        documentSlug: document.slug,
        pageNumbers: inRangePages,
        quality,
        supportable: false,
        reasonCode: "source-document-needs-review",
        reason: `The extracted document is ${document.reviewStatus}; source triage is not complete.`,
      };
    }

    if (!hasReadablePages(document.slug, inRangePages)) {
      return {
        sourceId,
        documentId: document.id,
        documentSlug: document.slug,
        pageNumbers: inRangePages,
        quality,
        supportable: false,
        reasonCode: "low-quality-page-evidence",
        reason: "The cited pages do not contain an A/B readable Sinhala evidence page.",
      };
    }

    return {
      sourceId,
      documentId: document.id,
      documentSlug: document.slug,
      pageNumbers: inRangePages,
      quality,
      supportable: true,
      reasonCode: "supportable",
      reason: "The source ID, extracted document, page range, and readable page evidence agree.",
    };
  } catch {
    return {
      pageNumbers: [],
      quality: "missing",
      supportable: false,
      reasonCode: "missing-source-reference",
      reason: "Claim-level source ID and exact page/section evidence are required.",
    };
  }
}



function hasUnsupportedGrade(gradeBands: string[]): boolean {
  return gradeBands.includes("12-13");
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

function gradeScopeMatchesSource(gradeBands: string[], sourceId: string | undefined): boolean {
  if (!sourceId) return false;
  if (countSourceRecordsById(sourceId) !== 1) return false;
  const matches = getSourceRecordsById(sourceId);
  if (matches.length !== 1 || matches[0].grades.length === 0) return false;
  const source = matches[0];
  return gradeBands.every((band) => bandContainsSourceGrade(band, source.grades));
}

export function getTalaFieldDisposition(talaOrId: string | unknown): TalaFieldDisposition | undefined {
  try {
    const supplied = typeof talaOrId === "string" ? undefined : getRecordShape(talaOrId);
    const suppliedId = readOwnDataField(supplied, "id");
    const talaId = typeof talaOrId === "string" ? talaOrId : typeof suppliedId === "string" ? suppliedId : "";
    const entry = talaFieldDispositions.talas.find((candidate) => candidate.talaId === talaId);
    if (!entry) return undefined;
  const tala = (supplied ?? (talasData as Array<{
    id: string;
    context_si?: string;
    contextSourceReference?: SourceReference;
    theka_si: string;
    bols: Array<{ matra: number; bol_si: string }>;
  }>).find((candidate) => candidate.id === talaId)) as {
    id?: unknown;
    context_si?: unknown;
    contextSourceReference?: unknown;
    theka_si?: unknown;
    bols?: unknown;
  } | undefined;
  const hasExactEvidence = (field: TalaFieldDispositionField): boolean =>
    field.quality === "A" || field.quality === "B"
      ? evaluateSourceReference(field.sourceReference).supportable
      : false;
  const contextVerified = entry.context.status === "verified" && (
    entry.context.scope === "not-claimed"
      ? !tala?.context_si && !tala?.contextSourceReference && entry.context.quality === "N/A"
      : Boolean(
          typeof tala?.context_si === "string" &&
          entry.context.value === tala.context_si &&
          isSourceReference(tala.contextSourceReference) &&
          entry.context.sourceReference?.sourceId === tala.contextSourceReference.sourceId &&
          entry.context.sourceReference.pageOrSection === tala.contextSourceReference.pageOrSection &&
          hasExactEvidence(entry.context)
        )
  );
  const allRequiredFieldsVerified =
    Boolean(tala) &&
    !talaFieldDispositions.unclosedRequiredFields.includes("structure") &&
    contextVerified &&
    entry.theka.status === "verified" &&
    entry.theka.value === tala?.theka_si &&
    hasExactEvidence(entry.theka) &&
    entry.bols.length > 0 &&
    entry.bols.every((bol, index) =>
      bol.status === "verified" &&
      bol.matra === index + 1 &&
      Array.isArray(tala?.bols) &&
      bol.matra === (tala.bols[index] as { matra?: unknown } | undefined)?.matra &&
      bol.value === (tala.bols[index] as { bol_si?: unknown } | undefined)?.bol_si &&
      hasExactEvidence(bol)
    ) &&
    Array.isArray(tala?.bols) && tala.bols.length === entry.bols.length;
    return { ...entry, allRequiredFieldsVerified };
  } catch {
    return undefined;
  }
}

function collectDependencyDispositions(
  value: unknown,
  path: string,
  seen: WeakSet<object>,
  results: NestedPublicationDisposition[],
  decisionContext: PublicationDecisionContext,
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
    records: unknown[]
  ): void => {
    const dependency = isNonBlankString(dependencyId)
      ? records.find((candidate) => {
          if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
          return readOwnDataField(candidate, "id") === dependencyId;
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
    if (Array.isArray(prerequisites)) {
      prerequisites.forEach((dependencyId, index) => addDependency(dependencyId, `${prefix}prerequisites[${index}]`, true, lessonsData));
    }
    const steps = readOwnDataField(record, "steps");
    if (Array.isArray(steps)) {
      steps.forEach((step, index) => {
        const lessonId = step && typeof step === "object" && !Array.isArray(step)
          ? readOwnDataField(step, "lessonId")
          : undefined;
        addDependency(lessonId, `${prefix}steps[${index}].lessonId`, true, lessonsData);
      });
    }
    const keys = Object.keys(record);
    const ownKeys = new Set(keys);
    if (ownKeys.has("nextRecommendedLessonId")) {
      addDependency(readOwnDataField(record, "nextRecommendedLessonId"), `${prefix}nextRecommendedLessonId`, false, lessonsData);
    }
    if (ownKeys.has("quizId")) {
      addDependency(readOwnDataField(record, "quizId"), `${prefix}quizId`, false, quizzesData);
    }
    if (ownKeys.has("masteryQuizId")) {
      addDependency(readOwnDataField(record, "masteryQuizId"), `${prefix}masteryQuizId`, true, quizzesData);
    }
    if (ownKeys.has("nextRecommendedPathId")) {
      addDependency(readOwnDataField(record, "nextRecommendedPathId"), `${prefix}nextRecommendedPathId`, false, learningPathsData);
    }

    for (const key of keys) {
      if (["prerequisites", "steps", "nextRecommendedLessonId", "quizId", "masteryQuizId", "nextRecommendedPathId"].includes(key)) continue;
      const child = readOwnDataField(record, key);
      const childPath = `${prefix}${key}`;
      const recognizedTala = ["talaId", "targetTalaId", "audioTalaId"].includes(key);
      const recognizedRaga = ["ragaId", "targetRagaId", "selectedRagaId"].includes(key);
      if (recognizedTala) addDependency(child, childPath, true, talasData);
      if (recognizedRaga) addDependency(child, childPath, true, ragasData);
      if (child && typeof child === "object") pending.push({ value: child, path: childPath, depth: current.depth + 1 });
    }
  }
}

function hasCanonicalRuntimeShape(
  value: unknown,
  knownKind?: ContentEntityKind,
  graphSafety?: ReturnType<typeof inspectGraph>,
  knownSnapshot?: unknown
): boolean {
  const kind = knownKind ?? getKnownContentKind(value);
  return !!kind && validateContentRecord(value, kind, graphSafety, knownSnapshot).isValid;
}

/**
 * Evidence-only decision for a record that has already passed the complete
 * runtime contract at the caller boundary.  Keep this private: exposing the
 * reduced shape would let callers skip kind, metadata, graph, and dependency
 * checks.
 */
function getBasePublicationDecision(input: PublicationInput): PublicationDecision {
  try {
    const value = isRecord(input) ? input : {};
    const idValue = readOwnDataField(value, "id");
    const id = typeof idValue === "string" ? idValue : "";
    const gradeBands = getGradeBands(value);
    const referenceValue = readOwnDataField(value, "sourceReference");
    const sourceReference = isSourceReference(referenceValue) ? referenceValue : undefined;
    const sourceEvidence = evaluateSourceReference(sourceReference);
    const reasonCodes: PublicationReasonCode[] = [];

    if (hasUnsupportedGrade(gradeBands) || (gradeBands.length > 0 && !hasPublicGrade(gradeBands))) {
      reasonCodes.push("unsupported-grade");
    }
    if (KNOWN_QUARANTINED_ENTITY_IDS.has(id)) reasonCodes.push("known-forensic-issue");
    if (gradeBands.length === 0) reasonCodes.push("missing-grade-scope");
    if (gradeBands.length > 0 && !gradeScopeMatchesSource(gradeBands, sourceReference ? readOwnDataField(sourceReference, "sourceId") as string : undefined)) {
      reasonCodes.push("source-grade-mismatch");
    }
    if (sourceEvidence.reasonCode !== "supportable") reasonCodes.push(sourceEvidence.reasonCode);

    const sourceId = sourceReference ? readOwnDataField(sourceReference, "sourceId") : undefined;
    const quarantined = hasUnsupportedGrade(gradeBands) || KNOWN_QUARANTINED_ENTITY_IDS.has(id);
    const publicByEvidence =
      hasPublicGrade(gradeBands) &&
      gradeScopeMatchesSource(gradeBands, typeof sourceId === "string" ? sourceId : undefined) &&
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
    return failClosedRecordDecision(["malformed-record"]);
  }
}

function getQuizContainerPublicationDecision(record: unknown): PublicationDecision {
  const value = getRecordShape(record);
  const rawId = readOwnDataField(value, "id");
  const id = isNonBlankString(rawId) ? rawId : "";
  const gradeBands = getGradeBands(value);
  const reasonCodes: PublicationReasonCode[] = [];
  if (gradeBands.length === 0) reasonCodes.push("missing-grade-scope");
  if (!hasPublicGrade(gradeBands)) reasonCodes.push("unsupported-grade");
  if (KNOWN_QUARANTINED_ENTITY_IDS.has(id)) reasonCodes.push("known-forensic-issue");
  const isPublic = hasPublicGrade(gradeBands) && !KNOWN_QUARANTINED_ENTITY_IDS.has(id);
  return {
    state: KNOWN_QUARANTINED_ENTITY_IDS.has(id) ? "quarantined" : isPublic ? "public" : "needs-review",
    isPublic,
    gradeBands,
    reasonCodes: Array.from(new Set(reasonCodes)),
    sourceEvidence: evaluateSourceReference(undefined),
    reviewState: "needs-review",
    nestedDispositions: [],
    withheldFields: [],
  };
}

function failClosedRecordDecision(reasonCodes: PublicationReasonCode[]): PublicationDecision {
  return {
    state: "needs-review",
    isPublic: false,
    gradeBands: [],
    reasonCodes: Array.from(new Set(reasonCodes)),
    sourceEvidence: evaluateSourceReference(undefined),
    reviewState: "needs-review",
    nestedDispositions: [],
    withheldFields: [],
  };
}

interface PublicationDecisionContext {
  stack: Set<string>;
  memo: WeakMap<object, PublicationDecision>;
}

function createPublicationDecisionContext(): PublicationDecisionContext {
  return {
    stack: new Set<string>(),
    memo: new WeakMap<object, PublicationDecision>(),
  };
}

function getRecordPublicationDecisionInternal(
  record: unknown,
  decisionContext: PublicationDecisionContext,
): PublicationDecision {
  const originalObject = record !== null && typeof record === "object" ? record as object : undefined;
  const cached = originalObject ? decisionContext.memo.get(originalObject) : undefined;
  if (cached) return cached;
  const finish = (decision: PublicationDecision, cacheable = true): PublicationDecision => {
    if (originalObject && cacheable) decisionContext.memo.set(originalObject, decision);
    return decision;
  };
  const graphSafety = inspectGraph(record);
  if (!graphSafety.safe) return finish(failClosedRecordDecision(["malformed-record"]));
  const safeRecord = cloneBoundedRecord(record, graphSafety);
  if (!safeRecord || !isRecord(safeRecord)) return finish(failClosedRecordDecision(["malformed-record"]));
  const knownKind = getKnownContentKind(safeRecord);
  if (!knownKind) return finish(failClosedRecordDecision(["unknown-record-kind", "malformed-record"]));

  const hasValidRuntimeShape = hasCanonicalRuntimeShape(safeRecord, knownKind, graphSafety, safeRecord);
  const value = getRecordShape(safeRecord);
  const rawRecordId = readOwnDataField(value, "id");
  const recordId = typeof rawRecordId === "string" ? rawRecordId : "";
  const isQuiz = (quizzesData as Array<{ id: string }>).some((quiz) => quiz.id === recordId);
  const baseDecision = isQuiz
    ? getQuizContainerPublicationDecision(safeRecord)
    : getBasePublicationDecision(toPublicationInput(safeRecord));
  const reasonCodes = new Set(baseDecision.reasonCodes);
  const nestedDispositions = [...baseDecision.nestedDispositions];
  const withheldFields = [...baseDecision.withheldFields];
  if (recordId && decisionContext.stack.has(recordId)) {
    return {
      ...baseDecision,
      state: "needs-review",
      isPublic: false,
      reasonCodes: Array.from(new Set<PublicationReasonCode>([...baseDecision.reasonCodes, "dependency-cycle"])),
    };
  }
  if (decisionContext.stack.size >= 256) {
    return finish({
      ...baseDecision,
      state: "needs-review",
      isPublic: false,
      reasonCodes: Array.from(new Set<PublicationReasonCode>([...baseDecision.reasonCodes, "malformed-record"])),
    });
  }
  if (recordId) decisionContext.stack.add(recordId);

  if (!hasValidRuntimeShape) reasonCodes.add("malformed-record");
  if (Array.isArray(value.gradeBands) && !isCanonicalGradeBandArray(value.gradeBands)) {
    reasonCodes.add("unsupported-grade");
  }

  const contextDecision = getContextClaimPublicationDecision(safeRecord);
  if (contextDecision.present && !contextDecision.isPublic) {
    if (contextDecision.reasonCode === "no-context-claim" || contextDecision.reasonCode === "unpaired-context-claim") {
      reasonCodes.add("unpaired-context-claim");
    } else if (contextDecision.reasonCode !== "supportable") {
      reasonCodes.add(contextDecision.reasonCode);
    }
    withheldFields.push("context_si", "contextSourceReference");
  }

  const isTalaRecord = (talasData as Array<{ id: string }>).some((tala) => tala.id === recordId);
  const talaDisposition = getTalaFieldDisposition(safeRecord);
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

  const isExam = (examPapersData as Array<{ id: string }>).some((paper) => paper.id === recordId);
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
    if (recordId) decisionContext.stack.delete(recordId);
    return finish(decision);
  }

  const lessonId = readOwnDataField(value, "lessonId");
  const parent = isQuiz && typeof lessonId === "string"
    ? (lessonsData as unknown as Array<{ id: string }>).find((lesson) => lesson.id === lessonId)
    : undefined;
  const parentIsActiveBacklink = isQuiz && typeof lessonId === "string" && decisionContext.stack.has(lessonId);
  const parentIsPublic = !isQuiz || (!!parent && (
    parentIsActiveBacklink || getRecordPublicationDecisionInternal(parent, decisionContext).isPublic
  ));
  if (isQuiz && !parentIsPublic) reasonCodes.add("parent-lesson-unavailable");
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
    const decision = getBasePublicationDecision(toPublicationInput(question));
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
  if (recordId) decisionContext.stack.delete(recordId);
  const dependsOnActiveBacklink = parentIsActiveBacklink || nestedDispositions.some(
    (disposition) => disposition.reasonCodes.includes("dependency-cycle")
  );
  return finish(decision, !dependsOnActiveBacklink);
}

export function getRecordPublicationDecision(record: unknown): PublicationDecision {
  try {
    return getRecordPublicationDecisions([record])[0] ?? failClosedRecordDecision(["malformed-record"]);
  } catch {
    return failClosedRecordDecision(["malformed-record"]);
  }
}

/**
 * Evaluates a bounded collection with one request-local memo. The memo never
 * survives the call, so later raw-data mutations are revalidated while shared
 * dependency graphs are evaluated only once per repository read.
 */
export function getRecordPublicationDecisions(records: readonly unknown[]): PublicationDecision[] {
  const decisionContext = createPublicationDecisionContext();
  return records.map((record) => {
    const decision = getRecordPublicationDecisionInternal(record, decisionContext);
    if (!decision.isPublic) return decision;
    return {
      ...decision,
      publicProjection: sanitizePublicRecordWithDecision(record, decision),
    };
  });
}

/**
 * Complete public-boundary decision API.  Callers must provide the raw record;
 * reduced PublicationInput values are intentionally treated as unknown kinds
 * and cannot bypass the runtime contract, metadata, graph, or dependency
 * gates.
 */
export function getPublicationDecision(record: unknown): PublicationDecision {
  try {
    return getRecordPublicationDecision(record);
  } catch {
    return failClosedRecordDecision(["malformed-record"]);
  }
}

export const getQuizPublicationDecision = getRecordPublicationDecision;

export function getContextClaimPublicationDecision(record: unknown): ContextClaimPublicationDecision {
  try {
    const value = getRecordShape(record);
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
    const sourceEvidence = evaluateSourceReference(contextSourceReference);
    if (!present) {
      return { present: false, isPublic: false, reasonCode: "no-context-claim", sourceEvidence };
    }
    if (!hasContext || !hasReference) {
      return { present: true, isPublic: false, reasonCode: "unpaired-context-claim", sourceEvidence };
    }
    const declaredGrades = getGradeBands(value);
    const sourceId = readOwnDataField(contextSourceReference, "sourceId");
    if (!gradeScopeMatchesSource(declaredGrades, typeof sourceId === "string" ? sourceId : undefined)) {
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
      sourceEvidence: evaluateSourceReference(undefined),
    };
  }
}

export function createUnverifiedReviewMetadata(): ReviewMetadata {
  return createContractUnverifiedReviewMetadata() as unknown as ReviewMetadata;
}

export function sanitizePublicRecord<T>(record: T): T {
  if (!record || typeof record !== "object") return record;
  try {
    const decision = getRecordPublicationDecisionInternal(record, createPublicationDecisionContext());
    return sanitizePublicRecordWithDecision(record, decision);
  } catch {
    return {} as T;
  }
}

function sanitizePublicRecordWithDecision<T>(record: T, decision: PublicationDecision): T {
  if (!record || typeof record !== "object" || !decision.isPublic) return {} as T;
  try {
    const kind = getKnownContentKind(record);
    if (!kind) return {} as T;
    const projected = projectPublicRecord(record, kind);
    const value = (isRecord(projected) ? projected : undefined) as Record<string, unknown> | undefined;
    if (!value) return {} as T;
    if (isMetadataBearingKind(kind)) value.reviewMetadata = createUnverifiedReviewMetadata();
    if ("published" in value) value.published = false;
    const contextDecision = getContextClaimPublicationDecision(record);
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
    return {} as T;
  }
}

export function sanitizeReviewRecord<T>(record: T): T {
  if (!record || typeof record !== "object") return record;
  try {
    const value = cloneBoundedRecord(record) as Record<string, unknown> | undefined;
    if (!value || !isRecord(value)) return {} as T;
    const kind = getKnownContentKind(value);
    if (isMetadataBearingKind(kind)) value.reviewMetadata = createUnverifiedReviewMetadata();
    if ("published" in value) value.published = false;
    return value as T;
  } catch {
    return {} as T;
  }
}

export function formatPublicSourceReference(reference: SourceReference): string {
  const evidence = evaluateSourceReference(reference);
  if (!evidence.supportable || evidence.pageNumbers.length === 0) return "මූලාශ්‍ර පිටු සනාථ කර නොමැත";
  const pageLabel = evidence.pageNumbers.length === 1 ? "පිටුව" : "පිටු";
  return `${pageLabel} ${evidence.pageNumbers.join(", ")}`;
}

export function isPublicGradeBand(value: string): value is PublicGradeBand {
  return PUBLIC_GRADE_BANDS.includes(value as PublicGradeBand);
}

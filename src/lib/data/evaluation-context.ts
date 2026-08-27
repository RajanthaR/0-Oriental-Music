import type { ContentEntityKind } from "@/lib/validation/content-contracts";
import { isRecord } from "@/lib/shared/bounded-values";
import {
  getEvidenceRegistrySnapshot,
  type SourceDocumentRecord,
  type SourcePageQualityRecord,
} from "@/lib/evidence/source-evidence";
import { captureEvaluationArray } from "@/lib/data/snapshot-capture";
import {
  registerKnownKinds,
  setPublicationEvaluationState,
  type PublicationCatalogInputs,
  type PublicationCatalogSnapshot,
  type PublicationEvaluationContext,
  type PublicationEvaluationState,
} from "@/lib/data/evaluation-state";
import type { PublicationDecision } from "@/lib/data/decision-types";
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

/**
 * Neutral evaluation-context construction.
 *
 * This module sits BELOW every policy module (publication-policy,
 * source-evidence-policy, tala-disposition-policy) so a policy can obtain a
 * default context without importing a higher-level publication factory. That
 * upward default-parameter edge was the whole policy-triangle import cycle;
 * context creation itself depends only on raw catalogs, snapshot capture,
 * evidence registry access, and evaluation-state registration.
 *
 * Contexts remain per-operation: every call captures fresh detached snapshots
 * of caller-supplied or default catalogs plus the evidence registries, keeps
 * mutable indexes private behind the evaluation-state WeakMap, and freezes the
 * public view. Nothing is memoized across operations.
 */

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

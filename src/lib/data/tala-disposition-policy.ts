import type { SourceReference } from "@/types/content";
import {
  getEvaluationState,
  getSafeEvaluationState,
  type PublicationEvaluationContext,
} from "@/lib/data/evaluation-state";
import { createPublicationEvaluationContext } from "@/lib/data/publication-policy";
import { evaluateSourceReference } from "@/lib/data/source-evidence-policy";
import { captureEvaluationValue } from "@/lib/data/snapshot-capture";
import type { EvidenceQuality } from "@/lib/evidence/source-evidence";
import {
  isRecord,
  normalizeRecordId,
  readOwnDataField,
} from "@/lib/shared/bounded-values";
import { isSourceReference as isContractSourceReference } from "@/lib/validation/content-contracts";

function isSourceReference(value: unknown): value is SourceReference {
  return isContractSourceReference(value);
}
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

type TalaFieldDispositionsRegistry = {
  requiredFields: string[];
  unclosedRequiredFields: string[];
  talas: Array<{
    talaId: string;
    context: TalaFieldDispositionField;
    theka: TalaFieldDispositionField;
    bols: TalaBolFieldDisposition[];
  }>;
};

export function getTalaFieldDisposition(
  talaOrId: string | unknown,
  context: PublicationEvaluationContext = createPublicationEvaluationContext(),
): TalaFieldDisposition | undefined {
  try {
    if (!getSafeEvaluationState(context)) return undefined;
    const suppliedSnapshot = typeof talaOrId === "string" ? undefined : captureEvaluationValue(talaOrId, false);
    const supplied = isRecord(suppliedSnapshot) ? suppliedSnapshot : undefined;
    const suppliedId = readOwnDataField(supplied, "id");
    const talaId = normalizeRecordId(typeof talaOrId === "string" ? talaOrId : suppliedId);
    const dispositionRegistry = getEvaluationState(context).musicalCoreFieldDispositions;
    const registry = isRecord(dispositionRegistry)
      ? dispositionRegistry as TalaFieldDispositionsRegistry
      : undefined;
    const entries = registry && Array.isArray(registry.talas) ? registry.talas : [];
    const matchingEntries = entries.filter((candidate) => normalizeRecordId(candidate.talaId) === talaId);
    if (matchingEntries.length !== 1) return undefined;
    const entry = matchingEntries[0];
    if (!entry) return undefined;
  const tala = (supplied ?? context.catalogs.talas.find((candidate) => normalizeRecordId(readOwnDataField(candidate, "id")) === talaId)) as {
    id?: unknown;
    context_si?: unknown;
    contextSourceReference?: unknown;
    theka_si?: unknown;
    bols?: unknown;
  } | undefined;
  const hasPublishableFieldEvidence = (field: TalaFieldDispositionField): boolean =>
    field.quality === "A" || field.quality === "B"
      ? evaluateSourceReference(field.sourceReference, context).supportable
      : false; // quality-gated publish decision; see hasLedgerConsistentEvidence in content-validator for ledger self-consistency
  const contextVerified = entry.context.status === "verified" && (
    entry.context.scope === "not-claimed"
      ? !tala?.context_si && !tala?.contextSourceReference && entry.context.quality === "N/A"
      : Boolean(
          typeof tala?.context_si === "string" &&
          entry.context.value === tala.context_si &&
          isSourceReference(tala.contextSourceReference) &&
          entry.context.sourceReference?.sourceId === tala.contextSourceReference.sourceId &&
          entry.context.sourceReference.pageOrSection === tala.contextSourceReference.pageOrSection &&
          hasPublishableFieldEvidence(entry.context)
        )
  );
  const allRequiredFieldsVerified =
    Boolean(tala) &&
    Boolean(registry) &&
    // Guard the array before reading it: an absent or malformed list must fail
    // closed here rather than throwing out to the enclosing catch.
    Array.isArray(registry?.unclosedRequiredFields) &&
    !registry.unclosedRequiredFields.includes("structure") &&
    contextVerified &&
    entry.theka.status === "verified" &&
    entry.theka.value === tala?.theka_si &&
    hasPublishableFieldEvidence(entry.theka) &&
    entry.bols.length > 0 &&
    entry.bols.every((bol, index) =>
      bol.status === "verified" &&
      bol.matra === index + 1 &&
      Array.isArray(tala?.bols) &&
      bol.matra === (tala.bols[index] as { matra?: unknown } | undefined)?.matra &&
      bol.value === (tala.bols[index] as { bol_si?: unknown } | undefined)?.bol_si &&
      hasPublishableFieldEvidence(bol)
    ) &&
    Array.isArray(tala?.bols) && tala.bols.length === entry.bols.length;
    return { ...entry, allRequiredFieldsVerified };
  } catch {
    return undefined;
  }
}

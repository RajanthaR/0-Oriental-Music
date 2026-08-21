/**
 * The single central contract for the Tala field-disposition registry
 * (`data/musical-core-field-dispositions.json`).
 *
 * Publication gating and forensic validation previously checked different subsets
 * of this registry. Publication policy verified only that `talas[].talaId` was a
 * unique non-blank normalized string, while the forensic validator additionally
 * checked the policy block, the required-field lists, the structured issue
 * catalog and its forensic-ledger resolution, every row's shape, and the status
 * domain. An incomplete, conflicting, or malformed registry could therefore look
 * verified to publication gating.
 *
 * This module owns every **structural** rule so both consumers share one verdict.
 * It is deliberately pure and dependency-free with respect to publication policy:
 * it imports only plain data and the bounded graph helpers, so
 * `publication-policy -> disposition-registry` cannot create an import cycle.
 * Anything that needs source-evidence evaluation or the raw Tala catalog stays
 * with the caller.
 */

import forensicLedgerData from "../../../data/forensic-ledger.json";
import {
  cloneBoundedRecord,
  isDenseArray,
  isRecord,
  normalizeEntityId,
  readOwnDataField,
} from "@/lib/validation/content-contracts";

/** The registry declares whole-entity quarantine; no other policy is supported. */
export const DISPOSITION_POLICY = "whole-entity-quarantine";

/** The complete closed set of learner-visible Tala field groups. */
export const DISPOSITION_REQUIRED_FIELDS = ["context", "structure", "theka", "bols"] as const;

/** The closed status domain for every disposition row. */
export const DISPOSITION_STATUSES = ["verified", "needs-review"] as const;

export type DispositionStatus = (typeof DISPOSITION_STATUSES)[number];

export interface DispositionRegistryIssue {
  /** Registry-relative field path, e.g. `policy`, `talas`, `bols[0].issueId`. */
  field: string;
  /** `registry` for registry-wide rules, otherwise the row's `talaId`. */
  entityId: string;
  message: string;
}

export interface DispositionRegistryInspection {
  /** True only when every structural rule holds. Drives publication safety. */
  ok: boolean;
  issues: DispositionRegistryIssue[];
  /** The bounded registry snapshot, present only when it could be captured. */
  registry?: Record<string, unknown>;
  /**
   * Every structurally valid row, indexed by canonical `talaId`. Populated even
   * when `ok` is false so a caller can keep reporting downstream evidence and
   * value-parity issues instead of stopping at the first structural failure.
   */
  entryById: Map<string, Record<string, unknown>>;
  /** Every `issueCatalog[].id`, present even when other rules fail. */
  issueCatalogIds: Set<string>;
}

function isNonBlank(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function collectLedgerIssueIds(): Set<string> {
  const ids = new Set<string>();
  try {
    const issues = readOwnDataField(forensicLedgerData, "issues");
    if (!isDenseArray(issues)) return ids;
    for (const issue of issues) {
      const id = readOwnDataField(issue, "id");
      if (isNonBlank(id)) ids.add(id);
    }
  } catch {
    // A malformed ledger leaves the set empty, which fails every issue reference
    // closed rather than silently accepting unresolvable anchors.
  }
  return ids;
}

const LEDGER_ISSUE_IDS = collectLedgerIssueIds();

/** Every forensic-ledger issue ID a disposition row may anchor to. */
export function getForensicLedgerIssueIds(): ReadonlySet<string> {
  return LEDGER_ISSUE_IDS;
}

/**
 * Check the complete structural contract of a disposition registry.
 *
 * Never throws: hostile accessors, proxies, sparse arrays, and malformed rows all
 * resolve to issues. Two runs over the same input return equal results.
 */
export function inspectDispositionRegistry(
  registryInput: unknown,
  ledgerIssueIds: ReadonlySet<string> = LEDGER_ISSUE_IDS,
): DispositionRegistryInspection {
  const issues: DispositionRegistryIssue[] = [];
  const issueCatalogIds = new Set<string>();
  const add = (field: string, entityId: string, message: string): void => {
    issues.push({ field, entityId, message });
  };

  let registry: Record<string, unknown> | undefined;
  try {
    const snapshot = cloneBoundedRecord(registryInput);
    if (isRecord(snapshot)) registry = snapshot as Record<string, unknown>;
  } catch {
    registry = undefined;
  }
  const entryById = new Map<string, Record<string, unknown>>();
  if (!registry) {
    add("registry", "registry", "Disposition registry must be a bounded plain-data object.");
    return { ok: false, issues, entryById, issueCatalogIds };
  }

  // --- Registry-wide policy block ------------------------------------------
  const version = readOwnDataField(registry, "version");
  if (typeof version !== "number" || !Number.isSafeInteger(version) || version < 1) {
    add("version", "registry", "Disposition registry must declare a positive integer version.");
  }

  if (readOwnDataField(registry, "policy") !== DISPOSITION_POLICY) {
    add("policy", "registry", `Disposition registry policy must be '${DISPOSITION_POLICY}'.`);
  }

  const requiredFields = readOwnDataField(registry, "requiredFields");
  const requiredFieldsMatch = isDenseArray(requiredFields) &&
    requiredFields.length === DISPOSITION_REQUIRED_FIELDS.length &&
    DISPOSITION_REQUIRED_FIELDS.every((field, index) => requiredFields[index] === field);
  if (!requiredFieldsMatch) {
    add(
      "requiredFields",
      "registry",
      `Disposition registry requiredFields must be exactly [${DISPOSITION_REQUIRED_FIELDS.join(", ")}].`,
    );
  }

  const unclosed = readOwnDataField(registry, "unclosedRequiredFields");
  if (!isDenseArray(unclosed)) {
    add("unclosedRequiredFields", "registry", "Disposition registry unclosedRequiredFields must be a dense array.");
  } else {
    const seenUnclosed = new Set<string>();
    let unclosedValid = true;
    for (const field of unclosed) {
      if (typeof field !== "string" ||
        !(DISPOSITION_REQUIRED_FIELDS as readonly string[]).includes(field) ||
        seenUnclosed.has(field)) {
        unclosedValid = false;
        break;
      }
      seenUnclosed.add(field);
    }
    if (!unclosedValid) {
      add(
        "unclosedRequiredFields",
        "registry",
        "Disposition registry unclosedRequiredFields must be unique members of requiredFields.",
      );
    }
  }

  // --- Structured issue catalog -------------------------------------------
  const issueCatalog = readOwnDataField(registry, "issueCatalog");
  if (!isDenseArray(issueCatalog) || issueCatalog.length === 0) {
    add("issueCatalog", "registry", "Disposition registry must declare a dense non-empty issue catalog.");
  } else {
    let duplicateReported = false;
    issueCatalog.forEach((entry) => {
      if (!isRecord(entry)) {
        add("issueCatalog", "registry", "Disposition issue catalog entries must be objects.");
        return;
      }
      const id = readOwnDataField(entry, "id");
      const ledgerIssueId = readOwnDataField(entry, "ledgerIssueId");
      if (!isNonBlank(id)) {
        add("issueCatalog", "registry", "Disposition issue catalog entries must declare a non-blank id.");
        return;
      }
      if (issueCatalogIds.has(id)) {
        if (!duplicateReported) {
          add("issueCatalog", "registry", "Disposition issue catalog IDs must be unique.");
          duplicateReported = true;
        }
        return;
      }
      issueCatalogIds.add(id);
      if (!isNonBlank(ledgerIssueId) || !ledgerIssueIds.has(ledgerIssueId)) {
        add(
          "issueCatalog",
          "registry",
          "Every disposition issue catalog entry must resolve to a forensic-ledger issue.",
        );
      }
    });
  }

  // --- Tala rows -----------------------------------------------------------
  const talas = readOwnDataField(registry, "talas");
  if (!isDenseArray(talas) || talas.length === 0) {
    add("talas", "registry", "Disposition registry must declare a dense non-empty talas array.");
    return { ok: false, issues, registry, entryById, issueCatalogIds };
  }

  let malformedRowReported = false;
  let duplicateIdReported = false;

  const checkFieldRow = (row: unknown, path: string, entityId: string): void => {
    if (!isRecord(row)) {
      add(path, entityId, "Disposition field rows must be safe objects.");
      return;
    }
    const status = readOwnDataField(row, "status");
    if (typeof status !== "string" || !(DISPOSITION_STATUSES as readonly string[]).includes(status)) {
      add(path, entityId, "Disposition status must be verified or needs-review.");
    }
    if (!isNonBlank(readOwnDataField(row, "quality"))) {
      add(path, entityId, "Every disposition requires quality and forensic issue anchors.");
    }
    const issueId = readOwnDataField(row, "issueId");
    if (!isNonBlank(issueId)) {
      add(path, entityId, "Every disposition requires quality and forensic issue anchors.");
      return;
    }
    if (!issueCatalogIds.has(issueId)) {
      add(
        `${path}.issueId`,
        entityId,
        "Disposition issue ID must resolve through the structured issue catalog.",
      );
    }
  };

  talas.forEach((row) => {
    if (!isRecord(row)) {
      if (!malformedRowReported) {
        add("talas", "registry", "Disposition tala rows must be objects.");
        malformedRowReported = true;
      }
      return;
    }
    const rawTalaId = readOwnDataField(row, "talaId");
    const canonicalId = normalizeEntityId(rawTalaId);
    const entityId = isNonBlank(rawTalaId) ? rawTalaId : "registry";
    if (!canonicalId || canonicalId !== rawTalaId) {
      add("talaId", entityId, "Registry tala IDs must be non-blank, normalized, and unique.");
      return;
    }
    if (entryById.has(canonicalId)) {
      if (!duplicateIdReported) {
        add("talaId", entityId, "Registry tala IDs must be non-blank, normalized, and unique.");
        duplicateIdReported = true;
      }
      return;
    }
    entryById.set(canonicalId, row as Record<string, unknown>);

    const context = readOwnDataField(row, "context");
    const theka = readOwnDataField(row, "theka");
    const bols = readOwnDataField(row, "bols");
    if (!isRecord(context) || !isRecord(theka) || !isDenseArray(bols) || bols.length === 0) {
      add("fields", entityId, "Context, theka, and a non-empty bols array are required.");
      return;
    }

    const scope = readOwnDataField(context, "scope");
    if (scope !== undefined && !isNonBlank(scope)) {
      add("context.scope", entityId, "A declared context scope must be a non-blank string.");
    }

    checkFieldRow(context, "context", entityId);
    checkFieldRow(theka, "theka", entityId);
    bols.forEach((bol, bolIndex) => {
      const path = `bols[${bolIndex}]`;
      checkFieldRow(bol, path, entityId);
      if (!isRecord(bol)) return;
      if (readOwnDataField(bol, "matra") !== bolIndex + 1) {
        add(path, entityId, "Bol disposition must preserve sequential matra and status.");
      }
    });
  });

  return { ok: issues.length === 0, issues, registry, entryById, issueCatalogIds };
}

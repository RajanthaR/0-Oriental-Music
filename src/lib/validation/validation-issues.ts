import { normalizeSinhalaText } from "@/lib/search/normalize-sinhala";

/**
 * Shared validation-issue vocabulary for the forensic validators.
 *
 * Both the pure validators (`lib/validation`) and the data-side publication
 * audits (`lib/data/publication-audit`, `lib/data/catalog-integrity`) emit the
 * same structured issues. This leaf module lets them share the shape without
 * importing each other, keeping the layering acyclic.
 */

export interface ValidationIssue {
  entityType: string;
  entityId: string;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface PublicationValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

/** Structured issue constructor with the default error severity. */
export function baselineIssue(
  entityType: string,
  entityId: string,
  field: string,
  message: string,
  severity: "error" | "warning" = "error"
): ValidationIssue {
  return { entityType, entityId, field, message, severity };
}

/** Search-equivalent identity key shared by catalog and tala name checks. */
export const identityKey = (value: string) =>
  normalizeSinhalaText(value).replace(/[\s()|,.'’\-–—/]/g, "");

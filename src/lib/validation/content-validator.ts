import type { PublicationValidationResult, ValidationIssue } from "@/lib/validation/validation-issues";

export type { ValidationIssue, PublicationValidationResult } from "@/lib/validation/validation-issues";

// Catalog identity contracts live in a dependency-free leaf module so the data
// layer can import them without creating a data <-> validation import cycle.
export { identityKey, validateCatalogIdentityContracts } from "@/lib/validation/identity-contracts";
export type { IdentityRecord } from "@/lib/validation/identity-contracts";

// Audit validators live with their siblings in the publication-audit module;
// these re-exports preserve the historical content-validator API surface.
export {
  validateMusicalCoreFieldDispositions,
  validateCoverageSnapshot,
  validatePublicCollection,
  validatePublicBoundary,
  validateForensicInventory,
  validateSelectedSourceMetadata,
  SELECTED_PHASE_2_SOURCE_IDS,
} from "@/lib/data/publication-audit";
export { validateContent, validateForensicLedger } from "@/lib/data/catalog-integrity";

/**
 * Compatibility re-export. The disposition-registry contract moved to
 * `@/lib/evidence/disposition-registry` so the data and validation layers can
 * share it without a cross-layer dependency. Every existing importer keeps its
 * path, and the forensic ledger's recorded anchors keep resolving here.
 */
export * from "@/lib/evidence/disposition-registry";

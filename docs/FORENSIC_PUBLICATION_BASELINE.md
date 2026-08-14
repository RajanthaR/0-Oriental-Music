# Forensic publication baseline

This is the Prompt 1 containment boundary for **ස්වර මඟ**. It is a source-safety control, not a declaration that the musical content is correct or that the platform is production-ready.

## States

- `public`: discoverable only when the record is scoped to Grades 6–11, has a known source ID, maps to exactly one supplied extracted document, cites an in-range page or bounded section, and has at least one A/B readable Sinhala evidence page.
- `quarantined`: retained in the raw dataset for later correction, but excluded from public lists, search, selectors, metadata, counts, and direct dynamic routes. Known issue identifiers and all Grade 12–13/A/L records use this state.
- `needs-review`: retained for audit but not publicly discoverable because the source document, page evidence, extraction quality, or grade scope is unresolved.
- `unknown / unverified`: the only acceptable public value for metadata that is not established by the supplied corpus or a real review event. It is not a substitute publisher, licence, reviewer, or date.

The single typed policy is [`src/lib/data/publication-policy.ts`](../src/lib/data/publication-policy.ts). Public repository methods use it by default. Review-only records are returned through an explicitly named review method and are sanitized before the admin view sees them.

## Evidence limits

The checkout contains 30 source Markdown documents and 1,023 extracted page records, but no original PDF files. A page heading in `oriental_music_markdown/by-source/` proves that an extraction page exists; it does not prove the extracted claim. C/D pages, image-only pages, corrupt or legacy-font pages, notation/diagram-dependent facts, and ambiguous filename mappings remain `needs-review`.

The current source-page inventory is A 397, B 190, C 33, and D 403. The 57.4% A/B figure is an extraction-quality measure only. It is not a curriculum-truth or publication percentage.

## Promotion gate for a later phase

A later phase may promote a quarantined or needs-review record only after it records the exact source filename and page/section, compares the claim against the original PDF or an accepted source-quality exception, writes a before/after correction entry, completes the appropriate SME/language/pedagogical/audio/accessibility/rights review, and adds regression coverage. The record must then be re-evaluated by the policy; a route-local override is not permitted.

The machine-readable issue ledger is [`data/forensic-ledger.json`](../data/forensic-ledger.json). The current reconciliation counts in [`data/content-coverage.json`](../data/content-coverage.json) are checked against that ledger by `validateForensicInventory()`. The older `data/content-reconciliation.json` remains preserved as untrusted historical evidence; its 101 `Published` records are not a current publication count.

## Scope intentionally deferred

This phase does not rewrite raga, tala, acoustics, instrument, folk, theatre, lesson, or curriculum claims. It does not add Grades 12–13 sources, deploy, merge, or claim production readiness. The unresolved source and visual-review queue is recorded in the ledger and correction log.

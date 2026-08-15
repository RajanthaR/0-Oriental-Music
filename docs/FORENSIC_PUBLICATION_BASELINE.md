# Forensic publication baseline

This is the Prompt 1 containment boundary for **ස්වර මඟ**. It is a source-safety control, not a declaration that the musical content is correct or that the platform is production-ready.

## Phase 2 closeout supersession

Phase 2 keeps the Prompt 1 fail-closed boundary and applies the selected **Option 2 whole-entity quarantine** rule to musical-core entities. Any unsupported required learner-visible or playable field withholds the whole public entity and its reverse dependencies; source-attributed raw/audit values are retained separately. Lawani remains nonpublic until its required Sri Lankan school-system context and playable fields are supportable.

The current public projection contains 1 acoustics lesson, 7 Grade 11-evidenced ragas, 5 acoustics glossary terms, and 1 acoustics quiz. All Talas, learning paths, exam papers, instruments, cultural traditions, and theatre traditions remain nonpublic under this bounded evidence policy. Khemta's readable raw cells are retained for audit, but its remaining learner-visible structure fields have not yet been closed through the field-disposition registry. These counts describe the current projection only; they do not establish curriculum completeness.

## States

- `public`: discoverable only when the record carries its own explicit Grades 6–11 scope, has a known source ID, maps to exactly one supplied extracted document, exact-matches any named PDF, cites only in-range pages, every cited page has A/B readable Sinhala evidence, all required field dispositions are verified, and every public dependency is available.
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

Phase 2 does not add Grades 12–13/A/L sources or content, reconstruct the curriculum map, add Phase 3 content, redesign the UI, deploy, merge, or claim production readiness. The unresolved original-PDF/visual bol review, Lawani context, source metadata, and later-phase content queues remain recorded in the ledger, field disposition registry, and correction log.

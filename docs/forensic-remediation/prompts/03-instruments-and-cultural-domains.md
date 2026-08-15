# Prompt 3 — Instruments and cultural-domain remediation

Implement Phase 3 of the Swara Maga forensic remediation programme: instruments, folk/ritual/Indigenous traditions, theatre traditions, and the synchronized glossary.

## Start gate

- Read `AGENTS.md`, the forensic-remediation plan, Prompts 1–2 handoffs, canonical ledger, correction log, publication policy, and terminology/provenance schemas.
- Start only after Prompt 2’s ready PR is human-merged into current `origin/main`. Fetch it, record the clean base SHA, and use the Codex worktree branch or create `codex/forensic-p03-cultural-catalogs` if detached/on `main`.
- Preserve prior evidence history and stable IDs. Do not reinterpret fields already verified in Phase 2 without stronger cited evidence and an explicit superseding ledger entry.
- Diffray server review of changed repository files is allowed. Never send secrets. Do not merge, deploy, or mutate hosted services.

## Objective

Make every public instrument, cultural-tradition, theatre, and glossary field traceable to the supplied Grades 6–11 corpus while retaining the source’s taxonomy and cultural context. Contain uncertain material instead of completing catalogs from memory.

## Required implementation

1. Build a field-level inventory for all current instrument, folk/ritual/Indigenous, theatre, and glossary records. Identify duplicates, composites, unsupported enrichments, grade mismatches, broken relationships, and source/page claims that cannot be read.
2. Remediate instruments:
   - Verify Sinhala/name aliases, category/taxonomy, construction/material, sound production, playing method, role/use, ensemble/ritual context, grade, and exact evidence separately.
   - Retain the source-specific distinction between Sri Lankan/Pancha Turya, Hindustani, and Western classifications; do not force them into one generic hierarchy.
   - Withhold diagram-dependent or visually derived claims when original-PDF evidence is unavailable.
3. Remediate cultural traditions:
   - Verify each work-song, ritual, Indigenous, drumming/dance, and social-context claim without romanticizing or adding unsupported ethnographic detail.
   - Distinguish song/work/ritual forms and regional/contextual qualifiers exactly as the source supports them.
4. Remediate Nadagam, Nurthi, Sokari, Kolam, and any other theatre records field by field. Verify terminology, history/chronology, musical traits, roles, and relationships; quarantine claims whose evidence is absent, corrupt, or only visual.
5. Synchronize canonical terminology, glossary definitions, transliterations, English equivalents, and approved search aliases. Remove invented/circular definitions and ensure each public definition has claim-level evidence.
6. Update lists, details, source panels, search, and counts to use the shared publication policy. Direct routes to quarantined records must not imply verification.
7. Add validators/tests for field provenance, taxonomy validity, relationship targets, aliases/duplicates, grade scope, public/search/direct-route leakage, generated counts/docs, and stable-ID migrations.
8. Append exact before/after corrections, page evidence, quality/confidence, code line references, and unresolved manual-review needs to the ledger and correction log.

## Non-goals

- Do not perform the broad lesson, quiz, exam, curriculum-map, learning-path, Admin, Teacher, or UI-polish phases.
- Do not add culturally plausible details that the supplied sources do not establish.
- Do not redistribute textbook images, audio, or long passages. Do not deploy or merge.

## Verification

Run focused catalog/provenance/search/route tests and then `npm run test`, `npm run type-check`, `npm run lint`, and `npm run build`. Browser-check representative list/detail/search/quarantined routes at 360px and desktop if supported. Record exact unavailable evidence or environment limits.

## Mandatory local multi-agent Diffray review-fix loop

1. Make a local implementation commit after the first complete verified pass and record its SHA.
2. Record the exact local Diffray executable/version, `review --help`, available agents, and `codex-cli` support. An unknown-agent configuration warning is incomplete evidence and must be corrected and rerun.
3. Inventory all committed files and review coherent bounded batches from the repository root with `diffray review --base <base-sha> --head HEAD --files <short-comma-list> --executor codex-cli --json`. For bounded full-file documentation/data review only, use `diffray review --files <short-comma-list> --full --executor codex-cli --json`; never combine `--full` with `--base`/`--head`.
4. Primary coverage must omit `--agent` and `--skip-validation`, allowing the normal applicable multi-agent set and validation stage to run. Restricted-agent retries are diagnostic-only and validation-skipped runs cannot satisfy final coverage.
5. Let Diffray manage concurrency. Keep Windows arguments and JSON log paths short; never inline the diff, patch, contents, or a huge file list.
6. Record files, commands, transport, selected agents, validation, `agentsExecuted`, `agentsSucceeded`, failures, warnings, findings, and logs. Accept only valid `success: true` batches with applicable agents successful, validation complete, no unknown-agent warning, and no unresolved validated finding.
7. A one-agent batch needs explicit evidence that only one agent applied. Multiple distinct applicable agents must succeed across the complete phase diff, and accepted primary batches must cover every changed file. Earlier restricted or validation-skipped logs are supplemental only.
8. Treat this exact result as an unresolved blocker: “All failed before analysis because Diffray’s codex-cli executor exceeded the Windows command-line limit (ENAMETOOLONG). Zero analyzers completed, so there were no findings, fixes, or rejected findings. This is the exact unresolved review blocker.”
9. Preserve and retry a smaller/corrected batch after `ENAMETOOLONG`, timeout, HTTP/authentication failure, invalid/missing JSON, `success: false`, zero successful agents, incomplete validation, or unknown-agent warnings. After three failures for a required batch, stop and do not open a ready PR.
10. Validate findings, fix valid ones with regression coverage, rerun relevant gates, and consolidate all accepted findings from the cycle into one local `fix(review): ...` commit. Explain rejected findings; do not commit per finding.
11. Rerun only affected primary batches with normal multi-agent selection and validation enabled for at most three review-fix cycles, then run the full final verification gate.
12. Push and open a ready PR against `main` only after accepted multi-agent coverage, completed validation, and green gates. Never merge it.

## Paste-ready handoff

Return predecessor merge/base SHA, branch, implementation and review-fix SHAs, final HEAD/clean status, changed files, ledger/correction/migration paths, local Diffray executable/version plus every primary command/transport/batch/selected agent/validation/log/agent count/failure/warning/finding/fix/rejection, supplemental diagnostic runs, final multi-agent verdict, exact gates/browser results, ready PR URL/number/base/head/state, and all unresolved source/visual/SME items and deferred scope.

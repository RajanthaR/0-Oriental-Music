# Prompt 3 — Instruments and cultural-domain remediation

Implement Phase 3 of the Swara Maga forensic remediation programme: instruments, folk/ritual/Indigenous traditions, theatre traditions, and the synchronized glossary.

## Start gate

- Read `AGENTS.md`, the forensic-remediation plan, Prompts 1–2 handoffs, canonical ledger, correction log, publication policy, and terminology/provenance schemas.
- Start only after Prompt 2’s ready PR is human-merged into current `origin/main`. Fetch it, record the clean base SHA, and use the Codex worktree branch or create `codex/forensic-p03-cultural-catalogs` if detached/on `main`.
- Preserve prior evidence history and stable IDs. Do not reinterpret fields already verified in Phase 2 without stronger cited evidence and an explicit superseding ledger entry.
- Use `rajantha-skills-library:ce-code-review` for the mandatory full multi-agent review. Never expose secrets. Do not merge, deploy, or mutate hosted services.

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

## Mandatory `ce-code-review` skill review-fix loop

1. Make a local implementation commit after the first complete verified pass and record its SHA.
2. Inventory the complete phase diff from the predecessor/base SHA; stage required new files so the skill does not exclude them as untracked.
3. Invoke `rajantha-skills-library:ce-code-review base:<base-sha> grouping:auto` in default mode. Never request a quick/fast/light review or combine `base:` with a PR/branch target.
4. Record scope/base/head, the six always-on reviewers, warranted conditional reviewers and reasons, reviewer outcomes, run ID, and all artifacts under `/tmp/compound-engineering/ce-code-review/<run-id>/`.
5. Require the independent per-finding validator wave whenever findings survive. Record validated/rejected counts and reasons, infrastructure failures, over-budget drops, and degraded P0/P1 evidence; zero surviving findings is the only valid reason to skip validation.
6. Treat incomplete scope, missing artifacts, required reviewer failure, malformed output, degraded P0/P1 validation, or unmet explicit-plan requirements as blockers—not clean review evidence.
7. Let default mode apply and verify clear fixes and create its isolated local `fix(review): ...` commit on the clean tree. Resolve any remaining actionable `downstream-resolver` items with regression coverage and one tested local review-fix commit per cycle; record rejections and human/release-owned items.
8. Rerun the full skill against the same base for at most three review-fix cycles.
9. Accept only `status: complete`, complete scope/reviewer coverage, `Ready to merge`, no actionable findings, no degraded P0/P1 validation, and no unmet explicit-plan requirement. Resolve or explicitly classify residual risks/testing gaps.
10. Run the full final gate on reviewed HEAD. Only then may the phase agent push and open a ready PR against `main`; the skill itself never pushes or opens PRs. Never merge it.

## Paste-ready handoff

Return predecessor merge/base SHA, branch, implementation and review-fix SHAs, final HEAD/clean status, changed files, ledger/correction/migration paths, review-skill identifier/arguments, scope/base/head, run IDs/artifacts, reviewers/reasons/outcomes, validator metrics, findings/fixes/rejections/suppressions/demotions, residual risks/testing gaps, final skill verdict, exact gates/browser results, ready PR URL/number/base/head/state, and all unresolved source/visual/SME items and deferred scope.

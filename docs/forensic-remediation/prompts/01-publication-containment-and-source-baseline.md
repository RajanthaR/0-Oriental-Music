# Prompt 1 — Publication containment and auditable source baseline

You are taking over the “ස්වර මඟ” (Swara Maga) repository after two unreliable content-generation passes. Work in the Codex worktree created for this task with GPT-5.6 Luna at Max effort.

## Starting point and authority

- Repository: `RajanthaR/0-Oriental-Music`
- Start from current `origin/main`, which must include guardrail commit `6e62a3a`.
- Read `AGENTS.md` completely before taking action and follow Sections 8–11 literally.
- The repository’s Markdown source corpus may be used as evidence. The mandatory code review uses `rajantha-skills-library:ce-code-review`; do not substitute a quick review or informal reviewer set.
- Do not send credentials, tokens, private keys, local environment files, or unrelated user data.
- Do not merge the PR, deploy anything, mutate hosted services, or broaden this phase.

## Context you must independently verify

The application’s technical scaffold appears healthy, but the content layer is not trustworthy. Prior investigation identified public Grades 12–13/A/L claims without a supplied verified source set; unsupported or mis-scoped raga/tala entries; incorrect source/page citations; invented metadata and reviewer identities; hard-coded validation claims; inconsistent reconciliation counts; and incomplete learning paths. Passing schemas and builds are not evidence of curriculum truth.

The repository currently appears to contain extracted Markdown rather than original PDFs. Treat low-quality, corrupt, image-only, visual, or ambiguous evidence as `needs-review`. Recalculate inventories from the current checkout and record discrepancies; do not copy prior summary counts blindly.

## Phase objective

Create a safe, auditable baseline that prevents unsupported content from being presented as verified while preserving it for later remediation. This phase is publication containment and evidence infrastructure—not the full musical-content rewrite.

## Required implementation

1. Establish a clean baseline:
   - Verify the branch/worktree state, fetch `origin/main`, and record the exact base SHA.
   - Use the supplied Codex worktree branch. If it is detached or on `main`, create a dedicated `codex/forensic-p01-source-baseline` branch.
   - Inventory the source Markdown documents, PDF-page headings, page-quality classifications, source-document states, current public grades, public exam levels, lessons, ragas, talas, paths, and review states.
   - Recalculate reconciliation/action counts from source data and record all contradictions with generated documentation.

2. Add a machine-readable forensic ledger and human-readable report:
   - Give every issue a stable ID, severity, entity/path, current claim, evidence source and exact page/section when available, disposition, public visibility, confidence/evidence quality, and status.
   - Seed the ledger with every independently confirmed problem from the current app, including the known grade/A/L scope, Bhairav, Roopak, Bilawal, Lawani framing, sound terminology/citation, Dadra citation, source metadata, review metadata/admin count, learning-path, curriculum-map/coverage, and exam-label concerns.
   - Do not mark a claim corrected unless this phase actually corrects and verifies it.
   - Preserve ambiguous visual/OCR cases as explicit `needs-review` items.

3. Implement publication containment:
   - Define a single, typed publication-eligibility policy used by data queries and public discovery surfaces.
   - Publicly expose only Grades 6–11 content that has supportable supplied-source provenance.
   - Remove or clearly quarantine Grades 12–13 and A/L claims from homepage copy, navigation, grade selectors, search, lesson/path/exam discovery, metadata, and public counts.
   - Quarantine—not silently delete—known unsupported/mis-scoped Bhairav and Roopak entries and the falsely sourced sound/Dadra lesson claims until later correction.
   - Ensure direct dynamic routes cannot present quarantined entities as verified or published; use a clear Sinhala unavailable/under-review state or a safe not-found policy consistent with the app.
   - Preserve migration identifiers where feasible so future corrected records can restore progress.

4. Remove false certainty:
   - Replace untraceable publisher/year/place/licence/organization/reviewer/date values with explicit unknown or unverified states without inventing substitutes.
   - Make the public Sources and Admin views render real data-derived counts and honest states. Remove hard-coded “100% passed”, “published”, or completion claims not established by the datasets.
   - Correct generated audit/reconciliation documentation so its statistics are computed from or agree with canonical machine-readable artifacts.
   - Do not claim the platform is production-ready, fully source-grounded, curriculum-complete, or fully reviewed.

5. Strengthen validation and tests:
   - Add deterministic validators/tests that fail when unsupported grades or A/L content becomes publicly discoverable, quarantined entities leak into public data, a public claim lacks claim-level provenance, fake completed review metadata appears, source references point to missing page/section evidence, or generated counts drift from canonical data.
   - Cover direct-route containment, public/search/path/exam filters, and honest Admin counters.
   - Avoid brittle tests that merely snapshot today’s incorrect data.

6. Update relevant documentation:
   - Explain verified/public/quarantined/`needs-review` states and how a later phase promotes an item.
   - Document exact limitations of Markdown/OCR evidence and the original-PDF/manual-review gate.
   - Maintain an auditable before/after correction log with final file and line references.

## Explicit non-goals

- Do not complete the full raga, tala, acoustics, instrument, folk, theatre, curriculum-map, or lesson rewrite.
- Do not add new lessons or unsupported curriculum coverage.
- Do not redesign the application.
- Do not add server-side audio, tracking, accounts, copyrighted recordings, or third-party media.
- Do not perform deployment or merge the PR.

## Verification before the implementation commit

At minimum run the repository’s relevant targeted tests plus:
- `npm run test`
- `npm run type-check`
- `npm run lint`
- `npm run build`

Inspect the public-data paths for Grades 12–13/A/L and the named quarantined entities. If browser QA is practical, verify representative public and direct routes at 360px and desktop; report any environment limitation honestly.

## Mandatory `ce-code-review` skill review-fix loop

1. Commit the implemented phase locally first with a scoped implementation commit and record its SHA.
2. Inventory the complete phase diff from `BASE_SHA`, including code, tests, data, and documentation. Stage required new files because untracked files are excluded from skill scope.
3. Invoke the full review in default mode: `rajantha-skills-library:ce-code-review base:<BASE_SHA> grouping:auto`. Do not use quick/fast/light wording and do not combine `base:` with a PR number or branch target.
4. Record the scope/base/head and announced team. The six always-on reviewers are correctness, testing, maintainability, project-standards, `ce-agent-native-reviewer`, and `ce-learnings-researcher`, plus every conditional specialist warranted by the diff.
5. Preserve the run ID and `/tmp/compound-engineering/ce-code-review/<run-id>/` artifacts: metadata, per-reviewer JSON, synthesized/actionable findings, advisory outputs, and `report.md` or `review.json`.
6. When findings survive synthesis, require the independent per-finding validator wave. Record validator dispatches, validated/rejected results and reasons, infrastructure failures, over-budget drops, and degraded P0/P1 evidence. If zero findings survive, record that validation correctly did not run.
7. A required reviewer failure, missing artifact, incomplete file scope, validator infrastructure failure leaving degraded P0/P1 evidence, malformed result, or unmet explicit-plan requirement is a blocker—not “no findings.” Correct it and rerun; do not substitute an informal review.
8. In default mode, let the skill apply clear reversible fixes, verify them, and create one local `fix(review): ...` commit on the clean tree. Resolve any remaining actionable `downstream-resolver` findings, add regression coverage, and consolidate that cycle into one tested local review-fix commit. Record rejected/human/release-owned findings separately.
9. Rerun the full skill against the same base after fixes for at most three review-fix cycles.
10. Accept review only with `status: complete`, complete scope and required-reviewer coverage, `Ready to merge`, no actionable findings, no degraded P0/P1 validation, and no unmet explicit-plan requirement. Explicitly resolve or accept residual risks/testing gaps under this phase’s rules.
11. Run the full final verification suite on the reviewed HEAD.
12. Only then push the branch and open a ready-for-review PR against `main`. The review skill itself must never push or open the PR. Do not merge it.

## Required paste-ready final handoff

Return a self-contained block that the user can paste into the coordinating task. It must include:

- `PHASE`: Prompt 1 / publication containment and source baseline
- `BASE_SHA`
- `BRANCH`
- `IMPLEMENTATION_COMMIT`
- `REVIEW_FIX_COMMITS` (or explicit none, only if the full skill review completed with no actionable findings)
- `FINAL_HEAD_SHA`
- clean/dirty `WORKTREE_STATUS`
- `CHANGED_FILES`
- forensic ledger, correction log, and report paths
- exact review-skill identifier/arguments and scope/base/head
- every run ID/artifact path, reviewer set, conditional selection reason, and reviewer outcome
- validator metrics, findings, applied fixes, rejected/suppressed/demoted findings, residual risks, and testing gaps
- `SKILL_REVIEW_FINAL_VERDICT`
- exact verification commands and concise pass/fail results
- browser QA performed or exact reason it was not
- ready PR number, URL, base/head branches, and state
- remaining blockers, all `needs-review` items, and deferred scope

Do not replace evidence with a generic completion summary. If the review or a required gate is blocked, say so plainly and do not claim completion.

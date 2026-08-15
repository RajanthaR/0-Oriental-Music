# Prompt 1 — Publication containment and auditable source baseline

You are taking over the “ස්වර මඟ” (Swara Maga) repository after two unreliable content-generation passes. Work in the Codex worktree created for this task with GPT-5.6 Luna at Max effort.

## Starting point and authority

- Repository: `RajanthaR/0-Oriental-Music`
- Start from current `origin/main`, which must include guardrail commit `6e62a3a`.
- Read `AGENTS.md` completely before taking action and follow Sections 8–11 literally.
- The repository’s Markdown source corpus may be used as evidence. Sending the changed code and documentation to Diffray’s servers is explicitly allowed.
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

## Mandatory local multi-agent Diffray review-fix loop

1. Commit the implemented phase locally first with a scoped implementation commit and record its SHA.
2. Discover and record the exact locally installed Diffray executable, version, `review --help` output, available agents, and `codex-cli` executor support. A warning such as `Rule references unknown agent` makes review evidence incomplete until corrected and rerun.
3. Inventory every committed changed file and divide code, tests, data, and documentation into short coherent batches. From the repository root, use the normal local multi-agent review with validation enabled:

   ```powershell
   diffray review --base <base-sha> --head HEAD --files <short-comma-list> --executor codex-cli --json
   ```

   When diff transport is unsuitable for a bounded documentation/data batch, use `diffray review --files <short-comma-list> --full --executor codex-cli --json`. Do not combine `--full` with `--base`/`--head`.
4. Primary coverage commands must omit both `--agent` and `--skip-validation`, allowing Diffray to select all applicable agents and run validation. A later restricted `--agent <name>` retry is diagnostic-only; it cannot replace primary coverage. A validation-skipped run cannot satisfy final review.
5. Let Diffray manage its own concurrency. Keep Windows commands short, use short temporary JSON log paths, and never pass the full diff, patch, source contents, or a huge file list in command arguments.
6. Record every batch's files, command, transport, selected agents, validation result, `agentsExecuted`, `agentsSucceeded`, failures, findings, and log path. Accept a batch only with valid JSON, `success: true`, applicable successful agents, completed validation, no unknown-agent warning, and no unresolved validated actionable finding.
7. A single successful agent is not automatically sufficient. Accept a one-agent batch only when the structured output establishes that exactly one agent was applicable. Across the complete phase diff, multiple distinct applicable agents must succeed, and accepted primary batches together must cover every changed file. Earlier restricted or validation-skipped logs are supplemental only.
8. Treat this exact outcome as an unresolved blocker, never as “no findings”:

   “All failed before analysis because Diffray’s codex-cli executor exceeded the Windows command-line limit (ENAMETOOLONG). Zero analyzers completed, so there were no findings, fixes, or rejected findings. This is the exact unresolved review blocker.”

9. Preserve and retry a smaller or corrected bounded batch after `ENAMETOOLONG`, timeout, HTTP/authentication failure, invalid/missing JSON, `success: false`, zero successful agents, incomplete validation, or unknown-agent warnings. After three unsuccessful attempts for a required batch, stop and report the blocker; do not open a ready PR.
10. Validate every finding. Fix valid findings, add regression coverage, rerun relevant checks, and consolidate all accepted findings from that review cycle into one local `fix(review): ...` commit. Record rejected findings with reasons; do not commit once per finding.
11. Rerun only affected primary batches with normal multi-agent selection and validation enabled. Repeat for at most three review-fix cycles until no actionable finding remains.
12. Run the full final verification suite on the reviewed HEAD.
13. Push the branch and open a ready-for-review PR against `main` only when mandatory multi-agent coverage, validation, and required gates are complete. Do not merge it.

## Required paste-ready final handoff

Return a self-contained block that the user can paste into the coordinating task. It must include:

- `PHASE`: Prompt 1 / publication containment and source baseline
- `BASE_SHA`
- `BRANCH`
- `IMPLEMENTATION_COMMIT`
- `REVIEW_FIX_COMMITS` (or explicit none, only if Diffray completed with no actionable findings)
- `FINAL_HEAD_SHA`
- clean/dirty `WORKTREE_STATUS`
- `CHANGED_FILES`
- forensic ledger, correction log, and report paths
- exact local Diffray executable/version, primary command pattern, and transport
- every file batch, selected agent set, and validation result, distinguishing primary multi-agent from supplemental diagnostic runs
- per-batch `agentsExecuted`, `agentsSucceeded`, failures, warnings, log path, findings, fixes, and rejected findings
- `DIFFRAY_FINAL_VERDICT`
- exact verification commands and concise pass/fail results
- browser QA performed or exact reason it was not
- ready PR number, URL, base/head branches, and state
- remaining blockers, all `needs-review` items, and deferred scope

Do not replace evidence with a generic completion summary. If the review or a required gate is blocked, say so plainly and do not claim completion.

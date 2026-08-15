# Prompt 7 — Independent forensic audit and release-readiness evidence

Implement Phase 7 of the Swara Maga forensic remediation programme: independently audit the completed repository scope, fix residual repository-owned defects, and publish bounded release-readiness evidence without deploying.

## Start gate

- Read `AGENTS.md`, the full forensic plan, all six predecessor handoffs, every issue/correction/migration/QA artifact, and current release/privacy/source documentation.
- Start only after Prompt 6’s ready PR is human-merged into current `origin/main`. Fetch, verify a clean worktree, record the base SHA, and use the supplied worktree branch or create `codex/forensic-p07-release-audit` if detached/on `main`.
- Audit independently: do not accept a prior “fixed”, “verified”, “complete”, or “passed” label without checking the current data/UI/test evidence.
- Sending changed files to Diffray is allowed. Never send secrets or user/microphone data. Do not merge, deploy, publish a release, or mutate hosted services.

## Objective

Determine exactly what is safe and verified for a Grades 6–11 release, fix remaining evidence-backed repository defects, and expose every source/manual/device/external blocker. A green build alone is not release readiness.

## Required audit and remediation

1. Reconcile the master issue ledger:
   - Check every issue status against current source evidence, canonical data, rendered/public behavior, tests, docs, correction line references, and Git history.
   - Reopen false or stale closures; verify quarantine and migrations; identify orphan fixes, missing tests, inconsistent counts, and documentation drift.
2. Perform risk-based plus reproducible random sampling of public claims across acoustics, terminology, ragas, talas, instruments, traditions, theatre, glossary, lessons, quizzes, exams, competencies, and paths.
   - Sample exact source pages/sections and field values, emphasizing low-quality/OCR evidence, arrays/notation, grade assignments, chronology, and culturally sensitive claims.
   - Record sampling seed/method, population, sample, result, and limitations. Do not infer visual evidence from Markdown.
3. Run a comprehensive leakage/false-certainty audit across repository text, generated output, routes, metadata, search index, counts, and browser UI for Grades 12–13/A/L, Bhairav/Roopak or other quarantined items, invented publishers/licences/reviewers/dates, “100%”, production-ready/complete claims, stale old counts, and broken citations.
4. Run technical QA:
   - Full unit/component/integration/E2E gates, type/lint/build, production build/start smoke, route/link integrity, storage migrations, error boundaries, console/network checks, responsive/accessibility matrix, Web Audio lifecycle, microphone privacy/denial, and direct quarantined routes.
   - Run available dependency/security/license checks and distinguish new, pre-existing, tooling, and external findings.
5. Fix only residual repository-owned defects whose intended outcome is established by existing evidence. Add regression tests and append correction entries. Missing originals, unreadable OCR, SME decisions, or unavailable real devices remain explicit blockers/exclusions rather than invented fixes.
6. Produce a release-evidence report with:
   - verified public scope and exclusions;
   - entity/claim/competency coverage categories and their calculation;
   - source quality and unresolved original-PDF/manual-review inventory;
   - exact automated/browser/accessibility/audio/privacy evidence;
   - security/dependency/license results;
   - known risks, operational/static-hosting assumptions, rollback notes, and a release verdict.
7. The verdict must be one of `READY_FOR_VERIFIED_SCOPE`, `CONDITIONALLY_READY`, or `NOT_READY`, with exact blockers. Do not use “production-ready” unless all required evidence for the stated scope actually exists.

## Non-goals

- Do not expand to Grades 12–13/A/L, obtain or invent source material, conduct a formal SME approval, claim unrun real-device testing, deploy, create a release/tag, or merge.
- Do not close external/manual blockers just to reach a favorable verdict.

## Verification

Run all repository scripts relevant to test, type-check, lint, build, E2E, security/dependencies/licenses, and production smoke. At minimum run `npm run test`, `npm run type-check`, `npm run lint`, and `npm run build`. Record exact commands, versions/environment, output summaries, browser/viewports/input/permission states, and any unavailable gate.

## Mandatory local multi-agent Diffray review-fix loop

1. Commit the Phase 7 audit/remediation/report locally after the initial gates and record its implementation SHA.
2. Record the exact local Diffray executable/version, `review --help`, available agents, and `codex-cli` support. An unknown-agent configuration warning is incomplete evidence and must be corrected and rerun.
3. Inventory every Phase 7 changed file and declare a bounded high-risk cross-phase sample covering canonical data, validators, publication policy, public queries, migrations, and release claims.
4. Review coherent bounded batches from the repository root with `diffray review --base <base-sha> --head HEAD --files <short-comma-list> --executor codex-cli --json`. For bounded full-file documentation/data sampling only, use `diffray review --files <short-comma-list> --full --executor codex-cli --json`; never combine `--full` with `--base`/`--head`.
5. Primary coverage must omit `--agent` and `--skip-validation`, allowing the normal applicable multi-agent set and validation stage to run. Restricted-agent retries are diagnostic-only and validation-skipped runs cannot satisfy final coverage.
6. Let Diffray manage concurrency. Keep Windows arguments and JSON log paths short; never inline the diff, patch, contents, or a huge file list.
7. Record files, commands, transport, selected agents, validation, `agentsExecuted`, `agentsSucceeded`, failures, warnings, findings, and logs. Accept only valid `success: true` batches with applicable agents successful, validation complete, no unknown-agent warning, and no unresolved validated finding.
8. A one-agent batch needs explicit evidence that only one agent applied. Multiple distinct applicable agents must succeed across the Phase 7 diff and high-risk sample. Accepted primary batches must cover every Phase 7 change and the declared sampling set; earlier restricted or validation-skipped logs are supplemental only.
9. This is an unresolved blocker, never “no findings”: “All failed before analysis because Diffray’s codex-cli executor exceeded the Windows command-line limit (ENAMETOOLONG). Zero analyzers completed, so there were no findings, fixes, or rejected findings. This is the exact unresolved review blocker.”
10. Preserve and retry a smaller/corrected batch after `ENAMETOOLONG`, timeout, HTTP/authentication failure, invalid/missing JSON, `success: false`, zero successful agents, incomplete validation, or unknown-agent warnings. Stop after three failures for a required batch; the verdict cannot be ready and no ready PR may be opened.
11. Validate findings, fix valid ones with regression coverage, rerun relevant gates, and consolidate all accepted findings from the cycle into one local `fix(review): ...` commit. Record rejected findings and reasons; do not commit per finding.
12. Rerun only affected primary batches with normal multi-agent selection and validation enabled for at most three review-fix cycles. Rerun full final verification and update the release verdict/report on reviewed HEAD.
13. Push and open a ready PR against `main` only if mandatory multi-agent coverage, completed validation, and phase gates complete. If an external source/manual blocker prevents release readiness but the Phase 7 repository work and review are complete, the PR may still be ready for code review while the report verdict remains `CONDITIONALLY_READY` or `NOT_READY`. Never merge it.

## Paste-ready final programme handoff

Return predecessor merge/base SHA, branch, implementation/review-fix commits, final HEAD/clean status, changed files, ledger closure statistics and reopened issues, sampling method/results, leakage results, local Diffray executable/version, exact primary commands/transport/batches/selected agents/validation/logs/counts/failures/warnings/findings/fixes/rejections, supplemental diagnostic runs, final multi-agent verdict, every automated/security/build/browser/accessibility/audio/privacy result, release-report path and verdict, ready PR URL/number/base/head/state, remaining manual/source/device/external blockers, exclusions, risks, and explicitly unperformed deployment/release actions.

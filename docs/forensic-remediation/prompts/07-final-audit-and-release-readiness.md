# Prompt 7 — Independent forensic audit and release-readiness evidence

Implement Phase 7 of the Swara Maga forensic remediation programme: independently audit the completed repository scope, fix residual repository-owned defects, and publish bounded release-readiness evidence without deploying.

## Start gate

- Read `AGENTS.md`, the full forensic plan, all six predecessor handoffs, every issue/correction/migration/QA artifact, and current release/privacy/source documentation.
- Start only after Prompt 6’s ready PR is human-merged into current `origin/main`. Fetch, verify a clean worktree, record the base SHA, and use the supplied worktree branch or create `codex/forensic-p07-release-audit` if detached/on `main`.
- Audit independently: do not accept a prior “fixed”, “verified”, “complete”, or “passed” label without checking the current data/UI/test evidence.
- The mandatory review is the full `rajantha-skills-library:ce-code-review` skill workflow. Never expose secrets or user/microphone data in review artifacts. Do not merge, deploy, publish a release, or mutate hosted services.

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

## Mandatory `ce-code-review` skill review-fix loop

1. Commit the Phase 7 audit/remediation/report locally after the initial gates and record its implementation SHA. Begin review from a clean worktree.
2. Inventory every Phase 7 changed file and declare the bounded high-risk cross-phase audit scope covering canonical data, validators, publication policy, public queries, migrations, and release claims. Stage any intentionally new files so the review diff is complete.
3. Invoke the full review skill in default mode from the repository root: `rajantha-skills-library:ce-code-review base:<base-sha> grouping:auto`. Do not request a quick, fast, light, single-reviewer, report-only, or conflicting target review.
4. Record the resolved base/head SHAs, review scope, run ID, and artifact directory under `/tmp/compound-engineering/ce-code-review/<run-id>/`.
5. Require all six always-on reviewers—correctness, testing, maintainability, project standards, agent-native architecture, and learnings/history—plus every conditional reviewer selected from the diff. Record each reviewer, selection reason, and outcome.
6. Require the independent per-finding validator wave for all surviving findings. Record validators launched/completed, validated/demoted/suppressed counts, any degraded validation, and the reasons for every rejected or suppressed finding.
7. Incomplete diff scope, a missing required reviewer or artifact, a failed reviewer, invalid output, or degraded validation of a P0/P1 finding is a review blocker rather than a clean result.
8. In default mode, allow the skill to apply safe fixes, run relevant verification, and create its local `fix(review): ...` commit. Resolve any remaining actionable findings with regression coverage where appropriate and one local review-fix commit per cycle.
9. Rerun the complete skill review after fixes for no more than three review-fix cycles. Preserve every run artifact and explicitly report any remaining actionable finding or residual risk.
10. Accept the review only when scope is complete, all required reviewers and artifacts are present, the skill verdict is `Ready to merge`, no actionable finding remains, no P0/P1 validation is degraded, and no explicit plan requirement is unmet.
11. Rerun full final verification and update the release verdict/report on the reviewed HEAD.
12. Push and open a ready PR against `main` only if the skill review and phase gates are complete. The review skill itself never pushes, opens a PR, switches branches, or merges. If an external source/manual blocker prevents release readiness but the Phase 7 repository work and review are complete, the PR may still be ready for code review while the report verdict remains `CONDITIONALLY_READY` or `NOT_READY`. Never merge it.

## Paste-ready final programme handoff

Return predecessor merge/base SHA, branch, implementation/review-fix commits, final HEAD/clean status, changed files, ledger closure statistics and reopened issues, sampling method/results, leakage results, review-skill identifier and arguments, resolved review scope/base/head, run IDs and artifact paths, always-on and conditional reviewers with selection reasons/outcomes, validator metrics and degradation state, findings/fixes/rejections/suppressions/demotions, residual risks and testing gaps, final skill-review verdict, every automated/security/build/browser/accessibility/audio/privacy result, release-report path and verdict, ready PR URL/number/base/head/state, remaining manual/source/device/external blockers, exclusions, risks, and explicitly unperformed deployment/release actions.

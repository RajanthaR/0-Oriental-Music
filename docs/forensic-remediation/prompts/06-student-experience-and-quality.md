# Prompt 6 — Student experience, accessibility, Web Audio, and privacy QA

Implement Phase 6 of the Swara Maga forensic remediation programme under content freeze: verify and fix the mobile Sinhala experience, accessibility, Web Audio behavior, privacy, and end-to-end state flows.

## Start gate

- Read `AGENTS.md`, the forensic plan, all predecessor handoffs, final eligibility/graph/path contracts, correction ledger, and privacy/audio documentation.
- Start only after Prompt 5’s ready PR is human-merged into current `origin/main`. Fetch, verify a clean worktree, record the base SHA, and use the Codex worktree branch or create `codex/forensic-p06-student-quality` if detached/on `main`.
- Content is frozen. Correct factual content only when an existing verified source and ledger entry prove the defect; otherwise record it for the final audit rather than improvising.
- Use `rajantha-skills-library:ce-code-review` for the mandatory full multi-agent review. Never expose secrets or microphone data. Do not merge, deploy, or mutate hosted services.

## Objective

Prove that the remediated, source-bounded application works as a mobile-first Sinhala learning product across critical journeys, input methods, permissions, state transitions, and failure conditions while preserving its client-only audio and child-privacy promises.

## Required implementation

1. Define and execute a journey matrix covering homepage → grade/goal → path → lesson → audio/activity → quiz → feedback → progress, plus search, bookmarks, assignments, curriculum/source views, and quarantined/direct routes.
2. Responsive/mobile QA:
   - Test 320, 360, and 390px widths plus representative tablet/desktop widths.
   - Fix horizontal overflow, clipped Sinhala, long-word wrapping, tables/notation, fixed/sticky overlap, orientation changes, safe areas, and touch targets below 44px where required.
3. Accessibility QA:
   - Verify document language, landmarks, heading order, accessible names/descriptions, form instructions/errors, keyboard order, visible focus, skip/navigation behavior, dialogs, live regions, contrast, color-independent states, reduced motion, and screen-reader-friendly audio/quiz status.
   - Ensure unavailable/under-review Sinhala messages are clear and do not trap focus or expose false verification state.
4. Web Audio QA:
   - Verify explicit activation/no autoplay, accurate canonical raga/tala mapping, start/stop/restart, overlapping notes, repeated route changes, AudioContext suspension/resume, cleanup, tempo changes, rapid taps, and low-bandwidth mode.
   - Verify microphone permission granted/denied/dismissed, no device, insecure/unavailable API, visibility changes, and cleanup. Never record, persist, or transmit audio.
5. Privacy/network QA:
   - Inspect application behavior for trackers, analytics, external media, microphone uploads, unexpected network calls, and accidental sensitive logging.
   - Ensure privacy/source messaging matches implemented behavior without overclaiming device/browser guarantees.
6. Persistence/migration QA:
   - Test progress, bookmarks, streak/mastery, selected grade/path, teacher collections/assignments, old ID aliases, quarantined records, reloads, and malformed/old localStorage data.
7. Add focused component/integration/E2E tests for each fixed defect. Prefer semantic assertions and stable test IDs only when necessary; avoid image/snapshot churn.
8. Update QA evidence and the correction ledger with viewport/browser/input, expected/actual result, reproduction, fix, regression test, and unresolved environmental limitations.

## Non-goals

- Do not reopen broad content completion, redesign the visual identity, add accounts/backends/analytics/media, or expand scope.
- Do not claim real-device or screen-reader coverage that was not executed.
- Do not deploy or merge.

## Verification

Run focused tests and the available end-to-end/browser suite, then `npm run test`, `npm run type-check`, `npm run lint`, and `npm run build`. Smoke a production build/start if the repository supports it. Record exact browsers, viewport sizes, input methods, permission states, console/network findings, and untested device gaps.

## Mandatory `ce-code-review` skill review-fix loop

1. Create a local implementation commit after the initial verified QA/fix pass and record its SHA.
2. Inventory the complete phase diff from the predecessor/base SHA; stage required new files so the skill does not exclude them as untracked.
3. Invoke `rajantha-skills-library:ce-code-review base:<base-sha> grouping:auto` in default mode. Never request a quick/fast/light review or combine `base:` with a PR/branch target.
4. Record scope/base/head, the six always-on reviewers, warranted conditional reviewers and reasons, reviewer outcomes, run ID, and all artifacts under `/tmp/compound-engineering/ce-code-review/<run-id>/`.
5. Require the independent per-finding validator wave whenever findings survive. Record validated/rejected counts and reasons, infrastructure failures, over-budget drops, and degraded P0/P1 evidence; zero surviving findings is the only valid reason to skip validation.
6. Treat incomplete scope, missing artifacts, required reviewer failure, malformed output, degraded P0/P1 validation, or unmet explicit-plan requirements as blockers—not clean review evidence.
7. Let default mode apply and verify clear fixes and create its isolated local `fix(review): ...` commit on the clean tree. Resolve any remaining actionable `downstream-resolver` items with regression/QA coverage and one tested local review-fix commit per cycle; record rejections and human/release-owned items.
8. Rerun the full skill against the same base for at most three review-fix cycles.
9. Accept only `status: complete`, complete scope/reviewer coverage, `Ready to merge`, no actionable findings, no degraded P0/P1 validation, and no unmet explicit-plan requirement. Resolve or explicitly classify residual risks/testing gaps.
10. Rerun the complete final automated/browser gate on reviewed HEAD. Only then may the phase agent push and open a ready PR against `main`; the skill itself never pushes or opens PRs. Never merge it.

## Paste-ready handoff

Return predecessor/base/branch, implementation and review-fix SHAs, final HEAD/clean status, changed files, QA/ledger/test artifacts, review-skill identifier/arguments, scope/base/head, run IDs/artifacts, reviewers/reasons/outcomes, validator metrics, findings/fixes/rejections/suppressions/demotions, residual risks/testing gaps, final skill verdict, exact automated and production-smoke results, browser/viewport/input/permission/network matrix, ready PR URL/number/base/head/state, untested device/accessibility gaps, blockers, and deferred scope.

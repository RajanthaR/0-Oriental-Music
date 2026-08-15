# Prompt 6 — Student experience, accessibility, Web Audio, and privacy QA

Implement Phase 6 of the Swara Maga forensic remediation programme under content freeze: verify and fix the mobile Sinhala experience, accessibility, Web Audio behavior, privacy, and end-to-end state flows.

## Start gate

- Read `AGENTS.md`, the forensic plan, all predecessor handoffs, final eligibility/graph/path contracts, correction ledger, and privacy/audio documentation.
- Start only after Prompt 5’s ready PR is human-merged into current `origin/main`. Fetch, verify a clean worktree, record the base SHA, and use the Codex worktree branch or create `codex/forensic-p06-student-quality` if detached/on `main`.
- Content is frozen. Correct factual content only when an existing verified source and ledger entry prove the defect; otherwise record it for the final audit rather than improvising.
- Diffray server review of changed files is allowed. Never send secrets or microphone data. Do not merge, deploy, or mutate hosted services.

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

## Mandatory local multi-agent Diffray review-fix loop

1. Create a local implementation commit after the initial verified QA/fix pass and record its SHA.
2. Record the exact local Diffray executable/version, `review --help`, available agents, and `codex-cli` support. An unknown-agent configuration warning is incomplete evidence and must be corrected and rerun.
3. Inventory all committed files and review coherent bounded batches from the repository root with `diffray review --base <base-sha> --head HEAD --files <short-comma-list> --executor codex-cli --json`. For bounded full-file documentation/data review only, use `diffray review --files <short-comma-list> --full --executor codex-cli --json`; never combine `--full` with `--base`/`--head`.
4. Primary coverage must omit `--agent` and `--skip-validation`, allowing the normal applicable multi-agent set and validation stage to run. Restricted-agent retries are diagnostic-only and validation-skipped runs cannot satisfy final coverage.
5. Let Diffray manage concurrency. Keep Windows arguments and JSON log paths short; never inline the diff, patch, source contents, screenshots, or a huge file list.
6. Record files, commands, transport, selected agents, validation, `agentsExecuted`, `agentsSucceeded`, failures, warnings, findings, and logs. Accept only valid `success: true` batches with applicable agents successful, validation complete, no unknown-agent warning, and no unresolved validated finding.
7. A one-agent batch needs explicit evidence that only one agent applied. Multiple distinct applicable agents must succeed across the complete phase diff, and accepted primary batches must cover every changed file. Earlier restricted or validation-skipped logs are supplemental only.
8. This exact outcome is an unresolved blocker: “All failed before analysis because Diffray’s codex-cli executor exceeded the Windows command-line limit (ENAMETOOLONG). Zero analyzers completed, so there were no findings, fixes, or rejected findings. This is the exact unresolved review blocker.”
9. Preserve and retry a smaller/corrected batch after `ENAMETOOLONG`, timeout, HTTP/authentication failure, invalid/missing JSON, `success: false`, zero successful agents, incomplete validation, or unknown-agent warnings. Stop after three failures for a required batch; do not open a ready PR.
10. Validate findings, fix valid ones with regression coverage, rerun relevant QA, and consolidate all accepted findings from the cycle into one local `fix(review): ...` commit. Record rejected findings with technical reasons; do not commit per finding.
11. Rerun only affected primary batches with normal multi-agent selection and validation enabled for at most three review-fix cycles, then rerun the complete final automated/browser gate on reviewed HEAD.
12. Push and open a ready PR against `main` only after accepted multi-agent coverage, completed validation, and passing required gates. Never merge it.

## Paste-ready handoff

Return predecessor/base/branch, implementation and review-fix SHAs, final HEAD/clean status, changed files, QA/ledger/test artifacts, local Diffray executable/version, exact primary commands/transport/batches/selected agents/validation/logs/counts/failures/warnings/findings/fixes/rejections, supplemental diagnostic runs, final multi-agent verdict, exact automated and production-smoke results, browser/viewport/input/permission/network matrix, ready PR URL/number/base/head/state, untested device/accessibility gaps, blockers, and deferred scope.

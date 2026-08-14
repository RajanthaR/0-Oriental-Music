# Prompt 5 — Curriculum graph, learning paths, search, and workspaces

Implement Phase 5 of the Swara Maga forensic remediation programme: turn curriculum mapping, learning paths, search, Admin, and Teacher views into computed projections of verified content.

## Start gate

- Read `AGENTS.md`, the forensic plan, all predecessor handoffs, the final public lesson catalog, provenance/publication contracts, correction ledger, and migration maps.
- Start only after Prompt 4’s ready PR is human-merged into current `origin/main`. Fetch, verify a clean worktree, record the base SHA, and use the Codex worktree branch or create `codex/forensic-p05-curriculum-workspaces` if detached/on `main`.
- Treat the remediated data layer as authoritative. Do not rewrite source facts in this phase unless a newly found contradiction is ledgered, evidenced, and narrowly corrected.
- Diffray review of changed repository files is allowed. Never send secrets. Do not merge, deploy, or mutate hosted services.

## Objective

Build an exact competency → concept → prerequisite → lesson/activity/assessment graph, compute honest coverage/gaps, repair goal-oriented paths, and bind student/teacher/admin discovery surfaces to real eligible records and review events.

## Required implementation

1. Build or correct the curriculum graph:
   - Map each verified competency/outcome to exact source document/page/section, grade, concepts, prerequisite edges, eligible lessons/activities/assessments, and evidence state.
   - Distinguish verified, partial, blocked-by-source, deferred, and absent coverage. Do not call grouped lesson lists a curriculum map.
   - Detect invalid targets, duplicate edges, cycles where forbidden, grade inversions, orphan concepts, and documentation/data drift.
2. Compute coverage and public counts from canonical records. Remove hand-entered totals and “complete/100%” copy not entailed by data. Generated docs and UI must use or agree with the same calculation.
3. Repair learning paths:
   - Eliminate repeated lesson steps, broken prerequisites, dead ends, false difficulty progression, unsupported grade/exam destinations, and goals that the selected steps cannot satisfy.
   - Ensure the performance path actually contains eligible performance instruction and that digital/audio goals do not route to unrelated exam-pattern material.
   - Add deterministic path reachability, uniqueness, prerequisite ordering, grade/publication, and goal-satisfaction validation.
4. Repair search/navigation:
   - Index only eligible content; ensure quarantined records do not leak through suggestions, aliases, counts, or direct results.
   - Preserve approved Sinhala normalization/transliteration aliases without conflating distinct official terminology.
5. Repair Admin:
   - Bind stage counts, validators, issue lists, reviewer/event history, and publication readiness to actual data.
   - Never synthesize reviewer names, dates, licences, or approval events. Show honest empty/unverified states.
6. Repair Teacher workspace:
   - Restrict collections/assignments/printable outlines to eligible content.
   - Display exact competency/lesson mapping and gaps; preserve local-only behavior and migrate stored IDs as needed.
7. Update relevant student discovery, progress, source, and curriculum pages so their labels/counts/links agree with the graph and policy.
8. Add unit/integration/browser tests for graph invariants, computed metrics, path flows, search containment, Admin data binding, Teacher assignment/print output, persistence, and direct routes. Append all corrections and new blockers to the evidence ledger.

## Non-goals

- Do not expand curriculum scope or invent content to improve coverage percentages.
- Do not perform the broad visual/accessibility/audio QA phase except where required to validate changed flows.
- Do not add accounts/backends, deploy, or merge.

## Verification

Run focused graph/path/search/Admin/Teacher/storage tests, then `npm run test`, `npm run type-check`, `npm run lint`, and `npm run build`. Browser-test representative student, search, path, Admin, Teacher, print, and direct-quarantine flows at 360px and desktop if supported. Report any unavailable browser/print evidence.

## Mandatory local commit and Diffray review-fix loop

1. Create and record a local implementation commit after initial verification.
2. Review every committed changed file with Diffray from the repo root. Use repository/stdin transport, short bounded explicit `--files` batches, small analyzer sets, `--executor codex-cli`, structured JSON, and short temporary log paths; never place a full diff, file contents, or a huge combined file list in the command line.
3. Record files/analyzers/`agentsExecuted`/`agentsSucceeded`/failures/findings/logs for each batch; successful batches must cover every changed file.
4. Treat this as an unresolved blocker: “All failed before analysis because Diffray’s codex-cli executor exceeded the Windows command-line limit (ENAMETOOLONG). Zero analyzers completed, so there were no findings, fixes, or rejected findings. This is the exact unresolved review blocker.”
5. Retry smaller batches after `ENAMETOOLONG`, timeout, invalid/missing JSON, `success: false`, or zero successful analyzers. Preserve failed evidence. Stop after three failed attempts for a required batch; no ready PR.
6. Validate findings; fix valid ones with regression coverage, rerun relevant gates, and create a separate local `fix(review): ...` commit. Explain rejected findings.
7. Re-run affected batches for up to three cycles until no actionable findings remain, then run the complete final verification suite.
8. Push and open a ready PR against `main` only after successful Diffray coverage and gates. Never merge it.

## Paste-ready handoff

Return predecessor/base/branch, implementation and review-fix SHAs, final HEAD/clean status, changed files, graph/coverage/path/migration/ledger paths, exact Diffray command/transport/batches/analyzers/logs/counts/findings/fixes/rejections/verdict, exact gates and browser results, ready PR URL/number/base/head/state, measured coverage categories, remaining graph/content/source blockers, and deferred scope.

# Prompt 4 — Source-derived lessons, quizzes, and examinations

Implement Phase 4 of the Swara Maga forensic remediation programme: rebuild the Grades 6–11/O/L student content layer from the verified canonical foundation.

## Start gate

- Read `AGENTS.md`, the full forensic plan, all predecessor handoffs, the canonical ledger/correction log, publication policy, corrected terminology, and canonical entity schemas.
- Start only after Prompt 3’s ready PR is human-merged into current `origin/main`. Fetch, verify a clean worktree, record the base SHA, and use the supplied worktree branch or create `codex/forensic-p04-learning-content` if detached/on `main`.
- Preserve stable lesson/quiz IDs or provide explicit progress/bookmark migration mappings. Preserve append-only evidence history.
- Sending changed repository files to Diffray is allowed. Never send secrets. Do not merge, deploy, or mutate hosted systems.

## Objective

Replace unreliable lesson and assessment prose with concise, original, source-derived Sinhala learning content whose factual claims, level, prerequisites, activities, answers, and citations are testable. Do not chase an arbitrary lesson count or claim complete curriculum coverage.

## Required implementation

1. Derive a machine-readable content backlog from verified competency/content evidence and current records. Mark each lesson/quiz/exam as keep, correct, rewrite, split, merge, quarantine, blocked, or archive-with-migration; give exact reasons and dependencies.
2. Remediate lessons in dependency order:
   - Use natural Sinhala and the repository’s structured lesson contract where pedagogically applicable.
   - Verify title, grade band, goal, prerequisites, explanations, terms, notation, recap, activities, quiz link, source document, and exact page/section.
   - Keep explanations concise and original; do not copy long textbook passages.
   - Do not make claims whose only evidence is unreadable OCR or an unseen diagram. Keep those sections or entire lessons non-public with `needs-review` evidence.
3. Align synthetic listening, sing/play, guided, and independent activities to corrected canonical raga/tala/instrument records. Preserve no-autoplay, client-only audio, privacy, and realistic physical/grade prerequisites.
4. Rebuild quizzes:
   - Verify each stem, answer, distractor, matching/order item, and Sinhala explanation against the lesson evidence.
   - Ensure at least one unambiguous correct answer, deterministic scoring, supportive feedback, and no answer leakage or false exactness.
   - Remove or quarantine questions that require unavailable visual/audio evidence.
5. Rebuild examination practice:
   - Publish only source-supported Grades 6–11/O/L levels and patterns.
   - Remove the false A/L surface and prevent page-title/paper-level template mismatches.
   - Clearly distinguish original practice questions from official past-paper content and do not imply endorsement.
6. Repair all affected cross-references, recommendations, progress/bookmarks, search records, counts, and direct routes. Do not implement the full path/curriculum/Admin phase here.
7. Add tests for source/level eligibility, prerequisite targets/cycles, goal prefix/schema, quiz answerability, exam labeling, public/search/direct-route containment, IDs/migrations, source-page existence, and canonical-record references.
8. Append per-record before/after evidence, source pages, evidence quality, final line references, rights disposition, and unresolved content to the forensic ledger and correction log.

## Non-goals

- Do not claim every curriculum outcome is covered; the computed curriculum/coverage phase follows.
- Do not add Grades 12–13/A/L, copyrighted recordings, copied exam papers, or unsupported textbook diagrams.
- Do not redesign workspaces, deploy, or merge.

## Verification

Run targeted lesson/quiz/exam/provenance/migration tests and then `npm run test`, `npm run type-check`, `npm run lint`, and `npm run build`. Browser-check representative lesson/activity/quiz/exam/direct-quarantine flows at 360px and desktop when supported. Report evidence limitations exactly.

## Mandatory local multi-agent Diffray review-fix loop

1. Commit the initial completed implementation locally and record the implementation SHA.
2. Record the exact local Diffray executable/version, `review --help`, available agents, and `codex-cli` support. An unknown-agent configuration warning is incomplete evidence and must be corrected and rerun.
3. Inventory all committed code, JSON, tests, and docs, then review coherent bounded batches from the repository root with `diffray review --base <base-sha> --head HEAD --files <short-comma-list> --executor codex-cli --json`. For bounded full-file documentation/data review only, use `diffray review --files <short-comma-list> --full --executor codex-cli --json`; never combine `--full` with `--base`/`--head`.
4. Primary coverage must omit `--agent` and `--skip-validation`, allowing the normal applicable multi-agent set and validation stage to run. Restricted-agent retries are diagnostic-only and validation-skipped runs cannot satisfy final coverage.
5. Let Diffray manage concurrency. Keep Windows arguments and JSON log paths short; never inline the diff, patch, contents, or a huge file list.
6. Record files, commands, transport, selected agents, validation, `agentsExecuted`, `agentsSucceeded`, failures, warnings, findings, and logs. Accept only valid `success: true` batches with applicable agents successful, validation complete, no unknown-agent warning, and no unresolved validated finding.
7. A one-agent batch needs explicit evidence that only one agent applied. Multiple distinct applicable agents must succeed across the complete phase diff, and accepted primary batches must cover every changed file. Earlier restricted or validation-skipped logs are supplemental only.
8. This is a blocker, not a clean run: “All failed before analysis because Diffray’s codex-cli executor exceeded the Windows command-line limit (ENAMETOOLONG). Zero analyzers completed, so there were no findings, fixes, or rejected findings. This is the exact unresolved review blocker.”
9. Preserve and retry a smaller/corrected batch after `ENAMETOOLONG`, timeout, HTTP/authentication failure, invalid/missing JSON, `success: false`, zero successful agents, incomplete validation, or unknown-agent warnings. Stop after three failed attempts for a required batch; do not open a ready PR.
10. Validate findings, fix valid ones with regression tests, rerun relevant gates, and consolidate all accepted findings from the cycle into one local `fix(review): ...` commit. Record rejected findings and rationale; do not commit per finding.
11. Rerun only affected primary batches with normal multi-agent selection and validation enabled for at most three review-fix cycles. Run the complete final gate on reviewed HEAD.
12. Push and open a ready PR against `main` only after accepted multi-agent coverage, completed validation, and passing gates. Never merge it.

## Paste-ready handoff

Return phase/predecessor/base, branch, implementation and review-fix commits, final HEAD/worktree status, changed records/files and migrations, evidence/rights/correction paths, local Diffray executable/version, exact primary commands/transport/batches/selected agents/validation/logs/counts/failures/warnings/findings/fixes/rejections, supplemental diagnostic runs, final multi-agent verdict, exact verification/browser evidence, ready PR URL/number/base/head/state, incomplete lessons/questions, `needs-review` items, blockers, and deferred coverage.

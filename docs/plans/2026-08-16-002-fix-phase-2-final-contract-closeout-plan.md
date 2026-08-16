---
title: Phase 2 Final Contract Closeout and PR #2 Readiness
date: 2026-08-16
execution: code
status: approved
base_sha: beba1479f473b3413b3f2de48a27c558e1937c6f
starting_head: c1785ae31f153168d362f3b1f294e68726aa819b
branch: codex/forensic-p02-musical-core
pull_request: 2
---

# Phase 2 Final Contract Closeout and PR #2 Readiness

## Summary

Run a fresh, bounded closeout task from the clean local Phase 2 branch. Preserve all earlier review runs as historical evidence; none count as acceptance for this task. Keep PR #2 draft and do not push until the new review and verification gates pass.

## Requirements

- **R1 — Closed runtime contracts:** Every handled content entity and nested public shape is validated from `unknown` before field access, with known-kind dispatch, complete required-field checks, and finite-domain enforcement.
- **R2 — Fail-closed publication:** Graph safety, contracts, evidence, grades, context, dependencies, and allowlisted projections form one publication path. Missing or malformed metadata is never silently public.
- **R3 — Bounded processing:** Validation, dependency resolution, sanitization, and projection use iterative traversal capped at depth 256 and 10,000 unique objects; cycles and overruns fail closed.
- **R4 — Safe search:** Truly empty queries retain featured behavior; nonblank queries that normalize to empty return no results.
- **R5 — Owned Swara playback:** Caller-owned cancellable tone and sequence handles prevent delayed audio or state updates after replacement, failure, or unmount while compatibility Promise APIs remain available.
- **R6 — Source containment:** Grades 6–11, existing whole-entity Tala quarantine, unknown metadata, and original-PDF/SME limitations remain unchanged; no new musical claims are introduced.
- **R7 — Auditable acceptance:** Evidence artifacts, tests, review runs, browser QA, commits, PR state, and final SHAs remain complete and traceable.

## Implementation Units

### U1. Canonical runtime contracts

Create dependency-free contracts for Lessons, Ragas, Talas, Instruments, Cultural and Theatre Traditions, Glossary Terms, Learning Paths, Quizzes, Exam Papers, Questions, nested activities/tasks, source references, and source-catalog records. Treat imported JSON as `unknown[]`; unknown or ambiguous kinds return `unknown-record-kind`. Validate all required and nested fields and every existing finite union. Move curriculum-strand constants and types to a cycle-free module and re-export them from the repository. Use the same contract predicates and entity-specific allowlisted projection builders from publication policy, repository, and content validation. Add no schema dependency.

### U2. Fail-closed publication and dependency flow

Apply this order: raw record -> bounded graph safety -> known kind -> complete contract -> grade/source/context decision -> dependency closure -> allowlisted public projection. Missing or malformed raw `reviewMetadata` produces `malformed-record`. Public projections contain safe unverified metadata; review/admin projections may synthesize it while forensic validation still reports the raw defect. CMS mutations reject or safely initialize malformed metadata and never publish implicitly.

Use an explicit dependency matrix. Blocking dependencies are lesson prerequisites, learning-path steps and mastery quiz, quiz parent lesson, and required playable/audio references. Nonblocking dependencies are lesson quiz links and next lesson/path recommendations and are stripped only when unavailable. Include nested Tala/Raga references in practice tasks, audio activities, questions, and glossary examples.

### U3. Bounded graph processing

Replace recursive inspection and cloning with iterative traversal of own enumerable JSON data properties. Permit shared-reference DAGs and count each object once. Direct/mutual cycles, depth above 256, or more than 10,000 unique objects fail closed as `malformed-record`. Use the same bounded primitive for validation, dependency resolution, review sanitization, and public projection; leave no recursive deep-clone path.

### U4. Search and Web Audio lifecycle

Preserve featured results for raw empty/whitespace queries. Return no results when a nonblank query has empty normalized and transliterated forms.

Add caller-owned `SwaraPlaybackHandle` APIs with idempotent cancellation and `ready: Promise<boolean>`. Cancellation resolves readiness false, clears delays, suppresses callbacks and React updates, and safely stops/disconnects active oscillators. Preserve Promise APIs as wrappers. Migrate `SwaraKeyboard` plus lesson, raga, and instrument detail sequence consumers to owned cleanup. Clean direct-note timers and instrument-page Tabla timers/handles. Do not add autoplay or redesign the UI.

### U5. Evidence, tests, and implementation commit

Update the closeout matrix, forensic ledger, field matrix, and correction log with the six final findings, exact regressions, dispositions, and final line-qualified anchors. Preserve prior run IDs, the rejected Deepchandi finding, source limitations, and blocked verdicts. Add table-driven contract, dependency, graph-boundary, search, CMS, route, and audio-lifecycle tests. Run targeted and full local gates, inspect the diff, and create one local implementation commit. Do not change tracked files after final review acceptance.

### U6. Fresh mandatory review and delivery

Run at most three fresh `rajantha-skills-library:ce-code-review` cycles against the original base with:

```text
rajantha-skills-library:ce-code-review base:beba1479f473b3413b3f2de48a27c558e1937c6f plan:docs/plans/2026-08-16-002-fix-phase-2-final-contract-closeout-plan.md grouping:auto
```

Every reviewer and validator must run with GPT-5.6 Luna at MAX. Require correctness, testing, maintainability, project-standards, agent-native, learnings, security, API-contract, adversarial, reliability, and frontend-races coverage. Independently validate all surviving findings. Each accepted fix cycle gets one tested local `fix(review): ...` commit.

Acceptance requires `status: complete`, full original-base scope, complete artifacts, `Ready to merge`, zero actionable findings, no degraded P0/P1 validation, and no unmet requirement. Then run full local gates and `rajantha-skills-library:browser-qa` at 1440x900 and 360x568 on the immutable reviewed HEAD. Only after all gates pass may the branch be pushed normally, existing PR #2 updated, hosted checks verified on the same SHA, and the PR marked ready. Never merge or deploy.

## Verification

- Contract mutations cover every entity, nested public shape, missing metadata, unknown kind, invalid union, and projected field.
- Graph tests cover exact and over-limit depth/node counts, deep/wide inputs, direct and mutual cycles, shared DAGs, and dependency chains; exported validators/getters never throw.
- Search tests distinguish raw empty from normalized-empty hostile bidi/zero-width input.
- Swara tests cover initialization, active notes, delays, replacement, failure, Strict Mode, unmount, co-mounted consumers, and suppression of later audio/state updates.
- Run `npm run test`, `npm run type-check`, `npm run lint`, `npm run build`, `git diff --check`, JSON parsing, forensic consistency, source inventory, and publication parity.
- Browser QA covers missing-metadata lesson/admin behavior, hostile search, all migrated Swara consumers, quarantined routes, overflow, console/hydration failures, and network/audio privacy.

## Boundaries and Stop Conditions

- Grades 6–11 remain the only public boundary; all eight Talas retain whole-entity quarantine until their required fields are supported.
- No A/L, Grades 12–13, new musical fact, inferred metadata, source reconstruction, redesign, merge, deployment, or hosted mutation beyond the existing PR workflow.
- Original-PDF, diagram, corrupt-glyph, notation, and SME review remain deferred.
- Stop with PR #2 draft and no push on model/effort mismatch, missing review artifacts, incomplete scope, validator failure, degraded P0/P1 evidence, actionable findings after three fresh cycles, failed local/browser/hosted gate, unexpected `origin/main` drift, merge conflict, or remote-head mismatch. Never rebase or force-push automatically.

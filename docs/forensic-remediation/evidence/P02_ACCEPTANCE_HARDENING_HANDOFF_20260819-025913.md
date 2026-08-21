# P02 Acceptance Hardening — Blocked Handoff

**Generated:** 2026-08-19 02:59:13 local
**Session outcome:** BLOCKED. Mandatory 11-reviewer Compound Engineering review returned 1 P0 and 15 P1 findings. Nothing pushed. PR #2 remains draft. No code changed after the review, by explicit instruction.

> This document is a session handoff, not acceptance evidence. It records the state of the Phase 2
> acceptance-hardening review cycle whose reviewed head is `a0c87a2276e3df9e66f701834b6f337e277aa8e3`.
> It preserves — and does not relabel — every prior run ID, blocked verdict, and rejected finding.

---

# Part A — State of the work

## A1. Phase and plan

| Item | Value |
|---|---|
| Phase | Phase 2 acceptance hardening (continuation; **not** a new curriculum phase, **not** Phase 3) |
| Controlling plan | `docs/plans/2026-08-16-003-fix-phase-2-acceptance-hardening-plan.md` |
| Outcome | **BLOCKED** — review verdict is not `Ready to merge` |
| Stopped at | Post-review synthesis, on instruction to stop and hand off without further code changes |

## A2. Git state (verified at handoff)

```
branch            codex/forensic-p02-musical-core   (not detached)
HEAD              a0c87a2276e3df9e66f701834b6f337e277aa8e3
origin/main       beba1479f473b3413b3f2de48a27c558e1937c6f   == original Phase 2 base
origin/codex/...  e5a435a73db400b647100d00d2d43fab70e9d726   (stale; 20 commits behind local)
ahead of remote   20 commits
git stash         0 entries
worktree          tracked files CLEAN; untracked: .claude/  (+ this handoff file)
range beba1479..HEAD   25 commits, 79 files, +22,141 / -2,240
```

No stop condition fired. `origin/main` still equals the recorded Phase 2 base, branch lineage is intact,
the checkout is not detached, and **no** rebase, reset, squash, or force-push was performed or is required.
Delivery would still be a fast-forward push.

## A3. PR state

| Field | Value |
|---|---|
| URL | https://github.com/RajanthaR/0-Oriental-Music/pull/2 |
| Number / state | 2 / `OPEN`, `isDraft: true` |
| Base ← head | `main` ← `codex/forensic-p02-musical-core` |
| GitHub PR head | `e5a435a73db400b647100d00d2d43fab70e9d726` (stale) |
| Hosted checks | Last run was Vercel `SUCCESS` against the stale head; not re-run |
| Merged / deployed | **No.** Neither attempted nor authorized. |

## A4. Commits

| SHA | Subject | Role |
|---|---|---|
| `06568d6` | `fix(phase2): close final acceptance blockers` | implementation commit (pre-existing) |
| `2af0d18` | `fix(review): close acceptance hardening findings` | prior review-fix commit (pre-existing) |
| `a0c87a2` | `fix(review): close remaining cycle-2 acceptance findings` | **review-fix commit created this session** |

## A5. Changed files in `a0c87a2` (27 files)

**New (5)**
- `src/lib/audio/cleanup.ts`
- `src/lib/validation/disposition-registry.ts`
- `src/test/audio-cleanup.test.ts`
- `src/test/graph-boundary.test.ts`
- `src/test/sources-page.test.tsx`

**Production modified (10)**
- `src/app/instruments/[id]/page.tsx`
- `src/app/lessons/[id]/page.tsx`
- `src/app/ragas/[id]/page.tsx`
- `src/app/sources/page.tsx`
- `src/components/audio/EarTrainingModule.tsx`
- `src/components/quiz/QuizRunner.tsx`
- `src/lib/audio/tabla.ts`
- `src/lib/data/publication-policy.ts`
- `src/lib/data/repository.ts`
- `src/lib/validation/content-validator.ts`

**Tests modified (8)**
`content-validator`, `pitch`, `publication-parity`, `quiz-runner`, `review-closeout`,
`source-metadata-consistency`, `swara-consumers`, `synth`

**Traceability (4)**
- `data/forensic-ledger.json` (new key `acceptanceHardeningReviewCycle2`)
- `docs/FORENSIC_CORRECTION_LOG.md`
- `docs/forensic-remediation/evidence/P02_CLOSEOUT_FINDINGS.md`
- `docs/forensic-remediation/evidence/P02_MUSICAL_CORE_FIELD_MATRIX.md`

**Deliberately uncommitted:** `.claude/launch.json` — browser-QA dev-server config
(`npm run dev`, port 3000), disclosed to the review as an excluded untracked path.

## A6. Work completed before the review

Sixteen findings closed: `AH-C2-V01`…`AH-C2-V10` (the ten surviving cycle-2 candidates) plus
`AH-C2-R01`…`AH-C2-R06` (authorized coverage regressions). Each defect was reproduced against
immutable `2af0d18` first, given a failing regression, then fixed with the smallest
dependency-free change.

Pre-fix failure was empirically proven per group by stashing only the production files and re-running:

| Group | Regressions failing pre-fix |
|---|---|
| Tabla prototype-key + consumer cleanup | 6 |
| QuizRunner canonical IDs | 5 |
| Source-corpus inventory fail-closed | 10 |
| Source-ID normalization parity | 4 |
| Quiz aggregate evidence | 4 |
| Central disposition registry | 27 |

Test count grew **435 → 547** across **15 → 18** files.

## A7. Local verification on `a0c87a2` — all passed

| Gate | Result |
|---|---|
| `npm run test` | 18 files / **547 passed** |
| `npm run type-check` | clean |
| `npm run lint` | clean |
| `npm run build` | success, 28 route entries |
| `git diff --check` | clean |
| JSON parse | `forensic-ledger`, `musical-core-field-dispositions`, `source-documents`, `source-page-quality`, `source-manifest`, `talas`, `quizzes`, `launch.json` all valid |

**Local green is not review acceptance, and it did not detect the P0.**

---

# Part B — The review

## B1. Invocation and artifacts

```
ce-code-review base:beba1479f473b3413b3f2de48a27c558e1937c6f plan:docs/plans/2026-08-16-003-fix-phase-2-acceptance-hardening-plan.md grouping:auto depth:full
```

Report-only (no `apply:local`).

| Item | Value |
|---|---|
| Run ID | `20260818-093434-87f5fe73` |
| Artifact root | `C:\Users\Rajantha\AppData\Local\Temp\compound-engineering-197609\ce-code-review\20260818-093434-87f5fe73\` |
| Contents | `full.diff`, `files.txt`, `commits.txt`, `untracked.txt`, six per-lens diff slices, 11 reviewer JSON artifacts |

**Scope reconciliation:** `files.txt` = 79 entries = `git diff --stat` file count.
Scope helper: `exec_lines: 17704`, `lite_eligible: false`, `uncounted_files: 28`,
`signals: ["frontend"]`, `status: complete`.

**Diff slices** (context was sliced per lens to bound cost; the union across the 11 reviewers
covers the complete 79-file diff):

| Slice | Lines | Bytes |
|---|---|---|
| `diff-latest.diff` (focus commit `a0c87a2`) | 3,898 | 186,608 |
| `diff-audio.diff` | 3,865 | 150,507 |
| `diff-policy.diff` | 6,575 | 278,417 |
| `diff-ui.diff` | 1,645 | 78,261 |
| `diff-tests.diff` | 9,467 | 426,424 |
| `diff-content.diff` | 10,997 | 663,698 |
| `full.diff` | 31,853 | 1,565,702 |

## B2. Reviewer roster — 11/11 artifacts present

| Reviewer | Artifact | Findings | P0 | P1 | P2 | P3 |
|---|---|---:|---:|---:|---:|---:|
| project-standards | `project-standards.json` | 3 | **1** | 1 | 1 | 0 |
| maintainability | `maintainability.json` | 13 | 0 | 7 | 5 | 1 |
| adversarial | `adversarial.json` | 8 | 0 | 3 | 5 | 0 |
| testing | `testing.json` | 7 | 0 | 2 | 3 | 2 |
| correctness | `correctness.json` | 5 | 0 | 0 | 2 | 3 |
| api-contract | `api-contract.json` | 5 | 0 | 0 | 2 | 3 |
| julik-frontend-races | `julik-frontend-races.json` | 5 | 0 | 0 | 3 | 2 |
| reliability | `reliability.json` | 4 | 0 | 1 | 3 | 0 |
| security | `security.json` | 2 | 0 | 1 | 1 | 0 |
| learnings | `learnings.json` | 1 | 0 | 0 | 0 | 0 |
| agent-native | `agent-native.json` | 0 | 0 | 0 | 0 | 0 |
| **Total** | | **53** | **1** | **15** | **25** | **11** |

Not selected, with reasons: `performance` (no query/algorithmic hot path with material resource impact),
`data-migration` (no migration or schema artifacts), `previous-comments` (no PR target passed; scope was
`base:` on the current checkout), `swift-ios` (no Swift surface), `deployment-verification-agent`
(migration gate not met).

**Model policy:** every reviewer ran on the session model (Claude Opus 5) at high effort. The original
`gpt-5.6-luna` at MAX specification is **superseded** — that workspace is deactivated and returned
`402 Payment Required code:"deactivated_workspace"`.

**Adversarial lens:** in-process fallback. The external cross-model peer was not started, by explicit
user direction plus documented prior `402` failure. Peer skip reason recorded.

## B3. Degradations — disclose these, do not paper over them

1. **No per-finding validator wave was run.** Under `AGENTS.md` §10.B.5 the independent validator wave is
   mandatory when findings survive synthesis. This run is therefore **findings input, not acceptance
   evidence** — the correct role for a fix-cycle review, but the later acceptance review **must** be complete.
2. **Five agents died on `403 pre-consume quota failed` before launching.** Zero artifacts; re-run, not salvaged.
3. **`security` died leaving a 148-byte `_status: "IN_PROGRESS"` stub with `findings: []`.** Treated as
   **missing** and fully re-run. It was never read as "security found nothing."
4. **`adversarial` and `agent-native` died mid-write** and were recovered by transcript resume, not re-run.
5. **`learnings` ran with no `docs/solutions/` corpus** (its spawn gate would normally skip it). It mined the
   in-repo forensic record instead, which is the substantive equivalent here.
6. Two artifacts initially landed at a different `/tmp` resolution (`Z:\tmp\...`) than the rest
   (`C:\Users\...\Temp\...`) and were consolidated into the primary run dir.

---

# Part C — Findings

## C1. The P0 — fabricated source provenance on a public route

**`src/lib/data/repository.ts` — `getSources()`**
Introduced by commit **`b1b2f5e`** (`fix(phase2): harden publication and audio acceptance boundaries`),
which is **inside** the reviewed range. Verified by direct base-vs-head comparison.

| Field | Base `beba1479` | HEAD `a0c87a2` |
|---|---|---|
| `publisher` | `නොදනී / සනාථ වී නැත` | `ජාතික අධ්‍යාපන ආයතනය (NIE Sri Lanka)` |
| `year` | `නොදනී / සනාථ වී නැත` | `2015` |
| `tier` | `මූලාශ්‍ර වාර්තාව (සනාථ නොකළ)` | `Tier 1 - Canonical School Source` |
| `location` | `නොදනී / සනාථ වී නැත` | `Maharagama, Sri Lanka` |
| `status` | `Unverified / source review pending` | **`Verified`** |
| `license` | `නොදනී / සනාථ වී නැත` | `Educational Reference / NIE Copyright Preserved` |

**Impact:** 17 of 21 source records publish this on the public `/sources` route. The function's own
comment still reads "public transparency metadata is deliberately sanitized."

**Violates:** `AGENTS.md` §8.4 (no inferred or fabricated publishers, years, places, licences,
organizations, reviewers, review dates, or publication status) and §8.9 (no false review state).
Silently reopens `P01-SOURCE-METADATA-001`, which Phase 2 records as contained.

**Why no test caught it:** the source-transparency validator compares candidate rows against
`repository.getSources()` itself. Both sides drifted together, so the assertion stayed green.

## C2. P1 findings by theme

### Theme A — Two headline fixes are production-unreachable
Converged independently by correctness, adversarial, testing and maintainability; verified directly.

- `validatePublicBoundary` at `src/app/admin/page.tsx:45-54` passes 8 catalogs and **omits `quizzes` and
  `glossary`** → **`AH-C2-V04`'s quiz aggregate evidence rule never executes in production.**
- `validateMusicalCoreFieldDispositions` has **zero** production callers → **`AH-C2-V08`'s
  `unclosedRequiredFields === ["structure"]` rule is test-only** — and that is the rule preventing all
  eight Talas from being promoted.
- `src/test/publication-containment.test.ts:778` **mirrors** the admin map's omission, so nothing pins it.

### Theme B — Vacuous assertions
`src/test/content-validator.test.ts:405,414,442` use `|| issue.field === "record"`. The weak arm is
satisfied by the pre-existing record contract, so three `quizAggregateEvidenceIssues` branches
(empty/non-array `questions`, non-record question, missing `gradeBands`) are provably unreachable.

### Theme C — Prototype-key class survived the `tabla.ts` fix in two live sites
- `src/lib/data/publication-policy.ts:1172` — `DEPENDENCY_FIELD_RULES[key]` with keys from
  `Object.keys(record)` over untrusted content, **inside the publication gate itself**.
- `src/components/quiz/QuizRunner.tsx:113` — `selectedAnswers[question.id]`; a prototype-method id
  yields a Function, `|| []` does not fire, `.includes` is not a function.

### Theme D — Registry contract split is exploitable
The shared contract accepts **any** unique subset in `unclosedRequiredFields` — `[]` passes because the
dense-array loop never executes — while only the uncalled validator demands exactly `["structure"]`.

### Theme E — Quiz aggregate rule is circular
`src/lib/validation/content-validator.ts:611` derives its parent gate from
`decision.nestedDispositions`, i.e. from the very decision under test.

### Theme F — Unbounded `await resume()`
`src/lib/audio/synth.ts:179` and `src/lib/audio/tabla.ts:204`. `initPromise` is cached, so one slow host
permanently kills all page audio while every consumer UI still claims "playing".

### Theme G — Structural regressions
- Three files crossed 1000 lines **in this diff**: `content-validator.ts` 589→1771,
  `publication-policy.ts` 446→1686, `content-contracts.ts` 0→1138.
- `src/lib/data` ↔ `src/lib/validation` went from **acyclic to bidirectional**.
- `runContextInit` duplicated verbatim in `synth.ts` and `tabla.ts`; `tanpura.ts:42` left unhardened.
- `hasExactEvidence` defined twice under one name with divergent semantics (quality-gated vs status-gated).
- `inspection.entryById as unknown as Map<string, DispositionEntry>` defeats the centralized contract in
  the type system; the row shape is modeled three times.

### Theme H — CMS fabricates review metadata
`src/lib/data/repository.ts:606,663-664` writes a caller-supplied `reviewer` and a `new Date()`
`lastVerifiedDate` on non-Published transitions (§8.9).

## C3. Residual risks and testing gaps

61 recorded across the 11 artifacts. Highest-value:

- **Anchor drift, 6th recurrence.** 101 numeric `path:line` anchors in the traceability documents are
  checked by nothing; **15 resolve to blank lines or bare closing braces**. `expectSemanticReference`
  validates only ledger-held references, and every `FA-V*` / `AH-C1-V*` / `AH-C2-*` ledger entry is a
  line-free `path#symbol`. Five prior cycles chose "refresh the numbers"; five regressed.
  Data-file anchors are still correct — drift is confined to code and test files.
- **Recurring-class base rates** (from the in-repo record): TOCTOU / snapshot divergence found and fixed
  in **7 distinct cycles**; non-canonical identity in **6** (QuizRunner alone 3×); audio ownership in
  **every** cycle without exception.
- **Cleanup centralization is partial.** Four consumers import `cleanup.ts`; four hand-roll it.
  `SwaraKeyboard` violates **both** rules of the new contract (three unisolated `clearTimeout` sites).
- `isKnownQuarantinedEntityId` still uses bare `.trim()` while all other identity plumbing uses
  `normalizeEntityId`. Security empirically tested 14 ID variants and found **no exploitable bypass** —
  worth aligning for consistency, not a vulnerability.
- **Only 3 of 8 Talas are in `KNOWN_QUARANTINED_ENTITY_IDS`**; the other 5 are quarantined via the
  disposition registry. A reviewer checking the ID list alone will wrongly conclude 5 Talas are public.
- `graph-boundary.test.ts` takes ~105 s, of which one case (`wideRecord` with 4,000 keys) is ~92 s.
- `data/forensic-ledger.json` `context.safe` now depends on every `issueCatalog[].ledgerIssueId`
  resolving into the ledger. Renaming or removing an issue id blanks **every** public surface.

## C4. Verified clean

- **Microphone privacy holds.** `getUserMedia` appears only in `pitch.ts`; zero production hits for
  `fetch` / `XMLHttpRequest` / `WebSocket` / `sendBeacon` / `new Image` / `RTCPeerConnection` /
  `EventSource` / `FormData` / `.submit(`; the buffer stays in a private `Float32Array`; nothing
  audio-related touches `localStorage`, `IndexedDB`, `MediaRecorder`, or `createObjectURL`.
- No `dangerouslySetInnerHTML` / `innerHTML` / `outerHTML` / `insertAdjacentHTML` / `eval` / `new Function`.
- `diagramSvg` stripped from public question projections, and no renderer consumes it.
- Swara semitone table and C4 = 261.63 Hz exact; no `.mp3` / `.wav`; no trackers; no autoplay.
- Failure-atomic contract verified at **all six** `cleanup.ts` call sites; `releaseTimerRef` correctly
  treats timer id `0` as owned.
- `scheduleTablaPlan` **is** transactional, including the host-fires-synchronously-during-registration case.
- All eight Talas remain whole-entity quarantined; public grade scope stays 6–11; no dataset grew.
- Traceability artifacts correctly preserve prior run IDs and blocked verdicts and label the incomplete
  cycle-2 run as missing coverage rather than zero findings.
- **Deepchandi remains rejected**, confirmed by four independent checks: query-time variant map only
  (`search-engine.ts:72-77`), empty `aliases_si` on `tala-deepchandi`, negative search assertions
  (`search-engine.test.ts:58-74`), and `review-closeout.test.ts:251,312` requiring the string to stay
  present in all three traceability documents. **Do not re-raise it as a spelling defect.**

## C5. Not done

| Gate | State |
|---|---|
| Browser QA (`ce-test-browser`) | **Not run** — gated on review acceptance. `.claude/launch.json` staged and ready. |
| Push | **Not performed.** |
| PR #2 update | **Not performed.** Still OPEN/DRAFT with stale head. |
| Hosted checks on a new SHA | **Not applicable** — nothing pushed. |
| Merge / deploy | **Not performed. Not authorized.** |

## C6. Review budget

| Cycle | Run | Result |
|---|---|---|
| Cycle 1 | `20260817-p02-hardening-c1-06568d6f` | 20 findings → `2af0d18` |
| Cycle 2 (infrastructure failure) | `20260817-p02-hardening-c2-2af0d18` | **INCOMPLETE** — 10/11 reviewer artifacts, no frontend-races artifact, **zero** validators, terminated by `402 deactivated_workspace`. Findings input only. |
| This cycle | `20260818-093434-87f5fe73` | 53 findings → **blocked**, no fixes applied |

**One further fix cycle remains, then one mandatory read-only acceptance review.**

---

# Part D — Handover prompt for the next agent

> Everything below is self-contained. Paste it into a fresh session.

You are taking over Phase 2 acceptance hardening for the Swara Maga repository. A complete 11-reviewer
Compound Engineering review has just run and **blocked delivery**. Your job is the fix cycle, then a fresh
complete review, then browser QA, then delivery.

**Repository:** `Z:\00Code\ANTIGRAVITY\Oriental-Music`

## D1. Mandatory first actions

Read completely, in this order:

1. `AGENTS.md` — especially §8 (Forensic Source Integrity), §9, §10 (mandatory review loop), §11
2. `docs/plans/2026-08-16-003-fix-phase-2-acceptance-hardening-plan.md`
3. `docs/forensic-remediation/evidence/P02_ACCEPTANCE_HARDENING_HANDOFF_20260819-025913.md` (this file)
4. `docs/forensic-remediation/evidence/P02_CLOSEOUT_FINDINGS.md`
5. `docs/FORENSIC_CORRECTION_LOG.md`
6. `data/forensic-ledger.json`
7. `docs/forensic-remediation/evidence/P02_MUSICAL_CORE_FIELD_MATRIX.md`

Then read the review artifacts. They contain full `why_it_matters`, complete evidence arrays, and a
concrete `suggested_fix` for all 53 findings — far more detail than this summary:

`C:\Users\Rajantha\AppData\Local\Temp\compound-engineering-197609\ce-code-review\20260818-093434-87f5fe73\`

Files: `project-standards.json`, `maintainability.json`, `adversarial.json`, `testing.json`,
`correctness.json`, `api-contract.json`, `julik-frontend-races.json`, `reliability.json`,
`security.json`, `learnings.json`, `agent-native.json`, plus `full.diff`, `files.txt`, `commits.txt`,
and six per-lens diff slices.

Check the Rajantha Skills Library before acting, and read each applicable `SKILL.md` completely.
Use `ce-code-review` for every review cycle, `ce-commit` for isolated local fix commits,
`ce-test-browser` for browser QA, and `ce-commit-push-pr` only after every acceptance gate passes —
configured to **update existing PR #2**, never to create another.

## D2. Verify state before changing anything

```powershell
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git rev-parse origin/codex/forensic-p02-musical-core
git log --oneline --decorate -n 5
git stash list
gh pr view 2 --json number,state,isDraft,baseRefName,headRefName,headRefOid,statusCheckRollup
```

Expected:

| Item | Value |
|---|---|
| branch | `codex/forensic-p02-musical-core` |
| HEAD | `a0c87a2276e3df9e66f701834b6f337e277aa8e3` |
| `origin/main` | `beba1479f473b3413b3f2de48a27c558e1937c6f` |
| origin feature branch | `e5a435a73db400b647100d00d2d43fab70e9d726` (stale) |
| ahead | 20 commits |
| stash | empty |
| worktree | tracked clean; `.claude/` untracked plus this handoff file |
| PR #2 | OPEN, DRAFT, `main` ← `codex/forensic-p02-musical-core`, head `e5a435a` |

A `git fetch origin --prune` before evaluating remote state is fine.

**Stop and report instead of mutating history if:** `origin/main` differs from the recorded base; the local
branch leaves its expected lineage; the checkout is detached; unrelated worktree changes appear; PR #2 shows
an unexpected base, head, or remote-head mutation; or any rebase, reset, force push, squash, or history
rewrite would be required. **Never** reset, rebase, squash, force-push, discard commits, or overwrite history.

**Note on this handoff file and `.claude/launch.json`:** both are untracked additions in a repository whose
protocol requires a clean worktree before review. Either commit them in your first fix commit, or disclose
them explicitly as excluded untracked paths in the next review's Coverage. Do not leave them undisclosed.

## D3. Fix queue, in priority order

### 1. P0 — fabricated source provenance on a public route (fix first)

`src/lib/data/repository.ts` `getSources()`. Commit `b1b2f5e` removed the base's sanitization; six fields
now pass through raw and **17 of 21** source records publish fabricated publisher / year /
`Tier 1 - Canonical School Source` / location / **`status: "Verified"`** / license on `/sources`.
Violates `AGENTS.md` §8.4 and §8.9, and reopens `P01-SOURCE-METADATA-001`.

Fix: restore the sentinels while keeping the new `createEvaluationContext()` / `projectPublicRecord`
guards and the `evidenceState` / `evidenceQuality` fields —

```
publisher: UNKNOWN_PROVENANCE
year:      UNKNOWN_PROVENANCE
tier:      "මූලාශ්‍ර වාර්තාව (සනාථ නොකළ)"
location:  UNKNOWN_PROVENANCE
status:    "Unverified / source review pending"
license:   UNKNOWN_PROVENANCE
```

Add a regression asserting no rendered source row contains `Tier 1`, `Verified`, or a four-digit year.
The transparency validator compares candidates against `repository.getSources()` itself — break that
circularity or the test cannot fail.

### 2. P1 — make `AH-C2-V04` and `AH-C2-V08` actually run in production

- Add `quizzes: repository.getQuizzes()` and `glossary: repository.getGlossary()` to
  `validatePublicBoundary` at `src/app/admin/page.tsx:45-54`. `kindByLabel` already accepts both labels.
  **Expect new issues on first run — fix the data, do not revert the wiring.**
- Wire `validateMusicalCoreFieldDispositions()` into `validateForensicInventory()` or the admin report
  beside it, **or** drop its `export` and move it to test support so it is not advertised as app API.
- Add a test pinning the admin boundary map's key set against the public getters / `kindByLabel`, and
  update `src/test/publication-containment.test.ts:778`, which currently mirrors the omission.

### 3. P1 — remove the vacuous assertions

`src/test/content-validator.test.ts:405,414,442` — drop the `issue.field === "record"` arm. The tests will
then fail, correctly reporting that three `quizAggregateEvidenceIssues` branches are unreachable. Resolve
by deleting the dead branches **or** by moving the `quizAggregateEvidenceIssues(...)` call above the
`validateContentRecord` early return at `content-validator.ts:927-930`.

### 4. P1 — close the two remaining prototype-key sites

- `publication-policy.ts:1172` — convert `DEPENDENCY_FIELD_RULES` to a `ReadonlyMap` and read with
  `.get()`, exactly as `tabla.ts:125` now does, with a fail-closed default. Also guard `addDependency`'s
  `.find` against a non-array, and move `state.stack.delete(recordId)` into a `finally` so a throw cannot
  leak stack entries into a shared context.
- `QuizRunner.tsx:63` — reject IDs that shadow inherited members, or initialize the three keyed state
  objects with `Object.create(null)`.

### 5. P1 — registry contract split and quiz-rule circularity

- Either move the exactly-`["structure"]` check into `inspectDispositionRegistry` with the accepted-subset
  behaviour as an explicit parameter, or ensure the validator enforcing it runs on a production surface.
- `content-validator.ts:611` — stop deriving the parent gate from `decision.nestedDispositions`. Resolve
  `lessonId` against `evaluationContext.catalogs.lessons` by `normalizeEntityId` equality and require
  `getRecordPublicationDecision(parent, evaluationContext).isPublic`.

### 6. P1 — bound the AudioContext resume

`synth.ts:179` and `tabla.ts:204` — race `await resume()` against a bounded (~3 s) timeout so a
non-settling resume falls into the existing catch and returns `false`; clear the timer on success. Extract
one shared helper, since both bodies are byte-identical, and migrate `tanpura.ts:42`, which was left on
the unhardened pattern.

### 7. P1 — CMS must not fabricate review metadata

`repository.ts:606,663-664` — write `UNKNOWN_PROVENANCE` instead of `new Date()`, and accept `reviewer`
only when `hasKnownReviewEvidence(rawMetadata)` holds (mirroring the Published branch).
Update `publication-containment.test.ts:172,177`.

### 8. P1 structural — scope this deliberately

Three files crossed 1000 lines; `data/` ↔ `validation/` became bidirectional; `runContextInit`,
`hasExactEvidence`, `normalizeRecordId` and `isDenseArray` are duplicated; the `entryById` double cast
defeats the centralized contract. `maintainability.json` contains symbol-level split proposals for all of
them, including a proposed `src/lib/contracts/` bottom layer. Either do this now or record it as
**explicitly accepted** residual risk — do not leave it silent.

### 9. P2 / P3 — see the artifacts

25 P2 and 11 P3, each with a concrete `suggested_fix`. Notable: `SwaraKeyboard` violates both rules of the
new cleanup contract; `admin/page.tsx:85` has an unowned 3 s `setTimeout` that lets an older timer erase a
newer notice; the anchor-drift finding — **fix by mechanism, not by refreshing numbers a sixth time.**

## D4. Required workflow

1. Reproduce each finding against immutable `a0c87a2` before fixing it.
2. Add a focused failing regression first, and prove it fails pre-fix (stash the production file, run,
   restore).
3. Implement the smallest dependency-free fix.
4. Run the targeted tests.
5. Update traceability **after** code and tests stabilize: closeout findings matrix, correction log, field
   matrix, forensic ledger, `src/test/review-closeout.test.ts`. Use a new ledger key
   (e.g. `acceptanceHardeningReviewCycle3`) and finding IDs `AH-C3-*`. Prefer `path#symbol` anchors over
   numeric lines.
6. Preserve: every prior run ID and blocked verdict, Cycle-1 evidence, the **rejected Deepchandi**
   disposition, and the original-PDF / OCR / notation / SME limitations. Never relabel the incomplete
   cycle-2 run's missing artifacts as zero findings.
7. Mark new work `FIXED-PENDING-REREVIEW`.
8. Full gate: `npm run test`, `npm run type-check`, `npm run lint`, `npm run build`, `git diff --check`,
   JSON parsing, and the forensic / source / publication consistency suites.
9. Create **one** tested local commit: `fix(review): ...`
10. Keep the worktree clean. **Do not push during implementation or review-fix work.**

## D5. Mandatory fresh review

```
ce-code-review base:beba1479f473b3413b3f2de48a27c558e1937c6f plan:docs/plans/2026-08-16-003-fix-phase-2-acceptance-hardening-plan.md grouping:auto depth:full
```

Report-only; you apply and commit fixes yourself. All 11 reviewers required: correctness, testing,
maintainability, project-standards, agent-native, learnings-researcher, security, api-contract,
adversarial, reliability, julik-frontend-races.

**Operational lessons from this run — apply them:**

- The API is flaky. Dispatch in batches of **≤3** and verify artifacts on disk after each batch.
- Instruct every agent to write its artifact **early** and update as it goes. This is the single change
  that made recovery possible.
- If an agent dies mid-write, **resume it via `SendMessage`** rather than re-running — one resume cost
  3 tool calls versus 35+.
- `full.diff` is 1.56 MB. Slice it per lens (slices already exist in the run dir) and record the
  union-covers-scope mapping in Coverage.
- A checkpoint stub with zero findings is **missing coverage**, never "found nothing."
- The Write tool may resolve `/tmp` to `Z:\tmp` while Bash resolves it to `C:\Users\...\Temp`.
  Check both and consolidate.
- **Run the per-finding validator wave.** This run did not, which is exactly why it is findings input only.

**Cross-model adversarial peer:** unavailable (deactivated workspace, `402`). Use the documented in-process
`adversarial-reviewer` fallback and record the skip reason in Coverage. Reviewers on Claude Opus 5 at high
effort; the `gpt-5.6-luna`/MAX specification is superseded.

**Budget:** one fix cycle remains, then **one full read-only acceptance review**. A finding in that
acceptance review blocks delivery and does **not** authorize another implicit fix cycle.

**Acceptance requires all of:** `status: complete`; final verdict `Ready to merge`; zero actionable
findings; complete reviewer, scope and validator artifacts; no degraded P0/P1 evidence; no unmet plan
requirement; no tracked change after the accepted review.

If review infrastructure still cannot produce the required artifacts, **stop** with the branch unpushed and
PR #2 draft.

## D6. Exact-head browser QA

Only after the full read-only acceptance review succeeds, run `ce-test-browser` against the immutable
accepted SHA at **1440×900** and **360×568**. `.claude/launch.json` already exists (untracked;
`npm run dev`, port 3000).

Cover: public directory and direct routes; search including hostile and normalized-empty queries; valid,
empty and malformed QuizRunner states; admin/review behaviour; **all eight** quarantined Tala routes;
EarTraining cleanup; Rhythm and Tabla Start/tick/Stop/Reset/replacement; lesson, raga and instrument
Swara/audio cleanup; microphone denial, partial initialization failure, pending cancellation, replacement,
retry, stop and unmount; **zero-upload network evidence**; console errors; page errors; hydration
mismatches; failed requests; keyboard access; touch targets; horizontal overflow.

Store browser artifacts outside tracked files. Do not modify tracked files after acceptance.
Any browser failure blocks push and PR readiness.

## D7. Git and PR delivery

Only after review acceptance, exact-head local verification, and exact-head browser QA:

1. Reconfirm branch, clean worktree, `origin/main`, local HEAD, remote feature SHA, and PR #2
   base/head/draft state.
2. Stop on unexpected remote drift or any non-fast-forward requirement.
3. Push normally — **no force, no rebase, no squash, no reset.**
4. Update **existing PR #2 only**. Do not create another PR.
5. PR body must carry the exact base and final reviewed SHA, the implementation and every review-fix
   commit, review run IDs and artifact paths, the reviewer team and validator counts, verification and
   browser-QA results, and the preserved source limitations.
6. Wait for required hosted checks on the exact pushed SHA.
7. Confirm GitHub's PR head equals the accepted reviewed SHA.
8. Only then mark PR #2 ready for review.
9. **Do not merge. Do not deploy.**

## D8. Preserved project boundaries

- Public curriculum boundary is **Grades 6–11**.
- Grade 12–13 and A/L data may remain in raw audit datasets but stay quarantined.
- **All eight Talas remain whole-entity quarantined.** Only 3 are in `KNOWN_QUARANTINED_ENTITY_IDS`;
  the other 5 are quarantined through the disposition registry. Do not conclude from the ID list alone
  that 5 Talas are public.
- Unsupported data stays retained for audit, never deleted to make validation green.
- Do not invent musical facts, publishers, years, locations, licences, organizations, reviewers, review
  dates, or publication states.
- Original-PDF, diagram, notation, corrupt-glyph, and SME verification remain deferred.
- Do not start Phase 3. Do not redesign the application. Do not merge or deploy.

---

## Appendix — Session self-assessment

The review found that two fixes shipped in `a0c87a2` (`AH-C2-V04`, `AH-C2-V08`) are correct but never
execute in production, and that three assertions written in the same commit were vacuous. Those are
authoring errors in this session's work, independently verified before being reported here, not reviewer
noise. The P0 predates `a0c87a2` but was not caught during this session either: a full local gate with
547 passing tests, clean type-check, clean lint, and a successful build did not surface a public route
publishing fabricated provenance. That is the strongest argument in this record for why the multi-agent
review gate exists.

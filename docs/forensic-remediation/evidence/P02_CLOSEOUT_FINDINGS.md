# Phase 2 closeout finding matrix

This matrix closes the sixteen independently validated findings from review run
`20260815-235819-p02r4`. That run is preserved as blocked historical evidence;
it is not acceptance evidence for this closeout. The earlier
`docs/plans/2026-08-16-001-fix-phase-2-pr-merge-ready-plan.md` remains historical;
the controlling closeout plan is
`docs/plans/2026-08-16-002-fix-phase-2-final-contract-closeout-plan.md`.

## Acceptance-hardening findings input

Review run `20260816-191000-p02-final-contract-c3` is preserved as blocked
historical evidence. It reviewed `beba1479f473b3413b3f2de48a27c558e1937c6f`
through `4c8ab9755d20d4d23cc8081fe831f448b15f3a2e`, completed all eleven required
GPT-5.6 Luna/MAX reviewers and all twenty independent validators, and ended
`Not ready to merge`. It is findings input only; it is not acceptance evidence
for the controlling plan
`docs/plans/2026-08-16-003-fix-phase-2-acceptance-hardening-plan.md`.

| IDs | Validated defect group | Acceptance-hardening disposition | Regression/symbol anchors |
|---|---|---|---|
| `C3-01`, `C3-04`–`C3-08` | Publication status drift, hostile batches, decision/projection TOCTOU, duplicate IDs, mismatched kinds, and stale identity catalogs. | Per-operation bounded snapshots, checked batches, complete kind contracts, and allowlisted projections fail closed. Summary and repository consumers use fresh decisions. | `src/lib/data/publication-policy.ts:362 (createPublicationEvaluationContext)`, `src/lib/data/publication-policy.ts:1348 (evaluatePublicationBatch)`, `src/lib/validation/content-contracts.ts:787 (validateContentRecord)`, `src/lib/validation/content-contracts.ts:984 (projectPublicRecord)`. |
| `C3-02`, `C3-03` | Summary caching ignored evidence changes and source views exposed unsupported provenance. | Summary memoization is removed. Public source fields share the unknown/unverified representation. | `src/lib/data/repository.ts:507 (getPublicationSummary)`, `src/test/review-closeout.test.ts (recomputes publication summaries)`, `src/test/source-metadata-consistency.test.ts:17 (unknown provenance representation)`. |
| `C3-09`, `C3-10`, `C3-12` | Malformed Tala dispositions or selected-source rows could throw, and duplicate extracted-document mappings passed. | Forensic inputs are snapshotted as unknown data; malformed rows produce structured issues and exactly one document mapping is required. | `src/lib/validation/content-validator.ts:229 (validateSelectedSourceMetadata)`, `src/lib/validation/content-validator.ts:332 (validateMusicalCoreFieldDispositions)`, `src/test/source-metadata-consistency.test.ts:34 (source identity consistency)`. |
| `C3-11` | Dependency and graph coverage was incomplete. | One declarative field matrix classifies blocking playable/prerequisite/path/quiz references and nonblocking recommendation links; bounded graph rules apply at every decision boundary. | `src/lib/data/publication-policy.ts:221 (DEPENDENCY_FIELD_RULES)`, `src/lib/data/publication-policy.ts:1348 (evaluatePublicationBatch)`, `src/test/publication-containment.test.ts:58 (dependency matrix table)`. |
| `C3-13` | Correction-log final line anchors were stale. | Final anchors are refreshed after implementation/review stabilization and checked by the closeout test. | `src/test/review-closeout.test.ts (resolves current musical-core anchors by symbol and heading)`, `docs/FORENSIC_CORRECTION_LOG.md (P02-FINAL-06)`. |
| `C3-14`, `C3-15` | Renderable questions retained forensic fields and an empty quiz crashed. | Explicit renderable variants exclude audio/notation payloads; public projection strips extras; QuizRunner returns a supportive Sinhala unavailable state without recording an attempt. | `src/types/content.ts:295 (RenderableQuestionType)`, `src/components/quiz/QuizRunner.tsx:36 (getUsableQuiz)`, `src/test/quiz-runner.test.tsx:175 (duplicate question IDs)`. |
| `C3-16` | Repository/search boundaries threw on malformed runtime queries. | Omitted/blank strings keep featured behavior; other nonstrings and nonblank normalized-empty controls return no results. | `src/lib/search/search-engine.ts:84 (classifySearchQuery)`, `src/lib/search/search-engine.ts:136 (SearchIndex)`, `src/test/search-engine.test.ts:80 (normalized-empty controls)`. |
| `C3-17`–`C3-20` | Rhythm callback identity reset sessions, completed handles accumulated, stale unavailable callbacks escaped, and delayed Tabla failures left timers. | Generation-owned sessions, settled-handle removal, mounted/current-owner callback guards, and failure-atomic timer cancellation close the lifecycle. | `src/components/audio/RhythmTapGame.tsx:14`, `src/components/audio/TalaVisualizer.tsx:23`, `src/lib/audio/tabla.ts:46`, `src/test/components.test.tsx:871`, `src/test/components.test.tsx:918`, `src/test/synth.test.ts:96`. |
| `P02-PITCH-OWNERSHIP-001` | Partial or stale microphone starts could retain MediaStreams, AudioContexts, nodes, animation frames, or callbacks. | Latest-generation ownership and idempotent cleanup stop late streams and reclaim every partial resource; audio remains local-only. | `src/lib/audio/pitch.ts:40 (generation ownership)`, `src/lib/audio/pitch.ts:114 (startListening)`, `src/lib/audio/pitch.ts:220 (stopListening)`, `src/test/pitch.test.ts:76 (late stream cleanup)`, `src/test/pitch.test.ts:93 (newest pending start)`. |
| `P02-PROJECT-SCOPE-001` | Contributor guidance still described the product as public Grades 6–13/A/L and claimed a fixed canonical-source count. | Guidance now states the verified Grades 6–11 public boundary, raw quarantine for 12–13/A/L, no inferred count, and CMS stages as capability rather than completed-review evidence. | `AGENTS.md:3 (current verified public curriculum boundary)`, `AGENTS.md:37 (raw Grade 12–13/A/L quarantine)`, `AGENTS.md:182 (CMS review capability boundary)`, `src/test/review-closeout.test.ts (records acceptance-hardening scope)`. |

### Exact scoped finding traceability

This machine-checked appendix gives every scoped acceptance-hardening finding one
review artifact, regression test, fix symbol, current semantic anchor, and
non-acceptance disposition. The rows are deliberately explicit rather than
grouped ranges so a missing or duplicated finding cannot pass a count-only
closeout test.

| Finding ID | Review evidence | Regression test | Fix symbol | Current semantic anchor | Disposition |
|---|---|---|---|---|---|
| `C3-01` | `validator-01.json` | `src/test/review-closeout.test.ts#rejects every CMS status/published mismatch` | `src/lib/data/repository.ts#updateLessonReviewStatus` | `src/lib/data/repository.ts:548 (updateLessonReviewStatus)` | **FIXED-PENDING-REREVIEW** |
| `C3-02` | `validator-02.json` | `src/test/review-closeout.test.ts#recomputes publication summaries` | `src/lib/data/repository.ts#getPublicationSummary` | `src/lib/data/repository.ts:507 (getPublicationSummary)` | **FIXED-PENDING-REREVIEW** |
| `C3-03` | `validator-03.json` | `src/test/source-metadata-consistency.test.ts:17 (unknown provenance representation)` | `src/lib/validation/content-contracts.ts#projectPublicRecord` | `src/lib/validation/content-contracts.ts:984 (projectPublicRecord)` | **FIXED-PENDING-REREVIEW** |
| `C3-04` | `validator-04.json` | `src/test/publication-containment.test.ts:196 (duplicate IDs)` | `src/lib/data/publication-policy.ts#evaluatePublicationBatch` | `src/lib/data/publication-policy.ts:1348 (evaluatePublicationBatch)` | **FIXED-PENDING-REREVIEW** |
| `C3-05` | `validator-05.json` | `src/test/content-contracts.test.ts:475 (detached snapshot)` | `src/lib/data/publication-policy.ts#captureEvaluationValue` | `src/lib/data/publication-policy.ts:285 (captureEvaluationValue)` | **FIXED-PENDING-REREVIEW** |
| `C3-06` | `validator-06.json` | `src/test/review-closeout.test.ts#fails closed for duplicate top-level IDs` | `src/lib/validation/content-validator.ts#validatePublicCollection` | `src/lib/validation/content-validator.ts:615 (validatePublicCollection)` | **FIXED-PENDING-REREVIEW** |
| `C3-07` | `validator-07.json` | `src/test/content-contracts.test.ts:341 (unknown or ambiguous kinds)` | `src/lib/validation/content-contracts.ts#projectPublicRecord` | `src/lib/validation/content-contracts.ts:984 (projectPublicRecord)` | **FIXED-PENDING-REREVIEW** |
| `C3-08` | `validator-08.json` | `src/test/publication-containment.test.ts:452 (identity containment)` | `src/lib/data/publication-policy.ts#createPublicationEvaluationContext` | `src/lib/data/publication-policy.ts:362 (createPublicationEvaluationContext)` | **FIXED-PENDING-REREVIEW** |
| `C3-09` | `validator-09.json` | `src/test/content-validator.test.ts:144 (malformed Tala fields)` | `src/lib/validation/content-validator.ts#validateMusicalCoreFieldDispositions` | `src/lib/validation/content-validator.ts:332 (validateMusicalCoreFieldDispositions)` | **FIXED-PENDING-REREVIEW** |
| `C3-10` | `validator-10.json` | `src/test/source-metadata-consistency.test.ts:79 (ambiguous mappings)` | `src/lib/validation/content-validator.ts#validateSelectedSourceMetadata` | `src/lib/validation/content-validator.ts:229 (validateSelectedSourceMetadata)` | **FIXED-PENDING-REREVIEW** |
| `C3-11` | `validator-11.json` | `src/test/publication-containment.test.ts:58 (dependency matrix)` | `src/lib/data/publication-policy.ts#DEPENDENCY_FIELD_RULES` | `src/lib/data/publication-policy.ts:221 (DEPENDENCY_FIELD_RULES)` | **FIXED-PENDING-REREVIEW** |
| `C3-12` | `validator-12.json` | `src/test/source-metadata-consistency.test.ts:79 (selected-source mappings)` | `src/lib/validation/content-validator.ts#validateSelectedSourceMetadata` | `src/lib/validation/content-validator.ts:229 (validateSelectedSourceMetadata)` | **FIXED-PENDING-REREVIEW** |
| `C3-13` | `validator-13.json` | `src/test/review-closeout.test.ts#resolves current musical-core anchors` | `docs/FORENSIC_CORRECTION_LOG.md#P02-FINAL-06` | `docs/FORENSIC_CORRECTION_LOG.md:71 (P02-FINAL-06)` | **FIXED-PENDING-REREVIEW** |
| `C3-14` | `validator-14.json` | `src/test/content-contracts.test.ts:384 (renderable question projections)` | `src/lib/validation/content-contracts.ts#projectPublicRecord` | `src/lib/validation/content-contracts.ts:984 (projectPublicRecord)` | **FIXED-PENDING-REREVIEW** |
| `C3-15` | `validator-15.json` | `src/test/quiz-runner.test.tsx:175 (duplicate question IDs)` | `src/components/quiz/QuizRunner.tsx#getUsableQuiz` | `src/components/quiz/QuizRunner.tsx:36 (getUsableQuiz)` | **FIXED-PENDING-REREVIEW** |
| `C3-16` | `validator-16.json` | `src/test/search-engine.test.ts:80 (normalized-empty controls)` | `src/lib/search/search-engine.ts#classifySearchQuery` | `src/lib/search/search-engine.ts:84 (classifySearchQuery)` | **FIXED-PENDING-REREVIEW** |
| `C3-17` | `validator-17.json` | `src/test/components.test.tsx:811 (rhythm callback identity)` | `src/components/audio/RhythmTapGame.tsx#RhythmTapGame` | `src/components/audio/RhythmTapGame.tsx:14 (RhythmTapGame)` | **FIXED-PENDING-REREVIEW** |
| `C3-18` | `validator-18.json` | `src/test/components.test.tsx:828 (settled rhythm handles)` | `src/components/audio/TalaVisualizer.tsx#TalaVisualizer` | `src/components/audio/TalaVisualizer.tsx:23 (TalaVisualizer)` | **FIXED-PENDING-REREVIEW** |
| `C3-19` | `validator-19.json` | `src/test/components.test.tsx:850 (stale Tala callbacks)` | `src/components/audio/TalaVisualizer.tsx#TalaVisualizer` | `src/components/audio/TalaVisualizer.tsx:23 (TalaVisualizer)` | **FIXED-PENDING-REREVIEW** |
| `C3-20` | `validator-20.json` | `src/test/components.test.tsx:918 (Tabla promise rejection)` | `src/lib/audio/tabla.ts#scheduleTablaPlan` | `src/lib/audio/tabla.ts:46 (scheduleTablaPlan)` | **FIXED-PENDING-REREVIEW** |
| `P02-PITCH-OWNERSHIP-001` | `validator-21.json` | `src/test/pitch.test.ts:76 (late stream cleanup)` | `src/lib/audio/pitch.ts#startListening` | `src/lib/audio/pitch.ts:114 (startListening)` | **FIXED-PENDING-REREVIEW** |
| `P02-PROJECT-SCOPE-001` | `validator-22.json` | `src/test/review-closeout.test.ts#records the acceptance-hardening scope` | `AGENTS.md#current verified public curriculum boundary` | `AGENTS.md:3 (current verified public curriculum boundary)` | **FIXED-PENDING-REREVIEW** |

All eight Talas remain whole-entity quarantined. No entry above promotes a
musical fact or changes the rejected Deepchandi disposition. Original-PDF,
diagram, notation, corrupt-glyph, and SME work remain deferred.

The closeout uses the authorized whole-entity quarantine decision. A tala is
not public or playable when a required learner-visible context, structure,
hand action, practice configuration, theka, or bol field is absent, ambiguous,
or marked `needs-review`. Raw records and their
field evidence remain available to forensic tooling. The original PDFs are not
present in this checkout, so unreadable extraction glyphs are not reconstructed
from musical memory.

## Starting evidence

| Item | Evidence |
|---|---|
| Original Phase 2 base | `beba1479f473b3413b3f2de48a27c558e1937c6f` |
| Closeout start head | `97c0c138b2b90ac27516a3c8c3716361ac537981` |
| Prior review | `C:/tmp/compound-engineering/ce-code-review/20260815-235819-p02r4/` |
| Prior review result | 9 reviewers succeeded; 17 validators succeeded; 16 findings validated; 1 Deepchandi retrieval finding rejected; verdict `Not ready to merge`. |
| Prior review-fix history | `974b7c0`, `1d05564`, `97c0c13`; preserved and not relabeled. |

## Validated finding closure

| Finding | Validated defect | Closure disposition | Regression or deterministic check |
|---:|---|---|---|
| 01 | TalaVisualizer Start cancelled its newly-created playback handle. | Separate caller-owned playback and timer lifecycles; cleanup captures only the handle it owns. | `src/test/components.test.tsx`: Start/Stop/Reset and compound scheduling lifecycle tests. |
| 02 | Secondary context policy diverged from primary eligibility and accepted malformed or wrong-grade context. | Context claims are composed into the same fail-closed publication decision; any defined malformed/unpaired value blocks publication, and Tala context is bound to the supplied candidate and exact disposition value. | `src/test/publication-containment.test.ts`: context/candidate mutation matrix and Lawani whole-record containment. |
| 03 | Null catalog entries crashed identity validation. | Runtime guards emit structural issues for malformed entries and non-array top-level catalogs, narrow review metadata safely, and skip dependent checks without throwing. | `src/test/content-validator.test.ts`: null, primitive, missing-metadata, and malformed catalog inputs never throw or fail open. |
| 04 | Source manifest and bibliography retained unsupported metadata and syllabus claims. | Selected catalogs now use explicit unknown metadata and no unsupported Bhairav claim; cross-catalog consistency is checked. | `src/test/source-metadata-consistency.test.ts` and forensic inventory checks. |
| 05 | Ledger header claimed Prompt 1 and an obsolete current checkout SHA. | Historical baseline and audited-through phase/base are separate; no stored current-checkout assertion remains. | Ledger header contract in `src/test/source-metadata-consistency.test.ts`. |
| 06 | Unicode/confusable and malformed PDF locators bypassed exact-document checks. | Locator parser consumes an exact expected filename plus one bounded integer page clause; filename-free, prefixed/suffixed, format-control, confusable, extra-document, and malformed-page forms fail closed. | `src/test/publication-containment.test.ts`: hostile locator matrix plus accepted exact forms. |
| 07 | Missing canonical grade scope was inferred from source metadata, parent, or nested questions. | Only each canonical record's own declared grade fields are accepted; quizzes and questions declare independent scopes and missing scope returns `missing-grade-scope`. | `src/test/publication-containment.test.ts`: canonical quiz and nested question grade deletion. |
| 08 | `Quiz.lessonId` was optional in TypeScript but mandatory at runtime. | Canonical `Quiz.lessonId` and `Quiz.gradeBands` are required; `QuizRunner` accepts only its display subset so exam UI no longer fabricates a lesson relationship. | Type-check plus quiz/exam mutations in publication tests. |
| 09 | Tala/term aliases were optional and canonical/same-record duplicates passed. | Every raw tala has an alias array; canonical-as-variant, repeated normalized variants, and cross-record collisions fail, with redundant audit variants removed rather than replaced. | `src/test/content-validator.test.ts`: Tala and terminology identity mutation matrices. |
| 11 | Circular TalaVisualizer coordinates differed at hydration. | Coordinates are rounded to deterministic serialized values. | `src/test/components.test.tsx` coordinate serialization test and browser console QA. |
| 12 | Public tala directory framed Lawani as generically North Indian. | Lawani is quarantined while its required school-system context source remains `Review Required`; directory copy is neutral. | `src/test/publication-containment.test.ts` and tala route/browser QA. |
| 13 | Normalized public tala bol cells exceeded readable extracted evidence. | Closed-world field registry binds every context/theka/bol to the supplied candidate, maps every issue ID through a structured catalog to the forensic ledger, and quarantines missing/nonpublic reverse dependencies. | `src/test/publication-containment.test.ts` disposition, issue-reference, candidate-drift, and dependency tests. |
| 14 | Acoustics prose added Hz/Hertz, directional rules, and flute/violin claims. | Public copy is limited to vibration count per second, non-directional source-listed factors, and general waveform recognition. | `src/test/musical-core.test.ts` public serialized-content assertions. |
| 15 | Teental/Jhaptal canonical spellings drifted from accepted Grade 10 extraction. | Accepted Grade 10 forms remain canonical; review-required forms are retrieval-only and not aliases. | `src/test/search-engine.test.ts` canonical/retrieval-only spelling assertions. |
| 16 | Bilawal added an unsupported basic-thaat-raga classification. | Unsupported classification removed; all-Shuddha characteristic remains bounded to the accepted source. | `src/test/musical-core.test.ts` Bilawal wording assertion. |
| 17 | Empty avarohana, invalid sample phrases, and same-record aliases were not validated. | Raga traversal/sample phrase and complete identity contracts are validated over unknown input. | `src/test/content-validator.test.ts` raga and alias mutation tests. |

## Rejected finding retained

Finding 10 (`validator-10-deepchandi-variant.json`) was rejected as framed in
`p02r4`: the Grade 11 spelling is retained as an explicitly retrieval-only
mapping and does not become a verified canonical alias. The retrieval behavior
has a positive regression in `src/test/search-engine.test.ts`.

## Fresh closeout review cycle 1

Full review run `20260816-023434-p02c1-dd0c6774` covered the complete diff from
`beba1479f473b3413b3f2de48a27c558e1937c6f`. All eleven required reviewers
completed. Sixteen deduplicated findings survived independent validation and
were resolved in the cycle-1 review-fix work: exact locator consumption,
malformed and value-unbound context, candidate-bound Tala dispositions,
missing dependency IDs and UI fallback, canonical quiz grades, non-array and
throwing validator inputs, exam nested claims and display typing, same-record
term collisions, audio-off phase continuity, same-ID Tala replacement, missing
transition assertions, disposition issue-ID referential integrity, and an
initial runtime-shape gate. The final follow-up rereview found that this gate
still omitted some route-rendered Raga, Lesson, Quiz, and Exam fields and did
not reject cyclic runtime objects; the second review-fix cycle adds explicit
nested-shape and cycle regressions. The separate RhythmTapGame completion-timer
report was initially classified as pre-existing. The follow-up review later
closed it with exactly-once and reset-cancellation regressions, so it is no
longer a residual risk. This cycle is not final acceptance; a clean
full rereview against the same base remains mandatory.

## Quarantine boundary

The raw tala field registry in `data/musical-core-field-dispositions.json`
enumerates required context, theka, and bol cells. `tala-khemta` retains readable
page-7 fields, but the review demonstrated that its remaining learner-visible
structure/actions were not closed through that registry. All eight Talas are
therefore raw/auditable and nonpublic until every required field is explicitly
dispositioned and re-reviewed.
This is an evidence boundary, not a claim that the underlying musical forms do
not exist.

## Follow-up review-fix cycle

The follow-up cycle centralizes canonical grade, question-shape, dependency,
field, and sanitized-projection decisions in `getRecordPublicationDecision`.
It adds closed runtime question discriminators, optional-link withholding,
bounded practice tempo, single-shot rhythm completion, caller-owned Web Audio
failure reporting, deterministic 16-beat hydration coverage, 44px/pressed-state
Tala controls, filename-free public citations, and explicit warnings on the
legacy source/curriculum documents. Khemta is newly quarantined rather than
inventing evidence for its unregistered structure fields. Final review evidence
is recorded separately and must not be inferred from this implementation log.

## Review-cycle boundary

The closeout receives a fresh maximum of three full review-fix cycles against
the original Phase 2 base. Each accepting run must preserve its run ID and
artifacts under `/tmp/compound-engineering/ce-code-review/`, cover the complete
diff, validate surviving findings independently, and report its final reviewed
head. No post-review repository mutation is acceptance evidence.

## Fresh final-contract findings

- Review run: `20260816-063000-p02-final-acceptance`
- Artifacts: `C:/tmp/compound-engineering/ce-code-review/20260816-063000-p02-final-acceptance/`
- Base: `beba1479f473b3413b3f2de48a27c558e1937c6f`
- Reviewed head: `c1785ae31f153168d362f3b1f294e68726aa819b`
- Coverage: 11/11 reviewers; 6/6 validators; 1 P1, 4 P2, 1 P3; 0 rejected, 0 failed, 0 degraded P0/P1.
- Verdict: `Not ready to merge; three-cycle review budget exhausted with validated actionable findings`.

These six findings are preserved as historical validated input for the fresh
final-contract closeout plan. Their implementation dispositions below are not
acceptance evidence until the new mandatory review-fix loop completes on the
full original-base-to-HEAD diff.

| ID | Severity | Validated defect | Implementation disposition | Regression evidence |
|---|---:|---|---|---|
| `P02-FINAL-01` | P1 | Missing Lesson `reviewMetadata` could pass the public guard and crash a detail route. | Complete raw metadata is mandatory; malformed raw content fails closed, while bounded review/public projections use safe unverified metadata. | `src/test/content-contracts.test.ts:241`, `src/test/publication-containment.test.ts:84` |
| `P02-FINAL-02` | P2 | Nonblank invalid difficulty, strand, and checkpoint values bypassed finite-domain checks. | Shared dependency-free finite unions reject invalid values in records and nested questions/activities. | `src/test/content-contracts.test.ts:241`, `src/test/content-contracts.test.ts:268` |
| `P02-FINAL-03` | P2 | Instrument, CulturalTradition, TheatreTradition, LearningPath, and other known guards omitted required fields or nested shapes. | All imported catalogs are unknown input; a closed known-kind classifier and complete entity contracts are shared by validation, publication, repository reads, and allowlisted projections. | `src/test/content-contracts.test.ts:101`, `src/lib/validation/content-contracts.ts:602`, `src/lib/validation/content-contracts.ts:702` |
| `P02-FINAL-04` | P2 | Deep acyclic records overflowed recursive graph inspection. | Iterative own-property traversal enforces depth 256 and 10,000 unique-node limits, permits shared DAGs, and rejects cycles/sparse or oversized containers. | `src/test/content-contracts.test.ts:368`, `src/lib/validation/content-contracts.ts:819`, `src/lib/validation/content-contracts.ts:950` |
| `P02-FINAL-05` | P3 | Nonblank bidi/zero-width input normalized to empty and matched every public field through `includes("")`. | Featured results remain only for genuinely empty/whitespace input; normalized-empty nonblank input returns no results. | `src/lib/search/search-engine.ts:84`, `src/lib/search/search-engine.ts:137`, `src/test/search-engine.test.ts:80` |
| `P02-FINAL-06` | P2 | Swara sequence playback continued after component unmount. | Caller-owned tone/sequence handles cancel initialization, active nodes, delays, callbacks, replacement, Strict Mode, and unmount work; Promise APIs remain compatibility wrappers. | `src/test/synth.test.ts:199`, `src/test/synth.test.ts:293`, `src/test/components.test.tsx:471 (cancels owned Swara tone and scale work)`, `src/test/components.test.tsx:555 (retains ready Swara ownership until finished)` |

The rejected Deepchandi finding, all earlier run IDs and blocked verdicts, and
the original-PDF/notation/OCR/SME limitations above remain unchanged. The
controlling fresh task is
`docs/plans/2026-08-16-002-fix-phase-2-final-contract-closeout-plan.md`.

## Acceptance-hardening cycle 1 (historical acceptance input; not final acceptance)

Run `20260816-161455-p02-acceptance-c1-4e350894` is preserved as a blocked
acceptance-only review input against base
`beba1479f473b3413b3f2de48a27c558e1937c6f` and reviewed head
`b1b2f5ea949d274fa5e260f39f0554465f704072`. The artifact directory is
`C:/tmp/compound-engineering/ce-code-review/20260816-161455-p02-acceptance-c1-4e350894/`.
The review team completed 11 reviewers. The validator wave completed 24
validators: 23 were validated and 1 was rejected as a historical dual-plan
reference. There were no validator infrastructure failures and no degraded
P0/P1 evidence. The 23 validated findings below are now
`FIXED-PENDING-REREVIEW`; none is a final
acceptance decision and the run does not authorize a push, ready PR, merge, or
deployment.

`validator-05-closeout-plan-reference.json` was rejected because the earlier
final-contract evidence legitimately points to
`docs/plans/2026-08-16-002-fix-phase-2-final-contract-closeout-plan.md`, while
this acceptance-hardening input is governed by
`docs/plans/2026-08-16-003-fix-phase-2-acceptance-hardening-plan.md`. Those
historical plan references and verdicts are retained without rewriting them.

| Validator artifact | Severity | Validated finding | Disposition (not acceptance) | Exact symbol/path anchor; line status |
|---|---:|---|---|---|
| `validator-01-hostile-validator-arrays.json` | P1 | Exported validators can iterate hostile or sparse outer collections before a safe snapshot. | **FIXED-PENDING-REREVIEW** — every outer collection is captured as one bounded dense snapshot and malformed input returns structured issues. | `src/lib/validation/content-validator.ts:69`, `src/lib/validation/content-validator.ts:615`, `src/lib/validation/content-validator.ts:986`, `src/test/content-validator.test.ts:224`. |
| `validator-02-batch-normalized-duplicate-ids.json` | P1 | `evaluatePublicationBatch` misses duplicate IDs that differ only by surrounding whitespace. | **FIXED-PENDING-REREVIEW** — trimmed identity collisions fail the complete batch closed. | `src/lib/data/publication-policy.ts:1276`, `src/test/publication-containment.test.ts:189`. |
| `validator-03-cms-metadata-proxy.json` | P1 | CMS review-status mutations can spread or read a hostile `reviewMetadata` proxy. | **FIXED-PENDING-REREVIEW** — metadata is cloned through the bounded graph boundary and hostile values return false without mutation. | `src/lib/data/repository.ts:103`, `src/lib/data/repository.ts:525`, `src/test/publication-containment.test.ts:260`. |
| `validator-04-cms-hostile-lookup.json` | P1 | CMS lookup can throw when a candidate lesson ID accessor is hostile. | **FIXED-PENDING-REREVIEW** — lookup uses guarded own-field reads and both mutation APIs catch hostile containers. | `src/lib/data/repository.ts:107`, `src/lib/data/repository.ts:560`, `src/test/publication-containment.test.ts:260`. |
| `validator-06-admin-rejected-success.json` | P1 | Admin displays success after the repository rejects a `Published` transition. | **FIXED-PENDING-REREVIEW** — the UI branches on the repository result and renders localized rejection feedback. | `src/app/admin/page.tsx:72`, `src/test/admin-page.test.tsx:12`. |
| `validator-07-batch-failure-reasons.json` | P1 | Batch wrappers and summaries discard stable malformed/incomplete failure reasons. | **FIXED-PENDING-REREVIEW** — checked batches retain a failure union and summaries expose failure reasons while preserving needs-review counts. | `src/lib/data/publication-policy.ts:1276`, `src/lib/data/repository.ts:484`, `src/test/publication-containment.test.ts:203`. |
| `validator-08-quizrunner-duplicate-ids.json` | P1 | `QuizRunner` accepts duplicate question IDs and aliases answer state. | **FIXED-PENDING-REREVIEW** — duplicate IDs render the safe unavailable state and record no attempt. | `src/components/quiz/QuizRunner.tsx:36`, `src/test/quiz-runner.test.tsx:175`. |
| `validator-09-failed-catalog-raw-counts.json` | P1 | Failed catalog capture can replace a nonempty catalog with an empty snapshot and erase raw counts. | **FIXED-PENDING-REREVIEW** — the context retains declared raw counts and summary reports all failed-capture records as needs-review. | `src/lib/data/publication-policy.ts:311`, `src/lib/data/publication-policy.ts:357`, `src/test/publication-containment.test.ts:225`. |
| `validator-10-pitch-replacement-race.json` | P1 | A stale microphone start can stop the newer replacement session. | **FIXED-PENDING-REREVIEW** — a stale view completion returns without stopping the current detector generation. | `src/components/audio/PitchDetectorView.tsx:39`, `src/test/components.test.tsx:126`. |
| `validator-11-known-snapshot-mismatch.json` | P1 | Exported `validateContentRecord` can trust an unrelated caller-supplied known snapshot. | **FIXED-PENDING-REREVIEW** — the exported contract always captures its own value; no caller-supplied snapshot parameter remains. | `src/lib/validation/content-contracts.ts:787`, `src/test/content-contracts.test.ts:319`. |
| `validator-12-curriculum-fixed-count.json` | P1 | The legacy curriculum map contradicted its warning by asserting fixed 30-document, complete Grades 6–11 coverage. | **FIXED-PENDING-REREVIEW** — the fixed count and completeness claim are replaced with bounded extracted-inventory wording; source-backed public scope remains 6–11 and does not imply curriculum completeness. | `docs/CURRICULUM_MAP.md` — 12–13/උසස් පෙළ boundary note; line anchor refresh after code stabilizes if needed. |
| `validator-13-quiz-format-coverage.json` | P1 | Supported quiz formats lack interaction-to-results regression coverage. | **FIXED-PENDING-REREVIEW** — all six renderable formats now execute selection, submission, scoring, and completion. | `src/test/quiz-runner.test.tsx:210`, `src/test/quiz-runner.test.tsx:246`. |
| `validator-14-dependency-matrix-coverage.json` | P1 | The dependency matrix is declared but not behaviorally proved across all recognized keys and public surfaces. | **FIXED-PENDING-REREVIEW** — every declared key is table-driven through blocking/nonblocking decision behavior; existing repository/search/summary parity remains covered. | `src/lib/data/publication-policy.ts:196`, `src/test/publication-containment.test.ts:57`, `src/test/publication-containment.test.ts:982`. |
| `validator-15-forensic-question-projection.json` | P2 | Nested quiz/exam projection can retain forensic audio/notation question types. | **FIXED-PENDING-REREVIEW** — nested public projection rejects any non-renderable question discriminator and quarantines the parent. | `src/lib/validation/content-contracts.ts:963`, `src/test/content-contracts.test.ts:295`. |
| `validator-16-evidence-helper-toctou.json` | P2 | Evidence helpers reread caller objects after shape checks, allowing stateful proxies to change the evidence decision. | **FIXED-PENDING-REREVIEW** — exported reference, Tala, and context helpers detach once and read the snapshot only. | `src/lib/data/publication-policy.ts:828`, `src/lib/data/publication-policy.ts:1341`, `src/test/publication-containment.test.ts:245`. |
| `validator-17-quiz-parent-matrix.json` | P2 | Quiz-parent `lessonId` is handled outside the declarative dependency matrix and lacks a nested disposition. | **FIXED-PENDING-REREVIEW** — blocking `lessonId` is declared and emitted as a nested parent disposition. | `src/lib/data/publication-policy.ts:196`, `src/test/publication-containment.test.ts:57`. |
| `validator-18-evaluation-context-mutability.json` | P2 | `PublicationEvaluationContext` exposes mutable snapshots, indexes, and memo state. | **FIXED-PENDING-REREVIEW** — public snapshots are frozen and mutable indexes/memo/stack remain private in a `WeakMap`. | `src/lib/data/publication-policy.ts:166`, `src/lib/data/publication-policy.ts:182`, `src/test/publication-containment.test.ts:215`. |
| `validator-19-stale-search-anchor.json` | P2 | Numeric search guard/test anchors in the correction log, field matrix, closeout, and ledger are stale. | **FIXED-PENDING-REREVIEW** — final search guard and regression anchors are refreshed. | `src/lib/search/search-engine.ts:84`, `src/lib/search/search-engine.ts:137`, `src/test/search-engine.test.ts:80`. |
| `validator-20-quizrunner-array-limit.json` | P2 | `QuizRunner` accepts a dense question array above the shared `MAX_ARRAY_ITEMS` bound. | **FIXED-PENDING-REREVIEW** — oversized arrays are rejected before iteration. | `src/components/quiz/QuizRunner.tsx:36`, `src/test/quiz-runner.test.tsx:185`. |
| `validator-21-quizrunner-zero-score.json` | P2 | `QuizRunner` admits `passingScorePercent: 0` despite the shared contract and then applies a fallback threshold. | **FIXED-PENDING-REREVIEW** — the renderer requires 1–100 and uses the validated threshold directly. | `src/components/quiz/QuizRunner.tsx:36`, `src/test/quiz-runner.test.tsx:199`. |
| `validator-22-sanitizer-return-type.json` | P2 | `sanitizePublicRecord<T>` promises `T` but returns `{}` for a rejected record. | **FIXED-PENDING-REREVIEW** — rejection is typed and returned as `undefined`. | `src/lib/data/publication-policy.ts:1400`, `src/test/publication-containment.test.ts:186`. |
| `validator-23-rejected-settled-handles.json` | P2 | Rejected `finished`/`ready` playback handles lack cleanup regression coverage. | **FIXED-PENDING-REREVIEW** — rejection after reset, replacement, and unmount is consumed and cannot produce stale UI or cross-owner cancellation. | `src/test/components.test.tsx:707`, `src/test/components.test.tsx:871`, `src/test/components.test.tsx:918`. |
| `validator-24-public-collection-duplicate-ids.json` | P1 | Exported public-collection validators can return valid for exact duplicate records even when batch evaluation detects the collision. | **FIXED-PENDING-REREVIEW** — exact and normalized duplicate public IDs are validation errors. | `src/lib/validation/content-validator.ts:615`, `src/lib/validation/content-validator.ts:695`, `src/test/content-validator.test.ts:238`. |

The rejected Deepchandi finding, the earlier blocked `p02r4`, final-contract,
and other review-cycle verdicts remain historical evidence exactly as recorded
above. This acceptance-hardening cycle adds no musical fact, does not promote a
Tala or raga, and does not change the whole-entity quarantine or original-PDF
review boundaries.

## Acceptance-hardening cycle 2 traceability (V15/V23 only; pending rereview)

Run `20260816-200203-p02-acceptance-c2-8f89f6b1` is preserved as blocked
historical review evidence for base
`beba1479f473b3413b3f2de48a27c558e1937c6f` through reviewed head
`5b3d2fac41b6b53c3747cb60ec7cc7a316eacd86`. Its artifacts are under
`C:/tmp/compound-engineering/ce-code-review/20260816-200203-p02-acceptance-c2-8f89f6b1/`.
All eleven reviewers completed; 24 validator attempts produced 20 validated
findings and four rejected attempts, with no validator infrastructure failures
or degraded P0/P1 evidence. This leaf addresses only the two validated
traceability findings below; the other cycle-2 findings remain untouched.

| Finding | Validated defect | Scoped repair/disposition | Current semantic evidence |
|---|---|---|---|
| `V15` | Correction-log, closeout, field-matrix, and ledger rows retained blank or unrelated numeric anchors, while the closeout test asserted only nonblank lines. | Refresh the affected Phase 2 rows to current symbols/headings and require semantic anchor resolution in the closeout test. **FIXED-PENDING-REREVIEW** — not acceptance evidence. | `src/test/musical-core.test.ts:386 (verifies bounded quarantine status for out-of-scope entities)`, `src/lib/data/publication-policy.ts:884 (gradeScopeMatchesSource)`, `src/test/publication-containment.test.ts:683 (requires each public grade band to contain a grade established by its source)`, `src/test/components.test.tsx:555 (retains ready Swara ownership until finished)`, `src/test/search-engine.test.ts:20 (should not discover quarantined Bhairav or Roopak claims)`. |
| `V23` | Acceptance-hardening coverage checked a few ID sentinels and anchor counts instead of the exact scoped IDs and each finding's test/fix/anchor/disposition mapping. | Add exact C3-01–C3-20 plus authorized P02 IDs and structured semantic mapping assertions, while preserving the historical artifact and all blocked verdicts. **FIXED-PENDING-REREVIEW** — not acceptance evidence. | `src/test/review-closeout.test.ts` exact scoped finding traceability test; `data/forensic-ledger.json` `acceptanceHardeningInput.traceability`. |

Cycle-2 fixes do not relabel the run as accepted, do not authorize a push or
ready PR, and do not rewrite the earlier blocked runs or rejected Deepchandi
retrieval-only disposition. The whole-entity Tala quarantine and all
original-PDF, notation, OCR, and SME-review boundaries remain unchanged.

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
| `C3-01`, `C3-04`–`C3-08` | Publication status drift, hostile batches, decision/projection TOCTOU, duplicate IDs, mismatched kinds, and stale identity catalogs. | Per-operation bounded snapshots, checked batches, complete kind contracts, and allowlisted projections fail closed. Summary and repository consumers use fresh decisions. | `src/lib/data/evaluation-context.ts#createPublicationEvaluationContext`, `src/lib/data/publication-policy.ts#evaluatePublicationBatch`, `src/lib/validation/content-contracts.ts#validateContentRecord`, `src/lib/validation/content-contracts.ts#projectPublicRecord`. |
| `C3-02`, `C3-03` | Summary caching ignored evidence changes and source views exposed unsupported provenance. | Summary memoization is removed. Public source fields share the unknown/unverified representation. | `src/lib/data/repository.ts#getPublicationSummary`, `src/test/review-closeout.test.ts (recomputes publication summaries)`, `src/test/source-metadata-consistency.test.ts#"uses the same unknown provenance representation in direct and repository source projections"`. |
| `C3-09`, `C3-10`, `C3-12` | Malformed Tala dispositions or selected-source rows could throw, and duplicate extracted-document mappings passed. | Forensic inputs are snapshotted as unknown data; malformed rows produce structured issues and exactly one document mapping is required. | `src/lib/data/publication-audit.ts#validateSelectedSourceMetadata`, `src/lib/data/publication-audit.ts#validateMusicalCoreFieldDispositions`, `src/test/source-metadata-consistency.test.ts#"keeps runtime, manifest, extracted-document, and human identities consistent"`. |
| `C3-11` | Dependency and graph coverage was incomplete. | One declarative field matrix classifies blocking playable/prerequisite/path/quiz references and nonblocking recommendation links; bounded graph rules apply at every decision boundary. | `src/lib/data/dependency-rules.ts#DEPENDENCY_FIELD_RULES`, `src/lib/data/publication-policy.ts#evaluatePublicationBatch`, `src/test/publication-contract-projections.test.ts#"declares the complete blocking and nonblocking dependency matrix"`. |
| `C3-13` | Correction-log final line anchors were stale. | Final anchors are refreshed after implementation/review stabilization and checked by the closeout test. | `src/test/review-closeout.test.ts (resolves current musical-core anchors by symbol and heading)`, `docs/FORENSIC_CORRECTION_LOG.md (P02-FINAL-06)`. |
| `C3-14`, `C3-15` | Renderable questions retained forensic fields and an empty quiz crashed. | Explicit renderable variants exclude audio/notation payloads; public projection strips extras; QuizRunner returns a supportive Sinhala unavailable state without recording an attempt. | `src/types/content.ts#RenderableQuestionType`, `src/components/quiz/QuizRunner.tsx#getUsableQuiz`, `src/test/quiz-runner.test.tsx#"renders a safe unavailable state for duplicate question IDs"`. |
| `C3-16` | Repository/search boundaries threw on malformed runtime queries. | Omitted/blank strings keep featured behavior; other nonstrings and nonblank normalized-empty controls return no results. | `src/lib/search/search-engine.ts#classifySearchQuery`, `src/lib/search/search-engine.ts#SearchIndex`, `src/test/search-engine.test.ts#"keeps featured results for raw empty input but rejects normalized-empty controls"`. |
| `C3-17`–`C3-20` | Rhythm callback identity reset sessions, completed handles accumulated, stale unavailable callbacks escaped, and delayed Tabla failures left timers. | Generation-owned sessions, settled-handle removal, mounted/current-owner callback guards, and failure-atomic timer cancellation close the lifecycle. | `src/components/audio/RhythmTapGame.tsx#RhythmTapGame`, `src/components/audio/TalaVisualizer.tsx#TalaVisualizer`, `src/lib/audio/tabla.ts#scheduleTablaPlan`, `src/test/swara-detail-consumers.test.tsx#keeps arranger and ear-training Swara ownership isolated`, `src/test/tala-visualizer.test.tsx#"cancels playback on Reset, tala change, and unmount"`, `src/test/tabla-plan-schedule.test.ts#keeps unknown and compound Tabla bols on the closed compound lookup`. |
| `P02-PITCH-OWNERSHIP-001` | Partial or stale microphone starts could retain MediaStreams, AudioContexts, nodes, animation frames, or callbacks. | Latest-generation ownership and idempotent cleanup stop late streams and reclaim every partial resource; audio remains local-only. | `src/lib/audio/pitch.ts#generation`, `src/lib/audio/pitch.ts#startListening`, `src/lib/audio/pitch.ts#stopListening`, `src/test/pitch.test.ts#"stops a late stream when stopped while permission is pending"`, `src/test/pitch.test.ts#"lets only the newest pending start acquire ownership and emit callbacks"`. |
| `P02-PROJECT-SCOPE-001` | Contributor guidance still described the product as public Grades 6–13/A/L and claimed a fixed canonical-source count. | Guidance now states the verified Grades 6–11 public boundary, raw quarantine for 12–13/A/L, no inferred count, and CMS stages as capability rather than completed-review evidence. | `AGENTS.md#current verified public curriculum boundary`, `AGENTS.md#raw Grade 12–13/A/L quarantine`, `AGENTS.md#CMS review capability boundary`, `src/test/review-closeout.test.ts (records acceptance-hardening scope)`. |

### Exact scoped finding traceability

This machine-checked appendix gives every scoped acceptance-hardening finding one
review artifact, regression test, fix symbol, current semantic anchor, and
non-acceptance disposition. The rows are deliberately explicit rather than
grouped ranges so a missing or duplicated finding cannot pass a count-only
closeout test.

| Finding ID | Review evidence | Regression test | Fix symbol | Current semantic anchor | Disposition |
|---|---|---|---|---|---|
| `C3-01` | `validator-01.json` | `src/test/review-closeout.test.ts#"rejects every CMS status/published mismatch without changing raw state"` | `src/lib/data/repository.ts#updateLessonReviewStatus` | `src/lib/data/repository.ts#updateLessonReviewStatus` | **FIXED-PENDING-REREVIEW** |
| `C3-02` | `validator-02.json` | `src/test/review-closeout.test.ts#"recomputes publication summaries from current inputs without memoized identity"` | `src/lib/data/repository.ts#getPublicationSummary` | `src/lib/data/repository.ts#getPublicationSummary` | **FIXED-PENDING-REREVIEW** |
| `C3-03` | `validator-03.json` | `src/test/source-metadata-consistency.test.ts#"uses the same unknown provenance representation in direct and repository source projections"` | `src/lib/validation/content-contracts.ts#projectPublicRecord` | `src/lib/validation/content-contracts.ts#projectPublicRecord` | **FIXED-PENDING-REREVIEW** |
| `C3-04` | `validator-04.json` | `src/test/publication-batch-boundary.test.ts#"fails publication batches closed for whitespace-normalized duplicate IDs"` | `src/lib/data/publication-policy.ts#evaluatePublicationBatch` | `src/lib/data/publication-policy.ts#evaluatePublicationBatch` | **FIXED-PENDING-REREVIEW** |
| `C3-05` | `validator-05.json` | `src/test/content-contracts.test.ts#"uses one detached snapshot for decision and public projection"` | `src/lib/data/snapshot-capture.ts#captureEvaluationValue` | `src/lib/data/snapshot-capture.ts#captureEvaluationValue` | **FIXED-PENDING-REREVIEW** |
| `C3-06` | `validator-06.json` | `src/test/review-closeout.test.ts#"fails closed for duplicate top-level IDs across public list, lookup, and summary consumers"` | `src/lib/data/publication-audit.ts#validatePublicCollection` | `src/lib/data/publication-audit.ts#validatePublicCollection` | **FIXED-PENDING-REREVIEW** |
| `C3-07` | `validator-07.json` | `src/test/content-contracts.test.ts#"rejects unknown or ambiguous kinds and never publishes them"` | `src/lib/validation/content-contracts.ts#projectPublicRecord` | `src/lib/validation/content-contracts.ts#projectPublicRecord` | **FIXED-PENDING-REREVIEW** |
| `C3-08` | `validator-08.json` | `src/test/publication-batch-boundary.test.ts#"rebuilds identity containment when a catalog mutates without changing length"` | `src/lib/data/evaluation-context.ts#createPublicationEvaluationContext` | `src/lib/data/evaluation-context.ts#createPublicationEvaluationContext` | **FIXED-PENDING-REREVIEW** |
| `C3-09` | `validator-09.json` | `src/test/content-validator.test.ts#"returns validation issues instead of throwing on malformed tala fields"` | `src/lib/data/publication-audit.ts#validateMusicalCoreFieldDispositions` | `src/lib/data/publication-audit.ts#validateMusicalCoreFieldDispositions` | **FIXED-PENDING-REREVIEW** |
| `C3-10` | `validator-10.json` | `src/test/source-metadata-consistency.test.ts#"rejects ambiguous extracted-document mappings"` | `src/lib/data/publication-audit.ts#validateSelectedSourceMetadata` | `src/lib/data/publication-audit.ts#validateSelectedSourceMetadata` | **FIXED-PENDING-REREVIEW** |
| `C3-11` | `validator-11.json` | `src/test/publication-contract-projections.test.ts#"applies the declarative %s dependency rule to the publication decision"` | `src/lib/data/dependency-rules.ts#DEPENDENCY_FIELD_RULES` | `src/lib/data/dependency-rules.ts#DEPENDENCY_FIELD_RULES` | **FIXED-PENDING-REREVIEW** |
| `C3-12` | `validator-12.json` | `src/test/source-metadata-consistency.test.ts#"rejects ambiguous extracted-document mappings"` | `src/lib/data/publication-audit.ts#validateSelectedSourceMetadata` | `src/lib/data/publication-audit.ts#validateSelectedSourceMetadata` | **FIXED-PENDING-REREVIEW** |
| `C3-13` | `validator-13.json` | `src/test/review-closeout.test.ts#"resolves current musical-core anchors by symbol and heading, not by nonblank line counts"` | `src/test/review-closeout.test.ts#P02-FINAL-06` | `src/test/review-closeout.test.ts#P02-FINAL-06` | **FIXED-PENDING-REREVIEW** |
| `C3-14` | `validator-14.json` | `src/test/content-contracts.test.ts#"projects only discriminator-compatible fields for every renderable question variant"` | `src/lib/validation/content-contracts.ts#projectPublicRecord` | `src/lib/validation/content-contracts.ts#projectPublicRecord` | **FIXED-PENDING-REREVIEW** |
| `C3-15` | `validator-15.json` | `src/test/quiz-runner.test.tsx#"renders a safe unavailable state for duplicate question IDs"` | `src/components/quiz/QuizRunner.tsx#getUsableQuiz` | `src/components/quiz/QuizRunner.tsx#getUsableQuiz` | **FIXED-PENDING-REREVIEW** |
| `C3-16` | `validator-16.json` | `src/test/search-engine.test.ts#"keeps featured results for raw empty input but rejects normalized-empty controls"` | `src/lib/search/search-engine.ts#classifySearchQuery` | `src/lib/search/search-engine.ts#classifySearchQuery` | **FIXED-PENDING-REREVIEW** |
| `C3-17` | `validator-17.json` | `src/test/rhythm-tap-game.test.tsx#"keeps an active rhythm session when only the completion callback changes"` | `src/components/audio/RhythmTapGame.tsx#RhythmTapGame` | `src/components/audio/RhythmTapGame.tsx#RhythmTapGame` | **FIXED-PENDING-REREVIEW** |
| `C3-18` | `validator-18.json` | `src/test/rhythm-tap-game.test.tsx#"removes completed rhythm playback handles before reset"` | `src/components/audio/TalaVisualizer.tsx#TalaVisualizer` | `src/components/audio/TalaVisualizer.tsx#TalaVisualizer` | **FIXED-PENDING-REREVIEW** |
| `C3-19` | `validator-19.json` | `src/test/tala-visualizer.test.tsx#"suppresses stale Tala unavailable callbacks after reset and replacement"` | `src/components/audio/TalaVisualizer.tsx#TalaVisualizer` | `src/components/audio/TalaVisualizer.tsx#TalaVisualizer` | **FIXED-PENDING-REREVIEW** |
| `C3-20` | `validator-20.json` | `src/test/rhythm-tap-game.test.tsx#"keeps RhythmTapGame playback ownership isolated when Tabla promises reject"` | `src/lib/audio/tabla.ts#scheduleTablaPlan` | `src/lib/audio/tabla.ts#scheduleTablaPlan` | **FIXED-PENDING-REREVIEW** |
| `P02-PITCH-OWNERSHIP-001` | `metadata.json authorizedAdditionalFindings` | `src/test/pitch.test.ts#"stops a late stream when stopped while permission is pending"` | `src/lib/audio/pitch.ts#startListening` | `src/lib/audio/pitch.ts#startListening` | **FIXED-PENDING-REREVIEW** |
| `P02-PROJECT-SCOPE-001` | `metadata.json authorizedAdditionalFindings` | `src/test/review-closeout.test.ts#"records the acceptance-hardening scope without rewriting blocked review history"` | `AGENTS.md#current verified public curriculum boundary` | `AGENTS.md#current verified public curriculum boundary` | **FIXED-PENDING-REREVIEW** |

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
| `P02-FINAL-01` | P1 | Missing Lesson `reviewMetadata` could pass the public guard and crash a detail route. | Complete raw metadata is mandatory; malformed raw content fails closed, while bounded review/public projections use safe unverified metadata. | `src/lib/validation/content-contracts.ts#isReviewMetadata`; test `rejects both CMS publication entry points when raw metadata is synthesized or incomplete` |
| `P02-FINAL-02` | P2 | Nonblank invalid difficulty, strand, and checkpoint values bypassed finite-domain checks. | Shared dependency-free finite unions reject invalid values in records and nested questions/activities. | `src/lib/validation/content-contracts.ts#DIFFICULTY_LEVELS`; test `rejects unsupported finite-domain values across every known entity contract` |
| `P02-FINAL-03` | P2 | Instrument, CulturalTradition, TheatreTradition, LearningPath, and other known guards omitted required fields or nested shapes. | All imported catalogs are unknown input; a closed known-kind classifier and complete entity contracts are shared by validation, publication, repository reads, and allowlisted projections. | `src/lib/validation/content-contracts.ts#KIND_SIGNATURES`; test `validates every imported catalog record, nested question, and allowlisted projection` |
| `P02-FINAL-04` | P2 | Deep acyclic records overflowed recursive graph inspection. | Iterative own-property traversal enforces depth 256 and 10,000 unique-node limits, permits shared DAGs, and rejects cycles/sparse or oversized containers. | `src/lib/shared/bounded-values.ts#inspectGraph`; test `accepts shared DAGs but rejects cycles and graph budget overruns` |
| `P02-FINAL-05` | P3 | Nonblank bidi/zero-width input normalized to empty and matched every public field through `includes("")`. | Featured results remain only for genuinely empty/whitespace input; normalized-empty nonblank input returns no results. | `src/lib/search/search-engine.ts#classifySearchQuery`; test `treats raw-empty and normalized-empty queries as different states` |
| `P02-FINAL-06` | P2 | Swara sequence playback continued after component unmount. | Caller-owned tone/sequence handles cancel initialization, active nodes, delays, callbacks, replacement, Strict Mode, and unmount work; Promise APIs remain compatibility wrappers. | `src/lib/audio/synth.ts#SwaraPlaybackHandle`; tests `cancels owned Swara tone and scale work` and `retains ready Swara ownership until finished` |

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
| `validator-01-hostile-validator-arrays.json` | P1 | Exported validators can iterate hostile or sparse outer collections before a safe snapshot. | **FIXED-PENDING-REREVIEW** — every outer collection is captured as one bounded dense snapshot and malformed input returns structured issues. | `src/lib/data/publication-audit.ts#validatePublicCollection`, `src/lib/data/publication-audit.ts#validatePublicCollection`, `src/lib/data/publication-audit.ts#validatePublicCollection`, `src/test/content-validator.test.ts#"fails hostile and sparse outer identity collections closed without throwing"`. |
| `validator-02-batch-normalized-duplicate-ids.json` | P1 | `evaluatePublicationBatch` misses duplicate IDs that differ only by surrounding whitespace. | **FIXED-PENDING-REREVIEW** — trimmed identity collisions fail the complete batch closed. | `src/lib/data/publication-policy.ts#evaluatePublicationBatch`, `src/test/publication-batch-boundary.test.ts#"fails publication batches closed for whitespace-normalized duplicate IDs"`. |
| `validator-03-cms-metadata-proxy.json` | P1 | CMS review-status mutations can spread or read a hostile `reviewMetadata` proxy. | **FIXED-PENDING-REREVIEW** — metadata is cloned through the bounded graph boundary and hostile values return false without mutation. | `src/lib/data/repository.ts#updateLessonReviewStatus`, `src/lib/data/repository.ts#updateLessonStatus`, `src/test/publication-batch-boundary.test.ts#fails CMS operations safely for hostile IDs and metadata containers`. |
| `validator-04-cms-hostile-lookup.json` | P1 | CMS lookup can throw when a candidate lesson ID accessor is hostile. | **FIXED-PENDING-REREVIEW** — lookup uses guarded own-field reads and both mutation APIs catch hostile containers. | `src/lib/data/repository.ts#updateLessonReviewStatus`, `src/lib/data/repository.ts#updateLessonStatus`, `src/test/publication-batch-boundary.test.ts#fails CMS operations safely for hostile IDs and metadata containers`. |
| `validator-06-admin-rejected-success.json` | P1 | Admin displays success after the repository rejects a `Published` transition. | **FIXED-PENDING-REREVIEW** — the UI branches on the repository result and renders localized rejection feedback. | `src/app/admin/page.tsx#boundaryReport`, `src/test/admin-page.test.tsx#reports a rejected CMS mutation as an error instead of success`. |
| `validator-07-batch-failure-reasons.json` | P1 | Batch wrappers and summaries discard stable malformed/incomplete failure reasons. | **FIXED-PENDING-REREVIEW** — checked batches retain a failure union and summaries expose failure reasons while preserving needs-review counts. | `src/lib/data/publication-policy.ts#evaluatePublicationBatch`, `src/lib/data/repository.ts#getPublicationSummary`, `src/test/publication-batch-boundary.test.ts#preserves stable failure reasons at the checked batch boundary`. |
| `validator-08-quizrunner-duplicate-ids.json` | P1 | `QuizRunner` accepts duplicate question IDs and aliases answer state. | **FIXED-PENDING-REREVIEW** — duplicate IDs render the safe unavailable state and record no attempt. | `src/components/quiz/QuizRunner.tsx#getUsableQuiz`, `src/test/quiz-runner.test.tsx#renders a safe unavailable state for duplicate question IDs`. |
| `validator-09-failed-catalog-raw-counts.json` | P1 | Failed catalog capture can replace a nonempty catalog with an empty snapshot and erase raw counts. | **FIXED-PENDING-REREVIEW** — the context retains declared raw counts and summary reports all failed-capture records as needs-review. | `src/lib/data/evaluation-context.ts#createPublicationEvaluationContext`, `src/lib/data/evaluation-context.ts#createPublicationEvaluationContext`, `src/test/publication-batch-boundary.test.ts#derives raw catalog counts from the exact detached snapshot`. |
| `validator-10-pitch-replacement-race.json` | P1 | A stale microphone start can stop the newer replacement session. | **FIXED-PENDING-REREVIEW** — a stale view completion returns without stopping the current detector generation. | `src/components/audio/PitchDetectorView.tsx#handleStartMic`, `src/test/pitch.test.ts#lets only the newest pending start acquire ownership and emit callbacks`. |
| `validator-11-known-snapshot-mismatch.json` | P1 | Exported `validateContentRecord` can trust an unrelated caller-supplied known snapshot. | **FIXED-PENDING-REREVIEW** — the exported contract always captures its own value; no caller-supplied snapshot parameter remains. | `src/lib/validation/content-contracts.ts#validateContentRecord`, `src/test/content-contracts.test.ts#"never accepts a caller-supplied snapshot as contract evidence"`. |
| `validator-12-curriculum-fixed-count.json` | P1 | The legacy curriculum map contradicted its warning by asserting fixed 30-document, complete Grades 6–11 coverage. | **FIXED-PENDING-REREVIEW** — the fixed count and completeness claim are replaced with bounded extracted-inventory wording; source-backed public scope remains 6–11 and does not imply curriculum completeness. | `docs/CURRICULUM_MAP.md` — 12–13/උසස් පෙළ boundary note; line anchor refresh after code stabilizes if needed. |
| `validator-13-quiz-format-coverage.json` | P1 | Supported quiz formats lack interaction-to-results regression coverage. | **FIXED-PENDING-REREVIEW** — all six renderable formats now execute selection, submission, scoring, and completion. | `src/test/quiz-runner.test.tsx#scores a correct MCQ answer`, `src/test/quiz-runner.test.tsx#scores a correct MCQ answer`. |
| `validator-14-dependency-matrix-coverage.json` | P1 | The dependency matrix is declared but not behaviorally proved across all recognized keys and public surfaces. | **FIXED-PENDING-REREVIEW** — every declared key is table-driven through blocking/nonblocking decision behavior and repository/search/summary parity. | `src/lib/data/dependency-rules.ts#DEPENDENCY_FIELD_RULES`, `src/test/publication-contract-projections.test.ts#"declares the complete blocking and nonblocking dependency matrix"`, `src/test/publication-parity.test.ts#"proves %s through contract, decision, projection, and checked batch boundaries"`. |
| `validator-15-forensic-question-projection.json` | P2 | Nested quiz/exam projection can retain forensic audio/notation question types. | **FIXED-PENDING-REREVIEW** — nested public projection rejects any non-renderable question discriminator and quarantines the parent. | `src/lib/validation/content-contracts.ts#projectPublicRecord`, `src/test/content-contracts.test.ts#"projects only discriminator-compatible fields for every renderable question variant"`. |
| `validator-16-evidence-helper-toctou.json` | P2 | Evidence helpers reread caller objects after shape checks, allowing stateful proxies to change the evidence decision. | **FIXED-PENDING-REREVIEW** — exported reference, Tala, and context helpers detach once and read the snapshot only. | `src/lib/data/source-evidence-policy.ts#evaluateSourceReference`, `src/lib/data/publication-policy.ts#sanitizeReviewRecord`, `src/test/publication-evidence-containment.test.ts#fails every evidence helper closed for unsafe or forged evaluation contexts`. |
| `validator-17-quiz-parent-matrix.json` | P2 | Quiz-parent `lessonId` is handled outside the declarative dependency matrix and lacks a nested disposition. | **FIXED-PENDING-REREVIEW** — blocking `lessonId` is declared and emitted as a nested parent disposition. | `src/lib/data/publication-policy.ts#getQuizContainerPublicationDecision`, `src/test/publication-contract-projections.test.ts#"declares the complete blocking and nonblocking dependency matrix"`. |
| `validator-18-evaluation-context-mutability.json` | P2 | `PublicationEvaluationContext` exposes mutable snapshots, indexes, and memo state. | **FIXED-PENDING-REREVIEW** — public snapshots are frozen and mutable indexes/memo/stack remain private in a `WeakMap`. | `src/lib/data/evaluation-state.ts#PublicationEvaluationContext`, `src/lib/data/evaluation-context.ts#createPublicationEvaluationContext`, `src/test/publication-batch-boundary.test.ts#"exposes only frozen publication snapshots, not mutable evaluation caches"`. |
| `validator-19-stale-search-anchor.json` | P2 | Numeric search guard/test anchors in the correction log, field matrix, closeout, and ledger are stale. | **FIXED-PENDING-REREVIEW** — final search guard and regression anchors are refreshed. | `src/lib/search/search-engine.ts#classifySearchQuery`, `src/lib/search/search-engine.ts#search`, `src/test/search-engine.test.ts#keeps featured results for raw empty input but rejects normalized-empty controls`. |
| `validator-20-quizrunner-array-limit.json` | P2 | `QuizRunner` accepts a dense question array above the shared `MAX_ARRAY_ITEMS` bound. | **FIXED-PENDING-REREVIEW** — oversized arrays are rejected before iteration. | `src/components/quiz/QuizRunner.tsx#getUsableQuiz`, `src/test/quiz-runner.test.tsx#"renders a safe unavailable state when questions exceed MAX_ARRAY_ITEMS"`. |
| `validator-21-quizrunner-zero-score.json` | P2 | `QuizRunner` admits `passingScorePercent: 0` despite the shared contract and then applies a fallback threshold. | **FIXED-PENDING-REREVIEW** — the renderer requires 1–100 and uses the validated threshold directly. | `src/components/quiz/QuizRunner.tsx#getUsableQuiz`, `src/test/quiz-runner.test.tsx#renders passingScorePercent 0 as unavailable without recording an attempt`. |
| `validator-22-sanitizer-return-type.json` | P2 | `sanitizePublicRecord<T>` promises `T` but returns `{}` for a rejected record. | **FIXED-PENDING-REREVIEW** — rejection is typed and returned as `undefined`. | `src/lib/data/publication-policy.ts#sanitizePublicRecord`, `src/test/publication-contract-projections.test.ts#downgrades a public decision when its bounded projection cannot be produced`. |
| `validator-23-rejected-settled-handles.json` | P2 | Rejected `finished`/`ready` playback handles lack cleanup regression coverage. | **FIXED-PENDING-REREVIEW** — rejection after reset, replacement, and unmount is consumed and cannot produce stale UI or cross-owner cancellation. | `src/test/swara-detail-consumers.test.tsx#does not report a Tabla unavailable error when the demo intentionally cancels`, `src/test/rhythm-tap-game.test.tsx#keeps an active rhythm session when only the completion callback changes`, `src/test/tala-visualizer.test.tsx#"cancels playback on Reset, tala change, and unmount"`. |
| `validator-24-public-collection-duplicate-ids.json` | P1 | Exported public-collection validators can return valid for exact duplicate records even when batch evaluation detects the collision. | **FIXED-PENDING-REREVIEW** — exact and normalized duplicate public IDs are validation errors. | `src/lib/data/publication-audit.ts#validatePublicCollection`, `src/lib/data/publication-audit.ts#validatePublicCollection`, `src/test/content-validator.test.ts#"rejects exact and whitespace-normalized duplicate IDs in public collections"`. |

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
| `V15` | Correction-log, closeout, field-matrix, and ledger rows retained blank or unrelated numeric anchors, while the closeout test asserted only nonblank lines. | Refresh the affected Phase 2 rows to current symbols/headings and require semantic anchor resolution in the closeout test. **FIXED-PENDING-REREVIEW** — not acceptance evidence. | `src/test/musical-core.test.ts#"verifies bounded quarantine status for out-of-scope entities (Bhairav & Roopak)"`, `src/lib/data/publication-policy.ts#gradeScopeMatchesSource`, `src/test/publication-contract-projections.test.ts#requires each public grade band to contain a grade established by its source`, `src/test/swara-detail-consumers.test.tsx#"retains ready Swara ownership until finished on every direct-tone consumer"`, `src/test/search-engine.test.ts#should not discover quarantined Bhairav or Roopak claims`. |
| `V23` | Acceptance-hardening coverage checked a few ID sentinels and anchor counts instead of the exact scoped IDs and each finding's test/fix/anchor/disposition mapping. | Add exact C3-01–C3-20 plus authorized P02 IDs and structured semantic mapping assertions, while preserving the historical artifact and all blocked verdicts. **FIXED-PENDING-REREVIEW** — not acceptance evidence. | `src/test/review-closeout.test.ts` exact scoped finding traceability test; `data/forensic-ledger.json` `acceptanceHardeningInput.traceability`. |

Cycle-2 fixes do not relabel the run as accepted, do not authorize a push or
ready PR, and do not rewrite the earlier blocked runs or rejected Deepchandi
retrieval-only disposition. The whole-entity Tala quarantine and all
original-PDF, notation, OCR, and SME-review boundaries remain unchanged.

## Acceptance-hardening cycle 3 (third fix cycle; pending acceptance review)

Run `20260817-033648-p02-acceptance-c3-1ebef39b` reviewed the complete original
base-to-`1f67f50f919a63ec5ccb007ab563ce410b94621f` diff with all eleven required
GPT-5.6 Luna/MAX specialists. Fourteen candidates survived synthesis and all
fourteen were independently validated. The frontend-races findings were
recorded as pre-existing advisories; scheduled exact-head browser QA remains a
post-acceptance gate. This is findings input only.

| Validator set | Applied correction | Regression / final anchor | State |
|---|---|---|---|
| `C3-V01`–`C3-V04` | Fail closed on padded/mutable quarantine identity, malformed page metadata, and unsafe Tala contexts. | `src/lib/data/decision-types.ts#KNOWN_QUARANTINED_ENTITY_IDS`, `:316`, `:326`, `:923`; `src/test/publication-containment.test.ts#keeps unsupported grades and named quarantined entities out of public data`, `:718`. | **FIXED-PENDING-ACCEPTANCE-REVIEW** |
| `C3-V05`–`C3-V08` | One QuizRunner snapshot, declared public kind enforcement, exact source IDs, and complete format-control normalization. | `src/components/quiz/QuizRunner.tsx#getUsableQuiz`; `src/lib/data/publication-audit.ts#validatePublicCollection`; `src/lib/search/normalize-sinhala.ts#normalizeSinhalaText`; `src/test/quiz-runner.test.tsx#renders a safe unavailable state for duplicate question IDs`. | **FIXED-PENDING-ACCEPTANCE-REVIEW** |
| `C3-V09`, `C3-V10` | Prove dependency parity at repository boundaries and make traceability exact-line/table-to-ledger checked. | `src/test/publication-parity.test.ts#"proves %s through contract, decision, projection, and checked batch boundaries"`; `src/test/review-closeout.test.ts#records the acceptance-hardening scope without rewriting blocked review history`, `:136`. | **FIXED-PENDING-ACCEPTANCE-REVIEW** |
| `C3-V11`–`C3-V14` | Complete rhythm callback, zero-upload, AudioContext restoration, and CMS isolation regressions. | `src/test/swara-detail-consumers.test.tsx#keeps arranger and ear-training Swara ownership isolated`; `src/test/pitch.test.ts#lets only the newest pending start acquire ownership and emit callbacks`; `src/test/audio-context-failover.test.ts#fails Web Audio initialization closed without throwing and bounds hostile BPM`; `src/test/publication-containment.test.ts#keeps unsupported grades and named quarantined entities out of public data`. | **FIXED-PENDING-ACCEPTANCE-REVIEW** |

The cycle-3 artifacts are under
`C:/tmp/compound-engineering/ce-code-review/20260817-033648-p02-acceptance-c3-1ebef39b/`.
No push, PR readiness, merge, deployment, musical promotion, or source-boundary
change is authorized until the separate read-only acceptance review succeeds.

## Final-acceptance follow-up (14 validated blockers)

Run `20260817-054012-p02-final-acceptance-a17068ff` reviewed immutable head
`b1fba4a2278a38501023488c9fd9e8c703b723fd`. Eleven Luna/MAX reviewers
completed; 14 findings survived synthesis and independent validation. This
follow-up preserves that run as blocked findings input, not acceptance evidence.

| ID | Validated blocker | Stable regression / implementation evidence | Disposition |
|---|---|---|---|
| `FA-V01` | Validator decisions used a different catalog snapshot. | `src/test/publication-batch-boundary.test.ts#validates caller-owned catalog records with the same publication snapshot`; `src/lib/data/publication-audit.ts#validatePublicCollection` | **FIXED-PENDING-REREVIEW** |
| `FA-V03` | Over-wide objects forced unbounded descriptor materialization. | `src/test/content-contracts.test.ts#"bounds descriptor reads while rejecting over-wide objects"`; `src/lib/shared/bounded-values.ts#safeOwnEntries` | **FIXED-PENDING-REREVIEW** |
| `FA-V04` | Summary counts could use a different observation than the captured catalog. | `src/test/publication-batch-boundary.test.ts#derives raw catalog counts from the exact detached snapshot`; `src/lib/data/evaluation-context.ts#createPublicationEvaluationContext` | **FIXED-PENDING-REREVIEW** |
| `FA-V05` | Duplicate Tala disposition IDs silently overwrote one another. | `src/test/publication-evidence-containment.test.ts#rejects malformed and duplicate field-disposition registry rows`; `src/lib/data/publication-audit.ts#validateMusicalCoreFieldDispositions` | **FIXED-PENDING-REREVIEW** |
| `FA-V06` | Malformed Swara sequences could enter playback. | `src/test/swara-synth-lifecycle.test.ts#fails closed for malformed Swara sequence inputs before callbacks or audio`; `src/lib/audio/synth.ts#snapshotValidSwaraSequence` | **FIXED-PENDING-REREVIEW** |
| `FA-V07` | Hostile Tabla durations could throw synchronously. | `src/test/tabla-plan-schedule.test.ts#returns failure-atomic handles for hostile Tabla durations`; `src/lib/audio/tabla.ts#planTablaBol` | **FIXED-PENDING-REREVIEW** |
| `FA-V08` | Single-record decisions collapsed batch failure reasons. | `src/test/publication-batch-boundary.test.ts#preserves stable failure reasons at the checked batch boundary`; `src/lib/data/publication-policy.ts#getRecordPublicationDecision` | **FIXED-PENDING-REREVIEW** |
| `FA-V09` | Review sanitization used an unsafe empty-object sentinel. | `src/test/publication-batch-boundary.test.ts#"uses one normalized identity index for context, batch, review, and repository reads"`; `src/lib/data/publication-policy.ts#sanitizeReviewRecord` | **FIXED-PENDING-REREVIEW** |
| `FA-V10` | CMS mutations returned only booleans. | `src/test/publication-batch-boundary.test.ts#returns stable structured CMS rejection reasons`; `src/lib/data/repository.ts#CmsMutationResult` | **FIXED-PENDING-REREVIEW** |
| `FA-V11` | Public answer options exposed forensic `isCorrect`. | `src/test/content-contracts.test.ts#covers every nested projection allowlist field and strips nested extras`; `src/types/content.ts#AnswerOption` | **FIXED-PENDING-REREVIEW** |
| `FA-V14` | Final traceability used stale numeric anchors. | `src/test/review-closeout.test.ts#records the acceptance-hardening scope without rewriting blocked review history`; stable `path#symbol` references in this ledger | **FIXED-PENDING-REREVIEW** |
| `FA-V15` | Throwing timer cancellation stranded audio handles. | `src/test/swara-synth-lifecycle.test.ts#settles Swara cleanup when clearTimeout throws`; `src/lib/audio/tabla.ts#TablaSynthEngine` | **FIXED-PENDING-REREVIEW** |
| `FA-V16` | CMS writes could target a different raw slot after validation. | `src/test/publication-batch-boundary.test.ts#replaces the validated lesson snapshot without writing through a mutable catalog`; `src/lib/data/repository.ts#updateLessonReviewStatus` | **FIXED-PENDING-REREVIEW** |
| `FA-V17` | Locator parsing could expand unbounded term/page ranges. | `src/test/publication-evidence-containment.test.ts#"rejects filename digits, out-of-range pages, and mismatched PDF locators"`; `src/lib/evidence/source-evidence.ts#parseSourceLocator` | **FIXED-PENDING-REREVIEW** |

The omitted validator numbers were rejected or deduplicated and remain in the
run artifacts. All eight Talas remain whole-entity quarantined; Deepchandi and
the original-PDF/notation/OCR/SME boundaries are unchanged.

## Acceptance-hardening review cycle 1 (20 validated findings; pending rereview)

Run `20260817-p02-hardening-c1-06568d6f` reviewed the complete diff from
`beba1479f473b3413b3f2de48a27c558e1937c6f` through
`06568d6f0d777771ef139e6fdd21d1bc73d8c5e7`. Eleven required Luna/MAX
reviewers completed. Twenty synthesized findings survived and each received an
independent validator artifact: 20 validated, 0 rejected, 0 failed, and no
degraded P0/P1 evidence. Artifacts are under
`C:/tmp/compound-engineering/ce-code-review/20260817-p02-hardening-c1-06568d6f/`.

The following repairs are `FIXED-PENDING-REREVIEW`. This run is not final
acceptance and does not authorize a push, ready PR, merge, deployment, source
promotion, or change to the whole-entity Tala quarantine.

| ID | Validator artifact | Validated issue | Stable regression | Final implementation anchor | Disposition |
|---|---|---|---|---|---|
| `AH-C1-V01` | `validator-01-notation-remove-cancel.json` | Removing an arranged note did not cancel its active preview. | `src/test/swara-consumers.test.tsx#cancels a NotationArranger tone when its arranged item is removed` | `src/components/audio/NotationArranger.tsx#handleRemoveItem` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V02` | `validator-02-tabla-immediate-rollback.json` | Immediate Tabla callback failure lacked rollback proof. | `src/test/tabla-plan-schedule.test.ts#rolls back earlier Tabla timers when an immediate stroke callback fails` | `src/lib/audio/tabla.ts#playBol` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V03` | `validator-03-tala-success-settlement.json` | Successful Tala handles lacked ownership-settlement coverage. | `src/test/tala-visualizer.test.tsx#releases a Tala handle only after ready and finished settle` | `src/components/audio/TalaVisualizer.tsx#TalaVisualizer` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V04` | `validator-04-pitch-analyser-failure.json` | Analyser-read failure cleanup was unproved. | `src/test/pitch.test.ts#cleans the active graph when analyser sampling throws` | `src/lib/audio/pitch.ts#PitchDetector` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V05` | `validator-05-pitch-active-replacement.json` | Active microphone replacement ownership was unproved. | `src/test/pitch.test.ts#releases an active session before installing a replacement` | `src/lib/audio/pitch.ts#startListening` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V06` | `validator-06-grade-input-snapshot.json` | Direct publication input bypassed the bounded snapshot. | `src/test/publication-batch-boundary.test.ts#bounds direct publication-input grade normalization` | `src/lib/data/publication-policy.ts#toPublicationInput` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V07` | `validator-07-ownkeys-width.json` | Own-key traversal could materialize an over-wide container before rejecting it. | `src/test/content-contracts.test.ts#bounds descriptor reads while rejecting over-wide objects` | `src/lib/shared/bounded-values.ts#safeOwnEntries` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V08` | `validator-08-question-collection.json` | A standalone Question collection label could not resolve a canonical kind. | `src/test/content-validator.test.ts#rejects standalone question collection labels because questions are nested quiz/exam records` | `src/lib/data/publication-audit.ts#validatePublicCollection` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V09` | `validator-09-source-collection.json` | Source transparency rows were incorrectly passed through curriculum gates. | `src/test/source-metadata-consistency.test.ts#validates raw and repository source collections through the transparency boundary` | `src/lib/data/publication-audit.ts#validateSourceTransparencyCollection` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V10` | `validator-10-grade-band-guard.json` | The exported grade-band guard could throw or accept sparse/oversized arrays. | `src/test/content-contracts.test.ts#"rejects sparse, oversized, and hostile grade-band arrays without throwing"` | `src/lib/validation/content-contracts.ts#isGradeBandArray` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V11` | `validator-11-nested-question-ids.json` | Nested Quiz/Exam question IDs were not canonicalized for duplicate detection. | `src/test/content-contracts.test.ts#uses canonical IDs for duplicate nested Quiz and Exam questions` | `src/lib/validation/content-contracts.ts#canonicalQuestionIds` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V12` | `validator-12-swara-callback-failure.json` | A throwing Swara callback could strand the owned handle. | `src/test/swara-consumers.test.tsx#releases a Swara tone when onNotePlay throws` | `src/components/audio/SwaraKeyboard.tsx#SwaraKeyboard` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V13` | `validator-13-rhythm-cleanup.json` | Rhythm cleanup stopped after the first throwing cancellation. | `src/test/rhythm-tap-game.test.tsx#continues Rhythm cleanup when an owned handle cancellation throws` | `src/components/audio/RhythmTapGame.tsx#clearPlayback` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V14` | `validator-14-tala-cleanup.json` | Tala timer/audio cleanup was not failure atomic. | `src/test/tala-visualizer.test.tsx#contains throwing Tala cleanup and reports synchronous Tabla failure` | `src/components/audio/TalaVisualizer.tsx#cancelPlayback` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V15` | `validator-15-projection-parity.json` | A public decision could survive with no bounded projection. | `src/test/publication-contract-projections.test.ts#downgrades a public decision when its bounded projection cannot be produced` | `src/lib/data/publication-policy.ts#evaluatePublicationBatch` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V16` | `validator-16-duplicate-page-evidence.json` | Duplicate or invalid source-page rows could certify missing evidence. | `src/test/publication-parity.test.ts#"rejects duplicate, missing, unknown, and out-of-range source-page evidence"` | `src/lib/evidence/source-evidence.ts#hasValidPageQualityRegistry` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V17` | `validator-17-duplicate-tala-dispositions.json` | Duplicate Tala disposition IDs used the first row. | `src/test/publication-parity.test.ts#fails Tala publication closed when disposition IDs are duplicated` | `src/lib/data/tala-disposition-policy.ts#getTalaFieldDisposition` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V18` | `validator-18-pitch-reentrant-stop.json` | Pitch detection could emit after a re-entrant stop. | `src/test/pitch.test.ts#rechecks ownership when stop is re-entered during frame registration` | `src/lib/audio/pitch.ts#PitchDetector` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V19` | `validator-19-queued-tala-tick.json` | A queued Tala tick could execute after completion or unmount. | `src/test/tala-visualizer.test.tsx#suppresses queued Tala callbacks after completion and unmount` | `src/components/audio/TalaVisualizer.tsx#timerGenerationRef` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V20` | `validator-20-invisible-record-ids.json` | Invisible controls allowed duplicate record identities. | `src/test/publication-batch-boundary.test.ts#rejects invisible-control record identities across the checked batch` | `src/lib/shared/bounded-values.ts#normalizeEntityId` | **FIXED-PENDING-REREVIEW** |

The rejected Deepchandi retrieval-only finding, all earlier blocked review
verdicts, and the original-PDF, notation, OCR/corrupt-glyph, and SME-review
boundaries remain historical and unchanged.

## Acceptance-hardening review cycle 2 (incomplete input run; ten findings closed; pending rereview)

Run `20260817-p02-hardening-c2-2af0d18` reviewed the complete diff from
`beba1479f473b3413b3f2de48a27c558e1937c6f` through immutable head
`2af0d182ab0077338964432da5f75de9401f83ec`. Artifacts are under
`C:/tmp/compound-engineering/ce-code-review/20260817-p02-hardening-c2-2af0d18/`.

**This run is INCOMPLETE and is preserved as historical findings input only.**
It produced 10 of the 11 required reviewer artifacts; the required
frontend-races artifact was never produced. Fresh reviewer and validator
dispatches then failed with `402 Payment Required ... code:"deactivated_workspace"`,
so **zero** valid validator artifacts exist. The missing reviewer artifact and
the absent validator wave are missing coverage, **not** a zero-findings result,
and this run cannot count as acceptance for any finding below.

The original `gpt-5.6-luna` at MAX reviewer specification is superseded for the
same reason: that workspace is deactivated and cannot dispatch. The fresh
mandatory review uses Claude Opus 5 at high effort for every reviewer and every
validator, and satisfies the adversarial lens through the review skill's
documented in-process fallback with the peer skip reason recorded in Coverage.

The ten surviving candidate findings were each independently reproduced against
the immutable reviewed head before any fix, and each received a focused failing
regression first. Six further regressions were authorized as named coverage
gaps. All sixteen are `FIXED-PENDING-REREVIEW`.

| ID | Reproduced defect | Stable regression | Final implementation anchor | Disposition |
|---|---|---|---|---|
| `AH-C2-V01` | `QuizRunner` compared projected question IDs without canonical normalization, so ` q-1 ` and `q-1`, and NFC/NFD-equivalent IDs, survived as distinct questions and aliased each other's answer state. | `src/test/quiz-runner.test.tsx#renders a safe unavailable state for question IDs that differ only by %s` | `src/components/quiz/QuizRunner.tsx#canonicalQuestionIds` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-V02` | `getSourceCorpusInventory()` read the evaluation state without checking `context.safe`, returning ordinary-looking counts for a malformed source-document, page-quality, or disposition registry. | `src/test/sources-page.test.tsx#renders an honest unavailable state for %s` | `src/lib/data/publication-policy.ts#getSourceCorpusInventory` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-V03` | Source listing, direct lookup, transparency validation, and public-collection validation used bare `trim()` or raw `===` instead of the canonical entity-ID normalizer, so identities behaved differently per surface. | `src/test/source-metadata-consistency.test.ts#canonical source identity parity` | `src/lib/data/repository.ts#matchesRecordId` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-V04` | The public validator required direct `sourceEvidence.supportable` for a Quiz, but the Quiz container decision deliberately evaluates an absent reference, so every valid aggregate Quiz failed validation. | `src/test/content-validator.test.ts#accepts a valid aggregate Quiz that carries no direct source reference` | `src/lib/data/publication-audit.ts#quizAggregateEvidenceIssues` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-V05` | `EarTrainingModule` invoked the playback cancellation ref directly and never cleared it, so a throwing cancel escaped the unmount effect and stranded the handle. | `src/test/swara-consumers.test.tsx#"continues EarTraining cleanup after Next, replacement, and unmount cancellations throw"` | `src/components/audio/EarTrainingModule.tsx#cancelPlayback` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-V06` | Lesson, Raga, and Instrument detail routes cancelled handles and cleared timers sequentially without isolation, so one throwing cancellation skipped every later timer and handle. | `src/test/swara-consumers.test.tsx#clears every remaining instrument timer when an owned Tabla cancellation throws` | `src/lib/audio/cleanup.ts#releaseHandleSet` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-V07` | `expandTablaBol()` indexed a plain object, so `__proto__` resolved to `Object.prototype` and `constructor` to `Object`; `??` never fired and `planTablaBol()` threw. | `src/test/tabla-plan-schedule.test.ts#fails closed for the prototype-key Tabla bol %s without throwing` | `src/lib/audio/tabla.ts#COMPOUND_BOL_CELLS` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-V08` | Publication gating checked only `talas[].talaId` uniqueness while the forensic validator additionally checked policy, required fields, the issue catalog and its ledger resolution, row shape, and the status domain, so an incomplete registry looked verified to publication. | ``src/test/tala-disposition-registry.test.ts#makes the evaluation context unsafe for a verified-looking registry with %s`` | `src/lib/evidence/disposition-registry.ts#inspectDispositionRegistry` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-V09` | Over-depth, over-node, cycle, sparse, and shared-DAG coverage reached the graph inspector but not the checked batch, repository list, direct lookup, search, or publication summary. | `src/test/graph-boundary.test.ts#traverses %s alone but fails the combined catalog closed without throwing` | `src/test/graph-boundary.test.ts#expectBoundedFailClosed` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-V10` | Freshness coverage mutated page quality only; no test mutated source-document `reviewStatus` or `pageCount`, so those gates were never exercised through the six consumers. | `src/test/source-document-freshness.test.ts#refreshes every consumer when only the source-document reviewStatus changes` | `src/test/source-document-freshness.test.ts#readEveryConsumer` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-R01` | Microphone cleanup lacked proof that a throwing `stream.getTracks()` still releases the frame, graph node, and context. | `src/test/pitch.test.ts#"releases an active session when stream.getTracks() throws on stop"` | `src/lib/audio/pitch.ts#stopStream` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-R02` | A timer API that fires its callback during registration had no regression proving playback ownership cannot be stranded. | `src/test/tabla-plan-schedule.test.ts#cannot strand Tabla playback ownership when a timer callback registers synchronously` | `src/lib/audio/tabla.ts#scheduleTablaPlan` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-R03` | Quarantine coverage relied on counts rather than the exact eight Tala IDs across every public surface. | `src/test/graph-boundary.test.ts#withholds %s from every public surface` | `src/test/graph-boundary.test.ts#withholds %s from every public surface` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-R04` | The source-inventory unavailable UI had no rendering coverage. | `src/test/sources-page.test.tsx#renders the extracted-corpus counts while the corpus is certifiable` | `src/app/sources/page.tsx#SourcesCatalogPage` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-R05` | Failure-atomic audio cleanup was reimplemented per consumer with no shared, directly tested mechanism. | `src/test/audio-cleanup.test.ts#cancels every owned handle even when an earlier cancellation throws` | `src/lib/audio/cleanup.ts#runIsolatedCleanup` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-R06` | A CMS mutation inside the summary-freshness test permanently rebound the repository to a detached lesson clone, so any later in-place freshness assertion in that file would pass vacuously. | `src/test/review-closeout.test.ts#recomputes publication summaries from current inputs without memoized identity` | `src/test/review-closeout.test.ts#"recomputes publication summaries from current inputs without memoized identity"` | **FIXED-PENDING-REREVIEW** |

Local verification on this implementation: `npm run test` 18 files / 546 tests
passed, `npm run type-check` passed, `npm run lint` passed, `npm run build`
passed, `git diff --check` passed, and the forensic/source/publication JSON
consistency suites passed. Local functionality is not review acceptance.

All eight Talas remain whole-entity quarantined. No musical fact, publisher,
year, location, licence, organization, reviewer, review date, or publication
state is invented or promoted. The rejected Deepchandi retrieval-only finding,
every earlier blocked run ID and verdict, and the original-PDF, diagram,
notation, corrupt-glyph, and SME-review boundaries remain historical and
unchanged.

## Acceptance-hardening review cycle 3 (53 raw findings; pending rereview)

Run `20260818-093434-87f5fe73` reviewed the complete diff from
`beba1479f473b3413b3f2de48a27c558e1937c6f` through immutable head
`a0c87a2276e3df9e66f701834b6f337e277aa8e3`. Artifacts are under
`C:/Users/Rajantha/AppData/Local/Temp/compound-engineering-197609/ce-code-review/20260818-093434-87f5fe73/`.
All eleven reviewers completed; no validator wave was dispatched (findings input
only). The 53 raw findings comprised 1 P0, 15 P1, 25 P2, and 11 P3. After
deduplication, 31 validated unique findings remain.

This implementation addresses all validated findings:

- **P0** `AH-C3-P0-01` – restored unknown provenance in `getSources()` with
  non-circular regression (`src/test/source-metadata-consistency.test.ts#"exposes only unknown/unverified provenance on public source rows (non-circular)"`).
- **P1** `AH-C3-P1-01` – made quiz/glossary validation production-reachable via
  admin boundary map and `validateMusicalCoreFieldDispositions` wiring
  (`src/app/admin/page.tsx#boundaryReport`).
- **P1** `AH-C3-P1-02` – removed vacuous `field === "record"` fallbacks and
  deleted duplicate quiz aggregate branches (`src/test/content-validator.test.ts`).
- **P1** `AH-C3-P1-03` – closed prototype-key via `ReadonlyMap` for
  `DEPENDENCY_FIELD_RULES` and null-proto state in `QuizRunner`
  (`src/lib/data/dependency-rules.ts#DEPENDENCY_FIELD_RULES`,
  `src/components/quiz/QuizRunner.tsx#getUsableQuiz`).
- **P1** `AH-C3-P1-04` – added `finally` for publication stack and canonical
  `normalizeRecordId` for `isKnownQuarantinedEntityId`.
- **P1** `AH-C3-P1-05` – unified Quiz parent resolution from evaluation context
  (`src/lib/data/publication-audit.ts#quizAggregateEvidenceIssues`).
- **P1** `AH-C3-P1-06` – bounded `AudioContext.resume()` via shared helper
  `src/lib/audio/context.ts#resumeAudioContext` (applied to synth, tabla,
  tanpura) with fake-timer regressions.
- **P1** `AH-C3-P1-07` – stopped CMS review-metadata fabrication
  (`src/lib/data/repository.ts#updateLessonStatus`).
- **P1/P2** structural – deduplicated `normalizeRecordId`, `isDenseArray`,
  renamed `hasExactEvidence` pair, removed dead `sanitizePublicRecord` import,
  fixed SwaraKeyboard timer isolation and aerophone term, and classified
  >1000-line file and layering inversions as accepted residual per plan.

All eight Talas remain whole-entity quarantined. No new musical fact,
publisher, year, location, licence, organization, reviewer, review date, or
publication state is invented. Original-PDF, diagram, notation, OCR, and SME
boundaries remain unchanged. Disposition: **FIXED-PENDING-REREVIEW**.

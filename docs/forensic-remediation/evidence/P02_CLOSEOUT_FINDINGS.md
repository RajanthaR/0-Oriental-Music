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
| `C3-01`, `C3-04`–`C3-08` | Publication status drift, hostile batches, decision/projection TOCTOU, duplicate IDs, mismatched kinds, and stale identity catalogs. | Per-operation bounded snapshots, checked batches, complete kind contracts, and allowlisted projections fail closed. Summary and repository consumers use fresh decisions. | `src/lib/data/publication-policy.ts:284`, `src/lib/data/publication-policy.ts:1214`, `src/lib/validation/content-contracts.ts:787`, `src/lib/validation/content-contracts.ts:968`. |
| `C3-02`, `C3-03` | Summary caching ignored evidence changes and source views exposed unsupported provenance. | Summary memoization is removed. Public source fields share the unknown/unverified representation. | `src/lib/data/repository.ts:445`, `src/test/review-closeout.test.ts:100`, `src/test/source-metadata-consistency.test.ts:17`. |
| `C3-09`, `C3-10`, `C3-12` | Malformed Tala dispositions or selected-source rows could throw, and duplicate extracted-document mappings passed. | Forensic inputs are snapshotted as unknown data; malformed rows produce structured issues and exactly one document mapping is required. | `src/lib/validation/content-validator.ts:224`, `src/lib/validation/content-validator.ts:327`, `src/test/source-metadata-consistency.test.ts:78`. |
| `C3-11` | Dependency and graph coverage was incomplete. | One declarative field matrix classifies blocking playable/prerequisite/path/quiz references and nonblocking recommendation links; bounded graph rules apply at every decision boundary. | `src/lib/data/publication-policy.ts:182`, `src/lib/data/publication-policy.ts:837`, `src/test/publication-containment.test.ts:36`. |
| `C3-13` | Correction-log final line anchors were stale. | Final anchors are refreshed after implementation/review stabilization and checked by the closeout test. | `src/test/review-closeout.test.ts:39`. |
| `C3-14`, `C3-15` | Renderable questions retained forensic fields and an empty quiz crashed. | Explicit renderable variants exclude audio/notation payloads; public projection strips extras; QuizRunner returns a supportive Sinhala unavailable state without recording an attempt. | `src/types/content.ts:382`, `src/components/quiz/QuizRunner.tsx:35`, `src/components/quiz/QuizRunner.tsx:75`, `src/test/review-closeout.test.ts:142`. |
| `C3-16` | Repository/search boundaries threw on malformed runtime queries. | Omitted/blank strings keep featured behavior; other nonstrings and nonblank normalized-empty controls return no results. | `src/lib/search/search-engine.ts:84`, `src/lib/search/search-engine.ts:113`, `src/test/search-engine.test.ts:109`. |
| `C3-17`–`C3-20` | Rhythm callback identity reset sessions, completed handles accumulated, stale unavailable callbacks escaped, and delayed Tabla failures left timers. | Generation-owned sessions, settled-handle removal, mounted/current-owner callback guards, and failure-atomic timer cancellation close the lifecycle. | `src/components/audio/RhythmTapGame.tsx:14`, `src/components/audio/TalaVisualizer.tsx:23`, `src/lib/audio/tabla.ts:46`, `src/test/components.test.tsx:726`, `src/test/components.test.tsx:748`, `src/test/synth.test.ts:96`. |
| `P02-PITCH-OWNERSHIP-001` | Partial or stale microphone starts could retain MediaStreams, AudioContexts, nodes, animation frames, or callbacks. | Latest-generation ownership and idempotent cleanup stop late streams and reclaim every partial resource; audio remains local-only. | `src/lib/audio/pitch.ts:33`, `src/lib/audio/pitch.ts:114`, `src/lib/audio/pitch.ts:220`, `src/test/pitch.test.ts:40`, `src/test/pitch.test.ts:93`. |
| `P02-PROJECT-SCOPE-001` | Contributor guidance still described the product as public Grades 6–13/A/L and claimed a fixed canonical-source count. | Guidance now states the verified Grades 6–11 public boundary, raw quarantine for 12–13/A/L, no inferred count, and CMS stages as capability rather than completed-review evidence. | `AGENTS.md:3`, `AGENTS.md:37`, `AGENTS.md:182`, `src/test/review-closeout.test.ts:39`. |

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
| `P02-FINAL-05` | P3 | Nonblank bidi/zero-width input normalized to empty and matched every public field through `includes("")`. | Featured results remain only for genuinely empty/whitespace input; normalized-empty nonblank input returns no results. | `src/test/search-engine.test.ts:79` |
| `P02-FINAL-06` | P2 | Swara sequence playback continued after component unmount. | Caller-owned tone/sequence handles cancel initialization, active nodes, delays, callbacks, replacement, Strict Mode, and unmount work; Promise APIs remain compatibility wrappers. | `src/test/synth.test.ts:199`, `src/test/synth.test.ts:293`, `src/test/components.test.tsx:413`, `src/test/components.test.tsx:570`, `src/test/components.test.tsx:604` |

The rejected Deepchandi finding, all earlier run IDs and blocked verdicts, and
the original-PDF/notation/OCR/SME limitations above remain unchanged. The
controlling fresh task is
`docs/plans/2026-08-16-002-fix-phase-2-final-contract-closeout-plan.md`.

# Phase 2 closeout finding matrix

This matrix closes the sixteen independently validated findings from review run
`20260815-235819-p02r4`. That run is preserved as blocked historical evidence;
it is not acceptance evidence for this closeout. The controlling closeout plan
is `docs/plans/2026-08-16-001-fix-phase-2-pr-merge-ready-plan.md`.

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
transition assertions, disposition issue-ID referential integrity, and the
runtime canonical-shape gate. The separate RhythmTapGame completion-timer
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

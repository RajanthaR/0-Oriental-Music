# Phase 2 closeout finding matrix

This matrix closes the sixteen independently validated findings from review run
`20260815-235819-p02r4`. That run is preserved as blocked historical evidence;
it is not acceptance evidence for this closeout. The controlling closeout plan
is `docs/plans/2026-08-16-001-fix-phase-2-pr-merge-ready-plan.md`.

The closeout uses the authorized whole-entity quarantine decision. A tala is
not public or playable when a required learner-visible context, theka, or bol
field is absent, ambiguous, or marked `needs-review`. Raw records and their
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
| 02 | Secondary context policy diverged from primary eligibility and accepted malformed or wrong-grade context. | Context claims are composed into the same fail-closed publication decision; malformed, unpaired, wrong-grade, and review-required context quarantines the parent. | `src/test/publication-containment.test.ts`: context mutation matrix and Lawani whole-record containment. |
| 03 | Null catalog entries crashed identity validation. | Runtime guards emit structural issues and skip dependent checks. | `src/test/content-validator.test.ts`: null, primitive, and malformed catalog inputs never throw. |
| 04 | Source manifest and bibliography retained unsupported metadata and syllabus claims. | Selected catalogs now use explicit unknown metadata and no unsupported Bhairav claim; cross-catalog consistency is checked. | `src/test/source-metadata-consistency.test.ts` and forensic inventory checks. |
| 05 | Ledger header claimed Prompt 1 and an obsolete current checkout SHA. | Historical baseline and audited-through phase/base are separate; no stored current-checkout assertion remains. | Ledger header contract in `src/test/source-metadata-consistency.test.ts`. |
| 06 | Unicode/confusable and malformed PDF locators bypassed exact-document checks. | Locator parser is fully consumed, rejects format controls/confusables, extra filenames, malformed pages, and trailing page clauses. | `src/test/publication-containment.test.ts`: locator rejection matrix plus accepted exact forms. |
| 07 | Missing canonical grade scope was inferred from source metadata or a parent lesson. | Only declared grade fields are accepted; missing scope returns `missing-grade-scope`. | `src/test/publication-containment.test.ts`: Bilawal and nested question grade deletion. |
| 08 | `Quiz.lessonId` was optional in TypeScript but mandatory at runtime. | `Quiz.lessonId` is required and runtime publication rejects missing parent identity. | `src/test/content-validator.test.ts` and quiz mutation in publication tests. |
| 09 | Tala aliases were optional and canonical/same-record duplicates passed. | Every raw tala has an alias array; canonical-as-alias, repeated aliases, and normalized cross-record collisions fail. | `src/test/content-validator.test.ts`: alias mutation matrix. |
| 11 | Circular TalaVisualizer coordinates differed at hydration. | Coordinates are rounded to deterministic serialized values. | `src/test/components.test.tsx` coordinate serialization test and browser console QA. |
| 12 | Public tala directory framed Lawani as generically North Indian. | Lawani is quarantined while its required school-system context source remains `Review Required`; directory copy is neutral. | `src/test/publication-containment.test.ts` and tala route/browser QA. |
| 13 | Normalized public tala bol cells exceeded readable extracted evidence. | Closed-world field registry marks unsupported rows `needs-review`; whole tala and reverse dependents are unavailable. | `src/test/publication-containment.test.ts` disposition/dependency parity tests. |
| 14 | Acoustics prose added Hz/Hertz, directional rules, and flute/violin claims. | Public copy is limited to vibration count per second, non-directional source-listed factors, and general waveform recognition. | `src/test/musical-core.test.ts` public serialized-content assertions. |
| 15 | Teental/Jhaptal canonical spellings drifted from accepted Grade 10 extraction. | Accepted Grade 10 forms remain canonical; review-required forms are retrieval-only and not aliases. | `src/test/search-engine.test.ts` canonical/retrieval-only spelling assertions. |
| 16 | Bilawal added an unsupported basic-thaat-raga classification. | Unsupported classification removed; all-Shuddha characteristic remains bounded to the accepted source. | `src/test/musical-core.test.ts` Bilawal wording assertion. |
| 17 | Empty avarohana, invalid sample phrases, and same-record aliases were not validated. | Raga traversal/sample phrase and complete identity contracts are validated over unknown input. | `src/test/content-validator.test.ts` raga and alias mutation tests. |

## Rejected finding retained

Finding 10 (`validator-10-deepchandi-variant.json`) was rejected as framed in
`p02r4`: the Grade 11 spelling is retained as an explicitly retrieval-only
mapping and does not become a verified canonical alias. The retrieval behavior
has a positive regression in `src/test/search-engine.test.ts`.

## Quarantine boundary

The raw tala field registry in `data/musical-core-field-dispositions.json`
enumerates the required context, theka, and every bol cell. Only `tala-khemta`
has all required playable fields `verified` in the supplied extraction. Dadra,
Keherwa, Teental, Jhaptal, Deepchandi, Lawani, and Roopak remain raw/auditable
but are not public or playable until the relevant evidence is re-reviewed.
This is an evidence boundary, not a claim that the underlying musical forms do
not exist.

## Review-cycle boundary

The closeout receives a fresh maximum of three full review-fix cycles against
the original Phase 2 base. Each accepting run must preserve its run ID and
artifacts under `/tmp/compound-engineering/ce-code-review/`, cover the complete
diff, validate surviving findings independently, and report its final reviewed
head. No post-review repository mutation is acceptance evidence.

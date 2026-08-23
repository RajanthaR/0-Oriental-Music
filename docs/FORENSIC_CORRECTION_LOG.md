# Prompt 1 forensic correction log

This log records containment changes, not musical corrections. A `contained` entry means the previous public claim is no longer discoverable through the public repository or route; it does not mean the claim has been verified or corrected.

| Issue IDs | Before | Prompt 1 after | Evidence / final file lines |
|---|---|---|---|
| `P01-GRADE-SCOPE-001`, `P01-EXAM-LABEL-001` | Homepage, selectors, metadata, exam filters, and raw-by-ID lookups could expose Grade 12–13/A/L claims. | Public selectors are 6–7, 8–9, and 10–11. Unsupported grade bands and nested exam question grades are quarantined by one policy; A/L direct routes resolve to the safe not-found view. | Stable anchors: `PUBLIC_GRADE_BANDS`, `getRecordPublicationDecision`, repository exam getters, and “keeps unsupported grades” in `src/test/publication-containment.test.ts`. |
| `P01-DIRECT-ROUTE-001` | `getLessonById`, `getRagaById`, `getTalaById`, and `getExamPaperById` returned raw records. | Public-by-default list and ID methods call the typed publication policy; quarantined identifiers remain in raw data for audit but are not returned publicly. | Stable anchors: repository `selectPublic` and direct-ID getters; “contains quarantined records on direct lookup” regression. |
| `P01-RAGA-BHAIRAV-001`, `P01-RAGA-BILAWAL-001` | Named raga records were discoverable and marked Published. | Bhairav and Bilawal were stable-ID quarantined at the Prompt 1 boundary; Phase 2 later remediated Bilawal separately. | Stable anchors: `KNOWN_QUARANTINED_ENTITY_IDS`, ledger issue IDs, and raga containment regressions. |
| `P01-TALA-ROOPAK-001`, `P01-TALA-LAWANI-001`, `P01-TALA-DADRA-CITE-001` | Named tala records and the Dadra lesson could be found from lists, search, and direct routes. | Roopak, Lawani, Dadra, and the Dadra lesson are quarantined; the search index consumes contained repository collections. | Stable anchors: `KNOWN_QUARANTINED_ENTITY_IDS`, `searchIndex`, and Tala direct-route/search regressions. |
| `P01-SOUND-TERMINOLOGY-001` | Sound/nada terms and the introductory sound lesson were presented as Published. | Prompt 1 contained the named sound entities; Phase 2 later remediated only the evidenced Grade 10 subset. | Stable anchors: ledger issue `P01-SOUND-TERMINOLOGY-001` and the public acoustics mutation tests. |
| `P01-SOURCE-METADATA-001` | Source views displayed unverified publisher, year, place, licence, tier, and Verified status values. | Public source views render explicit unknown/unverified metadata and real source-document/page-quality inventory counts. | Stable anchors: repository source projection, `src/app/sources/page.tsx`, and `src/test/source-metadata-consistency.test.ts`. |
| `P01-REVIEW-METADATA-001`, `P01-ADMIN-COUNTS-001` | 69 records claimed the same completed Published review, and Admin could show a hard-coded 100% pass claim. | Public projections replace completed-review metadata with `Needs Revision` and unknown values. Admin counters are computed from policy decisions and explicitly state that full verification is not claimed. | Stable anchors: `createUnverifiedReviewMetadata`, repository summaries, admin counter rendering, and ledger inventory validation. |
| `P01-LEARNING-PATH-001`, `P01-CURRICULUM-COVERAGE-001` | Published paths and curriculum-map counts could point at unavailable lessons and asserted unsupported coverage. | The central publication decision requires every path step to be public; summaries consume the same result. Coverage counts agree with the forensic inventory, while the legacy curriculum map is visibly marked untrusted. | Stable anchors: `collectDependencyDispositions`, repository `getLearningPaths`, coverage validation, and the dependency-summary regression. |
| `P01-IMAGE-ONLY-001`, `P01-OCR-CORRUPTION-001`, `P01-SOURCE-MAPPING-001` | Image-only, corrupt-font, and mixed/ambiguous source mappings could be treated as ordinary proof. | The ledger records D/visual/OCR and mapping limitations as needs-review; eligibility requires exact mapping, page range, and A/B readable Sinhala evidence. | Stable anchors: `evaluateSourceReference`, `docs/FORENSIC_PUBLICATION_BASELINE.md`, and the corresponding forensic-ledger issue IDs. |

## Deferred corrections from Prompt 1

The named exam, curriculum, and learning-path claims require later source-grounded comparison, Sinhala/SME review, and where applicable original-PDF/manual review. The raw identifiers and historical reconciliation records remain available for that work.

---

# Prompt 2 forensic correction log — Canonical Musical Core

This log records the source-bounded corrections and containment decisions for the Phase 2 musical core. It does not treat extracted Markdown as proof of notation layout, corrupt glyphs, diagrams, or unreadable bol cells.

The authoritative closeout decision is **Option 2: whole-entity quarantine**. If any required learner-visible or playable field is unsupported, the complete public Tala/entity is withheld while its raw audit record and field disposition remain available for later remediation. All eight Talas are currently nonpublic. Khemta retains readable page-7 context/theka/bol cells in raw audit data, but its remaining learner-visible structure/action fields have not yet been closed through the field registry. Lawani cannot be promoted until its required Sri Lankan school-system context is supportable.

Complete field-level before/after provenance is documented in [`docs/forensic-remediation/evidence/P02_MUSICAL_CORE_FIELD_MATRIX.md`](forensic-remediation/evidence/P02_MUSICAL_CORE_FIELD_MATRIX.md).

| Issue IDs | Before (Prompt 1) | Prompt 2 Remediated State | Evidence & Source Grounding |
|---|---|---|---|
| `P01-RAGA-BILAWAL-001` | Alhaiya Bilawal label, missing Ma in ascent, and Shadav–Sampurna jati. | Corrected school Bilawal is public only in the application `10-11` browse band containing evidenced Grade 11; raw review metadata remains `Needs Revision`. | Source: `SRC-G11-RAGA-ID`, `sg11_emus_ chap3_raga_handunaganimu.pdf`, PDF pp. 1–2, quality A. Final state: **PUBLIC**. Final anchors: `src/data/ragas.json#raga-bilawal`, `src/test/musical-core.test.ts#correctly models school Bilawal as all-7-Shuddha Sampurna raga`. |
| `P01-RAGA-BHAIRAV-001` | Bhairav was published as a school raga. | Not established in the accepted supplied prescribed-list evidence; the raw record is retained and all public routes/search remain contained. | `SRC-G11-RAGA-ID`, PDF pp. 1–2, quality A, lists the seven public ragas but does not establish Bhairav. Final state: **QUARANTINED**. Final anchors: `src/data/ragas.json#raga-bhairav`, `src/lib/data/publication-policy.ts#isKnownQuarantinedEntityId`, `src/test/musical-core.test.ts#verifies bounded quarantine status for out-of-scope entities`. |
| `P01-TALA-LAWANI-001` | Mixed structural/context citations and generic framing. | The Grade 10 structural record and Grade 11 school-context statement remain raw audit data. The context document is still `Review Required`, and normalized bol cells are not accepted from extraction alone, so reverse dependencies and the complete public Tala are withheld. | Structure: `SRC-EPD-TB-G10`, `sg10_emus_chap1_mulikanga.pdf`, pp. 3, 6, extraction A. Context: `SRC-EPD-TB-G11`, `s11tim173.pdf`, p. 24, page A but document triage incomplete. Final state: **NEEDS-REVIEW / WHOLE ENTITY QUARANTINED**. Final anchors: `src/data/talas.json#tala-lawani`, `data/musical-core-field-dispositions.json#tala-lawani`, `src/test/publication-containment.test.ts#requires every tala disposition row and quarantines any incomplete playable evidence`. |
| `P01-TALA-DADRA-CITE-001` | Dadra tala/lesson cited unsupported Grade 7 pages. | Exact Grade 10 page 6 locators replace the unsupported citations, but the extracted normalized bol cells require original-PDF/manual review. The raw Tala, lesson, and quiz remain auditable and are all nonpublic through reverse-dependency quarantine. | `SRC-EPD-TB-G10`, `sg10_emus_chap1_mulikanga.pdf`, p. 6, extraction A. Final state: **NEEDS-REVIEW / WHOLE DEPENDENCY QUARANTINED**. Final anchors: `src/data/talas.json#tala-dadra`, `src/data/lessons.json#les-tala-dadra`, `src/data/quizzes.json#quiz-les-tala-dadra`. |
| `P01-TALA-ROOPAK-001` | Roopak was published as Grade 10–11 curriculum. | Not established in accepted supplied Grade 6–11 tala evidence; raw record retained. | Evidence comparison remains bounded by accepted Grade 10 pp. 2–7 (A); the Grade 11 extraction is `Review Required`. Final state: **QUARANTINED**. Final anchors: `src/data/talas.json#tala-roopak`, `src/lib/data/publication-policy.ts#isKnownQuarantinedEntityId`, `src/test/musical-core.test.ts#verifies bounded quarantine status for out-of-scope entities`. |
| `P01-SOUND-TERMINOLOGY-001` | Grade 6 sound scope and eight unsupported public terms. | Grade 10 lesson and five evidenced terms are public; `term-sound`, `term-ahata-nada`, and `term-anahata-nada` remain quarantined. | `SRC-G10-NADA`, `sg10_emus_chap8_nadaya.pdf`, pp. 2–12, quality A. Final state: **PUBLIC only for evidenced claims**. Final anchors: `src/data/lessons.json#les-intro-01`, `src/data/glossary.json#term-pitch`, `src/test/musical-core.test.ts#Acoustics & Sound Terminology (Grade 10 Nada Properties)`. |
| `P02-ACOUSTICS-EVIDENCE-001` | Learner prose asserted unsupported Hz units, direction-dependent sound variation, violin/flute examples, and other extrapolations. | Public acoustics prose is limited to the source-bounded vibration count per second, string/membrane factors, and the general voice/instrument waveform distinction. Unsupported examples and directional claims are removed rather than reconstructed. | `SRC-G10-NADA`, `sg10_emus_chap8_nadaya.pdf`, pp. 2–12, A extraction. Final anchors: `src/data/lessons.json#les-intro-01`, `src/data/glossary.json#term-pitch`, `src/data/glossary.json#term-timbre`, `src/data/glossary.json#term-frequency`, `src/test/musical-core.test.ts#Acoustics & Sound Terminology (Grade 10 Nada Properties)`. |
| `P02-QUIZ-SYNC-001` | Acoustics/Dadra quizzes retained stale Grade 6/7 questions. | Every question carries an explicit grade and direct locator. The acoustics quiz may project publicly because its lesson/questions pass; the Dadra quiz remains nonpublic because its parent lesson and required Tala are quarantined. | Acoustics: `SRC-G10-NADA`, pp. 3, 4, 10–11, A. Dadra raw evidence: `SRC-EPD-TB-G10`, p. 6, A extraction. Final anchors: `src/data/quizzes.json#quiz-les-intro-01`, `src/data/quizzes.json#quiz-les-tala-dadra`, `src/test/musical-core.test.ts#publishes the acoustics quiz while retaining the Dadra quiz as quarantined raw audit data`. |
| `P02-LOCATOR-POLICY-001` | Counterfeit/multiple PDF names, filename digits, invalid ranges, or mixed-quality pages could pass. | Exact one-document identity, explicit page clauses, full range checks, and all-pages A/B+Sinhala readability now fail closed, including whitespace/comma/slash/parenthesis/newline second-PDF forms. | Source evidence: **N/A — runtime publication invariant**. Final anchors: `src/lib/data/publication-policy.ts#parseSourceLocator`, `src/lib/data/source-evidence-policy.ts#hasReadablePages`, `src/test/publication-containment.test.ts#rejects strict locator confusables`. |
| `P02-GRADE-EVIDENCE-001` | Core claims were advertised across grades not established by their selected source, and missing canonical grades could be inferred from parents, child questions, or sources. | Public projection uses only a record/question's own explicit canonical browse band; individual grade tokens, mixed runtime arrays, and fallback inference are rejected. Seven ragas use exact Grade 11 evidence, and the acoustics lesson/quiz/five terms use exact Grade 10 evidence. Khemta's Grade 10 locator remains raw audit evidence, not a public Tala. `10-11` is a browse bucket, not proof of both grades. | Final state: **PUBLIC only under the selected-source grade contract**. Final anchors: `src/lib/data/publication-policy.ts#gradeScopeMatchesSource`, `src/lib/data/publication-policy.ts#source-grade every check`, `src/test/publication-containment.test.ts#requires each public grade band to contain a grade established by its source`. |
| `P02-TALA-STRUCTURE-001`, `P02-TALA-BOL-EVIDENCE-*` | Keherwa/Lawani cell drift, six-matra Khemta, unsupported spellings, and normalized bol cells were treated as public facts. | Khemta retains four readable compound cells as raw audit data. Because vibhag structure, hand actions, bol flags, and practice configuration were not all bound by the closed-world evidence registry, Khemta now also fails closed. Grade 10 names `ත්‍රිතාල් තාලය` and `ජප් තාලය` are retained with editorial retrieval aliases; `දීප්චන්දි` remains retrieval-only. | `SRC-EPD-TB-G10`, pp. 2–7, A text extraction with visual limits. Final state: **ALL EIGHT TALAS WHOLE-ENTITY QUARANTINED**. Final anchors: `src/lib/data/publication-policy.ts#isKnownQuarantinedEntityId`, `data/musical-core-field-dispositions.json#tala-khemta`, `src/test/musical-core.test.ts#quarantines every Tala until every required learner-visible structure field is dispositioned`. |
| `P02-RAGA-FIELDS-001` | Unsupported rasa/history/phrases, lower-grade claims, and incorrect Yaman/Bhimpalasi fields. | Absent claims withheld; seven source fields and one mukhyanga per raga are public; Bhairav remains quarantined. | `SRC-G11-RAGA-ID`, pp. 1–2, quality A. Final state: **PUBLIC only in browse band containing Grade 11**. Final anchors: `src/data/ragas.json#raga-bilawal`, `src/lib/data/publication-policy.ts#gradeScopeMatchesSource`, `src/test/musical-core.test.ts#correctly models school Bilawal as all-7-Shuddha Sampurna raga`. |
| `P02-QUIZ-POLICY-001` | Public parent alone could expose unsupported nested questions. | Aggregate decision requires a public parent, non-empty questions, explicit canonical grades/direct evidence, a supported runtime discriminator and answer shape, and a public decision for every question. | Source evidence: **N/A — implementation invariant**. Final anchors: `src/lib/data/publication-policy.ts#getQuizContainerPublicationDecision`, `src/lib/data/publication-policy.ts#collectDependencyDispositions`, `src/test/quiz-runner.test.tsx#duplicate question IDs`, `src/test/publication-containment.test.ts#unsupported nested question`. |
| `P02-AUDIO-OWNERSHIP-001` | Start immediately cancelled its own handle, global cancellation allowed unrelated visualizers to stop one another, invalid BPM could create hot loops, and Web Audio failures escaped. | Each visualizer owns one active cancellation handle. Start preserves its first compound stroke; tick replaces only that handle; Stop, Reset, audio-off, BPM/tala replacement, and unmount cancel it. BPM is bounded to 40–240, the rhythm terminal timer is single-shot, and missing/throwing Web Audio returns localized unavailable feedback without blocking the visual/text experience. | Raw Khemta cells: `SRC-EPD-TB-G10`, p. 7, A. Scheduling/timing/error handling: **N/A — application invariant**. Final anchors: `src/components/audio/TalaVisualizer.tsx#TalaVisualizer`, `src/components/audio/RhythmTapGame.tsx#RhythmTapGame`, `src/lib/audio/tempo.ts#normalizePracticeBpm`, `src/test/components.test.tsx#keeps each TalaVisualizer playback handle owned by its lifecycle`, `src/test/components.test.tsx#cancels playback on Reset, tala change, and unmount`, `src/test/components.test.tsx#co-mounted TalaVisualizer isolation`, `src/test/synth.test.ts#bounds hostile BPM values without creating hot loops`. |
| `P02-STATIC-QUARANTINE-001` | Static EarTraining and search suggestions bypassed repository containment with Bhairav/Roopak and later reduced-set Tala names. | Bhairav, Roopak, Dadra, Lawani, and Khemta are absent from static public suggestions/exercises; hostile search keys and serialized public collections are regression-locked. | Source evidence: **N/A — application containment invariant**. Final anchors: `src/components/audio/EarTrainingModule.tsx#EarTrainingModule`, `src/app/search/page.tsx#SearchPage`, `src/test/search-engine.test.ts#should not discover quarantined Bhairav or Roopak claims`, `src/test/components.test.tsx#static public UI quarantine regression`. |
| `P01-SOURCE-METADATA-001` | Selected sources asserted unsupported publisher/year/place/licence/status values, and catalogs disagreed. | Runtime, manifest, Markdown, and human-source rows retain exact IDs/filenames/grades and explicit unknown/unverified metadata. A cross-catalog mutation suite rejects publisher, year, location, licence, tier, URL, and topic drift. | Evidence class: **N/A — metadata inventory**. Final anchors: `src/data/sources.json#SRC-EPD-TB-G10`, `data/source-manifest.json#SRC-EPD-TB-G10`, `SOURCES.md:48`, `src/test/source-metadata-consistency.test.ts#validateSelectedSourceMetadata`. |
| `P02-TALA-VALIDATION-001` | Validators missed null/malformed tala fields, exact vibhag membership, blank/fallback bols, unsafe practice tempos, and search-equivalent identities. | Runtime structural guards and negative mutations fail closed; shared search normalization covers Tala, glossary, and terminology identity surfaces; practice tempos must be finite 40–240 BPM. | Source evidence: **N/A — implementation invariant**. Final anchors: `src/lib/validation/content-contracts.ts#nestedProjectionKind`, `src/lib/validation/content-validator.ts#validateSelectedSourceMetadata`, `src/test/content-validator.test.ts#rejects malformed tala fields`, `src/test/content-validator.test.ts#rejects Tala and terminology identity mutation matrices`. |

### Evidence & Extraction Limitations
1. **Extracted Markdown vs Original PDF**: Text extracted with pdftotext/OCR represents our working evidence layer, but complex musical notation diagrams, Sri Lankan folk drumming layout, and diacritic placement remain subject to final original-PDF / SME review before commercial certification.
2. **Reviewer Provenance**: Internal implementation agent comparisons do not constitute formal government or SME educational approvals. All raw records strictly retain explicit unverified metadata (`Needs Revision` / `නොදනී / සනාථ වී නැත`).

## Phase 2 final-contract closeout

The following six application findings were independently validated in
`20260816-063000-p02-final-acceptance`. They are implementation-contract
findings, not new musical or source claims. The implementation dispositions
remain subject to the fresh mandatory review against the original Phase 2 base;
they must not be described as accepted until that skill verdict is
`Ready to merge` with zero actionable findings.

| Issue ID | Validated runtime defect | Implementation disposition | Stable semantic anchors |
|---|---|---|---|
| `P02-FINAL-01` | Missing Lesson `reviewMetadata` could be public and crash a detail route. | Require complete raw metadata; fail malformed input closed; synthesize safe unverified metadata only in bounded projections. | `src/lib/validation/content-contracts.ts#isReviewMetadata`; test `rejects both CMS publication entry points when raw metadata is synthesized or incomplete` |
| `P02-FINAL-02` | Invalid nonblank finite-domain values bypassed partial guards. | Central finite-union membership covers record and nested fields before publication. | `src/lib/validation/content-contracts.ts#DIFFICULTY_LEVELS`; test `rejects unsupported finite-domain values across every known entity contract` |
| `P02-FINAL-03` | Known dormant entity guards omitted required fields and nested shapes. | Closed kind identification plus complete contracts govern validation, publication, repository reads, and projections. | `src/lib/validation/content-contracts.ts#KIND_SIGNATURES`; test `validates every imported catalog record, nested question, and allowlisted projection` |
| `P02-FINAL-04` | Recursive graph handling overflowed on deep acyclic input. | Iterative traversal and projection enforce depth 256 and 10,000 unique-node limits; shared DAGs pass and cycles/overruns fail closed. | `src/lib/validation/content-contracts.ts#inspectGraph`; test `accepts shared DAGs but rejects cycles and graph budget overruns` |
| `P02-FINAL-05` | Normalized-empty hostile search input enumerated the public catalog. | Preserve raw-empty featured results; return no result for nonblank normalized-empty input. | `src/lib/search/search-engine.ts#classifySearchQuery`, `src/lib/search/search-engine.ts#SearchIndex`, `src/test/search-engine.test.ts#normalized-empty controls` |
| `P02-FINAL-06` | Swara work continued after replacement or unmount. | Caller-owned handles cancel initialization, active oscillators, sequence delays, callbacks, Strict Mode and co-mounted consumer work. | `src/lib/audio/synth.ts#SwaraPlaybackHandle`; tests `cancels owned Swara tone and scale work` and `retains ready Swara ownership until finished` |

All eight Talas remain whole-entity quarantined. Earlier review runs, the
rejected Deepchandi finding, and the original-PDF, diagram, notation,
corrupt-glyph, and SME-review boundaries remain preserved in the closeout and
field matrices.

## Phase 2 acceptance hardening

Run `20260816-191000-p02-final-contract-c3` remains a blocked historical review
of head `4c8ab9755d20d4d23cc8081fe831f448b15f3a2e`; its twenty validated findings
are not relabeled as acceptance. The fresh task is governed by
`docs/plans/2026-08-16-003-fix-phase-2-acceptance-hardening-plan.md`.

| Issue group | Before | Acceptance-hardening state | Final anchors |
|---|---|---|---|
| `C3-01`–`C3-08` | Status, identity, evidence, summary, batch, and projection decisions could diverge or reread mutable values. | One bounded operation context, checked batch, complete kind contract, fresh summary, and allowlisted projection fail closed. | `src/lib/data/publication-policy.ts#createPublicationEvaluationContext`, `src/lib/data/publication-policy.ts#evaluatePublicationBatch`, `src/lib/data/repository.ts#getPublicationSummary`, `src/lib/validation/content-contracts.ts#projectPublicRecord`. |
| `C3-09`–`C3-12` | Hostile disposition/source rows and incomplete dependency coverage could throw or fail open. | Unknown-safe source/disposition snapshots, exactly-one document mapping, and one declarative dependency matrix govern all surfaces. | `src/lib/validation/content-validator.ts#validateSelectedSourceMetadata`, `src/lib/validation/content-validator.ts#validateMusicalCoreFieldDispositions`, `src/lib/data/publication-policy.ts#DEPENDENCY_FIELD_RULES`. |
| `C3-13` | Prior numeric documentation anchors drifted. | Closeout documentation is asserted by stable symbols and refreshed final line anchors after review fixes. | `src/test/review-closeout.test.ts (resolves current musical-core anchors by symbol and heading)`, `docs/FORENSIC_CORRECTION_LOG.md#P02-FINAL-06`. |
| `C3-14`–`C3-16` | Forensic question fields leaked into the renderable model, empty quizzes crashed, and hostile queries threw/enumerated results. | Explicit public question variants, a safe Sinhala empty state, and uniform query classification close the UI boundaries. | `src/types/content.ts#RenderableQuestionType`, `src/components/quiz/QuizRunner.tsx#getUsableQuiz`, `src/lib/search/search-engine.ts#classifySearchQuery`, `src/test/search-engine.test.ts#normalized-empty controls`. |
| `C3-17`–`C3-20` | Rhythm/Tabla work was not consistently session-owned or failure-atomic. | Current-generation callbacks, settled-handle removal, and timer cancellation isolate every caller. | `src/components/audio/RhythmTapGame.tsx#RhythmTapGame`, `src/components/audio/TalaVisualizer.tsx#TalaVisualizer`, `src/lib/audio/tabla.ts#scheduleTablaPlan`, `src/test/synth.test.ts#keeps unknown and compound Tabla bols on the closed compound lookup`. |
| `P02-PITCH-OWNERSHIP-001` | Failed, replaced, pending, or unmounted microphone starts could retain resources or callbacks. | Generation ownership stops late streams and idempotently releases tracks, nodes, frames, and contexts with no network/upload path. | `src/lib/audio/pitch.ts#startListening`, `src/lib/audio/pitch.ts#stopListening`, `src/test/pitch.test.ts#late stream cleanup`, `src/test/pitch.test.ts#newest pending start`. |
| `P02-PROJECT-SCOPE-001` | Contributor guidance contradicted the forensic Grades 6–11 public boundary and implied a fixed verified source count. | Guidance now distinguishes current public scope, raw quarantined records, and workflow capability from proof of completed review. | `AGENTS.md#current verified public curriculum boundary`, `AGENTS.md#raw Grade 12–13/A/L quarantine`, `AGENTS.md#CMS review capability boundary`, `src/test/review-closeout.test.ts (records acceptance-hardening scope)`. |

## Acceptance-hardening cycle 1 traceability (append-only)

Run `20260816-161455-p02-acceptance-c1-4e350894` is retained as historical
acceptance-only evidence for reviewed head
`b1b2f5ea949d274fa5e260f39f0554465f704072` (base
`beba1479f473b3413b3f2de48a27c558e1937c6f`). Its artifacts are under
`C:/tmp/compound-engineering/ce-code-review/20260816-161455-p02-acceptance-c1-4e350894/`.
Eleven reviewers completed; the validator wave completed 24 validators, with
23 validated and 1 rejected. There were no validator infrastructure failures
and no degraded P0/P1 evidence. The rejected validator,
`validator-05-closeout-plan-reference.json`, is a historical dual-plan
reference: plan 002 remains the controlling pointer for the earlier
final-contract section, while plan 003 governs this acceptance-hardening
input. No historical verdict or plan pointer is rewritten.

The complete 23-row finding/disposition traceability is appended to
[`P02_CLOSEOUT_FINDINGS.md`](forensic-remediation/evidence/P02_CLOSEOUT_FINDINGS.md)
and mirrored in `data/forensic-ledger.json`. The dispositions are uniformly
`FIXED-PENDING-REREVIEW`; they do not claim final acceptance, push readiness,
or a ready PR. The code/test/search anchors are line-qualified in the closeout
matrix and must be refreshed again if a later review-fix commit moves them.

| Cycle-1 evidence boundary | Disposition |
|---|---|
| Fixed-count curriculum wording (`validator-12-curriculum-fixed-count.json`) | **FIXED-PENDING-REREVIEW** — `docs/CURRICULUM_MAP.md` now describes an extracted inventory and bounded source-backed 6–11 public scope without a fixed document count or completeness claim. |
| Runtime, CMS, batch, QuizRunner, dependency, projection, context, microphone, and sanitizer findings (`validator-01`, `02`, `03`, `04`, `06`–`18`, `20`–`24`) | **FIXED-PENDING-REREVIEW** — see the exact per-finding symbols, paths, and line-qualified non-acceptance dispositions in the closeout matrix and ledger. |
| Search anchor finding (`validator-19-stale-search-anchor.json`) | **FIXED-PENDING-REREVIEW** — the normalized-empty guard and regression anchors are refreshed in the closeout matrix. |
| Rejected Deepchandi retrieval finding and earlier blocked runs | **PRESERVED HISTORICAL EVIDENCE** — no musical fact, Tala, raga, or prior verdict is promoted or rewritten. |

## Acceptance-hardening cycle 2 traceability (V15/V23 only; pending rereview)

Run `20260816-200203-p02-acceptance-c2-8f89f6b1` is retained as blocked
historical acceptance-only evidence for reviewed head
`5b3d2fac41b6b53c3747cb60ec7cc7a316eacd86` against base
`beba1479f473b3413b3f2de48a27c558e1937c6f`. The artifact directory is
`C:/tmp/compound-engineering/ce-code-review/20260816-200203-p02-acceptance-c2-8f89f6b1/`.
Eleven reviewers completed; 24 validator attempts yielded 20 validated and
four rejected attempts, with no validator infrastructure failure or degraded
P0/P1 evidence. Only V15 and V23 are addressed here; both remain
`FIXED-PENDING-REREVIEW`, not acceptance evidence.

| Finding | Scoped correction | Current semantic anchors | Disposition |
|---|---|---|---|
| `V15` | Replace blank/unrelated numeric anchors with current symbols/headings and make the closeout assertion semantic. | `src/test/musical-core.test.ts#verifies bounded quarantine status for out-of-scope entities`; `src/lib/data/publication-policy.ts#gradeScopeMatchesSource`; `src/test/publication-containment.test.ts#requires each public grade band to contain a grade established by its source`; `src/test/components.test.tsx#retains ready Swara ownership until finished`; `src/test/search-engine.test.ts#should not discover quarantined Bhairav or Roopak claims`. | **FIXED-PENDING-REREVIEW** |
| `V23` | Require exact C3-01–C3-20 plus authorized P02 IDs and every test/fix/anchor/disposition mapping against the historical tables and ledger. | `src/test/review-closeout.test.ts (resolves current musical-core anchors by symbol and heading)`; `data/forensic-ledger.json (acceptanceHardeningInput.traceability)`. | **FIXED-PENDING-REREVIEW** |

The cycle-2 run remains findings input only. Earlier blocked run IDs, the
rejected Deepchandi retrieval-only disposition, all Tala quarantine decisions,
and the original-PDF/notation/OCR/SME review boundaries are preserved; no push,
ready PR, merge, deployment, or musical-claim promotion is implied.

## Acceptance-hardening cycle 3 validated corrections

Run `20260817-033648-p02-acceptance-c3-1ebef39b` reviewed immutable head
`1f67f50f919a63ec5ccb007ab563ce410b94621f` against the original Phase 2 base.
All eleven required Luna/MAX reviewers completed. Fourteen synthesized findings
were independently validated; this table records the third and final permitted
fix cycle. It remains **pending the mandatory read-only acceptance review**.

| Validator | Correction and final semantic anchors | Disposition |
|---|---|---|
| `C3-V01`, `C3-V04` | Normalize quarantine identities and expose only the immutable predicate. `src/lib/data/publication-policy.ts#isKnownQuarantinedEntityId`; `src/test/publication-containment.test.ts#keeps unsupported grades and named quarantined entities out of public data`. | **FIXED-PENDING-ACCEPTANCE-REVIEW** |
| `C3-V02`, `C3-V03` | Reject malformed source-page metadata and withhold Tala dispositions from unsafe contexts. `src/lib/evidence/source-evidence.ts#isSourceDocumentRecord`; `src/lib/evidence/source-evidence.ts#isSourcePageQualityRecord`; `src/lib/data/publication-policy.ts#getTalaFieldDisposition`. | **FIXED-PENDING-ACCEPTANCE-REVIEW** |
| `C3-V05` | QuizRunner validates and projects one detached quiz/question snapshot. `src/components/quiz/QuizRunner.tsx#getUsableQuiz`; `src/test/quiz-runner.test.tsx#renders a safe unavailable state for duplicate question IDs`. | **FIXED-PENDING-ACCEPTANCE-REVIEW** |
| `C3-V06`, `C3-V07` | Public collection validators enforce the declared kind and padded source IDs fail consistently. `src/lib/validation/content-validator.ts#validatePublicCollection`; `src/test/publication-containment.test.ts#rejects every required route-rendered Raga and Lesson shape`; `src/test/publication-containment.test.ts#rejects every required route-rendered Raga and Lesson shape`. | **FIXED-PENDING-ACCEPTANCE-REVIEW** |
| `C3-V08` | Sinhala identity/search normalization removes U+2060–U+206F controls. `src/lib/search/normalize-sinhala.ts#normalizeSinhalaText`; `src/test/search-engine.test.ts#should normalize Sinhala characters, diacritics, and rakaransaya variations`. | **FIXED-PENDING-ACCEPTANCE-REVIEW** |
| `C3-V09` | Every dependency key now reaches repository list, direct lookup, search-catalog where applicable, and summary assertions. `src/test/publication-parity.test.ts#proves every dependency key through repository list, lookup, search, and summary boundaries`. | **FIXED-PENDING-ACCEPTANCE-REVIEW** |
| `C3-V10` | Numeric anchors resolve at the exact cited line and the six-column closeout table mirrors the ledger. `src/test/review-closeout.test.ts#expectSemanticReference`; `src/test/review-closeout.test.ts#resolves current musical-core anchors by symbol and heading, not by nonblank line counts`. | **FIXED-PENDING-ACCEPTANCE-REVIEW** |
| `C3-V11` | Rhythm callback replacement regression completes the active session and proves only the latest callback fires. `src/test/components.test.tsx#keeps arranger and ear-training Swara ownership isolated`. | **FIXED-PENDING-ACCEPTANCE-REVIEW** |
| `C3-V12` | Microphone privacy coverage guards fetch, XHR, WebSocket, and beacon on successful and failed starts. `src/test/pitch.test.ts#lets only the newest pending start acquire ownership and emit callbacks`. | **FIXED-PENDING-ACCEPTANCE-REVIEW** |
| `C3-V13`, `C3-V14` | AudioContext mocks restore in `finally`; rejected CMS publication no longer performs a mutating reset. `src/test/synth.test.ts#fails Web Audio initialization closed without throwing and bounds hostile BPM`; `src/test/publication-containment.test.ts#keeps unsupported grades and named quarantined entities out of public data`. | **FIXED-PENDING-ACCEPTANCE-REVIEW** |

The cycle-3 review artifacts remain findings input, not acceptance evidence.
The rejected Deepchandi retrieval-only finding, all eight whole-entity Tala
quarantines, and original-PDF/notation/OCR/SME boundaries remain unchanged.

## Phase 2 final-acceptance follow-up

The blocked run `20260817-054012-p02-final-acceptance-a17068ff` independently
validated 14 remaining application-contract defects. Their stable test and
symbol mappings are recorded in the “Final-acceptance follow-up” section of
`docs/forensic-remediation/evidence/P02_CLOSEOUT_FINDINGS.md` and mirrored by
`data/forensic-ledger.json#finalAcceptanceFollowup`. No curriculum or musical
fact is promoted; all eight Talas remain quarantined.

## Phase 2 acceptance-hardening review cycle 1

Run `20260817-p02-hardening-c1-06568d6f` reviewed original base
`beba1479f473b3413b3f2de48a27c558e1937c6f` through implementation head
`06568d6f0d777771ef139e6fdd21d1bc73d8c5e7`. Eleven Luna/MAX reviewers and
twenty independent validators completed: 20 validated, 0 rejected, 0 failed,
and no degraded P0/P1 evidence. The complete one-to-one mapping is in
`docs/forensic-remediation/evidence/P02_CLOSEOUT_FINDINGS.md#Acceptance-hardening review cycle 1 (20 validated findings; pending rereview)`
and `data/forensic-ledger.json#acceptanceHardeningReviewCycle1`.

| Finding group | Applied correction | Stable evidence | Disposition |
|---|---|---|---|
| `AH-C1-V01`–`AH-C1-V05`, `AH-C1-V12`–`AH-C1-V14`, `AH-C1-V18`–`AH-C1-V19` | Complete caller/session-owned Swara, Tabla, Tala, Rhythm, and Pitch cleanup, settlement, callback, and re-entrancy behavior. | `src/test/swara-consumers.test.tsx`; `src/test/components.test.tsx`; `src/test/synth.test.ts`; `src/test/pitch.test.ts` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V06`–`AH-C1-V11`, `AH-C1-V20` | Bound publication input, object/key traversal, grade arrays, source/question collection semantics, and canonical nested/top-level identities. | `src/test/content-contracts.test.ts`; `src/test/content-validator.test.ts`; `src/test/source-metadata-consistency.test.ts`; `src/test/publication-containment.test.ts` | **FIXED-PENDING-REREVIEW** |
| `AH-C1-V15`–`AH-C1-V17` | Downgrade missing projections and reject duplicate/invalid source-page and Tala-disposition evidence. | `src/test/publication-containment.test.ts`; `src/test/publication-parity.test.ts` | **FIXED-PENDING-REREVIEW** |

This is review-fix traceability, not acceptance evidence. All eight Talas remain
whole-entity quarantined; no musical/source field is promoted; prior blocked
runs and the rejected Deepchandi finding remain unchanged.

## Phase 2 acceptance-hardening review cycle 2

Run `20260817-p02-hardening-c2-2af0d18` reviewed original base
`beba1479f473b3413b3f2de48a27c558e1937c6f` through implementation head
`2af0d182ab0077338964432da5f75de9401f83ec`. The run is **incomplete**: 10 of
11 required reviewer artifacts exist, the frontend-races artifact was never
produced, and `402 Payment Required ... deactivated_workspace` terminated the
run before any validator artifact was written. It is preserved as historical
findings input; the absent artifacts are missing coverage, not zero findings.

The complete sixteen-row mapping is in
`docs/forensic-remediation/evidence/P02_CLOSEOUT_FINDINGS.md#Acceptance-hardening review cycle 2 (incomplete input run; ten findings closed; pending rereview)`
and `data/forensic-ledger.json#acceptanceHardeningReviewCycle2`.

| Finding group | Applied correction | Stable evidence | Disposition |
|---|---|---|---|
| `AH-C2-V01`, `AH-C2-V03` | Canonicalize question, quiz, source, and record identities so listing, direct lookup, validation, decisions, and summaries resolve one identity. | `src/test/quiz-runner.test.tsx`; `src/test/source-metadata-consistency.test.ts` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-V02`, `AH-C2-R04` | Return an explicit unavailable source-corpus inventory for an uncertifiable corpus and render that state honestly instead of showing counts. | `src/test/publication-parity.test.ts`; `src/test/sources-page.test.tsx` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-V04` | Give a public Quiz a dedicated aggregate evidence rule — public parent lesson plus every question's own grade scope and direct page evidence — without weakening either gate. | `src/test/content-validator.test.ts` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-V05`, `AH-C2-V06`, `AH-C2-R01`, `AH-C2-R02`, `AH-C2-R05` | Release ownership before cancelling and isolate every cancellation and timer clear through one shared failure-atomic helper used by EarTraining and all three detail routes. | `src/test/audio-cleanup.test.ts`; `src/test/swara-consumers.test.tsx`; `src/test/synth.test.ts`; `src/test/pitch.test.ts` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-V07` | Resolve compound Tabla bols through a closed `Map` so prototype keys can never yield an inherited non-array value. | `src/test/synth.test.ts` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-V08` | Move every structural registry rule into one central dependency-free contract shared by publication gating and forensic validation; an incomplete, conflicting, or malformed registry now makes the evaluation context unsafe. | `src/test/publication-parity.test.ts` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-V09`, `AH-C2-R03` | Prove exact-limit and over-limit graph behaviour and the eight-Tala quarantine through the checked batch, repository list, direct lookup, search, and publication summary. | `src/test/graph-boundary.test.ts` | **FIXED-PENDING-REREVIEW** |
| `AH-C2-V10`, `AH-C2-R06` | Mutate source-document `reviewStatus` and `pageCount` independently and prove all six consumers refresh from one operation snapshot; repair the CMS test that had detached the repository catalog. | `src/test/publication-parity.test.ts`; `src/test/review-closeout.test.ts` | **FIXED-PENDING-REREVIEW** |

This is review-fix traceability, not acceptance evidence. All eight Talas remain
whole-entity quarantined; no musical or source field is promoted; the public
boundary stays Grades 6-11; prior blocked runs and the rejected Deepchandi
retrieval-only finding remain unchanged. No push, ready PR, merge, or deployment
is authorized by this entry.

## Phase 2 follow-up: structural debt, automated guards, and housekeeping

Bounded follow-up slice on branch `codex/p02-followup-structural-debt`, base
`d323df54a30f52ea3a1bcad4c0b04daab7e5492e` (the PR #2 merge commit). This is an
application-structure and tooling slice: it adds no musical fact, publisher,
year, location, licence, organization, reviewer, review date, or publication
state.

| Item | Applied change | Stable anchors | Disposition |
|---|---|---|---|
| A1 foreign-script guard | New Vitest gate rejects Cyrillic/CJK/Kana/Hangul/Devanagari/Arabic/Hebrew/Greek/accented-Latin/Thai/Myanmar/Tamil characters in UI source under `src/app` and `src/components`; proven to fail when the historical `временно` defect is reintroduced in the sources empty state and to pass clean. | `src/test/ui-script-guard.test.ts#keeps every UI source file under src/app and src/components free of foreign scripts` | **MERGED-VIA-PR-4** (1d0ee6a11d7a05306252b110b019abd8be9e2965; superseded from IMPLEMENTATION-COMPLETE-PENDING-REVIEW by the P02 CI-and-traversal-cost slice) |
| A2 structural residual | Three >1000-line files split along real seams (`content-validator.ts` 1773→140 final lines as measured by newline count — 306 at the initial split commit `e83c45e`, reduced further by cycle closure in `4ab4707`; `publication-policy.ts` 1688→956; `content-contracts.ts` 1154→920) into dependency-free shared primitives, a neutral evidence layer, and focused policy/audit modules; the runtime import graph is **acyclic across the data↔validation boundary** (no cycle crosses it — enforced mechanically by `src/test/layering-guard.test.ts`; the earlier "cycle closed / content-validator imports no data module at runtime" wording was inaccurate because `content-validator` runtime-imports from `@/lib/data/publication-policy` and re-exports two other data modules while they import it back). Publication decisions are unchanged. | `src/lib/shared/bounded-values.ts#safeOwnEntries`, `src/lib/data/source-evidence-policy.ts#evaluateSourceReference`, `src/lib/data/tala-disposition-policy.ts#getTalaFieldDisposition`, `src/lib/data/publication-audit.ts#validatePublicCollection` | **MERGED-VIA-PR-4** (`1d0ee6a11d7a05306252b110b019abd8be9e2965`; corrected by the P02 CI-and-traversal-cost slice) |
| A3 anchor mechanism | Numeric line anchors converted to stable `path#symbol` form across this log, the closeout matrix, and the field matrix; **233** anchors machine-verified resolvable (the previously recorded 228 was the count before commit `4ab4707` added five more; `node scripts/verify-symbol-anchors.mjs` reports "233 resolved, 0 unresolved" at the PR #4 merge head); automated guard fails on any returning numeric code anchor or unresolved symbol. Historical run IDs, verdicts, and the rejected Deepchandi disposition untouched — append only. | `src/test/review-closeout.test.ts#keeps traceability documents free of numeric code anchors (A3 mechanism, not manual refresh)`; `scripts/verify-symbol-anchors.mjs` | **MERGED-VIA-PR-4** (`1d0ee6a11d7a05306252b110b019abd8be9e2965`; corrected by the P02 CI-and-traversal-cost slice) |
| A4 touch targets | Interactive controls brought to a 44px minimum by padding/hit-area adjustments at both 1440×900 and 360×568 with zero horizontal overflow. | `src/components/layout/Navbar.tsx#Navbar`; browser QA artifacts under the session temp directory | **MERGED-VIA-PR-4** (1d0ee6a11d7a05306252b110b019abd8be9e2965; superseded from IMPLEMENTATION-COMPLETE-PENDING-REVIEW by the P02 CI-and-traversal-cost slice) |
| A5 dependency upgrades | Minimal targeted upgrades only: `next ^14.2.15→^15.5.23`, `postcss ^8.4.47→^8.5.26`, `vitest ^2.1.3→^3.2.7`. npm audit falls from 10 vulnerabilities (1 critical) to 6 high **as measured on that slice's HEAD**; every remaining advisory requires an out-of-scope major (Next 16 / Vitest 4) and is reported as remaining. Correction (P02 CI-and-traversal-cost slice): the eslint-config-next 14→15 alignment in this later slice exits two more advisory ranges, so the current count is **3 high** — per-advisory exposure dispositions live in `data/forensic-ledger.json#p02CiAndTraversalCost.a5AdvisoryDisposition`; this row's historical numbers are preserved as measured-at-the-time, not updated in place. | `package.json`; `data/forensic-ledger.json` (`p02FollowupStructuralDebt.workItems.A5_dependency_upgrades`) | **PARTIAL BY DESIGN — majors out of scope** |
| A6 housekeeping | `npm ci` from scratch verified after removing the stale dev server that held the SWC binary (the recorded EPERM cause reproduced as EBUSY); retained recovery worktree at `dc7d582` confirmed fully contained in main via `git cherry` (0 unique commits) and removed; `.claude/launch.json` assessed and retained pending owner decision; unapproved install scripts (`esbuild`, `sharp`, `unrs-resolver`) investigated — they do not affect test or build correctness. | `git worktree list`; `data/forensic-ledger.json` (`p02FollowupStructuralDebt`) | **COMPLETE** |

Track B honesty re-verified on final HEAD: all eight Talas remain whole-entity
quarantined with raw records retained; all 21 public source rows expose only the
unknown/unverified provenance representation (probe: 0 leaks); `raga-bhairav`
stays quarantined; the rejected Deepchandi retrieval-only disposition and every
prior blocked run ID are preserved unchanged.

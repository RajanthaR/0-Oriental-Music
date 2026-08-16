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
| `P01-RAGA-BILAWAL-001` | Alhaiya Bilawal label, missing Ma in ascent, and Shadav–Sampurna jati. | Corrected school Bilawal is public only in the application `10-11` browse band containing evidenced Grade 11; raw review metadata remains `Needs Revision`. | Source: `SRC-G11-RAGA-ID`, `sg11_emus_ chap3_raga_handunaganimu.pdf`, PDF pp. 1–2, quality A. Final state: **PUBLIC**. Final anchors: `src/data/ragas.json:3`, `src/test/musical-core.test.ts:50`. |
| `P01-RAGA-BHAIRAV-001` | Bhairav was published as a school raga. | Not established in the accepted supplied prescribed-list evidence; the raw record is retained and all public routes/search remain contained. | `SRC-G11-RAGA-ID`, PDF pp. 1–2, quality A, lists the seven public ragas but does not establish Bhairav. Final state: **QUARANTINED**. Final anchors: `src/data/ragas.json:418`, `src/lib/data/publication-policy.ts:111`, `src/test/musical-core.test.ts:381`. |
| `P01-TALA-LAWANI-001` | Mixed structural/context citations and generic framing. | The Grade 10 structural record and Grade 11 school-context statement remain raw audit data. The context document is still `Review Required`, and normalized bol cells are not accepted from extraction alone, so reverse dependencies and the complete public Tala are withheld. | Structure: `SRC-EPD-TB-G10`, `sg10_emus_chap1_mulikanga.pdf`, pp. 3, 6, extraction A. Context: `SRC-EPD-TB-G11`, `s11tim173.pdf`, p. 24, page A but document triage incomplete. Final state: **NEEDS-REVIEW / WHOLE ENTITY QUARANTINED**. Final anchors: `src/data/talas.json:806`, `data/musical-core-field-dispositions.json:783`, `src/test/publication-containment.test.ts:239`. |
| `P01-TALA-DADRA-CITE-001` | Dadra tala/lesson cited unsupported Grade 7 pages. | Exact Grade 10 page 6 locators replace the unsupported citations, but the extracted normalized bol cells require original-PDF/manual review. The raw Tala, lesson, and quiz remain auditable and are all nonpublic through reverse-dependency quarantine. | `SRC-EPD-TB-G10`, `sg10_emus_chap1_mulikanga.pdf`, p. 6, extraction A. Final state: **NEEDS-REVIEW / WHOLE DEPENDENCY QUARANTINED**. Final anchors: `src/data/talas.json:3`, `src/data/lessons.json:672`, `src/data/quizzes.json:371`. |
| `P01-TALA-ROOPAK-001` | Roopak was published as Grade 10–11 curriculum. | Not established in accepted supplied Grade 6–11 tala evidence; raw record retained. | Evidence comparison remains bounded by accepted Grade 10 pp. 2–7 (A); the Grade 11 extraction is `Review Required`. Final state: **QUARANTINED**. Final anchors: `src/data/talas.json:701`, `src/lib/data/publication-policy.ts:111`, `src/test/musical-core.test.ts:386 (verifies bounded quarantine status for out-of-scope entities)`. |
| `P01-SOUND-TERMINOLOGY-001` | Grade 6 sound scope and eight unsupported public terms. | Grade 10 lesson and five evidenced terms are public; `term-sound`, `term-ahata-nada`, and `term-anahata-nada` remain quarantined. | `SRC-G10-NADA`, `sg10_emus_chap8_nadaya.pdf`, pp. 2–12, quality A. Final state: **PUBLIC only for evidenced claims**. Final anchors: `src/data/lessons.json:3`, `src/data/glossary.json:70`, `src/test/musical-core.test.ts:200`. |
| `P02-ACOUSTICS-EVIDENCE-001` | Learner prose asserted unsupported Hz units, direction-dependent sound variation, violin/flute examples, and other extrapolations. | Public acoustics prose is limited to the source-bounded vibration count per second, string/membrane factors, and the general voice/instrument waveform distinction. Unsupported examples and directional claims are removed rather than reconstructed. | `SRC-G10-NADA`, `sg10_emus_chap8_nadaya.pdf`, pp. 2–12, A extraction. Final anchors: `src/data/lessons.json:3`, `src/data/glossary.json:70`, `src/data/glossary.json:107`, `src/data/glossary.json:125`, `src/test/musical-core.test.ts:200`. |
| `P02-QUIZ-SYNC-001` | Acoustics/Dadra quizzes retained stale Grade 6/7 questions. | Every question carries an explicit grade and direct locator. The acoustics quiz may project publicly because its lesson/questions pass; the Dadra quiz remains nonpublic because its parent lesson and required Tala are quarantined. | Acoustics: `SRC-G10-NADA`, pp. 3, 4, 10–11, A. Dadra raw evidence: `SRC-EPD-TB-G10`, p. 6, A extraction. Final anchors: `src/data/quizzes.json:3`, `src/data/quizzes.json:371`, `src/test/musical-core.test.ts:244`. |
| `P02-LOCATOR-POLICY-001` | Counterfeit/multiple PDF names, filename digits, invalid ranges, or mixed-quality pages could pass. | Exact one-document identity, explicit page clauses, full range checks, and all-pages A/B+Sinhala readability now fail closed, including whitespace/comma/slash/parenthesis/newline second-PDF forms. | Source evidence: **N/A — runtime publication invariant**. Final anchors: `src/lib/data/publication-policy.ts:289`, `src/lib/data/publication-policy.ts:456`, `src/test/publication-containment.test.ts:418`. |
| `P02-GRADE-EVIDENCE-001` | Core claims were advertised across grades not established by their selected source, and missing canonical grades could be inferred from parents, child questions, or sources. | Public projection uses only a record/question's own explicit canonical browse band; individual grade tokens, mixed runtime arrays, and fallback inference are rejected. Seven ragas use exact Grade 11 evidence, and the acoustics lesson/quiz/five terms use exact Grade 10 evidence. Khemta's Grade 10 locator remains raw audit evidence, not a public Tala. `10-11` is a browse bucket, not proof of both grades. | Final state: **PUBLIC only under the selected-source grade contract**. Final anchors: `src/lib/data/publication-policy.ts:884 (gradeScopeMatchesSource)`, `src/lib/data/publication-policy.ts:894 (source-grade every check)`, `src/test/publication-containment.test.ts:683 (requires each public grade band to contain a grade established by its source)`. |
| `P02-TALA-STRUCTURE-001`, `P02-TALA-BOL-EVIDENCE-*` | Keherwa/Lawani cell drift, six-matra Khemta, unsupported spellings, and normalized bol cells were treated as public facts. | Khemta retains four readable compound cells as raw audit data. Because vibhag structure, hand actions, bol flags, and practice configuration were not all bound by the closed-world evidence registry, Khemta now also fails closed. Grade 10 names `ත්‍රිතාල් තාලය` and `ජප් තාලය` are retained with editorial retrieval aliases; `දීප්චන්දි` remains retrieval-only. | `SRC-EPD-TB-G10`, pp. 2–7, A text extraction with visual limits. Final state: **ALL EIGHT TALAS WHOLE-ENTITY QUARANTINED**. Final anchors: `src/lib/data/publication-policy.ts:111`, `data/musical-core-field-dispositions.json:896`, `src/test/musical-core.test.ts:147`. |
| `P02-RAGA-FIELDS-001` | Unsupported rasa/history/phrases, lower-grade claims, and incorrect Yaman/Bhimpalasi fields. | Absent claims withheld; seven source fields and one mukhyanga per raga are public; Bhairav remains quarantined. | `SRC-G11-RAGA-ID`, pp. 1–2, quality A. Final state: **PUBLIC only in browse band containing Grade 11**. Final anchors: `src/data/ragas.json:3`, `src/lib/data/publication-policy.ts:884 (gradeScopeMatchesSource)`, `src/test/musical-core.test.ts:50`. |
| `P02-QUIZ-POLICY-001` | Public parent alone could expose unsupported nested questions. | Aggregate decision requires a public parent, non-empty questions, explicit canonical grades/direct evidence, a supported runtime discriminator and answer shape, and a public decision for every question. | Source evidence: **N/A — implementation invariant**. Final anchors: `src/lib/data/publication-policy.ts:604`, `src/lib/data/publication-policy.ts:967`, `src/test/components.test.tsx:325`, `src/test/publication-containment.test.ts:685`. |
| `P02-AUDIO-OWNERSHIP-001` | Start immediately cancelled its own handle, global cancellation allowed unrelated visualizers to stop one another, invalid BPM could create hot loops, and Web Audio failures escaped. | Each visualizer owns one active cancellation handle. Start preserves its first compound stroke; tick replaces only that handle; Stop, Reset, audio-off, BPM/tala replacement, and unmount cancel it. BPM is bounded to 40–240, the rhythm terminal timer is single-shot, and missing/throwing Web Audio returns localized unavailable feedback without blocking the visual/text experience. | Raw Khemta cells: `SRC-EPD-TB-G10`, p. 7, A. Scheduling/timing/error handling: **N/A — application invariant**. Final anchors: `src/components/audio/TalaVisualizer.tsx:23`, `src/components/audio/RhythmTapGame.tsx:14`, `src/lib/audio/tempo.ts:14`, `src/test/components.test.tsx:182 (keeps each TalaVisualizer playback handle owned by its lifecycle)`, `src/test/components.test.tsx:261 (cancels playback on Reset, tala change, and unmount)`, `src/test/components.test.tsx:286 (co-mounted TalaVisualizer isolation)`, `src/test/synth.test.ts:77`. |
| `P02-STATIC-QUARANTINE-001` | Static EarTraining and search suggestions bypassed repository containment with Bhairav/Roopak and later reduced-set Tala names. | Bhairav, Roopak, Dadra, Lawani, and Khemta are absent from static public suggestions/exercises; hostile search keys and serialized public collections are regression-locked. | Source evidence: **N/A — application containment invariant**. Final anchors: `src/components/audio/EarTrainingModule.tsx:46`, `src/app/search/page.tsx:8`, `src/test/search-engine.test.ts:20 (should not discover quarantined Bhairav or Roopak claims)`, `src/test/components.test.tsx:971 (static public UI quarantine regression)`. |
| `P01-SOURCE-METADATA-001` | Selected sources asserted unsupported publisher/year/place/licence/status values, and catalogs disagreed. | Runtime, manifest, Markdown, and human-source rows retain exact IDs/filenames/grades and explicit unknown/unverified metadata. A cross-catalog mutation suite rejects publisher, year, location, licence, tier, URL, and topic drift. | Evidence class: **N/A — metadata inventory**. Final anchors: `src/data/sources.json:84`, `data/source-manifest.json:98`, `SOURCES.md:48`, `src/test/source-metadata-consistency.test.ts:14`. |
| `P02-TALA-VALIDATION-001` | Validators missed null/malformed tala fields, exact vibhag membership, blank/fallback bols, unsafe practice tempos, and search-equivalent identities. | Runtime structural guards and negative mutations fail closed; shared search normalization covers Tala, glossary, and terminology identity surfaces; practice tempos must be finite 40–240 BPM. | Source evidence: **N/A — implementation invariant**. Final anchors: `src/lib/validation/content-contracts.ts:783`, `src/lib/validation/content-validator.ts:1237`, `src/test/content-validator.test.ts:114`, `src/test/content-validator.test.ts:303`. |

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

| Issue ID | Validated runtime defect | Implementation disposition | Final line-qualified anchors |
|---|---|---|---|
| `P02-FINAL-01` | Missing Lesson `reviewMetadata` could be public and crash a detail route. | Require complete raw metadata; fail malformed input closed; synthesize safe unverified metadata only in bounded projections. | `src/lib/validation/content-contracts.ts:327`, `src/lib/validation/content-contracts.ts:602`, `src/test/content-contracts.test.ts:241`, `src/test/publication-containment.test.ts:84` |
| `P02-FINAL-02` | Invalid nonblank finite-domain values bypassed partial guards. | Central finite-union membership covers record and nested fields before publication. | `src/lib/validation/content-contracts.ts:25`, `src/test/content-contracts.test.ts:241`, `src/test/content-contracts.test.ts:268` |
| `P02-FINAL-03` | Known dormant entity guards omitted required fields and nested shapes. | Closed kind identification plus complete contracts govern validation, publication, repository reads, and projections. | `src/lib/validation/content-contracts.ts:602`, `src/lib/validation/content-contracts.ts:702`, `src/lib/validation/content-contracts.ts:772`, `src/test/content-contracts.test.ts:101` |
| `P02-FINAL-04` | Recursive graph handling overflowed on deep acyclic input. | Iterative traversal and projection enforce depth 256 and 10,000 unique-node limits; shared DAGs pass and cycles/overruns fail closed. | `src/lib/validation/content-contracts.ts:819`, `src/lib/validation/content-contracts.ts:950`, `src/test/content-contracts.test.ts:368` |
| `P02-FINAL-05` | Normalized-empty hostile search input enumerated the public catalog. | Preserve raw-empty featured results; return no result for nonblank normalized-empty input. | `src/lib/search/search-engine.ts:84`, `src/lib/search/search-engine.ts:137`, `src/test/search-engine.test.ts:80` |
| `P02-FINAL-06` | Swara work continued after replacement or unmount. | Caller-owned handles cancel initialization, active oscillators, sequence delays, callbacks, Strict Mode and co-mounted consumer work. | `src/lib/audio/synth.ts:50`, `src/lib/audio/synth.ts:201`, `src/lib/audio/synth.ts:350`, `src/test/synth.test.ts:199`, `src/test/synth.test.ts:293`, `src/test/components.test.tsx:471 (cancels owned Swara tone and scale work)`, `src/test/components.test.tsx:555 (retains ready Swara ownership until finished)` |

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
| `C3-01`–`C3-08` | Status, identity, evidence, summary, batch, and projection decisions could diverge or reread mutable values. | One bounded operation context, checked batch, complete kind contract, fresh summary, and allowlisted projection fail closed. | `src/lib/data/publication-policy.ts:362 (createPublicationEvaluationContext)`, `src/lib/data/publication-policy.ts:1348 (evaluatePublicationBatch)`, `src/lib/data/repository.ts:507 (getPublicationSummary)`, `src/lib/validation/content-contracts.ts:984 (projectPublicRecord)`. |
| `C3-09`–`C3-12` | Hostile disposition/source rows and incomplete dependency coverage could throw or fail open. | Unknown-safe source/disposition snapshots, exactly-one document mapping, and one declarative dependency matrix govern all surfaces. | `src/lib/validation/content-validator.ts:229 (validateSelectedSourceMetadata)`, `src/lib/validation/content-validator.ts:332 (validateMusicalCoreFieldDispositions)`, `src/lib/data/publication-policy.ts:221 (DEPENDENCY_FIELD_RULES)`. |
| `C3-13` | Prior numeric documentation anchors drifted. | Closeout documentation is asserted by stable symbols and refreshed final line anchors after review fixes. | `src/test/review-closeout.test.ts (resolves current musical-core anchors by symbol and heading)`, `docs/FORENSIC_CORRECTION_LOG.md:71 (P02-FINAL-06)`. |
| `C3-14`–`C3-16` | Forensic question fields leaked into the renderable model, empty quizzes crashed, and hostile queries threw/enumerated results. | Explicit public question variants, a safe Sinhala empty state, and uniform query classification close the UI boundaries. | `src/types/content.ts:295 (RenderableQuestionType)`, `src/components/quiz/QuizRunner.tsx:36 (getUsableQuiz)`, `src/lib/search/search-engine.ts:84 (classifySearchQuery)`, `src/test/search-engine.test.ts:80 (normalized-empty controls)`. |
| `C3-17`–`C3-20` | Rhythm/Tabla work was not consistently session-owned or failure-atomic. | Current-generation callbacks, settled-handle removal, and timer cancellation isolate every caller. | `src/components/audio/RhythmTapGame.tsx:14`, `src/components/audio/TalaVisualizer.tsx:23`, `src/lib/audio/tabla.ts:46`, `src/test/synth.test.ts:96`. |
| `P02-PITCH-OWNERSHIP-001` | Failed, replaced, pending, or unmounted microphone starts could retain resources or callbacks. | Generation ownership stops late streams and idempotently releases tracks, nodes, frames, and contexts with no network/upload path. | `src/lib/audio/pitch.ts:114 (startListening)`, `src/lib/audio/pitch.ts:220 (stopListening)`, `src/test/pitch.test.ts:76 (late stream cleanup)`, `src/test/pitch.test.ts:93 (newest pending start)`. |
| `P02-PROJECT-SCOPE-001` | Contributor guidance contradicted the forensic Grades 6–11 public boundary and implied a fixed verified source count. | Guidance now distinguishes current public scope, raw quarantined records, and workflow capability from proof of completed review. | `AGENTS.md:3 (current verified public curriculum boundary)`, `AGENTS.md:37 (raw Grade 12–13/A/L quarantine)`, `AGENTS.md:182 (CMS review capability boundary)`, `src/test/review-closeout.test.ts (records acceptance-hardening scope)`. |

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
| `V15` | Replace blank/unrelated numeric anchors with current symbols/headings and make the closeout assertion semantic. | `src/test/musical-core.test.ts:386 (verifies bounded quarantine status for out-of-scope entities)`; `src/lib/data/publication-policy.ts:884 (gradeScopeMatchesSource)`; `src/test/publication-containment.test.ts:683 (requires each public grade band to contain a grade established by its source)`; `src/test/components.test.tsx:555 (retains ready Swara ownership until finished)`; `src/test/search-engine.test.ts:20 (should not discover quarantined Bhairav or Roopak claims)`. | **FIXED-PENDING-REREVIEW** |
| `V23` | Require exact C3-01–C3-20 plus authorized P02 IDs and every test/fix/anchor/disposition mapping against the historical tables and ledger. | `src/test/review-closeout.test.ts (resolves current musical-core anchors by symbol and heading)`; `data/forensic-ledger.json (acceptanceHardeningInput.traceability)`. | **FIXED-PENDING-REREVIEW** |

The cycle-2 run remains findings input only. Earlier blocked run IDs, the
rejected Deepchandi retrieval-only disposition, all Tala quarantine decisions,
and the original-PDF/notation/OCR/SME review boundaries are preserved; no push,
ready PR, merge, deployment, or musical-claim promotion is implied.

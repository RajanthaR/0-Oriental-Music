# Phase 2 musical-core field audit matrix

This is the claim-level audit for Phase 2. Each column is an independently reviewed field. `A` is used only for readable extracted source pages. Repository policy, editorial transliteration, synthesized practice tempo, and review-state rows use `N/A` and are never presented as curriculum-page evidence.

Evidence boundary: the checkout contains extracted Markdown, not the original PDFs. Layout-sensitive notation remains subject to original-PDF/manual review. Internal agent work is not an SME approval event; every `reviewMetadata` record therefore remains `Needs Revision` with unknown reviewer/date/licence values.

## 1. Raga evidence

Canonical source for the seven public records: `oriental_music_markdown/by-source/grade_11_raga_identification.md`, extracted from `sg11_emus_ chap3_raga_handunaganimu.pdf`, PDF pages 1–2 (`SRC-G11-RAGA-ID`, quality A). The source establishes Grade 11 inclusion, not lower-grade assignment. `gradeBands: ["10-11"]` is the application browse bucket containing the evidenced Grade 11; public pages must describe it as a band, not as proof of both grades.

### 1.1 Inclusion, identity, scale, and note-form fields

| Entity | Inclusion | Grade | `name_si` | `name_en` | `arohana_swaras` | `avarohana_swaras` | Forms / omissions | Disposition |
|---|---|---|---|---|---|---|---|---|
| `raga-bilawal` | Page 1 | 11 | බිලාවල් රාගය | Raga Bilawal (editorial, N/A) | `S R G M P D N S'` | `S' N D P M G R S` | all Shuddha; none omitted | **CORRECTED / VERIFIED** — removed Alhaiya mismatch and restored Ma. |
| `raga-bhupali` | Page 1 | 11 | භූපාලි රාගය | Raga Bhupali (editorial, N/A) | `S R G P D S'` | `S' D P G R S` | Ma and Ni omitted | **VERIFIED**. |
| `raga-kafi` | Page 1 | 11 | කාෆි රාගය | Raga Kafi (editorial, N/A) | `S R g M P D n S'` | `S' n D P M g R S` | Komal Ga/Ni; none omitted | **VERIFIED**. |
| `raga-khamaj` | Page 1 | 11 | ඛමාජ් රාගය | Raga Khamaj (editorial, N/A) | `S G M P D N S'` | `S' n D P M G R S` | Ri omitted in ascent; dual Ni | **VERIFIED**. |
| `raga-bhimpalasi` | Page 1 | 11 | භිම්පලාසි රාගය (භීම්පලාශ්‍රී) | Raga Bhimpalasi (editorial, N/A) | `.n S g M P n S'` | `S' n D P M g R S` | Ri/Dha omitted in ascent; Komal Ga/Ni | **VERIFIED**; mandra Ni normalized for synthesis. |
| `raga-yaman` | Page 1 | 11 | යමන් රාගය | Raga Yaman (editorial, N/A) | `S R G m P D N S'` | `S' N D P m G R S` | Teevra Ma; none omitted | **CORRECTED / VERIFIED** — restored source ascent Sa and Pa. |
| `raga-bhairavi` | Page 1 | 11 | භෛරවී රාගය | Raga Bhairavi (editorial, N/A) | `S r g M P d n S'` | `S' n d P M g r S` | Komal Ri/Ga/Dha/Ni; none omitted | **VERIFIED**. |
| `raga-bhairav` | Not listed | Not established | **WITHHELD** | **WITHHELD** | **WITHHELD** | **WITHHELD** | **WITHHELD** | **NEEDS-REVIEW / QUARANTINED**. |

### 1.2 Thata, jati, vadi/samvadi, time, pakad, and derived UI fields

| Entity | `thata_si` | `jati_si` | `vadi_si` / `samvadi_si` | `time_si` | `pakad_si` / `samplePhrases` | `rasa_si` | `characteristics_si` | Evidence |
|---|---|---|---|---|---|---|---|---|
| `raga-bilawal` | Bilawal | Sampurna–Sampurna | Dha / Ga | දිවා ප්‍රථම ප්‍රහරය | Page-2 mukhyanga only | **WITHHELD** | all seven Shuddha; Sampurna | Page 2, A. |
| `raga-bhupali` | Kalyan | Audav–Audav | Ga / Dha | රාත්‍රී ප්‍රථම ප්‍රහරය | Page-2 mukhyanga only | **WITHHELD** | Ma/Ni omitted; Audav | Page 2, A. |
| `raga-kafi` | Kafi | Sampurna–Sampurna | Pa / Sa | රාත්‍රී දෙවන ප්‍රහරය | Page-2 mukhyanga only | **WITHHELD** | Komal Ga/Ni | Page 2, A. |
| `raga-khamaj` | Khamaj | Shadav–Sampurna | Ga / Ni | රාත්‍රී දෙවන ප්‍රහරය | Page-2 mukhyanga only | **WITHHELD** | Ri omitted in ascent; dual Ni | Page 2, A. |
| `raga-bhimpalasi` | Kafi | Audav–Sampurna | Ma / Sa | රාත්‍රී තෙවන ප්‍රහරය | Page-2 mukhyanga only | **WITHHELD** | Ri/Dha omitted in ascent; Komal Ga/Ni | Page 2, A; corrected previous day claim. |
| `raga-yaman` | Kalyan | Sampurna–Sampurna | Ga / Ni | රාත්‍රී ප්‍රථම ප්‍රහරය | Page-2 mukhyanga only | **WITHHELD** | Teevra Ma | Page 2, A. |
| `raga-bhairavi` | Bhairavi | Sampurna–Sampurna | Ma / Sa | දිවා ප්‍රථම ප්‍රහරය | Page-2 mukhyanga only | **WITHHELD** | four Komal swaras | Page 2, A; unsupported concert-ending claim removed. |
| `raga-bhairav` | **WITHHELD** | **WITHHELD** | **WITHHELD** | **WITHHELD** | **WITHHELD** | **WITHHELD** | **WITHHELD** | No accepted prescribed-list evidence. |

### 1.3 Source, review, and publication fields

| Entity set | `sourceReference` | `reviewMetadata` | Browse band | Publication disposition |
|---|---|---|---|---|
| Seven prescribed ragas | `SRC-G11-RAGA-ID`, `sg11_emus_ chap3_raga_handunaganimu.pdf පිටු 1-2` | Explicit unknown/unverified (N/A) | `10-11`, containing evidenced Grade 11 | **PUBLIC** after field correction; no Grade 10 evidence is inferred. |
| `raga-bhairav` | Raw locator is not accepted as prescribed-list evidence | Explicit unknown/unverified (N/A) | N/A | **QUARANTINED**; every raw musical field above remains individually withheld. |

## 2. Tala evidence

Raw structural evidence source: `oriental_music_markdown/by-source/grade_10_musical_fundamentals.md`, extracted from `sg10_emus_chap1_mulikanga.pdf`, PDF pages 2–7 (`SRC-EPD-TB-G10`, extraction quality A). Because the original PDF is absent, extraction quality does not prove visual bol cells, notation layout, vibhag actions, or boolean playback flags. Khemta's readable compound cells remain raw audit evidence, but all eight Talas are nonpublic until every learner-visible/playable structure field is explicitly dispositioned. The extracted Grade 11 text lists names on pages 23–24, but `DOC-GRADE_11_MUSIC_TEXTBOOK` remains `Review Required` and is not accepted publication evidence.

Source-catalog boundary: for `SRC-EPD-TB-G10`, `SRC-EPD-TB-G11`, `SRC-G10-NADA`, and `SRC-G11-RAGA-ID`, the supplied corpus establishes stable ID mapping, filename, grade, page count, extraction state, and page quality. It does **not** establish publisher, year, place, licence, or canonical tier; those raw fields are explicitly `නොදනී / සනාථ වී නැත`. The legacy `SRC-EPD-*` IDs are retained only for progress/link stability and do not prove an EPD publisher.

### 2.1 Inclusion, grade, name, structure, and hand actions

| Entity | Inclusion / grade | `name_si` | `name_en` | `matras` | `vibhagStructure` / count | Sam, tali, khali | Page | Disposition |
|---|---|---|---|---:|---|---|---|---|
| `tala-dadra` | Grade 10 locator | දාදරා තාලය | Dadra Tala (editorial, N/A) | 6 | `3+3` / 2 | Raw X/0 positions | 6 | **NEEDS-REVIEW / WHOLE ENTITY QUARANTINED**; normalized bol cells are not accepted from extraction alone. |
| `tala-keherwa` | Grade 10 locator | කෙහෙර්වා තාලය | Keherwa Tala (editorial, N/A) | 8 | `4+4` / 2 | Raw X/0 positions | 3, 6 | **NEEDS-REVIEW / WHOLE ENTITY QUARANTINED**. |
| `tala-teental` | Grade 10 locator | ත්‍රිතාල් තාලය (`ත්‍රීතාල්`, `තීන්තාල්` retrieval aliases, N/A) | Teental Tala (editorial, N/A) | 16 | `4+4+4+4` / 4 | Raw X/2/0/3 positions | 4–5 | **SOURCE SPELLING CORRECTED; WHOLE ENTITY QUARANTINED** pending original bol-cell review. |
| `tala-jhaptal` | Grade 10 locator | ජප් තාලය (`ජප්තාල්` retrieval alias, N/A) | Jhaptal (editorial, N/A) | 10 | `2+3+2+3` / 4 | Raw X/2/0/3 positions | 2, 6 | **SOURCE SPELLING CORRECTED; WHOLE ENTITY QUARANTINED** pending original bol-cell review. |
| `tala-deepchandi` | Grade 10 locator | දීප්චන්ද් තාලය | Deepchandi Tala (editorial, N/A) | 14 | `3+4+3+4` / 4 | Raw X/2/0/3 positions | 2, 4–5 | **WHOLE ENTITY QUARANTINED**. Grade 11 `දීප්චන්දි` remains retrieval-only and needs-review. |
| `tala-lawani` | Grade 10 locator plus unresolved Grade 11 context | ලාවනී තාලය | Lawani Tala (editorial, N/A) | 8 | `2+2+2+2` / 4 | Raw X/2/0/3 positions | 3, 6; context 24 | **WHOLE ENTITY QUARANTINED**; required school context and playable cells are unresolved. |
| `tala-khemta` | Grade 10 raw locator | ඛෙම්ටෝ තාලය (`ඛෙම්ටා` alias, N/A) | Khemta Tala (editorial, N/A) | 4 | Raw `2+2` / 2 | Raw X on 1; 0 on 3 | 7 | **READABLE CELLS RETAINED / WHOLE ENTITY QUARANTINED** pending closed disposition of all structure/action fields. |
| `tala-roopak` | Not in supplied list | **WITHHELD** | **WITHHELD** | **WITHHELD** | **WITHHELD** | **WITHHELD** | none | **NEEDS-REVIEW / QUARANTINED**. |

### 2.2 Exact theka and bol-to-matra fields

| Entity | `theka_si` | `bols[].bol_si` by matra | Evidence / disposition |
|---|---|---|---|
| `tala-dadra` | Raw normalized audit value retained | 6 raw normalized cells | Page 6, A extraction; **needs-review / quarantined**. |
| `tala-keherwa` | Raw normalized audit value retained | 8 raw normalized cells | Pages 3, 6, A extraction; **needs-review / quarantined**. |
| `tala-teental` | Raw normalized audit value retained | 16 raw normalized cells | Pages 4–5, A extraction; **needs-review / quarantined**. |
| `tala-jhaptal` | Raw normalized audit value retained | 10 raw normalized cells | Pages 2, 6, A extraction; **needs-review / quarantined**. |
| `tala-deepchandi` | Raw normalized audit value retained | 14 raw normalized cells including rests | Pages 2, 4–5, A extraction; **needs-review / quarantined**. |
| `tala-lawani` | Raw normalized audit value retained | 8 raw normalized cells | Pages 3, 6, A extraction; **needs-review / quarantined**. |
| `tala-khemta` | `ධන්න ධනක \| තන්න ධනක` | `ධන්න, ධනක, තන්න, ධනක` | Page 7, A; four compound matra cells. |
| `tala-roopak` | **WITHHELD** | **WITHHELD** | No accepted evidence. |

### 2.3 Context, practice tempo, source, review, and publication fields

| Entity / field | Audited state | Quality | Disposition |
|---|---|---|---|
| Lawani school context | Raw audit text records the Grade 11 extraction's statement that it is not a Hindustani-system tala and explains its school use | Grade 11 page 24 is A text extraction, but the source document is `Review Required`; separate `contextSourceReference` | **NEEDS-REVIEW / WHOLE ENTITY QUARANTINED**. No Lawani route, search result, lesson, quiz, path, or audio exercise is public. |
| Khemta laya context | Source says its laya is fast | A, page 7 | **VERIFIED** only as qualitative `fast`. |
| Other tempo/usage claims | Not established by cited pages | N/A | **WITHHELD** from curriculum claims. |
| `practiceTempoBpm` | Client-only visualizer/game defaults; UI explicitly discloses this and does not derive vilambit/madhya/drut labels | N/A | **PRACTICE DEFAULT**, not curriculum evidence. |
| Khemta raw `sourceReference` | `SRC-EPD-TB-G10`, exact page 7 | A extraction and readable compound cells; remaining structure/action fields are not closed | **NEEDS-REVIEW / NONPUBLIC**. |
| Eight quarantined raw tala records | Exact partial field dispositions in `data/musical-core-field-dispositions.json` | A extraction or missing, but not accepted visual truth | **NEEDS-REVIEW / NONPUBLIC** with reverse-dependency containment. |
| Tala review metadata | Explicit unknown/unverified | N/A | No SME/publication event claimed. |
| `tala-roopak` source/review/publication | Every raw musical field withheld; metadata unknown; stable-ID quarantine | N/A | **QUARANTINED**. |

## 3. Acoustics and quiz evidence

Canonical source: `oriental_music_markdown/by-source/grade_10_nadaya.md`, extracted from `sg10_emus_chap8_nadaya.pdf` (`SRC-G10-NADA`, quality A).

| Field / entity | Final state | Exact pages | Disposition |
|---|---|---|---|
| Curriculum grade | Grade 10 Unit 8 | 2–3 | **CORRECTED** from false Grade 6 claims. |
| Pitch | තාරතාවය / උච්චනීච ප්‍රභේදය | 3–4 | **VERIFIED**. |
| Intensity | විපුලතාවය / රූප භේදය | 3, 7–8 | **VERIFIED**. |
| Timbre | ධ්වනි ගුණය / ජාති භේදය | 3, 10–11 | **VERIFIED**. |
| `term-nada` | Narrow source-grounded description | 2 | **CORRECTED / VERIFIED**. |
| `term-sound` | No bounded definition found | N/A | **NEEDS-REVIEW / QUARANTINED**. |
| `term-ahata-nada` | No bounded definition found | N/A | **NEEDS-REVIEW / QUARANTINED**. |
| `term-anahata-nada` | No bounded definition found | N/A | **NEEDS-REVIEW / QUARANTINED**. |
| `les-intro-01` | Grade 10 lesson limited to three properties and source-listed string/membrane factors; unsupported aerophone rule removed | 2–12 | **CORRECTED / PUBLIC** in browse band `10-11`. |
| `quiz-les-intro-01` | Pitch, three properties, timbre | 3, 4, 10–11 | **CORRECTED / PUBLIC**; each question is gated. |
| `quiz-les-tala-dadra` | Raw Grade 10 Dadra questions retained | Grade 10 fundamentals page 6 | **WHOLE DEPENDENCY QUARANTINED** because its parent lesson and required Tala are nonpublic. |
| Terminology review labels | `Unverified` / `Needs Review` | N/A | No undocumented SME/publication event. |

## 4. Unresolved evidence boundary

- Original PDFs are absent; visually ambiguous glyphs, layout, and OCR-normalized bol spelling remain `needs-review` where noted.
- Bhairav and all eight Tala raw values are retained for audit, but their learner-visible and playable projections are withheld as whole entities.
- Lawani's Grade 11 school-context statement, all unresolved normalized bol cells, and the Grade 11 `දීප්චන්දි` spelling remain source-attributed `needs-review` items until document triage/original-PDF review is complete; none is a verified public data field.
- English transliterations and `practiceTempoBpm` are editorial/application values with `N/A` evidence quality.
- Earlier grades are not inferred from “previously studied” wording; they require exact source locators in a later phase.

## Runtime-contract cross-reference

The six final application-contract findings are recorded separately in
`docs/forensic-remediation/evidence/P02_CLOSEOUT_FINDINGS.md` under “Fresh
final-contract findings” and in `data/forensic-ledger.json` as
`P02-FINAL-01` through `P02-FINAL-06`. They do not add or promote a musical or
curriculum claim. This matrix remains limited to source-grounded fields, and
the unresolved original-PDF, notation/layout, OCR-glyph, Lawani-context, and
Deepchandi retrieval-spelling boundaries above remain `needs-review`.

| Runtime issue | Final application disposition | Line-qualified regression anchor |
|---|---|---|
| `P02-FINAL-01` | Missing raw review metadata fails publication closed; bounded projections use explicit unverified metadata. | `src/test/content-contracts.test.ts:241`; `src/test/publication-containment.test.ts:84` |
| `P02-FINAL-02` | Every finite-domain field is checked against the dependency-free closed union. | `src/test/content-contracts.test.ts:241`; `src/test/content-contracts.test.ts:268` |
| `P02-FINAL-03` | Every imported record and nested question is audited; listed legacy contract debt remains nonpublic. | `src/test/content-contracts.test.ts:101`; `src/lib/validation/content-contracts.ts:602`; `src/lib/validation/content-contracts.ts:702` |
| `P02-FINAL-04` | Iterative graph inspection/projection rejects cycles, hostile descriptors, and depth/node overruns while preserving projection-kind identity. | `src/test/content-contracts.test.ts:368`; `src/lib/validation/content-contracts.ts:819`; `src/lib/validation/content-contracts.ts:950` |
| `P02-FINAL-05` | Nonblank normalized-empty hostile search returns no results. | `src/lib/search/search-engine.ts:99`; `src/test/search-engine.test.ts:79` |
| `P02-FINAL-06` | Caller-owned Swara handles survive readiness and cancel replacement/unmount work without cross-caller effects. | `src/test/synth.test.ts:199`; `src/test/synth.test.ts:293`; `src/test/components.test.tsx:413`; `src/test/components.test.tsx:570`; `src/test/components.test.tsx:604` |

## Acceptance-hardening runtime boundary

The twenty validated `C3-01`–`C3-20` application findings and the microphone
ownership correction are traced in
`docs/forensic-remediation/evidence/P02_CLOSEOUT_FINDINGS.md`. They change
runtime containment, projection, validation, query, and local-audio lifecycle
contracts only. They do not alter any musical value in Sections 1–3.

The source disposition is unchanged: seven evidenced Grade 11 ragas and the
bounded Grade 10 acoustics subset may remain public; Bhairav and all eight
Talas remain quarantined; the rejected Deepchandi retrieval-only disposition
remains historical; original-PDF, diagram, notation, OCR/corrupt-glyph, and
SME review remain required where already recorded.

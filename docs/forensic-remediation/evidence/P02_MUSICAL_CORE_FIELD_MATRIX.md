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

Canonical structural source: `oriental_music_markdown/by-source/grade_10_musical_fundamentals.md`, extracted from `sg10_emus_chap1_mulikanga.pdf`, PDF pages 2–7 (`SRC-EPD-TB-G10`, quality A). Grade 11 pages 23–24 establish prescribed names but are not embedded inside a singular Grade 10 `SourceReference`; every published reference names only the document selected by its `sourceId`.

Source-catalog boundary: for `SRC-EPD-TB-G10`, `SRC-EPD-TB-G11`, `SRC-G10-NADA`, and `SRC-G11-RAGA-ID`, the supplied corpus establishes stable ID mapping, filename, grade, page count, extraction state, and page quality. It does **not** establish publisher, year, place, licence, or canonical tier; those raw fields are explicitly `නොදනී / සනාථ වී නැත`. The legacy `SRC-EPD-*` IDs are retained only for progress/link stability and do not prove an EPD publisher.

### 2.1 Inclusion, grade, name, structure, and hand actions

| Entity | Inclusion / grade | `name_si` | `name_en` | `matras` | `vibhagStructure` / count | Sam, tali, khali | Page | Disposition |
|---|---|---|---|---:|---|---|---|---|
| `tala-dadra` | Grade 10 | දාදරා තාලය (`දාද්‍රා` editorial/search alias, N/A) | Dadra Tala (editorial, N/A) | 6 | `3+3` / 2 | X on 1; 0 on 4 | 6 | **CORRECTED / VERIFIED**; lower-grade claims removed. |
| `tala-keherwa` | Grade 10 | කෙහෙර්වා තාලය | Keherwa Tala (editorial, N/A) | 8 | `4+4` / 2 | X on 1; 0 on 5 | 3, 6 | **CORRECTED / VERIFIED**. |
| `tala-teental` | Grade 10 | ත්‍රීතාල් තාලය (`ත්‍රීතාලය`, `තීන්තාල්` aliases, N/A) | Teental Tala (editorial, N/A) | 16 | `4+4+4+4` / 4 | X/2/0/3 on 1/5/9/13 | 4–5 | **VERIFIED**. |
| `tala-jhaptal` | Grade 10 | ජප්තාල් තාලය (`ජප්තාලය` alias, N/A) | Jhaptal (editorial, N/A) | 10 | `2+3+2+3` / 4 | X/2/0/3 on 1/3/6/8 | 2, 6 | **VERIFIED**. |
| `tala-deepchandi` | Grade 10 | දීප්චන්දි තාලය | Deepchandi Tala (editorial, N/A) | 14 | `3+4+3+4` / 4 | X/2/0/3 on 1/4/8/11 | 2, 4–5 | **VERIFIED**. |
| `tala-lawani` | Grade 10 | ලාවනී තාලය | Lawani Tala (editorial, N/A) | 8 | `2+2+2+2` / 4 | X/2/0/3 on 1/3/5/7 | 3, 6 | **CORRECTED / VERIFIED**. |
| `tala-khemta` | Grade 10 | ඛෙම්ටෝ තාලය (`ඛෙම්ටා` alias, N/A) | Khemta Tala (editorial, N/A) | 4 | `2+2` / 2 | X on 1; 0 on 3 | 7 | **CORRECTED / VERIFIED**; three aksharas per matra. |
| `tala-roopak` | Not in supplied list | **WITHHELD** | **WITHHELD** | **WITHHELD** | **WITHHELD** | **WITHHELD** | none | **NEEDS-REVIEW / QUARANTINED**. |

### 2.2 Exact theka and bol-to-matra fields

| Entity | `theka_si` | `bols[].bol_si` by matra | Evidence / disposition |
|---|---|---|---|
| `tala-dadra` | `ධා ධී නා \| ධා තී නා` | `ධා, ධී, නා, ධා, තී, නා` | Page 6, A. |
| `tala-keherwa` | `ධා ගේ න ත \| න ක ධ න` | `ධා, ගේ, න, ත, න, ක, ධ, න` | Pages 3, 6, A. |
| `tala-teental` | `ධා ධින් ධින් ධා \| ධා ධින් ධින් ධා \| ධා තින් තින් තා \| තා ධින් ධින් ධා` | 16 one-to-one cells | Pages 4–5, A. |
| `tala-jhaptal` | `ධී නා \| ධී ධී නා \| තී නා \| ධී ධී නා` | 10 one-to-one cells | Pages 2, 6, A; normalized spelling needs original-PDF visual confirmation. |
| `tala-deepchandi` | `ධා ධින් - \| ධා ධා ධින් - \| තා තින් - \| ධා ධා ධින් -` | 14 cells including rests | Pages 2, 4–5, A. |
| `tala-lawani` | `ධා ගේ \| න ත \| න ක \| ධ න` | `ධා, ගේ, න, ත, න, ක, ධ, න` | Pages 3, 6, A; exact table restored. |
| `tala-khemta` | `ධන්න ධනක \| තන්න ධනක` | `ධන්න, ධනක, තන්න, ධනක` | Page 7, A; four compound matra cells. |
| `tala-roopak` | **WITHHELD** | **WITHHELD** | No accepted evidence. |

### 2.3 Context, practice tempo, source, review, and publication fields

| Entity / field | Audited state | Quality | Disposition |
|---|---|---|---|
| Lawani school context | Not a Hindustani-system tala; prescribed for school use because two-matra divisions occur in school songs, local tit-rupa, and Western meters | Grade 11 page 24, A; separate `contextSourceReference` | **VERIFIED** and rendered to learners, without generic Hindustani framing. |
| Khemta laya context | Source says its laya is fast | A, page 7 | **VERIFIED** only as qualitative `fast`. |
| Other tempo/usage claims | Not established by cited pages | N/A | **WITHHELD** from curriculum claims. |
| `practiceTempoBpm` | Client-only visualizer/game defaults; UI explicitly discloses this and does not derive vilambit/madhya/drut labels | N/A | **PRACTICE DEFAULT**, not curriculum evidence. |
| Seven public `sourceReference` values | One `SRC-EPD-TB-G10` document and its own explicit pages | A | **CORRECTED**; embedded Grade 11 filenames removed. |
| Seven public `reviewMetadata` values | Explicit unknown/unverified | N/A | No SME/publication event claimed. |
| Seven public browse bands | `10-11`, containing evidenced Grade 10 | N/A | **PUBLIC**; no Grade 11 evidence inferred from the band. |
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
| `quiz-les-tala-dadra` | Grade 10 Dadra structure | Grade 10 fundamentals page 6 | **CORRECTED / PUBLIC**; stale Grade 7 citation removed. |
| Terminology review labels | `Unverified` / `Needs Review` | N/A | No undocumented SME/publication event. |

## 4. Unresolved evidence boundary

- Original PDFs are absent; visually ambiguous glyphs, layout, and OCR-normalized bol spelling remain `needs-review` where noted.
- Bhairav and Roopak raw values are retained for audit, but each musical field is separately withheld above.
- English transliterations and `practiceTempoBpm` are editorial/application values with `N/A` evidence quality.
- Earlier grades are not inferred from “previously studied” wording; they require exact source locators in a later phase.

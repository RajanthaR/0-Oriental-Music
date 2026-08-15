# Phase 2 Musical Core Field Audit Matrix

This document provides the exhaustive, field-level audit matrix for every Raga and Tala entity in the Swara Maga platform, evaluated strictly against the supplied canonical Grades 6–11 source corpus (`oriental_music_markdown/by-source`).

---

## 1. Canonical Ragas Field Audit Matrix

| Entity ID | Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|---|
| `raga-bilawal` | `name_si` | `"බිලාවල් රාගය (අල්හයියා බිලාවල්)"` | `"බිලාවල් රාගය"` | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Page 1 | A | **CORRECTED**: Removed Alhaiya Bilawal mismatch. School syllabus prescribes pure Shuddha Bilawal. |
| `raga-bilawal` | `arohana_si` | `"ස , රි , ග , ප , ධ , නි , ස̇"` | `"ස , රි , ග , ම , ප , ධ , නි , ස̇"` | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Page 1 | A | **CORRECTED**: Added missing Shuddha Madhyama (`ම`). Arohana has all 7 Shuddha notes. |
| `raga-bilawal` | `avarohana_si` | `"ස̇ , නි , ධ , ප , ම , ග , රි , ස"` | `"ස̇ , නි , ධ , ප , ම , ග , රි , ස"` | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Page 1 | A | **VERIFIED**: Complete 7-note descending scale. |
| `raga-bilawal` | `arohana_swaras` | `["S", "R", "G", "P", "D", "N", "S'"]` | `["S", "R", "G", "M", "P", "D", "N", "S'"]` | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Page 1 | A | **CORRECTED**: Added `"M"`. |
| `raga-bilawal` | `avarohana_swaras` | `["S'", "N", "D", "P", "M", "G", "R", "S"]` | `["S'", "N", "D", "P", "M", "G", "R", "S"]` | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Page 1 | A | **VERIFIED**: Correct 8-element array (including upper octave endpoint). |
| `raga-bilawal` | `jati_si` | `"ෂාඩව - සම්පූර්ණ"` | `"සම්පූර්ණ - සම්පූර්ණ (ස්වර 7 ම ශුද්ධ වේ)"` | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Page 2 | A | **CORRECTED**: With Madhyama present in Arohana, Jati is Sampurna-Sampurna. |
| `raga-bilawal` | `thata_si` | `"බිලාවල්"` | `"බිලාවල් ථාටය (සියලු ශුද්ධ ස්වර)"` | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Page 2 | A | **VERIFIED**: Canonical Janaka Thata. |
| `raga-bilawal` | `vadi_si` | `"ධ"` | `"ධෛවත (ධ)"` | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Page 2 | A | **VERIFIED**: Vadi is Dhaivata (ධ). |
| `raga-bilawal` | `samvadi_si` | `"ග"` | `"ගාන්ධාර (ග)"` | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Page 2 | A | **VERIFIED**: Samvadi is Gandhara (ග). |
| `raga-bilawal` | `pakad_si` | `"ග රි , ග ප , ධ , නි ස̇"` | `"ග රි , ග ප ධ නි ස̇"` | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Page 2 | A | **VERIFIED**: Canonical Mukhyangaya. |
| `raga-bilawal` | `time_si` | `"දිවා ප්‍රථම ප්‍රහරය"` | `"දිවා ප්‍රථම ප්‍රහරය (උදෑසන)"` | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Page 2 | A | **VERIFIED**: First prahara of the day. |
| `raga-bilawal` | `sourceReference` | `SRC-NIE-G1011-TG` (පිටුව 38) | `SRC-G11-RAGA-ID` (`sg11_emus_ chap3_raga_handunaganimu.pdf පිටු 1-2`) | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Pages 1–2 | A | **CORRECTED**: Mapped to exact Grade 11 raga identification document. |
| `raga-bhupali` | `all fields` | Grade 8-11 scale (`S R G P D S'`, Audav-Audav, Kalyan thata, Vadi Ga, Samvadi Dha) | Scale: `S R G P D S'`; Vadi: ග; Samvadi: ධ; Jati: ඖඩව-ඖඩව; Thata: කල්‍යාණ | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Pages 1–2 | A | **VERIFIED**: Confirmed against Grade 11 raga identification source. |
| `raga-kafi` | `all fields` | Grade 9-11 scale (`S R g M P D n S'`, Sampurna, Kafi thata, Vadi Pa, Samvadi Sa) | Scale: `S R g M P D n S'`; Vadi: ප; Samvadi: ස; Jati: සම්පූර්ණ; Thata: කාෆී | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Pages 1–2 | A | **VERIFIED**: Confirmed against Grade 11 raga identification source. |
| `raga-khamaj` | `all fields` | Grade 9-11 scale (`S G M P D N S'`, Shadav-Sampurna, Khamaj thata, Vadi Ga, Samvadi Ni) | Scale: `S G M P D N S'`; Vadi: ග; Samvadi: නි; Jati: ෂාඩව-සම්පූර්ණ; Thata: ඛමාජ් | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Pages 1–2 | A | **VERIFIED**: Confirmed against Grade 11 raga identification source. |
| `raga-bhimpalasi` | `all fields` | Grade 10-11 scale (`n. S g M P n S'`, Audav-Sampurna, Kafi thata, Vadi Ma, Samvadi Sa) | Scale: `n. S g M P n S'`; Vadi: ම; Samvadi: ස; Jati: ඖඩව-සම්පූර්ණ; Thata: කාෆී | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Pages 1–2 | A | **VERIFIED**: Confirmed against Grade 11 raga identification source. |
| `raga-yaman` | `all fields` | Grade 10-11 scale (`N. R G m P D N S'`, Sampurna, Kalyan thata, Vadi Ga, Samvadi Ni) | Scale: `N. R G m P D N S'`; Vadi: ග; Samvadi: නි; Jati: සම්පූර්ණ; Thata: කල්‍යාණ | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Pages 1–2 | A | **VERIFIED**: Confirmed against Grade 11 raga identification source. |
| `raga-bhairavi` | `all fields` | Grade 10-11 scale (`S r g M P d n S'`, Sampurna, Bhairavi thata, Vadi Ma, Samvadi Sa) | Scale: `S r g M P d n S'`; Vadi: ම; Samvadi: ස; Jati: සම්පූර්ණ; Thata: භෛරවී | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Pages 1–2 | A | **VERIFIED**: Confirmed against Grade 11 raga identification source. |
| `raga-bhairav` | `publicationState` | Quarantined in Prompt 1 | **QUARANTINED** | `grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`) | PDF Pages 1–2 | A | **RETAINED IN QUARANTINE**: Not established in the supplied prescribed Grade 6–11 raga syllabus evidence. |

---

## 2. Canonical Talas Field Audit Matrix

| Entity ID | Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|---|
| `tala-dadra` | `matras` | 6 | 6 | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Page 6 | A | **VERIFIED**: 6 matras. |
| `tala-dadra` | `vibhagCount` | 2 | 2 | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Page 6 | A | **VERIFIED**: 2 vibhagas of 3 matras each (3+3). |
| `tala-dadra` | `vibhagStructure`| `[3, 3]` | `[3, 3]` | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Page 6 | A | **VERIFIED**: 3+3 structure. |
| `tala-dadra` | `bols` | `["ධා", "ධින්", "නා", "ධා", "තින්", "නා"]` | `["ධා", "ධී", "නා", "ධා", "තී", "නා"]` | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Page 6 | A | **VERIFIED**: `ධා ධි/ධී නා \| ධා තූ/තී නා` canonical school theka. |
| `tala-dadra` | `sourceReference` | `SRC-NIE-G07-TG` (පිටුව 34) | `SRC-EPD-TB-G10` (`sg10_emus_chap1_mulikanga.pdf පිටුව 6`) | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Page 6 | A | **CORRECTED**: Replaced unverified Grade 7 citation with verified Grade 10 fundamentals. |
| `tala-lawani` | `matras` | 8 | 8 | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Pages 3, 6 | A | **VERIFIED**: 8 matras. |
| `tala-lawani` | `vibhagCount` | 4 | 4 | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Pages 3, 6 | A | **VERIFIED**: 4 vibhagas of 2 matras each (2+2+2+2). |
| `tala-lawani` | `vibhagStructure`| `[2, 2, 2, 2]` | `[2, 2, 2, 2]` | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Pages 3, 6 | A | **VERIFIED**: 2+2+2+2 structure with marks X, 2, 0, 3. |
| `tala-lawani` | `bols` | `["ධා", "ගේ", "න", "ත", "න", "ක", "ධ", "න"]` | `["ධා", "ගේ", "න", "ත", "න", "ක", "ධ", "න"]` | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Pages 3, 6 | A | **VERIFIED**: Theka matches Keherwa strokes but division is in 2-matra bars. |
| `tala-lawani` | `context` | Generic North Indian classification | Documented Sri Lankan school curriculum adaptation for 2-matra songs | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Pages 3, 6 | A | **CORRECTED**: Documented official school context in `changeNotes`. |
| `tala-lawani` | `sourceReference` | `SRC-EPD-TB-G11` (පිටුව 47) | `SRC-EPD-TB-G10` (`sg10_emus_chap1_mulikanga.pdf පිටු 3, 6`) | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Pages 3, 6 | A | **CORRECTED**: Reconciled citation to Grade 10 fundamentals. |
| `tala-keherwa` | `all fields` | 8 matras, 2 vibhagas (4+4), X 0, `ධා ගෙ නා තින් \| නා ක ධින් නා` | 8 matras, 2 vibhagas (4+4), X 0, `ධා ගෙ නා තින් \| නා ක ධින් නා` | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Pages 3, 6 | A | **VERIFIED**: Confirmed against Grade 10 fundamentals. |
| `tala-teental` | `all fields` | 16 matras, 4 vibhagas (4+4+4+4), X 2 0 3, `ධා ධින් ධින් ධා...` | 16 matras, 4 vibhagas (4+4+4+4), X 2 0 3, `ධා ධින් ධින් ධා...` | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Pages 4–5 | A | **VERIFIED**: Confirmed against Grade 10 fundamentals. |
| `tala-jhaptal` | `all fields` | 10 matras, 4 vibhagas (2+3+2+3), X 2 0 3, `ධී නා \| ධී ධී නා...` | 10 matras, 4 vibhagas (2+3+2+3), X 2 0 3, `ධී නා \| ධී ධී නා...` | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Pages 2, 6 | A | **VERIFIED**: Confirmed against Grade 10 fundamentals. |
| `tala-deepchandi`| `all fields` | 14 matras, 4 vibhagas (3+4+3+4), X 2 0 3, `ධා ධින් - \| ධා ධා ධින් -...` | 14 matras, 4 vibhagas (3+4+3+4), X 2 0 3, `ධා ධින් - \| ධා ධා ධින් -...` | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Pages 2, 4, 5 | A | **VERIFIED**: Confirmed against Grade 10 fundamentals. |
| `tala-khemta` | `all fields` | 6 matras, 2 vibhagas (3+3), X 0, `ධි ධි නා \| ති ති නා` | 6 matras, 2 vibhagas (3+3), X 0, `ධි ධි නා \| ති ති නා` | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Pages 6–7 | A | **VERIFIED**: Confirmed against Grade 10 fundamentals. |
| `tala-roopak` | `publicationState` | Quarantined in Prompt 1 | **QUARANTINED** | `grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`) | PDF Pages 1–7 | A | **RETAINED IN QUARANTINE**: Not established in the supplied prescribed Grade 6–11 school tala syllabus evidence. |

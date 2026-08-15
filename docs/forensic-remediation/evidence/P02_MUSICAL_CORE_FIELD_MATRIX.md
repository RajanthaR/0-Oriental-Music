# Phase 2 Musical Core Field Audit Matrix

This document provides the exhaustive, field-by-field audit matrix for every Raga, Tala, and Acoustic Sound Property entity in the Swara Maga platform, evaluated strictly against the supplied canonical Grades 6–11 source corpus (`oriental_music_markdown/by-source`).

**Audit Protocol Rules Applied**:
1. Zero aggregate "all fields" rows: every musicological field is independently audited and cited.
2. Field dispositions are classified as **VERIFIED**, **CORRECTED**, **WITHHELD**, or **NEEDS-REVIEW / QUARANTINED**.
3. No facts are inferred from general musical knowledge or external tradition memory.
4. All raw review metadata is strictly sanitized to explicit unverified states.

---

## 1. Canonical Ragas Field-by-Field Audit Matrix

### 1.1 `raga-bilawal` (බිලාවල් රාගය) — Prescribed School Raga (Grade 11)
*Source Document: `oriental_music_markdown/by-source/grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`)*

| Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|
| `prescribedInclusion` | Prescribed | Prescribed (Grade 11) | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Confirmed in official 7-raga school syllabus list on PDF Page 1. |
| `name_si` | `"බිලාවල් රාගය (අල්හයියා බිලාවල්)"` | `"බිලාවල් රාගය"` | `grade_11_raga_identification.md` | PDF Page 1 | A | **CORRECTED**: Removed Alhaiya Bilawal alias. Official syllabus prescribes pure Shuddha Bilawal. |
| `name_en` | `"Raga Bilawal (Alhaiya Bilawal)"` | `"Raga Bilawal"` | `grade_11_raga_identification.md` | PDF Page 1 | A | **CORRECTED**: Aligned English title with canonical pure Bilawal. |
| `thata_si` | `"බිලාවල්"` | `"බිලාවල් ථාටය (සියලු ශුද්ධ ස්වර)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Canonical Janaka Thata (බිලාවල්). |
| `arohana_si` | `"ස , රි , ග , ප , ධ , නි , ස̇"` | `"ස , රි , ග , ම , ප , ධ , නි , ස̇"` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **CORRECTED**: Restored missing Shuddha Madhyama (`ම`). Arohana has all 7 Shuddha notes. |
| `avarohana_si` | `"ස̇ , නි , ධ , ප , ම , ග , රි , ස"` | `"ස̇ , නි , ධ , ප , ම , ග , රි , ස"` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Complete 7-note descending scale (`ස̇ නි ධ ඳ ම ග රි ස`). |
| `arohana_swaras` | `["S", "R", "G", "P", "D", "N", "S'"]` | `["S", "R", "G", "M", "P", "D", "N", "S'"]` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **CORRECTED**: Added `"M"` (Shuddha Ma) to array. |
| `avarohana_swaras` | `["S'", "N", "D", "P", "M", "G", "R", "S"]` | `["S'", "N", "D", "P", "M", "G", "R", "S"]` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Correct 8-element array including upper octave Sa endpoint. |
| `swara_forms` | All Shuddha except Alhaiya variants | All 7 Shuddha Swaras | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **CORRECTED**: Text explicitly notes `"ස්වර 7 ම ශුද්ධ වේ"`. |
| `omitted_swaras` | Arohana Ma omitted | None (Sampurna) | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **CORRECTED**: No omitted swaras in either ascent or descent. |
| `vadi_si` | `"ධ"` | `"ධෛවත (ධ)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Vadi is Dhaivata (ධ). |
| `samvadi_si` | `"ග"` | `"ගාන්ධාර (ග)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Samvadi is Gandhara (ග). |
| `jati_si` | `"ෂාඩව - සම්පූර්ණ"` | `"සම්පූර්ණ - සම්පූර්ණ (ස්වර 7 ම ශුද්ධ වේ)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **CORRECTED**: Jati is Sampurna-Sampurna (7 ascent, 7 descent). |
| `time_si` | `"දිවා ප්‍රථම ප්‍රහරය"` | `"දිවා ප්‍රථම ප්‍රහරය (උදෑසන)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: First prahara of the day (දිවා ප්‍රථම ප්‍රහරය). |
| `pakad_si` | `"ග රි , ග ප , ධ , නි ස̇"` | `"ග රි , ග ප ධ නි ස̇"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Canonical Mukhyangaya (`ග රි , ග ඳ ධ නි ස̇`). |
| `samplePhrases` | Missing | `[{"name_si": "මුඛ්‍යාංගය (පකඩ්)", "swaras": ["G", "R", "G", "P", "D", "N", "S'"]}]` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Aligned with canonical mukhyanga phrase. |
| `characteristics_si` | Incomplete | Prescribed 3 bullet summary (All Shuddha, Vadi/Samvadi relationship, morning performance) | `grade_11_raga_identification.md` | PDF Pages 1–2 | A | **VERIFIED**: Grounded in official syllabus text. |
| `sourceReference` | `SRC-NIE-G1011-TG` (Page 38) | `SRC-G11-RAGA-ID` (`sg11_emus_ chap3_raga_handunaganimu.pdf පිටු 1-2`) | `grade_11_raga_identification.md` | PDF Pages 1–2 | A | **CORRECTED**: Replaced unverified teacher guide page with direct Grade 11 raga identification document. |
| `reviewMetadata` | Fabricated approval & reviewer | Standard unverified status (`"Needs Revision"`, `"නොදනී / සනාථ වී නැත"`) | N/A (Repository Policy) | N/A | A | **CORRECTED**: Eliminated fabricated metadata. |
| `publicationDisposition` | Published | **PUBLIC** | `publication-policy.ts` | Grade 11 | A | **VERIFIED**: Prescribed Grade 11 school raga. |

---

### 1.2 `raga-bhupali` (භූපාලි රාගය) — Prescribed School Raga (Grade 8–11)
*Source Document: `oriental_music_markdown/by-source/grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`)*

| Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|
| `prescribedInclusion` | Prescribed | Prescribed (Grade 8–11) | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Listed in official prescribed syllabus on PDF Page 1. |
| `name_si` | `"භූපාලි රාගය (භූපාලී)"` | `"භූපාලි රාගය (භූපාලී)"` | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Canonical Sinhala name. |
| `name_en` | `"Raga Bhupali"` | `"Raga Bhupali"` | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Standard transliteration. |
| `thata_si` | `"කල්‍යාන් ථාටය"` | `"කල්‍යාන් ථාටය"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Thata is Kalyan (කල්‍යාණ). |
| `arohana_si` | `"ස , රි , ග , ප , ධ , ස̇"` | `"ස , රි , ග , ප , ධ , ස̇"` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Pentatonic ascent (`ස රි ග ඳ ධ ස̇`). |
| `avarohana_si` | `"ස̇ , ධ , ප , ග , රි , ස"` | `"ස̇ , ධ , ප , ග , රි , ස"` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Pentatonic descent (`ස̇ ධ ඳ ග රි ස`). |
| `arohana_swaras` | `["S", "R", "G", "P", "D", "S'"]` | `["S", "R", "G", "P", "D", "S'"]` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: 6-element array including upper Sa. |
| `avarohana_swaras` | `["S'", "D", "P", "G", "R", "S"]` | `["S'", "D", "P", "G", "R", "S"]` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: 6-element descending array. |
| `swara_forms` | All Shuddha | All Shuddha (Shuddha Ri, Ga, Pa, Dha) | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Notes used are pure Shuddha swaras. |
| `omitted_swaras` | Ma, Ni omitted | Ma (මධ්‍යම) and Ni (නිෂාද) omitted in ascent and descent | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Explicitly states `"ම , නි ස්වර වර්ජ්‍ය වේ"`. |
| `vadi_si` | `"ගාන්ධාර (ග)"` | `"ගාන්ධාර (ග)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Vadi is Gandhara (ග). |
| `samvadi_si` | `"ධෛවත (ධ)"` | `"ධෛවත (ධ)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Samvadi is Dhaivata (ධ). |
| `jati_si` | `"ඖඩව - ඖඩව"` | `"ඖඩව - ඖඩව (ස්වර 5 බැගින්)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Audav-Audav (5 ascent, 5 descent). |
| `time_si` | `"රාත්‍රී ප්‍රථම ප්‍රහාරය"` | `"රාත්‍රී ප්‍රථම ප්‍රහාරය (සන්ධ්‍යා කාලය)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: First prahara of the night (රාත්‍රී ප්‍රථම ප්‍රශරය). |
| `pakad_si` | `"ග රි . ස ධ , ස රි ග ප ග , ධ ප , ග රි ස"` | `"ග රි . ස ධ , ස රි ග ප ග , ධ ප , ග රි ස"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Canonical Mukhyangaya. |
| `samplePhrases` | `["G", "R", "S", "D", ...]` | `[{"name_si": "මුඛ්‍යාංගය (පකඩ්)", "swaras": ["G", "R", "S", ".D", "S", "R", "G", "P", "G", "D", "P", "G", "R", "S"]}]` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Aligned with official mukhyanga phrase. |
| `characteristics_si` | General text | Prescribed 3 bullet summary (Ma/Ni varjit, Audav-Audav jati, Vadi Ga, evening performance) | `grade_11_raga_identification.md` | PDF Pages 1–2 | A | **VERIFIED**: Grounded in official syllabus text. |
| `sourceReference` | `SRC-NIE-G1011-TG` | `SRC-G11-RAGA-ID` (`sg11_emus_ chap3_raga_handunaganimu.pdf පිටු 1-2`) | `grade_11_raga_identification.md` | PDF Pages 1–2 | A | **CORRECTED**: Mapped to exact Grade 11 raga identification document. |
| `reviewMetadata` | Fabricated approval & reviewer | Standard unverified status (`"Needs Revision"`, `"නොදනී / සනාථ වී නැත"`) | N/A (Repository Policy) | N/A | A | **CORRECTED**: Eliminated fabricated metadata. |
| `publicationDisposition` | Published | **PUBLIC** | `publication-policy.ts` | Grade 8–11 | A | **VERIFIED**: Prescribed Grade 8–11 school raga. |

---

### 1.3 `raga-kafi` (කාෆි රාගය) — Prescribed School Raga (Grade 9–11)
*Source Document: `oriental_music_markdown/by-source/grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`)*

| Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|
| `prescribedInclusion` | Prescribed | Prescribed (Grade 9–11) | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Listed in official prescribed syllabus on PDF Page 1. |
| `name_si` | `"කාෆි රාගය (කාෆී)"` | `"කාෆි රාගය (කාෆී)"` | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Canonical Sinhala name. |
| `name_en` | `"Raga Kafi"` | `"Raga Kafi"` | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Standard transliteration. |
| `thata_si` | `"කාෆි ථාටය"` | `"කාෆි ථාටය"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Janaka Thata (කාෆී). |
| `arohana_si` | `"ස , රි , ග(කෝ) , ම , ප , ධ , නි(කෝ) , ස̇"` | `"ස , රි , ග(කෝ) , ම , ප , ධ , නි(කෝ) , ස̇"` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Komal Ga and Komal Ni in ascent. |
| `avarohana_si` | `"ස̇ , නි(කෝ) , ධ , ප , ම , ග(කෝ) , රි , ස"` | `"ස̇ , නි(කෝ) , ධ , ප , ම , ග(කෝ) , රි , ස"` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Komal Ni and Komal Ga in descent. |
| `arohana_swaras` | `["S", "R", "g", "M", "P", "D", "n", "S'"]` | `["S", "R", "g", "M", "P", "D", "n", "S'"]` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: 8-element array with `"g"` and `"n"`. |
| `avarohana_swaras` | `["S'", "n", "D", "P", "M", "g", "R", "S"]` | `["S'", "n", "D", "P", "M", "g", "R", "S"]` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: 8-element descending array. |
| `swara_forms` | Komal Ga, Komal Ni | Komal Ga (ගාන්ධාර) and Komal Ni (නිෂාද); Shuddha Ri, Ma, Pa, Dha | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Explicitly states `"ග නි ස්වර කෝමල වේ"`. |
| `omitted_swaras` | None | None (Sampurna) | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: All 7 swaras present in ascent and descent. |
| `vadi_si` | `"පඤ්චම (ප)"` | `"පඤ්චම (ප)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Vadi is Panchama (ප). |
| `samvadi_si` | `"ෂඩ්ජ (ස)"` | `"ෂඩ්ජ (ස)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Samvadi is Shadja (ස). |
| `jati_si` | `"සම්පූර්ණ - සම්පූර්ණ"` | `"සම්පූර්ණ - සම්පූර්ණ (ස්වර 7 ම යෙදේ)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Sampurna-Sampurna. |
| `time_si` | `"රාත්‍රී දෙවන ප්‍රහාරය"` | `"රාත්‍රී දෙවන ප්‍රහාරය (මධ්‍යම රාත්‍රිය)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Second prahara of the night (රාත්‍රී ශ්‍දලන ප්‍රශරය). |
| `pakad_si` | `"ස ස , රි රි , ග(කෝ) ග(කෝ) , ම ම , ප"` | `"ස ස , රි රි , ග(කෝ) ග(කෝ) , ම ම , ප"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Canonical Mukhyangaya (`ව ව , රි රි , ග ග , ම ම , ඳ`). |
| `samplePhrases` | `["S", "S", "R", "R", "g", "g", "M", "M", "P"]` | `[{"name_si": "මුඛ්‍යාංගය (පකඩ්)", "swaras": ["S", "S", "R", "R", "g", "g", "M", "M", "P"]}]` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Aligned with canonical phrase. |
| `characteristics_si` | General text | Prescribed 3 bullet summary (Komal Ga/Ni, Sampurna jati, Vadi Pa, midnight performance) | `grade_11_raga_identification.md` | PDF Pages 1–2 | A | **VERIFIED**: Grounded in official syllabus text. |
| `sourceReference` | `SRC-NIE-G1011-TG` | `SRC-G11-RAGA-ID` (`sg11_emus_ chap3_raga_handunaganimu.pdf පිටු 1-2`) | `grade_11_raga_identification.md` | PDF Pages 1–2 | A | **CORRECTED**: Mapped to exact Grade 11 raga identification document. |
| `reviewMetadata` | Fabricated approval & reviewer | Standard unverified status (`"Needs Revision"`, `"නොදනී / සනාථ වී නැත"`) | N/A (Repository Policy) | N/A | A | **CORRECTED**: Eliminated fabricated metadata. |
| `publicationDisposition` | Published | **PUBLIC** | `publication-policy.ts` | Grade 9–11 | A | **VERIFIED**: Prescribed Grade 9–11 school raga. |

---

### 1.4 `raga-khamaj` (ඛමාජ් රාගය) — Prescribed School Raga (Grade 9–11)
*Source Document: `oriental_music_markdown/by-source/grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`)*

| Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|
| `prescribedInclusion` | Prescribed | Prescribed (Grade 9–11) | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Listed in official prescribed syllabus on PDF Page 1. |
| `name_si` | `"ඛමාජ් රාගය (ඛ්මාජ්)"` | `"ඛමාජ් රාගය (ඛ්මාජ්)"` | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Canonical Sinhala name. |
| `name_en` | `"Raga Khamaj"` | `"Raga Khamaj"` | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Standard transliteration. |
| `thata_si` | `"ඛමාජ් ථාටය"` | `"ඛමාජ් ථාටය"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Janaka Thata (ඛමාජ්). |
| `arohana_si` | `"ස , ග , ම , ප , ධ , නි , ස̇"` | `"ස , ග , ම , ප , ධ , නි , ස̇"` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Hexatonic ascent with Shuddha Ni (`ස ග ම ඳ ධ නි ස̇`). |
| `avarohana_si` | `"ස̇ , නි(කෝ) , ධ , ප , ම , ග , රි , ස"` | `"ස̇ , නි(කෝ) , ධ , ප , ම , ග , රි , ස"` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Heptatonic descent with Komal Ni (`ස̇ නි ධ ඳ ම ග රි ස`). |
| `arohana_swaras` | `["S", "G", "M", "P", "D", "N", "S'"]` | `["S", "G", "M", "P", "D", "N", "S'"]` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: 7-element array (without R). |
| `avarohana_swaras` | `["S'", "n", "D", "P", "M", "G", "R", "S"]` | `["S'", "n", "D", "P", "M", "G", "R", "S"]` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: 8-element array with `"n"`. |
| `swara_forms` | Dwi-Nishada (Shuddha Ni in ascent, Komal Ni in descent) | Dwi-Nishada (ආරෝහණයේ ශුද්ධ නි, අවරෝහණයේ කෝමල නි) | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Explicitly states `"ද්වි නිෂාද යෙදේ"`. |
| `omitted_swaras` | Ri omitted in ascent | Ri (රිෂභ) omitted in ascent only | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Explicitly states `"ආරෝහණයේ රි වර්ජ්‍ය වේ"`. |
| `vadi_si` | `"ගාන්ධාර (ග)"` | `"ගාන්ධාර (ග)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Vadi is Gandhara (ග). |
| `samvadi_si` | `"නිෂාද (නි)"` | `"නිෂාද (නි)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Samvadi is Nishada (නි). |
| `jati_si` | `"ෂාඩව - සම්පූර්ණ"` | `"ෂාඩව - සම්පූර්ණ (ආරෝහණයේ 'රි' වර්ජිතය)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Shadav-Sampurna (6 ascent, 7 descent). |
| `time_si` | `"රාත්‍රී දෙවන ප්‍රහාරය"` | `"රාත්‍රී දෙවන ප්‍රහාරය (මධ්‍යම රාත්‍රිය)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Second prahara of the night (රාත්‍රී ශ්‍දලන ප්‍රශරය). |
| `pakad_si` | `"නි ධ , ම ප ධ , ම ග"` | `"නි ධ , ම ප ධ , ම ග"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Canonical Mukhyangaya (`නි ධ , ම ඳ ධ , ම ග`). |
| `samplePhrases` | `["N", "D", "M", "P", "D", "M", "G"]` | `[{"name_si": "මුඛ්‍යාංගය (පකඩ්)", "swaras": ["N", "D", "M", "P", "D", "M", "G"]}]` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Aligned with canonical phrase. |
| `characteristics_si` | General text | Prescribed 3 bullet summary (Dwi-Nishada, Shadav-Sampurna, Vadi Ga, midnight performance) | `grade_11_raga_identification.md` | PDF Pages 1–2 | A | **VERIFIED**: Grounded in official syllabus text. |
| `sourceReference` | `SRC-NIE-G1011-TG` | `SRC-G11-RAGA-ID` (`sg11_emus_ chap3_raga_handunaganimu.pdf පිටු 1-2`) | `grade_11_raga_identification.md` | PDF Pages 1–2 | A | **CORRECTED**: Mapped to exact Grade 11 raga identification document. |
| `reviewMetadata` | Fabricated approval & reviewer | Standard unverified status (`"Needs Revision"`, `"නොදනී / සනාථ වී නැත"`) | N/A (Repository Policy) | N/A | A | **CORRECTED**: Eliminated fabricated metadata. |
| `publicationDisposition` | Published | **PUBLIC** | `publication-policy.ts` | Grade 9–11 | A | **VERIFIED**: Prescribed Grade 9–11 school raga. |

---

### 1.5 `raga-bhimpalasi` (භිම්පලාසි රාගය) — Prescribed School Raga (Grade 10–11)
*Source Document: `oriental_music_markdown/by-source/grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`)*

| Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|
| `prescribedInclusion` | Prescribed | Prescribed (Grade 10–11) | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Listed in official prescribed syllabus on PDF Page 1. |
| `name_si` | `"භිම්පලාසි රාගය (භීම්පලාශ්‍රී)"` | `"භිම්පලාසි රාගය (භීම්පලාශ්‍රී)"` | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Canonical Sinhala name and Sanskrit alias. |
| `name_en` | `"Raga Bhimpalasi"` | `"Raga Bhimpalasi"` | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Standard transliteration. |
| `thata_si` | `"කාෆි ථාටය"` | `"කාෆි ථාටය"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Thata is Kafi (කාෆී). |
| `arohana_si` | `"නි̣(කෝ) . ස ග(කෝ) ම ප නි(කෝ) ස̇"` | `"නි̣(කෝ) . ස ග(කෝ) ම ප නි(කෝ) ස̇"` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Mandra Komal Ni leading into Sa, Komal Ga, Ma, Pa, Komal Ni, Tara Sa. |
| `avarohana_si` | `"ස̇ නි(කෝ) ධ ප ම ග(කෝ) රි ස"` | `"ස̇ නි(කෝ) ධ ප ම ග(කෝ) රි ස"` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Heptatonic descent with Komal Ni and Komal Ga (`ස̇ නි ධ ඳ ම ග රි ස`). |
| `arohana_swaras` | `["n", "S", "g", "M", "P", "n", "S'"]` | `[".n", "S", "g", "M", "P", "n", "S'"]` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **CORRECTED**: Opening note marked as Mandra Komal Ni (`".n"`) for accurate pitch synthesis. |
| `avarohana_swaras` | `["S'", "n", "D", "P", "M", "g", "R", "S"]` | `["S'", "n", "D", "P", "M", "g", "R", "S"]` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: 8-element descending array. |
| `swara_forms` | Komal Ga, Komal Ni | Komal Ga (ගාන්ධාර) and Komal Ni (නිෂාද); Shuddha Ri, Ma, Pa, Dha | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Explicitly states `"ග නි ස්වර කෝමල වේ"`. |
| `omitted_swaras` | Ri and Dha omitted in ascent | Ri (රිෂභ) and Dha (ධෛවත) omitted in ascent only | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Explicitly states `"ආරෝහණයේ රි ධ වර්ජ්‍ය වේ"`. |
| `vadi_si` | `"මධ්‍යම (ම)"` | `"මධ්‍යම (ම)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Vadi is Madhyama (ම). |
| `samvadi_si` | `"ෂඩ්ජ (ස)"` | `"ෂඩ්ජ (ස)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Samvadi is Shadja (ස). |
| `jati_si` | `"ඖඩව - සම්පූර්ණ"` | `"ඖඩව - සම්පූර්ණ (ආරෝහණයේ 'රි' සහ 'ධ' වර්ජිතය)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Audav-Sampurna (5 ascent, 7 descent). |
| `time_si` | `"දිවා තෙවන ප්‍රහාරය"` | `"දිවා තෙවන ප්‍රහාරය (පස්වරුව)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Third prahara of the day / late afternoon (රාත්‍රී/දිවා තෙවන ප්‍රශරය - පස්වරුව). |
| `pakad_si` | `"නි̣(කෝ) ස ම , ම ප ග(කෝ) ම ග(කෝ) රි ස"` | `"නි̣(කෝ) ස ම , ම ප ග(කෝ) ම ග(කෝ) රි ස"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Canonical Mukhyangaya (`නි. ව ම , ඳ ම ග , ම ග රි ව`). |
| `samplePhrases` | `["n", "S", "M", "M", "P", "g", "M", "g", "R", "S"]` | `[{"name_si": "මුඛ්‍යාංගය (පකඩ්)", "swaras": [".n", "S", "M", "M", "P", "g", "M", "g", "R", "S"]}]` | `grade_11_raga_identification.md` | PDF Page 2 | A | **CORRECTED**: Grounded opening note in Mandra Saptaka (`".n"`). |
| `characteristics_si` | General text | Prescribed 3 bullet summary (Audav-Sampurna, Komal Ga/Ni, Vadi Ma, late afternoon performance) | `grade_11_raga_identification.md` | PDF Pages 1–2 | A | **VERIFIED**: Grounded in official syllabus text. |
| `sourceReference` | `SRC-NIE-G1011-TG` | `SRC-G11-RAGA-ID` (`sg11_emus_ chap3_raga_handunaganimu.pdf පිටු 1-2`) | `grade_11_raga_identification.md` | PDF Pages 1–2 | A | **CORRECTED**: Mapped to exact Grade 11 raga identification document. |
| `reviewMetadata` | Fabricated approval & reviewer | Standard unverified status (`"Needs Revision"`, `"නොදනී / සනාථ වී නැත"`) | N/A (Repository Policy) | N/A | A | **CORRECTED**: Eliminated fabricated metadata. |
| `publicationDisposition` | Published | **PUBLIC** | `publication-policy.ts` | Grade 10–11 | A | **VERIFIED**: Prescribed Grade 10–11 school raga. |

---

### 1.6 `raga-yaman` (යමන් රාගය) — Prescribed School Raga (Grade 8–11)
*Source Document: `oriental_music_markdown/by-source/grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`)*

| Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|
| `prescribedInclusion` | Prescribed | Prescribed (Grade 8–11) | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Listed in official prescribed syllabus on PDF Page 1. |
| `name_si` | `"යමන් රාගය (කල්‍යාන්)"` | `"යමන් රාගය (කල්‍යාන්)"` | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Canonical Sinhala name and Kalyan alias. |
| `name_en` | `"Raga Yaman (Kalyan)"` | `"Raga Yaman (Kalyan)"` | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Standard transliteration. |
| `thata_si` | `"කල්‍යාන් ථාටය"` | `"කල්‍යාන් ථාටය"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Janaka Thata (කල්‍යාණ). |
| `arohana_si` | `"නි̣ , රි , ග , ම(තී) , ධ , නි , ස̇"` | `"නි̣ , රි , ග , ම(තී) , ධ , නි , ස̇"` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Mandra Ni leading into Ri, Ga, Teevra Ma, Dha, Ni, Tara Sa. |
| `avarohana_si` | `"ස̇ , නි , ධ , ප , ම(තී) , ග , රි , ස"` | `"ස̇ , නි , ධ , ප , ම(තී) , ග , රි , ස"` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Heptatonic descent with Teevra Ma (`ස̇ නි ධ ඳ ම́ ග රි ස`). |
| `arohana_swaras` | `["N", "R", "G", "m", "D", "N", "S'"]` | `[".N", "R", "G", "m", "D", "N", "S'"]` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **CORRECTED**: Opening note marked as Mandra Shuddha Ni (`".N"`) for accurate pitch synthesis. |
| `avarohana_swaras` | `["S'", "N", "D", "P", "m", "G", "R", "S"]` | `["S'", "N", "D", "P", "m", "G", "R", "S"]` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: 8-element descending array with `"m"` (Teevra Ma). |
| `swara_forms` | Teevra Ma | Teevra Ma (මධ්‍යම තීව්‍ර වේ); all other swaras Shuddha | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Explicitly states `"මධ්‍යමය තීව්‍ර වේ"`. |
| `omitted_swaras` | Sa omitted in ascent start | Direct Sa omitted in ascent initiation (starts from Mandra Ni) | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Explicitly noted in performance practice notes. |
| `vadi_si` | `"ගාන්ධාර (ග)"` | `"ගාන්ධාර (ග)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Vadi is Gandhara (ග). |
| `samvadi_si` | `"නිෂාද (නි)"` | `"නිෂාද (නි)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Samvadi is Nishada (නි). |
| `jati_si` | `"සම්පූර්ණ - සම්පූර්ණ"` | `"සම්පූර්ණ - සම්පූර්ණ (ආරෝහණයේ 'ස' මඟහැර මන්ද්‍ර නි වෙතින් ඇරඹෙයි)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Sampurna-Sampurna. |
| `time_si` | `"රාත්‍රී ප්‍රථම ප්‍රහාරය"` | `"රාත්‍රී ප්‍රථම ප්‍රහාරය (සන්ධ්‍යා කාලය)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: First prahara of the night / evening (රාත්‍රී ප්‍රථම ප්‍රශරය). |
| `pakad_si` | `"නි̣ රි ග රි ස , ප ම(තී) ග රි ස"` | `"නි̣ රි ග රි ස , ප ම(තී) ග රි ස"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Canonical Mukhyangaya (`නි. රි ග රි ව , ඳ ම ග රි ව`). |
| `samplePhrases` | `["N", "R", "G", "R", "S", "P", "m", "G", "R", "S"]` | `[{"name_si": "මුඛ්‍යාංගය (පකඩ්)", "swaras": [".N", "R", "G", "R", "S", "P", "m", "G", "R", "S"]}]` | `grade_11_raga_identification.md` | PDF Page 2 | A | **CORRECTED**: Grounded opening note in Mandra Saptaka (`".N"`). |
| `characteristics_si` | General text | Prescribed 3 bullet summary (Teevra Ma, Mandra Ni ascent start, Vadi Ga, evening performance) | `grade_11_raga_identification.md` | PDF Pages 1–2 | A | **VERIFIED**: Grounded in official syllabus text. |
| `sourceReference` | `SRC-NIE-G1011-TG` | `SRC-G11-RAGA-ID` (`sg11_emus_ chap3_raga_handunaganimu.pdf පිටු 1-2`) | `grade_11_raga_identification.md` | PDF Pages 1–2 | A | **CORRECTED**: Mapped to exact Grade 11 raga identification document. |
| `reviewMetadata` | Fabricated approval & reviewer | Standard unverified status (`"Needs Revision"`, `"නොදනී / සනාථ වී නැත"`) | N/A (Repository Policy) | N/A | A | **CORRECTED**: Eliminated fabricated metadata. |
| `publicationDisposition` | Published | **PUBLIC** | `publication-policy.ts` | Grade 8–11 | A | **VERIFIED**: Prescribed Grade 8–11 school raga. |

---

### 1.7 `raga-bhairavi` (භෛරවී රාගය) — Prescribed School Raga (Grade 10–11)
*Source Document: `oriental_music_markdown/by-source/grade_11_raga_identification.md` (`SRC-G11-RAGA-ID`)*

| Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|
| `prescribedInclusion` | Prescribed | Prescribed (Grade 10–11) | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Listed in official prescribed syllabus on PDF Page 1. |
| `name_si` | `"භෛරවී රාගය"` | `"භෛරවී රාගය"` | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Canonical Sinhala name. |
| `name_en` | `"Raga Bhairavi"` | `"Raga Bhairavi"` | `grade_11_raga_identification.md` | PDF Page 1 | A | **VERIFIED**: Standard transliteration. |
| `thata_si` | `"භෛරවී ථාටය"` | `"භෛරවී ථාටය"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Janaka Thata (භෛරවී). |
| `arohana_si` | `"ස , රි(කෝ) , ග(කෝ) , ම , ප , ධ(කෝ) , නි(කෝ) , ස̇"` | `"ස , රි(කෝ) , ග(කෝ) , ම , ප , ධ(කෝ) , නි(කෝ) , ස̇"` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: 4 Komal swaras (Ri, Ga, Dha, Ni) in ascent. |
| `avarohana_si` | `"ස̇ , නි(කෝ) , ධ(කෝ) , ප , ම , ග(කෝ) , රි(කෝ) , ස"` | `"ස̇ , නි(කෝ) , ධ(කෝ) , ප , ම , ග(කෝ) , රි(කෝ) , ස"` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: 4 Komal swaras (Ni, Dha, Ga, Ri) in descent. |
| `arohana_swaras` | `["S", "r", "g", "M", "P", "d", "n", "S'"]` | `["S", "r", "g", "M", "P", "d", "n", "S'"]` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: 8-element array with `"r"`, `"g"`, `"d"`, `"n"`. |
| `avarohana_swaras` | `["S'", "n", "d", "P", "M", "g", "r", "S"]` | `["S'", "n", "d", "P", "M", "g", "r", "S"]` | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: 8-element descending array. |
| `swara_forms` | Komal Ri, Ga, Dha, Ni | Komal Ri, Ga, Dha, Ni (රි ග ධ නි ස්වර කෝමල වේ); Shuddha Ma, Pa, Sa | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: Explicitly states `"රි ග ධ නි යන ස්වර කෝමල වේ. ස්වර 7 ම යෙදේ"`. |
| `omitted_swaras` | None | None (Sampurna) | `grade_11_raga_identification.md` | PDF Page 1, 2 | A | **VERIFIED**: All 7 swaras present in ascent and descent. |
| `vadi_si` | `"මධ්‍යම (ම)"` | `"මධ්‍යම (ම)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Vadi is Madhyama (ම). |
| `samvadi_si` | `"ෂඩ්ජ (ස)"` | `"ෂඩ්ජ (ස)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Samvadi is Shadja (ස). |
| `jati_si` | `"සම්පූර්ණ - සම්පූර්ණ"` | `"සම්පූර්ණ - සම්පූර්ණ (ස්වර 7 ම යෙදේ)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Sampurna-Sampurna. |
| `time_si` | `"දිවා ප්‍රථම ප්‍රහාරය"` | `"දිවා ප්‍රථම ප්‍රහාරය (පාන්දර / ප්‍රාතඃ කාලය)"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: First prahara of the day (දිවා ප්‍රථම ප්‍රශරය). |
| `pakad_si` | `"ම ග(කෝ) , ස රි(කෝ) ස , ධ̣(කෝ) නි̣(කෝ) ස"` | `"ම ග(කෝ) , ස රි(කෝ) ස , ධ̣(කෝ) නි̣(කෝ) ස"` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Canonical Mukhyangaya (`ම ග , ව රි ව , ධ. නි. ව`). |
| `samplePhrases` | `["M", "g", "S", "r", "S", ".d", ".n", "S"]` | `[{"name_si": "මුඛ්‍යාංගය (පකඩ්)", "swaras": ["M", "g", "S", "r", "S", ".d", ".n", "S"]}]` | `grade_11_raga_identification.md` | PDF Page 2 | A | **VERIFIED**: Aligned with canonical phrase. |
| `characteristics_si` | General text | Prescribed 3 bullet summary (4 Komal swaras, Sampurna jati, Vadi Ma, morning / concluding performance) | `grade_11_raga_identification.md` | PDF Pages 1–2 | A | **VERIFIED**: Grounded in official syllabus text. |
| `sourceReference` | `SRC-NIE-G1011-TG` | `SRC-G11-RAGA-ID` (`sg11_emus_ chap3_raga_handunaganimu.pdf පිටු 1-2`) | `grade_11_raga_identification.md` | PDF Pages 1–2 | A | **CORRECTED**: Mapped to exact Grade 11 raga identification document. |
| `reviewMetadata` | Fabricated approval & reviewer | Standard unverified status (`"Needs Revision"`, `"නොදනී / සනාථ වී නැත"`) | N/A (Repository Policy) | N/A | A | **CORRECTED**: Eliminated fabricated metadata. |
| `publicationDisposition` | Published | **PUBLIC** | `publication-policy.ts` | Grade 10–11 | A | **VERIFIED**: Prescribed Grade 10–11 school raga. |

---

### 1.8 `raga-bhairav` (භෛරව රාගය) — Quarantined Entity (Unestablished in G6–11 School Syllabus)

| Field | Baseline State | Remediation Disposition | Source Evidence Status | Disposition & Musicological Justification |
|---|---|---|---|---|
| `prescribedInclusion` | Quarantined | **QUARANTINED** | Absent in `grade_11_raga_identification.md` (PDF Page 1 lists 7 ragas: Bilawal, Bhupali, Yaman, Khamaj, Kafi, Bhimpalasi, Bhairavi) | **RETAINED IN QUARANTINE**: Not established in supplied prescribed Grade 6–11 syllabus corpus. |
| `allMusicologicalFields` | Raw data in `ragas.json` | **WITHHELD FROM PUBLIC API** | Unverified for school syllabus scope | **WITHHELD**: Excluded from `repository.getRagas()` and public UI routes. |
| `reviewMetadata` | Fabricated approval | Standard unverified status (`"Needs Revision"`, `"නොදනී / සනාථ වී නැත"`) | N/A | **CORRECTED**: Metadata sanitized to prevent false verification claims. |
| `publicationDisposition` | Quarantined | **QUARANTINED / WITHHELD** | Bounded quarantine rule | **QUARANTINED**: Returns 404 on direct route navigation. |

---

## 2. Canonical Talas Field-by-Field Audit Matrix

### 2.1 `tala-dadra` (දාදරා තාලය) — Prescribed School Tala (Grade 6–11)
*Source Document: `oriental_music_markdown/by-source/grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`)*

| Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|
| `prescribedInclusion` | Prescribed | Prescribed (Grade 6–11) | `grade_10_musical_fundamentals.md` | PDF Page 6 | A | **VERIFIED**: Explicitly listed as prescribed school tala on PDF Page 6. |
| `name_si` | `"දාදරා තාලය"` | `"දාදරා තාලය"` | `grade_10_musical_fundamentals.md` | PDF Page 6 | A | **VERIFIED**: Canonical Sinhala name. |
| `name_en` | `"Tala Dadra"` | `"Tala Dadra"` | `grade_10_musical_fundamentals.md` | PDF Page 6 | A | **VERIFIED**: Standard transliteration. |
| `matras` | 6 | 6 | `grade_10_musical_fundamentals.md` | PDF Page 6 | A | **VERIFIED**: 6 matras total. |
| `vibhagCount` | 2 | 2 | `grade_10_musical_fundamentals.md` | PDF Page 6 | A | **VERIFIED**: 2 vibhagas. |
| `vibhagStructure` | `[3, 3]` | `[3, 3]` | `grade_10_musical_fundamentals.md` | PDF Page 6 | A | **VERIFIED**: Equal 3+3 division. |
| `tali_khali_sam` | Tali: 1 (Sam), Khali: 4 | Sam (x) on matra 1, Khali (0) on matra 4 | `grade_10_musical_fundamentals.md` | PDF Page 6 | A | **VERIFIED**: Explicitly diagrammed on PDF Page 6 (`x` on 1, `0` on 4). |
| `theka_si` | `"ධා ධින් නා \| ධා තින් නා"` | `"ධා ධී නා \| ධා තී නා"` | `grade_10_musical_fundamentals.md` | PDF Page 6 | A | **VERIFIED**: Canonical school theka (`ධා ධි/ධී නා \| ධා තූ/තී නා`). |
| `theka_en` | `"Dha Dhin Na \| Dha Tin Na"` | `"Dha Dhi Na \| Dha Ti Na"` | `grade_10_musical_fundamentals.md` | PDF Page 6 | A | **VERIFIED**: Aligned English stroke names. |
| `bols` | 6 bol objects | 6 structured bol objects with matra, vibhagIndex, isSam, isTali, isKhali | `grade_10_musical_fundamentals.md` | PDF Page 6 | A | **VERIFIED**: 1:1 mapping with the 6 matras. |
| `tempo_context` | Generic | Madhyama/Druta laya; widely used in light songs and Sinhala sarala gee | `grade_10_musical_fundamentals.md` | PDF Page 6 | A | **VERIFIED**: Documented school performance context. |
| `sourceReference` | `SRC-NIE-G07-TG` (Page 34) | `SRC-EPD-TB-G10` (`sg10_emus_chap1_mulikanga.pdf පිටුව 6`) | `grade_10_musical_fundamentals.md` | PDF Page 6 | A | **CORRECTED**: Replaced unverified Grade 7 citation with verified Grade 10 fundamentals. |
| `reviewMetadata` | Fabricated approval & reviewer | Standard unverified status (`"Needs Revision"`, `"නොදනී / සනාථ වී නැත"`) | N/A (Repository Policy) | N/A | A | **CORRECTED**: Eliminated fabricated metadata. |
| `publicationDisposition` | Published | **PUBLIC** | `publication-policy.ts` | Grade 6–11 | A | **VERIFIED**: Prescribed Grade 6–11 school tala. |

---

### 2.2 `tala-keherwa` (කෙහර්වා තාලය) — Prescribed School Tala (Grade 6–11)
*Source Document: `oriental_music_markdown/by-source/grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`)*

| Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|
| `prescribedInclusion` | Prescribed | Prescribed (Grade 6–11) | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: Listed as prescribed school tala on PDF Pages 3 and 6. |
| `name_si` | `"කෙහර්වා තාලය"` | `"කෙහර්වා තාලය"` | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: Canonical Sinhala name. |
| `name_en` | `"Tala Keherwa"` | `"Tala Keherwa"` | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: Standard transliteration. |
| `matras` | 8 | 8 | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: 8 matras total. |
| `vibhagCount` | 2 | 2 | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: 2 vibhagas. |
| `vibhagStructure` | `[4, 4]` | `[4, 4]` | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: 4+4 division. |
| `tali_khali_sam` | Tali: 1 (Sam), Khali: 5 | Sam (x) on matra 1, Khali (0) on matra 5 | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: Explicitly diagrammed on PDF Page 3 and Page 6 (`x` on 1, `0` on 5). |
| `theka_si` | `"ධා ගෙ නා තින් \| නා ක ධින් නා"` | `"ධා ගෙ නා තින් \| නා ක ධින් නා"` | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: Canonical school theka (`ධා ගෙ න ත \| න ක ධ න`). |
| `theka_en` | `"Dha Ge Na Tin \| Na Ka Dhin Na"` | `"Dha Ge Na Tin \| Na Ka Dhin Na"` | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: Aligned English strokes. |
| `bols` | 8 bol objects | 8 structured bol objects | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: 1:1 mapping with 8 matras. |
| `tempo_context` | Generic | Madhyama/Druta laya; foundation for fast rhythmic Sinhala songs | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: Documented school performance context. |
| `sourceReference` | `SRC-NIE-G08-TG` | `SRC-EPD-TB-G10` (`sg10_emus_chap1_mulikanga.pdf පිටු 3, 6`) | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **CORRECTED**: Mapped to exact Grade 10 fundamentals source. |
| `reviewMetadata` | Fabricated approval & reviewer | Standard unverified status (`"Needs Revision"`, `"නොදනී / සනාථ වී නැත"`) | N/A (Repository Policy) | N/A | A | **CORRECTED**: Eliminated fabricated metadata. |
| `publicationDisposition` | Published | **PUBLIC** | `publication-policy.ts` | Grade 6–11 | A | **VERIFIED**: Prescribed Grade 6–11 school tala. |

---

### 2.3 `tala-teental` (ත්‍රීතාල් තාලය) — Prescribed School Tala (Grade 7–11)
*Source Document: `oriental_music_markdown/by-source/grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`)*

| Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|
| `prescribedInclusion` | Prescribed | Prescribed (Grade 7–11) | `grade_10_musical_fundamentals.md` | PDF Pages 4–5 | A | **VERIFIED**: Listed on PDF Pages 4 and 5. |
| `name_si` | `"ත්‍රීතාල් තාලය (තීන්තාල)"` | `"ත්‍රීතාල් තාලය (තීන්තාල)"` | `grade_10_musical_fundamentals.md` | PDF Pages 4–5 | A | **VERIFIED**: Canonical Sinhala name and Teental alias. |
| `name_en` | `"Tala Teental (Tritaal)"` | `"Tala Teental (Tritaal)"` | `grade_10_musical_fundamentals.md` | PDF Pages 4–5 | A | **VERIFIED**: Standard transliteration. |
| `matras` | 16 | 16 | `grade_10_musical_fundamentals.md` | PDF Pages 4–5 | A | **VERIFIED**: 16 matras total (King of Talas). |
| `vibhagCount` | 4 | 4 | `grade_10_musical_fundamentals.md` | PDF Pages 4–5 | A | **VERIFIED**: 4 vibhagas. |
| `vibhagStructure` | `[4, 4, 4, 4]` | `[4, 4, 4, 4]` | `grade_10_musical_fundamentals.md` | PDF Pages 4–5 | A | **VERIFIED**: 4+4+4+4 equal division. |
| `tali_khali_sam` | Tali: 1 (Sam), 5, 13; Khali: 9 | Sam (x) on 1, Tali 2 on 5, Khali (0) on 9, Tali 3 on 13 (`x 2 0 3`) | `grade_10_musical_fundamentals.md` | PDF Pages 4–5 | A | **VERIFIED**: Explicitly diagrammed (`x 2 0 3` sequence). |
| `theka_si` | `"ධා ධින් ධින් ධා \| ධා ධින් ධින් ධා \| ධා තින් තින් තා \| තා ධින් ධින් ධා"` | `"ධා ධින් ධින් ධා \| ධා ධින් ධින් ධා \| ධා තින් තින් තා \| තා ධින් ධින් ධා"` | `grade_10_musical_fundamentals.md` | PDF Pages 4–5 | A | **VERIFIED**: Canonical classical theka (`ධා ධං ධං ධා \| ධා ධං ධං ධා \| ධා තං තං ත \| ත ධං ධං ධා`). |
| `theka_en` | Standard | `"Dha Dhin Dhin Dha \| Dha Dhin Dhin Dha \| Dha Tin Tin Ta \| Ta Dhin Dhin Dha"` | `grade_10_musical_fundamentals.md` | PDF Pages 4–5 | A | **VERIFIED**: Standard transliteration. |
| `bols` | 16 bol objects | 16 structured bol objects | `grade_10_musical_fundamentals.md` | PDF Pages 4–5 | A | **VERIFIED**: 1:1 mapping with 16 matras. |
| `tempo_context` | Generic | Vilambit, Madhya, Druta; canonical vehicle for classical chota/bada khayal | `grade_10_musical_fundamentals.md` | PDF Pages 4–5 | A | **VERIFIED**: Documented school performance context. |
| `sourceReference` | `SRC-NIE-G08-TG` | `SRC-EPD-TB-G10` (`sg10_emus_chap1_mulikanga.pdf පිටු 4-5`) | `grade_10_musical_fundamentals.md` | PDF Pages 4–5 | A | **CORRECTED**: Mapped to exact Grade 10 fundamentals source. |
| `reviewMetadata` | Fabricated approval & reviewer | Standard unverified status (`"Needs Revision"`, `"නොදනී / සනාථ වී නැත"`) | N/A (Repository Policy) | N/A | A | **CORRECTED**: Eliminated fabricated metadata. |
| `publicationDisposition` | Published | **PUBLIC** | `publication-policy.ts` | Grade 7–11 | A | **VERIFIED**: Prescribed Grade 7–11 school tala. |

---

### 2.4 `tala-jhaptal` (ජප්තාලය) — Prescribed School Tala (Grade 10–11)
*Source Document: `oriental_music_markdown/by-source/grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`)*

| Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|
| `prescribedInclusion` | Prescribed | Prescribed (Grade 10–11) | `grade_10_musical_fundamentals.md` | PDF Pages 2, 6 | A | **VERIFIED**: Listed on PDF Pages 2 and 6. |
| `name_si` | `"ජප්තාලය (ඣප්තාල)"` | `"ජප්තාලය (ඣප්තාල)"` | `grade_10_musical_fundamentals.md` | PDF Pages 2, 6 | A | **VERIFIED**: Canonical Sinhala name. |
| `name_en` | `"Tala Jhaptal"` | `"Tala Jhaptal"` | `grade_10_musical_fundamentals.md` | PDF Pages 2, 6 | A | **VERIFIED**: Standard transliteration. |
| `matras` | 10 | 10 | `grade_10_musical_fundamentals.md` | PDF Pages 2, 6 | A | **VERIFIED**: 10 matras total. |
| `vibhagCount` | 4 | 4 | `grade_10_musical_fundamentals.md` | PDF Pages 2, 6 | A | **VERIFIED**: 4 vibhagas. |
| `vibhagStructure` | `[2, 3, 2, 3]` | `[2, 3, 2, 3]` | `grade_10_musical_fundamentals.md` | PDF Pages 2, 6 | A | **VERIFIED**: Asymmetrical 2+3+2+3 division (Khanda jati structure). |
| `tali_khali_sam` | Tali: 1 (Sam), 3, 8; Khali: 6 | Sam (x) on 1, Tali 2 on 3, Khali (0) on 6, Tali 3 on 8 (`x 2 0 3`) | `grade_10_musical_fundamentals.md` | PDF Pages 2, 6 | A | **VERIFIED**: Explicitly diagrammed (`x 2 0 3` sequence). |
| `theka_si` | `"ධී නා \| ධී ධී නා \| තී නා \| ධී ධී නා"` | `"ධී නා \| ධී ධී නා \| තී නා \| ධී ධී නා"` | `grade_10_musical_fundamentals.md` | PDF Pages 2, 6 | A | **VERIFIED**: Canonical classical theka (`ධ න \| ධ ධ න \| ත න \| ධ ධ න`). |
| `theka_en` | Standard | `"Dhi Na \| Dhi Dhi Na \| Ti Na \| Dhi Dhi Na"` | `grade_10_musical_fundamentals.md` | PDF Pages 2, 6 | A | **VERIFIED**: Standard transliteration. |
| `bols` | 10 bol objects | 10 structured bol objects | `grade_10_musical_fundamentals.md` | PDF Pages 2, 6 | A | **VERIFIED**: 1:1 mapping with 10 matras. |
| `tempo_context` | Generic | Madhyama laya; traditional tala for madhya laya khayal and sadra | `grade_10_musical_fundamentals.md` | PDF Pages 2, 6 | A | **VERIFIED**: Documented school performance context. |
| `sourceReference` | `SRC-NIE-G1011-TG` | `SRC-EPD-TB-G10` (`sg10_emus_chap1_mulikanga.pdf පිටු 2, 6`) | `grade_10_musical_fundamentals.md` | PDF Pages 2, 6 | A | **CORRECTED**: Mapped to exact Grade 10 fundamentals source. |
| `reviewMetadata` | Fabricated approval & reviewer | Standard unverified status (`"Needs Revision"`, `"නොදනී / සනාථ වී නැත"`) | N/A (Repository Policy) | N/A | A | **CORRECTED**: Eliminated fabricated metadata. |
| `publicationDisposition` | Published | **PUBLIC** | `publication-policy.ts` | Grade 10–11 | A | **VERIFIED**: Prescribed Grade 10–11 school tala. |

---

### 2.5 `tala-deepchandi` (දීප්චන්දි තාලය) — Prescribed School Tala (Grade 10–11)
*Source Document: `oriental_music_markdown/by-source/grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`)*

| Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|
| `prescribedInclusion` | Prescribed | Prescribed (Grade 10–11) | `grade_10_musical_fundamentals.md` | PDF Pages 2, 4, 5 | A | **VERIFIED**: Listed on PDF Pages 2, 4, and 5. |
| `name_si` | `"දීප්චන්දි තාලය (දීප්චන්දී)"` | `"දීප්චන්දි තාලය (දීප්චන්දී)"` | `grade_10_musical_fundamentals.md` | PDF Pages 2, 4, 5 | A | **VERIFIED**: Canonical Sinhala name. |
| `name_en` | `"Tala Deepchandi"` | `"Tala Deepchandi"` | `grade_10_musical_fundamentals.md` | PDF Pages 2, 4, 5 | A | **VERIFIED**: Standard transliteration. |
| `matras` | 14 | 14 | `grade_10_musical_fundamentals.md` | PDF Pages 2, 4, 5 | A | **VERIFIED**: 14 matras total. |
| `vibhagCount` | 4 | 4 | `grade_10_musical_fundamentals.md` | PDF Pages 2, 4, 5 | A | **VERIFIED**: 4 vibhagas. |
| `vibhagStructure` | `[3, 4, 3, 4]` | `[3, 4, 3, 4]` | `grade_10_musical_fundamentals.md` | PDF Pages 2, 4, 5 | A | **VERIFIED**: 3+4+3+4 division with silent rest on matras 3, 7, 10, 14. |
| `tali_khali_sam` | Tali: 1 (Sam), 4, 11; Khali: 8 | Sam (x) on 1, Tali 2 on 4, Khali (0) on 8, Tali 3 on 11 (`x 2 0 3`) | `grade_10_musical_fundamentals.md` | PDF Pages 2, 4, 5 | A | **VERIFIED**: Explicitly diagrammed (`x 2 0 3` sequence). |
| `theka_si` | `"ධා ධින් - \| ධා ධා ධින් - \| තා තින් - \| ධා ධා ධින් -"` | `"ධා ධින් - \| ධා ධා ධින් - \| තා තින් - \| ධා ධා ධින් -"` | `grade_10_musical_fundamentals.md` | PDF Pages 2, 4, 5 | A | **VERIFIED**: Canonical theka with rest tokens (`-`). |
| `theka_en` | Standard | `"Dha Dhin - \| Dha Dha Dhin - \| Ta Tin - \| Dha Dha Dhin -"` | `grade_10_musical_fundamentals.md` | PDF Pages 2, 4, 5 | A | **VERIFIED**: Standard transliteration. |
| `bols` | 14 bol objects | 14 structured bol objects (including rest marks) | `grade_10_musical_fundamentals.md` | PDF Pages 2, 4, 5 | A | **VERIFIED**: 1:1 mapping with 14 matras. |
| `tempo_context` | Generic | Vilambit/Madhya laya; traditional tala for Thumri and expressive semi-classical songs | `grade_10_musical_fundamentals.md` | PDF Pages 2, 4, 5 | A | **VERIFIED**: Documented school performance context. |
| `sourceReference` | `SRC-NIE-G1011-TG` | `SRC-EPD-TB-G10` (`sg10_emus_chap1_mulikanga.pdf පිටු 2, 4, 5`) | `grade_10_musical_fundamentals.md` | PDF Pages 2, 4, 5 | A | **CORRECTED**: Mapped to exact Grade 10 fundamentals source. |
| `reviewMetadata` | Fabricated approval & reviewer | Standard unverified status (`"Needs Revision"`, `"නොදනී / සනාථ වී නැත"`) | N/A (Repository Policy) | N/A | A | **CORRECTED**: Eliminated fabricated metadata. |
| `publicationDisposition` | Published | **PUBLIC** | `publication-policy.ts` | Grade 10–11 | A | **VERIFIED**: Prescribed Grade 10–11 school tala. |

---

### 2.6 `tala-lawani` (ලාවනී තාලය) — Prescribed School Tala (Grade 10–11)
*Source Document: `oriental_music_markdown/by-source/grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`)*

| Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|
| `prescribedInclusion` | Prescribed | Prescribed (Grade 10–11) | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: Listed on PDF Pages 3 and 6. |
| `name_si` | `"ලාවනී තාලය"` | `"ලාවනී තාලය"` | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: Canonical Sinhala name. |
| `name_en` | `"Tala Lawani"` | `"Tala Lawani"` | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: Standard transliteration. |
| `matras` | 8 | 8 | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: 8 matras total. |
| `vibhagCount` | 4 | 4 | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: 4 vibhagas of 2 matras each. |
| `vibhagStructure` | `[2, 2, 2, 2]` | `[2, 2, 2, 2]` | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: 2+2+2+2 structure with marks X, 2, 0, 3. |
| `tali_khali_sam` | Tali: 1 (Sam), 3, 7; Khali: 5 | Sam (x) on 1, Tali 2 on 3, Khali (0) on 5, Tali 3 on 7 (`x 2 0 3`) | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: Explicitly diagrammed on PDF Page 3 and Page 6. |
| `theka_si` | `"ධා ගේ \| න ත \| න ක \| ධ න"` | `"ධා ගේ \| න ත \| න ක \| ධ න"` | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: Same theka strokes as Keherwa, but divided in 2-matra vibhagas. |
| `theka_en` | Standard | `"Dha Ge \| Na Ta \| Na Ka \| Dha Na"` | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: Standard transliteration. |
| `bols` | 8 bol objects | 8 structured bol objects | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **VERIFIED**: 1:1 mapping with 8 matras. |
| `tempo_context` | Generic North Indian classification | Documented Sri Lankan school curriculum adaptation for 2-matra songs and local tit-rupa | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **CORRECTED**: Documented official school context in `changeNotes`. |
| `sourceReference` | `SRC-EPD-TB-G11` (Page 47) | `SRC-EPD-TB-G10` (`sg10_emus_chap1_mulikanga.pdf පිටු 3, 6`) | `grade_10_musical_fundamentals.md` | PDF Pages 3, 6 | A | **CORRECTED**: Reconciled citation to Grade 10 fundamentals. |
| `reviewMetadata` | Fabricated approval & reviewer | Standard unverified status (`"Needs Revision"`, `"නොදනී / සනාථ වී නැත"`) | N/A (Repository Policy) | N/A | A | **CORRECTED**: Eliminated fabricated metadata. |
| `publicationDisposition` | Published | **PUBLIC** | `publication-policy.ts` | Grade 10–11 | A | **VERIFIED**: Prescribed Grade 10–11 school tala. |

---

### 2.7 `tala-khemta` (ඛෙම්ටෝ තාලය) — Prescribed School Tala (Grade 10–11)
*Source Document: `oriental_music_markdown/by-source/grade_10_musical_fundamentals.md` (`SRC-EPD-TB-G10`)*

| Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|
| `prescribedInclusion` | Prescribed | Prescribed (Grade 10–11) | `grade_10_musical_fundamentals.md` | PDF Pages 6–7 | A | **VERIFIED**: Listed on PDF Pages 6 and 7. |
| `name_si` | `"ඛෙම්ටෝ තාලය (ඛෙම්ටා)"` | `"ඛෙම්ටෝ තාලය (ඛෙම්ටා)"` | `grade_10_musical_fundamentals.md` | PDF Pages 6–7 | A | **VERIFIED**: Canonical Sinhala name. |
| `name_en` | `"Tala Khemta (Khemto)"` | `"Tala Khemta (Khemto)"` | `grade_10_musical_fundamentals.md` | PDF Pages 6–7 | A | **VERIFIED**: Standard transliteration. |
| `matras` | 6 (or 4 in triplet subdivision) | 6 matras (2 vibhagas of 3) / 12 akshara fast laya | `grade_10_musical_fundamentals.md` | PDF Pages 6–7 | A | **VERIFIED**: Explains 1-matra = 3 aksharas fast triplet structure. |
| `vibhagCount` | 2 | 2 | `grade_10_musical_fundamentals.md` | PDF Pages 6–7 | A | **VERIFIED**: 2 vibhagas. |
| `vibhagStructure` | `[3, 3]` | `[3, 3]` | `grade_10_musical_fundamentals.md` | PDF Pages 6–7 | A | **VERIFIED**: 3+3 structure (`ධා ධි නා \| තා ති නා` or `ධන්න ධනක \| තන්න ධනක`). |
| `tali_khali_sam` | Tali: 1 (Sam), Khali: 4 | Sam (x) on matra 1, Khali (0) on matra 4 | `grade_10_musical_fundamentals.md` | PDF Pages 6–7 | A | **VERIFIED**: Explicitly diagrammed (`x` on 1, `0` on 4). |
| `theka_si` | `"ධන්න ධනක \| තන්න ධනක"` | `"ධන්න ධනක \| තන්න ධනක"` | `grade_10_musical_fundamentals.md` | PDF Pages 6–7 | A | **VERIFIED**: Canonical folk and semi-classical Sri Lankan school theka. |
| `theka_en` | Standard | `"Dhanna Dhanaka \| Tanna Dhanaka"` | `grade_10_musical_fundamentals.md` | PDF Pages 6–7 | A | **VERIFIED**: Standard transliteration. |
| `bols` | 6 bol objects | 6 structured bol objects | `grade_10_musical_fundamentals.md` | PDF Pages 6–7 | A | **VERIFIED**: 1:1 mapping. |
| `tempo_context` | Generic | Druta (fast) laya; lively dance and light song accompaniment | `grade_10_musical_fundamentals.md` | PDF Page 7 | A | **VERIFIED**: Text notes `"ලය වේගවත් බවක් පෙන්වයි"`. |
| `sourceReference` | `SRC-NIE-G1011-TG` | `SRC-EPD-TB-G10` (`sg10_emus_chap1_mulikanga.pdf පිටු 6-7`) | `grade_10_musical_fundamentals.md` | PDF Pages 6–7 | A | **CORRECTED**: Mapped to exact Grade 10 fundamentals source. |
| `reviewMetadata` | Fabricated approval & reviewer | Standard unverified status (`"Needs Revision"`, `"නොදනී / සනාථ වී නැත"`) | N/A (Repository Policy) | N/A | A | **CORRECTED**: Eliminated fabricated metadata. |
| `publicationDisposition` | Published | **PUBLIC** | `publication-policy.ts` | Grade 10–11 | A | **VERIFIED**: Prescribed Grade 10–11 school tala. |

---

### 2.8 `tala-roopak` (රූපක් තාලය) — Quarantined Entity (Unestablished in G6–11 School Syllabus)

| Field | Baseline State | Remediation Disposition | Source Evidence Status | Disposition & Musicological Justification |
|---|---|---|---|---|
| `prescribedInclusion` | Quarantined | **QUARANTINED** | Absent in `grade_10_musical_fundamentals.md` (PDF Pages 1–7 list Dadra, Keherwa, Teental, Jhaptal, Deepchandi, Lawani, Khemta) | **RETAINED IN QUARANTINE**: Not established in supplied prescribed Grade 6–11 school tala syllabus evidence. |
| `allMusicologicalFields` | Raw data in `talas.json` | **WITHHELD FROM PUBLIC API** | Unverified for school syllabus scope | **WITHHELD**: Excluded from `repository.getTalas()` and public UI routes. |
| `reviewMetadata` | Fabricated approval | Standard unverified status (`"Needs Revision"`, `"නොදනී / සනාථ වී නැත"`) | N/A | **CORRECTED**: Metadata sanitized to prevent false verification claims. |
| `publicationDisposition` | Quarantined | **QUARANTINED / WITHHELD** | Bounded quarantine rule | **QUARANTINED**: Returns 404 on direct route navigation. |

---

## 3. Acoustics & Sound Properties (ත්‍රිවිධ ගුණ) Field-by-Field Audit Matrix
*Source Document: `oriental_music_markdown/by-source/grade_10_sound_properties.md` (`SRC-G10-NADA`)*

| Concept / Field | Before (Prompt 1 Baseline) | After (Prompt 2 Remediated) | Source Document | PDF Page / Section | Evidence Quality | Disposition & Musicological Justification |
|---|---|---|---|---|---|---|
| `curriculumGrade` | Claimed Grade 6 | **Grade 10 Unit 8** | `grade_10_sound_properties.md` (`SRC-G10-NADA`) | PDF Pages 2–3 | A | **CORRECTED**: Tri-vidha Guna (නාදයේ ගුණ 3) is a Grade 10 curriculum topic, not Grade 6. |
| `pitchTerminology` | `"උච්ච-නීච භාවය"` only | `"තාරතාවය / උච්චනීච ප්‍රභේදය"` (Pitch / Frequency) | `grade_10_sound_properties.md` (`SRC-G10-NADA`) | PDF Pages 3–4 | A | **CORRECTED**: Aligned dual scientific (`තාරතාවය`) and classical (`උච්චනීච`) Sinhala terms. |
| `intensityTerminology` | `"ප්‍රබලතාවය"` only | `"විපුලතාවය / රූප භේදය"` (Intensity / Amplitude) | `grade_10_sound_properties.md` (`SRC-G10-NADA`) | PDF Pages 5–8 | A | **CORRECTED**: Aligned official textbook terms (`විපුලතාවය` / `රූප භේදය`). |
| `timbreTerminology` | `"ශබ්ද ගුණය"` only | `"ධ්වනි ගුණය / ජාති භේදය"` (Timbre / Waveform) | `grade_10_sound_properties.md` (`SRC-G10-NADA`) | PDF Pages 9–12 | A | **CORRECTED**: Aligned official textbook terms (`ධ්වනි ගුණය` / `ජාති භේදය`). |
| `lessonSourceReference` | Unverified citation | `SRC-G10-NADA` (`sg10_emus_chap8_nadaye_guna.pdf පිටු 2-12`) | `grade_10_sound_properties.md` (`SRC-G10-NADA`) | PDF Pages 2–12 | A | **CORRECTED**: Mapped to exact Grade 10 Unit 8 document. |

# SOURCE_CONTENT_AUDIT.md — Extracted source corpus inventory (unverified claim boundary)

> **Prompt 1 correction:** This document inventories extracted Markdown and page-quality signals. It does not establish that every application claim is true, official, licensed, reviewed, or published. The current publication boundary is [`docs/FORENSIC_PUBLICATION_BASELINE.md`](FORENSIC_PUBLICATION_BASELINE.md), with issue-level evidence in [`data/forensic-ledger.json`](../data/forensic-ledger.json).

This document records the current inventory of 30 source-document records located in `oriental_music_markdown/by-source/`. The checkout contains no original PDF files. A source page heading or extracted paragraph is not a substitute for original-PDF/manual comparison.

---

## 1. Corpus Summary Statistics

- **Total Source Documents**: 30
- **Total Extracted PDF Pages**: 1,023
- **Observed grade scope in the supplied source-document inventory**: Grades 6–11 and mixed/unspecified records; no supplied Grade 12–13 source set was verified.
- **Publisher metadata**: retained as unverified until a source record or original publication establishes it. The public Sources view therefore renders publisher, year, location, licence, and status as unknown/unverified.

---

## 2. Source-Page Confidence Classification System

Every source page across all 1,023 extracted pages is assigned one of four confidence ratings:

| Level | Classification | Criteria & Usage Policy |
|---|---|---|
| **A** | **Readable extraction** | Coherent extracted Sinhala text. It is eligible for claim comparison, not automatically verified. |
| **B** | **Readable with normalization** | Extracted meaning may be usable after comparison; spacing, line-break, or mapped-font artefacts remain possible. |
| **C** | **Review Required** | Incomplete tables, short fragments, or partial exercises requiring cross-checking with parallel teacher guides. |
| **D** | **Unusable Without Visual/Expert Review** | Image-only pages (0 text recovered), corrupted font encoding, or missing notation diagrams. **Never guessed or inferred.** Maintained as review placeholders. |

---

## 3. Document-by-Document Triage Registry

| # | Document Slug | Original PDF Filename | Grade | Pages | Sinhala Chars | Legacy Fonts | Primary Confidence | Content Domain & Notes |
|---|---|---|---:|---:|---:|:---:|:---:|---|
| 1 | `children_songs` | `ළමා ගීත.pdf` | 6–8 | 17 | 0 | No | **D** | Image-only sheet music/lyrics. Logged as review placeholder. |
| 2 | `computer_music` | `computer music.pdf` | 10–11 | 39 | 877 | Yes (FM) | **B/C** | Hardware/software (MIDI, Cubase, Audition, Sound cards) for sound technology unit. |
| 3 | `grade_10_aghatathmaka_and_anaghatathmaka_padi` | `rg_sg10_emus_u4_ආඝාතාත්මක හා අනාඝාතාත්මක පැදි_p1.pdf` | 10 | 1 | 275 | No | **A** | Accented (Aghata) and unaccented (Anaghata) verse rhythm. |
| 4 | `grade_10_folk_song_classification` | `rg_sg10_emus_u4_ජන ගී වර්ගීකරණය_p1.pdf` | 10 | 5 | 1,876 | No | **A** | Sinhala folk songs (Goyam, Karaththa, Pathal, Paruwa, Nelum, Pel), Guttila kavya, Nadagam, Kapirinna. |
| 5 | `grade_10_musical_fundamentals` | `sg10_emus_chap1_mulikanga.pdf` | 10 | 7 | 1,691 | No | **A** | Deepchandi, Jhaptal, Trital, Keharwa, Dadra, Lawani, Khemta comparative tala structure. |
| 6 | `grade_10_nadaya` | `sg10_emus_chap8_nadaya.pdf` | 10 | 12 | 3,260 | No | **A** | Physics of musical sound, vibration, pitch, intensity, timbre, acoustics. |
| 7 | `grade_10_nadaya_section_8_1_1` | `sg10_emus_chap8.1.1_nadaya.pdf` | 10 | 11 | 3,956 | No | **A** | Sound propagation, longitudinal/transverse waves, vocal tract physiology. |
| 8 | `grade_10_western_music` | `estern music g10.pdf` | 10 | 114 | 113,520 | Yes (FM) | **B** | Western notation comparison, stave notation, clefs, time signatures, orchestral instruments. |
| 9 | `grade_11_music_textbook` | `s11tim173.pdf` | 11 | 92 | 82,046 | Yes (FM) | **A/B** | Comprehensive Grade 11 textbook: Ragas (Bilawal, Bhupali, Kafi, Yaman, Bhairav, Khamaj, Vrindavani Sarang), Talas, Instruments, Traditions. |
| 10 | `grade_11_raga_identification` | `sg11_emus_ chap3_raga_handunaganimu.pdf` | 11 | 2 | 1,923 | No | **A** | Canonical 7 ragas summary table (Vadi, Samvadi, Jati, Thata, Gana Samaya, Mukhyanga). |
| 11 | `grade_6_music_teacher_guide` | `SG06_emus_tim.pdf` | 6 | 108 | 103,140 | Yes (FM) | **A/B** | Full Grade 6 Teacher Guide: Competencies 1.0–8.0, sound awareness, pure swaras, 7 basic alankaras, Kaharawa/Dadra, folk games. |
| 12 | `grade_7_11_oriental_music_teacher_guide` | `Music sd.pdf` | 7–11 | 15 | 14,615 | Yes (FM) | **A/B** | Cross-grade competency framework and syllabus progressions. |
| 13 | `grade_7_music` | `g7 music.pdf` | 7 | 161 | 0 | No | **D** | Image-only textbook scan. Cross-referenced with Grade 7 Teacher Guide. |
| 14 | `grade_7_violin` | `sg7_emus_chap2.1.2_violin.pdf` | 7 | 12 | 1,061 | No | **A** | Violin posture, parts, bow, string tunings (Western, Hindustani, Sarala Gee, Carnatic). |
| 15 | `grade_8_music_activity_1` | `sg8_emu_activity1.pdf` | 8 | 1 | 321 | No | **A** | Practical worksheet on Bilawal raga establishing songs. |
| 16 | `grade_8_music_activity_2` | `sg8_emu_activity2.pdf` | 8 | 2 | 451 | No | **A** | Practical worksheet on Keharwa & Dadra rhythm patterns. |
| 17 | `grade_8_music_activity_3` | `sg8_emu_activity3.pdf` | 8 | 2 | 469 | No | **A** | Sitar/Esraj handling and finger placement. |
| 18 | `grade_8_music_teacher_guide` | `Sg8_Tim_Wmusi.pdf` | 8 | 123 | 113,799 | Yes (FM) | **A/B** | Full Grade 8 Teacher Guide: Competencies 1.0–8.0, Bilawal/Bhupali ragas, Dadra/Keharwa, folk songs, vannam, Nadagam. |
| 19 | `grade_9_kolam` | `sg9_emus__kolam.pdf` | 9 | 5 | 1,021 | No | **A** | Kolam drama: masks, Thanayam Pola, Pahatharata beraya, Horanawa, Jasaya & Lenchina songs. |
| 20 | `grade_9_music_instruments` | `sg9_emus_music_instruments.pdf` | 9 | 5 | 857 | No | **A** | Pancha Turya classification (Athatha, Vithatha, Vithathathatha, Ghana, Sushira) & 14 local instruments. |
| 21 | `grade_9_oriental_music_teacher_guide` | `sGr09TG OrienMusic sd.pdf` | 9 | 8 | 1,446 | Yes (FM) | **B** | Grade 9 syllabus competencies and practical outcomes. |
| 22 | `grade_9_raga` | `sg9_emus_raga.pdf` | 9 | 2 | 735 | No | **A** | Grade 9 Ragas: Bhimpalasi & Yaman (Vadi, Samvadi, Gana Samaya, Thata, applied songs). |
| 23 | `grade_9_richmond_music` | `Richmond_G9_Emusi.pdf` | 9 | 5 | 2,542 | No | **A** | School practical notes: Swara exercises, Raga Khamaj, Tala Deepchandi. |
| 24 | `music_teacher_guide_part_2` | `music sd_2.pdf` | 6–11 | 7 | 3,517 | Yes (FM) | **A/B** | Secondary practical guidelines and evaluation criteria. |
| 25 | `oriental_music_2018` | `පෙරදිග-සංගීතය-2018.pdf` | 6–11 | 145 | 18,997 | Yes (Corrupted) | **D** | Severe font encoding corruption. Facts extracted only when confirmed in Grade 6/8/11 guides. |
| 26 | `swara_establishment_songs` | `ස්වර ස්ථාපන ගීත.pdf` | 6–8 | 34 | 1,189 | No | **B** | Pure swara establishment songs (Shuddha Swara Sthapana Geetha 1–10). |
| 27 | `swara_keyboard_instruments` | `ස්වර පුවරු සංගීත භාණ්ඩ.pdf` | 6–8 | 30 | 413 | No | **B/C** | Swara keyboards (Harmonium, Melodica, Keyboard) playing postures and bellows handling. |
| 28 | `symphony` | `සංධ්වනි.pdf` | 10–11 | 29 | 1,777 | Yes (FM) | **B** | Symphony, Western orchestra, overture, concerto for music appreciation units. |
| 29 | `tabla` | `තබ්ලාව.pdf` | 7–11 | 23 | 2,805 | Yes (FM) | **B** | Complete Tabla manual: Dayan, Bayan, strokes (Na, Tin, Ge, Ke, Tit, Dha, Dhin), thekas. |
| 30 | `western_music_syllabus` | `estern music syl.pdf` | 6–11 | 6 | 5,555 | Yes (FM) | **B** | Secondary syllabus reference for cross-musical notation and stave units. |

---

## 4. Key Source Gaps & Mitigation Strategy

1. **`children_songs.md` & `grade_7_music.md` (Image-Only)**:
   - *Issue*: pdftotext could not recover embedded text from image scans.
   - *Containment*: These pages are retained as review placeholders. Parallel documents may be candidate evidence, but they do not silently promote the image-only claims.
2. **`oriental_music_2018.md` (Corrupted Glyphs)**:
   - *Issue*: Non-standard FM font mapping produced unmapped conjuncts.
   - *Containment*: Treated strictly as Grade D; no facts are derived solely from this file. Parallel pages are candidate evidence only and still require claim-level comparison.
3. **Advanced Grades 12–13 Scope**:
   - *Issue*: The supplied 30-document corpus covers Grades 6 through 11.
   - *Containment*: Public selectors and routes are limited to Grades 6–11. Grade 12–13/A/L records remain quarantined pending an official supplied source set.

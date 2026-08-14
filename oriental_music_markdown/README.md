# Oriental Music Educational Platform Content

This bundle contains Markdown content extracted from the supplied oriental-music PDF collection. Each source PDF has one clearly named Markdown file under `by-source/`, using a lowercase ASCII `content_slug` that is stable and suitable for URLs, database keys, or content-management-system identifiers.

## Organization

| Directory or file | Purpose |
|---|---|
| `by-source/*.md` | One Markdown file per original PDF, with YAML-style metadata and page-level headings. |
| `EXTRACTION_MANIFEST.md` | Human-readable source-to-output index with page counts, extraction branches, and legacy-font families. |
| `extraction_manifest.json` | Machine-readable version of the extraction index. |
| `VALIDATION_REPORT.md` | Final deterministic validation report. |
| `config/context-sensitive-legacy-glyph-overrides-v1.json` | Versioned exact-match legacy-glyph cleanup table used after font mapping. |
| `cross-check/correction-audit/` | Audit of the exact corrections and their coverage. |
| `cross-check/artifacts-before-correction/` | Pre-correction artifact inventory and contexts. |
| `cross-check/artifacts-after-correction/` | Post-correction inventory confirming no residual literal-backtick artifacts. |
| `cross-check/backups/` | Pristine pre-correction Markdown backups for audit or rollback. |

## Extraction policy

PDFs with FM-family legacy Sinhala fonts were processed with the installed legacy Sinhala conversion workflow and the UCSC improved mapping. PDFs with native Unicode or other text layers were extracted with `pdftotext -layout`. Image-only PDFs were preserved as page-level Markdown placeholders because OCR was intentionally not used; their source pages may contain notation, diagrams, or image-embedded Sinhala that should be reviewed visually before publication.

> The extraction is text recovery, not editorial rewriting. Page boundaries and source filenames are preserved in the metadata and headings so that platform editors can trace every passage back to the original PDF.

## Validation status

The final bundle contains **30 Markdown files**. Validation found **zero page-heading mismatches**, **zero residual literal-backtick legacy-glyph artifacts**, **zero U+FFFD replacement characters**, and **zero unexpected control characters**. The final details are in `VALIDATION_REPORT.md` and the correction audit.

## Image-only sources

`children_songs.md` has no recoverable embedded text and therefore contains page-level reference notes rather than invented OCR text. The platform should link this item to the original PDF or to a separately reviewed transcription.

## Naming examples

| Original PDF | Markdown output |
|---|---|
| `SG06_emus_tim.pdf` | `by-source/grade_6_music_teacher_guide.md` |
| `Sg8_Tim_Wmusi.pdf` | `by-source/grade_8_music_teacher_guide.md` |
| `sg9_emus_raga.pdf` | `by-source/grade_9_raga.md` |
| `පෙරදිග-සංගීතය-2018.pdf` | `by-source/oriental_music_2018.md` |
| `තබ්ලාව.pdf` | `by-source/tabla.md` |

The original filename is retained inside each Markdown file’s metadata for traceability.

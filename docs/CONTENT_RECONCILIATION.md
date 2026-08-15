# CONTENT_RECONCILIATION.md — Historical reconciliation record and Prompt 1 correction

> **Prompt 1 status:** The older reconciliation claims below are retained as historical evidence, not as a current publication decision. The current machine-readable baseline is [`data/forensic-ledger.json`](../data/forensic-ledger.json), and public eligibility is enforced by [`src/lib/data/publication-policy.ts`](../src/lib/data/publication-policy.ts). The supplied checkout contains extracted Markdown and no original PDF files; no claim is accepted merely because an old record says `KEEP` or `Published`.

The previous report described 101 records as published and source-grounded. The current checkout independently recalculates that artifact as 101 records with 22 `KEEP`, 35 `REMAP_GRADE`, 43 `CORRECT`, and 1 `REWRITE`; all 101 carry a historical `Published` value. Those values remain audit inputs and are not evidence of a completed review.

Prompt 1 contains unsupported Grade 12–13/A/L discovery, known raga/tala and citation issues, false review/source metadata, and incomplete dependencies. Those records are retained and quarantined or marked `needs-review`; this phase does not silently delete or musically rewrite them.

---

## 1. Historical action counts (not a publication verdict)

| Action | Count | Description |
|---|---:|---|
| **`KEEP`** | 22 | Historical action label only; source claim is not re-verified by Prompt 1. |
| **`CORRECT`** | 43 | Historical action label only; before/after evidence is not a publication proof. |
| **`REMAP_GRADE`** | 35 | Historical action label only; Grade 12–13 claims remain quarantined until exact source evidence exists. |
| **`REWRITE`** | 1 | Historical action label only; content rewrite is outside Prompt 1 scope. |
| **`SPLIT / MERGE`** | 0 | Canonical raga and tala entities unified with progressive disclosure views rather than duplicated. |
| **`ARCHIVE`** | 0 | No unsupported topics required complete removal; all existing topics were grounded in canonical school units. |
| **Total historical records** | **101** | **No completion or publication percentage is implied.** |

---

## 2. Priority Corrections Applied

### P0 — Current containment boundary
- Grade 12–13 and A/L records are not public. The supplied 30-document source inventory does not include a verified Grade 12–13 source set.
- Bhairav, Bilawal, Roopak, Lawani, Dadra, sound terminology, and the named exam/path records are retained in the forensic ledger and quarantined or held for review. No musical correction is claimed.
- A/B/C/D page classifications describe extraction quality. They do not establish Vadi, Samvadi, Jati, Thata, matra, vibhag, theka, terminology, or curriculum truth.

### P1 — Deferred content review
- The 17-point lesson shape and pedagogical language remain implementation requirements, not proof that every record has passed SME, language, pedagogical, audio, accessibility, rights, and source review.
- Learning paths are not public unless every lesson step is public and source-backed. Incomplete paths remain available for later remediation through their stable IDs.

### P2 — Evidence and QA boundary
- Visual notation, image-only pages, and corrupt OCR require original-PDF/manual review. Prompt 1 does not claim 360px or release QA completion.

---

## 3. Detailed Reconciliation Entity Inventory

Detailed historical records remain in [`data/content-reconciliation.json`](../data/content-reconciliation.json). The current issue-level ledger and source inventory are in [`data/forensic-ledger.json`](../data/forensic-ledger.json). Use the latter for current status and counts.

Key entity mappings:
- **Lessons (21)**: `les-intro-01` (KEEP), `les-swara-01` (KEEP), `les-swara-02` (KEEP), `les-saptaka-01` (KEEP), `les-alankara-01` (KEEP), `les-tala-basics` (KEEP), `les-tala-dadra` (KEEP), `les-tala-keherwa` (KEEP), `les-tala-teental` (KEEP), `les-thata-basics` (KEEP), `les-raga-bhairav` (REMAP_GRADE), `les-raga-yaman` (REMAP_GRADE), `les-vocal-posture` (KEEP), `les-inst-overview` (CORRECT), `les-inst-desi-drums` (CORRECT), `les-folk-work` (KEEP), `les-theatre-nadagam` (KEEP), `les-theatre-nurthi` (KEEP), `les-apprec-elements` (KEEP), `les-creative-rhythm` (KEEP), `les-exam-skills` (REWRITE).
- **Ragas (5 + 3 new canonical additions)**: Bilawal, Bhupali, Yaman, Khamaj, Bhairav, + Kafi, Bhimpalasi, Bhairavi (all canonical entities with progressive grade views).
- **Talas (4 + 4 new canonical additions)**: Dadra, Keharwa, Trital, Rupak, + Jhaptal, Deepchandi, Khemta, Lawani.
- **Instruments (10)**: Gatabera, Yakbera, Daula, Thammattama, Bummadiya, Rabana, Udakkiya, Sitar, Esraj, Tabla, Violin, Flute, Harmonium (all aligned with Pancha Turya and Hindustani classical).
- **Traditions & Theatre (11)**: Goyam, Karaththa, Pathal, Paruwa, Nelum, Pel, Vannam, Raban Pada, Nadagam, Nurthi, Sokari, Kolam.
- **Glossary & Terms (27+)**: Fully synchronized with `data/terminology-si.json`.

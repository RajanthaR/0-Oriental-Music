# Forensic Source Remediation and Content-Completion Plan

## 1. Outcome and planning decisions

The programme converts the current polished-but-untrusted application into an auditable Grades 6–11 source-bounded product. Technical success and curriculum correctness are separate gates. A claim is public only when its source, exact page/section, evidence quality, review state, and dependencies are machine-checkable.

Planning decisions:

- **Scope boundary:** Grades 6–11 and supported O/L material only. Grades 12–13/A/L remain out of public scope until their official source corpus exists and is separately audited.
- **Evidence boundary:** Repository Markdown can verify readable text. Image-only, corrupt, visually dependent, or ambiguous source material remains `needs-review` pending original-PDF/manual inspection.
- **Preservation:** Unsupported content is quarantined and logged rather than silently deleted. Stable IDs and migration aliases are preserved where safe.
- **Sequence:** Establish containment first; repair canonical facts before dependent lessons; rebuild navigation/workspaces after content; perform UI/audio QA under content freeze; finish with an independent release audit.
- **Integration:** One branch and ready PR per phase. The next phase starts from merged `origin/main`, never from an unmerged predecessor branch.
- **External review:** All committed changes receive bounded-batch Diffray analysis with successful-analyzer evidence and a local review-fix commit when findings are accepted.

## 2. Programme-level artifacts

The programme must converge on these durable artifacts, using existing paths when appropriate rather than creating duplicate truths:

- a canonical source-document/page registry;
- a claim-level provenance and evidence-quality model;
- an append-only forensic issue ledger and before/after correction log;
- a typed publication-eligibility policy used by every public query surface;
- corrected canonical content datasets;
- a competency/claim/lesson coverage graph with computed coverage status;
- automated drift, containment, provenance, integrity, and UI tests;
- a final release-evidence report that separates verified, blocked, deferred, and unavailable evidence.

## 3. Cross-phase gates

Each phase must satisfy these gates in addition to its own acceptance criteria:

- **G1 — Source:** Every modified factual claim has exact evidence or an explicit non-public `needs-review` state.
- **G2 — Consistency:** Machine-readable canonical data and generated human documentation agree.
- **G3 — Migration:** Stable IDs/progress mappings remain valid or have an explicit migration map.
- **G4 — Verification:** Relevant targeted tests plus test, type-check, lint, and build pass on the final reviewed commit.
- **G5 — Review:** Diffray successfully covers every changed file; zero successful analyzers is a blocker.
- **G6 — Git/PR:** Implementation commit, review-fix commit(s), clean worktree, pushed branch, and ready PR are evidenced.
- **G7 — Handoff:** The paste-ready result includes SHAs, commands, logs, PR state, findings, fixes, rejections, and unresolved source items.

## 4. Phase plans

### Phase 1 — Publication containment and auditable source baseline

**Dependency:** `origin/main` contains guardrail commit `6e62a3a`.

**Goal:** Stop unsupported claims from appearing verified and make evidence state observable before attempting broad corrections.

**Work units:**

- **P1-U01 Baseline inventory:** Recompute source, page, data-entity, grade, exam-level, reconciliation, and review-state counts from canonical files.
- **P1-U02 Forensic ledger:** Add stable issue IDs, exact evidence locations, quality/confidence, public visibility, disposition, and state for every confirmed defect.
- **P1-U03 Publication policy:** Implement one typed eligibility policy for verified/public/quarantined/`needs-review` records.
- **P1-U04 Scope containment:** Remove Grades 12–13/A/L and known unsupported entries from all public discovery/direct-route paths without losing audit history.
- **P1-U05 Honest metadata:** Replace invented source/reviewer/licence/completion states and hard-coded Admin validation claims with data-derived unknown/unverified values.
- **P1-U06 Integrity tests:** Add public leakage, provenance, review-state, direct-route, counter, and documentation-drift tests.
- **P1-U07 Evidence report:** Document inventory methodology, limitations, corrections, line references, and unresolved visual/OCR items.

**Acceptance:** No unsupported scope is publicly discoverable; quarantined direct routes are safe; counts and states are data-derived; known issues are ledgered rather than erased; final gates and Diffray coverage pass.

### Phase 2 — Canonical sources, terminology, acoustics, ragas, and talas

**Dependency:** Phase 1 PR merged and its ledger/publication policy available on `main`.

**Goal:** Correct the musical foundation on which lessons, audio demonstrations, quizzes, and navigation depend.

**Work units:**

- **P2-U01 Source and terminology normalization:** Verify source identities/metadata from the corpus; reconcile official Sinhala terms and deliberate aliases.
- **P2-U02 Acoustics:** Correct sound-property terminology, grade assignment, source pages, explanations, and dependent glossary/search content from verified Grade 10 evidence.
- **P2-U03 Ragas:** Build claim-level records for the source-supported school raga set; correct Bilawal; keep Bhairav quarantined unless exact evidence proves inclusion; verify arohana/avarohana, swara variants, jati, vadi/samvadi, pakad, time, grade, and notation separately.
- **P2-U04 Talas:** Reconcile the prescribed set; keep Roopak quarantined without evidence; verify matra/vibhag/tali/khali/theka arrays; represent Lawani’s school-specific context accurately; resolve Dadra only from readable evidence.
- **P2-U05 Audio/notation mapping:** Align scale highlights, synthesized demonstrations, tabla mapping, and notation displays with verified canonical records without changing the client-only/no-autoplay model.
- **P2-U06 Validation/migrations:** Add field-level provenance validation, musical invariants, stable-ID migrations, and regression tests for each corrected defect.
- **P2-U07 Correction ledger:** Record exact before/after values, source pages, evidence quality, code locations, and unresolved claims.

**Acceptance:** Public canonical facts are source-verifiable at field level; dependent audio/UI uses the corrected records; unsupported records remain contained; no unknown fact is silently filled from general music knowledge.

### Phase 3 — Instruments, folk/ritual traditions, theatre, and glossary

**Dependency:** Phase 2 PR merged so terminology and provenance schemas are stable.

**Goal:** Remediate the remaining canonical entity catalogs without expanding beyond the supplied curriculum.

**Work units:**

- **P3-U01 Entity inventory:** Map every instrument, folk/ritual tradition, theatre tradition, and glossary entry to exact supplied-source claims.
- **P3-U02 Instruments:** Verify names, classification systems, construction, playing method, use/context, grade, and relationships; separate Sri Lankan, Hindustani, and Western taxonomies rather than flattening them.
- **P3-U03 Cultural traditions:** Verify work-song, ritual, Indigenous, dance/drumming, and social-context claims while avoiding unsupported cultural generalization.
- **P3-U04 Theatre traditions:** Verify Nadagam, Nurthi, Sokari, Kolam, and related music claims with source-specific chronology and terminology.
- **P3-U05 Glossary synchronization:** Generate or validate glossary/search aliases from the corrected canonical terms and remove circular or invented definitions.
- **P3-U06 Public presentation:** Ensure list/detail/search pages use publication eligibility and honest source panels; quarantine uncertain entities/fields.
- **P3-U07 Tests and ledger:** Add claim, relationship, duplicate, taxonomy, direct-route, search, and documentation-drift coverage with auditable corrections.

**Acceptance:** Every public field in these catalogs is traceable, classifications retain their source context, uncertain claims are visibly non-public or marked, and all downstream references remain valid.

### Phase 4 — Source-derived lessons, quizzes, and examinations

**Dependency:** Phases 1–3 merged; canonical facts, terminology, provenance, and publication rules are stable.

**Goal:** Rebuild the student learning and assessment layer from verified Grades 6–11/O/L content rather than preserving unreliable prose.

**Work units:**

- **P4-U01 Coverage backlog:** Derive the lesson backlog from verified competency/content evidence and classify complete, partial, blocked, duplicate, and unsupported records.
- **P4-U02 Lessons:** Correct or rewrite lessons using concise original Sinhala explanations, verified claims, valid prerequisites, 17-point structure where applicable, and claim-level citations.
- **P4-U03 Activities:** Align listen, sing/play, guided, and independent practice with corrected canonical data and realistic grade prerequisites.
- **P4-U04 Quizzes:** Rebuild multi-format questions, answer keys, distractors, and supportive explanations; ensure answers are entailed by verified lesson evidence.
- **P4-U05 Exams:** Restrict to evidence-supported levels and patterns; remove false A/L labeling and prevent O/L/A/L template mismatches; distinguish practice questions from official past papers.
- **P4-U06 Rights and originality:** Paraphrase source material, avoid redistributing long textbook passages or copyrighted media, and preserve only the facts/short notation needed pedagogically.
- **P4-U07 Validation and ledger:** Add prerequisite, answerability, citation, level, publication, ID migration, and cross-reference tests plus per-lesson correction evidence.

**Acceptance:** Every public lesson/question is supported, answerable, age-appropriate, and internally consistent; no A/L or unsupported grade leakage returns; blocked visual/OCR lessons remain withheld.

### Phase 5 — Curriculum graph, learning paths, search, Admin, and Teacher workspaces

**Dependency:** Phase 4 PR merged; the public lesson catalog is stable enough to map.

**Goal:** Make architecture and workspaces computed from remediated content instead of hard-coded completeness claims.

**Work units:**

- **P5-U01 Competency graph:** Map exact official competency/outcome evidence to canonical concepts, lessons, prerequisites, grade bands, and coverage status.
- **P5-U02 Coverage computation:** Generate coverage and gap metrics from the graph; remove manual totals and distinguish verified, partial, blocked, deferred, and absent.
- **P5-U03 Learning paths:** Repair duplicates, broken prerequisites, false goal promises, dead steps, and unsupported digital/exam destinations; add reachability and goal-satisfaction tests.
- **P5-U04 Search/navigation:** Index only eligible content while supporting approved Sinhala spelling/alias behavior; prevent quarantined leakage through suggestions and counts.
- **P5-U05 Admin:** Bind review workflow and validation summaries to real records/events; never manufacture reviewers or completion percentages.
- **P5-U06 Teacher workspace:** Align collections, assignment outlines, competency labels, and print output with eligible lessons and verified mappings.
- **P5-U07 Integrity/browser tests:** Cover DAG cycles, reachability, counts, filters, direct links, persistence/migrations, and representative workspace flows.

**Acceptance:** Curriculum and path claims can be traced end-to-end; counts are reproducible; each path has unique purposeful steps and reachable goals; workspaces cannot imply unavailable content is approved.

### Phase 6 — Student experience, accessibility, Web Audio, and privacy QA

**Dependency:** Phase 5 PR merged. Content is frozen except for defects whose correction is supported by existing evidence.

**Goal:** Verify the remediated product as a mobile-first Sinhala learning experience without reopening curriculum scope.

**Work units:**

- **P6-U01 Journey matrix:** Exercise homepage → grade/goal → path → lesson → activity → quiz → progress and direct/quarantined routes.
- **P6-U02 Mobile/responsive:** Test 320/360/390px and representative desktop widths for overflow, touch targets, sticky/fixed UI, tables, notation, and long Sinhala text.
- **P6-U03 Accessibility:** Verify landmarks, headings, keyboard navigation, focus, labels, contrast, reduced motion, screen-reader status, and error/under-review messaging.
- **P6-U04 Web Audio:** Test explicit user activation, stop/cleanup, route changes, repeated starts, raga/tala mapping, pitch-permission denial, device absence, and low-bandwidth behavior.
- **P6-U05 Privacy:** Confirm microphone data stays in browser memory and that there are no trackers, recordings/uploads, autoplay, or unexpected network requests.
- **P6-U06 State/persistence:** Verify progress, bookmarks, grade filters, assignments, migration aliases, and quarantined-item behavior across reloads.
- **P6-U07 Automated evidence:** Add focused component/E2E tests and browser evidence for fixed defects without mass snapshots.

**Acceptance:** Critical journeys work at required widths and input modes; audio/privacy contracts hold; content remains frozen; accessibility defects within repo scope are fixed and regression-tested.

### Phase 7 — Independent forensic audit and release-readiness evidence

**Dependency:** Phase 6 PR merged and all previous paste-ready handoffs available.

**Goal:** Independently test the programme’s claims, fix remaining repository-owned defects, and state release readiness without deploying or hiding external evidence gaps.

**Work units:**

- **P7-U01 Ledger closure audit:** Reconcile every issue and correction across source data, public UI, tests, docs, and Git history; reopen unsupported closures.
- **P7-U02 Source sampling:** Perform risk-based and random claim/page sampling across all public domains, emphasizing low-quality/OCR, musical arrays, grade assignments, and terminology.
- **P7-U03 Scope/leakage audit:** Search rendered and static content for Grades 12–13/A/L, quarantined entities, invented review/metadata, stale completion claims, and route/search leaks.
- **P7-U04 Full technical QA:** Run complete automated gates, dependency/security checks available in the repository, E2E/browser matrix, production build/start smoke, audio/privacy checks, and link/route integrity.
- **P7-U05 Residual remediation:** Fix only evidence-backed repository-owned defects, add regressions, and update the ledger. Do not fabricate missing-source closure.
- **P7-U06 Release report:** Publish exact verified scope, unresolved original-PDF/manual-review blockers, coverage, test/browser evidence, known risks, and rollback/operational notes applicable to this static app.
- **P7-U07 Final external review:** Run Diffray across all phase changes in bounded batches plus the Phase 7 diff, fix findings in local review commits, and open the final ready PR.

**Acceptance:** Release status is evidence-backed and explicitly bounded. “Ready” is allowed only for the verified Grades 6–11 repository scope; unresolved source/visual/manual-review items remain visible blockers or exclusions. No deployment or merge occurs.

## 5. Stop conditions

Stop a phase and report a blocker when:

- required source evidence is absent or unreadable and proceeding would require invention;
- predecessor PR/merge SHA is missing or the worktree contains unrelated changes;
- a required verification gate remains failing because of the phase changes;
- Diffray has no successful analyzer coverage after three bounded retries for a required batch;
- PR creation/authentication fails after local work is safely committed and pushed; or
- completion needs hosted mutation, new credentials, original PDFs, SME judgment, or scope not explicitly authorized.

Do not convert a stop condition into a false completion claim. Preserve local commits, logs, and a paste-ready blocker handoff.

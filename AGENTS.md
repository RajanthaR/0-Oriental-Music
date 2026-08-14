# AGENTS.md — Agent & Contributor Guide for “ස්වර මඟ” (Swara Maga)

Welcome to **“ස්වර මඟ” (Swara Maga)**, the Sri Lankan School Oriental Music (පෙරදිග සංගීතය - Grades 6–13) digital learning platform.

This document serves as the primary technical and pedagogical operating guide for AI agents, developers, and curriculum contributors interacting with or extending this codebase.

---

## 1. Project Mission & Core Tenets

1. **Sinhala-First Identity**: The user-facing brand, navigation, lesson text, feedback, and error messages are in natural Sinhala Unicode (`si`). Never replace Sinhala branding with an English-first interface.
2. **Concept-Based, Not Chapter-Bound**: Learning is organized through concept relationships, prerequisites, student goals, and difficulty levels, rather than copying textbook chapter orders.
3. **100% Client-Side Web Audio**: All acoustic demonstrations (Swara synthesizer, Tanpura drone, Tabla strokes) are generated in real-time in the browser using the Web Audio API. **Never load or redistribute copyrighted `.mp3` or `.wav` files**.
4. **Absolute Child Safety & Privacy**: 
   - 0% microphone audio recordings are sent to servers (local autocorrelation only).
   - Zero advertisements, zero third-party tracking scripts, and no mandatory account registration.
5. **Strict Source Traceability**: Every lesson, raga, tala, and tradition entity must cite an official Tier 1 or Tier 2 Sri Lankan educational publication (NIE, Department of Educational Publications, or Department of Examinations).

---

## 2. Architecture & Directory Map

```
Oriental-Music/
├── data/
│   └── source-manifest.json        # Machine-readable catalog of canonical curriculum sources
├── docs/
│   ├── CURRICULUM_MAP.md           # Competency matrix for Strands A–J
│   ├── EDITORIAL_STYLE_GUIDE_SI.md # Sinhala terminology, tone, and formatting rules
│   ├── PRIVACY_AND_CHILD_SAFETY.md # Privacy, zero-tracking, and microphone security policies
│   └── DEPLOYMENT.md               # Local execution, test, and build instructions
├── src/
│   ├── app/                        # Next.js 14 App Router pages
│   │   ├── admin/                  # CMS publishing and review dashboard
│   │   ├── attributions/           # Open-source and pedagogical credits
│   │   ├── curriculum-map/         # Visual competency mapper
│   │   ├── exams/                  # O/L & A/L mock examination practice center
│   │   ├── glossary/               # Sinhala music glossary
│   │   ├── instruments/            # Instrument catalog & detail pages
│   │   ├── learning-paths/         # Goal-oriented learning path pages
│   │   ├── lessons/                # 17-point structured lesson directory & viewers
│   │   ├── practice/               # Interactive Web Audio tool suite hub
│   │   ├── privacy/                # Public privacy & child safety policy
│   │   ├── progress/               # Student dashboard (streaks, bookmarks, mastery)
│   │   ├── ragas/                  # Raga catalog and interactive scale explorers
│   │   ├── search/                 # Sinhala phonetic & transliterated search
│   │   ├── sources/                # Official sources transparency directory
│   │   ├── strands/                # 10 Curriculum strand detailed explorers
│   │   ├── talas/                  # Tala catalog & theka visualizers
│   │   ├── teachers/               # Teacher workspace (assignments & printables)
│   │   ├── theatre/                # Nadagam, Nurthi, Sokari, Kolam theatre traditions
│   │   ├── traditions/             # Sri Lankan folk and ritual music traditions
│   │   ├── globals.css             # Global styles, typography variables, warm theme
│   │   ├── layout.tsx              # Root HTML shell with Navbar and Footer
│   │   └── page.tsx                # Mobile-first student homepage
│   ├── components/
│   │   ├── audio/                  # Web Audio interactive components
│   │   │   ├── DroneController.tsx    # Tanpura drone generator with string animation
│   │   │   ├── EarTrainingModule.tsx  # Mystery swara and tala ear training
│   │   │   ├── NotationArranger.tsx   # Swara sequence puzzle arranger
│   │   │   ├── PitchDetectorView.tsx  # Local microphone pitch tuner with needle gauge
│   │   │   ├── RhythmTapGame.tsx      # Rhythm accuracy tapping challenge
│   │   │   ├── SwaraKeyboard.tsx      # Multi-saptaka piano with Raga scale highlights
│   │   │   └── TalaVisualizer.tsx     # Circular/linear Tala counter with synthetic tabla
│   │   ├── layout/                 # Navbar, Footer, LowBandwidthToggle
│   │   └── quiz/                   # QuizRunner (MCQ, Multi-select, Matching, Ordering, Short-answer)
│   ├── data/                       # Canonical JSON datasets
│   │   ├── cultural-traditions.json
│   │   ├── exam-papers.json
│   │   ├── glossary.json
│   │   ├── instruments.json
│   │   ├── learning-paths.json
│   │   ├── lessons.json
│   │   ├── ragas.json
│   │   ├── sources.json
│   │   ├── talas.json
│   │   └── theatre-traditions.json
│   ├── lib/
│   │   ├── audio/                  # Web Audio synthesis engines (synth, tanpura, tabla, pitch)
│   │   ├── data/                   # Centralized type-safe repository query engine
│   │   ├── search/                 # Sinhala normalizer & search index
│   │   ├── storage/                # Student progress & teacher assignment localStorage
│   │   └── validation/             # Content validator & citation integrity checker
│   ├── test/                       # Vitest unit and RTL component test suites
│   └── types/
│       └── content.ts              # Strict TypeScript domain interfaces
├── ATTRIBUTIONS.md                 # Open-source and educational credits
├── CONTENT_MODEL.md                # Entity schemas & relationship documentation
├── CONTENT_REVIEW_CHECKLIST.md     # 8-stage publishing workflow checklist
├── README.md                       # Bilingual project introduction & quickstart
├── SOURCES.md                      # Detailed catalog of all 13 canonical sources
└── package.json                    # Project scripts and dependencies
```

---

## 3. Rules for Modifying or Adding Content

When adding or updating lessons, ragas, talas, instruments, traditions, or exam questions:

### A. The 17-Point Structured Lesson Rule
Every lesson in `src/data/lessons.json` must follow the standardized 17-point structure:
1. `title_si`: Natural Sinhala title.
2. `learningGoal_si`: Must begin with `"මෙම පාඩම අවසානයේ ඔබට..."`.
3. `estimatedMinutes`: Realistic mobile completion time (e.g., 10–25 mins).
4. `prerequisites`: Array of valid prerequisite lesson IDs or concept codes.
5. `diagnosticQuestion`: 1 short question with `correctIndex` and `explanation_si`.
6. `contentSections`: Concise Sinhala text divided into digestible paragraphs.
7. `keyTerms`: Explicit definitions with optional transliterations and English equivalents.
8. `notationTable`: Structured rows and columns for swara/tala patterns where relevant.
9. `listenActivity`: Audio demonstration configuration (notes, tempo, instrument timbre).
10. `singOrPlayActivity`: Clear physical posture or performance guidance.
11. `guidedPractice`: Interactive tool linkage (`swara-keyboard`, `tala-visualizer`, `pitch-detector`, etc.).
12. `independentPractice`: Self-study task or puzzle data.
13. `quizId`: Reference to a mini quiz with at least 3 multi-format questions.
14. `recap_si`: 2–4 bulleted takeaway points.
15. `sourceReference`: Valid `sourceId` from `sources.json` and explicit `pageOrSection`.
16. `reviewMetadata`: Status (`Draft` ... `Published`), reviewer name, date, and license.
17. `nextRecommendedLessonId`: Next sequential or conceptual lesson.

### B. Tone & Feedback Policy
- All assessment feedback must be supportive and encouraging:
  - ✅ `"විශිෂ්ටයි! ඔබ සංකල්පය මනාව ග්‍රහණය කරගත්තා."`
  - ✅ `"හොඳ උත්සාහයක්! නැවත වරක් සවන් දී බලමු."`
  - ✅ `"මෙම කොටස නැවත පුහුණු වෙමු. තාල ස්පන්දනයට කන් දෙන්න!"`
- ❌ Avoid punitive, negative, or shame-based language.

### C. Validation Check
Always ensure `npm run test` passes, as the `content-validator.test.ts` suite enforces citation validity, goal statement prefixes, and tala beat counts.

---

## 4. Audio Engine Guidelines

1. **Synthetic Generation Only**: All musical notes must be created using `swaraSynth`, `tanpuraSynth`, or `tablaSynth`.
2. **Frequency Calculations**:
   - Standard Middle C (C4 / ෂඩ්ජය): $261.63\text{ Hz}$.
   - Formula for $n$ semitones from $S$: $f = f_{\text{root}} \times 2^{\frac{n}{12}}$.
   - $S=0, r=1, R=2, g=3, G=4, M=5, m=6, P=7, d=8, D=9, n=10, N=11, S'=12$.
3. **No Autoplay**: Never start audio without explicit user interaction (click/touch).
4. **Client-Side Microphone Handling**: The `PitchDetector` must strictly process data in memory with `AnalyserNode.getFloatTimeDomainData()` and autocorrelation. Never stream audio over WebSockets or HTTP.

---

## 5. Development & Testing Commands

```bash
# 1. Install dependencies
npm install

# 2. Run unit and component test suites (Vitest)
npm run test

# 3. Run TypeScript strict type-check
npm run type-check

# 4. Run ESLint code quality checks
npm run lint

# 5. Build production bundle (Statically optimized)
npm run build

# 6. Start local development server
npm run dev
# Server runs at http://localhost:3000
```

---

## 6. Review & Publishing Workflow (CMS)

Content progresses through 8 defined review stages (`ContentReviewStatus`):
1. `Draft`: Initial drafting by educator or AI assistant.
2. `SME Review`: Subject Matter Expert validates musicological precision.
3. `Language Review`: Sinhala Unicode grammar, diacritics, and terminology audit.
4. `Pedagogical Review`: Grade-band suitability and prerequisite ordering check.
5. `Audio Verification`: Auditory accuracy of Web Audio scale and theka synthesis.
6. `Accessibility & Mobile QA`: 360px viewport check, touch target sizing (44px+), contrast.
7. `Rights & Source Verification`: Canonical source citation and copyright gate check.
8. `Published`: Live for public student access.

---

## 7. Useful Reference Files

- [README.md](file:///z:/00Code/ANTIGRAVITY/Oriental-Music/README.md) — Bilingual project overview.
- [SOURCES.md](file:///z:/00Code/ANTIGRAVITY/Oriental-Music/SOURCES.md) — Source bibliography.
- [ATTRIBUTIONS.md](file:///z:/00Code/ANTIGRAVITY/Oriental-Music/ATTRIBUTIONS.md) — Credits and licenses.
- [CONTENT_MODEL.md](file:///z:/00Code/ANTIGRAVITY/Oriental-Music/CONTENT_MODEL.md) — Complete entity schemas.
- [docs/CURRICULUM_MAP.md](file:///z:/00Code/ANTIGRAVITY/Oriental-Music/docs/CURRICULUM_MAP.md) — Competency matrix.
- [docs/EDITORIAL_STYLE_GUIDE_SI.md](file:///z:/00Code/ANTIGRAVITY/Oriental-Music/docs/EDITORIAL_STYLE_GUIDE_SI.md) — Sinhala musical editorial guidelines.
- [docs/PRIVACY_AND_CHILD_SAFETY.md](file:///z:/00Code/ANTIGRAVITY/Oriental-Music/docs/PRIVACY_AND_CHILD_SAFETY.md) — Child privacy policy.
- [docs/DEPLOYMENT.md](file:///z:/00Code/ANTIGRAVITY/Oriental-Music/docs/DEPLOYMENT.md) — Deployment manual.

---

## 8. Forensic Source Integrity and Publication Safety

Until the forensic remediation programme is complete, treat the current application as a useful technical scaffold with an **untrusted content layer**. Passing schemas, tests, type checks, lint, or builds do not establish that a curriculum claim is true.

1. **Freeze unsupported expansion**: Do not add Grades 12–13, A/L, new ragas, new talas, or new curriculum claims unless the exact supplied source evidence is first recorded.
2. **Current verified public boundary**: Public curriculum claims must stay within Grades 6–11 unless a later phase supplies and verifies the missing official source set.
3. **Claim-level provenance**: Every factual or curriculum claim must identify a repository source document and an exact PDF page heading or bounded section. A bibliography entry by itself is not evidence.
4. **No invented metadata**: Do not infer or fabricate publishers, years, places, licences, organizations, reviewers, review dates, or publication status. Use an explicit unknown/unverified state when the supplied corpus does not establish a value.
5. **OCR is evidence with limits**: The repository currently contains extracted Markdown but no original PDF files. Text on low-quality, image-only, corrupt-font, ambiguous, or missing pages must remain `needs-review`; do not silently reconstruct it from musical memory.
6. **Publication containment**: Unsupported entities and routes must be removed from public discovery or clearly marked unavailable/unverified. Do not delete them merely to make validation green; retain an auditable remediation ledger.
7. **Terminology fidelity**: Prefer the terminology used by the verified official source. Record deliberate aliases separately; do not silently normalize distinct official terms.
8. **Contradictions are blockers**: When datasets, generated docs, UI copy, and source evidence disagree, record the conflict and resolve it from evidence before publishing the claim.
9. **No false review state**: Never populate a reviewer identity, approval date, licence, or `Published` state unless a real review event and its evidence exist.
10. **Visual verification boundary**: Source facts requiring diagrams, notation images, or page layout cannot be accepted from extracted prose alone. Record them for original-PDF/manual review.

The forensic programme and its phase prompts live under `docs/forensic-remediation/`. Each phase must preserve its evidence and correction ledger rather than replacing prior audit history.

---

## 9. Phase, Branch, Commit, and Pull-Request Protocol

Every implementation phase is an independently reviewable slice.

1. Start only after the preceding phase is merged and current `origin/main` is fetched. Record the base SHA and verify the worktree is clean.
2. Work on a dedicated `codex/` branch or the branch supplied by the Codex worktree. Never implement a phase directly on `main`.
3. Keep the phase scope exact. Do not fold later content completion, redesign, deployment, or unrelated cleanup into an earlier remediation phase.
4. Run the phase-specific tests and inspect the diff before the first commit.
5. Create a local implementation commit before external review. Record its SHA.
6. Run the mandatory Diffray review-fix loop in Section 10. Every accepted review fix must be tested and placed in one or more **local review-fix commits** such as `fix(review): address Diffray findings`.
7. Run the complete final verification gate on the reviewed HEAD.
8. Push the phase branch and open a **ready-for-review pull request**, not a draft. Never merge it. Do not open a ready PR while the mandatory review is incomplete or a required gate is failing.
9. Leave the worktree clean and report the final HEAD SHA, PR URL, base/head branches, and PR readiness state.
10. Do not deploy, mutate hosted services, or claim production readiness unless the phase prompt explicitly authorizes and verifies that scope.

---

## 10. Mandatory Diffray Review-Fix Loop on Windows

Sending the changed code and documentation to Diffray's servers is explicitly permitted for this repository. Do not send credentials, tokens, private keys, local environment files, or unrelated user data.

### A. Required review sequence

After the implementation commit and before opening the ready PR:

1. Inventory the committed changed files with Git and partition them into bounded, coherent batches. Review all changed files; do not omit data or documentation changes.
2. Discover the installed Diffray command and available analyzers locally. Use the repository's working Diffray installation rather than silently substituting a different reviewer.
3. Run Diffray from the repository root with its repository/stdin transport. Use short explicit `--files` batches, a small analyzer set per invocation, `--executor codex-cli`, and structured JSON output. Store logs at short temporary paths.
4. Keep the Windows process command short. **Never place the full diff, patch, source contents, or one enormous file list in command-line arguments.** Split file lists further before they approach Windows command-line limits.
5. For every batch, inspect the structured result and record the attempted files, analyzer names, `agentsExecuted`, `agentsSucceeded`, failed analyzers, findings, and log path. At least one intended analyzer must actually succeed, and the union of successful batches must cover every changed file.
6. Validate each finding against the code and project source rules. Fix valid findings, add regression coverage where appropriate, rerun relevant verification, and create a local review-fix commit.
7. Re-run Diffray on the fixes and the affected batch. Repeat for up to three review-fix cycles until there are no actionable findings.
8. Record rejected findings with concise technical reasons. A review is complete only when all planned batches have successful analyzer coverage and no unresolved actionable finding remains.

### B. The known Windows failure and its required handling

The following outcome is an unresolved review blocker, **not** a clean review:

> All failed before analysis because Diffray’s codex-cli executor exceeded the Windows command-line limit (ENAMETOOLONG). Zero analyzers completed, so there were no findings, fixes, or rejected findings. This is the exact unresolved review blocker.

Prevent it by using repository/stdin transport and bounded `--files` batches, keeping analyzer groups and paths small, and writing structured output to short temporary log paths. If `ENAMETOOLONG` occurs, reduce the batch size and rerun it. A timeout, missing/malformed JSON, `success: false`, or zero successful analyzers is handled the same way: preserve the failed attempt as evidence and retry with a smaller bounded batch.

If three review attempts still produce no successful analyzer coverage for any required batch, stop. Report the exact blocker, commands, batch, logs, and analyzer counts. Do not claim "no findings," do not bypass Diffray with a self-review, and do not open a ready PR.

---

## 11. Required Phase Handoff

At the end of every implementation phase, return a paste-ready handoff containing:

- phase and prompt number;
- base SHA, branch name, and clean/dirty worktree status;
- implementation commit SHA and every review-fix commit SHA;
- final HEAD SHA and changed-file inventory;
- exact Diffray command pattern, transport, analyzer set, file batches, log locations, per-batch `agentsExecuted`/`agentsSucceeded`/failures, findings, fixes, rejected findings, and final review verdict;
- exact verification commands and pass/fail summaries;
- ready PR URL, number, base/head branches, and state;
- source-evidence ledger or correction-log paths created or updated;
- remaining blockers, `needs-review` items, and explicitly deferred scope.

Do not compress this into a generic "tests passed" statement. The next phase cannot safely start without the SHAs, review evidence, PR state, and unresolved-source inventory.

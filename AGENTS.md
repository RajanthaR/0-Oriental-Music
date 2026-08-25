# AGENTS.md — Agent & Contributor Guide for “ස්වර මඟ” (Swara Maga)

Welcome to **“ස්වර මඟ” (Swara Maga)**, the Sri Lankan School Oriental Music (පෙරදිග සංගීතය) digital learning platform. The current verified public curriculum boundary is **Grades 6–11**. Grade 12–13 and A/L records may remain in raw forensic datasets, but they are quarantined and are not public curriculum content.

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
│   ├── app/                        # Next.js 16 App Router pages
│   │   ├── admin/                  # CMS publishing and review dashboard
│   │   ├── attributions/           # Open-source and pedagogical credits
│   │   ├── curriculum-map/         # Visual competency mapper
│   │   ├── exams/                  # Public Grade 6–11 examination practice; unsupported A/L records stay quarantined
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
├── SOURCES.md                      # Human-readable source inventory; machine counts live in the source catalogs
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
# Lint exits 0 at exactly 13 warnings: the script enforces
# --max-warnings=13, paired with two warn-pinned react-hooks rules in
# eslint.config.mjs (deferred-debt ratchet). A 14th warning fails the gate:
# fix the new site or consciously lower the floor after fixing an existing
# one - never raise it. When the floor is crossed ESLint's own output does
# not name --max-warnings as the cause; see eslint.config.mjs lines 22-26.

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

These labels define the CMS workflow contract only. They do not prove that any current record completed a real review stage. A record may claim `Published` only when the repository contains evidence of the corresponding completed review; otherwise use the explicit unknown/unverified state and let the forensic publication policy decide public eligibility.

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
6. Run the mandatory `ce-code-review` skill review-fix loop in Section 10. The skill reviews the complete phase diff with multiple specialist agents, independently validates surviving findings, applies safe fixes, and creates a local review-fix commit when the pre-review tree is clean.
7. Run the complete final verification gate on the reviewed HEAD.
8. Push the phase branch and open a **ready-for-review pull request**, not a draft. Never merge it. Do not open a ready PR while the mandatory review is incomplete or a required gate is failing.
9. Leave the worktree clean and report the final HEAD SHA, PR URL, base/head branches, and PR readiness state.
10. Do not deploy, mutate hosted services, or claim production readiness unless the phase prompt explicitly authorizes and verifies that scope.

---

## 10. Mandatory `ce-code-review` Skill Review-Fix Loop

Use the `rajantha-skills-library:ce-code-review` skill for every phase review. This is the required multi-agent code-review system; do not substitute an ad hoc self-review, the harness's quick built-in review, or an unstructured set of agents.

There is no repository-wide requirement to use a particular model, provider, or named reasoning level for reviewers or validators. Use models supported by the active agent environment and the review skill, record the actual model/provider coverage in the artifacts, and preserve every required reviewer, validator, scope, and acceptance gate. Model unavailability must never be misreported as successful review coverage.

The canonical checklist also lives in `docs/forensic-remediation/SKILL_MULTI_AGENT_REVIEW.md`. The rules below remain mandatory even when a phase prompt is older or less specific.

### A. Pre-review checkpoint and invocation

After the implementation commit and before any push or PR creation:

1. Record the exact phase base SHA, branch, implementation commit SHA, `HEAD`, and clean/dirty worktree state. The normal phase path must be clean so the skill can isolate its applied fixes in a review-labeled commit.
2. Inventory the complete phase diff with Git, including code, tests, data, and documentation. Untracked files are outside skill scope unless staged; do not hide required phase files as untracked.
3. Invoke the full skill on the current checkout with the explicit phase base: `rajantha-skills-library:ce-code-review base:<base-sha> grouping:auto`. Do not request a quick, fast, or light review because that activates the single-reviewer short circuit.
4. Use default interactive mode so the skill can apply safe verified fixes and commit them when the pre-review tree is clean. `mode:agent` is allowed only when a coordinating workflow explicitly needs JSON and will itself apply, verify, and commit every accepted finding before rerunning the skill.
5. The review skill never pushes, opens PRs, changes branches, or files tickets. Those outward actions remain the phase agent's responsibility after review acceptance and final verification.

### B. Required reviewer and validation evidence

1. The review must cover the complete diff from the recorded base. Confirm the skill's `files_changed`/scope inventory agrees with Git and record any excluded untracked paths.
2. Record the announced reviewer team and each conditional reviewer's selection reason. Every run must dispatch the four always-on personas—correctness, testing, maintainability, and project-standards—plus `ce-agent-native-reviewer` and `ce-learnings-researcher`. Add every conditional specialist warranted by the diff.
3. Preserve the run ID and artifact directory under `/tmp/compound-engineering/ce-code-review/<run-id>/`, including `metadata.json`, the per-reviewer JSON artifacts, synthesized findings, actionable findings, advisory outputs, and `report.md` or `review.json` for the chosen mode.
4. Findings must pass the skill's schema, deduplication, confidence gate, and severity calibration. Record malformed reviewer returns, suppressed findings, demotions, pre-existing findings, residual risks, and testing gaps rather than presenting an empty table as sufficient evidence.
5. When any finding survives synthesis, the independent per-finding validator wave is mandatory. Record validator dispatches, validated/rejected counts and reasons, infrastructure failures, over-budget drops, and any degraded P0/P1 finding. When zero findings survive, record that validation correctly did not run.
6. A required reviewer timeout/failure, missing required artifact, validator infrastructure failure that leaves degraded P0/P1 evidence, or incomplete scope is a review blocker. Correct the failure and rerun; do not convert degraded coverage into “zero findings.”

### C. Fix and rereview cycles

1. In default mode, let the skill apply clear reversible fixes, run affected checks, and create one isolated local `fix(review): ...` commit when the pre-review tree was clean. Record the applied table and commit SHA.
2. For findings the skill does not apply, resolve every actionable `downstream-resolver` item in scope, add regression coverage where appropriate, and consolidate the accepted fixes from that cycle into one tested local `fix(review): ...` commit. Record human/release-owned findings and justified rejections separately.
3. Rerun the full skill against the same phase base after fixes. Repeat for at most three review-fix cycles.
4. Review acceptance requires `status: complete`, full scope and required-reviewer coverage, a final verdict of `Ready to merge`, no actionable findings, no degraded P0/P1 validation, and no unmet explicit-plan requirement. Residual risks and testing gaps must be explicitly accepted or remain blockers under the phase prompt.
5. Run the complete phase verification gate on the final reviewed HEAD. Only then may the phase agent push and open a ready PR; the skill itself never performs those actions.

### D. Failure and stop conditions

If the skill is unavailable, the platform cannot dispatch the required reviewers/validators, artifacts are malformed or missing, all reviewers fail, validation remains degraded, or three review-fix cycles still leave actionable findings, stop and report the exact blocker. Preserve commits and artifacts. Do not replace the skill with an informal review, do not claim approval, and do not open or retain a ready PR while the gate is incomplete.

---

## 11. Required Phase Handoff

At the end of every implementation phase, return a paste-ready handoff containing:

- phase and prompt number;
- base SHA, branch name, and clean/dirty worktree status;
- implementation commit SHA and every review-fix commit SHA;
- final HEAD SHA and changed-file inventory;
- exact review-skill identifier and arguments, scope/base/head, run IDs and artifact paths, reviewer team with conditional reasons and outcomes, validator metrics, findings, applied fixes, review-fix commits, rejected/suppressed/demoted findings, residual risks, testing gaps, and final skill verdict;
- exact verification commands and pass/fail summaries;
- ready PR URL, number, base/head branches, and state;
- source-evidence ledger or correction-log paths created or updated;
- remaining blockers, `needs-review` items, and explicitly deferred scope.

Do not compress this into a generic "tests passed" statement. The next phase cannot safely start without the SHAs, review evidence, PR state, and unresolved-source inventory.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

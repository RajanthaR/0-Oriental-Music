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

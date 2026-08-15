# Prompt 2 — Canonical musical core remediation

Implement Phase 2 of the Swara Maga forensic remediation programme: verified sources/terminology, acoustics, ragas, talas, and their audio/notation mappings.

## Start gate

- Read `AGENTS.md`, `docs/forensic-remediation/README.md`, `docs/forensic-remediation/PHASED_PLAN.md`, and the complete Prompt 1 handoff before editing.
- Do not start until Prompt 1’s ready PR is human-merged and current `origin/main` contains its final reviewed work. Fetch, verify a clean worktree, record the base SHA, and use the supplied worktree branch or create `codex/forensic-p02-musical-core` if detached/on `main`.
- Treat Prompt 1’s canonical ledger, publication policy, evidence-quality rules, and correction log as contracts. Preserve stable IDs and append audit history.
- Use `rajantha-skills-library:ce-code-review` for the mandatory full multi-agent review. Never expose secrets or unrelated data. Do not merge, deploy, or mutate hosted services.

## Objective

Replace unreliable foundational musical facts with field-level, source-bounded canonical records. Correct downstream UI/audio only where it depends on these records. General musical knowledge may help locate a question, but it is never sufficient evidence for publication.

## Required implementation

1. Verify source-document identity and only those publisher/year/licence fields established by the supplied corpus. Keep unknown values explicit.
2. Reconcile official Sinhala acoustics and music terminology, deliberate aliases, transliterations, and search behavior. For the sound-properties material, verify grade, terminology, and exact Grade 10 source pages; do not retain false Grade 6 page claims.
3. Audit every raga field independently: prescribed inclusion, grades, name/variant, arohana, avarohana, swara forms, omitted/varjit swaras, jati, vadi, samvadi, pakad, performance time, phrases, notation, and evidence quality.
   - Correct school Bilawal from the official source instead of preserving the Alhaiya Bilawal mismatch.
   - Keep Bhairav quarantined unless exact supplied evidence establishes it in scope.
   - Do not fill absent details from memory. A raga may have verified core fields and separate withheld fields.
4. Audit every tala field independently: prescribed inclusion, grades, matra, vibhag, tali/khali/sam, theka bol-to-beat mapping, tempo/context, spelling, and exact evidence.
   - Keep Roopak quarantined unless the supplied source proves it belongs in scope.
   - Represent Lawani’s stated school-system context accurately rather than flattening it into a generic North Indian category.
   - Replace the unsupported Dadra page claim only if readable exact evidence is located; otherwise keep it `needs-review` and non-public.
5. Align raga explorers, keyboard highlights, demonstrations, tala visualizers, tabla strokes, notation tables, glossary terms, search aliases, and dependent summaries with the corrected canonical data. Preserve client-only generation, explicit user activation, and no copyrighted audio.
6. Strengthen validators and regression tests for field-level provenance, grade/publication eligibility, raga swara consistency, tala beat/vibhag/bol consistency, terminology drift, duplicate IDs/aliases, source-page existence, and audio/UI mapping.
7. Update the forensic ledger and append-only correction log with exact before/after values, source document and PDF page/section, evidence quality, final file/line references, publication disposition, and unresolved original-PDF/SME items.

## Non-goals

- Do not remediate instruments, traditions, theatre, all lessons/quizzes/exams, learning paths, or curriculum coverage except for narrowly required references to the corrected musical core.
- Do not promote unsupported records to make lists look complete.
- Do not redesign the UI, add media, deploy, or merge.

## Verification

Run focused provenance/content/audio/component tests and then `npm run test`, `npm run type-check`, `npm run lint`, and `npm run build`. Inspect each public/direct raga and tala route and representative acoustics/search views; perform 360px and desktop browser checks when the environment supports them. Report limitations rather than fabricating evidence.

## Mandatory `ce-code-review` skill review-fix loop

1. Create a scoped local implementation commit after initial verification and record its SHA.
2. Inventory the complete phase diff from the predecessor/base SHA; stage required new files so the skill does not exclude them as untracked.
3. Invoke `rajantha-skills-library:ce-code-review base:<base-sha> grouping:auto` in default mode. Never request a quick/fast/light review or combine `base:` with a PR/branch target.
4. Record scope/base/head, the six always-on reviewers, warranted conditional reviewers and reasons, reviewer outcomes, run ID, and all artifacts under `/tmp/compound-engineering/ce-code-review/<run-id>/`.
5. Require the independent per-finding validator wave whenever findings survive. Record validated/rejected counts and reasons, infrastructure failures, over-budget drops, and degraded P0/P1 evidence; zero surviving findings is the only valid reason to skip validation.
6. Treat incomplete scope, missing artifacts, required reviewer failure, malformed output, degraded P0/P1 validation, or unmet explicit-plan requirements as blockers—not clean review evidence.
7. Let default mode apply and verify clear fixes and create its isolated local `fix(review): ...` commit on the clean tree. Resolve any remaining actionable `downstream-resolver` items with regression coverage and one tested local review-fix commit per cycle; record rejections and human/release-owned items.
8. Rerun the full skill against the same base for at most three review-fix cycles.
9. Accept only `status: complete`, complete scope/reviewer coverage, `Ready to merge`, no actionable findings, no degraded P0/P1 validation, and no unmet explicit-plan requirement. Resolve or explicitly classify residual risks/testing gaps.
10. Run the full final gate on reviewed HEAD. Only then may the phase agent push and open a ready PR against `main`; the skill itself never pushes or opens PRs. Never merge it.

## Paste-ready handoff

Return: `PHASE`, predecessor merge/base SHA, branch, implementation commit, review-fix commit(s), final HEAD, worktree status, changed files, exact evidence/correction paths, review-skill identifier/arguments, scope/base/head, run IDs/artifacts, reviewers/reasons/outcomes, validator metrics, findings/fixes/rejections/suppressions/demotions, residual risks/testing gaps, final skill verdict, verification and browser results, ready PR URL/number/base/head/state, unresolved `needs-review` items, blockers, and deferred scope. Generic “tests passed” or “no findings” text is insufficient.

# Prompt 2 — Canonical musical core remediation

Implement Phase 2 of the Swara Maga forensic remediation programme: verified sources/terminology, acoustics, ragas, talas, and their audio/notation mappings.

## Start gate

- Read `AGENTS.md`, `docs/forensic-remediation/README.md`, `docs/forensic-remediation/PHASED_PLAN.md`, and the complete Prompt 1 handoff before editing.
- Do not start until Prompt 1’s ready PR is human-merged and current `origin/main` contains its final reviewed work. Fetch, verify a clean worktree, record the base SHA, and use the supplied worktree branch or create `codex/forensic-p02-musical-core` if detached/on `main`.
- Treat Prompt 1’s canonical ledger, publication policy, evidence-quality rules, and correction log as contracts. Preserve stable IDs and append audit history.
- Sending changed repository files to Diffray is allowed; never send secrets or unrelated data. Do not merge, deploy, or mutate hosted services.

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

## Mandatory local commit and Diffray review-fix loop

1. Create a scoped local implementation commit after the initial verification and record its SHA.
2. Review every committed changed file with Diffray from the repository root. Use repository/stdin transport, short bounded explicit `--files` batches, small analyzer sets, `--executor codex-cli`, structured JSON, and short temporary log paths. Never inline the full diff, file contents, or a large combined path list in the Windows command.
3. Record each batch’s files, analyzers, `agentsExecuted`, `agentsSucceeded`, failures, findings, and log. Successful batches must cover all changed files.
4. This is an unresolved blocker, not a clean review: “All failed before analysis because Diffray’s codex-cli executor exceeded the Windows command-line limit (ENAMETOOLONG). Zero analyzers completed, so there were no findings, fixes, or rejected findings. This is the exact unresolved review blocker.”
5. On `ENAMETOOLONG`, timeout, malformed/missing JSON, `success: false`, or zero successful analyzers, preserve the attempt and retry a smaller batch. Stop after three failed attempts for a required batch; do not open a ready PR.
6. Validate findings, fix valid ones with regression coverage, rerun relevant gates, and create a separate local `fix(review): ...` commit. Record rejected findings with reasons.
7. Re-run Diffray on affected batches and repeat for at most three review-fix cycles until no actionable findings remain. Run the full final gate on reviewed HEAD.
8. Push and open a ready PR against `main` only after successful coverage and gates. Never merge it.

## Paste-ready handoff

Return: `PHASE`, predecessor merge/base SHA, branch, implementation commit, review-fix commit(s), final HEAD, worktree status, changed files, exact evidence/correction paths, per-batch Diffray commands/transport/analyzers/files/logs/agent counts/findings/fixes/rejections/final verdict, verification and browser results, ready PR URL/number/base/head/state, unresolved `needs-review` items, blockers, and deferred scope. Generic “tests passed” or “no findings” text is insufficient.

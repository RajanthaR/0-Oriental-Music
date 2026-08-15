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

## Mandatory local multi-agent Diffray review-fix loop

1. Create a scoped local implementation commit after the initial verification and record its SHA.
2. Record the exact local Diffray executable/version, `review --help`, available agents, and `codex-cli` support. An unknown-agent configuration warning is incomplete evidence and must be corrected and rerun.
3. Inventory all committed files and review coherent bounded batches from the repository root with `diffray review --base <base-sha> --head HEAD --files <short-comma-list> --executor codex-cli --json`. For bounded full-file documentation/data review only, use `diffray review --files <short-comma-list> --full --executor codex-cli --json`; never combine `--full` with `--base`/`--head`.
4. Primary coverage must omit `--agent` and `--skip-validation`, allowing the normal applicable multi-agent set and validation stage to run. Restricted-agent retries are diagnostic-only and validation-skipped runs cannot satisfy final coverage.
5. Let Diffray manage concurrency. Keep Windows arguments and JSON log paths short; never inline the diff, patch, contents, or a huge file list.
6. Record files, commands, transport, selected agents, validation, `agentsExecuted`, `agentsSucceeded`, failures, warnings, findings, and logs. Accept only valid `success: true` batches with applicable agents successful, validation complete, no unknown-agent warning, and no unresolved validated finding.
7. A one-agent batch needs explicit evidence that only one agent applied. Multiple distinct applicable agents must succeed across the complete phase diff, and accepted primary batches must cover every changed file. Earlier restricted or validation-skipped logs are supplemental only.
8. This is an unresolved blocker, not a clean review: “All failed before analysis because Diffray’s codex-cli executor exceeded the Windows command-line limit (ENAMETOOLONG). Zero analyzers completed, so there were no findings, fixes, or rejected findings. This is the exact unresolved review blocker.”
9. Preserve and retry a smaller/corrected batch after `ENAMETOOLONG`, timeout, HTTP/authentication failure, malformed/missing JSON, `success: false`, zero successful agents, incomplete validation, or unknown-agent warnings. Stop after three failed attempts for a required batch; do not open a ready PR.
10. Validate findings, fix valid ones with regression coverage, rerun relevant gates, and consolidate all accepted findings from the cycle into one local `fix(review): ...` commit. Record rejected findings with reasons; do not commit per finding.
11. Rerun only affected primary batches with normal multi-agent selection and validation enabled for at most three review-fix cycles. Run the full final gate on reviewed HEAD.
12. Push and open a ready PR against `main` only after accepted multi-agent coverage, completed validation, and green gates. Never merge it.

## Paste-ready handoff

Return: `PHASE`, predecessor merge/base SHA, branch, implementation commit, review-fix commit(s), final HEAD, worktree status, changed files, exact evidence/correction paths, local Diffray executable/version, primary commands/transport/files/selected agents/validation/logs/agent counts/failures/warnings/findings/fixes/rejections, supplemental diagnostic runs, final multi-agent verdict, verification and browser results, ready PR URL/number/base/head/state, unresolved `needs-review` items, blockers, and deferred scope. Generic “tests passed” or “no findings” text is insufficient.

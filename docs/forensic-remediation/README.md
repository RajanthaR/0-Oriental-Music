# Swara Maga Forensic Remediation Programme

This folder is the execution package for replacing the unreliable content layer with an auditable, source-bounded Grades 6–11 platform while preserving the existing technical scaffold.

## Dispatch status

- Prompt 1 was submitted on 2026-08-15 to a new Codex worktree task using GPT-5.6 Luna with Max reasoning.
- Submission receipt: `client-new-thread:3acd6169-aca5-4af2-a0e2-04dd4cebdd48`.
- A `clientThreadId` confirms that worktree setup was queued. It is not proof that implementation started or completed. Add the final task ID here when the app exposes it.
- Dispatch baseline: `origin/main` at `6e62a3a` (`docs: add forensic remediation guardrails`).
- Review-workflow correction (2026-08-15): Prompt 1 was initially dispatched with restricted single-analyzer guidance. The prompt files now require the normal local multi-agent Diffray workflow with validation enabled. Earlier restricted or validation-skipped logs are supplemental only.

## Hard sequencing rule

Run one prompt at a time. Prompt N+1 may start only after all of the following are true for Prompt N:

1. its ready PR has completed the local multi-agent Diffray review-fix loop with validation enabled and accepted primary batches covering every changed file;
2. required local gates pass on the final reviewed commit;
3. the PR has been reviewed and merged by a human;
4. `origin/main` contains that merge;
5. the coordinating task has received the paste-ready handoff with SHAs, review evidence, unresolved source items, and PR state.

Never infer a merge or clean review from a queued task ID, a green build, an empty finding list, a restricted single-agent run, a validation-skipped run, or a zero-analyzer Diffray run.

## Programme map

| Prompt | Phase | Primary outcome |
|---:|---|---|
| 1 | Publication containment and source baseline | Unsupported claims stop appearing as verified; the evidence and issue ledgers become authoritative. |
| 2 | Canonical musical core | Sources, terminology, acoustics, ragas, talas, and their audio mappings are corrected from evidence. |
| 3 | Instruments and cultural domains | Instruments, folk/ritual, theatre, and glossary claims receive claim-level provenance and correction. |
| 4 | Lessons, quizzes, and exams | Grades 6–11/O/L learning and assessment content is rebuilt from the verified canonical layer. |
| 5 | Curriculum architecture and workspaces | Curriculum mapping, learning paths, search, Admin, and Teacher views become computed, coherent, and honest. |
| 6 | Student experience and quality | Mobile, accessibility, Sinhala presentation, Web Audio, privacy, and end-to-end flows are verified under content freeze. |
| 7 | Independent final audit and release readiness | Residual repo-owned defects are fixed and evidence-backed readiness/blocker status is published without deploying. |

Detailed work units, dependencies, gates, and acceptance criteria are in [PHASED_PLAN.md](./PHASED_PLAN.md). The canonical Windows-safe review procedure is in [DIFFRAY_MULTI_AGENT_REVIEW.md](./DIFFRAY_MULTI_AGENT_REVIEW.md). Self-contained implementation prompts are in [prompts](./prompts/).

## Global rules

- `AGENTS.md` Sections 8–11 are mandatory for every phase.
- Extracted Markdown is not a substitute for visual inspection of missing original PDFs. Ambiguous/OCR/diagram claims remain `needs-review`.
- The public boundary stays Grades 6–11 unless a later, explicitly authorized source-ingestion programme supplies and verifies additional official sources.
- No phase may fabricate source metadata, reviewer identities, licences, approval dates, coverage, or release status.
- Every phase produces an implementation commit before review. Primary Diffray runs use the local CLI's default applicable multi-agent set with validation enabled; they omit `--agent` and `--skip-validation`.
- Every committed changed file must be covered by accepted bounded primary batches. Across the phase diff, multiple distinct applicable agents must succeed; a one-agent batch needs explicit applicability evidence.
- Consolidate all accepted findings from one review cycle into one tested local `fix(review): ...` commit, then rerun only affected primary batches for at most three cycles.
- Sending selected changed files to Diffray is pre-authorized, but secrets, environment files, microphone/user data, and unrelated files remain prohibited.
- Every successful phase ends with a pushed ready PR against `main`; agents never merge their own PRs.
- No prompt authorizes deployment, hosted-service mutation, copyrighted audio/media redistribution, tracking, or credentials.

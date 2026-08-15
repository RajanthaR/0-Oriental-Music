# Skill-Based Multi-Agent Code Review Workflow

This is the canonical review procedure for every forensic-remediation phase. `AGENTS.md` Section 10 is authoritative if the two documents ever disagree.

## Required skill

Use `rajantha-skills-library:ce-code-review`. It provides tiered specialist reviewers, structured artifacts, confidence-gated merge/deduplication, independent per-finding validation, safe local fixes, and a final verdict.

Do not substitute:

- a quick/fast/light review, which activates the skill's built-in single-reviewer short circuit;
- an ad hoc self-review or informal agent list;
- tests, lint, builds, CI, or preview deployment success;
- an unstructured “no findings” statement without run artifacts.

The skill never pushes, opens PRs, changes branches, or files tickets. The phase agent owns those actions only after review acceptance and final verification.

## Pre-review checkpoint

Create the scoped implementation commit first. Record the phase base SHA, branch, implementation commit, current `HEAD`, and worktree state. The normal path requires a clean tree so skill-applied fixes are committed separately.

Inventory the complete diff from the phase base. Stage required new files because untracked files are excluded from review scope by the skill.

Invoke the full default-mode review on the current checkout:

```text
rajantha-skills-library:ce-code-review base:<base-sha> grouping:auto
```

Do not combine `base:` with a PR number or branch target. Do not add quick/fast/light language. Use `mode:agent` only when a coordinating workflow explicitly needs its JSON contract and will apply, verify, and commit accepted findings itself.

## Reviewer coverage

Every review includes:

- `ce-correctness-reviewer`;
- `ce-testing-reviewer`;
- `ce-maintainability-reviewer`;
- `ce-project-standards-reviewer`;
- `ce-agent-native-reviewer`;
- `ce-learnings-researcher`.

The orchestrator adds relevant conditional reviewers for security, performance, API contracts, migrations, reliability, adversarial behavior, previous PR comments, frontend races, Swift/iOS, and risky deployment changes. Record the announced team and the reason for every conditional selection or exclusion.

Required coverage evidence includes:

- scope mode, base, branch, head SHA, and complete changed-file count;
- excluded untracked files;
- reviewer dispatch/success/failure outcomes;
- malformed returns and suppressed/demoted/pre-existing findings;
- residual risks and testing gaps;
- run ID and artifact directory.

## Validation and artifacts

Preserve `/tmp/compound-engineering/ce-code-review/<run-id>/`, including `metadata.json`, per-reviewer JSON, synthesized and actionable findings, advisory outputs, and `report.md` or `review.json`.

When any finding survives merge/deduplication and confidence gating, the independent per-finding validator wave is mandatory. Record dispatch count, validated/rejected results and reasons, infrastructure failures, over-budget drops, and degraded P0/P1 evidence. If zero findings survive, state that validation correctly did not run.

A required reviewer failure, missing required artifact, incomplete diff scope, or degraded P0/P1 validation blocks acceptance. Never convert infrastructure failure into “no findings.”

## Review-fix loop

In default mode, the skill applies clear reversible fixes, runs affected checks, and commits one isolated `fix(review): ...` commit when the pre-review tree was clean. For unapplied actionable findings, the phase agent resolves the accepted items, verifies them, and consolidates that cycle into one local review-fix commit.

Rerun the full skill against the same base after fixes. Repeat for at most three cycles.

Review is accepted only when:

- status is `complete`;
- scope covers the complete phase diff;
- all required reviewers and warranted conditional reviewers completed;
- the final verdict is `Ready to merge`;
- no actionable finding remains;
- no P0/P1 validation is degraded;
- no explicit-plan requirement is unmet;
- residual risks and testing gaps are explicitly resolved, accepted, or classified as phase blockers.

Run all phase verification gates on the final reviewed HEAD. The phase agent may then push and open a ready PR; the skill itself never does.

## Stop and handoff

After three failed review/fix cycles—or when the skill, required sub-agents, validators, or artifacts are unavailable—stop. Preserve local commits and artifacts. Do not substitute another review method or open/retain a ready PR.

The paste-ready handoff must include the skill identifier/arguments, scope/base/head, run IDs and artifacts, reviewer set and outcomes, validator metrics, findings/fixes/rejections, review-fix commits, residual risks/testing gaps, final verdict, final verification, and PR state.

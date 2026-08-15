# Local Diffray Multi-Agent Review Workflow

This is the canonical review procedure for every forensic-remediation phase. `AGENTS.md` Section 10 is authoritative if the two documents ever disagree.

## Purpose and permission

- Run reviews through the locally installed Diffray CLI with `--executor codex-cli`.
- The selected changed code and documentation may be sent to Diffray's servers. This permission is granted in advance; do not pause only to request it again.
- Never send credentials, tokens, private keys, environment files, microphone/user data, or unrelated files.
- Diffray complements repository tests and source verification. It does not prove curriculum truth by itself.

## Preflight

Record the exact local executable, version, `review --help` output, and available agents. Confirm that `review` is the CLI's normal multi-agent review and that the `codex-cli` executor is available. Do not install or upgrade a repository dependency just for review.

A warning such as `Rule references unknown agent` makes the run degraded or incomplete. Correct or bypass the stale local rule configuration without disabling the normal reviewer set, then rerun.

## Primary commands

Create the scoped implementation commit first. Inventory all committed changed files and divide them into short, coherent batches that cover code, tests, data, and documentation.

From the repository root, use:

```powershell
diffray review --base <base-sha> --head HEAD --files <short-comma-list> --executor codex-cli --json
```

For a bounded full-file documentation/data review when diff transport is unsuitable, use:

```powershell
diffray review --files <short-comma-list> --full --executor codex-cli --json
```

Do not combine `--full` with `--base`/`--head`. Keep paths and temporary JSON log names short. Never pass a full diff, patch, source contents, or a huge file list in Windows command arguments.

The primary commands must omit `--agent` and `--skip-validation`. This lets Diffray select all applicable agents and run the normal validation stage. Let Diffray manage its internal concurrency; do not launch uncontrolled parallel CLI processes against the same batch.

A restricted `--agent <name>` invocation is diagnostic-only after a valid default multi-agent batch. It is supplemental evidence and cannot satisfy final coverage. A run using `--skip-validation` cannot satisfy final coverage.

## Batch acceptance

For each batch, retain the structured log and record:

- files and command;
- transport and log path;
- selected agents and validation result;
- `agentsExecuted`, `agentsSucceeded`, and failures;
- findings, accepted fixes, and rejected findings with reasons.

A batch is accepted only when:

- JSON is valid and `success` is true;
- applicable agents executed and intended agents succeeded without unresolved failure;
- validation ran, or the output explicitly shows that no finding required validation;
- no unknown-agent warning remains;
- no validated actionable finding remains unresolved.

One successful agent is not automatically sufficient. Accept a one-agent batch only when the structured output establishes that exactly one agent was applicable. Across the complete phase diff, multiple distinct applicable agents must have succeeded. The union of accepted primary batches must cover every committed changed file.

Earlier single-agent or validation-skipped logs are supplemental only. Rerun those files under the primary workflow before declaring review complete.

## Review-fix loop

Validate each finding against the implementation, tests, source evidence, and repository rules. Fix valid findings and add regression coverage where appropriate. Record rejected findings with concise technical reasons.

Consolidate all accepted findings from one cycle into one tested local `fix(review): ...` commit. Do not create a commit per finding or analyzer. Rerun only affected primary batches with normal multi-agent selection and validation enabled. Repeat for at most three review-fix cycles, then run the complete final phase gate on reviewed HEAD.

## Failure handling

This exact result is an unresolved blocker, never a clean review:

> All failed before analysis because Diffray’s codex-cli executor exceeded the Windows command-line limit (ENAMETOOLONG). Zero analyzers completed, so there were no findings, fixes, or rejected findings. This is the exact unresolved review blocker.

If it occurs, preserve the failed log, shorten the `--files` batch, and rerun. Never move the diff or file contents into command arguments.

Timeouts, HTTP/authentication failures, missing or malformed JSON, `success: false`, zero successful agents, incomplete validation, and unknown-agent warnings are also incomplete evidence. Retry the required coverage with a smaller or corrected bounded batch.

After three failed attempts for a required batch, stop and report the executable, commands, files, logs, warnings, validation state, and agent counts. Do not claim "no findings," substitute a self-review or restricted single-agent run, or open a ready PR.

## Required final evidence

The phase handoff must distinguish primary multi-agent batches from supplemental diagnostic runs and include the executable/version, exact commands, file coverage, selected agents, validation state, logs, agent counts, failures, findings, fixes, rejections, fix-commit SHAs, final gates, and final review verdict.

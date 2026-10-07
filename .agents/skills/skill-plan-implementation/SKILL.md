---
name: skill-plan-implementation
description: Execute an implementation plan phase-by-phase with a review-fix-review gate per phase and a full-plan review-fix-review gate on completion.
---

# Skill Plan Implementation

## Purpose
Implement an existing plan file phase-by-phase, running a review → fix → review cycle at the end of each phase until the phase is clean and a "go", then running a final full-plan review → fix → review cycle until the whole plan is clean and a "go".

## Use When
- A plan exists at `.project/project_plans/<name>_<date>-<time>_<version>.plan.md` (produced by `skill-planning`).
- The plan has numbered Phases with checkbox items and per-phase Verify steps.
- The user wants implementation gated by reviews rather than a single pass.

## Inputs
- Plan file path (required). If not given, locate the most recent `*.plan.md` under `.project/project_plans/` and confirm with the user.
- Policy sources: `project_guidance.md`, `AGENTS.md`.
- Architecture docs under `.project/project_architecture/` when referenced by the plan.
- Review skills appropriate to the surfaces being changed (default: `skill-plan-review` + `skill-web-code-review`; add `skill-web-experience-review` when UI/UX surfaces change).

## Core Mechanic — Review → Fix → Review
A "gate" is a review pass that must converge to **clean** before proceeding. The review skills emit findings with a `severity` field but no fixed vocabulary, so **normalise every finding into three buckets** before triage:

- **blocker** — must fix; correctness, security, plan-compliance, or build-breaking.
- **major** — must fix; design-system, state, or structural issues that will rot fast.
- **minor** — fix when cheap, otherwise log to **Tracked for later**.

If a finding carries no `severity` field, treat it as a **blocker** (safer default) and downgrade only if the fix is clearly cosmetic.

1. **Review** — run the selected review skill(s) against the current state and collect their findings.
2. **Triage** — map each finding's severity into blocker / major / minor and act per the buckets above.
3. **Fix** — apply fixes to the implementation only (not the plan scope). Do not edit the plan unless the plan itself is wrong — if so, amend the plan and re-confirm scope with the user first.
4. **Re-review** — re-run the same review skill(s) on the changed surfaces.
5. **Iterate** — repeat until a review pass returns no blockers and no majors. That pass is the **go**.
6. **Bound the loop** — cap iterations at **3 per gate**. If still not clean after 3 iterations, stop, surface the remaining findings, and ask the user how to proceed (fix-direction guidance, widen scope, or accept). Do not silently loop forever.

A gate produces a **phase status**: `go` (clean) or `blocked` (user escalation).

## Workflow
1. **Read the plan** — load the plan file. Parse: Context, Scope, Open questions (apply their default answers), Cross-plan deps, numbered Phases with checkbox items, per-phase Verify steps, Validation gates, Tracked for later.
2. **Confirm preconditions** — read `project_guidance.md` and any architecture docs the plan references; verify the plan's find text still matches current code (line numbers are hints and may have drifted — re-anchor on the find text, not the line). If a checkbox item's find text no longer matches, amend the plan before implementing.
3. **Select review skills per phase** — for each phase, pick review skills by surface: `skill-plan-review` (plan-compliance + policy) plus `skill-web-code-review` (code quality) by default; add `skill-web-experience-review` when the phase changes UI/UX surfaces. Record the selection with the phase.
4. **Implement phase by phase** — for each phase, in dependency order:
   1. **Implement** — work every `- [ ]` checkbox item in the phase: exact file, exact find text (the anchor), change. Line numbers in the plan are hints only — match the find text, not the line. Do **not** tick any checkbox yet; boxes stay `- [ ]` until the phase review gate returns `go` (step 4.4).
   2. **Phase Verify** — run the phase's Verify command (e.g. `npm run build`) and confirm the stated visual/functional checks. If Verify fails, fix before entering the review gate.
   3. **Phase review gate** — run the review → fix → review cycle (see Core Mechanic) capped at 3 iterations.
   4. **Update the plan** — after the review gate returns `go`, update the plan file's section for this phase: tick every checkbox `- [x]`, and append a short phase result to the section — files changed, review findings resolved, iterations used, final status (`go` / `blocked`), anything moved to Tracked for later. The plan file is the source of truth; a phase is only marked complete once its review gate is `go`.
   5. **Commit checkpoint** — after the plan is updated and the phase is `go`, make a git commit on the phase's changed files with message `plan: phase N — <phase title> [go]`. The commit sha is the Rollback target recorded in the plan; it gives the next phase a clean recovery point. Do not commit while `blocked`.
   6. **Gate** — do **not** start the next phase until the current phase is `go` in the plan file and its commit checkpoint is taken. If `blocked`, leave the phase checkboxes unticked, do not commit, record the blocker, stop, and escalate to the user.
5. **Full-plan review gate** — after every phase is `go`:
   1. **Holistic review** — run `skill-plan-review` across the entire implemented plan (every checkbox item, every phase) plus the code/experience review skills over all changed surfaces. This catches cross-phase regressions, integration gaps, and scope drift the per-phase gates miss.
   2. **Run the review → fix → review cycle** capped at 3 iterations.
   3. **Run final Validation gates** from the plan (build, typecheck, tests, etc.).
   4. **Plan status** — `go` (all gates clean, build passes) or `blocked` (escalate).
6. **Summarise** — list every changed file, per-phase results, full-plan review result, final build/test result, items moved to Tracked for later, and any follow-up tasks.

## Non-Goals
- Does not create the plan — use `skill-planning` first.
- Does not pre-review the plan before implementation — use `skill-plan-review` separately if a pre-build governance review is wanted; here `skill-plan-review` is used as an implementation-compliance check, not a pre-build gate.
- Does not deploy, release, or write secrets/credentials.
- Does not auto-accept a phase or plan as `go` while blockers/majors remain — escalation to the user is required instead.
- Does not inflate scope — out-of-scope items discovered during implementation go to Tracked for later, never into the current plan without user confirmation.

## Quality Gate
- Every checkbox item in every phase is ticked `- [x]` in the plan file only after its change is applied, the per-phase Verify step passes, **and** the phase review gate returns `go` (not before).
- Every phase section in the plan file carries its review-gate result (iterations + final status) and its commit checkpoint sha; `blocked` phases keep unticked checkboxes and no commit.
- No phase advanced while `blocked`.
- Full-plan review gate completed with a recorded result and final status.
- All Validation gates from the plan pass (build/typecheck/tests as specified).
- No unresolved blockers or majors remain; any minors are logged to Tracked for later.

## Output Contract
- Implemented source files (all checkbox items applied).
- Implementation log at `.project/project_plans/<plan>_implementation_<date>.md`: per-phase files changed, review findings, iterations, phase status, and commit checkpoint sha; tick the plan's own checkboxes (`- [x]`), but **only after** that phase's review gate returns `go` — never on apply or on Verify alone.
- Full-plan review report (from `skill-plan-review`) covering all phases.
- Final build/test result.
- Final plan status: `go` or `blocked`, with Tracked for later items and follow-up tasks.

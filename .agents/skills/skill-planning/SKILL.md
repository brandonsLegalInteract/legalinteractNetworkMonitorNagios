---
name: skill-planning
description: Produce a lean, machine-actionable plan file with exact checkbox items — no fluff, no ambiguity, no guesses. An action plan, not a novel.
---

# Planning Tool

## Purpose
Generate a lean, machine-actionable plan file that another agent can execute with zero context, zero guessing, zero questions. An action plan, not a novel.

## Use When
- Work spans multiple files or subsystems.
- A plan will be handed to another agent for mechanical execution.
- Rollback path and validation order must be explicit before coding.

Skip for single-file, single-step changes.

## Inputs
Goal/request, policy sources (`project_guidance.md`, `AGENTS.md`), architecture docs, and the actual source files being changed.

## Procedure
1. Read `project_guidance.md` and the relevant architecture docs first. Read every source file you will reference — never guess line numbers, identifiers, signatures, or import paths.
2. Bound scope explicitly: an In Scope list and an Out of Scope list. Anything not essential now goes to Tracked for later, not into scope.
3. Write one Context paragraph (3–5 lines max) stating what is changing and why — nothing more. No background essays, no stakeholder framing.
4. Group changes into numbered Phases ordered by dependency. Each phase must be independently buildable and verifiable. Every file touch belongs to exactly one phase.
5. Write each change as a single `- [ ]` checkbox using this exact shape: `- [ ] <file> — <action> <exact find> -> <exact replacement>` (or `<exact addition>`). One item = one atomic edit. The **exact find text is the anchor** — the executor locates the change by matching that text, not by line number. A line number may be added as a hint (`<file>:<line>`) but is never the primary locator, because lines drift the moment an earlier edit in the same file is applied.
6. Every new import must name its source path inline (e.g. `add import { DataSourceField } from '@/models/workflow'`). Every new function/hook must give its signature, the data structures, the algorithm, and the integration point — not just intent.
7. For conceptual (non-line-specific) changes, specify signature + data structures + algorithm + integration point. If you cannot specify these, you have not read enough — read more before writing.
8. End each phase with a **Verify** line: the exact command to run and the concrete pass/fail check (e.g. `npm run build` exits 0; `/flows` route renders without console errors). This is the *local* phase check — distinct from the **Validation gates** section, which lists the *whole-plan* checks (build, typecheck, tests) run once after all phases.
9. Make the last checkbox of every phase a **Review** gate confirming the phase is a go: `- [ ] Review — <list what must be true to mark this phase go>`. This is the no-go-to-next-phase checkpoint — the executor does not proceed until it passes.
10. **Resolve every question before writing the plan.** As you plan, collect any question that would force the executor to guess (naming, scope, approach, API choice, default behaviour). Resolve them **now, with the user**, via the `ask_user_question` tool — batch them into one call where possible. Do not defer questions into the plan as "open questions"; a written plan is the plan to implement, not a discussion document. Record the resolved answers in a **Decisions** section of the plan (Q + chosen answer), so the executor sees the rationale, not the question. If a question has a genuinely safe default and the user is unavailable, you may use it — but still record it in Decisions as `Q: … — resolved default: …`.
11. List Cross-plan dependencies only when another plan touches the same files; name the files to coordinate.
12. List Validation gates at the end: ordered commands and when to run them.
13. List deferred items under Tracked for later so decisions are not lost.
14. Write the file to `.project/project_plans/<name>_<date>-<time>_<version>.plan.md`.
15. Before finishing, re-read the plan as if you are the executor with zero prior context. If any item requires you to guess, look something up, or ask a question, rewrite that item.

## Output Template
```
# <Plan title>

## Context
<3–5 lines: what is changing and why. Nothing else.>

## Scope
- In scope: <bullets>
- Out of scope: <bullets>

## Decisions
- Q: <question> — resolved: <answer>  (asked the user; or `resolved default` if user unavailable and the default was safe)

## Cross-plan dependencies
- <plan name> touches <file paths> — coordinate on <what>

## Phase 1: <short title>
- [ ] <file> (<line hint>) — <action> <exact find> -> <exact replacement>
- [ ] <file> — add import { X } from '<source>'
- [ ] <file> — add function <signature>; algorithm: <steps>; integrate at <point>
- Verify: `<command>` exits 0; <concrete pass/fail check>
- [ ] Review — go: all items done, verify passed, no partial edits; next phase may start
- Rollback: revert to `<commit-sha>` (commit taken after this phase's Review go) or undo <named change>

## Phase 2: ...
- Verify: ...
- [ ] Review — go: <phase-specific go criteria>
- Rollback: ...

## Validation gates
1. `<command>` — run after phase N
2. `<command>` — run on completion

## Tracked for later
- <deferred item>
```

## Checklist Item Rules
One checkbox = one atomic edit, terse, machine-parseable:
- Format: `- [ ] <file> (<line hint>) — <action> <exact find> -> <exact replacement>`. The exact find text is the anchor; the line hint is optional and never the locator.
- Action verbs: `replace`, `add`, `insert`, `remove`, `move`.
- No multi-sentence items. No prose inside a checkbox.
- If the change is conceptual, give: signature + data structures + algorithm + integration point.
- Every new import names its source path.

## Example
```
- [ ] src/features/flowBuilder/components/nodes/ConditionNode.tsx (line 53 hint) — replace `border-amber-400/50` -> `border-action-condition/50`
- [ ] src/features/flowBuilder/components/nodes/ConditionNode.tsx — add import { DataSourceField } from '@/models/workflow'
- [ ] src/features/flowBuilder/hooks/useConditionEval.ts — add function `useConditionEval(field: DataSourceField): boolean`; algorithm: memoize field.id, eval rule tree, return boolean; integrate at ConditionNode.tsx `<ConditionNode>` render block (match `const evalResult =` )
- Verify: `npm run build` exits 0; `/flows` route renders without console errors
- [ ] Review — go: border class swapped, import resolves, hook wired in render block, build green; next phase may start
- Rollback: revert to <commit-sha after this phase> or undo the three edits above
```

## Pitfalls
- Do not write prose that repeats what the checkboxes already say. The checkboxes ARE the plan; prose only restates it.
- Do not write open-ended instructions like "rework the styling" or "improve the UX" — name the exact classes, line numbers, and replacements.
- Do not treat a line number as the edit locator — lines drift between sessions and within a single phase as edits apply. Anchor every change on unique find text; use line numbers only as hints.
- Do not create new files when existing files, components, hooks, or patterns can be extended — verify and reference them by name first.
- Do not duplicate the same change across phases — each file touch belongs to exactly one phase.
- Do not split Files and Steps into two sections that say the same thing twice. Checkbox items are both the file list and the steps.
- Do not leave any import, signature, or integration point unspecified — every new symbol must be fully defined.
- Do not write a risk register with theoretical rollback paths — every rollback is a concrete git revert or a named code change.
- Do not inflate scope with backend, persistence, or infra concerns when the plan is UI/UX — defer to Tracked for later.
- Do not defer questions into the plan as "open questions" — resolve them with the user via `ask_user_question` during planning. The written plan is final, not a discussion document.
- Do not write multi-sentence checkbox items — one atomic edit per item, terse, machine-parseable.

## Verification
1. Every checkbox item names a file path, exact find text (the anchor), and an exact change — line numbers are hints only, never the locator. No guessing required by the executor.
2. No prose section repeats what the checkboxes say; Context is a single short paragraph.
3. No new files are created when existing files can be extended.
4. Each phase ends with a Verify line and a Review go/no-go checkbox; the executor does not start the next phase until the Review passes.
5. No open questions remain in the written plan; every question was resolved with the user (or via a safe recorded default) and listed under Decisions.
6. Every new import names its source path; every new function gives signature + algorithm + integration point.
7. Deferred items are listed under Tracked for later.
8. `npm run build` (or the stated command) passes after each phase, or the plan states which phases skip build.
9. Each phase has a Rollback line naming a concrete revert target (commit sha or named undo).
10. A fresh executor reading the plan with zero prior context could start on phase 1 item 1 with no questions.

## Output Contract
Plan file at `.project/project_plans/<name>_<date>-<time>_<version>.plan.md` using the Output Template: Context paragraph, Scope, Decisions (resolved, not open), Cross-plan deps, numbered Phases with checkbox items each ending in a Verify line, a Review go/no-go checkbox, and a Rollback line; final Validation gates (whole-plan checks); Tracked for later. The plan is final on write — no follow-up discussion required to begin implementation.

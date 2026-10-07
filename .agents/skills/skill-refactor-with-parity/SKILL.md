---
name: skill-refactor-with-parity
description: Refactor or rewrite code while proving observable behaviour is preserved through parity comparison and review.
---

# Skill Refactor With Parity

## Purpose
Refactor or rewrite code while proving observable behaviour is preserved by chaining behavioural-parity capture, implementation, comparison, and review skills.

## Use When
- Replacing a component, service, or module.
- Migrating code between languages, frameworks, or patterns.
- Rewriting legacy code with a clean target design.

## Inputs
- Original code to be replaced.
- Target design or acceptance criteria.
- Existing tests, usage examples, or call sites if available.

## Workflow
1. **Capture baseline** — call `skill-behavioral-parity-check` on the original code to record inputs, outputs, side effects, and edge cases.
2. **Implement** — write the new version using project conventions and the target design.
3. **Compare** — call `skill-behavioral-parity-check` again to compare original vs new implementation.
4. **Classify divergences** — mark each difference as preserved, intentional, or gap.
5. **Review code** — call `skill-web-code-review` on the new implementation.
6. **Build** — run `npm run build` (or project-appropriate build command).
7. **Report** — summarise parity map, intentional changes, gaps, and recommended tests.

## Non-Goals
- Does not run production integration tests.
- Does not auto-approve intentional behavioural changes.
- Does not bypass user confirmation for risky rewrites.

## Quality Gate
- All divergences are classified.
- No unintentional behavioural gaps remain open.
- Build passes and new code passes code review.

## Output Contract
- Parity report at `.project/project_plans/<refactor>_parity_<date>.md`.
- New implementation files.
- Divergence register and recommended test scenarios.
- Build result and follow-up tasks.

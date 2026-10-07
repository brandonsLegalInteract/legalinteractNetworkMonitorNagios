---
name: skill-recipe-apply
description: Apply a project recipe by substituting variables and executing its implementation steps.
---

# Recipe Application Tool

## Purpose
Take a recipe from `.project/project_recipes/`, bind its variables, execute the steps, and verify.

## Use When
- A recipe exists for the pattern you need.
- You want consistent, non-ad-hoc application of a known codebase pattern.

## Inputs
Recipe file path, variable bindings (key/value), target scope context, policy sources.

## Tool Steps
1. **Load recipe** — read variables, prerequisites, and implementation steps.
2. **Bind variables** — substitute `{{Variable}}` placeholders with provided values.
3. **Check prerequisites** — verify required files/components exist in the codebase.
4. **Execute steps** — apply changes in order. Verify each step compiles or resolves before continuing.
5. **Run verification** — execute the recipe's verification steps and report pass/fail.

## Non-Goals
1. Generating new recipes — use `skill-recipe-generate`.
2. Planning sequencing with unrelated work — use `skill-planning`.

## Quality Gate
1. No dangling `{{Variable}}` placeholders after substitution.
2. All prerequisites confirmed against current codebase.
3. Verification steps pass, or failures are reported with fixes.

## Output Contract
Recipe used + variable bindings + files changed + verification results + delegation status.

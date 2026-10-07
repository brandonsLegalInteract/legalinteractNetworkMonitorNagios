---
name: skill-recipe-generate
description: Extract a reusable recipe from 2+ existing codebase examples.
---

# Recipe Extraction Tool

## Purpose
Analyse recurring patterns in the codebase and encode them as a recipe file under `.project/project_recipes/`.

## Use When
- A pattern appears in 2+ places.
- You want to prevent future implementations from diverging.

## Inputs
2-4 example files/regions, pattern name, `RECIPE_TEMPLATE.md`.

## Tool Steps
1. **Read examples** — identify common skeleton (identical parts) and variable map (differing parts).
2. **Build variable table** — capture every divergent element (names, labels, permissions, paths).
3. **Write recipe** — produce file with Purpose, Use When, Variables, Prerequisites, Implementation Steps, Verification, Real Examples.
4. **Validate** — substitute variable values from each source example and confirm the recipe reproduces it.
5. **Report confidence** — High (3+ examples), Medium (2 examples), Low (single example).

## Non-Goals
1. Applying recipes — use `skill-recipe-apply`.
2. Inventing patterns from one example without flagging low confidence.

## Quality Gate
1. Variables table captures all divergent elements.
2. Recipe reproduces at least one source example after substitution.
3. Real Examples section links back to source files.

## Output Contract
Recipe file path + source examples + variables extracted + validation results + confidence level.

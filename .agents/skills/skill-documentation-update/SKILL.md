---
name: skill-documentation-update
description: Audit documentation drift and synchronise discoverability surfaces against the live codebase.
---

# Documentation Drift Sync Tool

## Purpose
Detect drift between generated documentation and the current repository state, then synchronise.

## Use When
- Code behaviour has changed and docs may be stale.
- Scheduled documentation health check.
- Post-implementation clean-up.

## Inputs
Current repo state, existing documentation files, prior verification timestamps.

## Tool Steps
1. **Scan file scopes** — compare documented file scopes in `.project/project_architecture/` against actual filesystem.
2. **Scan registries** — compare `.agents/skills/SKILLS_INDEX.md`, `.project/project_recipes/RECIPES_INDEX.md`, `.project/project_plans/`, and `README.md` inventories against filesystem discovery. Also verify every recipe referenced from `AGENTS.md` exists on disk, and every recipe file on disk is referenced from `AGENTS.md`.
3. **Flag drift** — list missing, renamed, added, or moved files and assets. Pay special attention to recipes: a new recipe must appear in both `RECIPES_INDEX.md` and the `AGENTS.md` Recipes table; a removed recipe must be removed from both.
4. **Synchronise** — update registry tables (skills, recipes, plans, README), refresh the `AGENTS.md` Recipes section so it matches `RECIPES_INDEX.md`, refresh `verified_at` timestamps, correct stale paths. Do not edit recipe bodies — only re-index.
5. **Report delta** — classify each item as corrected, still outstanding, or newly discovered. Break out recipes as their own category so additions/removals are visible.

## Non-Goals
1. Re-creating missing docs from scratch — use `skill-documentation-create`.
2. Editing code, configuration, or recipe bodies.

## Quality Gate
1. Every documented file scope is verified against the filesystem.
2. `.agents/skills/SKILLS_INDEX.md` and `.project/project_recipes/RECIPES_INDEX.md` match filesystem discovery exactly.
3. `AGENTS.md` Recipes section row count and entries match `RECIPES_INDEX.md` exactly; no orphan references in either direction.
4. No stale `verified_at` timestamps after update.

## Output Contract
Drift delta (corrected/still-outstanding/new) + registry sync status + recipes delta (added/removed/renamed) + updated file list.

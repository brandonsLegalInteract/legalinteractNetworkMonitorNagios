---
name: skill-documentation-create
description: Bootstrap a policy-first documentation scaffold for any repository.
---

# Documentation Bootstrap Tool

## Purpose
Create the initial agent-documentation scaffold: policy source, generated index, architecture manifest, and skill registry.

## Use When
- Repository has no documentation baseline.
- Existing docs are fragmented or inconsistent.
- A team needs a repeatable, policy-first starting point.

## Inputs
Repo code, existing `.github/` and `.agents/` content (preserved), maintainer architecture notes if available.

## Tool Steps
1. **Ensure directories** — create `.project/project_architecture/`, `.project/project_plans/`, `.project/project_recipes/`, and `.agents/skills/` if missing.
2. **Seed policy source** — create or preserve `.project/project_architecture/project_guidance.md` as the human-owned policy source.
3. **Discover structure** — find runtime entry points, modules, architecture surfaces, and existing recipe files under `.project/project_recipes/`.
4. **Generate indexes**
   - Produce `.agents/skills/SKILLS_INDEX.md` from filesystem discovery; list base and orchestrator skills.
   - Produce `.project/project_recipes/RECIPES_INDEX.md` from filesystem discovery; list every recipe with name, one-line description, and use-when triggers.
   - Produce `AGENTS.md` from `project_guidance.md` + discovery. The file must contain a **Recipes** section that links `RECIPES_INDEX.md` and renders a summary table (name, description, use when). Skills and policy are referenced by link only — never duplicated.
5. **Create architecture manifest** — write `.project/project_architecture/00_summary.md` with module inventory.
6. **Sync registries** — ensure `.agents/skills/SKILLS_INDEX.md`, `.project/project_recipes/RECIPES_INDEX.md`, `AGENTS.md` Recipes section, and any `README.md` starter lists match filesystem discovery. Every recipe referenced in `AGENTS.md` must exist on disk; every recipe on disk must be referenced in `AGENTS.md`.
7. **Handoff module docs** — invoke `skill-project-architecture` for per-module architecture files.

## Non-Goals
1. Writing human-authored policy (lives in `project_guidance.md`).
2. Running drift audits (owned by `skill-documentation-update`).

## Quality Gate
1. `AGENTS.md` references `project_guidance.md` as policy source.
2. `AGENTS.md` contains a **Recipes** section with a summary table that matches `RECIPES_INDEX.md` exactly.
3. No duplicated policy text in architecture files.
4. `.agents/skills/SKILLS_INDEX.md` and `.project/project_recipes/RECIPES_INDEX.md` match filesystem discovery.
5. `AGENTS.md` does not duplicate recipe bodies — it indexes by link and table only.
6. Empty repo produces a compliant scaffold without hardcoded assumptions.

## Output Contract
Created/updated file list + scaffold completeness + registry sync status + recipes indexed count + ambiguities.

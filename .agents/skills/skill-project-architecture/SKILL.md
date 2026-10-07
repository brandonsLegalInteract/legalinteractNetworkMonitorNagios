---
name: skill-project-architecture
description: Create or refresh module-level architecture documentation from live code.
---

# Module Architecture Doc Tool

## Purpose
Generate or update a module-specific architecture file under `.project/project_architecture/` from code analysis.

## Use When
- A new module needs architecture documentation.
- Existing architecture docs are stale.
- Called by `skill-documentation-create` during scaffold handoff.

## Inputs
Module manifest from `00_summary.md`, code surfaces for each module, policy from `project_guidance.md`.

## Tool Steps
1. **Read manifest** — identify modules needing docs and those already current.
2. **Analyse module** — extract scope, responsibilities, key files, dependencies, and interaction patterns.
3. **Write file** — produce architecture doc with `scope` and `verified_at` metadata, description, responsibilities, and code links.
4. **Update manifest** — refresh `00_summary.md` with doc status and last-verified timestamp.

## Non-Goals
1. Generating code or altering behaviour.
2. Writing policy (lives in `project_guidance.md`).

## Quality Gate
1. Every architecture file has valid `scope` + `verified_at` metadata.
2. Content is link-based and descriptive, not duplicated code.
3. Module manifest matches the filesystem.

## Output Contract
Files created/updated + module manifest delta + `verified_at` timestamps.

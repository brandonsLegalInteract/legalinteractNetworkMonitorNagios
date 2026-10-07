---
name: skill-feature-lifecycle
description: Orchestrate a feature from request to implementation-ready code by chaining planning, review, and build-validation skills.
---

# Skill Feature Lifecycle

## Purpose
Orchestrate a feature from request to implementation-ready code by chaining planning, recipe/application, review, and build-validation skills.

## Use When
- User asks to add, change, or remove a feature, screen, or workflow.
- A plan is needed before implementation.
- Implementation may match an existing project recipe.

## Inputs
- Feature request or user story.
- Policy sources: `project_guidance.md`, `AGENTS.md`.
- Architecture docs under `.project/project_architecture/`.
- Available recipes listed in `AGENTS.md##Recipes`.

## Workflow
1. **Clarify scope** — resolve ambiguities with the user before planning.
2. **Plan** — call `skill-planning` to produce `.project/project_plans/<feature>.plan.md`.
3. **Match recipe** — check `AGENTS.md##Recipes` for a recipe that covers part or all of the feature.
4. **Apply recipe** — if matched, call `skill-recipe-apply` with variable bindings.
5. **Implement** — if no recipe matches, implement directly using project conventions and architecture docs.
6. **Review plan** — call `skill-plan-review` to verify implementation matches the plan and policy.
7. **Review code** — call `skill-web-code-review` on changed files.
8. **Review experience** — call `skill-web-experience-review` if UI/UX surfaces changed.
9. **Build** — run `npm run build` (or the project-appropriate build command).
10. **Summarise** — list changed files, review findings, build result, and any manual follow-up.

## Non-Goals
- Does not deploy or release.
- Does not write secrets, credentials, or environment-specific config.
- Does not bypass `skill-pi-system-edit` for `.pi/SYSTEM.md` or `.pi/APPEND_SYSTEM.md` changes.

## Quality Gate
- Build passes.
- Plan claims map to implemented changes.
- No unaddressed critical review findings.

## Output Contract
- Plan file at `.project/project_plans/<feature>.plan.md`.
- Implemented source files.
- Review report(s) or finding summary.
- Build result and follow-up task list.

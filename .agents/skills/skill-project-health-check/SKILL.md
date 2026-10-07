---
name: skill-project-health-check
description: Run a full project health assessment across documentation, architecture, code, and experience surfaces.
---

# Skill Project Health Check

## Purpose
Run a full project health assessment by chaining documentation, architecture, code, and experience review skills into a single consolidated report.

## Use When
- Periodic project review.
- Before or after a large refactor.
- Replacing a monolithic project-review workflow.

## Inputs
- Repository code.
- `AGENTS.md`, `project_guidance.md`.
- Architecture docs under `.project/project_architecture/`.

## Workflow
1. **Audit documentation drift** — call `skill-documentation-update` and record mismatches.
2. **Refresh architecture** — call `skill-project-architecture` for stale or missing module docs.
3. **Review code** — call `skill-web-code-review` across the frontend surfaces.
4. **Review experience** — call `skill-web-experience-review` across the frontend surfaces.
5. **Consolidate** — produce a health report using `.agents/templates/project_review_report.template.md`.
6. **Prioritise** — rank findings by severity and effort, with owners if known.

## Non-Goals
- Does not auto-fix findings.
- Does not run production integration tests or security penetration tests.
- Does not modify runtime code unless a finding is explicitly approved for remediation.

## Quality Gate
- Report covers documentation, architecture, code, and experience dimensions.
- Every finding links to evidence (file path, line, or doc section).
- Action list is prioritised and achievable.

## Output Contract
- Health report at `.project/project_plans/project_health_<date>.md`.
- Executive summary of health score or risk level.
- Prioritised remediation action list.

---
name: skill-plan-review
description: Validate an implementation plan for policy compliance, technical fit, and readiness before build.
---

# Plan Review Tool

## Purpose
Check a plan against policy, architecture, and code reality; produce amendments or a review report.

## Use When
- A plan needs governance review before execution.
- The change is high-risk, cross-cutting, or touches safety/security boundaries.

## Inputs
Plan file, policy sources (`project_guidance.md`, `AGENTS.md`), architecture docs, relevant code surfaces.

## Tool Steps
1. **Read scope** — extract objective, in/out scope, and assumptions.
2. **Check policy** — verify every plan claim against `project_guidance.md` and `AGENTS.md`.
3. **Check code reality** — verify referenced files exist and assumptions match current code.
4. **Check safety** — confirm permission, security, and rollback considerations are covered.
5. **Produce amendments** — concrete file-level changes or a pass/fail review report.

## Non-Goals
1. Running production/security tests — analysis only.
2. Full-codebase audits — use project-review orchestration for that.

## Quality Gate
1. Every plan claim has evidence from policy or code.
2. Amendments are concrete (file + change), not advisory.
3. Rollback path is feasible.
4. Validation gates in the plan are testable.

## Output Contract
Review report at `.project/project_plans/<plan>_review_<date>.md` + pass/fail per gate + amendment list.

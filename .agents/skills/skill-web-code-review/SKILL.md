---
name: skill-web-code-review
description: Audit frontend code for maintainability, design-system alignment, state-model safety, and client-side security.
---

# Web Code Review Tool

## Purpose
Inspect frontend code for structural, behavioural, and safety issues that affect what the system does and how it is built.

## Use When
- Reviewing a PR or feature branch for implementation quality.
- Investigating bugs, unsafe patterns, or maintainability debt.
- A focused audit is needed for code quality, design system, state, or security.

## Inputs
Source files, design tokens/system docs, state management code, auth/session code, lint/format config.

## Tool Steps
1. **Code quality** — check duplication, naming, function/component size, error handling, complexity, and project conventions.
2. **Design-system alignment** — verify token usage (colours, spacing, typography), component composition, layout patterns; flag hardcoded values.
3. **State analysis** — map state shape and flows; flag race conditions, complexity drift, side-effect leaks, and mutation risks.
4. **Security scan** — check unsafe DOM injection, exposed secrets, missing input sanitisation, client-side IDOR, cookie/session config, and CSRF handling.

For focused requests, run only the relevant step(s) and report only those findings.

## Non-Goals
1. Live performance profiling.
2. Accessibility or interaction UX review (use `skill-web-experience-review`).

## Quality Gate
1. Every finding has file/line evidence.
2. Security findings include exploitability assessment.
3. State findings include a reproduction scenario.
4. Design-system violations cite the correct token or pattern.

## Output Contract
Finding register by step (file/line/issue/severity/fix) + step-level pass/fail + overall code-review score.

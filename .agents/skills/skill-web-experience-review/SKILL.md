---
name: skill-web-experience-review
description: Audit frontend user experience for accessibility, interaction clarity, performance, and scalability under growth.
---

# Web Experience Review Tool

## Purpose
Inspect frontend user experience for perceptual, interactive, speed, and growth-related issues.

## Use When
- Reviewing a page or flow for UX quality before release.
- Investigating user-reported confusion, slowness, or regressions.
- A focused audit is needed for accessibility, interaction, performance, or scalability.

## Inputs
Page/component source, interaction flows, design tokens, build output, network/waterfall data if available.

## Tool Steps
1. **Accessibility** — check semantic HTML, keyboard operability, ARIA, colour contrast (≥ 4.5:1), and screen-reader support.
2. **Interaction analysis** — map trigger → feedback → outcome → error state; assess clarity, predictability, and cognitive load.
3. **Performance audit** — check bundle size, render behaviour, data fetching, and asset loading; quantify impact where possible.
4. **Scalability review** — assess bundle trajectory, state complexity, component coupling, data-layer limits, and code-splitting readiness under growth.

For focused requests, run only the relevant step(s) and report only those findings.

## Non-Goals
1. Code structure or security review (use `skill-web-code-review`).
2. Production monitoring or RUM data collection.

## Quality Gate
1. Accessibility findings cite specific WCAG criteria and measured contrast ratios.
2. Interaction findings reference a specific interaction sequence.
3. Performance findings have quantified or estimated impact.
4. Scalability findings include the growth scenario that triggers the risk.

## Output Contract
Finding register by step (element/interaction/file/line/issue/severity/fix) + step-level pass/fail + overall experience-review score.

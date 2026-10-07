---
name: skill-dashboard-lifecycle
description: Design persona-aware dashboards with actionable visuals and drill-through paths.
---

# Dashboard Design Tool

## Purpose
Transform business questions into a dashboard specification: personas, metrics, visuals, actions, and drill-through paths.

## Use When
- Building a new dashboard.
- Adding, removing, or reshaping KPIs/charts.
- Refactoring a dashboard for clarity or role fit.

## Inputs
Persona definitions, business questions, existing UI primitives, data sources and refresh cadence, drill-through targets.

## Tool Steps
1. **Map personas to decisions** — for each role, list the decisions this dashboard supports.
2. **Translate decisions to questions** — write one question per decision.
3. **Pick metrics** — assign one concrete metric to each question.
4. **Choose visuals** — select the simplest chart/table for each metric. Prefer ECharts; flag if another library is required.
5. **Define actions** — for each metric, specify the next step or explicitly mark it read-only.
6. **Add drill-throughs** — link chart/legend/card elements to detail screens where action is possible.
7. **Review by persona** — confirm each persona sees only what they need.

## Non-Goals
1. Custom chart renderers — prefer standard chart libraries.
2. Defining KPIs without a business question.

## Quality Gate
1. Every widget maps to a question + metric + action (or justified read-only).
2. Drill-through paths are explicit where data supports action.
3. No unexplained library choices.

## Output Contract
Dashboard scope map (personas, questions, metrics, visuals, actions, drill-throughs) + implementation guidance.

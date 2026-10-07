---
name: skill-asset-promotion
description: Validate a proposed skill against the current skill set and promote it from draft to canonical location, updating registries.
---

# Skill Asset Promotion

## Purpose
Validate a proposed skill and, if it earns its place, promote it from
`proposed_skills/` to `.agents/skills/` and update the skills registry. The
validation measures the proposed skill **against the skills already in the
kit**: does it overlap, duplicate, or genuinely add something the set does
not already cover?

## Use When
- A skill exists in `proposed_skills/` and should move to `.agents/skills/`.
- You want to know whether a draft skill is worth promoting before it lands
  in the canonical set.

## Inputs
- Proposed skill path under `proposed_skills/`.
- `SKILL_TEMPLATE.md` for structure validation.
- The current skill set: `.agents/skills/SKILLS_INDEX.md` and every
  `.agents/skills/*/SKILL.md`.

## Workflow
1. **Read the proposed skill** — load it from `proposed_skills/`.
2. **Check structure** — verify front-matter, sections, and naming against
   `SKILL_TEMPLATE.md`.
3. **Measure against the current skill set** — compare the proposed skill's
   scope and intent against each existing skill in `.agents/skills/`:
   - **Overlap** — does it duplicate an existing skill's responsibility?
   - **Gap** — does it fill a real hole the current set leaves open?
   - **Fit** — does its naming, granularity, and boundaries line up with
     the rest of the set, or does it blur lines that should stay sharp?
   - **Necessity** — is the case for a new skill stronger than folding the
     behaviour into an existing one?
4. **Check policy** — verify content aligns with `project_guidance.md` and
   `AGENTS.md` where applicable.
5. **Remediate or report** — fix minor gaps, or document blockers (including
   a recommendation to merge into an existing skill rather than promote).
6. **Promote** — move the skill to `.agents/skills/<name>/SKILL.md`.
7. **Sync registry** — update `.agents/skills/SKILLS_INDEX.md` to match the
   filesystem.
8. **Report** — produce a promotion checklist using
   `.agents/templates/promotion_checklist_report.template.md`, scoped to
   skills only.

## Non-Goals
- Does not promote recipes, templates, or any non-skill asset.
- Does not promote a skill that fails validation or duplicates an existing
  skill without explicit user approval.
- Does not edit `.pi/SYSTEM.md` or `.pi/APPEND_SYSTEM.md`.
- Does not delete the source in `proposed_skills/` until promotion is
  confirmed.

## Quality Gate
- Proposed skill passes the `SKILL_TEMPLATE.md` checklist.
- The skill-set comparison is documented: overlap, gap, fit, and necessity
  each have a verdict.
- The skill either fills a real gap or is explicitly rejected in favour of
  extending an existing skill.
- `.agents/skills/SKILLS_INDEX.md` matches filesystem discovery after the
  run.
- No broken internal links or stale references.

## Output Contract
- Canonical skill file at `.agents/skills/<name>/SKILL.md` (on promotion).
- Updated `.agents/skills/SKILLS_INDEX.md` entry (on promotion).
- Promotion checklist report scoped to skills, including the skill-set
  comparison verdict.

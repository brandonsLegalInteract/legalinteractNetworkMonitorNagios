# Promotion Checklist Report

## Run Metadata
- Date: `<yyyy-mm-ddThh:mm:ssZ>`
- Requested by: `<name/team>`
- Mode: `Validation-only | Remediation-only | Promotion-only | Full pipeline`
- Scope: `Skills | Recipes | Templates | Any combination`
- **No runtime code changes performed in this promotion run.**

## 1. Intake Summary
| Asset Type | Name | Source | Destination |
|---|---|---|---|
| Skill/Recipe/Template | `<name>` | `<path>` | `<path>` |

## 2. Validation Gate Results
| Gate | Result | Notes |
|---|---|---|
| A: Intake & Discovery | Pass/Fail | |
| B: Standards Validation | Pass/Fail | Uses SKILL_TEMPLATE, RECIPE_TEMPLATE, AGENTS.md, project_guidance.md |

### Findings
| Severity | Asset | Type | Finding | Evidence | Action |
|---|---|---|---|---|---|
| Crit/High/Med/Low | `<name>` | Template/Policy/Registry | `<finding>` | `<path>` | `<action>` |

## 3. Remediation Gate Results
| Gate | Result | Blocking |
|---|---|---|
| C: Remediation | Pass/Fail | `<count>` remaining |

## 4. Promotion Gate Results
| Gate | Result |
|---|---|
| D: Promotion | Pass/Fail/Not Run |

| Asset | Action | From | To | Status |
|---|---|---|---|---|
| `<name>` | Move/Copy | `<src>` | `<dst>` | Done/Skipped/Failed |

## 5. Registry Sync
| Gate | Result |
|---|---|
| E: Registry Sync | Pass/Fail/Not Run |

**Updated files:** `AGENTS.md`, `README.md`
- [ ] Skill inventory matches `.agents/skills/*/SKILL.md`
- [ ] Recipe inventory matches `.project/project_recipes/*.md`
- [ ] Template inventory matches `.agents/templates/*.md`
- [ ] `README.md` starter inventory is current
- [ ] `proposed_skills/` and `proposed_recipes/` post-run state verified

## 6. Outcome
**Final status:** `Validation Pending | Promotion Ready | Promoted and Synced`
**Remaining ambiguities:** `<list>`
**Follow-up:** `<tasks>`

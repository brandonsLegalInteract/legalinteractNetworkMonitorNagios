# Code Review & Remediation Plan

## Review Metadata
- Created: `<YYYY-MM-DD>`
- Prior baseline: `<path or N/A>`
- Method: `<N> parallel audit streams + metric validation`
- Change policy: **No runtime code changes performed in this review pass**

### Pass Log
| Pass | Scope | Key Discoveries | Metrics Corrected |
|---|---|---|---|
| 1 | `<streams>` | `<count>` candidate findings | N/A |
| 2 | Validation, cross-ref, delta | `<count>` corrections | `<list>` |
| 3 | Effort sizing, phasing | Timeline: `<X>`w, `<count>` deps | `<list>` |
| 4 | Consistency sweep | `<count>` stale refs | `<list>` |

## Executive Summary
**In plain language:** `<accessible summary for non-technical audience — what improved, critical risks, readiness verdict, timeline>`
**Timeline:** 1 dev + AI: `<X–Yw>` | 2 dev + AI: `<X–Yw>` | 3 dev + AI: `<X–Yw>`
**Delta vs baseline:** `<N>` fixed, `<N>` partial, `<N>` outstanding, `<N>` worsened, `<N>` new

| Severity | Count | Headline Risk |
|---|---|---|
| Critical | `<N>` | `<summary>` |
| High | `<N>` | `<summary>` |
| Medium | `<N>` | `<summary>` |
| Low | `<N>` | `<summary>` |

## 1. Scope
- **In scope:** `<items>`
- **Out of scope:** `<items>`
- **Staffing:** 1 dev+AI: `<Xw>` | 2 dev+AI: `<Xw>` | 3 dev+AI: `<Xw>`

## 2. Execution Principles
1. Fail-closed for security/CI on protected branches.
2. Incremental, reversible changes with rollback notes.
3. Owner + due date for any Critical/High acceptance.
4. Objective gates over narrative status.
5. Sequence by blast radius.

## 3. Baseline Reality
| Dimension | Prior | Current | Delta |
|---|---|---|---|
| `<dim>` | `<val>` | `<val>` | `↑/↓/→` |

## 4. Complete Finding Register

| ID | Sev | Type | Finding | Evidence | Scale | Status vs Prior |
|---|---|---|---|---|---|---|
| CR-1 | Critical | `<type>` | `<finding>` | `<file:line>` | `<scope>` | FIXED/PARTIAL/OUTSTANDING/WORSENED/NEW |
| HI-1 | High | ... | ... | ... | ... | ... |
| ME-1 | Medium | ... | ... | ... | ... | ... |
| LO-1 | Low | ... | ... | ... | ... | ... |

**Status legend:** 🟢 FIXED | 🟡 PARTIAL | 🔴 OUTSTANDING | ⬛ WORSENED | 🆕 NEW

## 5. Phase Plan
### Phase 1: `<Name>` (Weeks `<range>`)
**Objective:** `<goal>` **Duration:** `<Xw>` because `<justification>`
- [ ] `<checklist item>`
- [ ] `<checklist item>`
**Exit criteria:** `<measurable>`

### Phase 2: `<Name>` (Weeks `<range>`)
... (repeat structure)

## 6. Effort Model
| Role | Responsibility |
|---|---|
| AI / Automation | `<scope>` |
| Senior Dev | `<scope>` |
| Domain Owner | `<scope>` |

**AI-only:** `<tasks>` | **AI+Dev paired:** `<tasks>` | **Dev-led:** `<tasks>`

## 7. Production Readiness
**Verdict:** `Not Production Ready / Conditionally Ready / Production Ready`
**Blocking issues:** `<list>`
**Go-live conditional on:** `<criteria>`

## Appendices
### A — Evidence Anchors
- `<path>` — `<description>`

### B — All Findings Status (Cross-Reference)
| ID | Finding | Status |
|---|---|---|
| `<ID>` | `<summary>` | `🟢/🟡/🔴/⬛` |

### C — Count Interpretation Notes
- `<metric>` — `<methodology/caveats>`

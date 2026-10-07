---
name: skill-behavioral-parity-check
description: Verify that a rewritten, refactored, or migrated implementation preserves the observable behaviour of the original.
---

# Behavioral Parity Check

## Purpose
Compare an original implementation against a new implementation and produce a divergence register classified as preserved, intentional, or gap.

## Use When
- Porting logic between languages, frameworks, or layers.
- Refactoring and need confidence no behaviour changed.
- Validating a migration or rewrite against its source.

## Inputs
Original implementation, new implementation, existing tests/contracts, known edge cases.

## Tool Steps
1. **Extract behaviour surface** — list inputs, outputs, side effects, error paths, and state mutations from the original.
2. **Map paths** — for each original path, locate the equivalent path in the new implementation. Note one-to-one, one-to-many, or missing mappings.
3. **Compare semantics** — check input validation, ordering, branching, defaults, error handling, and side effects for equivalence.
4. **Identify edge cases** — boundary conditions, null/empty inputs, concurrency, partial failures.
5. **Classify divergences** — mark each as `preserved`, `intentional` (with justification), or `gap`.
6. **Recommend coverage** — list tests, scenarios, or contracts needed to close gaps.

## Non-Goals
1. Performance parity — only behavioural equivalence.
2. Deciding whether a divergence is acceptable — report only.
3. Running production tests — analysis only.

## Quality Gate
1. Every input/output path in the original has a mapped path in the new implementation.
2. Every divergence is explicitly classified.
3. Each `gap` has a recommended test or contract.

## Output Contract
Parity map + divergence register (path/divergence/classification/justification) + confidence level + recommended coverage.

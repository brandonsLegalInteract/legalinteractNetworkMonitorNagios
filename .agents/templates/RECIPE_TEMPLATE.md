```recipe
---
name: recipe-<pattern-name>
description: One sentence describing what this recipe builds and when it applies.
---

# Recipe: <Title>

## Purpose

What this recipe achieves in the context of the project. Describe the pattern being
applied, the problem it solves, and the outcome.

## Use When

- Specific trigger 1 (e.g., "Adding a new tab to an entity detail page")
- Specific trigger 2
- Specific trigger 3

## Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `Name` | Brief description | example_value |
| `Name` | Brief description | example_value |

## Prerequisites

- What must already exist in the codebase before this recipe applies.
- Which files/components/patterns are expected to be present.
- What the consumer should understand before starting.

## Implementation Steps

### Step 1: [File path] — [Action]

Describe what to do in this file. Include concrete code excerpts from the codebase
as reference. Use `{{Variable}}` placeholders where values differ per application.

```typescript
// Code excerpt showing the pattern with {{Variable}} placeholders
```

### Step 2: [File path] — [Action]

...

## Verification

1. What command to run (e.g., `npm run build`)
2. What to visually check
3. What to test (navigation, permissions, data loading)

## Real Examples

- [Tab/Feature Name](link to file or line range) — notes on what makes this example useful
- [Tab/Feature Name](link to file or line range) — notes on what differs from the simple pattern

## Notes

- Edge cases to watch for
- Common pitfalls
- Related recipes

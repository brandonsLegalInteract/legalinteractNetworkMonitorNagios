---
name: skill-pi-system-edit
description: Edit `.pi/SYSTEM.md` and `.pi/APPEND_SYSTEM.md` with mandatory user confirmation.
---

# Pi System File Editor

## Purpose
Safely modify Pi system-level instruction files with a hard confirmation gate.

## Use When
- User asks to change `.pi/SYSTEM.md` or `.pi/APPEND_SYSTEM.md`.
- A recurring pattern should become a persistent system instruction.

## Inputs
Target file (`SYSTEM.md` or `APPEND_SYSTEM.md`), operation (`show`, `edit`, `append`, `replace`), change content, section target.

## Tool Steps
1. **Guard** — verify `.pi/` exists. If absent, refuse writes and report.
2. **Prepare** — read current content. For `show`, display and stop.
3. **Diff** — for edits/appends, locate the target section and present the exact diff.
4. **Confirm** — require explicit user affirmation. No inferred consent.
5. **Apply** — write changes and confirm bytes written. Changes take effect on next system prompt reload.

## Non-Goals
1. Editing files outside `.pi/SYSTEM.md` or `.pi/APPEND_SYSTEM.md`.
2. Auto-inferring when system instructions should change.
3. Writing when `.pi/` does not exist.

## Quality Gate
1. `.pi/` exists before any write.
2. Explicit user confirmation for every write.
3. Diff shown before confirmation prompt.
4. File unchanged if user declines.

## Output Contract
Target + operation + confirmation status + bytes written (if confirmed) + guard failure reason (if blocked).

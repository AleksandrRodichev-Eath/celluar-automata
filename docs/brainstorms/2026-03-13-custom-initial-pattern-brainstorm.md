# Brainstorm: Custom Initial State Pattern Editor

**Date:** 2026-03-13
**Status:** Ready for planning

## What We're Building

A 5x5 clickable grid editor in the sidebar that lets users manually design a custom initial state pattern for 2D automata. When the simulation starts (or resets), this pattern is placed at the center of the simulation field.

The editor appears as a new init mode option ("Custom") alongside the existing "Random" and "Center pattern" modes in the 2D settings panel.

## Why This Approach

**Inline sidebar grid** was chosen over canvas overlay or modal alternatives because:
- It follows the existing UI pattern of showing/hiding sections based on the selected init mode (same as density slider for "random" and pattern dropdown for "center")
- A 5x5 grid is small enough to fit comfortably in the sidebar
- No extra interaction steps — the editor is always visible and editable when the mode is active
- Keeps the clean separation between sidebar controls and canvas display

## Key Decisions

1. **2D only** — The custom pattern editor applies only to 2D automata. 1D rules are out of scope.
2. **Fixed 5x5 grid** — No configurable size. 5x5 is sufficient for common small patterns (gliders, blinkers, custom seeds) and keeps the UI simple.
3. **Inline sidebar placement** — The grid appears in the sidebar, conditionally visible when "Custom" init mode is selected.
4. **Pattern persistence** — The 5x5 grid state is remembered in memory when switching away from "Custom" mode, so users can toggle between modes without losing their pattern.
5. **Reuse existing format** — The custom pattern is stored as `[row, col]` offsets (same format as `patterns.ts`), making it seamlessly compatible with the existing `placePattern()` logic in `automaton-2d.ts`.
6. **Center placement** — On simulation start/reset, the pattern is placed at the center of the grid, identical to how named patterns work today.

## Scope

### In scope
- New "Custom" option in the 2D init mode dropdown
- 5x5 clickable cell grid in the sidebar (toggle on/off per cell)
- Visual feedback for selected/deselected cells
- Pattern converted to `[row, col]` offsets and passed through Config2D
- Pattern placed at center on reset/start
- Grid state persisted across mode switches

### Out of scope
- 1D custom patterns
- Configurable grid size
- Save/load custom patterns
- Drag-to-paint (click-per-cell is sufficient for 5x5)
- Pattern rotation or mirroring

## Open Questions

None — all key decisions have been resolved.

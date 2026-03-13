---
title: Adding a custom 5x5 pattern editor as a new 2D init mode
category: ui-features
date: 2026-03-13
tags: [init-mode, custom-pattern, 2d-automata, sidebar-ui, type-safety]
---

# Custom 5x5 Pattern Editor Init Mode

## Problem

Users could only initialize 2D automata via "Random" (density-based) or "Center" (named pattern from library). There was no way to manually draw a small custom seed pattern before starting the simulation.

## Solution

Added a third init mode ("Custom") with an inline 5x5 clickable grid editor in the sidebar. Toggled cells are converted to `[row, col]` offsets and placed at grid center on start/reset.

### Key implementation decisions

**1. Split `InitMode` into `InitMode1D` / `InitMode2D`** (`src/types.ts`)

The shared `InitMode` type would have allowed `Config1D` to accept `'custom'`, which is meaningless for 1D rules. Splitting the types preserves type safety.

**2. Added `customPattern` field to `Config2D`** (`src/types.ts`)

```typescript
customPattern: [number, number][] | null; // [row, col] offsets from center
```

Reuses the same `[row, col]` offset format as `Pattern2D.cells` in `patterns.ts`, so the existing `placePattern()` method works unchanged.

**3. Restructured `Automaton2D.init()` to branch on `initMode` first** (`src/engine/automaton-2d.ts`)

The original code checked `config.pattern` before `config.initMode`, meaning a stale pattern dropdown value would override the init mode. Restructured to `switch (config.initMode)` with three clean branches: `random`, `custom`, `center/default`.

**4. Forced `pattern: null` when `initMode === 'custom'`** (`src/ui/controls.ts:getConfig()`)

The pattern dropdown retains its selected value when hidden. Without explicitly nulling it, the engine would place the named pattern instead of the custom one.

**5. Module-level `customGridState` array** (`src/ui/controls.ts`)

A `boolean[25]` array lives outside `setUIFromConfig()` scope, so it persists across mode switches, preset changes, and 1D/2D type switches. Only the Clear button and cell click handlers mutate it.

### Files changed

| File | Change |
|------|--------|
| `src/types.ts` | Split InitMode, added customPattern to Config2D |
| `index.html` | Added "Custom" option and `#custom-pattern-row` with grid + Clear button |
| `src/ui/controls.ts` | Grid editor logic, visibility, getConfig() with offset computation |
| `src/engine/automaton-2d.ts` | Restructured init() to switch on initMode, added custom branch |
| `src/style.css` | Grid layout and cell-alive styles |
| `src/ui/presets.ts` | Added `customPattern: null` to all 2D presets |
| `src/main.ts` | Added `customPattern: null` to default config |
| `src/engine/automaton-1d.ts` | Updated InitMode -> InitMode1D import |

## Prevention / Future Notes

- **Stale hidden dropdown values**: When conditionally hiding form elements, always consider that their `.value` persists. Explicitly null/override in `getConfig()` when the mode doesn't use that field.
- **Shared union types across contexts**: If a union type is shared between 1D and 2D configs but a new variant only applies to one, split the type rather than adding runtime guards.
- **Init priority in `Automaton2D.init()`**: The init method now correctly branches on `initMode` first. Any future init modes should add a new `case` to the switch rather than adding more pre-checks.

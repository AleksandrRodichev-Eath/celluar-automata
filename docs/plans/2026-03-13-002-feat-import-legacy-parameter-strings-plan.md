---
title: "feat: Import legacy parameter strings"
type: feat
status: active
date: 2026-03-13
origin: docs/brainstorms/2026-03-13-import-parameters-brainstorm.md
---

# feat: Import Legacy Parameter Strings

## Overview

Add the ability to import cellular automata configurations from a legacy bot parameter format. Users have a library of saved parameter strings that encode B/S rules, grid dimensions, density, and initial patterns. The feature provides a text input for single strings and a file picker for batch loading with a dropdown selector.

## Problem Statement / Motivation

The user has an existing library of curated cellular automata configurations from a previous bot, stored as encoded parameter strings. Currently there's no way to use these in the app — each config must be manually recreated through the UI controls. Importing allows instant access to the entire library.

## Format Specification

The string is split by `_` into exactly 14 positional fields. `-` serves as both a group separator (positions 3, 6) and an "absent value" placeholder (positions 4, 5).

```
100_B14567_S068_-_0.1_0111100011110111_-_1_6_200_200_4_1592614637_paperback2
 0     1      2   3  4         5         6  7  8  9  10  11    12        13
```

| Index | Field | Mapping |
|-------|-------|---------|
| 0 | int (skip) | — |
| 1 | `B{digits}` | `birth: Set<number>` from digits |
| 2 | `S{digits}` | `survival: Set<number>` from digits |
| 3 | `-` | group separator |
| 4 | float or `-` | `density` if present; `-` means absent |
| 5 | binary string or `-` | pattern (9=3x3, 16=4x4, 25=5x5); `-` means absent |
| 6 | `-` | group separator |
| 7-8 | int, int (skip) | — |
| 9 | int | `width` |
| 10 | int | `height` |
| 11-13 | int, int, string (skip) | — |

**Init mode logic:**
- Density present (field 4 is not `-`) → `initMode: 'random'`, use parsed density
- Density absent AND pattern present → `initMode: 'custom'`, parse pattern into `customPattern`
- Both present → `initMode: 'random'` (density only, ignore pattern)
- Neither present → `initMode: 'center'` with default single-cell

**Dropdown label format:** `B14567/S068 d:0.1 4x4 [200x200]` — B/S rules, density if present, pattern size if present, grid dimensions.

## Proposed Solution

### New file: `src/ui/legacy-parser.ts`

A pure parsing module with no DOM dependencies:

```typescript
// src/ui/legacy-parser.ts
export interface LegacyParseResult {
  config: Config2D;
  patternGrid: boolean[] | null; // flat row-major grid for editor sync
  gridSize: number;              // 3, 4, or 5 (from pattern string length)
  label: string;                 // dropdown display label
}

export function parseLegacyString(input: string): LegacyParseResult;
// Throws on malformed input. Caller catches and highlights input red.
```

### UI section in sidebar (above presets)

```html
<!-- index.html — new section above preset-select -->
<div class="control-group" id="import-section">
  <label>Import Parameters</label>
  <div class="import-row">
    <input type="text" id="import-input" placeholder="Paste parameter string..." />
    <button id="import-load-btn">Load</button>
  </div>
  <input type="file" id="import-file" accept=".txt" />
  <select id="import-select" style="display: none">
    <option value="">Select from file...</option>
  </select>
</div>
```

### Dynamic pattern editor (3x3 / 4x4 / 5x5)

Add a grid size selector inside `#custom-pattern-row`:

```html
<select id="grid-size-select">
  <option value="3">3×3</option>
  <option value="4">4×4</option>
  <option value="5" selected>5×5</option>
</select>
```

Refactor `controls.ts` to:
- Store a module-level `gridSize: number = 5`
- Extract grid construction into `buildGrid(size: number)` that clears and rebuilds buttons
- Make `customGridState` length dynamic: `gridSize * gridSize`
- Update `getConfig()` offset calculation: `r - Math.floor(gridSize / 2)`
- Update CSS `grid-template-columns` via inline style when grid size changes

## Technical Considerations

**Integration with existing config flow (see brainstorm: docs/brainstorms/2026-03-13-import-parameters-brainstorm.md):**

The import load-and-apply flow follows the established preset-loading pattern:
1. Parse the legacy string → `LegacyParseResult`
2. If result has a pattern: resize grid editor via `buildGrid(result.gridSize)`, populate `customGridState` from `result.patternGrid`, call `syncGridButtons()`
3. Call `setUIFromConfig(result.config)` to populate all UI controls
4. Call `simulation.applyConfig(result.config)` to apply
5. Reset preset dropdown to placeholder

**`setUIFromConfig()` extension:** Must be extended to populate `customGridState` and call `syncGridButtons()` when `config.customPattern` is set and `config.initMode === 'custom'`. Currently it does not handle custom pattern state (see learnings: docs/solutions/ui-features/custom-pattern-editor-init-mode.md).

**Stale hidden values:** When importing with density (random mode), explicitly set `customPattern: null` and `pattern: null` in the config to prevent stale values from leaking (documented gotcha from pattern editor implementation).

**Validation rules (what makes a string "malformed"):**
- Not exactly 14 fields when split by `_`
- Field 1 doesn't start with `B` or field 2 doesn't start with `S`
- B/S digits contain characters outside `0-8`
- Field 4 is not `-` and doesn't parse as a float in `[0, 1]`
- Field 5 is not `-` and length is not 9, 16, or 25
- Field 5 is not `-` and contains characters other than `0`/`1`
- Fields 9, 10 don't parse as positive integers

**Width/height clamping:** Clamp to `[10, 500]` and show clamped values in UI inputs.

**Density clamping:** Clamp to `[0.01, 1]` to match slider range.

**File parsing:** Read file as text, split by `\n`, trim each line (handle `\r\n`), skip empty lines and lines that fail validation. If all lines fail, show empty dropdown.

**Error UX:** On malformed text input, add CSS class `import-error` (red border). Clear on next `input` event.

## System-Wide Impact

- **Config flow:** Import bypasses `getConfig()` (constructs config directly from parsed string), but still uses `setUIFromConfig()` + `simulation.applyConfig()` to ensure UI ↔ engine sync.
- **Pattern editor refactor:** Making grid size dynamic touches `customGridState`, `buildGrid()`, `syncGridButtons()`, `getConfig()`, and CSS. All existing 5x5 behavior must remain the default.
- **No new init modes needed:** The import maps cleanly to existing `'random'` and `'custom'` init modes.

## Acceptance Criteria

### Parser (`src/ui/legacy-parser.ts`)
- [x] Correctly parses B/S rules from fields 1, 2
- [x] Parses density from field 4 (`-` = absent)
- [x] Parses pattern from field 5 (`-` = absent, binary string → row-major grid)
- [x] Parses width/height from fields 9, 10 with clamping to [10, 500]
- [x] Throws on malformed input (wrong field count, invalid B/S, bad pattern length, etc.)
- [x] Generates correct dropdown label: `B14567/S068 d:0.1 4x4 [200x200]`

### Text input import
- [x] Paste string → click Load → config applied, UI synced, simulation reset
- [x] Malformed string → input border turns red, no config change
- [x] Red border clears on next keystroke/paste
- [x] Type auto-switches to 2D if currently on 1D
- [x] Preset dropdown resets to placeholder after import

### File import
- [x] File picker loads `.txt` file, populates dropdown with valid entries
- [x] Malformed lines silently skipped
- [x] Dropdown shows labels in format `B14567/S068 d:0.1 4x4 [200x200]`
- [x] Selecting a dropdown entry applies that config (same as text input load)
- [x] Loading a new file replaces previous dropdown entries
- [x] Empty file → dropdown hidden or empty

### Dynamic pattern editor
- [x] Grid size selector (3x3 / 4x4 / 5x5) visible when initMode is `custom`
- [x] Changing grid size rebuilds the button grid, clears pattern state
- [x] Default grid size remains 5x5 for backward compatibility
- [x] Import with pattern sets correct grid size and populates editor
- [x] `getConfig()` uses dynamic grid size for offset calculations
- [x] CSS grid columns update to match selected size

### Integration
- [x] Import with density → `initMode: 'random'`, density slider shows value
- [x] Import without density → `initMode: 'custom'`, pattern editor shows imported pattern
- [x] All B/S checkboxes correctly reflect imported rules
- [x] Width/height inputs show (clamped) values from import
- [x] Simulation pauses and resets on import (existing `applyConfig` behavior)

## Dependencies & Risks

- **Pattern editor refactor risk:** The dynamic grid changes touch several interconnected pieces in `controls.ts`. The `customGridState` module-level array, `syncGridButtons()`, and `getConfig()` all assume a fixed 5x5 grid. Care needed to avoid regressions.
- **No test framework:** Manual testing required for parser edge cases. Consider adding example strings as comments in the parser module.
- **Accessibility:** Red-border-only error indication is not accessible. Should add `aria-invalid="true"` on the input for screen readers.

## Sources & References

### Origin

- **Brainstorm document:** [docs/brainstorms/2026-03-13-import-parameters-brainstorm.md](docs/brainstorms/2026-03-13-import-parameters-brainstorm.md) — Key decisions: density takes priority over pattern, dedicated sidebar section above presets, file picker for batch loading, dynamic pattern editor.

### Internal References

- Pattern editor implementation: `src/ui/controls.ts:79-107`
- Config construction: `src/ui/controls.ts:135-183` (`getConfig()`)
- UI sync from config: `src/ui/controls.ts:185-216` (`setUIFromConfig()`)
- Preset loading pattern: `src/ui/controls.ts:240-252`
- Config2D type: `src/types.ts:12-22`
- 2D automaton init: `src/engine/automaton-2d.ts` (`init()` method)
- Documented learnings: `docs/solutions/ui-features/custom-pattern-editor-init-mode.md`

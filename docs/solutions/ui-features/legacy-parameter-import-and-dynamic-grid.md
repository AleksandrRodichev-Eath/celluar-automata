---
title: Legacy Parameter String Import & Dynamic Pattern Grid
category: ui-features
date: 2026-03-13
tags: [import, parser, legacy-format, dynamic-grid, pattern-editor, config-sync]
---

## Problem

Users have a library of cellular automata configurations from a previous bot, stored as encoded parameter strings (e.g., `100_B14567_S068_-_0.1_0111100011110111_-_1_6_200_200_4_1592614637_paperback2`). There was no way to load these into the app. Additionally, the custom pattern editor was fixed at 5x5 and needed to support 3x3/4x4/5x5 to accommodate imported patterns of varying sizes.

## Root Cause

The app had no parsing/import capability and the pattern editor was hardcoded to a single grid size (25-element `customGridState` array, `repeat(5, 1fr)` CSS, `r - 2` centering offset).

## Solution

### 1. Parser module (`src/ui/legacy-parser.ts`)

A pure function `parseLegacyString(input)` that splits the string by `_` into 14 positional fields:

- Fields 3 and 6 are `-` separators
- Field 4: density (float) or `-` if absent
- Field 5: binary pattern string or `-` if absent
- `-` in fields 4/5 means "absent", not a separator

**Key insight:** The format is NOT split by `_-_` into groups. It's a flat 14-field format where `-` serves double duty as separator and "absent" placeholder. This was clarified by examining real examples with missing fields (e.g., `..._-_-_111011111_-_...` for absent density).

**Init mode logic:** density present → `random`; density absent + pattern present → `custom`; neither → `center`.

### 2. Dynamic pattern editor (controls.ts)

Refactored from hardcoded 5x5 to dynamic sizing:

- `customGridState` changed from `const` fixed-25 array to `let` with dynamic length (`gridSize * gridSize`)
- Extracted `buildGrid(size)` function that clears DOM, rebuilds buttons, sets CSS `gridTemplateColumns` inline
- `syncGridButtons()` iterates `gridButtons.length` instead of hardcoded 25
- `getConfig()` uses `Math.floor(gridSize / 2)` for center offset instead of hardcoded `2`
- Removed `grid-template-columns: repeat(5, 1fr)` from CSS (now set dynamically via inline style)

### 3. Import UI and wiring

- HTML: Import section above presets with text input + Load button, `<input type="file">`, and `<select>` dropdown
- Load button: catches parse errors → adds `.import-error` class (red border) + `aria-invalid`; clears on next `input` event
- File picker: reads file, parses each line, skips failures silently, populates dropdown with labels
- `applyImportResult()` follows the established preset-loading pattern: resize grid → populate `customGridState` → `setUIFromConfig()` → `simulation.applyConfig()` → reset preset dropdown

## Prevention

- When adding positional format parsers, always get concrete examples of **missing field** variants before implementing. The delimiter can look different than expected when fields are absent.
- When hardcoding UI grid/array sizes, use a variable from the start (`gridSize`) even if only one size is currently supported. Retrofitting dynamism is more error-prone than building it in.
- Follow the existing config-apply pattern (`setUIFromConfig` + `simulation.applyConfig`) for any new config source to keep UI and engine in sync.

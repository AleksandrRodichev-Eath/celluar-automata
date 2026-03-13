# Brainstorm: Import Legacy Parameter Strings

**Date:** 2026-03-13
**Status:** Complete

## What We're Building

A feature to import cellular automata configurations from a legacy bot parameter format into the app. Users have a library of saved parameter strings like:

```
100_B14567_S068_-_0.1_0111100011110111_-_1_6_200_200_4_1592614637_paperback2
```

The feature provides two import methods:
1. **Text input** — paste a single parameter string and load it
2. **File picker** — load a `.txt` file with multiple parameter strings (one per line), then browse/select from a dropdown

Loading a parameter string configures the app's B/S rules, grid size, init mode, density, and pattern editor automatically.

## Format Specification

The string is split by `_-_` into 3 groups, then each group is split by `_`:

| Group | Fields | Usage |
|-------|--------|-------|
| 1: `100_B14567_S068` | skip (int), B-rules, S-rules | Parse birth/survival sets |
| 2: `0.1_0111100011110111` | density (float), pattern (binary string) | Init state config |
| 3: `1_6_200_200_4_1592614637_paperback2` | skip, skip, width, height, skip, skip, skip | Grid dimensions |

**Parsing rules:**
- **B/S rules:** `B14567` → birth:{1,4,5,6,7}, `S068` → survival:{0,6,8}
- **Density:** Float 0-1. If present → `initMode: 'random'` with that density
- **Pattern:** Binary string of length 9/16/25 → 3x3/4x4/5x5 matrix. Used only when density is absent → `initMode: 'custom'` with pattern placed in center
- **Priority:** If both density and pattern exist, use density (random fill) only; ignore pattern
- **Width/Height:** Both values used to set grid dimensions

**Dropdown label format:** `B14567/S068 d:0.1 4x4` (B/S rules + density if present + pattern size if present)

## Why This Approach

**Dedicated sidebar section** chosen over extending presets or using a modal because:
- Clean separation from curated presets
- Always visible and accessible in the sidebar workflow
- File dropdown can hold many entries without polluting the preset list
- Consistent with the sidebar-driven UI pattern

## Key Decisions

1. **Density takes priority over pattern** — when both present in a string, use random fill only
2. **Dedicated "Import" sidebar section** — separate from presets, with text input + file picker + dropdown
3. **File picker** (browser `<input type="file">`) — not a path input, since this is a web app
4. **Pattern editor sync** — loading a pattern-only string syncs to the custom pattern editor grid
5. **Dynamic pattern editor** — editor grid becomes resizable (3x3/4x4/5x5) with a size selector, to accommodate imported patterns of varying sizes
6. **Type forced to 2D** — imported parameters are always 2D Life-like rules; switching to 2D on import

## Resolved Questions

1. **Sidebar placement** — Import section goes **above** the existing Presets section, at the top of the sidebar.
2. **4x4 pattern centering** — Any reasonable centering is fine; use `floor(size/2)` offset.
3. **Error handling** — Highlight the input border red on malformed strings; no text message.
4. **File persistence** — No persistence; user re-loads the file each session.

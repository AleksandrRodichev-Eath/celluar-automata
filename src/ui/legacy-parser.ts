import { Config2D } from '../types';

export interface LegacyParseResult {
  config: Config2D;
  patternGrid: boolean[] | null;
  gridSize: number;
  label: string;
}

/**
 * Parses a legacy parameter string into a Config2D and metadata.
 *
 * Format: 14 underscore-separated fields.
 * Example: 100_B14567_S068_-_0.1_0111100011110111_-_1_6_200_200_4_1592614637_paperback2
 *
 * Fields:
 *  [0] skip, [1] B-rules, [2] S-rules, [3] separator,
 *  [4] density or '-', [5] pattern or '-', [6] separator,
 *  [7] skip, [8] skip, [9] width, [10] height,
 *  [11] skip, [12] skip, [13] skip
 *
 * Throws on malformed input.
 */
export function parseLegacyString(input: string): LegacyParseResult {
  const trimmed = input.trim();
  const fields = trimmed.split('_');

  if (fields.length !== 14) {
    throw new Error(`Expected 14 fields, got ${fields.length}`);
  }

  // B/S rules
  const birthField = fields[1];
  const survivalField = fields[2];

  if (!birthField.startsWith('B')) {
    throw new Error(`Field 1 must start with 'B', got '${birthField}'`);
  }
  if (!survivalField.startsWith('S')) {
    throw new Error(`Field 2 must start with 'S', got '${survivalField}'`);
  }

  const birth = parseRuleDigits(birthField.slice(1), 'B');
  const survival = parseRuleDigits(survivalField.slice(1), 'S');

  // Density (field 4)
  const hasDensity = fields[4] !== '-';
  let density = 0.3;
  if (hasDensity) {
    density = parseFloat(fields[4]);
    if (isNaN(density)) {
      throw new Error(`Invalid density '${fields[4]}'`);
    }
    density = Math.max(0.01, Math.min(1, density));
  }

  // Pattern (field 5)
  const hasPattern = fields[5] !== '-';
  let patternGrid: boolean[] | null = null;
  let gridSize = 5;
  let customPattern: [number, number][] | null = null;

  if (hasPattern) {
    const pat = fields[5];
    if (!/^[01]+$/.test(pat)) {
      throw new Error(`Pattern contains invalid characters: '${pat}'`);
    }
    const len = pat.length;
    if (len !== 9 && len !== 16 && len !== 25) {
      throw new Error(`Pattern length must be 9, 16, or 25, got ${len}`);
    }
    gridSize = Math.sqrt(len);
    patternGrid = Array.from(pat, ch => ch === '1');
    const center = Math.floor(gridSize / 2);
    const cells: [number, number][] = [];
    for (let i = 0; i < len; i++) {
      if (pat[i] === '1') {
        const r = Math.floor(i / gridSize);
        const c = i % gridSize;
        cells.push([r - center, c - center]);
      }
    }
    customPattern = cells.length > 0 ? cells : null;
  }

  // Width/Height (fields 9, 10)
  const width = parsePositiveInt(fields[9], 'width');
  const height = parsePositiveInt(fields[10], 'height');

  // Init mode logic
  let initMode: 'random' | 'custom' | 'center';
  if (hasDensity) {
    initMode = 'random';
    customPattern = null;
  } else if (hasPattern) {
    initMode = 'custom';
  } else {
    initMode = 'center';
  }

  const config: Config2D = {
    type: '2d',
    birth,
    survival,
    width: Math.max(10, Math.min(500, width)),
    height: Math.max(10, Math.min(500, height)),
    initMode,
    density,
    pattern: null,
    customPattern,
    solidBorders: false,
  };

  // Build label
  const name = fields[13];
  let label = name;
  const bStr = `B${Array.from(birth).sort().join('')}`;
  const sStr = `S${Array.from(survival).sort().join('')}`;
  label += ` ${bStr}/${sStr}`;
  if (hasDensity) label += ` d:${density}`;
  if (hasPattern) label += ` ${gridSize}x${gridSize}`;
  label += ` [${config.width}x${config.height}]`;

  return { config, patternGrid: initMode === 'custom' ? patternGrid : null, gridSize, label };
}

function parseRuleDigits(digits: string, prefix: string): Set<number> {
  const set = new Set<number>();
  for (const ch of digits) {
    const n = parseInt(ch);
    if (isNaN(n) || n < 0 || n > 8) {
      throw new Error(`${prefix}-rule digit out of range: '${ch}'`);
    }
    set.add(n);
  }
  return set;
}

function parsePositiveInt(value: string, name: string): number {
  const n = parseInt(value);
  if (isNaN(n) || n <= 0) {
    throw new Error(`Invalid ${name}: '${value}'`);
  }
  return n;
}

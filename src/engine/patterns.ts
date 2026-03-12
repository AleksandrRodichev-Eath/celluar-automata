import { Pattern2D } from '../types';

const patterns: Record<string, Pattern2D> = {
  glider: {
    name: 'Glider',
    cells: [
      [-1, 0],
      [0, 1],
      [1, -1], [1, 0], [1, 1],
    ],
  },
  lwss: {
    name: 'LWSS',
    cells: [
      [-1, -1], [-1, 2],
      [0, 3],
      [1, -1], [1, 3],
      [2, 0], [2, 1], [2, 2], [2, 3],
    ],
  },
  blinker: {
    name: 'Blinker',
    cells: [
      [0, -1], [0, 0], [0, 1],
    ],
  },
  toad: {
    name: 'Toad',
    cells: [
      [0, 0], [0, 1], [0, 2],
      [1, -1], [1, 0], [1, 1],
    ],
  },
  beacon: {
    name: 'Beacon',
    cells: [
      [-1, -1], [-1, 0],
      [0, -1], [0, 0],
      [1, 1], [1, 2],
      [2, 1], [2, 2],
    ],
  },
  pulsar: {
    name: 'Pulsar',
    cells: (() => {
      const cells: [number, number][] = [];
      const quarter: [number, number][] = [
        [-6, -2], [-6, -3], [-6, -4],
        [-4, -1], [-3, -1], [-2, -1],
        [-1, -2], [-1, -3], [-1, -4],
        [-2, -6], [-3, -6], [-4, -6],
      ];
      for (const [r, c] of quarter) {
        cells.push([r, c], [r, -c], [-r, c], [-r, -c]);
      }
      // dedupe
      const seen = new Set<string>();
      return cells.filter(([r, c]) => {
        const k = `${r},${c}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    })(),
  },
  rpentomino: {
    name: 'R-pentomino',
    cells: [
      [-1, 0], [-1, 1],
      [0, -1], [0, 0],
      [1, 0],
    ],
  },
  diehard: {
    name: 'Diehard',
    cells: [
      [-1, 3],
      [0, -3], [0, -2],
      [1, -2], [1, 2], [1, 3], [1, 4],
    ],
  },
  acorn: {
    name: 'Acorn',
    cells: [
      [-1, -2],
      [0, 0],
      [1, -3], [1, -2], [1, 1], [1, 2], [1, 3],
    ],
  },
  gosperGliderGun: {
    name: 'Gosper Glider Gun',
    cells: [
      [0, -18], [0, -17],
      [1, -18], [1, -17],
      [0, -8], [1, -8], [2, -8],
      [-1, -7], [-2, -6], [-2, -5],
      [3, -7], [4, -6], [4, -5],
      [1, -4],
      [-1, -3], [0, -2], [1, -2], [2, -2], [1, -1],
      [3, -3],
      [-2, 2], [-1, 2], [0, 2],
      [-2, 3], [-1, 3], [0, 3],
      [-3, 4], [1, 4],
      [-3, 6], [-4, 6], [1, 6], [2, 6],
      [-2, 16], [-1, 16],
      [-2, 17], [-1, 17],
    ],
  },
};

export function getPattern(key: string): Pattern2D | null {
  return patterns[key] ?? null;
}

export function getPatternList(): { key: string; name: string }[] {
  return Object.entries(patterns).map(([key, p]) => ({ key, name: p.name }));
}

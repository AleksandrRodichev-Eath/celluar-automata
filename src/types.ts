export type AutomatonType = '1d' | '2d';
export type InitMode = 'center' | 'random';

export interface Config1D {
  type: '1d';
  rule: number;       // 0-255
  width: number;
  initMode: InitMode;
}

export interface Config2D {
  type: '2d';
  birth: Set<number>;    // B counts (0-8)
  survival: Set<number>; // S counts (0-8)
  width: number;
  height: number;
  initMode: InitMode;
  density: number;       // 0-1, for random init
  pattern: string | null; // pattern key or null
}

export type Config = Config1D | Config2D;

export interface Preset {
  name: string;
  config: Config;
}

export interface Pattern2D {
  name: string;
  cells: [number, number][]; // [row, col] offsets from center
}

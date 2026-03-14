import { Config2D, Pattern2D } from '../types';
import { getPattern } from './patterns';

export class Automaton2D {
  width: number;
  height: number;
  birth: Set<number>;
  survival: Set<number>;
  current: Uint8Array;
  private next: Uint8Array;
  private generation = 0;
  private solidBorders: boolean;

  constructor(config: Config2D) {
    this.width = Math.min(config.width, 500);
    this.height = Math.min(config.height, 500);
    this.birth = new Set(config.birth);
    this.survival = new Set(config.survival);
    const size = this.width * this.height;
    this.current = new Uint8Array(size);
    this.next = new Uint8Array(size);
    this.solidBorders = config.solidBorders;
    this.init(config);
  }

  private init(config: Config2D) {
    this.current.fill(0);
    this.generation = 0;

    switch (config.initMode) {
      case 'random': {
        const density = config.density;
        for (let i = 0; i < this.current.length; i++) {
          this.current[i] = Math.random() < density ? 1 : 0;
        }
        break;
      }
      case 'custom': {
        if (config.customPattern && config.customPattern.length > 0) {
          this.placePattern({ name: 'custom', cells: config.customPattern });
        }
        break;
      }
      case 'center':
      default: {
        if (config.pattern) {
          const pattern = getPattern(config.pattern);
          if (pattern) {
            this.placePattern(pattern);
            break;
          }
        }
        const cx = Math.floor(this.width / 2);
        const cy = Math.floor(this.height / 2);
        this.current[cy * this.width + cx] = 1;
        break;
      }
    }
  }

  private placePattern(pattern: Pattern2D) {
    const cx = Math.floor(this.width / 2);
    const cy = Math.floor(this.height / 2);
    for (const [row, col] of pattern.cells) {
      const x = cx + col;
      const y = cy + row;
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.current[y * this.width + x] = 1;
      }
    }
  }

  step(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const neighbors = this.countNeighbors(x, y);
        const idx = y * this.width + x;
        const alive = this.current[idx] === 1;

        if (alive) {
          this.next[idx] = this.survival.has(neighbors) ? 1 : 0;
        } else {
          this.next[idx] = this.birth.has(neighbors) ? 1 : 0;
        }
      }
    }
    // swap buffers
    const tmp = this.current;
    this.current = this.next;
    this.next = tmp;
    this.generation++;
  }

  private countNeighbors(x: number, y: number): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (this.solidBorders) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
          count += this.current[ny * this.width + nx];
        } else {
          const nx = (x + dx + this.width) % this.width;
          const ny = (y + dy + this.height) % this.height;
          count += this.current[ny * this.width + nx];
        }
      }
    }
    return count;
  }

  getGeneration(): number {
    return this.generation;
  }

  toggleCell(x: number, y: number): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      const idx = y * this.width + x;
      this.current[idx] = this.current[idx] ? 0 : 1;
    }
  }
}

import { Config1D, InitMode1D } from '../types';

export class Automaton1D {
  width: number;
  rule: number;
  current: Uint8Array;
  history: Uint8Array[];
  private maxHistory = 2000;
  private solidBorders: boolean;

  constructor(config: Config1D) {
    this.width = Math.min(config.width, 2000);
    this.rule = config.rule & 0xff;
    this.solidBorders = config.solidBorders;
    this.current = new Uint8Array(this.width);
    this.history = [];
    this.init(config.initMode);
  }

  private init(mode: InitMode1D) {
    this.current.fill(0);
    if (mode === 'center') {
      this.current[Math.floor(this.width / 2)] = 1;
    } else {
      for (let i = 0; i < this.width; i++) {
        this.current[i] = Math.random() < 0.5 ? 1 : 0;
      }
    }
    this.history = [this.current.slice()];
  }

  step(): void {
    const next = new Uint8Array(this.width);
    for (let i = 0; i < this.width; i++) {
      const left = this.solidBorders
        ? (i > 0 ? this.current[i - 1] : 0)
        : this.current[(i - 1 + this.width) % this.width];
      const center = this.current[i];
      const right = this.solidBorders
        ? (i < this.width - 1 ? this.current[i + 1] : 0)
        : this.current[(i + 1) % this.width];
      const index = (left << 2) | (center << 1) | right;
      next[i] = (this.rule >> index) & 1;
    }
    this.current = next;
    this.history.push(next.slice());
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  getHistory(): Uint8Array[] {
    return this.history;
  }

  getGeneration(): number {
    return this.history.length - 1;
  }
}

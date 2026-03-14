import { Automaton1D } from '../engine/automaton-1d';
import { DisplayOptions } from '../types';

export class Renderer1D {
  private ctx: CanvasRenderingContext2D;
  private cellSize = 4;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  resize(automaton: Automaton1D) {
    this.canvas.width = automaton.width * this.cellSize;
    // height grows with history, but set a reasonable initial size
    this.canvas.height = Math.min(automaton.width, 800) * this.cellSize;
  }

  render(automaton: Automaton1D, options?: DisplayOptions) {
    const history = automaton.getHistory();
    const cs = this.cellSize;
    const ctx = this.ctx;
    const w = automaton.width;

    // adjust canvas height if needed
    const neededHeight = history.length * cs;
    if (neededHeight > this.canvas.height) {
      this.canvas.height = neededHeight;
    }

    ctx.fillStyle = '#f0f0f6';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = options?.cellColor ?? '#5b6abf';
    const gap = options?.cellBorder ? 1 : 0;
    for (let row = 0; row < history.length; row++) {
      const line = history[row];
      for (let x = 0; x < w; x++) {
        if (line[x]) {
          ctx.fillRect(x * cs, row * cs, cs - gap, cs - gap);
        }
      }
    }
  }
}

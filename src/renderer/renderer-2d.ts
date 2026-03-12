import { Automaton2D } from '../engine/automaton-2d';

export class Renderer2D {
  private ctx: CanvasRenderingContext2D;
  private cellSize = 6;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  resize(automaton: Automaton2D) {
    this.canvas.width = automaton.width * this.cellSize;
    this.canvas.height = automaton.height * this.cellSize;
  }

  render(automaton: Automaton2D) {
    const { width, height } = automaton;
    const cs = this.cellSize;
    const ctx = this.ctx;

    ctx.fillStyle = '#f0f0f6';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#5b6abf';
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (automaton.current[y * width + x]) {
          ctx.fillRect(x * cs, y * cs, cs - 1, cs - 1);
        }
      }
    }
  }

  getCellCoords(clientX: number, clientY: number): [number, number] {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / this.cellSize);
    const y = Math.floor((clientY - rect.top) / this.cellSize);
    return [x, y];
  }
}

import { Config } from './types';
import { Automaton1D } from './engine/automaton-1d';
import { Automaton2D } from './engine/automaton-2d';
import { Renderer1D } from './renderer/renderer-1d';
import { Renderer2D } from './renderer/renderer-2d';

export class Simulation {
  private automaton1d: Automaton1D | null = null;
  private automaton2d: Automaton2D | null = null;
  private renderer1d: Renderer1D | null = null;
  private renderer2d: Renderer2D | null = null;
  private running = false;
  private rafId = 0;
  private speed = 10; // generations per second
  private lastStep = 0;
  private config: Config;
  private onGenerationChange: ((gen: number) => void) | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    config: Config,
  ) {
    this.config = config;
    this.applyConfig(config);
  }

  setOnGenerationChange(cb: (gen: number) => void) {
    this.onGenerationChange = cb;
  }

  applyConfig(config: Config) {
    this.config = config;
    this.pause();

    if (config.type === '1d') {
      this.automaton1d = new Automaton1D(config);
      this.automaton2d = null;
      this.renderer1d = new Renderer1D(this.canvas);
      this.renderer2d = null;
      this.renderer1d.resize(this.automaton1d);
      this.renderer1d.render(this.automaton1d);
    } else {
      this.automaton2d = new Automaton2D(config);
      this.automaton1d = null;
      this.renderer2d = new Renderer2D(this.canvas);
      this.renderer1d = null;
      this.renderer2d.resize(this.automaton2d);
      this.renderer2d.render(this.automaton2d);
    }
    this.fireGeneration();
  }

  play() {
    if (this.running) return;
    this.running = true;
    this.lastStep = performance.now();
    this.loop(performance.now());
  }

  pause() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  step() {
    this.doStep();
    this.render();
    this.fireGeneration();
  }

  reset() {
    this.applyConfig(this.config);
  }

  setSpeed(gps: number) {
    this.speed = Math.max(1, Math.min(60, gps));
  }

  isRunning(): boolean {
    return this.running;
  }

  getGeneration(): number {
    if (this.automaton1d) return this.automaton1d.getGeneration();
    if (this.automaton2d) return this.automaton2d.getGeneration();
    return 0;
  }

  handleCanvasClick(clientX: number, clientY: number) {
    if (this.automaton2d && this.renderer2d) {
      const [x, y] = this.renderer2d.getCellCoords(clientX, clientY);
      this.automaton2d.toggleCell(x, y);
      this.renderer2d.render(this.automaton2d);
    }
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const interval = 1000 / this.speed;
    if (now - this.lastStep >= interval) {
      this.doStep();
      this.render();
      this.fireGeneration();
      this.lastStep = now;
    }
    this.rafId = requestAnimationFrame(this.loop);
  };

  private doStep() {
    if (this.automaton1d) this.automaton1d.step();
    if (this.automaton2d) this.automaton2d.step();
  }

  private render() {
    if (this.automaton1d && this.renderer1d) {
      this.renderer1d.render(this.automaton1d);
    }
    if (this.automaton2d && this.renderer2d) {
      this.renderer2d.render(this.automaton2d);
    }
  }

  private fireGeneration() {
    if (this.onGenerationChange) {
      this.onGenerationChange(this.getGeneration());
    }
  }
}

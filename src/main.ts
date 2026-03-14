import './style.css';
import { Simulation } from './simulation';
import { initControls } from './ui/controls';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

// Default config: Game of Life
const simulation = new Simulation(canvas, {
  type: '2d',
  birth: new Set([3]),
  survival: new Set([2, 3]),
  width: 150,
  height: 150,
  initMode: 'random',
  density: 0.3,
  pattern: null,
  customPattern: null,
  solidBorders: false,
});

initControls(simulation);

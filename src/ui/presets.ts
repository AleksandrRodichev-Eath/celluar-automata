import { Preset } from '../types';

export const presets: Preset[] = [
  {
    name: "Game of Life (B3/S23)",
    config: {
      type: '2d',
      birth: new Set([3]),
      survival: new Set([2, 3]),
      width: 100,
      height: 100,
      initMode: 'random',
      density: 0.3,
      pattern: null,
    },
  },
  {
    name: "HighLife (B36/S23)",
    config: {
      type: '2d',
      birth: new Set([3, 6]),
      survival: new Set([2, 3]),
      width: 100,
      height: 100,
      initMode: 'random',
      density: 0.3,
      pattern: null,
    },
  },
  {
    name: "Seeds (B2/S)",
    config: {
      type: '2d',
      birth: new Set([2]),
      survival: new Set(),
      width: 100,
      height: 100,
      initMode: 'random',
      density: 0.1,
      pattern: null,
    },
  },
  {
    name: "Day & Night (B3678/S34678)",
    config: {
      type: '2d',
      birth: new Set([3, 6, 7, 8]),
      survival: new Set([3, 4, 6, 7, 8]),
      width: 100,
      height: 100,
      initMode: 'random',
      density: 0.5,
      pattern: null,
    },
  },
  {
    name: "Diamoeba (B35678/S5678)",
    config: {
      type: '2d',
      birth: new Set([3, 5, 6, 7, 8]),
      survival: new Set([5, 6, 7, 8]),
      width: 100,
      height: 100,
      initMode: 'random',
      density: 0.5,
      pattern: null,
    },
  },
  {
    name: "Maze (B3/S12345)",
    config: {
      type: '2d',
      birth: new Set([3]),
      survival: new Set([1, 2, 3, 4, 5]),
      width: 100,
      height: 100,
      initMode: 'random',
      density: 0.02,
      pattern: null,
    },
  },
  {
    name: "Rule 30",
    config: {
      type: '1d',
      rule: 30,
      width: 301,
      initMode: 'center',
    },
  },
  {
    name: "Rule 90",
    config: {
      type: '1d',
      rule: 90,
      width: 301,
      initMode: 'center',
    },
  },
  {
    name: "Rule 110",
    config: {
      type: '1d',
      rule: 110,
      width: 301,
      initMode: 'center',
    },
  },
  {
    name: "Rule 184",
    config: {
      type: '1d',
      rule: 184,
      width: 301,
      initMode: 'random',
    },
  },
];

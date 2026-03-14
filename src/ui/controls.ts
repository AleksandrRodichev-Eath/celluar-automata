import { Config, Config1D, Config2D, InitMode2D } from '../types';
import { Simulation } from '../simulation';
import { presets } from './presets';
import { getPatternList } from '../engine/patterns';
import { parseLegacyString, LegacyParseResult } from './legacy-parser';
import libPubRaw from '../../lib-pub.txt?raw';

let gridSize = 5;
let customGridState: boolean[] = new Array(gridSize * gridSize).fill(false);

export function initControls(simulation: Simulation) {
  const $ = (id: string) => document.getElementById(id)!;

  // Elements
  const typeSelect = $('type-select') as HTMLSelectElement;
  const presetSelect = $('preset-select') as HTMLSelectElement;
  const settings1d = $('settings-1d');
  const settings2d = $('settings-2d');
  const ruleInput = $('rule-input') as HTMLInputElement;
  const ruleDisplay = $('rule-display');
  const width1dInput = $('width-1d') as HTMLInputElement;
  const init1dSelect = $('init-1d') as HTMLSelectElement;
  const width2dInput = $('width-2d') as HTMLInputElement;
  const height2dInput = $('height-2d') as HTMLInputElement;
  const init2dSelect = $('init-2d') as HTMLSelectElement;
  const densityInput = $('density-input') as HTMLInputElement;
  const densityValue = $('density-value');
  const densityRow = $('density-row');
  const patternSelect = $('pattern-select') as HTMLSelectElement;
  const patternRow = $('pattern-row');
  const customPatternRow = $('custom-pattern-row');
  const customGrid = $('custom-grid');
  const customClearBtn = $('custom-clear-btn');
  const playBtn = $('play-btn');
  const stepBtn = $('step-btn');
  const resetBtn = $('reset-btn');
  const speedInput = $('speed-input') as HTMLInputElement;
  const speedValue = $('speed-value');
  const genDisplay = $('gen-display');
  const cellColorInput = $('cell-color') as HTMLInputElement;
  const cellBorderInput = $('cell-border') as HTMLInputElement;
  const solidBordersInput = $('solid-borders') as HTMLInputElement;

  // Populate presets
  presets.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = p.name;
    presetSelect.appendChild(opt);
  });

  // Populate patterns
  const patternList = getPatternList();
  const noneOpt = document.createElement('option');
  noneOpt.value = '';
  noneOpt.textContent = 'None';
  patternSelect.appendChild(noneOpt);
  patternList.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.key;
    opt.textContent = p.name;
    patternSelect.appendChild(opt);
  });

  // Birth/Survival checkboxes
  const birthContainer = $('birth-checks');
  const survivalContainer = $('survival-checks');

  function createBSCheckboxes(container: HTMLElement, prefix: string) {
    for (let i = 0; i <= 8; i++) {
      const label = document.createElement('label');
      label.className = 'bs-check';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.dataset.value = String(i);
      cb.id = `${prefix}-${i}`;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(String(i)));
      container.appendChild(label);
    }
  }
  createBSCheckboxes(birthContainer, 'b');
  createBSCheckboxes(survivalContainer, 's');

  // Dynamic grid editor
  const gridSizeSelect = $('grid-size-select') as HTMLSelectElement;
  let gridButtons: HTMLButtonElement[] = [];

  function buildGrid(size: number) {
    gridSize = size;
    customGridState = new Array(size * size).fill(false);
    customGrid.innerHTML = '';
    customGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    gridButtons = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const idx = r * size + c;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', () => {
          customGridState[idx] = !customGridState[idx];
          btn.classList.toggle('cell-alive', customGridState[idx]);
          btn.setAttribute('aria-pressed', String(customGridState[idx]));
        });
        customGrid.appendChild(btn);
        gridButtons.push(btn);
      }
    }
  }

  function syncGridButtons() {
    for (let i = 0; i < gridButtons.length; i++) {
      gridButtons[i].classList.toggle('cell-alive', customGridState[i]);
      gridButtons[i].setAttribute('aria-pressed', String(customGridState[i]));
    }
  }

  buildGrid(5);

  gridSizeSelect.addEventListener('change', () => {
    buildGrid(parseInt(gridSizeSelect.value));
  });

  customClearBtn.addEventListener('click', () => {
    customGridState.fill(false);
    syncGridButtons();
  });

  // Rule display for 1D
  function renderRulePreview(rule: number) {
    let html = '<div class="rule-grid">';
    for (let i = 7; i >= 0; i--) {
      const left = (i >> 2) & 1;
      const center = (i >> 1) & 1;
      const right = i & 1;
      const result = (rule >> i) & 1;
      html += `<div class="rule-cell">
        <div class="rule-pattern">
          <span class="${left ? 'on' : 'off'}"></span>
          <span class="${center ? 'on' : 'off'}"></span>
          <span class="${right ? 'on' : 'off'}"></span>
        </div>
        <div class="rule-result ${result ? 'on' : 'off'}"></div>
      </div>`;
    }
    html += '</div>';
    ruleDisplay.innerHTML = html;
  }

  function showType(type: '1d' | '2d') {
    settings1d.style.display = type === '1d' ? 'block' : 'none';
    settings2d.style.display = type === '2d' ? 'block' : 'none';
  }

  function getConfig(): Config {
    const type = typeSelect.value as '1d' | '2d';
    if (type === '1d') {
      return {
        type: '1d',
        rule: parseInt(ruleInput.value) || 30,
        width: parseInt(width1dInput.value) || 301,
        initMode: init1dSelect.value as 'center' | 'random',
        solidBorders: solidBordersInput.checked,
      } satisfies Config1D;
    } else {
      const birth = new Set<number>();
      const survival = new Set<number>();
      birthContainer.querySelectorAll('input:checked').forEach(cb => {
        birth.add(parseInt((cb as HTMLInputElement).dataset.value!));
      });
      survivalContainer.querySelectorAll('input:checked').forEach(cb => {
        survival.add(parseInt((cb as HTMLInputElement).dataset.value!));
      });
      const initMode = init2dSelect.value as InitMode2D;
      let customPattern: [number, number][] | null = null;
      let pattern: string | null = null;

      if (initMode === 'custom') {
        const cells: [number, number][] = [];
        const center = Math.floor(gridSize / 2);
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            if (customGridState[r * gridSize + c]) {
              cells.push([r - center, c - center]);
            }
          }
        }
        customPattern = cells.length > 0 ? cells : null;
      } else {
        pattern = patternSelect.value || null;
      }

      return {
        type: '2d',
        birth,
        survival,
        width: parseInt(width2dInput.value) || 150,
        height: parseInt(height2dInput.value) || 150,
        initMode,
        density: parseFloat(densityInput.value),
        pattern,
        customPattern,
        solidBorders: solidBordersInput.checked,
      } satisfies Config2D;
    }
  }

  function setUIFromConfig(config: Config) {
    typeSelect.value = config.type;
    showType(config.type);
    solidBordersInput.checked = config.solidBorders;

    if (config.type === '1d') {
      ruleInput.value = String(config.rule);
      width1dInput.value = String(config.width);
      init1dSelect.value = config.initMode;
      renderRulePreview(config.rule);
    } else {
      width2dInput.value = String(config.width);
      height2dInput.value = String(config.height);
      init2dSelect.value = config.initMode;
      densityInput.value = String(config.density);
      densityValue.textContent = String(config.density);
      patternSelect.value = config.pattern ?? '';

      // Set B/S checkboxes
      birthContainer.querySelectorAll('input').forEach(cb => {
        (cb as HTMLInputElement).checked = config.birth.has(
          parseInt((cb as HTMLInputElement).dataset.value!)
        );
      });
      survivalContainer.querySelectorAll('input').forEach(cb => {
        (cb as HTMLInputElement).checked = config.survival.has(
          parseInt((cb as HTMLInputElement).dataset.value!)
        );
      });

      updateInitModeVisibility(config.initMode);
    }
  }

  function updateInitModeVisibility(mode: string) {
    densityRow.style.display = mode === 'random' ? 'flex' : 'none';
    patternRow.style.display = mode === 'center' ? 'flex' : 'none';
    customPatternRow.style.display = mode === 'custom' ? 'flex' : 'none';
  }

  function applyAndReset() {
    const config = getConfig();
    simulation.applyConfig(config);
    updatePlayButton();
  }

  function updatePlayButton() {
    playBtn.textContent = simulation.isRunning() ? 'Pause' : 'Play';
  }

  // Events
  typeSelect.addEventListener('change', () => {
    const type = typeSelect.value as '1d' | '2d';
    showType(type);
    cellBorderInput.checked = type === '2d';
    applyAndReset();
    applyDisplayOptions();
  });

  presetSelect.addEventListener('change', () => {
    const idx = parseInt(presetSelect.value);
    if (!isNaN(idx) && presets[idx]) {
      const config = presets[idx].config;
      // Deep-copy sets for 2d
      const cloned = config.type === '2d'
        ? { ...config, birth: new Set(config.birth), survival: new Set(config.survival) }
        : { ...config };
      setUIFromConfig(cloned as Config);
      simulation.applyConfig(cloned as Config);
      importSelect.value = '';
      updatePlayButton();
    }
  });

  ruleInput.addEventListener('input', () => {
    let v = parseInt(ruleInput.value);
    if (isNaN(v)) v = 0;
    v = Math.max(0, Math.min(255, v));
    renderRulePreview(v);
  });

  init2dSelect.addEventListener('change', () => {
    updateInitModeVisibility(init2dSelect.value);
  });

  densityInput.addEventListener('input', () => {
    densityValue.textContent = densityInput.value;
  });

  playBtn.addEventListener('click', () => {
    if (simulation.isRunning()) {
      simulation.pause();
    } else {
      simulation.play();
    }
    updatePlayButton();
  });

  stepBtn.addEventListener('click', () => {
    simulation.step();
  });

  resetBtn.addEventListener('click', () => {
    applyAndReset();
  });

  speedInput.addEventListener('input', () => {
    const v = parseInt(speedInput.value);
    speedValue.textContent = String(v);
    simulation.setSpeed(v);
  });

  // Generation counter
  simulation.setOnGenerationChange((gen: number) => {
    genDisplay.textContent = String(gen);
  });

  // Import elements
  const importInput = $('import-input') as HTMLInputElement;
  const importLoadBtn = $('import-load-btn');
  const importFile = $('import-file') as HTMLInputElement;
  const importSelect = $('import-select') as HTMLSelectElement;

  let importedEntries: LegacyParseResult[] = [];

  function applyImportResult(result: LegacyParseResult) {
    // Resize and populate grid editor if pattern present
    if (result.patternGrid) {
      gridSizeSelect.value = String(result.gridSize);
      buildGrid(result.gridSize);
      for (let i = 0; i < result.patternGrid.length; i++) {
        customGridState[i] = result.patternGrid[i];
      }
      syncGridButtons();
    }

    setUIFromConfig(result.config);
    simulation.applyConfig(result.config);
    presetSelect.value = '';
    updatePlayButton();
  }

  importLoadBtn.addEventListener('click', () => {
    const raw = importInput.value;
    if (!raw.trim()) return;
    try {
      const result = parseLegacyString(raw);
      importInput.classList.remove('import-error');
      importInput.removeAttribute('aria-invalid');
      applyImportResult(result);
    } catch {
      importInput.classList.add('import-error');
      importInput.setAttribute('aria-invalid', 'true');
    }
  });

  importInput.addEventListener('input', () => {
    importInput.classList.remove('import-error');
    importInput.removeAttribute('aria-invalid');
  });

  function loadEntriesFromText(text: string): void {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    importedEntries = [];
    while (importSelect.options.length > 1) {
      importSelect.remove(1);
    }
    for (const line of lines) {
      try {
        const result = parseLegacyString(line);
        importedEntries.push(result);
        const opt = document.createElement('option');
        opt.value = String(importedEntries.length - 1);
        opt.textContent = result.label;
        importSelect.appendChild(opt);
      } catch {
        // Skip malformed lines
      }
    }
    importSelect.style.display = importedEntries.length > 0 ? '' : 'none';
    importSelect.value = '';
  }

  // Auto-load bundled library
  loadEntriesFromText(libPubRaw);

  importFile.addEventListener('change', () => {
    const file = importFile.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      loadEntriesFromText(reader.result as string);
    };
    reader.readAsText(file);
  });

  importSelect.addEventListener('change', () => {
    const idx = parseInt(importSelect.value);
    if (!isNaN(idx) && importedEntries[idx]) {
      applyImportResult(importedEntries[idx]);
    }
  });

  // Display options
  function getDisplayOptions() {
    return {
      cellColor: cellColorInput.value,
      cellBorder: cellBorderInput.checked,
    };
  }

  function applyDisplayOptions() {
    simulation.setDisplayOptions(getDisplayOptions());
  }

  function syncCSSColors(color: string) {
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-hover', color);
    document.documentElement.style.setProperty('--cell-alive', color);
  }

  cellColorInput.addEventListener('input', () => {
    syncCSSColors(cellColorInput.value);
    applyDisplayOptions();
  });

  cellBorderInput.addEventListener('change', () => {
    applyDisplayOptions();
  });

  solidBordersInput.addEventListener('change', () => {
    applyAndReset();
  });

  // Canvas click for 2D cell toggling
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvas.addEventListener('click', (e) => {
    if (typeSelect.value === '2d' && !simulation.isRunning()) {
      simulation.handleCanvasClick(e.clientX, e.clientY);
    }
  });

  // Initialize with first preset (Game of Life)
  presetSelect.value = '0';
  presetSelect.dispatchEvent(new Event('change'));
  applyDisplayOptions();
}

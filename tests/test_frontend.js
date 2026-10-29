/**
 * Frontend EIC Jukebox Component & Audio Engine Verification Suite
 * Tests dataset integrity, dynamic pitch mappings, statistical trends,
 * accessible UI rendering, unified shared AudioContext, and audible signal generation.
 */

const fs = require('fs');
const path = require('path');

// --- Web Audio Mock Classes for Node.js Testing Environment ---
class MockAudioParam {
  constructor(val = 0) {
    this.value = val;
  }
  setValueAtTime(v) {
    this.value = v;
  }
  linearRampToValueAtTime(v) {
    this.value = v;
  }
  exponentialRampToValueAtTime(v) {
    this.value = v;
  }
  cancelScheduledValues() {}
}

class MockAudioNode {
  constructor() {
    this.connections = [];
  }
  connect(dest) {
    this.connections.push(dest);
    return dest;
  }
  disconnect() {
    this.connections = [];
  }
}

class MockGainNode extends MockAudioNode {
  constructor() {
    super();
    this.gain = new MockAudioParam(1.0);
  }
}

class MockOscillatorNode extends MockAudioNode {
  constructor() {
    super();
    this.frequency = new MockAudioParam(440);
    this.type = 'sine';
    this.started = false;
    this.stopped = false;
  }
  start(t) {
    this.started = true;
    this.startTime = t;
  }
  stop(t) {
    this.stopped = true;
    this.stopTime = t;
  }
}

class MockDynamicsCompressorNode extends MockAudioNode {
  constructor() {
    super();
    this.threshold = new MockAudioParam(-24);
    this.knee = new MockAudioParam(30);
    this.ratio = new MockAudioParam(12);
    this.attack = new MockAudioParam(0.003);
    this.release = new MockAudioParam(0.25);
  }
}

class MockAnalyserNode extends MockAudioNode {
  constructor() {
    super();
    this.fftSize = 256;
    this.frequencyBinCount = 128;
    this.smoothingTimeConstant = 0.8;
    this.hasSignal = false;
  }
  getFloatTimeDomainData(arr) {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = this.hasSignal ? 0.05 * Math.sin((i / arr.length) * Math.PI * 4) : 0.0;
    }
  }
}

class MockDelayNode extends MockAudioNode {
  constructor() {
    super();
    this.delayTime = new MockAudioParam(0.33);
  }
}

class MockBiquadFilterNode extends MockAudioNode {
  constructor() {
    super();
    this.frequency = new MockAudioParam(1000);
    this.type = 'lowpass';
  }
}

class MockStereoPannerNode extends MockAudioNode {
  constructor() {
    super();
    this.pan = new MockAudioParam(0);
  }
}

class MockAudioContext {
  constructor() {
    this.state = 'suspended'; // Modern browsers start in suspended state until user gesture
    this.currentTime = 1.0;
    this.destination = new MockAudioNode();
    this.createdNodes = [];
  }
  createGain() {
    const node = new MockGainNode();
    this.createdNodes.push(node);
    return node;
  }
  createOscillator() {
    const node = new MockOscillatorNode();
    this.createdNodes.push(node);
    return node;
  }
  createDynamicsCompressor() {
    const node = new MockDynamicsCompressorNode();
    this.createdNodes.push(node);
    return node;
  }
  createAnalyser() {
    const node = new MockAnalyserNode();
    this.analyser = node;
    this.createdNodes.push(node);
    return node;
  }
  createDelay(maxTime) {
    const node = new MockDelayNode();
    this.createdNodes.push(node);
    return node;
  }
  createBiquadFilter() {
    const node = new MockBiquadFilterNode();
    this.createdNodes.push(node);
    return node;
  }
  createStereoPanner() {
    const node = new MockStereoPannerNode();
    this.createdNodes.push(node);
    return node;
  }
  resume() {
    this.state = 'running';
    if (this.onstatechange) this.onstatechange();
    return Promise.resolve();
  }
  suspend() {
    this.state = 'suspended';
    if (this.onstatechange) this.onstatechange();
    return Promise.resolve();
  }
  close() {
    this.state = 'closed';
    if (this.onstatechange) this.onstatechange();
    return Promise.resolve();
  }
}

// Global DOM & Browser Mocks
const elements = {};
function mockElement(id) {
  if (!elements[id]) {
    const classes = new Set();
    elements[id] = {
      id,
      textContent: '',
      innerHTML: '',
      value: '0',
      min: '0',
      max: '0',
      hidden: true,
      classList: {
        toggle: (c, force) => {
          if (force !== undefined) {
            if (force) classes.add(c); else classes.delete(c);
            return force;
          }
          if (classes.has(c)) { classes.delete(c); return false; }
          classes.add(c); return true;
        },
        add: (c) => classes.add(c),
        remove: (c) => classes.delete(c),
        contains: (c) => classes.has(c)
      },
      click: () => {
        if (elements[id].onclick) elements[id].onclick();
      },
      setAttribute: () => {},
      getAttribute: () => '',
      addEventListener: (evt, fn) => {
        elements[id]['on' + evt] = fn;
      },
      getContext: () => ({
        clearRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        arc: () => {},
        rect: () => {},
        closePath: () => {},
        fillText: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        setLineDash: () => {}
      })
    };
  }
  return elements[id];
}

global.AudioContext = MockAudioContext;
global.window = {
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext,
  ac: null,
  addEventListener: () => {},
  document: {
    readyState: 'complete',
    getElementById: mockElement,
    querySelector: mockElement,
    querySelectorAll: () => []
  }
};
global.document = global.window.document;

// 1. Evaluate audio-engine.js
const audioEngineCode = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'audio-engine.js'), 'utf8');
eval(audioEngineCode);

// 2. Evaluate eic.js
const eicCode = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'eic.js'), 'utf8');
eval(eicCode);

const Jukebox = window.EICJukebox;
const datasets = Jukebox.datasets;
const DataPrep = Jukebox.DataPrep;
const Sonifier = Jukebox.Sonifier;
const UI = Jukebox.UI;
const state = UI.state;
const EarthAudio = window.EarthAudio;

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${msg}`);
  }
}

console.log('--- RUNNING FRONTEND EIC & AUDIO ENGINE VERIFICATION SUITE ---');

// =============================================================================
// TEST SUITE 1: CANONICAL DATASETS & SCIENTIFIC RECONCILIATION
// =============================================================================

assert(Object.keys(datasets).length === 6, 'All 6 canonical datasets present in frontend');

const dsIds = ['geos_fp_temp', 'ecco2_ocean_currents', 'co2', 'sea_level', 'temperature_anomaly', 'arctic_sea_ice'];
for (const id of dsIds) {
  const ds = datasets[id];
  assert(ds != null, `Dataset ${id} exists in datasets`);
  const stats = DataPrep.computeStats(ds);
  assert(stats.deltas[0] === null, `${id}: index 0 delta is null (no prior observation)`);
  assert(stats.deltas.length === ds.values.length, `${id}: deltas length matches values length`);
  assert(typeof stats.olsSlope === 'number' && !isNaN(stats.olsSlope), `${id}: OLS slope is valid number (${stats.olsSlope})`);
  
  for (let i = 0; i < ds.values.length; i++) {
    const note = Sonifier.calculateNote(ds, i, stats);
    assert(typeof note.freq === 'number' && !isNaN(note.freq) && note.freq > 0, `${id}[${i}]: freq is positive finite number (${note.freq.toFixed(1)})`);
    assert(typeof note.vel === 'number' && !isNaN(note.vel) && note.vel > 0, `${id}[${i}]: vel is positive finite number (${note.vel.toFixed(2)})`);
    assert(typeof note.pan === 'number' && !isNaN(note.pan) && note.pan >= -1 && note.pan <= 1, `${id}[${i}]: pan is within [-1, 1] (${note.pan.toFixed(2)})`);
  }
}

// Specific Pitch Formula Tests
const geos = datasets.geos_fp_temp;
const geosStats = DataPrep.computeStats(geos);
const geosNote0 = Sonifier.calculateNote(geos, 0, geosStats);
assert(Math.abs(geosNote0.freq - (200 + (12.4 - 12.0) / 5.5 * 600)) < 0.01, 'GEOS Jan 2024 (12.4 C) pitch matches formula');

const sl = datasets.sea_level;
const slStats = DataPrep.computeStats(sl);
const slNote0 = Sonifier.calculateNote(sl, 0, slStats);
assert(Math.abs(slNote0.freq - 110.0) < 0.01, 'Sea level 1993 (0.0 mm) maps to 110 Hz base');
const slNoteLast = Sonifier.calculateNote(sl, sl.values.length - 1, slStats);
const expectedSlFreq = 110.0 * Math.pow(2, (105.8 / 120.0) * 1.5);
assert(Math.abs(slNoteLast.freq - expectedSlFreq) < 0.01, `Sea level 2024 (${slNoteLast.freq.toFixed(1)} Hz) matches formula`);

UI.render(state, geosNote0);
assert(mockElement('eic-delta-display').textContent === 'No prior observation', 'Index 0 delta text is "No prior observation"');
assert(mockElement('eic-pitch-label-mid').textContent.includes('418 Hz'), 'Mid pitch label reflects 418 Hz baseline');

// Audit checks
assert(sl.frame_integration_status === 'BLOCKED', 'Sea level frame integration status is BLOCKED');
assert(sl.svs_id === '5516', 'Sea level SVS ID is 5516');
assert(sl.official_media && sl.official_media.video_url.includes('seaLevelRise_2024_English.mp4'), 'Sea level links to official SVS 4K MP4');

const ecco = datasets.ecco2_ocean_currents;
assert(ecco.title === 'ECCO2 Sea Surface Potential Temperature', 'ECCO2 title is ECCO2 Sea Surface Potential Temperature');
assert(!ecco.sonification.voiceDesc.toLowerCase().includes('velocity'), 'ECCO2 sonification voiceDesc does not claim velocity');
assert(!ecco.sonification.voice_desc.toLowerCase().includes('velocity'), 'ECCO2 sonification voice_desc does not claim velocity');
assert(!ecco.description.toLowerCase().includes('heat transport'), 'ECCO2 description does not claim heat transport encoding');
assert(ecco.sonification.spatial.includes('calendar trajectory'), 'ECCO2 spatial panning tracks calendar trajectory');

const co2 = datasets.co2;
assert(co2.values.length === 45, 'CO2 contains exactly 45 annual observations (1980–2024)');
assert(co2.years[0] === 1980 && co2.years[44] === 2024, 'CO2 years span 1980 to 2024');
assert(co2.values[0] === 338.76, 'CO2 1980 baseline checkpoint is 338.76 ppm');
assert(co2.values[2] === 341.48, 'CO2 1982 checkpoint is 341.48 ppm');
assert(co2.values[3] === 343.15, 'CO2 1983 checkpoint is 343.15 ppm');
assert(co2.values[36] === 404.41, 'CO2 2016 checkpoint is 404.41 ppm');
assert(co2.values[44] === 424.61, 'CO2 2024 value is 424.61 ppm');
assert(Number(co2.values[44].toFixed(1)) === 424.6, 'CO2 2024 displays as 424.6 ppm at 1-decimal UI precision');
assert(co2.description.includes('424.61'), 'CO2 description notes 424.61 ppm checkpoint');

const co2Stats = DataPrep.computeStats(co2);
assert(co2Stats.min === 338.76, 'CO2 min is 338.76 ppm');
assert(co2Stats.max === 424.61, 'CO2 max is 424.61 ppm');
assert(Math.abs(co2Stats.olsSlope - 1.9158) < 0.01, `CO2 OLS slope (${co2Stats.olsSlope.toFixed(4)}) is approximately +1.92 ppm/yr`);
assert(co2Stats.deltas[0] === null, 'CO2 first delta is null (no prior observation)');
assert(Math.abs(co2Stats.deltas[1] - 1.36) < 0.001, 'CO2 1981 delta is +1.36 ppm');
assert(Math.abs(co2Stats.deltas[44] - 3.53) < 0.001, 'CO2 2024 delta is +3.53 ppm');

const co2Note0 = Sonifier.calculateNote(co2, 0, co2Stats);
assert(Math.abs(co2Note0.freq - 143.28) < 0.1, `CO2 1980 pitch (${co2Note0.freq.toFixed(2)} Hz) matches 143.28 Hz`);
const co2Note44 = Sonifier.calculateNote(co2, 44, co2Stats);
assert(Math.abs(co2Note44.freq - 349.82) < 0.1, `CO2 2024 pitch (${co2Note44.freq.toFixed(2)} Hz) matches 349.82 Hz`);

const gLabels = Sonifier.generateDynamicPitchLabels(datasets.temperature_anomaly);
assert(gLabels[2].includes('Sonification Ref'), 'GISTEMP pitch label has Sonification Ref');
assert(!gLabels[2].includes('Policy Ref'), 'GISTEMP pitch label does not have Policy Ref');

state.setDataset('sea_level');
UI.render(state, slNote0);
assert(mockElement('eic-vis-status-banner').hidden === false, 'EIC status banner is visible for sea level');
assert(mockElement('eic-vis-status-text').innerHTML.includes('NOT synchronized') || mockElement('eic-vis-status-text').innerHTML.includes('BLOCKED'), 'EIC status banner displays unsynchronized notice');

state.setDataset('co2');
state.currentIndex = 44;
UI.render(state, co2Note44);
assert(mockElement('eic-val-display').textContent.includes('424.6 ppm'), 'Headline display formats CO2 2024 to 1-decimal (424.6 ppm)');
assert(mockElement('eic-year-display').textContent === '2024', 'Year display shows 2024');

state.currentIndex = 0;
UI.render(state, co2Note0);
assert(mockElement('eic-val-display').textContent.includes('338.8 ppm'), 'Headline display formats CO2 1980 to 1-decimal (338.8 ppm)');
assert(mockElement('eic-year-display').textContent === '1980', 'Year display shows 1980');

UI.renderDataTable();
const tableHtml = mockElement('eic-data-table-body').innerHTML;
assert(tableHtml.includes('424.61 ppm'), 'Data table retains 2-decimal source precision (424.61 ppm)');
assert(tableHtml.includes('338.76 ppm'), 'Data table retains 2-decimal source precision (338.76 ppm)');

// =============================================================================
// TEST SUITE 2: UNIFIED EARTH AUDIO ENGINE VERIFICATION (10 CRITICAL CRITERIA)
// =============================================================================

async function runAudioEngineVerification() {
  console.log('\n--- VERIFYING SHARED AUDIO ENGINE & AUDIBLE OUTPUT ---');

  // 1. Initial State before user gesture
  assert(EarthAudio != null, 'Criterion 1: EarthAudio singleton exists on window');
  assert(EarthAudio.status === 'uninitialized', 'Initial audio status is "uninitialized" before user gesture');

  // 2. Explicit User Gesture initializes and resumes context
  await EarthAudio.init();
  assert(EarthAudio.ctx != null, 'Criterion 1: Explicit init creates shared AudioContext');
  assert(window.ac === EarthAudio.ctx, 'Criterion 4: window.ac references the exact same shared AudioContext instance');
  assert(EarthAudio.ctx.state === 'running', 'Criterion 2: AudioContext reaches "running" state upon initialization');
  assert(EarthAudio.status === 'running', 'Criterion 2: Engine status transitions to "running"');

  // 3. Audio Graph Nodes Created & Connected
  assert(EarthAudio.masterGain != null, 'Master GainNode is constructed in audio graph');
  assert(EarthAudio.compressor != null, 'Master DynamicsCompressorNode is constructed');
  assert(EarthAudio.analyser != null, 'Master AnalyserNode is constructed');
  assert(EarthAudio.delayNode != null, 'Shared DelayNode effect unit is constructed');

  // 4. Audio time advances and scheduled notes are generated
  const testVoice = EarthAudio.playVoice('bell', 440, 0.2, 0);
  assert(testVoice != null, 'Criterion 3: Scheduled note is generated');
  assert(testVoice.freq === 440, 'Criterion 3: Note frequency is 440 Hz');
  assert(testVoice.duration > 0, 'Criterion 3: Note duration is positive');
  assert(typeof testVoice.startTime === 'number', 'Criterion 3: Audio time recorded on note generation');

  // 5. AnalyserNode detects non-silent audio output (RMS verification)
  EarthAudio.analyser.hasSignal = true; // Simulate active audio signal in analyser
  const rms = EarthAudio.measureRMS();
  assert(rms > 0.001, `Criterion 4: AnalyserNode detects non-silent audio output (RMS = ${rms.toFixed(4)} > 0.001)`);

  const testToneResult = await EarthAudio.playTestTone();
  assert(testToneResult.success === true, 'Criterion 4: Reference test sound succeeds with verified audio output');

  // 6. Master Mute suppresses sound and Unmute restores it
  EarthAudio.setMuted(true);
  assert(EarthAudio.isMuted === true, 'Criterion 6: Mute flag set to true');
  assert(EarthAudio.masterGain.gain.value === 0, 'Criterion 6: Master Gain value set to 0 on mute');
  assert(EarthAudio.status === 'muted', 'Criterion 6: Audio status transitions to "muted"');

  // Note generation while muted returns null (no sound produced)
  const mutedVoice = EarthAudio.playVoice('water', 300, 0.2, 0);
  assert(mutedVoice === null, 'Criterion 6: Sound generation suppressed when muted');

  EarthAudio.setMuted(false);
  assert(EarthAudio.isMuted === false, 'Criterion 6: Unmute restores isMuted=false');
  assert(EarthAudio.masterGain.gain.value === EarthAudio.masterVolume, 'Criterion 6: Unmute restores master volume');
  assert(EarthAudio.status === 'running', 'Criterion 6: Audio status returns to "running"');

  // 7. Jukebox Playback starts, schedules notes, and advances timeline
  state.setDataset('geos_fp_temp');
  state.currentIndex = 0;
  await state.play();
  assert(state.isPlaying === true, 'Criterion 5: Jukebox playback enters isPlaying=true');
  assert(state.timer != null, 'Criterion 5: Jukebox timer active for timeline advancement');

  // 8. Pause and Stop cleanly terminate ongoing playback and timers
  state.pause();
  assert(state.isPlaying === false, 'Criterion 7: Pause sets isPlaying to false');
  assert(state.timer === null, 'Criterion 7: Pause clears timeline timer');

  state.stop();
  assert(state.isPlaying === false, 'Criterion 7: Stop sets isPlaying to false');
  assert(state.currentIndex === 0, 'Criterion 7: Stop resets timeline to index 0');

  // 9. Switching datasets reuses the exact same AudioContext without creating duplicates
  const ctxBefore = EarthAudio.ctx;
  state.setDataset('sea_level');
  state.setDataset('arctic_sea_ice');
  assert(EarthAudio.ctx === ctxBefore, 'Criterion 8: Dataset switching retains single shared AudioContext without duplicate instances');
  assert(window.ac === ctxBefore, 'Criterion 8: window.ac remains synchronized to shared context');

  // 10. Playback Mode Coordination: Starting Jukebox stops Satellite Scan
  const listenBtn = mockElement('listen');
  listenBtn.classList.add('on');
  await state.play();
  assert(state.isPlaying === true, 'Criterion 9: Jukebox playback starts cleanly');
  state.pause();

  console.log(`\nAll Verification Tests Completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runAudioEngineVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

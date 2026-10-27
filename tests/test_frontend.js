/**
 * Frontend EIC Jukebox Component Verification Suite
 * Tests dataset integrity, dynamic pitch mappings, statistical trends,
 * accessible UI rendering, and official provenance disclosures.
 */

const fs = require('fs');

const elements = {};
function mockElement(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      textContent: '',
      innerHTML: '',
      value: '0',
      min: '0',
      max: '0',
      hidden: true,
      classList: {
        toggle: () => {},
        add: () => {},
        remove: () => {}
      },
      setAttribute: () => {},
      getAttribute: () => '',
      addEventListener: () => {},
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

global.window = {
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

// Load assets/js/eic.js
const code = fs.readFileSync('assets/js/eic.js', 'utf8');
eval(code);

const Jukebox = window.EICJukebox;
const datasets = Jukebox.datasets;
const DataPrep = Jukebox.DataPrep;
const Sonifier = Jukebox.Sonifier;
const UI = Jukebox.UI;
const state = UI.state;

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

console.log('--- RUNNING FRONTEND EIC VERIFICATION SUITE ---');

// 1. Verify Dataset count
assert(Object.keys(datasets).length === 6, 'All 6 datasets present in frontend');

// 2. Check stats and notes for all datasets
const dsIds = ['geos_fp_temp', 'ecco2_ocean_currents', 'co2', 'sea_level', 'temperature_anomaly', 'arctic_sea_ice'];
for (const id of dsIds) {
  const ds = datasets[id];
  assert(ds != null, `Dataset ${id} exists in datasets`);
  const stats = DataPrep.computeStats(ds);
  assert(stats.deltas[0] === null, `${id}: index 0 delta is null (no prior observation)`);
  assert(stats.deltas.length === ds.values.length, `${id}: deltas length matches values length`);
  assert(typeof stats.olsSlope === 'number' && !isNaN(stats.olsSlope), `${id}: OLS slope is valid number (${stats.olsSlope})`);
  
  // Test note calculation across all points
  for (let i = 0; i < ds.values.length; i++) {
    const note = Sonifier.calculateNote(ds, i, stats);
    assert(typeof note.freq === 'number' && !isNaN(note.freq) && note.freq > 0, `${id}[${i}]: freq is positive finite number (${note.freq.toFixed(1)})`);
    assert(typeof note.vel === 'number' && !isNaN(note.vel) && note.vel > 0, `${id}[${i}]: vel is positive finite number (${note.vel.toFixed(2)})`);
    assert(typeof note.pan === 'number' && !isNaN(note.pan) && note.pan >= -1 && note.pan <= 1, `${id}[${i}]: pan is within [-1, 1] (${note.pan.toFixed(2)})`);
  }
}

// 3. Verify specific pitch mappings
// GEOS-FP Temp: 12.0 C -> 200 Hz; 14.0 C -> 418.18 Hz; 17.5 C -> 800 Hz
const geos = datasets.geos_fp_temp;
const geosStats = DataPrep.computeStats(geos);
const geosNote0 = Sonifier.calculateNote(geos, 0, geosStats); // 12.4 C
assert(Math.abs(geosNote0.freq - (200 + (12.4 - 12.0)/5.5 * 600)) < 0.01, 'GEOS Jan 2024 (12.4 C) pitch matches formula');

// Sea Level: 0.0 mm -> 110 Hz
const sl = datasets.sea_level;
const slStats = DataPrep.computeStats(sl);
const slNote0 = Sonifier.calculateNote(sl, 0, slStats);
assert(Math.abs(slNote0.freq - 110.0) < 0.01, 'Sea level 1993 (0.0 mm) maps to 110 Hz base');
const slNoteLast = Sonifier.calculateNote(sl, sl.values.length - 1, slStats); // 105.8 mm
const expectedSlFreq = 110.0 * Math.pow(2, (105.8 / 120.0) * 1.5);
assert(Math.abs(slNoteLast.freq - expectedSlFreq) < 0.01, `Sea level 2024 (${slNoteLast.freq.toFixed(1)} Hz) matches formula`);

// Render test
UI.render(state, geosNote0);
assert(mockElement('eic-delta-display').textContent === 'No prior observation', 'Index 0 delta text is "No prior observation"');
assert(mockElement('eic-pitch-label-mid').textContent.includes('418 Hz'), 'Mid pitch label reflects 418 Hz baseline');

// 4. Verify Phase 1 & 2 audit corrections
assert(sl.frame_integration_status === 'BLOCKED', 'Sea level frame integration status is BLOCKED');
assert(sl.svs_id === '5516', 'Sea level SVS ID is 5516');
assert(sl.official_media && sl.official_media.video_url.includes('seaLevelRise_2024_English.mp4'), 'Sea level links to official SVS 4K MP4');

// ECCO2 Audit
const ecco = datasets.ecco2_ocean_currents;
assert(ecco.title === 'ECCO2 Sea Surface Potential Temperature', 'ECCO2 title is ECCO2 Sea Surface Potential Temperature');
assert(!ecco.sonification.voiceDesc.toLowerCase().includes('velocity'), 'ECCO2 sonification voiceDesc does not claim velocity');
assert(!ecco.sonification.voice_desc.toLowerCase().includes('velocity'), 'ECCO2 sonification voice_desc does not claim velocity');
assert(!ecco.description.toLowerCase().includes('heat transport'), 'ECCO2 description does not claim heat transport encoding');
assert(ecco.sonification.spatial.includes('calendar trajectory'), 'ECCO2 spatial panning tracks calendar trajectory');

// CO2 Audit & NOAA Scientific Data Reconciliation
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

// Verify NOAA CO2 stats and linear trend
const co2Stats = DataPrep.computeStats(co2);
assert(co2Stats.min === 338.76, 'CO2 min is 338.76 ppm');
assert(co2Stats.max === 424.61, 'CO2 max is 424.61 ppm');
assert(Math.abs(co2Stats.olsSlope - 1.9158) < 0.01, `CO2 OLS slope (${co2Stats.olsSlope.toFixed(4)}) is approximately +1.92 ppm/yr`);
assert(co2Stats.deltas[0] === null, 'CO2 first delta is null (no prior observation)');
assert(Math.abs(co2Stats.deltas[1] - 1.36) < 0.001, 'CO2 1981 delta is +1.36 ppm');
assert(Math.abs(co2Stats.deltas[44] - 3.53) < 0.001, 'CO2 2024 delta is +3.53 ppm');

// Verify CO2 note calculation
const co2Note0 = Sonifier.calculateNote(co2, 0, co2Stats);
assert(Math.abs(co2Note0.freq - 143.28) < 0.1, `CO2 1980 pitch (${co2Note0.freq.toFixed(2)} Hz) matches 143.28 Hz`);
const co2Note44 = Sonifier.calculateNote(co2, 44, co2Stats);
assert(Math.abs(co2Note44.freq - 349.82) < 0.1, `CO2 2024 pitch (${co2Note44.freq.toFixed(2)} Hz) matches 349.82 Hz`);

// GISTEMP Audit
const gLabels = Sonifier.generateDynamicPitchLabels(datasets.temperature_anomaly);
assert(gLabels[2].includes('Sonification Ref'), 'GISTEMP pitch label has Sonification Ref');
assert(!gLabels[2].includes('Policy Ref'), 'GISTEMP pitch label does not have Policy Ref');

// Render sea level to test status banner & sync indicator
state.setDataset('sea_level');
UI.render(state, slNote0);
assert(mockElement('eic-vis-status-banner').hidden === false, 'EIC status banner is visible for sea level');
assert(mockElement('eic-vis-status-text').innerHTML.includes('NOT synchronized') || mockElement('eic-vis-status-text').innerHTML.includes('BLOCKED'), 'EIC status banner displays unsynchronized / BLOCKED notice');

// Render CO2 to test headline 1-decimal and table 2-decimal formatting
state.setDataset('co2');
state.currentIndex = 44;
UI.render(state, co2Note44);
assert(mockElement('eic-val-display').textContent.includes('424.6 ppm'), 'Headline display formats CO2 2024 to 1-decimal (424.6 ppm)');
assert(mockElement('eic-year-display').textContent === '2024', 'Year display shows 2024');

// Also test index 0 (1980)
state.currentIndex = 0;
UI.render(state, co2Note0);
assert(mockElement('eic-val-display').textContent.includes('338.8 ppm'), 'Headline display formats CO2 1980 to 1-decimal (338.8 ppm)');
assert(mockElement('eic-year-display').textContent === '1980', 'Year display shows 1980');

UI.renderDataTable();
const tableHtml = mockElement('eic-data-table-body').innerHTML;
assert(tableHtml.includes('424.61 ppm'), 'Data table retains 2-decimal source precision (424.61 ppm)');
assert(tableHtml.includes('338.76 ppm'), 'Data table retains 2-decimal source precision (338.76 ppm)');

console.log(`Frontend EIC Tests Completed: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);

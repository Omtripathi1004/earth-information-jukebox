const $ = s => document.querySelector(s), clamp = (x, a, b) => Math.min(b, Math.max(a, x));
/* Optional Python backend (same origin, or ?api=https://your-backend). Without it the app calls NASA and OSM directly. */
const API = (new URLSearchParams(location.search).get('api') || '').replace(/\/$/, '');
const DEFAULT_CFG = {
  mapillary_token: 'MLY|28415219754844023|3e0b88295f7b9b304ee99a95354d3280',
  cesium_ion_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjhBM19iRkdzT0RILVpEYWUiLCJqdGkiOiIyNTAzZmNkMS0zMjc2LTQ1MDAtOWU1OS05NzY3OWU0YTAwYWUiLCJpZCI6NTMzMzQ2LCJzdWIiOiJPbXRyaXBhdGhpMTAwNCIsImlzcyI6Imh0dHBzOi8vYXBpLmNlc2l1bS5jb20iLCJhdWQiOiJlYXJ0aCBqdWtlIGJveCIsImlhdCI6MTc5Mjc2MDE1OH0.q1c8_MmIQ0IwTR53xm0IfOVDP2vybE8HsvclLGN-Fi8'
};
let BACKEND = false, CFG = Object.assign({}, DEFAULT_CFG);
const loadConfig = () => {
  fetch(API + '/api/config').then(r => r.ok ? r.json() : null).then(c => {
    if (c) {
      if (c.mapillary_token) CFG.mapillary_token = c.mapillary_token;
      if (c.cesium_ion_token) CFG.cesium_ion_token = c.cesium_ion_token;
    }
  }).catch(() => {});
};
loadConfig();
fetch(API + '/api/health').then(r => r.ok ? r.json() : null).then(j => {
  BACKEND = !!(j && j.ok);
  $('#pc').disabled = $('#cw').disabled = !BACKEND;
  loadConfig();
}).catch(() => {});
const Z0 = 1.1, Z1 = 19.6;
const LBL = [], LM = [['Taj Mahal', 27.1751, 78.0421, 'The Taj Mahal in Agra, a marble mausoleum completed in the 17th century.'], ['Eiffel Tower', 48.8584, 2.2945, 'The Eiffel Tower in Paris, completed in 1889.'], ['Giza pyramids', 29.9792, 31.1342, 'The pyramids of Giza in Egypt, more than 4,500 years old.'], ['Statue of Liberty', 40.6892, -74.0445, 'The Statue of Liberty in New York Harbor, dedicated in 1886.'], ['Statue of Unity', 21.8380, 73.7191, 'The Statue of Unity in Gujarat, India, the tallest statue in the world at 182 metres.'], ['Colosseum', 41.8902, 12.4922, 'The Colosseum in Rome, which opened in the year 80.'], ['Burj Khalifa', 25.1972, 55.2744, 'The Burj Khalifa in Dubai, the tallest building in the world at 828 metres.'], ['Machu Picchu', -13.1631, -72.545, 'Machu Picchu, a 15th-century Inca citadel high in the Peruvian Andes.'], ['Sydney Opera House', -33.8568, 151.2153, 'The Sydney Opera House, which opened in 1973.']];
const FACTS = { 'Statue of Unity': 'The Statue of Unity in Gujarat, India, the tallest statue in the world at 182 metres.', 'Amazon': 'The Amazon rainforest, the largest tropical rainforest on Earth.', 'Himalaya': 'The Himalaya, home to Mount Everest, the highest mountain above sea level.', 'Sundarbans': 'The Sundarbans, the largest mangrove forest in the world, shared by Bangladesh and India.', 'Nile Delta': 'The Nile Delta, where Egypt\u2019s great river meets the Mediterranean.', 'Aral Sea': 'The Aral Sea, once one of the four largest lakes in the world, has shrunk dramatically since the 1960s.', 'Greenland ice': 'The Greenland ice sheet, whose melting adds to sea level rise.', 'Great Barrier Reef': 'The Great Barrier Reef, the largest coral reef system in the world.', 'Dubai': 'Dubai, a city that has grown out of the desert coast.', 'Central Valley Farms': 'California\u2019s Central Valley, one of the world\u2019s most productive agricultural valleys producing over 250 crops.', 'Punjab Farmlands': 'Punjab, India\u2019s agrarian breadbasket with fertile irrigated fields.', 'Lucas do Rio Verde': 'Lucas do Rio Verde in Mato Grosso, Brazil: a major agricultural center surrounded by vast grain and soybean fields.', 'Iowa Farmland': 'The Iowa Corn Belt, expansive cultivated agricultural grids in the American Midwest.' };
const PLACES = [
  ['Amazon', -3.47, -62.2, 8.5],
  ['Himalaya', 27.99, 86.93, 8.5],
  ['Sundarbans', 21.95, 89.18, 9.5],
  ['Nile Delta', 31.0, 31.0, 9.0],
  ['Aral Sea', 45.0, 59.5, 8.0],
  ['Greenland ice', 69.2, -51.1, 7.5],
  ['Great Barrier Reef', -18.3, 147.7, 8.5],
  ['Dubai', 25.2, 55.27, 14.5],
  ['Lucas do Rio Verde', -13.0665, -55.9197, 17.5],
  ['Central Valley Farms', 36.75, -119.77, 17.2],
  ['Punjab Farmlands', 30.9, 75.85, 17.2],
  ['Iowa Farmland', 42.03, -93.63, 17.2]
];
$('#dt').value = $('#dt').max = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
const lyr = () => $('#lyr').value.split('|'), isData = () => lyr()[1] !== '9' && lyr()[0] !== 'GOOGLE_SATELLITE' && lyr()[0] !== 'ESRI_World_Imagery';
const gibs = () => {
  const [id, lv, ext] = lyr();
  if (id === 'GOOGLE_SATELLITE' || id === 'ESRI_World_Imagery') return '';
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${id}/default/${$('#dt').value}/GoogleMapsCompatible_Level${lv}/{z}/{y}/{x}.${ext}`;
};

/* ---------- Earth view ---------- */
const map = new maplibregl.Map({
  container: 'map', center: [10, 20], zoom: Z0, minZoom: .5, maxZoom: 20.5, maxPitch: 60, dragRotate: true, scrollZoom: false, doubleClickZoom: false, keyboard: false, touchZoomRotate: false,
  canvasContextAttributes: { preserveDrawingBuffer: true, antialias: true }, attributionControl: { compact: true },
  style: { version: 8, projection: { type: 'globe' }, glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf', sources: {
      google_sat: { type: 'raster', tileSize: 256, maxzoom: 20, tiles: [
        'https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}',
        'https://mt3.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}'
      ], attribution: '© Google, Maxar Technologies' },
      gibs: { type: 'raster', tileSize: 256, maxzoom: 9, tiles: [gibs() || 'https://mt1.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}'], attribution: 'NASA EOSDIS GIBS' } },
    layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#02050c' } },
      { id: 'google_sat', type: 'raster', source: 'google_sat', paint: { 'raster-fade-duration': 0 } },
      { id: 'gibs', type: 'raster', source: 'gibs', layout: { visibility: (lyr()[0] === 'GOOGLE_SATELLITE' || lyr()[0] === 'ESRI_World_Imagery') ? 'none' : 'visible' }, paint: { 'raster-fade-duration': 0, 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 8.5, 1, 10.5, 0] } }] }
});
map.on('load', () => {
  schedulePhotoSpots();
  fetch('https://tiles.openfreemap.org/styles/bright').then(r => r.json()).then(s => {   /* OpenStreetMap buildings, extruded in 3D at ground level */
    const bl = s.layers.find(l => l['source-layer'] === 'building'); if (!bl) return;
    map.addSource('ofm', { type: 'vector', url: s.sources[bl.source].url, attribution: '© OpenStreetMap, OpenFreeMap' });
    map.addLayer({ id: 'bld3d', type: 'fill-extrusion', source: 'ofm', 'source-layer': 'building', minzoom: 14, layout: { visibility: 'none' }, paint: { 'fill-extrusion-color': '#e2e8f0', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], ['get', 'height'], 8], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0], 'fill-extrusion-opacity': .9 } });
    /* real map labels (places, streets, landmarks) on top of the satellite photo */
    try { map.setGlyphs(s.glyphs); } catch (e) {}
    s.layers.filter(l => l.type === 'symbol' && ['place', 'transportation_name', 'water_name', 'poi'].includes(l['source-layer'])).forEach(l => {
      try { const c = { ...l, id: 'lbl-' + l.id, source: 'ofm', layout: { ...l.layout } }; delete c.layout['icon-image']; map.addLayer(c); LBL.push(c.id); } catch (e) {}
    });
  }).catch(() => {});
});
function applyLayer() {   /* NASA data layers sit on a greyscale base so every colour you hear is data */
  const [id] = lyr(), d = isData();
  const isNASA = id !== 'GOOGLE_SATELLITE' && id !== 'ESRI_World_Imagery';
  try {
    map.setLayoutProperty('gibs', 'visibility', isNASA ? 'visible' : 'none');
  } catch (e) {}
  if (!isNASA) {
    map.setPaintProperty('google_sat', 'raster-saturation', 0);
    map.setPaintProperty('google_sat', 'raster-brightness-max', 1);
    $('#hear').textContent = 'global high-res satellite';
    return;
  }
  const t = gibs();
  if (t) { try { map.getSource('gibs').setTiles([t]); } catch (e) {} }
  map.setPaintProperty('google_sat', 'raster-saturation', d ? -1 : 0);
  map.setPaintProperty('google_sat', 'raster-brightness-max', d ? .55 : 1);
  map.setPaintProperty('gibs', 'raster-opacity', d ? ['interpolate', ['linear'], ['zoom'], 7, .9, 9.5, 0] : ['interpolate', ['linear'], ['zoom'], 8.5, 1, 10.5, 0]);
}
['lyr', 'dt'].forEach(id => $('#' + id).onchange = applyLayer);

/* ---------- scroll = zoom toward the centred place ---------- */
let zs = Z0, busy = false, lastZ = -1, terrainOn = false;
const range = () => Math.max(1, document.documentElement.scrollHeight - innerHeight), zFromScroll = () => Z0 + (Z1 - Z0) * clamp(scrollY / range(), 0, 1);
const scrollToZ = (z, b) => scrollTo({ top: (clamp(z, Z0, Z1) - Z0) / (Z1 - Z0) * range(), behavior: b || 'smooth' });
const chap = z => z < 2.5 ? 'Orbit · the whole Earth' : z < 5 ? 'Continent' : z < 8 ? 'Region' : z < 11 ? 'City' : z < 14 ? 'Neighborhood' : z < 17 ? 'Street level' : 'Ground level · 3D';

function frame() {
  const zt = zFromScroll(); zs += (zt - zs) * .12; if (Math.abs(zt - zs) < .003) zs = zt;
  if (!busy && Math.abs(zs - lastZ) > .002) {
    lastZ = zs;
    // Gentle 3D perspective pitch (max 38 deg) so monuments are upright and clear, not squashed into flat ovals
    const targetPitch = clamp((zs - 13) / 4.5, 0, 1) * 38;
    map.jumpTo({ zoom: zs, pitch: targetPitch });
    const c = map.getCenter();
    $('#chap').textContent = chap(zs);
    $('#coord').textContent = `${Math.abs(c.lat).toFixed(2)}°${c.lat >= 0 ? 'N' : 'S'} ${Math.abs(c.lng).toFixed(2)}°${c.lng >= 0 ? 'E' : 'W'}`;
    const wk = 156.543 * Math.cos(c.lat * Math.PI / 180) / 2 ** zs * innerWidth;
    $('#scale').textContent = zs < 3 ? 'whole planet' : `≈ ${fmtKm(wk)} across · altitude ≈ ${fmtKm(wk * 1.5)}`;
    $('#intro').style.opacity = clamp(1 - (zs - Z0) / 1.5, 0, 1);
    
    // Fade out the dark circular vignette so zoomed-in views have zero oval darkening
    const vig = $('#vignette');
    if (vig) vig.style.opacity = clamp(1 - (zs - 2.5) / 1.5, 0, 1);

    $('#zr').value = (zs - Z0) / (Z1 - Z0) * 1000;
    if (ac) { dl.frequency.setTargetAtTime(150 + zs * 120, ac.currentTime, .1); dg.gain.setTargetAtTime(listening ? .035 : 0, ac.currentTime, .2); }
  }
  requestAnimationFrame(frame);
}
const fmtKm = k => k >= 100 ? Math.round(k) + ' km' : k >= 1 ? k.toFixed(1) + ' km' : Math.round(k * 1000) + ' m';
map.on('dragstart', () => busy = true);
map.on('moveend', () => { busy = false; zs = map.getZoom(); scheduleLookup(); schedulePhotoSpots(); });
map.on('dragend', () => { busy = false; zs = map.getZoom(); lastZ = -1; scheduleLookup(); schedulePhotoSpots(); });
function pick(lat, lng, z) { busy = true; const t = Math.max(map.getZoom(), z); map.easeTo({ center: [lng, lat], zoom: t, duration: 1800 }); scrollToZ(t, 'instant'); }
map.on('click', e => {
  if (map.getZoom() < 7) {
    pick(e.lngLat.lat, e.lngLat.lng, 10);
  } else {
    onMapInspectClick(e.lngLat.lat, e.lngLat.lng);
  }
});
map.on('dblclick', e => {
  e.preventDefault();
  openPhotosForLocation(e.lngLat.lat, e.lngLat.lng);
});
$('#zr').oninput = e => scrollToZ(Z0 + e.target.value / 1000 * (Z1 - Z0), 'instant');
$('#zin').onclick = () => scrollToZ(zFromScroll() + 1.5); $('#zout').onclick = () => scrollToZ(zFromScroll() - 1.5);
PLACES.forEach(([n, la, lo, z]) => { const b = document.createElement('button'); b.className = 'btn chip pe'; b.textContent = n; b.onclick = () => pick(la, lo, z || 17.2); $('#chips').appendChild(b); });
LM.forEach(([n, la, lo]) => { const b = document.createElement('button'); b.className = 'btn chip pe'; b.style.borderColor = '#F59E0B'; b.textContent = '🏛 ' + n; b.onclick = () => pick(la, lo, 17.6); $('#chips').appendChild(b); });
$('#sf').onsubmit = async e => {
  e.preventDefault(); const q = $('#q').value.trim(); if (!q) return;
  try { const j = await (await fetch((BACKEND ? API + '/api/geocode' : 'https://nominatim.openstreetmap.org/search') + '?format=json&limit=1&q=' + encodeURIComponent(q))).json(); if (j[0]) pick(+j[0].lat, +j[0].lon, 16.8); else $('#place').textContent = 'No match for “' + q + '”'; } catch (err) { $('#place').textContent = 'Search needs an internet connection'; }
};

/* ---------- place name + NASA POWER local climate ---------- */
let lt, place = '', lastC = null, CL = null;
const scheduleLookup = () => { clearTimeout(lt); lt = setTimeout(lookup, 1000); };
async function lookup() {
  const c = map.getCenter(), z = map.getZoom();
  try { const j = await (await fetch(`${BACKEND ? API + '/api/reverse' : 'https://nominatim.openstreetmap.org/reverse'}?format=json&zoom=${z < 3.5 ? 3 : z < 6 ? 5 : z < 9 ? 8 : z < 12 ? 10 : 16}&lat=${c.lat}&lon=${c.lng}`)).json(); const p = (j.display_name || '').split(', '); place = j.error ? 'Open ocean or remote area' : [...new Set([...p.slice(0, 2), p[p.length - 1]])].join(', '); } catch (e) { place = ''; }
  $('#place').textContent = place || 'Unnamed place';
  if (z >= 3 && (!lastC || Math.hypot(c.lat - lastC.lat, c.lng - lastC.lng) > .4)) { lastC = c; climate(c.lat, c.lng); }
}
async function climate(lat, lon) {
  $('#cl').textContent = 'Loading NASA POWER…'; $('#cm').disabled = true;
  try {
    if (BACKEND) {   /* the Python backend caches NASA POWER, computes the trend and avoids browser CORS limits */
      const s = await (await fetch(`${API}/api/climate?lat=${lat.toFixed(3)}&lon=${lon.toFixed(3)}`)).json(); if (s.error) throw new Error(s.error);
      CL = { Y: s.years, TT: s.temp_c, b: s.trend_c_per_year, my: s.mean_c, rain: s.mean_rain_mm_day }; drawCl();
      $('#cl').textContent = `Mean ${CL.my.toFixed(1)} °C · trend ${CL.b >= 0 ? '+' : '−'}${Math.abs(CL.b * 10).toFixed(2)} °C per decade · rain ${CL.rain.toFixed(1)} mm/day`; $('#cm').disabled = false; return;
    }
    const j = await (await fetch(`https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M,PRECTOTCORR&community=RE&longitude=${lon.toFixed(2)}&latitude=${lat.toFixed(2)}&start=1985&end=2025&format=JSON`)).json();
    const T = j.properties.parameter.T2M, R = j.properties.parameter.PRECTOTCORR, Y = [], TT = [], RR = [];
    for (let y = 1985; y <= 2025; y++) { const tm = [], rm = []; for (let m = 1; m <= 12; m++) { const k = y + String(m).padStart(2, '0'); if (T[k] > -900) tm.push(T[k]); if (R[k] > -900) rm.push(R[k]); } if (tm.length >= 10) { Y.push(y); TT.push(tm.reduce((a, b) => a + b) / tm.length); RR.push(rm.length ? rm.reduce((a, b) => a + b) / rm.length : 0); } }
    const n = Y.length, mx = Y.reduce((a, b) => a + b) / n, my = TT.reduce((a, b) => a + b) / n; let sxy = 0, sxx = 0; Y.forEach((y, i) => { sxy += (y - mx) * (TT[i] - my); sxx += (y - mx) ** 2; });
    CL = { Y, TT, b: sxy / sxx, my, rain: RR.reduce((a, b) => a + b) / n }; drawCl();
    $('#cl').textContent = `Mean ${CL.my.toFixed(1)} °C · trend ${CL.b >= 0 ? '+' : '−'}${Math.abs(CL.b * 10).toFixed(2)} °C per decade · rain ${CL.rain.toFixed(1)} mm/day`; $('#cm').disabled = false;
  } catch (e) { CL = null; drawCl(); $('#cl').textContent = 'NASA POWER could not be reached for this spot.'; }
}
function drawCl() {
  const c = $('#cc'), g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); if (!CL) return; const { TT, b, my, Y } = CL, mn = Math.min(...TT), mx = Math.max(...TT);
  const X = i => 4 + i / (TT.length - 1) * (c.width - 8), Yy = v => c.height - 6 - (v - mn) / (mx - mn || 1) * (c.height - 12);
  g.strokeStyle = '#F59E0B'; g.lineWidth = 2; g.beginPath(); TT.forEach((v, i) => i ? g.lineTo(X(i), Yy(v)) : g.moveTo(X(i), Yy(v))); g.stroke();
  const f = i => my + b * (Y[i] - (Y.reduce((a, c2) => a + c2) / Y.length)); g.strokeStyle = '#fff'; g.setLineDash([4, 3]); g.lineWidth = 1; g.beginPath(); g.moveTo(X(0), Yy(f(0))); g.lineTo(X(TT.length - 1), Yy(f(TT.length - 1))); g.stroke(); g.setLineDash([]);
}

/* ---------- sound: the image scan + the climate melody ---------- */
let ac, mst, dly, dl, dg, listening = false, scanT, col = 0;
function boot() {
  if (ac) return ac.resume(); ac = new (window.AudioContext || window.webkitAudioContext)(); mst = ac.createGain(); mst.gain.value = .8;
  const cp = ac.createDynamicsCompressor(); mst.connect(cp); cp.connect(ac.destination);
  dly = ac.createDelay(1); dly.delayTime.value = .33; const fb = ac.createGain(), wt = ac.createGain(); fb.gain.value = .4; wt.gain.value = .35; dly.connect(fb); fb.connect(dly); dly.connect(wt); wt.connect(mst);
  const o = ac.createOscillator(); dl = ac.createBiquadFilter(); dg = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = 55; dl.frequency.value = 200; dg.gain.value = 0; o.connect(dl); dl.connect(dg); dg.connect(mst); o.start();
}
const scaleF = k => 130.81 * 2 ** ((12 * Math.floor(k / 5) + [0, 2, 4, 7, 9][k % 5]) / 12);
function voice(c, f, v, pan) {
  const t = ac.currentTime, g = ac.createGain(), pn = ac.createStereoPanner(), lp = ac.createBiquadFilter(), dur = c === 'water' ? 1.8 : c === 'bell' ? 1.4 : .7; pn.pan.value = pan; lp.type = 'lowpass'; lp.frequency.value = c === 'desert' ? 1500 : 6000;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + (c === 'water' ? .08 : .01)); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  (c === 'bell' ? [[1, 'sine', 1], [2.76, 'sine', .45], [5.4, 'sine', .2]] : c === 'water' ? [[1, 'sine', 1], [1.005, 'sine', .6]] : c === 'forest' ? [[1, 'triangle', 1], [2, 'sine', .25]] : [[1, 'sawtooth', .6], [1.5, 'triangle', .3]])
    .forEach(([m, ty, w]) => { const o = ac.createOscillator(), og = ac.createGain(); o.type = ty; o.frequency.value = f * m; og.gain.value = w; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + .05); });
  g.connect(lp); lp.connect(pn); pn.connect(mst); pn.connect(dly);
}
function dataScan(d) {   /* NASA data frame: colour (blue = low, red = high) becomes pitch; grey = no data = silence */
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] >= 128 && Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) > 40) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } }
  if (n < 2) { $('#hear').textContent = 'no data in this column (grey)'; return; }
  r /= n; g /= n; b /= n; const mx = Math.max(r, g, b), sat = mx - Math.min(r, g, b);
  let h = mx === r ? ((g - b) / sat) % 6 : mx === g ? (b - r) / sat + 2 : (r - g) / sat + 4; h = (h * 60 + 360) % 360;
  const v = clamp((240 - clamp(h, 0, 240)) / 240, 0, 1);
  if (ac) voice('bell', scaleF(Math.round(v * 9) + 3), .1 + sat / 255 * .12, col / SW * 1.6 - .8);
  $('#hear').textContent = `${lyr()[0].includes('Temp') ? 'land temperature' : 'aerosol'} ${v < .33 ? 'low' : v < .66 ? 'medium' : 'high'} (${Math.round(v * 100)}%)`;
}
const SW = 48, SH = 27, sc = document.createElement('canvas'); sc.width = SW; sc.height = SH; const sx = sc.getContext('2d', { willReadFrequently: true });
function scan() {
  if (!listening) return; col = (col + 1) % SW; $('#scan').style.left = col / SW * 100 + '%';
  try {
    sx.clearRect(0, 0, SW, SH); sx.drawImage(srcCanvas(), 0, 0, SW, SH); const d = sx.getImageData(col, 0, 1, SH).data; let r = 0, g = 0, b = 0, n = 0; const Ls = [];
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; Ls.push(d[i] + d[i + 1] + d[i + 2]); }
    if (n > 3 && isData()) { dataScan(d); } else if (n > 3) {
      r /= n; g /= n; b /= n; const L = (r + g + b) / 765, mean = Ls.reduce((a, c) => a + c) / n, sd = Math.sqrt(Ls.reduce((a, c) => a + (c - mean) ** 2, 0) / n) / 765;
      const cls = L > .7 && Math.abs(r - b) < 30 ? 'ice' : b > r + 8 && b >= g - 6 ? 'water' : g > r + 4 && g >= b ? 'forest' : 'desert';
      const k = Math.round(clamp(L * 1.15, 0, 1) * 9), semis = [0, 2, 4, 7, 9][k % 5] + 12 * Math.floor(k / 5) + { water: -12, forest: 0, desert: 0, ice: 12 }[cls];
      if (ac) voice(cls === 'ice' ? 'bell' : cls, 130.81 * 2 ** (semis / 12), .08 + Math.min(.14, sd * .9), col / SW * 1.6 - .8);
      $('#hear').textContent = `${cls === 'ice' ? 'cloud / ice' : cls === 'water' ? 'water' : cls === 'forest' ? 'vegetation' : 'bare land / urban'} · ${Math.round(L * 100)}% bright`;
    }
  } catch (e) { $('#hear').textContent = 'the browser blocked reading map pixels'; }
  scanT = setTimeout(scan, +$('#spdn').value);
}
$('#listen').onclick = () => {
  listening = !listening; $('#listen').classList.toggle('on', listening); $('#listen').setAttribute('aria-pressed', listening); $('#listen').textContent = listening ? '■ Stop listening' : '♪ Listen to this view';
  $('#scan').style.display = listening ? 'block' : 'none'; clearTimeout(scanT); lastZ = -1; if (listening) { boot(); scan(); } else $('#hear').textContent = 'paused';
};
let cmT; $('#cm').onclick = () => {
  if (!CL) return; boot(); clearInterval(cmT); const { Y, TT } = CL, m = CL.my; let i = 0;
  cmT = setInterval(() => { if (i >= Y.length) { clearInterval(cmT); $('#clyr').textContent = ''; return; } voice('bell', scaleF(Math.round(clamp((TT[i] - m + 1.5) / 3, 0, 1) * 14)), .16, i / Y.length * 1.6 - .8); $('#clyr').textContent = Y[i++]; }, 200);
};

/* ---------- rich historical knowledge & narrator ---------- */
const HISTORICAL_KNOWLEDGE = {
  'Taj Mahal': {
    title: 'The Taj Mahal · Agra, India',
    speech: "Welcome to the Taj Mahal in Agra, India, universally admired as an architectural masterpiece of Mughal art and one of the New Seven Wonders of the World. Commissioned in 1631 by Mughal Emperor Shah Jahan as a mausoleum for his beloved wife Mumtaz Mahal, it took over twenty thousand artisans and twenty-two years to complete. Built entirely from translucent white Makrana marble that subtly changes hue from rosy pink at dawn to shimmering gold under the full moon, its facades feature intricate floral pietra dura inlays crafted from twenty-eight varieties of semi-precious gemstones. An ingenious optical and engineering masterstroke: the four flanking minarets were deliberately constructed to tilt outward by two degrees, guaranteeing that if an earthquake ever struck, they would collapse outward and protect the sacred central dome."
  },
  'Eiffel Tower': {
    title: 'The Eiffel Tower · Paris, France',
    speech: "You are looking at the Eiffel Tower in Paris, France, the global emblem of the French nation and an extraordinary marvel of 19th-century structural engineering. Designed by Gustave Eiffel and unveiled in 1889 as the grand monumental entrance arch for the Universal Exposition commemorating the centennial of the French Revolution, it held the undisputed title of the world's tallest man-made structure for over forty years at three hundred and thirty metres. Constructed from eighteen thousand pieces of puddle wrought iron joined by two and a half million rivets, it was originally destined for demolition after twenty years. Its fate was saved when the French military discovered its revolutionary strategic value as a radio telegraph tower, famously intercepting enemy battle orders during World War One."
  },
  'Colosseum': {
    title: 'The Colosseum (Flavian Amphitheatre) · Rome, Italy',
    speech: "This is the Colosseum, the largest standing ancient amphitheatre on Earth, situated at the historic heart of Rome, Italy. Commissioned under Emperor Vespasian in 72 AD and inaugurated by his son Titus in 80 AD with one hundred consecutive days of games, it could seat over fifty thousand Roman spectators. Built using travertine limestone, volcanic tuff, and brick-faced concrete with eighty arched entrances, it featured an intricate multi-level subterranean labyrinth known as the hypogeum, equipped with vertical wooden lifts and pulleys to hoist gladiators and wild animals directly into combat. In its early years, Roman hydraulic engineers could even flood the entire arena floor to stage naumachiae, spectacular mock naval sea battles."
  },
  'Giza pyramids': {
    title: 'The Pyramids of Giza · Cairo, Egypt',
    speech: "You are surveying the Pyramids of Giza in Egypt, the oldest and only surviving monument of the original Seven Wonders of the Ancient World. Built during Egypt's Fourth Dynasty over four thousand five hundred years ago as monumental royal tombs for Pharaohs Khufu, Khafre, and Menkaure, the Great Pyramid was assembled from approximately two point three million massive limestone blocks, some weighing upwards of fifty tons. For over three thousand eight hundred years, it stood as the tallest building on Earth. Its four cardinal faces align to true astronomical north with an astonishing precision of three sixtieths of a degree, standing as eternal testament to ancient Egyptian mathematics and engineering."
  },
  'Statue of Liberty': {
    title: 'The Statue of Liberty · New York, United States',
    speech: "This is the Statue of Liberty, officially christened Liberty Enlightening the World, standing proudly in New York Harbor since 1886. A joint gift of friendship from the people of France to the United States celebrating the centennial of American independence and the historic abolition of slavery, it was sculpted by Frédéric-Auguste Bartholdi with an internal load-bearing iron framework engineered by Gustave Eiffel. Fashioned from three hundred and fifty sheets of hand-hammered copper, now draped in its signature green verdigris patina, Lady Liberty holds high the torch of enlightenment and a tabula ansata inscribed July 4, 1776, while broken chains lie at her feet representing freedom from tyranny."
  },
  'Burj Khalifa': {
    title: 'Burj Khalifa · Dubai, United Arab Emirates',
    speech: "Rising into the desert sky is the Burj Khalifa in Dubai, the tallest building and tallest freestanding structure in recorded human history, soaring eight hundred and twenty-eight metres high with one hundred and sixty-three floors. Opened in 2010 and designed by architect Adrian Smith, its Y-shaped tripartite footprint was inspired by the regional desert spider lily flower, tapering gradually to deflect turbulent high-altitude wind currents. At its summit, the tower's metallic spire is visible from ninety-five kilometres away, and due to its tremendous vertical height, spectators on the ground can watch the sun set twice on the same evening by riding the ultra-high-speed elevator to the top observation decks."
  },
  'Machu Picchu': {
    title: 'Machu Picchu · Cusco Region, Peru',
    speech: "Perched dramatically two thousand four hundred and thirty metres high in the Peruvian Andes is Machu Picchu, the legendary 15th-century Inca royal sanctuary. Built around 1450 under the reign of Inca Emperor Pachacuti and abandoned during the Spanish conquest, it remained concealed from the world until American explorer Hiram Bingham arrived in 1911. Master Inca stonemasons carved polished granite boulders using ashlar masonry without a drop of mortar, fitting stones so tightly that a knife blade cannot penetrate. During earthquakes, these stones rhythmically vibrate in place before resetting, preserving the ancient citadel through centuries of seismic tremors."
  },
  'Sydney Opera House': {
    title: 'Sydney Opera House · Sydney, Australia',
    speech: "Gracing Bennelong Point in Sydney Harbour is the Sydney Opera House, universally celebrated as a masterpiece of 20th-century modern expressionist architecture. Designed by Danish architect Jørn Utzon and inaugurated by Queen Elizabeth II in 1973, its iconic white precast vaulted roof shells were inspired by segments of an orange. Utzon solved the monumental mathematical engineering puzzle by deriving all shell ribs from the geometry of a single sphere, covered in over one million self-cleaning Swedish glazed ceramic tiles that capture the changing sea breezes and harbour sunlight."
  },
  'Amazon': {
    title: 'The Amazon River & Rainforest · South America',
    speech: "Spanning across nine South American nations is the Amazon Basin, the largest tropical rainforest and mightiest hydrological system on our planet. The Amazon River discharges roughly two hundred and nine thousand cubic metres of fresh water every second into the Atlantic Ocean—more than the next seven largest rivers combined. Home to over three hundred and ninety billion individual trees, ten percent of all known animal species, and hundreds of indigenous tribes, the Amazon generates a fifth of the world's river runoff and acts as a colossal planetary climate regulator and carbon reservoir."
  },
  'Himalaya': {
    title: 'The Himalaya & Mount Everest · Asia',
    speech: "Rising before you is the mighty Himalaya, the world's highest mountain range, forged fifty million years ago when the Indian tectonic plate collided with Eurasia—a geologic collision that still pushes the peaks upward by roughly five millimetres each year. Crowned by Mount Everest at eight thousand eight hundred and forty-eight metres, known as Sagarmatha in Nepal and Chomolungma in Tibet, this immense frozen realm holds the third pole, the largest non-polar ice deposit on Earth, feeding major rivers that sustain over one point three billion people across Asia."
  },
  'Sundarbans': {
    title: 'Sundarbans Mangrove Delta · Bangladesh & India',
    speech: "This is the Sundarbans, the largest contiguous mangrove forest on Earth, spanning ten thousand square kilometres across the vast delta where the Ganges, Brahmaputra, and Meghna rivers merge into the Bay of Bengal. Named after the exquisite sundari mangrove trees, this tidal labyrinth is the only mangrove habitat on Earth prowled by the endangered Royal Bengal tiger, whose paws have adapted to swimming across saltwater channels. This UNESCO World Heritage biosphere forms a vital living buffer, shielding tens of millions of coastal inhabitants from fierce tropical cyclones."
  },
  'Nile Delta': {
    title: 'The Nile Delta · Egypt',
    speech: "You are looking at the lush green fan of the Nile Delta in northern Egypt, where the world's longest river meets the Mediterranean Sea. Known as the cradle of ancient Egyptian civilization, these nutrient-rich floodplains have been continuously farmed for over five thousand years. At its western edge stands the historic city of Alexandria, founded in 331 BC by Alexander the Great, once home to the fabled Great Library and the towering Pharos Lighthouse."
  },
  'Aral Sea': {
    title: 'The Aral Sea · Central Asia',
    speech: "Before you lies the basin of the Aral Sea between Kazakhstan and Uzbekistan, once the fourth largest inland lake in the world, spanning sixty-eight thousand square kilometres. In one of the 20th century's most poignant environmental tragedies, massive Soviet irrigation diversions dried up its feeder rivers, causing ninety percent of the sea to vanish and exposing the new Aralkum desert. Today, the monumental Kokaral Dam in Kazakhstan has begun reversing the tide, successfully restoring fish populations and water levels in the North Aral Sea."
  },
  'Greenland ice': {
    title: 'The Greenland Ice Sheet · Arctic',
    speech: "Stretching across the polar north is the Greenland Ice Sheet, the second largest body of glacial ice on Earth, blanketing one point seven million square kilometres. Layered with snow that fell over two million years ago and reaching depths of over three kilometres, this immense reservoir holds enough frozen water to raise global sea levels by over seven metres if fully melted. NASA satellites monitor its glacial flow daily to track the pulse of global climate change."
  },
  'Great Barrier Reef': {
    title: 'The Great Barrier Reef · Coral Sea, Australia',
    speech: "Glittering along the northeast coast of Australia is the Great Barrier Reef, the planet's largest living biological structure, stretching over two thousand three hundred kilometres across three hundred and forty-four thousand square kilometres. Built by trillions of microscopic coral polyps over hundreds of thousands of years, it is so colossal that it can be recognized by astronauts from space. It hosts fifteen hundred species of tropical fish, six species of sea turtles, and more than four hundred varieties of hard and soft coral."
  },
  'Dubai': {
    title: 'Dubai · United Arab Emirates',
    speech: "On the southern coast of the Persian Gulf stands Dubai, a world-renowned metropolis of visionary architecture and ambition. Originating as a peaceful pearl-diving village along Dubai Creek, the city transformed during the late 20th century into an international crossroads for commerce, aviation, and technological ingenuity. Today, its coastline boasts iconic engineered marvels like the Palm Jumeirah archipelago and record-setting skyscrapers rising boldly above the desert sands."
  }
};

async function getRichDescription(c, placeName) {
  for (const [name, klat, klng] of LM) {
    if (Math.hypot(c.lat - klat, c.lng - klng) < 0.05 && HISTORICAL_KNOWLEDGE[name]) {
      return HISTORICAL_KNOWLEDGE[name];
    }
  }
  for (const [name, klat, klng] of PLACES) {
    if (Math.hypot(c.lat - klat, c.lng - klng) < 1.5 && HISTORICAL_KNOWLEDGE[name]) {
      return HISTORICAL_KNOWLEDGE[name];
    }
  }
  try {
    const geo = await (await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${c.lat}|${c.lng}&gsradius=10000&gslimit=1&format=json&origin=*`)).json();
    const hit = geo && geo.query && geo.query.geosearch && geo.query.geosearch[0];
    if (hit && hit.title) {
      const sum = await (await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`)).json();
      if (sum && sum.extract) {
        return {
          title: sum.title + ' · ' + (placeName || 'Regional Heritage'),
          speech: `${sum.title}: ${sum.extract} Located in the historic region of ${placeName}.`
        };
      }
    }
  } catch (e) {}
  const climInfo = CL ? `NASA POWER climate records document a four-decade temperature trend of ${(CL.b * 10).toFixed(2)} degrees Celsius per decade since 1985.` : '';
  return {
    title: placeName || 'Global Observation',
    speech: `Observing ${placeName || 'this region'}. Looking from ${chap(zs)}, spanning ${$('#scale').textContent}. ${climInfo} Known for its distinct geographical character and natural heritage.`
  };
}

let descActive = false;
const stopSpeech = () => {
  if (window.speechSynthesis) speechSynthesis.cancel();
  descActive = false;
  $('#desc').textContent = '🔊 Describe';
  $('#desc').classList.remove('on');
  if ($('#narrative-card')) $('#narrative-card').hidden = true;
};

$('#desc').onclick = async () => {
  if (descActive) { stopSpeech(); return; }
  if (!window.speechSynthesis) return;
  const c = map.getCenter(), placeName = $('#place').textContent;
  $('#desc').textContent = '⏳ Researching…';
  const info = await getRichDescription(c, placeName);
  const card = $('#narrative-card'), titleEl = $('#narrative-title'), textEl = $('#narrative-text');
  if (card && titleEl && textEl) {
    titleEl.textContent = info.title;
    textEl.textContent = info.speech;
    card.hidden = false;
  }
  speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(info.speech);
  utt.rate = 0.95;
  utt.pitch = 1.0;
  utt.onstart = () => {
    descActive = true;
    $('#desc').textContent = '■ Stop story';
    $('#desc').classList.add('on');
  };
  utt.onend = stopSpeech;
  utt.onerror = stopSpeech;
  speechSynthesis.speak(utt);
};
if ($('#narrative-close')) $('#narrative-close').onclick = stopSpeech;
addEventListener('keydown', e => { if (!/INPUT|SELECT/.test(e.target.tagName) && (e.key === 'l' || e.key === 'L')) $('#listen').click(); });
$('#gnd').onclick = () => scrollToZ(18.9);
$('#lg').onclick = () => { const l = $('#legend'); l.hidden = !l.hidden; $('#lg').setAttribute('aria-expanded', String(!l.hidden)); };
const download = path => { const a = document.createElement('a'); a.href = API + path; a.download = ''; document.body.appendChild(a); a.click(); a.remove(); };
$('#pc').onclick = () => { const c = map.getCenter(); download(`/api/sonify/frame.wav?layer=${lyr()[0]}&date=${$('#dt').value}&lat=${c.lat.toFixed(4)}&lon=${c.lng.toFixed(4)}&zoom=${clamp(Math.round(map.getZoom()), 2, 9)}`); };
$('#cw').onclick = () => { const c = map.getCenter(); download(`/api/sonify/climate.wav?lat=${c.lat.toFixed(3)}&lon=${c.lng.toFixed(3)}`); };

/* ---------- keys (kept only in this browser, or handed over by the backend) ---------- */
const key = k => {
  let v = '';
  try { v = localStorage.getItem('jk_' + k) || ''; } catch (e) {}
  if (v) return v;
  if (k === 'ion') return CFG.cesium_ion_token || '';
  if (k === 'mly') return CFG.mapillary_token || '';
  return '';
};
function openKeys(msg) {
  $('#kmsg').textContent = msg || '';
  try {
    $('#mly').value = localStorage.getItem('jk_mly') || CFG.mapillary_token || '';
    $('#ion').value = localStorage.getItem('jk_ion') || CFG.cesium_ion_token || '';
    const st = $('#kenv');
    if (st) {
      const parts = [];
      if (CFG.mapillary_token) parts.push('Mapillary');
      if (CFG.cesium_ion_token) parts.push('Cesium ion');
      st.textContent = parts.length ? `✓ Connected via .env (${parts.join(', ')})` : '';
    }
  } catch (e) {}
  $('#keys').hidden = false;
}
$('#ks').onclick = () => {
  try {
    ['mly', 'ion'].forEach(k => {
      const v = $('#' + k).value.trim();
      v ? localStorage.setItem('jk_' + k, v) : localStorage.removeItem('jk_' + k);
    });
  } catch (e) {}
  $('#keys').hidden = true;
};
$('#kx').onclick = () => { $('#keys').hidden = true; };
if ($('#kb')) $('#kb').onclick = () => openKeys('');

/* ---------- Global Ground Photos, 360° Street View & Interactive Photo Spots ---------- */
const stc = $('#stc'), sg = stc ? stc.getContext('2d') : null;
let pxv = null, ALL_PHOTOS = [], currentPhotoIdx = 0, currentViewMode = '360', lastNearestRoad = null;
let photoSpotMarkers = [], userPinMarker = null, showPhotoSpots = true, spotsDebounce = null;

const srcCanvas = () => !$('#st').hidden ? (currentViewMode === 'photo' ? (stc || map.getCanvas()) : map.getCanvas()) : (!$('#px').hidden && pxv) ? pxv.scene.canvas : map.getCanvas();

/* 1. Photo Spots on Map */
function clearPhotoSpots() {
  photoSpotMarkers.forEach(m => m.remove());
  photoSpotMarkers = [];
}

function schedulePhotoSpots() {
  clearTimeout(spotsDebounce);
  spotsDebounce = setTimeout(updatePhotoSpots, 800);
}
window.schedulePhotoSpots = schedulePhotoSpots;
window.openPhotosForLocation = openPhotosForLocation;
window.onMapInspectClick = onMapInspectClick;

async function updatePhotoSpots() {
  if (!showPhotoSpots || map.getZoom() < 8.5) {
    clearPhotoSpots();
    return;
  }
  const c = map.getCenter();
  const z = map.getZoom();
  const radius = Math.min(10000, Math.max(1200, Math.round(35000000 / Math.pow(2, z))));
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${c.lat}|${c.lng}&ggsradius=${radius}&ggslimit=20&prop=coordinates|pageimages|description&piprop=thumbnail|original&pithumbsize=600&format=json&origin=*`;
    const resp = await fetch(url);
    if (!resp.ok) return;
    const data = await resp.json();
    const pages = data.query && data.query.pages ? Object.values(data.query.pages) : [];

    clearPhotoSpots();

    pages.forEach(p => {
      const coords = p.coordinates && p.coordinates[0];
      if (!coords) return;
      const hasImg = !!p.thumbnail;

      const wrap = document.createElement('div');
      wrap.className = 'photo-spot-wrapper';
      wrap.innerHTML = `<div class="photo-spot-pin has-wiki" title="${p.title}${p.description ? ' · ' + p.description : ''}">${hasImg ? '📷' : '📍'}</div>`;

      wrap.onclick = (e) => {
        e.stopPropagation();
        onMapInspectClick(coords.lat, coords.lon, p);
        openPhotosForLocation(coords.lat, coords.lon, p);
      };

      const marker = new maplibregl.Marker({ element: wrap })
        .setLngLat([coords.lon, coords.lat])
        .addTo(map);
      photoSpotMarkers.push(marker);
    });
  } catch (e) {}
}

/* 2. User Pin Placement on Map Click */
function onMapInspectClick(lat, lng, initialMeta) {
  // Move or create glowing blue pin
  if (!userPinMarker) {
    const wrap = document.createElement('div');
    wrap.className = 'user-pin-wrapper';
    wrap.innerHTML = '<div class="user-click-pin" title="Selected Spot"></div>';
    wrap.onclick = () => openPhotosForLocation(lat, lng, initialMeta);
    userPinMarker = new maplibregl.Marker({ element: wrap, anchor: 'bottom' })
      .setLngLat([lng, lat])
      .addTo(map);
  } else {
    userPinMarker.setLngLat([lng, lat]);
  }

  // Show inspect notification pill if modal is not active
  const pill = $('#photo-inspect-pill');
  if (pill) {
    pill.hidden = !$('#st').hidden;
    const title = initialMeta ? initialMeta.title : `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
    $('#photo-inspect-text').textContent = `📍 ${title}`;
    $('#photo-inspect-open').onclick = () => openPhotosForLocation(lat, lng, initialMeta);
  }

  // If photo viewer is already open, reload for this new coordinate
  if (!$('#st').hidden) {
    openPhotosForLocation(lat, lng, initialMeta);
  }
}

if ($('#photo-inspect-close')) {
  $('#photo-inspect-close').onclick = () => {
    if ($('#photo-inspect-pill')) $('#photo-inspect-pill').hidden = true;
  };
}

if ($('#spots-btn')) {
  $('#spots-btn').onclick = () => {
    showPhotoSpots = !showPhotoSpots;
    $('#spots-btn').classList.toggle('on', showPhotoSpots);
    $('#spots-btn').setAttribute('aria-pressed', showPhotoSpots ? 'true' : 'false');
    if (showPhotoSpots) updatePhotoSpots(); else clearPhotoSpots();
  };
}

/* 3. Apology Modal for Remote / Inaccessible Areas */
function showNoStreetModal(target) {
  $('#st').hidden = true;
  if ($('#stf')) $('#stf').src = 'about:blank';
  if ($('#st-header')) $('#st-header').hidden = true;
  const modal = $('#no-street-modal');
  if (!modal) return;
  modal.hidden = false;
  $('#hear').textContent = 'Ground photo not available for this remote area';

  const nearBtn = $('#no-st-nearest');
  if (nearBtn) {
    if (target && target.lat != null && target.lng != null && target.dist != null) {
      nearBtn.hidden = false;
      const dKm = target.dist > 1000 ? `${(target.dist / 1000).toFixed(1)} km` : `${Math.round(target.dist)} m`;
      nearBtn.innerHTML = `<span aria-hidden="true">📍</span> Fly to Nearest Road (${dKm} away)`;
      nearBtn.onclick = () => {
        modal.hidden = true;
        map.flyTo({ center: [target.lng, target.lat], zoom: 16.5, essential: true });
        map.once('moveend', () => {
          setTimeout(openStreet, 350);
        });
      };
    } else {
      nearBtn.hidden = true;
    }
  }
}

if ($('#no-st-close')) {
  $('#no-st-close').onclick = () => {
    if ($('#no-street-modal')) $('#no-street-modal').hidden = true;
  };
}

/* 4. Multi-Source Photos Fetching & Display (Google 360, Wikipedia, Mapillary) */
let currentPanoMeta = null;

async function openPhotosForLocation(lat, lng, initialMeta) {
  if (lat == null || lng == null) {
    const c = map.getCenter();
    lat = c.lat;
    lng = c.lng;
  }
  if ($('#no-street-modal')) $('#no-street-modal').hidden = true;
  if ($('#photo-inspect-pill')) $('#photo-inspect-pill').hidden = true;

  // Immediately display photo modal with loading state
  $('#st').hidden = false;
  if ($('#stcap')) $('#stcap').textContent = 'Loading photos & 360 view…';
  if ($('#st-img-loading')) $('#st-img-loading').hidden = false;
  if ($('#st-pcount')) $('#st-pcount').textContent = '…';

  ALL_PHOTOS = [];
  currentPhotoIdx = 0;
  lastNearestRoad = null;
  let snapLat = lat, snapLng = lng, roadDist = null;
  let isRoadSnapped = false;
  const MAX_ROAD_SNAP_DIST = 200; // Snapping strictly restricted to 100 - 200m!

  // If initialMeta provided (e.g. user clicked a Wikipedia marker), add it immediately
  if (initialMeta && (initialMeta.thumbnail || initialMeta.original)) {
    const tSrc = initialMeta.thumbnail && initialMeta.thumbnail.source;
    const oSrc = initialMeta.original && initialMeta.original.source;
    ALL_PHOTOS.push({
      type: 'photo',
      source: 'Wikipedia',
      title: initialMeta.title,
      desc: initialMeta.description || '',
      imgUrl: tSrc || oSrc,
      fallbackUrl: oSrc && oSrc !== tSrc ? oSrc : null,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(initialMeta.title)}`,
      lat: (initialMeta.coordinates && initialMeta.coordinates[0]) ? initialMeta.coordinates[0].lat : lat,
      lng: (initialMeta.coordinates && initialMeta.coordinates[0]) ? initialMeta.coordinates[0].lon : lng,
      dist: 0
    });
    currentViewMode = 'photo';
    renderPhotoView(null);
  }

  // 1. Check nearest drivable road via OSRM for 360 Street View
  const fetchRoad = (async () => {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 2000);
      const r = await fetch(`https://router.project-osrm.org/nearest/v1/driving/${lng.toFixed(5)},${lat.toFixed(5)}?number=1`, { signal: ctrl.signal });
      clearTimeout(tid);
      if (r.ok) {
        const j = await r.json();
        if (j.code === 'Ok' && j.waypoints && j.waypoints[0]) {
          const wp = j.waypoints[0];
          roadDist = wp.distance;
          lastNearestRoad = { lng: wp.location[0], lat: wp.location[1], dist: wp.distance };
          // ONLY snap to road if within 200m! Never snap kilometers away!
          if (roadDist <= MAX_ROAD_SNAP_DIST) {
            snapLng = wp.location[0];
            snapLat = wp.location[1];
            isRoadSnapped = true;
          }
        }
      }
    } catch (e) {}
  })();

  // 2. Query Wikipedia / Wikimedia Geosearch for place photos
  const fetchWiki = (async () => {
    try {
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${lat}|${lng}&ggsradius=8000&ggslimit=20&prop=coordinates|pageimages|description&piprop=thumbnail|original&pithumbsize=1200&format=json&origin=*`;
      const wResp = await fetch(wikiUrl);
      if (wResp.ok) {
        const wData = await wResp.json();
        const pages = wData.query && wData.query.pages ? Object.values(wData.query.pages) : [];
        pages.forEach(p => {
          if (!p.thumbnail && !p.original) return;
          if (initialMeta && p.title === initialMeta.title) return; // avoid duplicate
          const pLat = (p.coordinates && p.coordinates[0]) ? p.coordinates[0].lat : lat;
          const pLng = (p.coordinates && p.coordinates[0]) ? p.coordinates[0].lon : lng;
          const pDist = Math.hypot(pLat - lat, (pLng - lng) * Math.cos(lat * Math.PI / 180)) * 111000;
          const tSrc = p.thumbnail && p.thumbnail.source;
          const oSrc = p.original && p.original.source;
          ALL_PHOTOS.push({
            type: 'photo',
            source: 'Wikimedia',
            title: p.title,
            desc: p.description || '',
            imgUrl: tSrc || oSrc,
            fallbackUrl: oSrc && oSrc !== tSrc ? oSrc : null,
            mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.title)}`,
            lat: pLat,
            lng: pLng,
            dist: pDist
          });
        });
      }
    } catch (e) {}
  })();

  // 3. Query Mapillary crowd photos
  const fetchMapillary = (async () => {
    const T = key('mly');
    if (!T) return;
    const scales = [0.003, 0.015];
    for (const dy of scales) {
      const dx = dy / Math.max(.2, Math.cos(lat * Math.PI / 180));
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 2000);
        const j = await (await fetch(`https://graph.mapillary.com/images?access_token=${encodeURIComponent(T)}&fields=id,thumb_1024_url,computed_geometry,captured_at,compass_angle&bbox=${lng - dx},${lat - dy},${lng + dx},${lat + dy}&limit=20`, { signal: ctrl.signal })).json();
        clearTimeout(tid);
        const found = (j.data || []).filter(i => i.thumb_1024_url && i.computed_geometry);
        if (found.length) {
          found.forEach(m => {
            const mLat = m.computed_geometry.coordinates[1];
            const mLng = m.computed_geometry.coordinates[0];
            const mDist = Math.hypot(mLat - lat, (mLng - lng) * Math.cos(lat * Math.PI / 180)) * 111000;
            ALL_PHOTOS.push({
              type: 'photo',
              source: 'Mapillary',
              title: `Street Photo (${m.captured_at ? new Date(m.captured_at).toISOString().slice(0, 10) : 'captured'})`,
              desc: 'Crowd-sourced ground imagery',
              imgUrl: m.thumb_1024_url,
              fallbackUrl: null,
              mapsUrl: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${mLat},${mLng}`,
              lat: mLat,
              lng: mLng,
              dist: mDist
            });
          });
          break;
        }
      } catch (e) {}
    }
  })();

  await Promise.allSettled([fetchRoad, fetchWiki, fetchMapillary]);

  // If geosearch yielded 0 photos, fallback to searching by landmark / place name
  if (!ALL_PHOTOS.length) {
    const placeText = ($('#place') ? $('#place').textContent : '').replace(/^[^\w]+/, '').trim();
    if (placeText && !placeText.includes('Drag the globe') && placeText.length > 2) {
      try {
        const sUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(placeText)}&gsrlimit=5&prop=coordinates|pageimages|description&piprop=thumbnail|original&pithumbsize=1200&format=json&origin=*`;
        const sResp = await fetch(sUrl);
        if (sResp.ok) {
          const sData = await sResp.json();
          const sPages = sData.query && sData.query.pages ? Object.values(sData.query.pages) : [];
          sPages.forEach(p => {
            if (!p.thumbnail && !p.original) return;
            const tSrc = p.thumbnail && p.thumbnail.source;
            const oSrc = p.original && p.original.source;
            ALL_PHOTOS.push({
              type: 'photo',
              source: 'Wikimedia',
              title: p.title,
              desc: p.description || '',
              imgUrl: tSrc || oSrc,
              fallbackUrl: oSrc && oSrc !== tSrc ? oSrc : null,
              mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.title)}`,
              lat: (p.coordinates && p.coordinates[0]) ? p.coordinates[0].lat : lat,
              lng: (p.coordinates && p.coordinates[0]) ? p.coordinates[0].lon : lng,
              dist: 0
            });
          });
        }
      } catch (e) {}
    }
  }

  // Sort photos so that the closest landmark/monument is ALWAYS photo #1
  ALL_PHOTOS.sort((a, b) => a.dist - b.dist);

  // If road is > 200m away, do NOT snap away! Use exact coordinate of monument/target
  if (!isRoadSnapped) {
    snapLat = lat;
    snapLng = lng;
  }

  // 360 panorama metadata pointing directly at the location
  const panoMeta = {
    snapLat, snapLng, roadDist, isRoadSnapped,
    embedUrl: `https://maps.google.com/maps?q=&layer=c&cbll=${snapLat.toFixed(6)},${snapLng.toFixed(6)}&cbp=11,0,0,0,0&output=svembed`,
    mapsUrl: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${snapLat.toFixed(6)},${snapLng.toFixed(6)}`
  };
  currentPanoMeta = panoMeta;

  // Check if completely remote/inaccessible with 0 photos and no road <= 200m
  if (!isRoadSnapped && !ALL_PHOTOS.length) {
    showNoStreetModal(lastNearestRoad);
    return;
  }

  // Initial mode selection:
  // If user clicked a place/initialMeta OR if photos exist and we are not right on a car road -> open photo mode!
  // If user clicked directly on a road (<= 200m) and no specific place was requested -> open 360 mode
  if (initialMeta && ALL_PHOTOS.length) {
    currentViewMode = 'photo';
  } else if (ALL_PHOTOS.length && (!isRoadSnapped || (roadDist && roadDist > 60))) {
    currentViewMode = 'photo';
  } else if (isRoadSnapped) {
    currentViewMode = '360';
  } else if (ALL_PHOTOS.length) {
    currentViewMode = 'photo';
  } else {
    currentViewMode = '360';
  }

  renderPhotoView(panoMeta);
}

function renderPhotoView(panoMeta) {
  if (panoMeta) currentPanoMeta = panoMeta;
  const pCount = ALL_PHOTOS.length;
  if ($('#st-pcount')) $('#st-pcount').textContent = pCount;

  if (currentViewMode === '360' && currentPanoMeta) {
    if ($('#stf')) {
      $('#stf').hidden = false;
      $('#stf').style.display = 'block';
      if ($('#stf').src !== currentPanoMeta.embedUrl) {
        $('#stf').src = currentPanoMeta.embedUrl;
      }
    }
    if ($('#st-img-wrap')) {
      $('#st-img-wrap').hidden = true;
      $('#st-img-wrap').style.display = 'none';
    }
    if ($('#stc')) $('#stc').hidden = true;
    if ($('#st-header')) $('#st-header').hidden = true;
    if ($('#stp')) $('#stp').hidden = true;
    if ($('#stn')) $('#stn').hidden = true;
    if ($('#stmode')) $('#stmode').classList.add('on');
    if ($('#stphotos')) $('#stphotos').classList.remove('on');

    if ($('#stcap')) {
      if (currentPanoMeta.isRoadSnapped && currentPanoMeta.roadDist !== null) {
        const dStr = currentPanoMeta.roadDist < 1000 ? `${Math.round(currentPanoMeta.roadDist)} m` : `${(currentPanoMeta.roadDist / 1000).toFixed(1)} km`;
        $('#stcap').textContent = `360° snapped to road (${dStr}) · ${currentPanoMeta.snapLat.toFixed(4)}°, ${currentPanoMeta.snapLng.toFixed(4)}°`;
      } else {
        $('#stcap').textContent = `360° Street View at ${currentPanoMeta.snapLat.toFixed(4)}°, ${currentPanoMeta.snapLng.toFixed(4)}°`;
      }
    }
    if ($('#sto')) $('#sto').onclick = () => window.open(currentPanoMeta.mapsUrl, '_blank');
    if ($('#stno')) $('#stno').onclick = () => showNoStreetModal(lastNearestRoad);
    $('#hear').textContent = '360° street view';
  } else if (pCount > 0) {
    currentViewMode = 'photo';
    if ($('#stf')) {
      $('#stf').hidden = true;
      $('#stf').style.display = 'none';
    }
    if ($('#stc')) $('#stc').hidden = true;
    if ($('#st-img-wrap')) {
      $('#st-img-wrap').hidden = false;
      $('#st-img-wrap').style.display = 'flex';
    }
    if ($('#stp')) $('#stp').hidden = pCount <= 1;
    if ($('#stn')) $('#stn').hidden = pCount <= 1;
    if ($('#stmode')) $('#stmode').classList.remove('on');
    if ($('#stphotos')) $('#stphotos').classList.add('on');

    showPhotoIndex(currentPhotoIdx);
  } else {
    currentViewMode = '360';
    if (currentPanoMeta) renderPhotoView(currentPanoMeta);
  }
}

function showPhotoIndex(idx) {
  if (!ALL_PHOTOS.length) return;
  currentPhotoIdx = (idx + ALL_PHOTOS.length) % ALL_PHOTOS.length;
  const p = ALL_PHOTOS[currentPhotoIdx];

  const img = $('#st-img');
  const loading = $('#st-img-loading');
  if (img) {
    img.style.display = 'block';
    if (loading) loading.hidden = false;
    img.style.opacity = '0';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      if (loading) loading.hidden = true;
      img.style.opacity = '1';
    };
    img.onerror = () => {
      if (p.fallbackUrl && img.src !== p.fallbackUrl) {
        img.src = p.fallbackUrl;
        return;
      }
      if (loading) loading.hidden = true;
      img.style.opacity = '1';
      if ($('#stcap')) $('#stcap').textContent = `Photo ${currentPhotoIdx + 1}/${ALL_PHOTOS.length} · ${p.title} (load preview failed, try ◀ ▶)`;
    };
    img.src = p.imgUrl;
    img.alt = p.title;
  }
  if ($('#st-header')) {
    $('#st-header').hidden = false;
    $('#st-place-name').textContent = p.title;
    $('#st-place-desc').textContent = p.desc || p.source;
  }
  if ($('#stcap')) {
    const dStr = p.dist != null ? (p.dist < 1000 ? `${Math.round(p.dist)}m away` : `${(p.dist / 1000).toFixed(1)}km away`) : '';
    $('#stcap').textContent = `Photo ${currentPhotoIdx + 1}/${ALL_PHOTOS.length} · ${p.title}${dStr ? ' · ' + dStr : ''}`;
  }
  if ($('#sto')) {
    $('#sto').onclick = () => window.open(p.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.title)}`, '_blank');
  }
  $('#hear').textContent = p.title;
}

function openStreet() {
  const c = map.getCenter();
  openPhotosForLocation(c.lat, c.lng);
}

$('#sv').onclick = openStreet;
if ($('#stmode')) $('#stmode').onclick = () => {
  currentViewMode = '360';
  renderPhotoView(currentPanoMeta);
};

if ($('#stphotos')) $('#stphotos').onclick = () => {
  if (ALL_PHOTOS.length) {
    currentViewMode = 'photo';
    renderPhotoView(currentPanoMeta);
  } else {
    if ($('#stcap')) $('#stcap').textContent = 'No photos collected yet for this spot.';
  }
};

if ($('#stp')) $('#stp').onclick = () => showPhotoIndex(currentPhotoIdx - 1);
if ($('#stn')) $('#stn').onclick = () => showPhotoIndex(currentPhotoIdx + 1);
if ($('#stx')) $('#stx').onclick = () => {
  $('#st').hidden = true;
  if ($('#stf')) $('#stf').src = 'about:blank';
  if ($('#st-header')) $('#st-header').hidden = true;
};

/* ---------- Google Photorealistic 3D Tiles for monuments (CesiumJS + Cesium ion) ---------- */
const loadCesium = () => window.Cesium ? Promise.resolve() : new Promise((ok, no) => {
  window.CESIUM_BASE_URL = 'https://cdn.jsdelivr.net/npm/cesium@1.120.0/Build/Cesium/'; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = CESIUM_BASE_URL + 'Widgets/widgets.css'; document.head.appendChild(l);
  const s = document.createElement('script'); s.src = CESIUM_BASE_URL + 'Cesium.js'; s.onload = ok; s.onerror = () => no(new Error('could not load CesiumJS')); document.head.appendChild(s);
});
async function openPx() {
  const T = key('ion'); if (!T) return openKeys('Photoreal 3D needs a free Cesium ion token, with Google Photorealistic 3D Tiles added to your ion assets.');
  $('#hear').textContent = 'loading photoreal 3D…';
  try {
    await loadCesium(); Cesium.Ion.defaultAccessToken = T; $('#px').hidden = false;
    if (!pxv) {
      pxv = new Cesium.Viewer('pxv', {
        globe: true,
        geocoder: false,
        baseLayerPicker: false,
        timeline: false,
        animation: false,
        infoBox: false,
        selectionIndicator: false,
        contextOptions: { webgl: { preserveDrawingBuffer: true } }
      });
      if (pxv.scene && pxv.scene.skyAtmosphere) pxv.scene.skyAtmosphere.show = true;
      try {
        const tileset = await Cesium.createGooglePhotorealistic3DTileset();
        pxv.scene.primitives.add(tileset);
      } catch (err) {
        console.warn('Cesium Google Photorealistic 3D Tiles notice:', err);
      }
    }
    const c = map.getCenter(), h = (map.queryTerrainElevation && map.queryTerrainElevation([c.lng, c.lat]) || 0) / 1.4;
    pxv.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(c.lng, c.lat - .0035, h + 320), orientation: { heading: 0, pitch: Cesium.Math.toRadians(-28) }, duration: 2 });
    $('#hear').textContent = 'photoreal 3D';
  } catch (e) { $('#px').hidden = true; $('#hear').textContent = 'Photoreal 3D: ' + (e.message || e); }
}
$('#p3').onclick = openPx; $('#pxc').onclick = () => { $('#px').hidden = true; };

/* ---------- time-lapse of NASA daily imagery, with sound ---------- */
let tlT = null;
const tlStop = () => { clearInterval(tlT); tlT = null; $('#tl').textContent = '▶ Time-lapse (30 days)'; };
$('#tl').onclick = () => {
  if (tlT) return tlStop(); const end = new Date($('#dt').max + 'T00:00:00Z'), d = new Date(end); d.setUTCDate(d.getUTCDate() - 30); $('#tl').textContent = '■ Stop time-lapse'; if (!listening) $('#listen').click();
  tlT = setInterval(() => { d.setUTCDate(d.getUTCDate() + 1); if (d > end) return tlStop(); $('#dt').value = d.toISOString().slice(0, 10); applyLayer(); }, 1500);
};

/* ---------- guided tour with narration ---------- */
let touring = false; const wait = ms => new Promise(r => setTimeout(r, ms));
const TOUR = [...PLACES.map(([n, la, lo, z]) => [n, la, lo, FACTS[n], z || 17.2]), ...LM.map(([n, la, lo, t]) => [n, la, lo, t, 17.6])];
const say = t => { $('#hear').textContent = t; if (window.speechSynthesis) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(t)); } };
$('#tour').onclick = async () => {
  if (touring) { touring = false; $('#tour').textContent = '🎬 Tour'; window.speechSynthesis && speechSynthesis.cancel(); return; }
  touring = true; $('#tour').textContent = '■ Stop tour'; if (!listening) $('#listen').click();
  for (const [n, la, lo, t, z] of TOUR) { if (!touring) break; scrollToZ(3); await wait(1800); if (!touring) break; pick(la, lo, 6); say(t); await wait(5000); if (!touring) break; scrollToZ(z); await wait(7000); }
  if (touring) { touring = false; $('#tour').textContent = '🎬 Tour'; }
};

/* ---------- labels toggle and shareable links ---------- */
let lblOn = true; $('#lb').classList.add('on');
$('#lb').onclick = () => { lblOn = !lblOn; $('#lb').classList.toggle('on', lblOn); LBL.forEach(id => { try { map.setLayoutProperty(id, 'visibility', lblOn ? 'visible' : 'none'); } catch (e) {} }); };
$('#sh').onclick = async () => {
  const c = map.getCenter(), u = location.href.split('#')[0] + `#${c.lat.toFixed(5)},${c.lng.toFixed(5)},${zs.toFixed(2)},${lyr()[0]},${$('#dt').value}`;
  try { await navigator.clipboard.writeText(u); $('#hear').textContent = 'link to this view copied'; } catch (e) { prompt('Copy this link', u); }
};
map.on('load', () => {
  const m = location.hash.slice(1).split(',');
  if (m.length >= 3 && !m.slice(0, 3).some(v => v === '' || isNaN(+v))) {
    const tz = clamp(+m[2], Z0, Z1);
    map.jumpTo({ center: [+m[1], +m[0]], zoom: tz });
    zs = tz; lastZ = tz;
    setTimeout(() => scrollToZ(tz, 'instant'), 150);
  }
  if (m[3]) {
    const targetLayer = m[3] === 'ESRI_World_Imagery' ? 'GOOGLE_SATELLITE' : m[3];
    const o = [...$('#lyr').options].find(o => o.value.startsWith(targetLayer + '|'));
    if (o) $('#lyr').value = o.value;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(m[4] || '')) $('#dt').value = m[4];
  applyLayer();
});
frame();

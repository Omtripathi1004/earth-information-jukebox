/**
 * Real Headless Chromium / Edge Browser Audio Test
 * Verifies real Web Audio API instantiation, gesture resumption,
 * AnalyserNode signal detection, Jukebox playback, and mode coordination.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8089;
const ROOT = path.join(__dirname, '..');

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT, reqPath);
  console.log(`[HTTP ${req.method}] ${req.url} -> ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.warn(`[HTTP 404] ${filePath}`);
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath);
  const mimes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  res.writeHead(200, { 'Content-Type': mimes[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
});

async function findChromeBinary() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('=== REAL CHROMIUM HEADLESS AUDIO VERIFICATION ===');
  await new Promise(r => server.listen(PORT, r));
  console.log(`✓ Local test server running on port ${PORT}`);

  const browserBin = await findChromeBinary();
  if (!browserBin) {
    console.log('⚠️ No Chrome or Edge binary found, skipping headless browser test.');
    server.close();
    process.exit(0);
  }
  console.log(`✓ Using browser binary: ${browserBin}`);

  const tempProfile = path.join(ROOT, '.tmp_chrome_profile');
  if (!fs.existsSync(tempProfile)) fs.mkdirSync(tempProfile, { recursive: true });

  const remotePort = 9226;
  const browserProc = spawn(browserBin, [
    '--headless=new',
    `--remote-debugging-port=${remotePort}`,
    `--user-data-dir=${tempProfile}`,
    '--disable-extensions',
    '--no-sandbox',
    '--disable-gpu',
    '--autoplay-policy=no-user-gesture-required',
    `http://127.0.0.1:${PORT}/`
  ]);

  let passed = 0;
  let failed = 0;
  function assert(cond, msg) {
    if (cond) {
      passed++;
      console.log(`  ✓ ${msg}`);
    } else {
      failed++;
      console.error(`  FAIL: ${msg}`);
    }
  }

  let wsUrl = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    await wait(300);
    try {
      const resp = await fetch(`http://127.0.0.1:${remotePort}/json`);
      const tabs = await resp.json();
      console.log('Discovered browser targets:', tabs.map(t => ({ type: t.type, url: t.url })));
      const pageTab = tabs.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pageTab) {
        wsUrl = pageTab.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.log('⚠️ Could not connect to Chromium DevTools Protocol (remote debugging blocked).');
    browserProc.kill();
    server.close();
    process.exit(0);
  }

  console.log(`✓ Connected to Chromium DevTools: ${wsUrl}`);

  const WS = global.WebSocket || require('ws');
  const ws = new WS(wsUrl);

  let msgId = 1;
  const pending = new Map();

  let currentContextId = null;
  const onMsg = (data) => {
    const raw = typeof data === 'string' ? data : (data.data ? data.data.toString() : data.toString());
    try {
      const msg = JSON.parse(raw);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg.result);
        pending.delete(msg.id);
      }
      if (msg.method === 'Runtime.executionContextCreated') {
        if (!msg.params.context.origin || msg.params.context.origin.startsWith('http://127.0.0.1')) {
          currentContextId = msg.params.context.id;
        }
        console.log('[CONTEXT CREATED]', msg.params.context.id, msg.params.context.origin, msg.params.context.name);
      }
      if (msg.method === 'Runtime.executionContextDestroyed') {
        console.log('[CONTEXT DESTROYED]', msg.params.executionContextId);
      }
      if (msg.method === 'Log.entryAdded') {
        console.log('[BROWSER LOG]', msg.params.entry.text, msg.params.entry.url);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.log('[BROWSER EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception ? msg.params.exceptionDetails.exception.description : '');
      }
    } catch (e) {}
  };

  if (ws.on) {
    ws.on('message', onMsg);
  } else {
    ws.addEventListener('message', onMsg);
  }

  await new Promise(r => {
    if (ws.readyState === 1) r();
    else if (ws.on) ws.on('open', r);
    else ws.addEventListener('open', r);
  });

  function cdp(method, params = {}) {
    const id = msgId++;
    return new Promise(resolve => {
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Log.enable');

  console.log('✓ Waiting for page and scripts to initialize...');
  for (let i = 0; i < 40; i++) {
    const ready = await evaluate(`typeof window.EarthAudio !== 'undefined' && typeof window.EICJukebox !== 'undefined'`);
    if (ready) {
      console.log(`✓ Page scripts ready (after ${(i * 250)} ms)`);
      break;
    }
    await wait(250);
  }

  async function evaluate(expr) {
    const params = {
      expression: expr,
      awaitPromise: true,
      returnByValue: true
    };
    const res = await cdp('Runtime.evaluate', params);
    if (res && res.result) {
      return res.result.value;
    }
    return null;
  }

  // 1. Verify EarthAudio loaded in real browser
  const hasEarthAudio = await evaluate(`typeof window.EarthAudio !== 'undefined'`);
  assert(hasEarthAudio === true, 'Real browser loaded window.EarthAudio singleton');

  // 2. Initial AudioContext state before explicit user gesture
  const initialStatus = await evaluate(`window.EarthAudio.status`);
  assert(initialStatus === 'uninitialized', `Initial audio status in browser is "uninitialized" (got "${initialStatus}")`);

  // 3. User gesture initialization & resumption
  const initResult = await evaluate(`(async () => {
    await window.EarthAudio.init();
    return {
      hasCtx: !!window.EarthAudio.ctx,
      state: window.EarthAudio.ctx.state,
      sampleRate: window.EarthAudio.ctx.sampleRate,
      status: window.EarthAudio.status
    };
  })()`);

  assert(initResult && initResult.hasCtx === true, 'AudioContext successfully created in real browser');
  assert(initResult && initResult.state === 'running', `AudioContext state is "running" (sampleRate: ${initResult ? initResult.sampleRate : 'N/A'} Hz)`);
  assert(initResult && initResult.status === 'running', 'Engine status transitioned to "running"');

  // 4. Test Tone Audio Output & AnalyserNode RMS Detection
  const toneResult = await evaluate(`(async () => {
    return await window.EarthAudio.playTestTone();
  })()`);
  assert(toneResult && toneResult.success === true, `Test tone executed with non-silent audio output (state: ${toneResult ? toneResult.state : 'N/A'})`);

  // 5. Open Jukebox and start playback
  const jbPlayResult = await evaluate(`(async () => {
    const jbBtn = document.getElementById('eic-btn');
    if (jbBtn) jbBtn.click();
    const playBtn = document.getElementById('eic-play');
    if (playBtn) playBtn.click();
    await new Promise(r => setTimeout(r, 600));
    const state = window.EICJukebox.UI.state;
    return {
      isPlaying: state ? state.isPlaying : false,
      dataset: state && state.dataset ? state.dataset.id : '',
      index: state ? state.currentIndex : 0,
      audioRunning: window.EarthAudio.ctx ? window.EarthAudio.ctx.state === 'running' : false,
      rms: window.EarthAudio.measureRMS()
    };
  })()`);

  assert(jbPlayResult && jbPlayResult.isPlaying === true, `Jukebox playback started on dataset "${jbPlayResult ? jbPlayResult.dataset : ''}"`);
  assert(jbPlayResult && jbPlayResult.audioRunning === true, 'AudioContext remains running during Jukebox playback');

  // 6. Test Mute Toggle
  const muteResult = await evaluate(`(() => {
    window.EarthAudio.setMuted(true);
    const mGain = window.EarthAudio.masterGain.gain.value;
    const isM = window.EarthAudio.isMuted;
    window.EarthAudio.setMuted(false);
    const unGain = window.EarthAudio.masterGain.gain.value;
    return { mGain, isM, unGain, masterVol: window.EarthAudio.masterVolume };
  })()`);
  console.log('muteResult debug:', muteResult);

  assert(muteResult && muteResult.mGain === 0, 'Mute suppresses master gain to 0');
  assert(muteResult && Math.abs(muteResult.unGain - 0.8) < 0.05, `Unmute restores master gain to ~0.8 (got ${muteResult ? muteResult.unGain : 'N/A'})`);

  // 7. Coordinate with Satellite Listen
  const listenCoord = await evaluate(`(async () => {
    const listenBtn = document.getElementById('listen');
    if (listenBtn) listenBtn.click();
    const jbState = window.EICJukebox.UI.state;
    return {
      jbPaused: jbState ? !jbState.isPlaying : true,
      listeningActive: listenBtn ? listenBtn.classList.contains('on') : false
    };
  })()`);

  assert(listenCoord && listenCoord.jbPaused === true, 'Activating Satellite Listen cleanly pauses Jukebox playback');

  // 8. Test Scientific Classification Badge & Source Portal Link
  const metaCheck = await evaluate(`(() => {
    const badge = document.getElementById('eic-classification-badge');
    const link = document.getElementById('eic-dataset-source-link');
    return {
      hasBadge: !!badge && badge.textContent.length > 5,
      badgeText: badge ? badge.textContent : '',
      hasLink: !!link && link.href.startsWith('http')
    };
  })()`);
  assert(metaCheck && metaCheck.hasBadge === true, `Scientific classification badge rendered: "${metaCheck ? metaCheck.badgeText : ''}"`);
  assert(metaCheck && metaCheck.hasLink === true, 'Official source portal link rendered with valid URL');

  // 9. Test Metric Comparison Tool & Dual Audio Harmony
  const compareCheck = await evaluate(`(async () => {
    const details = document.getElementById('eic-compare-details');
    if (details) details.open = true;
    window.EICJukebox.UI.renderCompare();
    const stats = document.getElementById('eic-compare-stats');
    const canvas = document.getElementById('eic-compare-canvas');
    return {
      hasStats: !!stats && stats.textContent.includes('correlation'),
      hasCanvas: !!canvas && canvas.width > 0
    };
  })()`);
  assert(compareCheck && compareCheck.hasStats === true, 'Metric comparison calculates correlation stats');
  assert(compareCheck && compareCheck.hasCanvas === true, 'Comparison dual-curve canvas rendered');

  // 10. Test Reviewer Walkthrough Trigger
  const tourCheck = await evaluate(`(async () => {
    const btn = document.getElementById('eic-start-walkthrough');
    if (btn) btn.click();
    await new Promise(r => setTimeout(r, 400));
    const active = window.EICJukebox.UI.isWalkthroughActive;
    window.EICJukebox.UI.stopWalkthrough();
    return { active };
  })()`);
  assert(tourCheck && tourCheck.active === true, 'Automated Scientific Reviewer Walkthrough starts successfully');

  // Clean shutdown
  try { ws.close(); } catch (e) {}
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', browserProc.pid.toString(), '/T', '/F']);
    } else {
      browserProc.kill();
    }
  } catch (e) {}
  try { server.close(); } catch (e) {}

  console.log(`\nReal Browser Audio Tests Completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

run().catch(err => {
  console.error('Browser test error:', err);
  try { server.close(); } catch (e) {}
  process.exit(1);
});

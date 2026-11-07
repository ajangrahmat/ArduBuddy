/* Step 1: flash the ArduBuddy firmware v1.0 onto the ESP32 with Web Serial.
 * Uses esptool-js (MIT) bundled with this page.
 * One big button does everything: connect, write, verify, disconnect.
 *
 * User-facing strings go through the global t() so the page is bilingual.
 */

import { ESPLoader } from './esptool.min.js';

const $ = (id) => document.getElementById(id);

let manifest = null;
let port = null;
let loader = null;
let firmware = null;
let busy = false;

/* remembered UI state, re-rendered when the language changes */
let _conn = { state: '', key: 'flash.conn.notconnected' };
let _prog = { value: 0, key: 'flash.progLabel', params: null };
let _fwInfo = { kind: 'loading' };

function log(message, kind = '') {
  const el = $('console');
  const line = document.createElement('div');
  if (kind) line.className = kind;
  line.textContent = String(message);
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function setProgress(value, key, params) {
  _prog = { value, key, params };
  renderProgress();
}

function renderProgress() {
  const clamped = Math.max(0, Math.min(100, Math.round(_prog.value)));
  $('progressBar').style.width = clamped + '%';
  $('progressLabel').textContent = t(_prog.key, _prog.params) || (clamped + '%');
}

function setConnection(state, key) {
  _conn = { state, key };
  renderConnection();
}

function renderConnection() {
  $('connDot').className = 'dot ' + (_conn.state || '');
  $('connLabel').textContent = t(_conn.key);
}

function setFwInfo(state) {
  _fwInfo = state;
  renderFwInfo();
}

function renderFwInfo() {
  const el = $('fwInfo');
  if (!el) return;
  if (_fwInfo.kind === 'ready') {
    el.textContent = t('flash.fwReady', { name: _fwInfo.name, version: _fwInfo.version });
  } else if (_fwInfo.kind === 'error') {
    el.textContent = t('flash.fwError', { msg: _fwInfo.msg });
  } else {
    el.textContent = t('flash.1.fwInfo');
  }
}

function refreshButtons() {
  $('btnFlash').disabled = busy || !firmware;
  $('btnConnect').disabled = busy || Boolean(loader);
  $('btnDisconnect').disabled = busy || !loader;
  $('fwSource').disabled = busy;
  $('fileInput').disabled = busy;
}

function activateStep(number) {
  const chips = document.querySelectorAll('.step-chip');
  chips.forEach((chip, index) => chip.classList.toggle('active', index === number - 1));
}

async function loadManifest() {
  const response = await fetch('firmware/manifest.json');
  if (!response.ok) throw new Error('Firmware manifest not found (HTTP ' + response.status + ').');
  manifest = await response.json();
  const build = (manifest.builds || []).find((b) => b.chipFamily === 'ESP32');
  if (!build || !build.parts || !build.parts.length) throw new Error('No ESP32 build in the manifest.');
  setFwInfo({
    kind: 'ready',
    name: manifest.name || 'ArduBuddy',
    version: manifest.version || '?',
  });
}

async function loadBundled() {
  if (!manifest) await loadManifest();
  const part = manifest.builds.find((b) => b.chipFamily === 'ESP32').parts[0];
  log('Loading included firmware: ' + part.path, 'dim');
  const response = await fetch('firmware/' + part.path);
  if (!response.ok) throw new Error('Firmware file not found (HTTP ' + response.status + ').');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 0x1002 || bytes[0x1000] !== 0xe9) {
    throw new Error('Firmware looks invalid: ESP32 magic byte missing at 0x1000.');
  }
  firmware = { name: part.path, bytes, offset: Number(part.offset) || 0 };
  $('offsetInput').value = String(firmware.offset);
  log('Firmware ready: ' + firmware.name + ' (' + (bytes.length / 1024).toFixed(1) + ' KB)', 'ok');
  refreshButtons();
}

async function readLocalFile(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!bytes.length) throw new Error('That file is empty.');
  firmware = { name: file.name, bytes, offset: Number($('offsetInput').value) || 0 };
  log('Selected: ' + file.name + ' (' + (bytes.length / 1024).toFixed(1) + ' KB)', 'ok');
  log('Make sure this is a merged image if you use offset 0.', 'warn');
  refreshButtons();
}

async function openPort() {
  if (!('serial' in navigator)) throw new Error('This browser has no Web Serial. Use Chrome or Edge.');
  if (!window.isSecureContext) throw new Error('Web Serial needs HTTPS or localhost.');
  port = await navigator.serial.requestPort();
  const terminal = {
    clean() {},
    write(data) { if (data && String(data).trim()) log(String(data).trim(), 'dim'); },
    writeLine(data) { if (data && String(data).trim()) log(String(data).trim(), 'dim'); },
  };
  loader = new ESPLoader({ port, baudrate: 115200, terminal, enableTracing: false });
  log('Connecting to the board…', 'dim');
  await loader.main();
  setConnection('on', 'flash.conn.connected');
  log('Connected.', 'ok');
  refreshButtons();
}

async function closePort() {
  try {
    if (loader && loader.transport) await loader.transport.disconnect();
    else if (port) await port.close();
  } catch (error) {
    log('While disconnecting: ' + error.message, 'warn');
  }
  loader = null;
  port = null;
  setConnection('', 'flash.conn.disconnected');
  refreshButtons();
}

async function writeFirmware() {
  const offset = Number($('offsetInput').value) || 0;
  log('Writing ' + firmware.name + ' at offset 0x' + offset.toString(16), 'dim');
  log('Please do not unplug the USB cable.', 'warn');
  await loader.writeFlash({
    fileArray: [{ address: offset, data: firmware.bytes }],
    flashMode: 'keep',
    flashFreq: 'keep',
    flashSize: 'keep',
    eraseAll: false,
    compress: true,
    calculateMD5Hash: false,
    reportProgress: (...args) => {
      const nums = args.filter((n) => typeof n === 'number');
      let pct = 0;
      if (nums.length >= 3) {
        const written = nums[nums.length - 2];
        const total = nums[nums.length - 1];
        pct = total ? (written / total) * 100 : 0;
      } else if (nums.length === 2) {
        pct = nums[1] ? (nums[0] / nums[1]) * 100 : 0;
      } else {
        const v = nums[0] || 0;
        pct = v <= 1 ? v * 100 : v;
      }
      setProgress(Math.min(98, 10 + Math.floor(pct * 0.85)), 'flash.prog.writing', { pct: Math.round(pct) });
    },
  });
  setProgress(97, 'flash.prog.restart');
  await loader.after('hard_reset');
}

async function runFlash() {
  if (busy || !firmware) return;
  busy = true;
  refreshButtons();
  setProgress(3, 'flash.prog.ready');
  try {
    if (!loader) await openPort();
    setConnection('busy', 'flash.conn.flashing');
    await writeFirmware();
    setProgress(100, 'flash.prog.done');
    log('Firmware installed. Press RESET (EN) on the board.', 'ok');
    await new Promise((resolve) => setTimeout(resolve, 900));
    await closePort();
    activateStep(2);
    setTimeout(() => $('step-wifi')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
  } catch (error) {
    setProgress(0, 'flash.prog.failed');
    log('Flash failed: ' + error.message, 'err');
    setConnection('', 'flash.conn.notconnected');
  } finally {
    busy = false;
    refreshButtons();
  }
}

/* Step 2 needs the USB port too. This lets wifi.js release it first. */
window.releaseFlasherPort = async () => {
  if (busy) throw new Error('Flashing is still running.');
  if (loader) await closePort();
};

$('fwSource').addEventListener('change', async (event) => {
  const local = event.target.value === 'local';
  $('fileField').style.display = local ? 'block' : 'none';
  if (local) {
    firmware = null;
    log('Custom file mode. Choose a .bin file to continue.', 'warn');
  } else {
    try { await loadBundled(); } catch (error) { log(error.message, 'err'); }
  }
  refreshButtons();
});

$('fileInput').addEventListener('change', (event) => {
  const file = event.target.files && event.target.files[0];
  if (file) readLocalFile(file).catch((error) => log(error.message, 'err'));
});

$('btnFlash').addEventListener('click', () => runFlash());
$('btnConnect').addEventListener('click', () => openPort().catch((error) => {
  log('Could not connect: ' + error.message, 'err');
  loader = null; port = null;
  setConnection('', 'flash.conn.notconnected');
  refreshButtons();
}));
$('btnDisconnect').addEventListener('click', () => closePort());

window.addEventListener('langchange', () => {
  renderProgress();
  renderConnection();
  renderFwInfo();
});

async function init() {
  log('ArduBuddy setup ready.', 'ok');
  if (!('serial' in navigator)) log('This browser has no Web Serial. Use Chrome or Edge.', 'err');
  else if (!window.isSecureContext) log('This page is not secure. Web Serial needs HTTPS or localhost.', 'warn');
  setFwInfo({ kind: 'loading' });
  try {
    await loadManifest();
    await loadBundled();
  } catch (error) {
    setFwInfo({ kind: 'error', msg: error.message });
    log(error.message, 'err');
    log('Open Advanced and choose your own .bin file.', 'warn');
  }
  refreshButtons();
}

init();

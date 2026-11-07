/* Step 2: join Wi-Fi and switch on the ESP32 local API.
 *
 * No AI key and no model run on the board. A WorkBuddy Desktop account is
 * still required to use the assistant. ArduBuddy firmware v1.0 supports:
 *   {"c":"ws","s":"SSID","p":"password"}  save Wi-Fi to NVS and connect
 *   {"c":"wst"}                          status: ok, ssid, connected, ip
 *   {"c":"start"}                        start the local API now (also auto-starts)
 *   {"c":"wr"} / {"c":"rst"}             forget Wi-Fi / restart
 */

const $ = (id) => document.getElementById(id);

let port = null;
let reader = null;
let writer = null;
let reading = false;
let buffer = '';
let decoder = new TextDecoder();
let pollTimer = null;
let pollCount = 0;
let startSent = false;
let busy = false;
let currentIp = null;

/* remembered status, re-rendered when the language changes */
let _status = { state: '', shortKey: 'wifi.status.waiting', longKey: null, longParams: null };

function wlog(message, kind = '') {
  const el = $('wifiConsole');
  const line = document.createElement('div');
  if (kind) line.className = kind;
  line.textContent = String(message);
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function setStatus(state, shortKey, longKey, longParams) {
  _status = { state, shortKey, longKey, longParams };
  renderStatus();
}

function renderStatus() {
  $('wifiDot').className = 'dot ' + (_status.state || '');
  $('wifiConnLabel').textContent = t(_status.shortKey);
  if (_status.longKey) {
    $('wifiStatusText').textContent = t(_status.longKey, _status.longParams);
  }
}

function setButtons() {
  $('wifiGoBtn').disabled = busy;
  $('wifiGoBtn').textContent = busy ? t('wifi.btn.working') : t('wifi.btn.connect');
  $('wifiDisconnectBtn').disabled = busy || !port;
  $('wifiStatusBtn').disabled = busy || !port;
  $('wifiRestartBtn').disabled = busy || !port;
  $('wifiResetBtn').disabled = busy || !port;
  ['saveConfigBtn', 'allOffBtn'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = busy || !port;
  });
  document.querySelectorAll('[data-test]').forEach((el) => {
    el.disabled = busy || !port;
  });
}

function activateStep(number) {
  document.querySelectorAll('.step-chip').forEach((chip, index) => {
    chip.classList.toggle('active', index === number - 1);
  });
}

function showIp(ip) {
  if (!ip) return;
  currentIp = ip;
  $('ipText').textContent = ip;
  $('ipLink').href = 'http://' + ip + '/api/status';
  $('ipBox').style.display = 'block';
  if ($('ipPlaceholder')) $('ipPlaceholder').style.display = 'none';
  if ($('ipPlaceholderArt')) $('ipPlaceholderArt').style.display = 'none';
  $('copyIpBtn').disabled = false;
  setStatus('on', 'wifi.status.ready', 'wifi.status.long.ready');
  refreshPrompt();
  activateStep(3);
  setTimeout(() => $('step-done')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  pollCount = 0;
}

function startPolling() {
  stopPolling();
  pollCount = 0;
  setStatus('busy', 'wifi.status.waiting', 'wifi.status.long.joining');
  pollTimer = setInterval(() => {
    pollCount += 1;
    send({ c: 'wst' }, false);
    if (pollCount >= 20) {
      stopPolling();
      setStatus('', 'wifi.status.notConnected', 'wifi.status.long.offline');
      wlog('Timed out waiting for Wi-Fi.', 'warn');
      busy = false;
      setButtons();
    }
  }, 3000);
}

function triggerStart() {
  if (startSent) return;
  startSent = true;
  stopPolling();
  setStatus('busy', 'wifi.status.switching', 'wifi.status.long.switching');
  send({ c: 'start' });
}

function handleLine(line) {
  wlog(line, 'dim');
  if (!line.startsWith('{')) return;
  try {
    const data = JSON.parse(line);
    if (data.ip) showIp(data.ip);
    if (data.connected === true) {
      wlog('Wi-Fi connected' + (data.ip ? ' — ' + data.ip : '') + '.', 'ok');
      triggerStart();
    }
    if (data.msg === 'wifi_saved_connecting') {
      wlog('Wi-Fi details saved on the board.', 'ok');
    }
    if (data.msg === 'started') {
      wlog('Local API is on. No AI key was used.', 'ok');
      setStatus('on', 'wifi.status.ready', 'wifi.status.long.ready');
      busy = false;
      setButtons();
    }
    if (data.msg === 'config_saved') {
      if (Array.isArray(data.pins)) {
        data.pins.forEach((pin, index) => {
          const el = document.getElementById('relay' + index + 'Pin');
          if (el) el.value = pin;
        });
      }
      const al = document.getElementById('activeLow');
      if (al && typeof data.active_low === 'boolean') al.checked = data.active_low;
      setConfigStatus(t('cfg.saved'));
      refreshPrompt();
    }
    if (typeof data.msg === 'string' && data.msg.startsWith('GPIO')) {
      setConfigStatus(data.msg);
    }
    if (data.ok === false) {
      wlog('Board replied: ' + (data.msg || 'no details'), 'err');
      setStatus('', 'wifi.status.wrong', 'wifi.status.long.wrong', { msg: data.msg || 'unknown error' });
      stopPolling();
      busy = false;
      setButtons();
    }
  } catch (_) {
    /* noisy firmware log lines are not JSON */
  }
}

async function readLoop() {
  while (reading && reader) {
    try {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let index;
      while ((index = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, index).replace(/\r$/, '').trim();
        buffer = buffer.slice(index + 1);
        if (line) handleLine(line);
      }
    } catch (error) {
      if (reading) wlog('Serial reading stopped: ' + error.message, 'warn');
      break;
    }
  }
}

async function openSerial() {
  if (!('serial' in navigator)) throw new Error('This browser has no Web Serial. Use Chrome or Edge.');
  if (!window.isSecureContext) throw new Error('Web Serial needs HTTPS or localhost.');
  if (typeof window.releaseFlasherPort === 'function') {
    try { await window.releaseFlasherPort(); } catch (error) { wlog(error.message, 'warn'); }
  }
  port = await navigator.serial.requestPort();
  await port.open({ baudRate: 115200, bufferSize: 4096 });
  reader = port.readable.getReader();
  writer = port.writable.getWriter();
  reading = true;
  buffer = '';
  decoder = new TextDecoder();
  readLoop();
  setStatus('on', 'wifi.status.usbConnected', 'wifi.status.long.usbConnected');
  wlog('USB serial connected. If the board is quiet, press RESET (EN).', 'ok');
  setButtons();
}

async function closeSerial() {
  stopPolling();
  reading = false;
  try { if (reader) { await reader.cancel(); reader.releaseLock(); } } catch (_) {}
  try { if (writer) { writer.releaseLock(); } } catch (_) {}
  try { if (port) await port.close(); } catch (_) {}
  reader = null; writer = null; port = null;
  setStatus('', 'wifi.status.usbDisconnected', 'wifi.status.long.usbDisconnected');
  wlog('USB serial disconnected.', 'warn');
  setButtons();
}

async function send(payload, echo = true) {
  if (!writer) {
    wlog('USB serial is not connected.', 'err');
    return false;
  }
  const line = JSON.stringify(payload);
  try {
    await writer.ready;
    await writer.write(new TextEncoder().encode(line + '\n'));
    if (echo) wlog('→ ' + line, 'warn');
    return true;
  } catch (error) {
    wlog('Could not send: ' + error.message, 'err');
    return false;
  }
}

async function runWifi() {
  if (busy) return;
  const ssid = $('wifiSsid').value.trim();
  const pass = $('wifiPass').value;
  if (!ssid) {
    setStatus('', 'wifi.status.nameMissing', 'wifi.status.long.nameMissing');
    return;
  }
  busy = true;
  startSent = false;
  setButtons();
  activateStep(2);
  try {
    if (!port) await openSerial();
    setStatus('busy', 'wifi.status.sending', 'wifi.status.long.sending');
    if (await send({ c: 'ws', s: ssid, p: pass })) startPolling();
  } catch (error) {
    wlog('Setup failed: ' + error.message, 'err');
    setStatus('', 'wifi.status.couldNot', 'wifi.status.long.couldNot', { msg: error.message });
    busy = false;
  }
  setButtons();
}

$('wifiGoBtn').addEventListener('click', () => runWifi());
$('wifiDisconnectBtn').addEventListener('click', () => closeSerial());
$('wifiStatusBtn').addEventListener('click', () => send({ c: 'wst' }));
$('wifiRestartBtn').addEventListener('click', () => send({ c: 'rst' }));
$('wifiResetBtn').addEventListener('click', () => {
  if (window.confirm(t('wifi.confirm.forget'))) send({ c: 'wr' });
});
$('copyIpBtn').addEventListener('click', async () => {
  if (!currentIp) return;
  try {
    await navigator.clipboard.writeText('http://' + currentIp);
    wlog('Copied: http://' + currentIp, 'ok');
    $('copyIpBtn').textContent = t('wifi.copy.copied');
    setTimeout(() => { $('copyIpBtn').textContent = t('wifi.copy.address'); }, 1800);
  } catch (_) {
    wlog('Copy failed. Select the address manually.', 'warn');
  }
});

function setConfigStatus(message) {
  const el = document.getElementById('configStatus');
  if (el) el.textContent = message || '';
}

function relayValues() {
  const names = [];
  const pins = [];
  for (let i = 0; i < 4; i++) {
    const nameEl = document.getElementById('relay' + i + 'Name');
    const pinEl = document.getElementById('relay' + i + 'Pin');
    names.push(nameEl && nameEl.value.trim() ? nameEl.value.trim() : 'relay' + (i + 1));
    pins.push(pinEl ? pinEl.value.trim() : '');
  }
  const al = document.getElementById('activeLow');
  return { names, pins, activeLow: Boolean(al && al.checked) };
}

function buildPrompt() {
  const ip = currentIp || '<IP-BOARD>';
  const { names, pins, activeLow } = relayValues();
  const lang = (document.documentElement.getAttribute('lang') || 'en')
    .toLowerCase().startsWith('id') ? 'id' : 'en';

  const rows = names.map((n, i) => ({ name: n, pin: pins[i] || '?' }));
  const isLamp = (n) => /lamp|light|indicator|led/i.test(n);
  const lamps = rows.filter((r) => isLamp(r.name));
  const lampTargets = lamps.length ? lamps : rows;

  const write = (list, on) => '[' + list.map((r) =>
    `{"tool":"gpio.write","args":{"pin":${r.pin},"value":${on}}}`).join(',') + ']';
  const reads = (list) => '[' + list.map((r) =>
    `{"tool":"gpio.read","args":{"pin":${r.pin}}}`).join(',') + ']';

  const table = rows.map((r) =>
    `| ${r.name} | ${r.pin} | true | false |`).join('\n');
  const lampNames = lampTargets.map((r) => r.name).join(', ');

  const ps = (body) => `Invoke-RestMethod -Method Post -Uri "http://${ip}/api/skill/chain" -ContentType "application/json" -Body '${body}'`;

  const L = lang === 'id' ? {
    intro: 'Kamu adalah operator ArduBuddy. Kontrol board ESP32 lewat HTTP langsung (tanpa MCP).',
    addr: 'Alamat board',
    mode: activeLow
      ? 'Mode relay: ACTIVE-LOW (relay menyala saat pin LOW). Firmware sudah menangani pembalikan ini.'
      : 'Mode relay: ACTIVE-HIGH (relay menyala saat pin HIGH). Firmware sudah menangani ini.',
    semTitle: '## Arti "value" - baca ini dulu',
    sem: [
      '- `"value": true`  = relay **NYALA** (ON)',
      '- `"value": false` = relay **MATI** (OFF)',
      '',
      '`value` adalah state logis, BUKAN level pin. Firmware yang mengubahnya ke HIGH/LOW.',
      'Jangan pernah membalik nilai ini karena mode active-low. `true` selalu = nyala.',
    ].join('\n'),
    mapTitle: '## Peta relay',
    mapHead: '| Nama | GPIO | Nyalakan | Matikan |',
    respTitle: '## Bentuk respons',
    resp: [
      '```json',
      '{"ok":true,"message":"GPIO 5 ON (pin LOW)","pin":5,"on":true,"level":"LOW","active_low":true}',
      '```',
      'Pakai field `on` (boolean) sebagai kebenaran. Field `level` hanya level pin fisik -',
      'jangan menafsirkan `level: "LOW"` sebagai mati.',
      'Untuk `/api/skill/chain`, tiap baris di `results[]` punya `success` dan `on`.',
    ].join('\n'),
    procTitle: '## Prosedur satu putaran (selesaikan tanpa bertanya)',
    proc: [
      '1. `GET /api/status` - kalau `connected` bukan `true`, berhenti dan laporkan.',
      '2. Tentukan pin target dari perintah user.',
      '3. Kirim SATU `/api/skill/chain` berisi semua pin target (jangan satu per satu).',
      '4. Kirim `/api/skill/chain` berisi `gpio.read` untuk pin yang sama, sebagai verifikasi.',
      '5. Laporkan tabel: nama, GPIO, status akhir (dari field `on`), lalu satu baris kesimpulan.',
    ].join('\n'),
    cmdTitle: '## Perintah siap pakai (PowerShell)',
    cmdStatus: '# status',
    cmdOff: '# semua OFF',
    cmdOn: '# semua ON',
    cmdRead: '# verifikasi',
    mapTitle2: '## Padanan perintah user',
    mapLines: [
      '- "nyalakan <nama>" -> `gpio.write` pin itu, `value: true`',
      '- "matikan <nama>" -> `gpio.write` pin itu, `value: false`',
      `- "matikan semua" / "semua off" -> semua ${rows.length} relay, \`value: false\``,
      `- "matikan semua lampu" -> relay yang namanya mengandung lamp/light/indicator: ${lampNames}`,
      '- "baca sensor" -> `{"tool":"adc.read","args":{"pin":34}}`',
    ].join('\n'),
    rulesTitle: '## Aturan',
    rules: [
      '1. Jangan membalik `value`. `true` = nyala, `false` = mati, apa pun mode relay-nya.',
      '2. Jangan mengubah perintah user menjadi kebalikannya berdasarkan teks "HIGH/LOW" di `message`.',
      '3. Jangan klaim berhasil kalau `ok` bukan `true` atau `on` tidak sesuai target.',
      '4. Sebutkan relay mana saja yang kamu ubah - jangan diam-diam ikut mematikan yang lain.',
      '5. Ini beban AC: jangan pernah menyarankan wiring saat listrik hidup.',
      '6. Semua lewat HTTP (curl/PowerShell). Tidak ada MCP, tidak ada connector.',
    ].join('\n'),
  } : {
    intro: 'You are the ArduBuddy operator. Control the ESP32 board directly over HTTP (no MCP).',
    addr: 'Board address',
    mode: activeLow
      ? 'Relay mode: ACTIVE-LOW (relay energises when the pin is LOW). The firmware handles this inversion.'
      : 'Relay mode: ACTIVE-HIGH (relay energises when the pin is HIGH). The firmware handles this.',
    semTitle: '## What "value" means - read this first',
    sem: [
      '- `"value": true`  = relay **ON**',
      '- `"value": false` = relay **OFF**',
      '',
      '`value` is the logical state, NOT the pin level. The firmware converts it to HIGH/LOW.',
      'Never invert it because of active-low mode. `true` always means ON.',
    ].join('\n'),
    mapTitle: '## Relay map',
    mapHead: '| Name | GPIO | Turn ON | Turn OFF |',
    respTitle: '## Response shape',
    resp: [
      '```json',
      '{"ok":true,"message":"GPIO 5 ON (pin LOW)","pin":5,"on":true,"level":"LOW","active_low":true}',
      '```',
      'Trust the `on` field (boolean). `level` is only the physical pin level -',
      'do not read `level: "LOW"` as off.',
      'For `/api/skill/chain`, each row in `results[]` has `success` and `on`.',
    ].join('\n'),
    procTitle: '## One-pass procedure (finish without asking)',
    proc: [
      '1. `GET /api/status` - if `connected` is not `true`, stop and report.',
      '2. Resolve the target pins from the user request.',
      '3. Send ONE `/api/skill/chain` covering every target pin (not one request each).',
      '4. Send `/api/skill/chain` of `gpio.read` for the same pins to verify.',
      '5. Report a table: name, GPIO, final state (from the `on` field), then one summary line.',
    ].join('\n'),
    cmdTitle: '## Ready-to-run commands (PowerShell)',
    cmdStatus: '# status',
    cmdOff: '# all OFF',
    cmdOn: '# all ON',
    cmdRead: '# verify',
    mapTitle2: '## Intent mapping',
    mapLines: [
      '- "turn on <name>" -> `gpio.write` that pin, `value: true`',
      '- "turn off <name>" -> `gpio.write` that pin, `value: false`',
      `- "turn everything off" -> all ${rows.length} relays, \`value: false\``,
      `- "turn off all lights" -> relays named lamp/light/indicator: ${lampNames}`,
      '- "read the sensor" -> `{"tool":"adc.read","args":{"pin":34}}`',
    ].join('\n'),
    rulesTitle: '## Rules',
    rules: [
      '1. Never invert `value`. `true` = ON, `false` = OFF, regardless of relay mode.',
      '2. Never flip a user command because of the "HIGH/LOW" text inside `message`.',
      '3. Do not claim success unless `ok` is `true` and `on` matches the target.',
      '4. Name the relays you changed - do not silently switch others.',
      '5. These are AC loads: never suggest wiring while the power is on.',
      '6. HTTP only (curl/PowerShell). No MCP, no connector.',
    ].join('\n'),
  };

  return [
    L.intro,
    '',
    `${L.addr}: http://${ip}`,
    L.mode,
    '',
    L.semTitle,
    L.sem,
    '',
    L.mapTitle,
    L.mapHead,
    '|---|---|---|---|',
    table,
    '',
    L.respTitle,
    L.resp,
    '',
    L.procTitle,
    L.proc,
    '',
    L.cmdTitle,
    '```powershell',
    `${L.cmdStatus}\nInvoke-RestMethod -Uri "http://${ip}/api/status"`,
    '',
    `${L.cmdOff}\n${ps(write(rows, false))}`,
    '',
    `${L.cmdOn}\n${ps(write(rows, true))}`,
    '',
    `${L.cmdRead}\n${ps(reads(rows))}`,
    '```',
    '',
    L.mapTitle2,
    L.mapLines,
    '',
    L.rulesTitle,
    L.rules,
  ].join('\n');
}

function refreshPrompt() {
  const box = document.getElementById('promptBox');
  if (!box) return;
  box.value = buildPrompt();
  // A prompt without the real board address would fail on the first call.
  const hasIp = Boolean(currentIp);
  const warn = document.getElementById('promptWarn');
  const btn = document.getElementById('copyPromptBtn');
  if (warn) warn.style.display = hasIp ? 'none' : 'block';
  if (btn) btn.disabled = !hasIp;
}

async function saveRelayConfig() {
  if (!port) { setConfigStatus(t('cfg.needSerial')); return; }
  const { pins } = relayValues();
  const nums = pins.map((value) => Number(value));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 39)) {
    setConfigStatus(t('cfg.saveFail', { msg: 'GPIO 0-39' }));
    return;
  }
  const al = document.getElementById('activeLow');
  setConfigStatus('…');
  await send({ c: 'cfg', pins: nums, active_low: Boolean(al && al.checked) });
}

async function allOffRelays() {
  if (!port) { setConfigStatus(t('cfg.needSerial')); return; }
  const { pins } = relayValues();
  for (const pin of pins) {
    await send({ c: 'gpio', pin: Number(pin), value: false });
  }
}

document.getElementById('saveConfigBtn')?.addEventListener('click', saveRelayConfig);
document.getElementById('allOffBtn')?.addEventListener('click', allOffRelays);
document.getElementById('copyPromptBtn')?.addEventListener('click', async () => {
  const box = document.getElementById('promptBox');
  const btn = document.getElementById('copyPromptBtn');
  if (!box) return;
  try {
    await navigator.clipboard.writeText(box.value);
    if (btn) {
      const old = btn.textContent;
      btn.textContent = t('prompt.copied');
      setTimeout(() => { btn.textContent = old; }, 1600);
    }
  } catch (_) {
    box.select();
  }
});
document.querySelectorAll('[data-test]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    if (!port) { setConfigStatus(t('cfg.needSerial')); return; }
    const index = Number(btn.getAttribute('data-test'));
    const pin = Number(document.getElementById('relay' + index + 'Pin').value);
    const value = btn.getAttribute('data-value') === '1';
    await send({ c: 'gpio', pin, value });
    setTimeout(() => send({ c: 'gpio?', pin }, false), 250);
  });
});
for (let i = 0; i < 4; i++) {
  const nameEl = document.getElementById('relay' + i + 'Name');
  const pinEl = document.getElementById('relay' + i + 'Pin');
  if (nameEl) nameEl.addEventListener('input', refreshPrompt);
  if (pinEl) pinEl.addEventListener('input', refreshPrompt);
}
document.getElementById('activeLow')?.addEventListener('change', refreshPrompt);
refreshPrompt();

window.addEventListener('langchange', () => {
  renderStatus();
  setButtons();
  refreshPrompt();
});

wlog('Ready. Flash the board first, press RESET (EN), then click "Connect my ESP32".', 'ok');
setStatus('', 'wifi.status.notConnected', 'flash.2.statusText');
setButtons();

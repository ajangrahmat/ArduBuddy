/* ArduBuddy — bilingual engine (English / Indonesian).
 * Plain classic script so `t()` is a global usable by the module scripts.
 * Translations live in the I18N map below; the DOM is tagged with:
 *   data-i18n       -> textContent (no inline tags)
 *   data-i18n-html  -> innerHTML (may contain links/code)
 *   data-i18n-attr  -> "attr:key,attr:key" sets element attributes (title, placeholder, aria-label, ...)
 */
(function () {
  "use strict";

  const STORAGE_KEY = "ardubuddy_lang";

  const I18N = {
    en: {
      /* header / nav */
      "nav.how": "How it works",
      "nav.why": "Why we built it",
      "nav.workbuddy": "WorkBuddy",
      "nav.setup": "Get started",
      "nav.needs": "What you need",
      "nav.status": "Status",
      "nav.home": "Home",
      "nav.back": "Back to home",
      "nav.flash": "Flash",
      "nav.wifi": "Wi-Fi",
      "nav.before": "Before you start",
      "nav.downloads": "Downloads",
      "nav.whatwb": "What is WorkBuddy?",
      "nav.source": "Firmware source",
      "nav.github": "GitHub",
      "nav.createAccount": "Create account",
      "header.openSetup": "Open setup",
      "lang.label": "Language",

      /* hero */
      "hero.badge": "Tencent Cloud AI CAN DO IT Hackathon 2026 · Challenge B",
      "hero.h1": 'Type a sentence. <span class="hl">Real things happen.</span>',
      "hero.lead": "Ask WorkBuddy to set up the room. An ESP32 with a 4-channel relay shield switches real AC lamps and reads real sensors. No app, no code, no AI key on the board.",
      "hero.btn_setup": "Set up my board",
      "hero.btn_download": "Get the prompt",
      "hero.meta": 'About 5 minutes, depending on your connection and installation. You need an ESP32, a USB cable, Chrome or Edge, and <a href="https://workbuddy.ai/invite?code=PHSPUBC8" target="_blank" rel="noopener">WorkBuddy Desktop</a>.',

      /* why / compare */
      "why.badge": "The idea in one glance",
      "why.h2": "What does ArduBuddy add?",
      "why.lead": "WorkBuddy on its own, and WorkBuddy with ArduBuddy.",
      "compare.wb.title": "WorkBuddy",
      "compare.wb.lead": "Digital office work.",
      "compare.wb.li1": "Reports, slides and documents",
      "compare.wb.li2": "Spreadsheets and data",
      "compare.wb.li3": "Local files",
      "compare.wb.tag": "Documents done. Room unchanged.",
      "compare.add.title": "WorkBuddy + ArduBuddy",
      "compare.add.lead": "Digital work <b>plus the room itself.</b>",
      "compare.add.li1": "Everything WorkBuddy already does",
      "compare.add.li2": "Up to 4 AC lamps through a relay shield",
      "compare.add.li3": "Same sentence, no second app",
      "compare.add.tag": "One assistant. Documents and devices.",
      "why.note": "Hardware:",
      "why.note2": "the demo uses an ESP32 with a 4-channel relay shield to switch up to four AC lamps. Mains wiring is dangerous — follow the safety notes below.",

      /* workbuddy section */
      "wb.badge": "The AI behind this project",
      "wb.h2": "Meet WorkBuddy",
      "wb.lead": 'WorkBuddy is <b>Tencent\'s AI agent for everyday office work</b> — a desktop workspace, not just a chat window. One sentence, and it plans and does the task for you.',
      "wb.note-strong": "Good to know:",
      "wb.note": 'WorkBuddy is a <b>desktop app you install</b> — the web version cannot run the desktop agent. See the <a href="#start">3-step setup below</a> for the account, installer, and +350 free credits. No separate AI API key needed.',
      "wb.li1": "<b>Understands plain language.</b> One sentence is enough.",
      "wb.li2": "<b>Plans and executes.</b> It breaks a task into steps and does them.",
      "wb.li3": "<b>Works on real files.</b> Documents, sheets, slides, data, local folders.",
      "wb.li4": "<b>Extensible through connectors.</b> WorkBuddy can connect to other tools when needed.",
      "wb.callout.h3": "What this project adds",
      "wb.callout.p": "WorkBuddy normally stops at digital work. ArduBuddy adds the physical side: up to four AC lamps, a fan, and sensors join the same conversation. WorkBuddy calls the board's HTTP API directly — no MCP.",
      "wb.btn_account": "Create your WorkBuddy account",
      "wb.btn_site": "Official site",
      "wb.btn_docs": "Read the docs",

      /* three quick things (start) */
      "start.badge": "Before you start",
      "start.h2": "Three quick things on your computer",
      "start.lead": "WorkBuddy is a <b>desktop app</b>. The browser version cannot run the desktop agent, so the desktop client is required.",
      "start.1.title": "Create an account",
      "start.1.p": 'Sign up with this <a href="https://workbuddy.ai/invite?code=PHSPUBC8" target="_blank" rel="noopener">invitation link</a> and get <b>+350 free credits</b>. A free model is also available.',
      "start.2.title": "Install WorkBuddy Desktop",
      "start.2.p": 'Download the installer from the <a href="https://www.workbuddy.ai/" target="_blank" rel="noopener">official site</a> (Windows x64 / macOS .dmg). Run it. <b>The web version will not work.</b>',
      "start.3.title": "Sign in",
      "start.3.p": "Open the desktop app, click <b>Log in</b>, and use your new account. The browser only opens login, then sends you back to the app.",
      "start.callout.h3": "The whole setup in one line",
      "start.formula": "WorkBuddy → HTTP → ESP32",
      "start.callout.p": "No AI model or API key runs on the board. WorkBuddy thinks and calls the ESP32 HTTP API directly — no connector, no MCP.",

      /* how (3 steps) */
      "how.h2": "Three steps. That's it.",
      "how.lead": "Everything starts in your browser. You only need one board and one prompt.",
      "how.1.title": "Flash the board",
      "how.1.p": 'Plug the ESP32 into your computer. Open the <a href="flash.html">setup page</a> and click one button.',
      "how.2.title": "Join your Wi-Fi",
      "how.2.p": "Type your Wi-Fi name and password on the same page. We show the board's address when ready.",
      "how.3.title": "Paste the prompt into WorkBuddy",
      "how.3.p": 'Open the <a href="flash.html#step-done">setup page</a>, copy the ready-made prompt, and paste it into WorkBuddy Desktop.',

      /* who does what */
      "who.h2": "Who does what",
      "who.lead": "The thinking happens in WorkBuddy. The board only follows safe, checked commands.",
      "who.callout.h3": "No AI runs on the board",
      "who.callout.p": "A WorkBuddy account is required, but you need no separate AI API key, model, or subscription. WorkBuddy reasons and sends one checked HTTP command to the ESP32. That's the whole chain.",
      "who.you": "You",
      "who.you.s": "Type a sentence",
      "who.wb": "WorkBuddy",
      "who.wb.s": "Understands it",
      "who.conn": "HTTP API",
      "who.conn.s": "Receives the command",
      "who.esp": "ESP32",
      "who.esp.s": "Switches the relay",
      "who.lights": "Lights",
      "who.lights.s": "Turn on for real",

      /* needs */
      "needs.h2": "What you need",
      "needs.lead": "Flashing runs in the browser with Chrome or Edge. No connector is needed for the HTTP prompt flow.",
      "needs.hw.title": "Hardware",
      "needs.hw.li1": "An ESP32 Dev / WROOM board with a 4-channel relay shield",
      "needs.hw.li2": "A USB cable that carries data (not charge-only)",
      "needs.hw.li3": "Up to 4 AC lamps or loads, within the relay rating — <b>mains voltage, handle with care</b>",
      "needs.hw.li4": "A 2.4 GHz Wi-Fi network (no 5 GHz)",
      "needs.hw.li5": "A certified relay module in an enclosure with a fuse, wired by a competent electrician",
      "needs.sw.title": "Software",
      "needs.sw.li1": "Chrome or Edge on HTTPS (Web Serial)",
      "needs.sw.li2": "No connector needed for the HTTP prompt flow",
      "needs.sw.li3": 'WorkBuddy Desktop installed and signed in — the web version cannot run the desktop agent (<a href="#start">steps</a>)',
      "needs.sw.li4": 'A <a href="https://workbuddy.ai/invite?code=PHSPUBC8" target="_blank" rel="noopener">WorkBuddy account</a>; the invite link gives <b>+350 free credits</b>',
      "needs.sw.li5": "Nothing else — no Python, no Arduino IDE, no drivers",

      /* status */
      "status.h2": "What works today, honestly",
      "status.lead": "This is a hackathon prototype. Here is exactly where it stands.",
      "status.th1": "Part",
      "status.th2": "Status",
      "status.th3": "Notes",
      "status.r1n": "HTTP API",
      "status.r1tag": "Working",
      "status.r1note": "4 endpoints: status, execute, chain, skills",
      "status.r2n": "ESP32 commands",
      "status.r2tag": "Verified",
      "status.r2note": "Verified against the shipped firmware source",
      "status.r3n": "Browser flashing",
      "status.r3tag": "Working",
      "status.r3note": "Firmware v1.0 is bundled with this site",
      "status.r4n": "Connector .exe (optional)",
      "status.r4tag": "Optional",
      "status.r4note": "Only for the MCP flow; the HTTP prompt flow does not need it",
      "status.r5n": "Temperature sensor",
      "status.r5tag": "Not available",
      "status.r5note": "v1.0 only has an ADC sensor, so we report volts — never invented numbers",
      "status.r6n": "Device login",
      "status.r6tag": "Not available",
      "status.r6note": "v1.0 has no password on its local API. Use only on a trusted network",
      "status.r7n": "4-channel AC control",
      "status.r7tag": "Supported",
      "status.r7note": "ESP32 + 4-channel relay shield switches up to four AC lamps",
      "status.note-strong": "Mains safety:",
      "status.note": "switch off the power before wiring. Use a certified relay module inside an enclosure with a fuse, keep the low-voltage side isolated, and have a licensed electrician check the mains side. Never touch live wiring. Avoid GPIO 0, 2, 5, 12, 15.",
      "status.adv.summary": "Device API summary",
      "status.adv.th1": "Endpoint",
      "status.adv.th2": "Purpose",
      "status.adv.p1": "Board status, IP address, and active mode",
      "status.adv.p2": 'Run one command, e.g. write a GPIO: <code>{"tool":"gpio.write","args":{"pin":4,"value":true}}</code>',
      "status.adv.p3": "Run several commands in one request",
      "status.adv.p4": "List the supported skills/commands",
      "status.adv.note": 'Full schema for each endpoint lives in the <a href="firmware/source/main.cpp" target="_blank" rel="noopener">firmware source</a> (MIT).',

      /* downloads */
      "dl.h2": "Downloads and file check",
      "dl.lead": "Two files, both bundled with this site. No separate download server.",
      "dl.exe.title": "ArduBuddy.exe (optional)",
      "dl.exe.p": 'Optional MCP connector for Windows. The HTTP prompt flow does not need it.<br/>SHA-256: <code style="word-break:break-all;font-size:12px">63186ad64528cdff8cdb8a1b2aa1a58b225fa5152348ddd584b6a9b095cbf120</code>',
      "dl.btnExe": "Download optional connector",
      "dl.fw.title": "ArduBuddy firmware v1.0",
      "dl.fw.p": "Merged ESP32 image, 1,182,624 bytes, written at offset 0. This is the file the browser flasher uses.",
      "dl.btnBin": "Download .bin",
      "dl.btnManifest": "Manifest",
      "dl.note-strong": "Windows may warn:",
      "dl.note": 'the optional connector is not code-signed, so SmartScreen can say "Unknown publisher". Check the SHA-256 above, then choose <b>More info → Run anyway</b>.',
      "dl.hint": 'Brand assets: <a href="assets/ardubuddy-logo.svg">logo SVG</a> · <a href="assets/ardubuddy-logo-light.svg">logo for dark backgrounds</a> · <a href="assets/ardubuddy-icon.svg">icon SVG</a> · <a href="assets/ardubuddy-icon-512.png">icon PNG 512</a> · <a href="favicon.ico">favicon ICO</a>',

      /* ready */
      "ready.h2": "Ready to try?",
      "ready.lead": "Flash first, then connect to Wi-Fi. That order makes problems easy to spot.",
      "ready.btn1": "Open the 3-step setup",
      "ready.btn2": "Firmware source",

      /* footer */
      "footer.copy": "ArduBuddy · hackathon prototype by Ajang Rahmat / ArduMeka · MIT",

      /* ---- setup wizard (flash.html) ---- */
      "flash.badge": "Estimated 5 minutes · Chrome or Edge · HTTPS required",
      "flash.h1": "Let's get your board online",
      "flash.lead": "Keep this page open and your ESP32 plugged in with a USB data cable. We will do the rest, one step at a time.",
      "step.1": "Flash the board",
      "step.2": "Connect to Wi-Fi",
      "step.3": "Set relays & prompt",
      "flash.1.h3": "Flash the board",
      "flash.1.hint": "One click installs the ArduBuddy firmware v1.0 on your ESP32. The firmware is already included on this page.",
      "flash.1.fwInfo": "Loading firmware information…",
      "flash.btnFlash": "Flash my board",
      "flash.progLabel": "Not started yet",
      "flash.connLabel": "Board not connected",
      "flash.1.note": 'When it finishes: press the <b>RESET (EN)</b> button on the board, wait two seconds, then go to step 2. Don\'t unplug the cable.',
      "flash.adv1.summary": "Advanced: use my own firmware file or see the log",
      "flash.adv1.fwSourceLabel": "Firmware source",
      "flash.adv1.optBundled": "Included firmware — ArduBuddy v1.0 (recommended)",
      "flash.adv1.optLocal": "A .bin file from my computer",
      "flash.adv1.fileLabel": "Choose a merged .bin image",
      "flash.adv1.offsetLabel": "Flash offset",
      "flash.adv1.btnConnect": "Connect serial only",
      "flash.adv1.btnDisconnect": "Disconnect",
      "flash.2.h3": "Connect to Wi-Fi",
      "flash.2.hint": "Type your Wi-Fi name and password. They go straight to the board through the USB cable — this page never uploads or saves them.",
      "flash.2.ssidLabel": "Wi-Fi name (SSID)",
      "flash.2.ssidPh": "e.g. Office-WiFi",
      "flash.2.passLabel": "Wi-Fi password",
      "flash.2.passPh": "Your password",
      "flash.2.btnGo": "Connect my ESP32",
      "flash.2.btnDisconnect": "Disconnect USB",
      "flash.2.statusText": "We will connect the USB serial port, send your Wi-Fi details, then switch on device control.",
      "flash.2.note": "Use 2.4 GHz Wi-Fi. ESP32 cannot join 5 GHz. If nothing happens, press RESET and try again. A CP210x or CH340 USB driver may be needed.",
      "flash.adv2.summary": "Advanced: fix connection problems and see the log",
      "flash.adv2.btnStatus": "Check status",
      "flash.adv2.btnRestart": "Restart board",
      "flash.adv2.btnForget": "Forget Wi-Fi",
      "flash.adv3.summary": "Advanced: the commands we send (no AI key involved)",
      "flash.adv3.tr1": "Save Wi-Fi",
      "flash.adv3.tr2": "Check status",
      "flash.adv3.tr3": "Switch on the local API",
      "flash.adv3.tr4": "Forget Wi-Fi",
      "flash.adv3.tr5": "Restart",
      "flash.adv3.p": 'The ArduBuddy firmware v1.0 receives JSON commands over USB serial and HTTP. No AI model or API key runs on the board. You still need a WorkBuddy account.',
      "flash.3.h3": "Set relays & prompt",
      "flash.3.hint": "This is the address of your ESP32 on your network. Paste it into the connector.",
      "flash.3.placeholder": "Finish step 2 and the address will appear here.",
      "flash.3.ipLabel": "Your board's address",
      "flash.3.copyBtn": "Copy address",
      "flash.3.openBtn": "API status",
      "flash.3.ol1": "<b>Install WorkBuddy Desktop and sign in</b> with your account. The web version cannot run MCP connectors — the desktop app is required.",
      "flash.3.ol2": 'Run <code>ArduBuddy.exe</code> (download it from the home page).',
      "flash.3.ol3": 'Paste the address into "ESP32 address", switch <b>Mock mode off</b>, then click "Save &amp; register".',
      "flash.3.ol4": 'Restart WorkBuddy, open Connectors → Custom Connector, and click <b>Trust</b> on <code>ardubuddy</code>.',
      "flash.3.ol5": 'Try it: "Set up the meeting room." or "Turn off the meeting room light."',
      "flash.3.callout.h3": "Why no AI key?",
      "flash.3.callout.p": 'WorkBuddy does all the thinking. The connector sends one checked command straight to the ESP32, and the board replies with what actually happened. Nothing on the board needs an AI model. You do need a <a href="https://workbuddy.ai/invite?code=PHSPUBC8" target="_blank" rel="noopener">WorkBuddy account</a>, but no separate AI API key or subscription.',
      "flash.adv4.summary": "What is WorkBuddy?",
      "flash.adv4.p1": "WorkBuddy is Tencent's <b>AI agent for everyday office work</b> — a desktop workspace that plans and executes tasks from a single sentence, then gives you a result you can review. It normally works on documents, spreadsheets, slides and local files.",
      "flash.adv4.p2": 'This project adds a custom connector so the same sentence can reach an ESP32 board. You need the <b>WorkBuddy Desktop app</b> (not the web version) and an account — sign up via this <a href="https://workbuddy.ai/invite?code=PHSPUBC8" target="_blank" rel="noopener">invitation link</a> for <b>+350 free credits</b>; a free model is also available. See <a href="index.html#start">before you start</a> or the <a href="https://www.workbuddy.ai/" target="_blank" rel="noopener">official site</a>.',
      "cfg.hint": "Name the 4 relay channels and choose their GPIO pins. Settings are saved to the board over the USB cable.",
      "cfg.name": "Name",
      "cfg.pin": "GPIO",
      "cfg.activeLow": "Active-low relay (on when GPIO is LOW)",
      "cfg.save": "Save to board",
      "cfg.saved": "Settings saved to the board.",
      "cfg.saveFail": "Could not save: {msg}",
      "cfg.needSerial": "Connect the USB cable first (step 2).",
      "cfg.allOff": "All OFF",
      "cfg.test": "Test",
      "prompt.h3": "WorkBuddy prompt",
      "prompt.hint": "Copy this prompt into WorkBuddy. It contains the board address, relay map, API examples, and safety rules.",
      "prompt.copy": "Copy prompt",
      "prompt.copied": "Copied",
      "prompt.needIp": "Finish step 2 first so the board address appears.",
      "flash.3.note": 'After a restart: firmware v1.0 starts its local API automatically once Wi-Fi is connected. Wait a few seconds and the address appears again — no extra command needed.',
      "flash.footer.copy": "ArduBuddy · uses esptool-js (MIT) for browser flashing",
      "flash.footer.manifest": "Firmware manifest",
      "flash.footer.docs": "Firmware docs",

      /* wizard runtime status (also used by flasher.js / wifi.js) */
      "flash.conn.connected": "Board connected",
      "flash.conn.disconnected": "Board disconnected",
      "flash.conn.notconnected": "Board not connected",
      "flash.conn.flashing": "Flashing — please wait",
      "flash.prog.ready": "Getting ready",
      "flash.prog.writing": "Writing firmware {pct}%",
      "flash.prog.restart": "Restarting the board",
      "flash.prog.done": "Done",
      "flash.prog.failed": "Failed — try again",
      "flash.fwReady": "Ready: {name} v{version} — nothing else to download.",
      "flash.fwError": "Included firmware is unavailable: {msg}",
      "wifi.status.usbConnected": "USB connected",
      "wifi.status.long.usbConnected": "Serial link is open at 115200 baud.",
      "wifi.confirm.forget": "Forget the saved Wi-Fi details on this board?",
      "wifi.status.waiting": "Waiting for Wi-Fi…",
      "wifi.status.long.joining": "Your board is joining the network. This usually takes a few seconds.",
      "wifi.status.notConnected": "Not connected",
      "wifi.status.long.offline": "Still offline. Check the name and password, use 2.4 GHz Wi-Fi, then press RESET and try again.",
      "wifi.status.switching": "Switching on device control…",
      "wifi.status.long.switching": "Wi-Fi is connected. One more command and the board is ready.",
      "wifi.status.ready": "Your board is ready",
      "wifi.status.long.ready": "Copy the address below and paste it into ArduBuddy.exe.",
      "wifi.status.wrong": "Something went wrong",
      "wifi.status.long.wrong": "The board said: {msg}. Check the log below.",
      "wifi.status.nameMissing": "Wi-Fi name missing",
      "wifi.status.long.nameMissing": "Please type your Wi-Fi name (SSID) first.",
      "wifi.status.sending": "Sending Wi-Fi details…",
      "wifi.status.long.sending": "Your password travels only over the USB cable.",
      "wifi.status.couldNot": "Could not connect",
      "wifi.status.long.couldNot": "{msg} Close any serial monitor, then try again.",
      "wifi.status.usbDisconnected": "USB disconnected",
      "wifi.status.long.usbDisconnected": "Reconnect before using the buttons below.",
      "wifi.btn.working": "Working…",
      "wifi.btn.connect": "Connect my ESP32",
      "wifi.copy.copied": "Copied",
      "wifi.copy.address": "Copy address"
    },

    id: {
      /* header / nav */
      "nav.how": "Cara kerja",
      "nav.why": "Manfaat",
      "nav.workbuddy": "WorkBuddy",
      "nav.setup": "Mulai",
      "nav.needs": "Kebutuhan",
      "nav.status": "Status",
      "nav.home": "Beranda",
      "nav.back": "Kembali ke beranda",
      "nav.flash": "Flash",
      "nav.wifi": "Wi-Fi",
      "nav.before": "Persiapan",
      "nav.downloads": "Unduhan",
      "nav.whatwb": "Apa itu WorkBuddy?",
      "nav.source": "Kode firmware",
      "nav.github": "GitHub",
      "nav.createAccount": "Buat akun",
      "header.openSetup": "Mulai setup",
      "lang.label": "Bahasa",

      /* hero */
      "hero.badge": "Hackathon Tencent Cloud AI CAN DO IT 2026 · Tantangan B",
      "hero.h1": 'Dari chat, <span class="hl">langsung mengendalikan perangkat.</span>',
      "hero.lead": 'Cukup tulis, "Nyalakan lampu ruang rapat." WorkBuddy paham maksudmu, ArduBuddy meneruskannya ke ESP32 lewat shield relay 4 channel, dan lampu AC-nya menyala. Tanpa perlu membuat aplikasi kontrol sendiri, tanpa menulis kode.',
      "hero.btn_setup": "Coba ArduBuddy",
      "hero.btn_download": "Lihat prompt",
      "hero.meta": 'Persiapan sekitar 5 menit, tergantung koneksi dan proses instalasi. Kamu perlu ESP32, kabel USB, Wi-Fi, Chrome atau Edge, dan <a href="https://workbuddy.ai/invite?code=PHSPUBC8" target="_blank" rel="noopener">WorkBuddy Desktop</a>.',

      /* why / compare */
      "why.badge": "Intinya",
      "why.h2": "Lalu, ArduBuddy bisa apa?",
      "why.lead": "Apa bedanya WorkBuddy sebelum dan sesudah terhubung ke ArduBuddy?",
      "compare.wb.title": "WorkBuddy",
      "compare.wb.lead": "Membantu pekerjaan sehari-hari di komputer.",
      "compare.wb.li1": "Bikin dokumen, laporan, dan slide",
      "compare.wb.li2": "Olah spreadsheet dan data",
      "compare.wb.li3": "Kerjakan file yang ada di komputer",
      "compare.wb.tag": "WorkBuddy membantu pekerjaan di komputer, tetapi belum bisa mengendalikan perangkat di ruangan.",
      "compare.add.title": "WorkBuddy + ArduBuddy",
      "compare.add.lead": "Sekarang WorkBuddy juga bisa <b>mengendalikan perangkat fisik.</b>",
      "compare.add.li1": "Semua yang bisa dilakukan WorkBuddy",
      "compare.add.li2": "Nyalakan hingga 4 lampu AC lewat shield relay",
      "compare.add.li3": "Perintah yang sama, tanpa perlu membuat aplikasi kontrol sendiri",
      "compare.add.tag": "Bantu pekerjaan di komputer sekaligus kendalikan perangkat.",
      "why.note": "Perangkat:",
      "why.note2": "demo ini memakai ESP32 dengan shield relay 4 channel untuk menyalakan hingga empat lampu AC. Instalasi listrik berbahaya — ikuti catatan keamanan di bawah.",

      /* workbuddy section */
      "wb.badge": "Asisten AI dari Tencent",
      "wb.h2": "Mengenal WorkBuddy",
      "wb.lead": 'WorkBuddy adalah <b>asisten AI dari Tencent</b> yang bisa membantu kamu menyelesaikan berbagai pekerjaan di komputer. Misalnya, membuat dokumen, mengolah spreadsheet, menyiapkan presentasi, atau mengerjakan tugas dari file yang tersimpan di komputer.',
      "wb.note-strong": "Sebelum mencoba:",
      "wb.note": 'kamu perlu memasang <b>WorkBuddy Desktop</b>. Versi web belum bisa menjalankan agen desktop.',
      "wb.li1": "<b>Paham bahasa sehari-hari.</b> Cukup satu kalimat.",
      "wb.li2": "<b>Bisa merencanakan sendiri.</b> Tugas besar dipecah jadi langkah kecil, lalu dikerjakan.",
      "wb.li3": "<b>Bekerja dengan file asli.</b> Dokumen, spreadsheet, slide, data, sampai folder di komputer.",
      "wb.li4": "<b>Bisa ditambah kemampuan.</b> WorkBuddy bisa terhubung ke alat lain saat diperlukan.",
      "wb.callout.h3": "ArduBuddy menghubungkan WorkBuddy dengan ESP32",
      "wb.callout.p": "Jadi, selain membantu pekerjaan di komputer, WorkBuddy juga bisa menyalakan hingga empat lampu AC, kipas, atau membaca sensor lewat shield relay. WorkBuddy memanggil API HTTP board langsung — tanpa MCP.",
      "wb.btn_account": "Buat akun WorkBuddy",
      "wb.btn_site": "Situs resmi",
      "wb.btn_docs": "Baca dokumentasi",

      /* three quick things */
      "start.badge": "Persiapan",
      "start.h2": "Siapkan WorkBuddy terlebih dahulu.",
      "start.lead": "WorkBuddy berjalan sebagai <b>aplikasi desktop</b>. Versi browser belum bisa menjalankan agen desktop, jadi kamu perlu memasang aplikasinya dulu.",
      "start.1.title": "Buat akun",
      "start.1.p": 'Daftar lewat <a href="https://workbuddy.ai/invite?code=PHSPUBC8" target="_blank" rel="noopener">tautan undangan ini</a> supaya dapat <b>+350 kredit gratis</b>. WorkBuddy juga punya model gratis, jadi mencoba proyek ini tidak perlu keluar biaya.',
      "start.2.title": "Pasang WorkBuddy Desktop",
      "start.2.p": 'Unduh installer dari <a href="https://www.workbuddy.ai/" target="_blank" rel="noopener">situs resmi</a> (Windows x64 atau macOS .dmg), lalu jalankan. <b>Versi web tidak bisa dipakai untuk ini.</b>',
      "start.3.title": "Masuk ke aplikasi",
      "start.3.p": "Buka aplikasi desktop, klik <b>Log in</b>, dan masuk pakai akun yang tadi kamu buat. Browser cuma dipakai sebentar untuk login, setelah itu kamu kembali ke aplikasi.",
      "start.callout.h3": "Cara kerjanya",
      "start.formula": "WorkBuddy → HTTP → ESP32",
      "start.callout.p": "Tidak ada model AI atau kunci API yang berjalan di board. WorkBuddy yang berpikir dan memanggil API HTTP ESP32 langsung — tanpa connector, tanpa MCP.",

      /* how */
      "how.h2": "Siapkan ArduBuddy dalam tiga langkah.",
      "how.lead": "Semua dimulai dari browser. Kamu cuma butuh satu board dan satu prompt.",
      "how.1.title": "Flash board ESP32",
      "how.1.p": 'Colokkan ESP32 ke komputer, buka <a href="flash.html">halaman setup</a>, lalu klik satu tombol. Firmware-nya sudah kami sediakan di sana.',
      "how.2.title": "Hubungkan ESP32 ke Wi-Fi",
      "how.2.p": "Masukkan nama dan kata sandi Wi-Fi di halaman yang sama. Setelah tersambung, alamat board akan muncul otomatis.",
      "how.3.title": "Tempel prompt ke WorkBuddy",
      "how.3.p": 'Buka <a href="flash.html#step-done">halaman setup</a>, salin prompt yang sudah jadi, lalu tempel ke WorkBuddy Desktop.',

      /* who does what */
      "who.h2": "Bagaimana semuanya bekerja?",
      "who.lead": "Yang berpikir adalah WorkBuddy. Board ESP32 hanya menjalankan perintah yang sudah diperiksa.",
      "who.callout.h3": "AI bekerja di WorkBuddy, bukan di ESP32.",
      "who.callout.p": "Kamu tetap perlu akun WorkBuddy, tapi tidak perlu kunci API AI, model, atau langganan tambahan. WorkBuddy yang memahami perintah dan mengirim satu perintah HTTP terverifikasi ke ESP32. Itu inti seluruh alurnya.",
      "who.you": "Kamu",
      "who.you.s": "Memberi perintah",
      "who.wb": "WorkBuddy",
      "who.wb.s": "Memahami maksudnya",
      "who.conn": "HTTP API",
      "who.conn.s": "Menerima perintah",
      "who.esp": "ESP32",
      "who.esp.s": "Menjalankan instruksi",
      "who.lights": "Lampu",
      "who.lights.s": "Menyala",

      /* needs */
      "needs.h2": "Peralatan yang perlu disiapkan",
      "needs.lead": "Proses flash berjalan di browser dengan Chrome atau Edge. Alur prompt HTTP tidak perlu connector.",
      "needs.hw.title": "Perangkat keras",
      "needs.hw.li1": "Board ESP32 Dev / WROOM + shield relay 4 channel",
      "needs.hw.li2": "Kabel USB yang bisa mengirim data (bukan kabel cas)",
      "needs.hw.li3": "Hingga 4 lampu AC atau beban lain, sesuai rating relay — <b>bertegangan listrik, hati-hati</b>",
      "needs.hw.li4": "Jaringan Wi-Fi 2.4 GHz (ESP32 belum mendukung 5 GHz)",
      "needs.hw.li5": "Modul relay bersertifikat di dalam enclosure dengan fuse, dipasang oleh teknisi listrik kompeten",
      "needs.sw.title": "Perangkat lunak",
      "needs.sw.li1": "Chrome atau Edge (HTTPS) untuk proses flash di browser",
      "needs.sw.li2": "Tanpa connector untuk alur prompt HTTP",
      "needs.sw.li3": 'WorkBuddy Desktop sudah terpasang dan kamu sudah login — versi web belum bisa menjalankan agen desktop (<a href="#start">lihat persiapan</a>)',
      "needs.sw.li4": 'Akun <a href="https://workbuddy.ai/invite?code=PHSPUBC8" target="_blank" rel="noopener">WorkBuddy</a>; daftar lewat tautan undangan untuk dapat <b>+350 kredit gratis</b>',
      "needs.sw.li5": "Tidak ada yang lain — tanpa Python, tanpa Arduino IDE, tanpa install driver",

      /* status */
      "status.h2": "Status pengembangan ArduBuddy",
      "status.lead": "ArduBuddy masih berupa purwarupa yang dikembangkan untuk hackathon. Berikut fitur yang sudah tersedia dan yang masih dalam pengembangan.",
      "status.th1": "Bagian",
      "status.th2": "Status",
      "status.th3": "Catatan",
      "status.r1n": "API HTTP",
      "status.r1tag": "Sudah jalan",
      "status.r1note": "4 endpoint: status, execute, chain, skills",
      "status.r2n": "Perintah ESP32",
      "status.r2tag": "Sudah diverifikasi",
      "status.r2note": "Dicek langsung terhadap kode firmware yang dikirim",
      "status.r3n": "Flash lewat browser",
      "status.r3tag": "Sudah jalan",
      "status.r3note": "Firmware v1.0 sudah dibundel di situs ini",
      "status.r4n": "Konektor .exe (opsional)",
      "status.r4tag": "Opsional",
      "status.r4note": "Hanya untuk alur MCP; alur prompt HTTP tidak memerlukannya",
      "status.r5n": "Sensor suhu",
      "status.r5tag": "Belum tersedia",
      "status.r5note": "Firmware v1.0 membaca nilai ADC dan melaporkannya dalam satuan volt.",
      "status.r6n": "Login perangkat",
      "status.r6tag": "Belum tersedia",
      "status.r6note": "API lokal v1.0 belum dilengkapi autentikasi. Gunakan hanya pada jaringan tepercaya.",
      "status.r7n": "Kontrol AC 4 channel",
      "status.r7tag": "Didukung",
      "status.r7note": "ESP32 + shield relay 4 channel menyalakan hingga empat lampu AC.",
      "status.note-strong": "Catatan keamanan sebelum mencoba:",
      "status.note": "matikan listrik sebelum memasang kabel. Gunakan modul relay bersertifikat di dalam enclosure dengan fuse, jaga sisi tegangan rendah tetap terpisah, dan minta teknisi listrik memeriksa sisi AC. Jangan pernah menyentuh kabel yang masih dialiri listrik. Hindari GPIO 0, 2, 5, 12, dan 15.",
      "status.adv.summary": "Ringkasan API perangkat",
      "status.adv.th1": "Endpoint",
      "status.adv.th2": "Fungsi",
      "status.adv.p1": "Status board, alamat IP, dan mode yang sedang aktif",
      "status.adv.p2": 'Menjalankan satu perintah, misalnya menulis GPIO: <code>{"tool":"gpio.write","args":{"pin":4,"value":true}}</code>',
      "status.adv.p3": "Menjalankan beberapa perintah dalam satu permintaan",
      "status.adv.p4": "Menampilkan daftar skill/perintah yang didukung",
      "status.adv.note": 'Skema lengkap tiap endpoint ada di <a href="firmware/source/main.cpp" target="_blank" rel="noopener">kode firmware</a> (MIT).',

      /* downloads */
      "dl.h2": "Unduhan dan pengecekan file",
      "dl.lead": "Dua file, keduanya sudah tersedia di situs ini. Tidak perlu server unduhan terpisah.",
      "dl.exe.title": "ArduBuddy.exe (optional)",
      "dl.exe.p": 'Connector MCP opsional untuk Windows. Alur prompt HTTP tidak memerlukannya.<br/>SHA-256: <code style="word-break:break-all;font-size:12px">63186ad64528cdff8cdb8a1b2aa1a58b225fa5152348ddd584b6a9b095cbf120</code>',
      "dl.btnExe": "Unduh konektor (opsional)",
      "dl.fw.title": "Firmware ArduBuddy v1.0",
      "dl.fw.p": "Image ESP32 gabungan, 1.182.624 byte, ditulis di offset 0. File inilah yang dipakai flasher di browser.",
      "dl.btnBin": "Unduh .bin",
      "dl.btnManifest": "Manifest",
      "dl.note-strong": "Windows mungkin menampilkan peringatan:",
      "dl.note": 'konektor opsional ini belum ditandatangani secara digital, jadi SmartScreen bisa menulis "Penerbit tidak dikenal". Cocokkan SHA-256 di atas, lalu pilih <b>More info → Run anyway</b>.',
      "dl.hint": 'Aset merek: <a href="assets/ardubuddy-logo.svg">logo SVG</a> · <a href="assets/ardubuddy-logo-light.svg">logo untuk latar gelap</a> · <a href="assets/ardubuddy-icon.svg">ikon SVG</a> · <a href="assets/ardubuddy-icon-512.png">ikon PNG 512</a> · <a href="favicon.ico">favicon ICO</a>',

      /* ready */
      "ready.h2": "Yuk, coba ArduBuddy!",
      "ready.lead": "Flash dulu, baru sambungkan ke Wi-Fi. Urutan ini bikin masalah lebih gampang dilacak.",
      "ready.btn1": "Buka panduan 3 langkah",
      "ready.btn2": "Kode firmware",

      /* footer */
      "footer.copy": "ArduBuddy · purwarupa hackathon oleh Ajang Rahmat / ArduMeka · MIT",

      /* wizard */
      "flash.badge": "Estimasi 5 menit · Chrome atau Edge · Wajib HTTPS",
      "flash.h1": "Yuk, siapkan board ESP32-mu",
      "flash.lead": "Biarkan halaman ini tetap terbuka dan ESP32 tetap tersambung lewat kabel USB. Sisanya kami pandu, satu langkah setiap kali.",
      "step.1": "Flash board",
      "step.2": "Sambungkan Wi-Fi",
      "step.3": "Atur relay & prompt",
      "flash.1.h3": "Flash board",
      "flash.1.hint": "Satu klik untuk memasang firmware ArduBuddy v1.0 ke ESP32. Firmware-nya sudah tersedia di halaman ini.",
      "flash.1.fwInfo": "Memuat info firmware…",
      "flash.btnFlash": "Flash board saya",
      "flash.progLabel": "Belum dimulai",
      "flash.connLabel": "Board belum tersambung",
      "flash.1.note": 'Kalau sudah selesai: tekan tombol <b>RESET (EN)</b> di board, tunggu dua detik, lalu lanjut ke langkah 2. Jangan cabut kabelnya dulu.',
      "flash.adv1.summary": "Lanjutan: pakai file firmware sendiri atau lihat log",
      "flash.adv1.fwSourceLabel": "Sumber firmware",
      "flash.adv1.optBundled": "Firmware bawaan — ArduBuddy v1.0 (disarankan)",
      "flash.adv1.optLocal": "File .bin dari komputer saya",
      "flash.adv1.fileLabel": "Pilih image .bin gabungan",
      "flash.adv1.offsetLabel": "Offset flash",
      "flash.adv1.btnConnect": "Sambungkan serial saja",
      "flash.adv1.btnDisconnect": "Putuskan",
      "flash.2.h3": "Hubungkan ke Wi-Fi",
      "flash.2.hint": "Masukkan nama dan kata sandi Wi-Fi. Datanya langsung dikirim ke board lewat kabel USB — halaman ini tidak mengunggah atau menyimpannya ke mana pun.",
      "flash.2.ssidLabel": "Nama Wi-Fi (SSID)",
      "flash.2.ssidPh": "mis. Wi-Fi-Kantor",
      "flash.2.passLabel": "Kata sandi Wi-Fi",
      "flash.2.passPh": "Kata sandi kamu",
      "flash.2.btnGo": "Sambungkan ESP32 saya",
      "flash.2.btnDisconnect": "Putuskan USB",
      "flash.2.statusText": "Kami akan membuka port serial USB, mengirim detail Wi-Fi, lalu menyalakan kendali perangkat.",
      "flash.2.note": "Gunakan Wi-Fi 2.4 GHz, karena ESP32 belum bisa tersambung ke 5 GHz. Kalau tidak ada respons, tekan RESET di board lalu coba lagi. Kadang driver USB CP210x atau CH340 juga perlu dipasang.",
      "flash.adv2.summary": "Lanjutan: atasi masalah koneksi dan lihat log",
      "flash.adv2.btnStatus": "Cek status",
      "flash.adv2.btnRestart": "Mulai ulang board",
      "flash.adv2.btnForget": "Lupakan Wi-Fi",
      "flash.adv3.summary": "Lanjutan: perintah yang kami kirim (tanpa kunci AI)",
      "flash.adv3.tr1": "Simpan Wi-Fi",
      "flash.adv3.tr2": "Cek status",
      "flash.adv3.tr3": "Nyalakan API lokal",
      "flash.adv3.tr4": "Lupakan Wi-Fi",
      "flash.adv3.tr5": "Mulai ulang",
      "flash.adv3.p": 'Firmware ArduBuddy v1.0 menerima perintah JSON lewat USB serial dan HTTP. Tidak ada model AI atau kunci API di board. Kamu tetap butuh akun WorkBuddy.',
      "flash.3.h3": "Atur relay & prompt",
      "flash.3.hint": "Ini alamat ESP32-mu di jaringan. Tempel ke konektor ArduBuddy.",
      "flash.3.placeholder": "Selesaikan langkah 2, nanti alamatnya muncul di sini.",
      "flash.3.ipLabel": "Alamat board kamu",
      "flash.3.copyBtn": "Salin alamat",
      "flash.3.openBtn": "Status API",
      "flash.3.ol1": "<b>Pasang WorkBuddy Desktop lalu login</b> dengan akunmu. Versi web belum bisa menjalankan konektor MCP, jadi aplikasi desktop wajib dipakai.",
      "flash.3.ol2": 'Jalankan <code>ArduBuddy.exe</code> (unduh dari beranda).',
      "flash.3.ol3": 'Tempel alamat tadi ke kolom "Alamat ESP32", matikan <b>Mode simulasi</b>, lalu klik "Simpan & daftarkan".',
      "flash.3.ol4": 'Mulai ulang WorkBuddy, buka Connectors → Custom Connector, lalu klik <b>Trust</b> pada <code>ardubuddy</code>.',
      "flash.3.ol5": 'Sekarang coba: "Nyalakan lampu ruang rapat." atau "Matikan lampu ruang rapat."',
      "flash.3.callout.h3": "Kenapa tidak perlu kunci AI?",
      "flash.3.callout.p": 'WorkBuddy yang melakukan semua pemikiran. Konektor hanya mengirim satu perintah yang sudah diperiksa ke ESP32, lalu board melaporkan apa yang benar-benar terjadi. Tidak ada model AI yang berjalan di board. Kamu tetap butuh <a href="https://workbuddy.ai/invite?code=PHSPUBC8" target="_blank" rel="noopener">akun WorkBuddy</a>, tapi tanpa kunci API AI atau langganan tambahan.',
      "flash.adv4.summary": "Apa itu WorkBuddy?",
      "flash.adv4.p1": "WorkBuddy adalah <b>asisten AI dari Tencent</b> untuk pekerjaan sehari-hari. Kamu cukup menulis satu kalimat, lalu ia menyusun langkah dan mengerjakan tugasnya, kemudian memberi hasil yang bisa kamu periksa. Biasanya ia bekerja dengan dokumen, spreadsheet, slide, dan file di komputer.",
      "flash.adv4.p2": 'Proyek ini menambahkan konektor khusus supaya perintah yang sama bisa sampai ke board ESP32. Kamu perlu <b>aplikasi WorkBuddy Desktop</b> (bukan versi web) dan sebuah akun — daftar lewat <a href="https://workbuddy.ai/invite?code=PHSPUBC8" target="_blank" rel="noopener">tautan undangan ini</a> untuk dapat <b>+350 kredit gratis</b>; model gratis juga tersedia. Lihat <a href="index.html#start">persiapan</a> atau <a href="https://www.workbuddy.ai/" target="_blank" rel="noopener">situs resmi</a>.',
      "cfg.hint": "Beri nama 4 channel relay dan tentukan pin GPIO-nya. Pengaturan disimpan ke board lewat kabel USB.",
      "cfg.name": "Nama",
      "cfg.pin": "GPIO",
      "cfg.activeLow": "Relay active-low (nyala saat GPIO LOW)",
      "cfg.save": "Simpan ke board",
      "cfg.saved": "Pengaturan tersimpan di board.",
      "cfg.saveFail": "Gagal menyimpan: {msg}",
      "cfg.needSerial": "Sambungkan kabel USB dulu (langkah 2).",
      "cfg.allOff": "Semua OFF",
      "cfg.test": "Tes",
      "prompt.h3": "Prompt WorkBuddy",
      "prompt.hint": "Salin prompt ini ke WorkBuddy. Isinya alamat board, peta relay, contoh API, dan aturan keamanan.",
      "prompt.copy": "Salin prompt",
      "prompt.copied": "Tersalin",
      "prompt.needIp": "Selesaikan langkah 2 dulu supaya alamat board muncul.",
      "flash.3.note": 'Setelah board di-restart: firmware v1.0 menyalakan API lokal otomatis setelah Wi-Fi tersambung. Tunggu beberapa detik dan alamatnya muncul lagi — tanpa perintah tambahan.',
      "flash.footer.copy": "ArduBuddy · memakai esptool-js (MIT) untuk flash di browser",
      "flash.footer.manifest": "Manifest firmware",
      "flash.footer.docs": "Dokumentasi firmware",

      /* wizard runtime */
      "flash.conn.connected": "Board tersambung",
      "flash.conn.disconnected": "Board terputus",
      "flash.conn.notconnected": "Board belum tersambung",
      "flash.conn.flashing": "Sedang mem-flash — mohon tunggu",
      "flash.prog.ready": "Menyiapkan",
      "flash.prog.writing": "Menulis firmware {pct}%",
      "flash.prog.restart": "Memulai ulang board",
      "flash.prog.done": "Selesai",
      "flash.prog.failed": "Gagal — coba lagi",
      "flash.fwReady": "Siap: {name} v{version} — tidak ada yang perlu diunduh lagi.",
      "flash.fwError": "Firmware bawaan tidak tersedia: {msg}",
      "wifi.status.usbConnected": "USB tersambung",
      "wifi.status.long.usbConnected": "Koneksi serial terbuka di 115200 baud.",
      "wifi.confirm.forget": "Lupakan detail Wi-Fi yang tersimpan di board ini?",
      "wifi.status.waiting": "Menunggu Wi-Fi…",
      "wifi.status.long.joining": "Board sedang menyambung ke jaringan. Biasanya hanya butuh beberapa detik.",
      "wifi.status.notConnected": "Belum tersambung",
      "wifi.status.long.offline": "Masih offline. Cek lagi nama dan kata sandinya, pastikan Wi-Fi 2.4 GHz, lalu tekan RESET dan coba sekali lagi.",
      "wifi.status.switching": "Menyalakan kendali perangkat…",
      "wifi.status.long.switching": "Wi-Fi sudah tersambung. Satu perintah lagi dan board siap dipakai.",
      "wifi.status.ready": "Board kamu siap",
      "wifi.status.long.ready": "Salin alamat di bawah, lalu tempel ke ArduBuddy.exe.",
      "wifi.status.wrong": "Ada yang tidak beres",
      "wifi.status.long.wrong": "Board menjawab: {msg}. Cek log di bawah untuk detailnya.",
      "wifi.status.nameMissing": "Nama Wi-Fi belum diisi",
      "wifi.status.long.nameMissing": "Isi nama Wi-Fi (SSID) dulu, ya.",
      "wifi.status.sending": "Mengirim detail Wi-Fi…",
      "wifi.status.long.sending": "Kata sandi hanya dikirim lewat kabel USB.",
      "wifi.status.couldNot": "Gagal tersambung",
      "wifi.status.long.couldNot": "{msg} Tutup dulu serial monitor yang mungkin terbuka, lalu coba lagi.",
      "wifi.status.usbDisconnected": "USB terputus",
      "wifi.status.long.usbDisconnected": "Sambungkan lagi sebelum memakai tombol di bawah.",
      "wifi.btn.working": "Memproses…",
      "wifi.btn.connect": "Sambungkan ESP32 saya",
      "wifi.copy.copied": "Tersalin",
      "wifi.copy.address": "Salin alamat"
    }
  };

  const FALLBACK = "en";

  function detectLang() {
    // 1) explicit ?lang=id / ?lang=en (shareable links, quick testing)
    try {
      if (typeof location !== "undefined") {
        const q = new URLSearchParams(location.search).get("lang");
        if (q === "en" || q === "id") return q;
      }
    } catch (_) {}
    // 2) last choice on this device
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "id") return saved;
    } catch (_) {}
    // 3) browser language
    const nav = (navigator.language || "en").toLowerCase();
    return nav.startsWith("id") ? "id" : "en";
  }

  function syncUrl(lang) {
    try {
      if (typeof history === "undefined" || !history.replaceState) return;
      const url = new URL(location.href);
      url.searchParams.set("lang", lang);
      history.replaceState(null, "", url);
    } catch (_) {}
  }

  function dict(lang) {
    return I18N[lang] || I18N[FALLBACK];
  }

  function t(key, params) {
    let str = dict(detectLang())[key];
    if (str === undefined) str = I18N[FALLBACK][key];
    if (str === undefined) {
      if (typeof console !== "undefined") console.warn("[i18n] missing key:", key);
      return "[" + key + "]";
    }
    if (params && typeof str === "string") {
      str = str.replace(/\{(\w+)\}/g, (m, name) =>
        params[name] !== undefined ? String(params[name]) : m
      );
    }
    return str;
  }

  function applyLang(lang) {
    if (lang !== "en" && lang !== "id") lang = FALLBACK;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
    document.documentElement.setAttribute("lang", lang);
    syncUrl(lang);

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const v = I18N[lang][key];
      if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      const v = I18N[lang][key];
      if (v !== undefined) el.innerHTML = v;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.getAttribute("data-i18n-attr").split(",").forEach((pair) => {
        const idx = pair.indexOf(":");
        if (idx < 0) return;
        const attr = pair.slice(0, idx).trim();
        const key = pair.slice(idx + 1).trim();
        const v = I18N[lang][key];
        if (v !== undefined) el.setAttribute(attr, v);
      });
    });

    document.querySelectorAll(".lang-btn").forEach((b) => {
      const on = b.getAttribute("data-lang") === lang;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });

    window.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  // Click handling for the switch buttons.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest(".lang-btn");
    if (btn) applyLang(btn.getAttribute("data-lang"));
  });

  function init() {
    applyLang(detectLang());
  }

  window.ArduI18n = { t, applyLang, detectLang };
  window.t = t;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/**
 * Smoke test: loads the page in headless Chrome, captures console output and
 * exercises the interactive flows (nav, auth modal, CTA toast, reveal).
 * Usage: node scripts/check.mjs [url]
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const URL = process.argv[2] ?? "http://localhost:4173/index.html";
const PORT = 9400 + Math.floor(Math.random() * 500);

const chrome = spawn(
  "google-chrome",
  [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    `--user-data-dir=/tmp/opencode/chrome-profile-${PORT}-${Date.now()}`,
    `--remote-debugging-port=${PORT}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

process.on("exit", () => chrome.kill());

let target = null;
for (let attempt = 0; attempt < 120 && !target; attempt += 1) {
  await sleep(500);
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const list = await res.json();
    target = list.find((t) => t.type === "page");
  } catch {
    /* not ready */
  }
}
if (!target) {
  console.error("Chrome did not start");
  process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const consoleMessages = [];

const send = (method, params = {}) =>
  new Promise((resolve) => {
    id += 1;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

await new Promise((resolve) => ws.addEventListener("open", resolve));
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message.result);
    pending.delete(message.id);
  }
  if (message.method === "Runtime.consoleAPICalled") {
    consoleMessages.push({
      type: message.params.type,
      text: message.params.args
        .map((a) => a.value ?? a.description ?? "")
        .join(" "),
    });
  }
  if (message.method === "Runtime.exceptionThrown") {
    consoleMessages.push({
      type: "exception",
      text:
        message.params.exceptionDetails.exception?.description ??
        message.params.exceptionDetails.text,
    });
  }
});

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: URL });
await sleep(2500);

const evaluate = async (expression) => {
  const res = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return res.result?.value;
};

const results = {};

results.categories = await evaluate(
  `document.querySelectorAll('.category').length`,
);
results.steps = await evaluate(`document.querySelectorAll('.step').length`);
results.notes = await evaluate(`document.querySelectorAll('.note').length`);
results.polaroids = await evaluate(
  `document.querySelectorAll('.polaroid').length`,
);
results.avatarSvgs = await evaluate(
  `document.querySelectorAll('.polaroid__img svg').length`,
);
results.externalIconFonts = await evaluate(
  `document.querySelectorAll('link[rel="stylesheet"][href*="fontawesome"], link[href*="bootstrap-icons"]').length`,
);
results.imgAttrs = await evaluate(
  `JSON.stringify([...document.images].map(i => ({
     src: i.getAttribute('src'),
     lazy: i.getAttribute('loading'),
     w: i.getAttribute('width'),
     h: i.getAttribute('height'),
     alt: i.getAttribute('alt'),
     complete: i.complete,
     natural: i.naturalWidth
  })))`,
);

// Login modal
await evaluate(`document.querySelector('[data-auth="login"]').click()`);
await sleep(500);
results.modalOpen = await evaluate(
  `document.querySelector('.modal').classList.contains('is-open')`,
);
results.modalTitle = await evaluate(
  `document.querySelector('.modal__title').textContent.trim()`,
);
results.bodyLocked = await evaluate(`document.body.classList.contains('is-locked')`);

// Submit login form (falls back to demo mode without a backend)
await evaluate(`(() => {
  document.querySelector('#auth-email').value = 'ada@example.com';
  document.querySelector('#auth-password').value = 'secret123';
  document.querySelector('.auth-form').dispatchEvent(new Event('submit', {cancelable:true, bubbles:true}));
})()`);
await sleep(1200);
results.toastVisible = await evaluate(
  `document.querySelector('.toast').classList.contains('is-visible')`,
);
results.toastMessage = await evaluate(
  `document.querySelector('.toast__message').textContent.trim()`,
);
results.modalClosedAfterSubmit = await evaluate(
  `!document.querySelector('.modal').classList.contains('is-open')`,
);

// Create event CTA
await evaluate(`document.querySelector('[data-create-event="hero"]').click()`);
await sleep(1200);
results.ctaToast = await evaluate(
  `document.querySelector('.toast__message').textContent.trim()`,
);
results.ctaLabelRestored = await evaluate(
  `document.querySelector('[data-create-event="hero"]').textContent.trim()`,
);

// Reveal observer
await evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
await sleep(1500);
await evaluate(`window.scrollTo(0, 0)`);
await sleep(600);
results.revealed = await evaluate(
  `document.querySelectorAll('[data-reveal].is-visible').length`,
);
results.revealTotal = await evaluate(
  `document.querySelectorAll('[data-reveal]').length`,
);

// Mobile nav toggle
await send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await sleep(400);
await evaluate(`document.querySelector('.nav__toggle').click()`);
await sleep(400);
results.mobileMenuOpen = await evaluate(
  `document.querySelector('.nav__menu').classList.contains('is-open')`,
);
results.toggleExpanded = await evaluate(
  `document.querySelector('.nav__toggle').getAttribute('aria-expanded')`,
);
results.horizontalOverflow = await evaluate(
  `document.documentElement.scrollWidth - document.documentElement.clientWidth`,
);

console.log(JSON.stringify(results, null, 2));
console.log("\n--- console output ---");
for (const message of consoleMessages) {
  console.log(`[${message.type}] ${message.text}`);
}

ws.close();
chrome.kill();
process.exit(0);

/**
 * Debug helper: reports elements that overflow the viewport at a given width.
 * Usage: node scripts/overflow.mjs [width] [height] [url]
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const WIDTH = Number(process.argv[2] ?? 390);
const HEIGHT = Number(process.argv[3] ?? 844);
const URL = process.argv[4] ?? "http://localhost:4173/index.html";
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
    `--window-size=${WIDTH},${HEIGHT}`,
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
    /* not ready yet */
  }
}

if (!target) {
  console.error("Chrome did not start");
  process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();

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
});

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: WIDTH,
  height: HEIGHT,
  deviceScaleFactor: 1,
  mobile: true,
});
await send("Page.navigate", { url: URL });
await sleep(2500);

const expression = `(() => {
  const vw = document.documentElement.clientWidth;
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (rect.right > vw + 1 || rect.left < -1) {
      const style = getComputedStyle(el);
      if (style.position === "fixed") continue;
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || "").toString().slice(0, 60),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        pos: style.position,
      });
    }
  }
  return JSON.stringify({
    clientWidth: vw,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    offenders: offenders.slice(0, 40),
  }, null, 2);
})()`;

const result = await send("Runtime.evaluate", { expression, returnByValue: true });
console.log(result.result.value);

ws.close();
chrome.kill();
process.exit(0);

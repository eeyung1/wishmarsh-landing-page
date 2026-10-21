/**
 * Capture a screenshot at an emulated device width (applies the meta viewport).
 * Usage: node scripts/shot.mjs [width] [height] [url] [outfile] [fullPage]
 */
import { spawn } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const WIDTH = Number(process.argv[2] ?? 390);
const HEIGHT = Number(process.argv[3] ?? 844);
const URL = process.argv[4] ?? "http://localhost:4173/index.html";
const OUT = process.argv[5] ?? "/tmp/opencode/shot.png";
const FULL = (process.argv[6] ?? "full") === "full";
const ACTION = process.argv[7] ?? "";
const PORT = 9400 + Math.floor(Math.random() * 500);
const PROFILE = `/tmp/opencode/chrome-profile-${PORT}`;
rmSync(PROFILE, { recursive: true, force: true });

const chrome = spawn(
  "google-chrome",
  [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    `--user-data-dir=${PROFILE}`,
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
  mobile: WIDTH < 900,
});
await send("Page.navigate", { url: URL });
await sleep(2200);

// Scroll through the page so lazy-loaded assets resolve, then settle
await send("Runtime.evaluate", {
  expression: `(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  })()`,
  awaitPromise: true,
});
await sleep(1200);

// Trigger every reveal animation, then settle
await send("Runtime.evaluate", {
  expression: `document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-visible')); window.scrollTo(0,0);`,
});
await sleep(600);

// Wait for every image to finish decoding so captures are not blank
await send("Runtime.evaluate", {
  expression: `(async () => {
    const wait = (img) => new Promise(res => {
      if (img.complete) return res();
      img.addEventListener('load', res, {once:true});
      img.addEventListener('error', res, {once:true});
    });
    await Promise.race([
      Promise.all([...document.images].map(wait)),
      new Promise(res => setTimeout(res, 3000)),
    ]);
  })()`,
  awaitPromise: true,
});
await sleep(400);

if (ACTION) {
  await send("Runtime.evaluate", { expression: ACTION });
  await sleep(700);
}

const params = { format: "png", captureBeyondViewport: FULL };
if (FULL) {
  const metrics = await send("Page.getLayoutMetrics");
  const size = metrics.cssContentSize ?? metrics.contentSize;
  params.clip = {
    x: 0,
    y: 0,
    width: Math.min(size.width, WIDTH),
    height: size.height,
    scale: 1,
  };
}

const shot = await send("Page.captureScreenshot", params);
writeFileSync(OUT, Buffer.from(shot.data, "base64"));
console.log(`saved ${OUT}`);

ws.close();
chrome.kill();
process.exit(0);

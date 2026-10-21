/** Debug: report image loading state after scrolling. */
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const URL = process.argv[2] ?? "http://localhost:4173/index.html";
const WIDTH = Number(process.argv[3] ?? 820);
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
for (let i = 0; i < 120 && !target; i += 1) {
  await sleep(500);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    target = list.find((t) => t.type === "page");
  } catch {}
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
await new Promise((r) => ws.addEventListener("open", r));
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
});

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: WIDTH,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: WIDTH < 900,
});
await send("Page.navigate", { url: URL });
await sleep(2000);
await send("Runtime.evaluate", {
  expression: `(async()=>{const s=innerHeight*0.8;for(let y=0;y<document.body.scrollHeight;y+=s){scrollTo(0,y);await new Promise(r=>setTimeout(r,150));}scrollTo(0,0);})()`,
  awaitPromise: true,
});
await sleep(1500);
const res = await send("Runtime.evaluate", {
  expression: `JSON.stringify([...document.images].map(i=>({src:i.getAttribute('src'),complete:i.complete,nw:i.naturalWidth,loading:i.getAttribute('loading'),rect:i.getBoundingClientRect().height})),null,2)`,
  returnByValue: true,
});
console.log(res.result.value);
ws.close();
chrome.kill();
process.exit(0);

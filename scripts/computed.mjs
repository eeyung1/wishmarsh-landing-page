/** Debug: report computed styles for a selector. */
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const URL = process.argv[2] ?? "http://localhost:4173/index.html";
const SELECTOR = process.argv[3] ?? ".hero__photo";
const PORT = 9400 + Math.floor(Math.random() * 500);
const PROFILE = `/tmp/opencode/chrome-profile-${PORT}`;
rmSync(PROFILE, { recursive: true, force: true });

const chrome = spawn(
  "google-chrome",
  [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
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
if (!target) {
  console.error("no target");
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
await send("Page.navigate", { url: URL });
await sleep(2000);

const res = await send("Runtime.evaluate", {
  expression: `(() => {
    const el = document.querySelector(${JSON.stringify(SELECTOR)});
    if (!el) return "element not found";
    const cs = getComputedStyle(el);
    const keys = ["maskImage","webkitMaskImage","maskSize","maskRepeat","maskMode","maskComposite","objectFit","objectPosition","borderRadius","filter","overflow","clipPath"];
    const out = {};
    for (const k of keys) out[k] = cs.getPropertyValue(k) || cs[k];
    out.rect = JSON.stringify(el.getBoundingClientRect());
    out.chromeVersion = navigator.userAgent;
    return JSON.stringify(out, null, 2);
  })()`,
  returnByValue: true,
});
console.log(res.result.value);
ws.close();
chrome.kill();
process.exit(0);

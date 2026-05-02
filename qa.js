const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Keep this in sync with calibrate.js STEP_TARGETS.
const STEP_TARGETS = {
  // Act 1 — Capture
  4: "capture",
  5: "capture",
  7: "screenshot",
  8: "screenshot",
  15: "capture-textarea",
  16: "capture-textarea",
  19: "capture-priority",
  20: "capture-priority",
  21: "capture-add",
  22: "capture-add",
  // Act 2 — Annotate
  24: "count-pill",
  25: "count-pill",
  27: "annotate",
  28: "annotate",
  30: "annotation-target",
  31: "annotation-target",
  33: "annot-textarea",
  34: "annot-textarea",
  35: "annot-priority",
  36: "annot-priority",
  37: "annot-priority",
  38: "annot-priority",
  39: "annot-priority",
  40: "annot-priority",
  41: "annot-add",
  42: "annot-add",
  // Act 3 — Text note
  43: "count-pill",
  44: "count-pill",
  46: "note",
  47: "note",
  49: "text",
  50: "text",
  52: "text-textarea",
  53: "text-textarea",
  57: "text-priority",
  58: "text-priority",
  59: "text-add",
  60: "text-add",
  // Act 4 — Voice note
  62: "count-pill",
  63: "count-pill",
  65: "note",
  66: "note",
  68: "voice",
  69: "voice",
  73: "voice-stop",
  75: "voice-add",
  76: "voice-add",
  // Act 5 — Review & submit
  78: "count-pill",
  79: "count-pill",
  81: "send",
  82: "send",
  84: "review-submit",
  85: "review-submit",
};

async function run() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });

  const outDir = path.join(__dirname, 'qa-screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  let html = `<html><head><title>Cursor QA</title><style>
    body { font-family: sans-serif; background: #111; color: #fff; padding: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; }
    .card { background: #222; padding: 10px; border-radius: 8px; }
    img { max-width: 100%; height: auto; border: 1px solid #444; }
    .ok { color: #4ade80; } .fail { color: #f87171; }
  </style></head><body><h1>Cursor Alignment QA</h1>
  <p>Total: ${Object.keys(STEP_TARGETS).length} steps</p>
  <div class="grid">`;

  let okCount = 0, failCount = 0;
  const failures = [];
  let currentTarget = null;
  let anchorTip = null;

  for (const [stepStr, targetName] of Object.entries(STEP_TARGETS)) {
    const step = parseInt(stepStr, 10);
    await page.goto(`http://localhost:3000?step=${step}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 900));

    const data = await page.evaluate((name) => {
      const cursor = document.querySelector("[data-mock-cursor]");
      const target = document.querySelector(`[data-mock-target="${name}"]`);
      if (!cursor || !target) return { found: false };

      const c = cursor.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      // Cursor SVG is the visible arrow; its hotspot is at its top-left for the regular
      // pointer cursor (the tip), and at its center for the crosshair (which is
      // translate(-3,-3)). We compute the cursor "tip" as the SVG's left/top corner.
      const svg = cursor.querySelector("svg");
      let tip;
      if (svg) {
        const sb = svg.getBoundingClientRect();
        const isCrosshair = svg.classList.contains("-translate-x-3");
        tip = isCrosshair
          ? { x: sb.left + sb.width / 2, y: sb.top + sb.height / 2 }
          : { x: sb.left, y: sb.top };
      } else {
        tip = { x: c.left, y: c.top };
      }
      const tol = 8;
      const isInside =
        tip.x >= t.left - tol && tip.x <= t.right + tol &&
        tip.y >= t.top - tol && tip.y <= t.bottom + tol;
      return { found: true, isInside, tip, t: { l: t.left, r: t.right, t: t.top, b: t.bottom } };
    }, targetName);

    await page.screenshot({ path: path.join(outDir, `step-${step}.png`) });

    let statusHtml;
    if (!data.found) {
      statusHtml = `<p class="fail">Target or cursor not found</p>`;
      failCount++;
      failures.push(`Step ${step} (${targetName}): not found`);
    } else {
      let isJitter = false;
      let jitterMsg = "";
      if (targetName === currentTarget && anchorTip) {
        const dx = Math.abs(data.tip.x - anchorTip.x);
        const dy = Math.abs(data.tip.y - anchorTip.y);
        if (dx > 2 || dy > 2) {
          isJitter = true;
          jitterMsg = `Jitter: delta (${Math.round(dx)}, ${Math.round(dy)}) from step anchor`;
        }
      } else {
        currentTarget = targetName;
        anchorTip = data.tip;
      }

      if (isJitter) {
        statusHtml = `<p class="fail">${jitterMsg}</p>`;
        failCount++;
        failures.push(`Step ${step} (${targetName}): ${jitterMsg}`);
      } else if (data.isInside) {
        statusHtml = `<p class="ok">Aligned</p>`;
        okCount++;
      } else {
        const msg = `cursor (${Math.round(data.tip.x)}, ${Math.round(data.tip.y)}) target [${Math.round(data.t.l)}-${Math.round(data.t.r)}, ${Math.round(data.t.t)}-${Math.round(data.t.b)}]`;
        statusHtml = `<p class="fail">Misaligned: ${msg}</p>`;
        failCount++;
        failures.push(`Step ${step} (${targetName}): ${msg}`);
      }
    }

    html += `<div class="card"><h3>Step ${step}: ${targetName}</h3>${statusHtml}<img src="step-${step}.png" /></div>`;
  }

  html += `</div><h2>Result: ${okCount} OK / ${failCount} FAIL</h2></body></html>`;

  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  console.log(`\nQA complete. ${okCount}/${okCount + failCount} targets aligned.`);
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures) console.log("  " + f);
  }
  await browser.close();
}

run().catch((err) => { console.error(err); process.exit(1); });

const puppeteer = require('puppeteer');
const fs = require('fs');

// IMPORTANT: keep this in sync with qa.js STEP_TARGETS.
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

  const results = {};
  let foundCount = 0;
  let totalCount = 0;

  for (const [stepStr, targetName] of Object.entries(STEP_TARGETS)) {
    const step = parseInt(stepStr, 10);
    totalCount++;
    await page.goto(`http://localhost:3000?step=${step}`, { waitUntil: 'networkidle0' });
    // Let CSS transitions / fadeIns settle.
    await new Promise(r => setTimeout(r, 900));

    const data = await page.evaluate((name) => {
      const cursor = document.querySelector("[data-mock-cursor]");
      const target = document.querySelector(`[data-mock-target="${name}"]`);
      if (!cursor || !target) return null;

      const t = target.getBoundingClientRect();
      const content = document.querySelector(".relative.flex-1.overflow-hidden.bg-white");
      if (!content) return null;

      const cb = content.getBoundingClientRect();

      // The Aqua window wrapping `content` has `transform: scale(0.87)`. CSS positions
      // (used in `calc(100% - Npx)`) live in the un-transformed coordinate system, so
      // when we want a cursor to land at a particular visual offset from a container
      // edge we must divide by the visual scale factor. Detect the scale by comparing
      // the un-transformed offsetWidth to the visual rect width.
      const scaleX = content.offsetWidth ? cb.width / content.offsetWidth : 1;
      const scaleY = content.offsetHeight ? cb.height / content.offsetHeight : 1;

      const targetCenterX = name.endsWith("-priority") ? t.left + 12 : t.left + t.width / 2;
      const targetCenterY = t.top + t.height / 2;
      // Anchor X to whichever container edge is closer (right is the toolbar/panels;
      // left is annotation popover area). Y uses bottom for bar-anchored UI, top for
      // page elements like annotation-target / annotation popover.
      const distFromRight = cb.right - targetCenterX;
      const distFromLeft = targetCenterX - cb.left;
      const xFromRight = distFromRight <= distFromLeft;
      const isBottomHalf = targetCenterY > (cb.top + cb.height / 2);

      const visualX = xFromRight ? distFromRight : distFromLeft;
      const visualY = isBottomHalf ? cb.bottom - targetCenterY : targetCenterY - cb.top;

      return {
        x: Math.round(visualX / (scaleX || 1)),
        xFromRight,
        y: Math.round(visualY / (scaleY || 1)),
        isBottomHalf,
        scaleX: Number(scaleX.toFixed(3)),
      };
    }, targetName);

    if (data) {
      results[step] = data;
      foundCount++;
      const xLabel = data.xFromRight ? `right-${data.x}px` : `left-${data.x}px`;
      const yLabel = data.isBottomHalf ? `bottom-${data.y}px` : `top-${data.y}px`;
      console.log(`Step ${step.toString().padStart(3)} (${targetName.padEnd(20)}) ${xLabel.padEnd(14)} ${yLabel}`);
    } else {
      console.log(`Step ${step.toString().padStart(3)} (${targetName.padEnd(20)}) NOT FOUND`);
    }
  }

  console.log(`\nFound ${foundCount}/${totalCount} targets`);
  await browser.close();

  // Fix jitter for consecutive same-target steps
  const steps = Object.keys(STEP_TARGETS).map(Number).sort((a, b) => a - b);
  let currentTarget = null;
  let anchorResult = null;
  for (const step of steps) {
    const targetName = STEP_TARGETS[step];
    if (targetName === currentTarget) {
      if (anchorResult && results[step]) {
        results[step] = anchorResult;
      }
    } else {
      currentTarget = targetName;
      anchorResult = results[step];
    }
  }

  // Update browser-mockup.tsx in-place. Match each `{ state: "...",` line in the
  // ANIM_STEPS array and replace cursorX/cursorY when calibration data exists.
  let content = fs.readFileSync('app/src/components/browser-mockup.tsx', 'utf-8');
  const lines = content.split('\n');
  let inAnimSteps = false;
  let stepIndex = 0;
  let updated = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const ANIM_STEPS: AnimStep[] = [')) {
      inAnimSteps = true;
      continue;
    }
    if (inAnimSteps && /^\];/.test(lines[i])) {
      inAnimSteps = false;
      break;
    }
    if (inAnimSteps && /\{\s*state:/.test(lines[i])) {
      const r = results[stepIndex];
      if (r) {
        const newX = r.xFromRight
          ? `"calc(100% - ${r.x}px)"`
          : `"${r.x}px"`;
        const newY = r.isBottomHalf
          ? `"calc(100% - ${r.y}px)"`
          : `"${r.y}px"`;

        const before = lines[i];
        lines[i] = lines[i].replace(/cursorX:\s*[^,]+,/, `cursorX: ${newX},`);
        lines[i] = lines[i].replace(/cursorY:\s*[^,]+,/, `cursorY: ${newY},`);
        if (lines[i] !== before) updated++;
      }
      stepIndex++;
    }
  }

  fs.writeFileSync('app/src/components/browser-mockup.tsx', lines.join('\n'));
  console.log(`Updated ${updated} step lines in browser-mockup.tsx`);
}

run().catch((err) => { console.error(err); process.exit(1); });

const fs = require('fs');
const path = '/Users/iv4n2k/Documents/innover-remotion-ad/src/LoaderAd.tsx';
let code = fs.readFileSync(path, 'utf8');

// Capture Clip 5 & 6 dynamic block
const regex = /if\s*\(c56Visible\)[\s\S]*?yVision\s*=\s*-30\s*\*\s*t;[\s\S]*?\}\s*\}/;

const replacement = `if (c56Visible) {
    const fC56 = frame - 305;

    // Phase 1a ─ "Let's" enters alone with a smooth standard pop-out (fC56: 0–20)
    if (fC56 < 20) {
      const t = easeStandard(clamp(fC56 / 20));
      opacityLets = t;
      scaleLets = 0.5 + 0.5 * t; // smooth scale from 0.5 to 1.0
      yLets = 30 * (1 - t);       // slides up smoothly
      rowX5 = 0;
      opacityBring = 0;
      xBringSlide = 500;
    }

    // Phase 1b ─ "Bring your" slides in from right (duration 22 frames = 0.75s, fC56: 20–42)
    if (fC56 >= 20 && fC56 < 42) {
      const t = easeSnap(clamp((fC56 - 20) / 22));

      opacityLets = 1.0;
      scaleLets = 1.0;
      yLets = 0;

      rowX5 = -120 * t; // shift top row left

      opacityBring = easeSnap(t);
      scaleBring = 0.7 + 0.3 * t;
      xBringSlide = 500 * (1 - t); // slide from right
    }

    // Phase 1c ─ Keep top row holding visible after its entrance is complete (fC56 >= 42)
    if (fC56 >= 42) {
      opacityLets = 1.0;
      scaleLets = 1.0;
      yLets = 0;
      opacityBring = 1.0;
      scaleBring = 1.0;
      xBringSlide = 0;
      rowX5 = -120;
    }

    // ─ EXTREMELY SMOOTH EXIT for "Let's Bring your" (fC56: 62–90) ─
    if (fC56 >= 62) {
      const tOut5 = easeStandard(clamp((fC56 - 62) / 28));
      opacityLets = clamp(1.0 - tOut5);
      opacityBring = clamp(1.0 - tOut5);
      scaleLets = 1.0 - 0.1 * tOut5;
      scaleBring = 1.0 - 0.1 * tOut5;
      rowX5 = -120 - 100 * tOut5; // drift left
      yLets = 0;
      xBringSlide = 0;
    }

    // Phase 2 ─ "Vision to Life" enters BIG and slides DIRECTLY to the middle (duration 22 frames = 0.75s, fC56: 70–92)
    if (fC56 >= 70 && fC56 < 92) {
      const t = easeStandard(clamp((fC56 - 70) / 22));
      opacityVision = t;
      scaleVision = 1.3 - 0.3 * t; // 1.3 → 1.0
      rowXVision = 300 * (1 - t);   // slides directly to the middle (0px) in a single unified push
      yVision = 0;
    }

    // Phase 3 ─ Hold centered perfectly stable (fC56: 92–120)
    if (fC56 >= 92 && fC56 < 120) {
      opacityVision = 1.0;
      scaleVision = 1.0;
      rowXVision = 0;
      rowScale5 = 1.0;
      yVision = 0;
    }

    // Phase 4 ─ Single Unified Exit Zoom-out & Fade (fC56: 120–135)
    if (fC56 >= 120) {
      const t = easeExit(clamp((fC56 - 120) / 15));
      opacityVision = clamp(1.0 - t);
      scaleVision = 1.0;
      rowXVision = 0;
      rowScale5 = 1.0 - 0.3 * t; // smooth zoom out from 1.0 -> 0.7
      yVision = -30 * t;
    }
  }`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync(path, code, 'utf8');
  console.log("SUCCESS: Unified single push and 0.75s timing applied successfully!");
} else {
  console.log("ERROR: Regex match not found!");
}

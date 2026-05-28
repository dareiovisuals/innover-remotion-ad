import { useEffect, useRef, useState } from "react";
import { Easing, useCurrentFrame, Audio, staticFile } from "remotion";
import "./loader-styles.css";

// ── EXACT NATIVE EASING CURVES ──
const easeP1 = Easing.bezier(0.43, 0.05, 0.08, 1);
const easeP2 = Easing.bezier(0.0, 0.0, 0.2, 1);
const easeStandard = Easing.bezier(0.76, 0, 0.24, 1);
const easeLetter = Easing.bezier(0.16, 1, 0.3, 1);
const easeCss = Easing.bezier(0.25, 0.1, 0.25, 1); // standard CSS ease

export const LoaderAd: React.FC = () => {
  const frame = useCurrentFrame();
  const p1Ref = useRef<SVGPathElement>(null);
  const p2Ref = useRef<SVGPathElement>(null);

  // Dynamic measuring of SVG path lengths to guarantee 100% precise drawing bounds
  const [lengths, setLengths] = useState({ l1: 668, l2: 188 });

  useEffect(() => {
    if (p1Ref.current && p2Ref.current) {
      const len1 = Math.ceil(p1Ref.current.getTotalLength()) || 668;
      const len2 = Math.ceil(p2Ref.current.getTotalLength()) || 188;
      setLengths({ l1: len1, l2: len2 });
    }
  }, []);

  const L1 = lengths.l1;
  const L2 = lengths.l2;

  // Helper clamp function
  const clamp = (val: number, min = 0, max = 1) => Math.min(Math.max(val, min), max);

  const ENTER_DUR = 10;  // Zelios: very fast snap (0.17s)
  const EXIT_DUR  = 10;  // Zelios: very fast pull-out (0.17s)
  const easeSnap = Easing.bezier(0.16, 1, 0.3, 1);   // spring snap-in
  const easeExit = Easing.bezier(0.55, 0, 1, 0.45);   // fast decisive pull-out

  // Standard slide up transition for standalone clips (Clip 3 & 4)
  function clipReveal(clipStart: number, clipDuration: number) {
    const f = frame - clipStart;
    const exitAt = clipDuration - EXIT_DUR;
    if (f < 0 || f >= clipDuration) return { y: 105, scale: 0.93, visible: false, opacity: 1, x: 0 };
    if (f < ENTER_DUR) {
      const t = easeSnap(clamp(f / ENTER_DUR));
      return { y: 105 - 105 * t, scale: 0.93 + 0.07 * t, opacity: 1, visible: true, x: 0 };
    }
    if (f < exitAt) {
      return { y: 0, scale: 1, opacity: 1, visible: true, x: 0 };
    }
    const t = easeExit(clamp((f - exitAt) / EXIT_DUR));
    return { y: -105 * t, scale: 1 + 0.03 * t, opacity: 1, visible: true, x: 0 };
  }

  // ── COMBINED CLIP 1 & 2a & 2b DYNAMICS (F0 - F159) ──
  const fC12 = frame;
  const c12Visible = fC12 >= 0 && fC12 < 160;

  let opacityElevating = 0;
  let scaleElevating = 1.0;
  let xElevating = 0;
  let yElevating = 0;

  let opacityCorporate = 0;
  let scaleCorporate = 1.0;
  let xCorporate = 0;
  let yCorporate = 0;

  let opacityVirtual = 0;
  let scaleVirtual = 1.0;
  let xVirtual = 0;
  let yVirtual = 0;

  if (c12Visible) {
    // 1. Elevating alone centered (F0 - F50)
    if (fC12 < 50) {
      if (fC12 < 15) {
        const t = easeSnap(clamp(fC12 / 15));
        opacityElevating = t;
        scaleElevating = 0.5 + 0.5 * t;
        yElevating = 40 * (1 - t);
      } else {
        opacityElevating = 1.0;
        scaleElevating = 1.0;
        yElevating = 0;
      }
      xElevating = 0;
    }

    // 2. Corporate entrance & Elevating push-left + shrink/disappear (F50 - F75)
    if (fC12 >= 50 && fC12 < 75) {
      const t = easeSnap(clamp((fC12 - 50) / 25));
      
      // Elevating slides left, shrinks, and fades out to disappear smoothly
      opacityElevating = clamp(1.0 - t);
      scaleElevating = 1.0 - 0.4 * t;
      xElevating = -150 * t;
      yElevating = 0;

      // Corporate zooms in from smaller size, fades in, and slides to center
      opacityCorporate = t;
      scaleCorporate = 0.5 + 0.5 * t;
      xCorporate = 160 * (1 - t);
      yCorporate = 0;
    }

    // 3. Virtual Events entrance & Corporate moves to stack with focus shift (F75 - F100)
    if (fC12 >= 75 && fC12 < 100) {
      const t = easeSnap(clamp((fC12 - 75) / 25));

      // Elevating is completely gone
      opacityElevating = 0;

      // Corporate moves to the top line, shrinks to 0.8, and fades to 70% opacity
      opacityCorporate = 1.0 - 0.3 * t;
      scaleCorporate = 1.0 - 0.2 * t;
      xCorporate = 0;
      yCorporate = -24 * t;

      // Virtual Events zooms in at bottom line (24px)
      opacityVirtual = t;
      scaleVirtual = 0.5 + 0.5 * t;
      xVirtual = 100 * (1 - t);
      yVirtual = 24 * t;
    }

    // 4. Hold Corporate & Virtual Events together centered (F100 - F145)
    if (fC12 >= 100 && fC12 < 145) {
      opacityElevating = 0;

      // Corporate is held smaller and semi-transparent to shift focus to Virtual Events
      opacityCorporate = 0.7;
      scaleCorporate = 0.8;
      xCorporate = 0;
      yCorporate = -24;

      opacityVirtual = 1.0;
      scaleVirtual = 1.0;
      xVirtual = 0;
      yVirtual = 24;
    }

    // 5. Combined Zoom-Out Exit (F145 - F160)
    if (fC12 >= 145) {
      const t = easeExit(clamp((fC12 - 145) / 15));

      opacityElevating = 0;

      opacityCorporate = 0.7 * clamp(1.0 - t);
      scaleCorporate = 0.8 - 0.2 * t;
      yCorporate = -24 - 40 * t;
      xCorporate = 0;

      opacityVirtual = clamp(1.0 - t);
      scaleVirtual = 1.0 - 0.3 * t;
      yVirtual = 24 + 40 * t;
      xVirtual = 0;
    }
  }

  // ── COMBINED CLIP 5 & 6 DYNAMICS (F305 - F440) ──
  const c56Visible = frame >= 305 && frame < 440;

  let opacityLets = 0;
  let scaleLets = 1.0;
  let yLets = 0;

  let opacityBring = 0;
  let scaleBring = 1.0;
  let xBringSlide = 500;

  let rowX5 = 0;

  let opacityVision = 0;
  let scaleVision = 1.0;
  let rowXVision = 300;
  let rowScale5 = 1.0;
  let yVision = 0;

  if (c56Visible) {
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
  }

  // ── CLIP 3: FLEX-ROW WORD-BY-WORD PUSH (F160 - F280) ──
  // FIX: "Achieving" and "your" live in a flex row so CSS handles spacing — no overlap possible.
  // rowX drives the WHOLE ROW's horizontal position (offset from its centered anchor).
  // xYourSlide animates "your" sliding INTO the flex row from the right.
  const fC3 = frame;
  const c3Visible = fC3 >= 160 && fC3 < 280;

  // Whole-row position (offset FROM the naturally-centered anchor of the flex row)
  // 0 = centered on screen. Negative = shifts left.
  let rowX = 0;

  // "Achieving" word
  let opacityAchieving = 0;
  let scaleAchieving = 1.0;
  let yAchieving = 0;

  // "your" word — slides in via translateX WITHIN the flex row
  // starts at a large positive value (off-screen right) and goes to 0 (natural flex position)
  let opacityYour = 0;
  let xYourSlide = 500; // starts far right, off screen
  let scaleYour = 1.0;

  // Phrase 2: "Business Goals."
  let opacityBusiness = 0;
  let scaleBusiness = 1.0; // Will use fontSize 4.1rem for the 30% increase natively
  
  let opacityGoals = 0;
  let scaleGoals = 1.0; 
  let xGoalsSlide = 400;

  let row2X = 0;
  let row2Y = 0;
  let row2Scale = 1.0;

  if (c3Visible) {
    const f3 = fC3 - 160;

    // Phase 1a ─ "Achieving" enters alone with a smooth standard pop-out (f3: 0–20)
    if (f3 < 20) {
      const t = easeStandard(clamp(f3 / 20));
      opacityAchieving = t;
      scaleAchieving = 0.5 + 0.5 * t; // smooth scale from 0.5 to 1.0
      yAchieving = 30 * (1 - t);       // slides up smoothly
      rowX = 0;                         // centered
      xYourSlide = 500;                 // "your" off-screen right
      opacityYour = 0;
    }

    // Phase 1b ─ "your" slides into the flex row; row shifts left (the push) (f3: 20–48)
    if (f3 >= 20 && f3 < 48) {
      const t = easeSnap(clamp((f3 - 20) / 28));

      opacityAchieving = 1.0;
      scaleAchieving = 1.0;
      yAchieving = 0;

      // Row shifts left as "your" pushes in — ends up left-aligned in the viewport
      rowX = -120 * t; // 0 → -120 (shifts the whole pair left)

      opacityYour = easeSnap(t);
      scaleYour = 0.7 + 0.3 * t;       // 0.7 → 1.0
      xYourSlide = 500 * (1 - t);       // 500 → 0 (slides into natural flex position)
    }

    // Phase 1c ─ "Achieving your" holds together (f3: 48–62)
    if (f3 >= 48 && f3 < 62) {
      opacityAchieving = 1.0; scaleAchieving = 1.0; yAchieving = 0;
      opacityYour = 1.0;      scaleYour = 1.0;      xYourSlide = 0;
      rowX = -120;
    }

    // ─ EXTREMELY SMOOTH EXIT for "Achieving your" (f3: 62–90) ─
    if (f3 >= 62) {
      // Use easeStandard (starts slow, ends slow) and extend duration for a gentle drift out
      const tOut = easeStandard(clamp((f3 - 62) / 28));
      opacityAchieving = clamp(1.0 - tOut);
      opacityYour      = clamp(1.0 - tOut);
      scaleAchieving   = 1.0 - 0.1 * tOut; // very gentle scale down
      scaleYour        = 1.0 - 0.1 * tOut;
      rowX             = -120 - 100 * tOut; // short, slow drift left
      yAchieving       = 0;
      xYourSlide       = 0;
    }

    // Parallel entrance ─ "Business" enters (62-80), "Goals." enters staggered at 50% (71-89)
    if (f3 >= 62) {
      // 1. Business Word Animation (starts at 62, duration 18 frames)
      const tBus = clamp((f3 - 62) / 18);
      const easeBus = easeStandard(tBus);
      opacityBusiness = easeBus;
      scaleBusiness = 1.3 - 0.3 * easeBus;

      // 2. Goals Word Animation (starts at 71, duration 18 frames)
      const fGoals = f3 - 71;
      if (fGoals >= 0) {
        const tG = clamp(fGoals / 18);
        const easeG = easeStandard(tG);
        opacityGoals = easeG;
        scaleGoals = 1.3 - 0.3 * easeG;
        xGoalsSlide = 250 * (1 - easeG);
      } else {
        opacityGoals = 0;
        scaleGoals = 1.3;
        xGoalsSlide = 250;
      }

      // 3. Unified Push Slide to Middle (starts at 62, centered by 89)
      const tRow = clamp((f3 - 62) / 27);
      row2X = 300 * (1 - easeStandard(tRow));

      // 4. Static Hold at 100% scale (starts at 89, stays steady until 105)
      if (f3 >= 89 && f3 < 105) {
        row2Scale = 1.0; // perfectly steady at full scale
      }

      // 5. Single Unified Exit Zoom-out & Fade (starts at 105, exits fully by 120 - 15 frames duration)
      if (f3 >= 105) {
        const t = easeExit(clamp((f3 - 105) / 15));
        opacityBusiness = clamp(1.0 - t);
        opacityGoals = clamp(1.0 - t);
        scaleBusiness = 1.0; 
        scaleGoals = 1.0;
        xGoalsSlide = 0;
        row2X = 0;
        row2Scale = 1.0 - 0.3 * t; // one smooth transition from 1.0 -> 0.7
        row2Y = -30 * t;
      }
    }
  }

  // Standalone reveals
  const c4 = clipReveal(280, 35);   // "Results Matter"

  // ── NATIVE TIMINGS SHIFTED BY 450 FRAMES (7.5s) to clear 6-clip intro ──
  
  // 1. DRAWING PHASE
  // p1 starts 350ms (F21 + 450 = F471), duration 1400ms (84 frames)
  const tP1 = clamp((frame - 471) / 84);
  const strokeDashoffset1 = L1 - L1 * easeP1(tP1);

  // p2 starts 1130ms (F68 + 450 = F518), duration 420ms (25 frames)
  const tP2 = clamp((frame - 518) / 25);
  const strokeDashoffset2 = L2 - L2 * easeP2(tP2);

  // 2. FILL PHASE
  // fill starts 1800ms (F108 + 450 = F538), duration 500ms (30 frames)
  const tFill = clamp((frame - 538) / 30);
  const fillOpacity = easeCss(tFill);
  const strokeWidth = 3 - 3 * easeCss(tFill);

  // 3. PHASE 2 (Lockup details)
  // gap starts 2100ms (F126 + 450 = F556), duration 800ms (48 frames)
  const tGap = clamp((frame - 556) / 48);
  const gap = 10 * easeCss(tGap);

  // icon starts 2100ms (F126 + 450 = F556), duration 850ms (51 frames)
  const tIconSize = clamp((frame - 556) / 51);
  const iconSize = 80 - 30 * easeStandard(tIconSize);

  // wordmark starts 2100ms (F126 + 450 = F556), duration 850ms (51 frames)
  const tWordmarkWidth = clamp((frame - 556) / 51);
  const wordmarkWidth = 250 * easeStandard(tWordmarkWidth);

  // wordmark opacity starts 2100ms (F126 + 450 = F556), duration 200ms (12 frames)
  const tWordmarkOpacity = clamp((frame - 556) / 12);
  const wordmarkOpacity = easeCss(tWordmarkOpacity);

  // 4. LETTER STAGGER
  // Letters staggered by 100ms (6 frames) starting from 2200ms (F132 + 450 = F562)
  const letters = Array.from({ length: 7 }).map((_, i) => {
    const letterStart = 562 + i * 6;
    const tLetter = clamp((frame - letterStart) / 39); // 650ms = 39 frames
    const hasStarted = frame >= letterStart;
    
    return {
      opacity: hasStarted ? easeLetter(tLetter) : 0,
      translateX: hasStarted ? -22 + 22 * easeLetter(tLetter) : -22
    };
  });

  // 5. TAGS WIPE IN
  // Top tag starts 2000ms (F120 + 450 = F550), duration 900ms (54 frames)
  const tTagTop = clamp((frame - 550) / 54);
  const tagTopWipe = 100 - 100 * easeStandard(tTagTop);

  // Bottom tag starts 2100ms (F126 + 450 = F556), duration 900ms (54 frames)
  const tTagBottom = clamp((frame - 556) / 54);
  const tagBottomWipe = 100 - 100 * easeStandard(tTagBottom);

  // 6. SWEEP LINE
  // Starts 150ms (F9 + 450 = F439), duration 3000ms (180 frames)
  const tSweep = clamp((frame - 439) / 180);
  const sweepWidth = 100 * easeStandard(tSweep);
  let sweepOpacity = 1;
  if (frame >= 583) {
    sweepOpacity = clamp(1 - (frame - 583) / 36); // fades in final 600ms (36 frames)
  }

  // 7. GLOW ANIMATION
  let glowOpacity = 0;
  let glowRadius = 0;
  if (frame >= 520) {
    if (frame < 604) {
      const tGlow = clamp((frame - 520) / 84);
      glowOpacity = 0.4 * easeCss(tGlow);
      glowRadius = 28 * easeCss(tGlow);
    } else {
      const tGlow = clamp((frame - 604) / 42);
      glowOpacity = 0.4 - 0.25 * easeCss(tGlow);
      glowRadius = 28 - 14 * easeCss(tGlow);
    }
  }

  // 8. CINEMATIC EXIT PHASE
  // Starts 3600ms (F216 + 450 = F646). French & English tags fade out (24 frames / 400ms).
  const tTagExit = clamp((frame - 646) / 24);
  const exitTagOpacity = 1 - easeCss(tTagExit);

  // ── RESOLUTION & TIMELINE VALUES ──
  const activeGap = gap;
  const activeIconWidth = iconSize;
  const activeIconOpacity = 1;
  const activeWordmarkWidth = wordmarkWidth;
  const activeWordmarkOpacity = wordmarkOpacity;

  return (
    <div className="loader-container">
      
      {/* Pre-wired Audio (Plays music.WAV placed in the public folder) */}
      <Audio src={staticFile("music.WAV")} volume={0.8} />
      
      {/* Background Radial Glow */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.02) 0%, rgba(6, 10, 22, 0) 70%)",
          pointerEvents: "none"
        }}
      />

      {/* Main Lockup Wrapper */}
      <div 
        className="loader-inner"
        style={{
          transform: "scale(2.0)",
          transformOrigin: "center center"
        }}
      >
        
        {/* Top Tag: Événements */}
        <div 
          className="loader-tag loader-tag-top"
          style={{
            clipPath: `inset(0px ${tagTopWipe}% 0px 0px)`,
            opacity: exitTagOpacity,
            marginBottom: 6
          }}
        >
          <span className="loader-label">Événements</span>
          <div className="loader-tag-line" />
        </div>

        {/* Center Lockup: Icon + Brand Name */}
        <div 
          className="loader-lockup" 
          style={{ 
            gap: activeGap,
          }}
        >
          {/* Animated SVG Icon */}
          <div 
            className="loader-icon"
            style={{
              width: activeIconWidth,
              height: activeIconWidth,
              opacity: activeIconOpacity,
            }}
          >
            <svg 
              viewBox="361 357 275 282" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter: glowRadius > 0 ? `drop-shadow(0 0 ${glowRadius}px rgba(255, 255, 255, ${glowOpacity}))` : "none"
              }}
            >
              <path 
                ref={p1Ref}
                className="li-p1"
                d="M447.661 589.433C443.23 583.655 416.282 549.917 452.464 513.45C526.066 439.269 527.078 439.699 527.957 435.784C531.369 420.593 471.246 405.383 442.062 448.156C424.016 474.604 433.585 500.817 433.909 503.363C434.064 504.583 433.829 504.737 415.909 522.581C399.847 538.574 398.745 540.458 397.435 538.009C353.128 455.16 419.654 369.072 498.704 372.587C561.56 375.382 582.255 416.654 575.46 445.897C569.893 469.858 553.814 478.547 485.785 547.788C469.798 564.059 521.456 579.299 551.541 557.728C591.781 528.875 576.285 485.692 577.275 483.987C577.89 482.928 611.196 449.845 611.249 449.809C614.424 447.668 620.485 466.258 620.993 467.816C653.083 566.235 555.231 640.047 478.005 609.61C457.599 601.567 451.325 593.08 447.66 589.434L447.661 589.433Z" 
                style={{
                  strokeDasharray: `${L1} ${L1}`,
                  strokeDashoffset: strokeDashoffset1,
                  fill: "#ffffff",
                  fillOpacity: fillOpacity,
                  strokeWidth: strokeWidth,
                  stroke: "#FAD928"
                }}
              />
              <path 
                ref={p2Ref}
                className="li-p2"
                d="M376.263 589.988L393.268 572.983C397.961 568.29 405.581 568.29 410.273 572.983L427.278 589.988C431.971 594.681 431.971 602.301 427.278 606.993L410.273 623.998C405.58 628.691 397.96 628.691 393.268 623.998L376.263 606.993C371.57 602.3 371.57 594.68 376.263 589.988Z" 
                style={{
                  strokeDasharray: `${L2} ${L2}`,
                  strokeDashoffset: strokeDashoffset2,
                  fill: "#ffffff",
                  fillOpacity: fillOpacity,
                  strokeWidth: strokeWidth,
                  stroke: "#FAD928"
                }}
              />
            </svg>
          </div>

          {/* Staggered Wordmark */}
          <div 
            className="loader-wordmark"
            style={{
              width: activeWordmarkWidth,
              opacity: activeWordmarkOpacity,
            }}
          >
            <svg viewBox="108 435 782 128" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 250 }}>
              {/* letter I */}
              <path 
                fillRule="evenodd" 
                clipRule="evenodd"
                d="M137.945 450.209V549.507C137.945 552.202 135.757 554.391 133.061 554.391H123.294C120.599 554.391 118.41 552.203 118.41 549.507V450.209C118.41 447.514 120.598 445.325 123.294 445.325H133.061C135.756 445.325 137.945 447.513 137.945 450.209Z" 
                style={{
                  opacity: letters[0].opacity,
                  transform: `translateX(${letters[0].translateX}px)`,
                }}
              />
              {/* letter N */}
              <path 
                fillRule="evenodd" 
                clipRule="evenodd"
                d="M167.246 480.198C167.2 475.766 167.15 471.065 167.095 466.078C166.936 451.658 165.79 445.703 170.82 445.503C171.237 445.387 171.676 445.325 172.13 445.325H181.897C182.668 445.325 183.398 445.504 184.047 445.823C185.61 446.194 186.165 446.859 186.247 447.988C186.588 448.654 186.78 449.409 186.78 450.208V457.81C187.281 459.26 188.161 460.27 189.683 460.289C192.393 460.323 199.972 459.593 200.897 463.666C201.239 465.169 200.595 469.609 201.286 472.552C201.617 473.964 202.256 475.031 203.458 475.265C207.596 476.069 214.383 473.479 214.569 479.112C214.574 479.27 213.478 489.056 217.326 489.109C224.701 489.209 228.134 487.229 228.405 494.578C228.617 500.316 226.61 508.736 231.977 509.4C235.634 509.852 239.813 507.73 240.274 514.904C240.3 515.306 240.296 515.276 240.57 519.932C241.468 520.109 242.261 520.082 242.959 519.87V450.492C242.959 450.083 243.009 449.686 243.104 449.306L243.114 448.981C243.232 445.418 246.236 444.994 256.339 445.608H257.61C258.045 445.608 258.467 445.665 258.869 445.772L259.663 445.827C260.51 445.886 261.095 446.065 261.499 447.54C262.123 448.36 262.493 449.383 262.493 450.492V500.719C262.634 516.994 263.128 552.284 262.128 552.357L261.746 552.385C260.881 553.759 259.351 554.673 257.609 554.673H247.842C246.809 554.673 245.85 554.351 245.06 553.803C243.967 553.629 243.302 553.21 243.128 552.417C243.027 551.955 243.003 551.306 243.016 550.539C242.978 550.295 242.959 550.044 242.959 549.789V541.766C242.599 539.999 241.795 538.743 240.124 538.73C237.019 538.706 229.381 540.151 228.633 536.093C228.252 534.025 229.897 524.849 225.472 524.862C217.961 524.884 217.09 525.535 215.916 522.954C213.786 518.272 218.176 506.491 211.649 505.956C208.784 505.721 201.631 506.781 201.377 501.047C201.056 493.82 204.211 491.098 196.983 490.831C194.725 490.747 189.225 492.335 189.139 483.978C189.134 483.448 189.054 475.815 186.78 477.543V549.505C186.78 550.791 186.282 551.961 185.469 552.833C185.282 553.53 185.063 553.943 184.807 554.029C184.722 554.057 184.242 554.089 183.496 554.12C182.995 554.294 182.457 554.388 181.897 554.388H172.13C171.59 554.388 171.07 554.3 170.584 554.138C169.502 554.074 168.762 553.979 168.602 553.844C168.373 553.651 168.22 553.486 168.109 552.273C167.566 551.486 167.248 550.532 167.248 549.504V480.195L167.246 480.198Z" 
                style={{
                  opacity: letters[1].opacity,
                  transform: `translateX(${letters[1].translateX}px)`,
                }}
              />
              {/* letter N */}
              <path 
                fillRule="evenodd" 
                clipRule="evenodd"
                d="M291.502 480.198C291.456 475.766 291.406 471.065 291.351 466.078C291.192 451.658 290.046 445.703 295.076 445.503C295.493 445.387 295.932 445.325 296.386 445.325H306.153C306.924 445.325 307.654 445.504 308.303 445.823C309.866 446.194 310.421 446.859 310.503 447.988C310.844 448.654 311.036 449.409 311.036 450.208V457.81C311.537 459.26 312.417 460.27 313.939 460.289C316.649 460.323 324.228 459.593 325.153 463.666C325.495 465.169 324.851 469.609 325.542 472.552C325.873 473.964 326.512 475.031 327.714 475.265C331.852 476.069 338.639 473.479 338.825 479.112C338.83 479.27 337.734 489.056 341.582 489.109C348.957 489.209 352.39 487.229 352.661 494.578C352.873 500.316 350.866 508.736 356.233 509.4C359.89 509.852 364.069 507.73 364.53 514.904C364.556 515.306 364.552 515.276 364.826 519.932C365.724 520.109 366.517 520.082 367.215 519.87V450.492C367.215 450.083 367.265 449.686 367.36 449.306L367.37 448.981C367.488 445.418 370.492 444.994 380.595 445.608H381.866C382.301 445.608 382.723 445.665 383.125 445.772L383.919 445.827C384.766 445.886 385.351 446.065 385.755 447.54C386.379 448.36 386.749 449.383 386.749 450.492V500.719C386.89 516.994 387.384 552.284 386.384 552.357L386.002 552.385C385.137 553.759 383.607 554.673 381.865 554.673H372.098C371.065 554.673 370.106 554.351 369.316 553.803C368.223 553.629 367.558 553.21 367.384 552.417C367.283 551.955 367.259 551.306 367.272 550.539C367.234 550.295 367.215 550.044 367.215 549.789V541.766C366.855 539.999 366.051 538.743 364.38 538.73C361.275 538.706 353.637 540.151 352.889 536.093C352.508 534.025 354.153 524.849 349.728 524.862C342.217 524.884 341.346 525.535 340.172 522.954C338.042 518.272 342.432 506.491 335.905 505.956C333.04 505.721 325.887 506.781 325.633 501.047C325.312 493.82 328.467 491.098 321.239 490.831C318.981 490.747 313.481 492.335 313.395 483.978C313.39 483.448 313.31 475.815 311.036 477.543V549.505C311.036 550.791 310.538 551.961 309.725 552.833C309.538 553.53 309.319 553.943 309.063 554.029C308.978 554.057 308.498 554.089 307.752 554.12C307.251 554.294 306.713 554.388 306.153 554.388H296.386C295.846 554.388 295.326 554.3 294.84 554.138C293.758 554.074 293.018 553.979 292.858 553.844C292.629 553.651 292.476 553.486 292.365 552.273C291.822 551.486 291.504 550.532 291.504 549.504V480.195L291.502 480.198Z" 
                style={{
                  opacity: letters[2].opacity,
                  transform: `translateX(${letters[2].translateX}px)`,
                }}
              />
              {/* letter O */}
              <path 
                fillRule="evenodd" 
                clipRule="evenodd"
                d="M494.523 554.621C493.171 554.564 442.231 554.303 441.571 554.331C436.852 554.53 440.017 538.233 438.2 538.252C435.631 538.279 432.198 538.264 432.05 538.274C430.176 538.402 425.198 538.848 425.146 535.669C425.118 533.946 426.307 521.802 424.211 522.171C422.751 521.529 416.313 522.468 415.678 520.881C415.12 519.486 415.384 515.657 415.38 499.696H415.412C415.408 484.378 415.162 480.65 415.71 479.278C416.345 477.691 422.783 477.815 424.243 477.988C425.524 476.728 425.15 466.213 425.178 464.49C425.23 461.31 430.209 461.757 432.082 461.885C432.23 461.895 435.663 461.881 438.232 461.907C440.049 461.926 436.88 445.757 441.603 445.828C445.397 445.885 491.454 446.146 494.555 446.118C499.278 446.076 496.109 462.216 497.926 462.197C500.495 462.17 503.928 462.185 504.076 462.175C505.95 462.047 510.928 461.601 510.98 464.78C511.008 466.503 510.633 476.205 511.915 478.278C513.375 478.106 519.813 477.981 520.448 479.568C521.006 480.963 520.742 484.792 520.746 500.753H520.714C520.718 516.071 520.964 519.799 520.416 521.171C519.781 522.758 513.343 522.634 511.883 522.461C510.602 523.721 510.976 534.236 510.948 535.959C510.896 539.139 505.917 538.692 504.044 538.564C503.896 538.554 500.463 538.568 497.894 538.542C496.077 538.523 499.242 554.82 494.523 554.621Z" 
                style={{
                  opacity: letters[3].opacity,
                  transform: `translateX(${letters[3].translateX}px)`,
                }}
              />
              {/* letter V */}
              <path 
                fillRule="evenodd" 
                clipRule="evenodd"
                d="M600.336 549.652C599.979 550.149 599.553 550.368 598.976 550.372C597.356 550.383 590.642 550.505 589.302 550.328C585.756 549.861 586.767 549.886 586.514 536.117C586.455 532.926 585.36 533.673 576.974 533.388C574.628 533.388 576.417 520.402 574.831 513.063C574.747 512.675 564.717 512.921 564.069 512.909C560.472 512.84 562.682 506.843 562.079 489.368C562.007 487.272 560.098 488.083 552.662 487.832C549.926 487.74 551.235 469.434 550.581 466.305C549.95 463.285 540.55 464.782 539.81 464.515C537.749 463.771 539.012 448.687 539.127 447.243C539.208 446.229 543.781 446.722 559.922 446.818C562.866 446.835 561.502 450.006 562.084 464.385C562.195 467.14 563.778 465.834 572.08 466.151C574.515 466.244 572.942 478.503 573.363 488.25C573.465 490.604 584.436 488.833 584.934 490.071C585.484 491.437 585.414 497.245 585.1 498.713C585.064 501.186 584.848 507.735 584.848 507.735C584.848 507.735 585.51 512.977 588.426 512.955C590.384 512.941 594.83 512.856 595.732 512.898C597.082 512.962 596.358 525.865 596.358 525.865C596.274 531.824 596.454 522.764 596.398 528.663C596.368 531.84 596.826 533.486 600.325 532.873L600.335 532.87V532.591C600.388 532.562 600.444 532.525 600.505 532.482C601.843 531.532 619.635 484.287 621.154 480.133C631.612 451.532 630.246 454.85 631.708 451.111C632.907 448.044 635.869 448.291 635.63 448.178C635.564 448.147 636.103 448.029 636.999 447.896H647.295C648.226 448.174 648.905 448.598 649.148 449.22C649.614 450.408 649.841 451.98C649.841 453.789 648.27 454.239 645.343 455.29C636.575 458.436 634.819 460.538 616.475 507.846C612.13 519.05 606.855 532.79 600.336 549.68V549.652Z" 
                style={{
                  opacity: letters[4].opacity,
                  transform: `translateX(${letters[4].translateX}px)`,
                }}
              />
              {/* letter E */}
              <path 
                fillRule="evenodd" 
                clipRule="evenodd"
                d="M724.701 505.572C723.539 504.507 723.554 504.504 723.446 504.422C718.176 500.433 706.72 501.7 706.391 501.836C705.61 502.157 705.608 508.625 705.607 509.218C705.596 537.698 704.563 542.977 710.556 543.862C739.919 548.201 747.028 526.809 748.382 523.716C751.767 515.979 749.346 512.153 756.88 512.488C758.426 512.557 757.958 516.984 757.916 517.382C754.726 547.564 758.255 550.309 754.44 550.255C688.53 549.322 688.602 550.487 669.754 550.258C668.105 550.238 668.322 546.244 668.342 545.877C668.643 540.338 683.272 550.942 683.625 532.009C683.625 532.008 683.629 466.376 683.621 466.082C683.282 453.176 677.643 454.558 669.809 453.731C666.395 453.371 668.225 449.413 668.389 449.058C669.339 447.003 706.124 449.501 747.927 448.15C750.912 448.054 749.276 450.751 750.985 470.171C751.535 476.416 754.195 479.773 747.893 479.407C744.147 479.189 745.229 459.656 729.12 455.041C723.873 453.538 706.77 454.234 706.273 454.462C705.607 454.768 705.607 461.405 705.607 462.011C705.606 494.917 705.226 496.134 707.234 496.181C718.561 496.45 725.846 496.32 729.43 480.782C731.182 473.186 735.367 478.674 735.352 479.101C734.006 517.709 738.051 519.639 734.822 520.301C727.265 521.851 732.063 513.221 724.701 505.572Z" 
                 style={{
                   opacity: letters[5].opacity,
                   transform: `translateX(${letters[5].translateX}px)`,
                 }}
               />
               {/* letter R */}
               <path 
                 fillRule="evenodd" 
                 clipRule="evenodd"
                 d="M838.78 499.583L838.543 500.271C838.577 500.365 837.727 500.792 838.781 500.93C876.271 505.843 856.555 548.608 876.242 542.035C877.276 541.69 879.352 539.92 879.918 540.539C883.307 544.242 881.182 545.871 876.781 548.817C872.721 551.535 851.119 558.796 844.478 540.119C839.324 525.623 842.029 503.565 824.901 503.184C819.323 503.06 813.251 502.26 813.235 505.142C813.053 539.195 812.753 542.232 819.12 543.611C825.83 545.064 830.292 542.414 828.557 549.056C827.643 552.555 825.739 548.97 783.367 550.068C778.046 550.206 775.589 551.216 776.091 545.854C776.529 541.183 791.084 550.546 791.256 532.818C791.904 466.081 791.947 466.037 790.773 460.361C788.946 451.53 776.269 455.648 776.057 452.24C775.704 446.577 778.519 448.303 784.174 448.412C822.458 449.153 869.466 440.91 865.995 477.421C864.277 495.496 841.552 499.137 838.78 499.582V499.583ZM838.219 492.605C848.858 483.251 846.961 463.229 835.268 455.901C833.847 455.439 831.013 453.657 821.617 453.629C820.949 453.627 813.533 453.605 813.333 454.636C812.713 457.836 813.113 457.865 813.235 495.385C813.239 496.703 813.45 498.26 825.659 497.485C830.955 497.149 835.119 495.329 838.218 492.604L838.219 492.605Z" 
                 style={{
                   opacity: letters[6].opacity,
                   transform: `translateX(${letters[6].translateX}px)`,
                 }}
               />
             </svg>
           </div>
         </div>
 
         {/* Bottom Tag: Events */}
         <div 
           className="loader-tag loader-tag-bottom"
           style={{
             clipPath: `inset(0px 0px 0px ${tagBottomWipe}%)`,
             opacity: exitTagOpacity,
             marginTop: 6
           }}
         >
           <div className="loader-tag-line" />
           <span className="loader-label">Events</span>
         </div>
 
       </div>
 
       {/* Sweeping Line */}
       <div 
         className="loader-line" 
         style={{
           width: `${sweepWidth}%`,
           opacity: sweepOpacity
         }}
       />
 
        {/* ── 6-CLIP ZELIOS-STYLE KINETIC TYPOGRAPHY INTRO ── */}
        {frame < 440 && (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}>

            {/* Combined Clip 1 & 2a & 2b Layout (Kinetic Centered Stack) */}
             {c12Visible && (
                <div className="intro-left-container">
                  {opacityElevating > 0 && (
                    <span 
                      className="intro-clip-text" 
                      style={{ 
                        transform: `translateX(${xElevating}px) translateY(${yElevating}px) scale(${scaleElevating})`,
                        opacity: opacityElevating,
                        position: "absolute",
                        left: 0,
                        color: "#ffffff",
                        willChange: "transform, opacity",
                        transformOrigin: "left center"
                      }}
                    >
                      Elevating
                    </span>
                  )}
                  {opacityCorporate > 0 && (
                    <span 
                      className="intro-clip-text intro-gradient-text" 
                      style={{ 
                        transform: `translateX(${xCorporate}px) translateY(${yCorporate}px) scale(${scaleCorporate})`,
                        opacity: opacityCorporate,
                        position: "absolute",
                        left: 0,
                        willChange: "transform, opacity",
                        transformOrigin: "left center"
                      }}
                    >
                      Corporate
                    </span>
                  )}
                  {opacityVirtual > 0 && (
                    <span 
                      className="intro-clip-text intro-gradient-text" 
                      style={{ 
                        transform: `translateX(${xVirtual}px) translateY(${yVirtual}px) scale(${scaleVirtual})`,
                        opacity: opacityVirtual,
                        position: "absolute",
                        left: 0,
                        willChange: "transform, opacity",
                        transformOrigin: "left center"
                      }}
                    >
                      Virtual Events
                    </span>
                  )}
                </div>
             )}

             {/* Clip 3: Achieving your Business Goals (2-Phrase Kinetic Transition) */}
             {c3Visible && (
               <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>

                 {/* "Achieving your" — flex ROW so CSS handles word spacing, zero overlap possible */}
                 {(opacityAchieving > 0 || opacityYour > 0) && (
                   <div
                     style={{
                       position: "absolute",
                       display: "flex",
                       flexDirection: "row",
                       alignItems: "center",
                       gap: "0.75em",
                       whiteSpace: "nowrap",
                       transform: `translateX(${rowX}px)`,
                       willChange: "transform"
                     }}
                   >
                     {/* Word 1: "Achieving" */}
                     <span
                       className="intro-clip-text"
                       style={{
                         display: "inline-block",
                         opacity: opacityAchieving,
                         transform: `translateY(${yAchieving}px) scale(${scaleAchieving})`,
                         color: "#ffffff",
                         willChange: "transform, opacity",
                         transformOrigin: "center center"
                       }}
                     >
                       Achieving
                     </span>
                     {/* Word 2: "your" — slides in from the right via its own translateX */}
                     <span
                       className="intro-clip-text"
                       style={{
                         display: "inline-block",
                         opacity: opacityYour,
                         transform: `translateX(${xYourSlide}px) scale(${scaleYour})`,
                         color: "#ffffff",
                         willChange: "transform, opacity",
                         transformOrigin: "center center"
                       }}
                     >
                       your
                     </span>
                   </div>
                 )}

                 {/* Phrase 2: "Business Goals." — flex ROW with a single unified gradient */}
                  {(opacityBusiness > 0 || opacityGoals > 0) && (
                    <div
                      style={{
                        position: "absolute",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "1em",
                        whiteSpace: "nowrap",
                        transform: `translateX(${row2X}px) translateY(${row2Y}px) scale(${row2Scale})`,
                        willChange: "transform"
                      }}
                    >
                      {/* Word 1: "Business" — transitions from Blue to Yellow */}
                      <span
                        className="intro-clip-text"
                        style={{
                          fontSize: "4.8rem",
                          display: "inline-block",
                          opacity: opacityBusiness,
                          transform: `scale(${scaleBusiness})`,
                          background: "linear-gradient(to right, #1E4ED8 0%, #FAD928 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          willChange: "transform, opacity",
                          transformOrigin: "center center"
                        }}
                      >
                        Business
                      </span>
                      {/* Word 2: "Goals." — transitions from Yellow to White */}
                      <span
                        className="intro-clip-text"
                        style={{
                          fontSize: "4.8rem",
                          display: "inline-block",
                          opacity: opacityGoals,
                          transform: `translateX(${xGoalsSlide}px) scale(${scaleGoals})`,
                          background: "linear-gradient(to right, #FAD928 0%, #F8FAFC 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          willChange: "transform, opacity",
                          transformOrigin: "center center"
                        }}
                      >
                        Goals.
                      </span>
                    </div>
                  )}

               </div>
             )}

             {/* Clip 4: Results Matter */}
             {c4.visible && (
                <div 
                  className="intro-clip-mask" 
                  style={{ 
                    transform: `scale(${c4.scale})`,
                    position: "absolute"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "0.22em",
                      transform: `translateY(${c4.y}%)`,
                      fontSize: "4.8rem",
                      willChange: "transform"
                    }}
                  >
                    <span className="intro-clip-text" style={{ color: "#FAD928" }}>
                      Results
                    </span>
                    <span className="intro-clip-text" style={{ color: "#F8FAFC" }}>
                      Matter
                    </span>
                  </div>
                </div>
             )}

             {/* Combined Clip 5 & 6 Layout (Kinetic Centered Stack) */}
             {c56Visible && (
               <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  
                  {/* Top Line: "Let's Bring your" — flex ROW to match Clip 3's gap and kinetics */}
                  {(opacityLets > 0 || opacityBring > 0) && (
                    <div
                      style={{
                        position: "absolute",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "0.75em", // EXACT same gap as Achieving your!
                        whiteSpace: "nowrap",
                        transform: `translateX(${rowX5}px)`,
                        willChange: "transform"
                      }}
                    >
                      {/* Word 1: "Let's" */}
                      <span
                        className="intro-clip-text"
                        style={{
                          display: "inline-block",
                          opacity: opacityLets,
                          transform: `translateY(${yLets}px) scale(${scaleLets})`,
                          color: "#ffffff",
                          willChange: "transform, opacity",
                          transformOrigin: "center center"
                        }}
                      >
                        Let's
                      </span>
                      {/* Word 2: "Bring your" */}
                      <span
                        className="intro-clip-text"
                        style={{
                          display: "inline-block",
                          opacity: opacityBring,
                          transform: `translateX(${xBringSlide}px) scale(${scaleBring})`,
                          color: "#ffffff",
                          willChange: "transform, opacity",
                          transformOrigin: "center center"
                        }}
                      >
                        Bring your
                      </span>
                    </div>
                  )}

                  {opacityVision > 0 && (
                    <span 
                      className="intro-clip-text intro-gradient-text" 
                      style={{ 
                        fontSize: "4.8rem", // 50% bigger to match Business Goals!
                        transform: `translateX(${rowXVision}px) translateY(${yVision}px) scale(${scaleVision * rowScale5})`,
                        opacity: opacityVision,
                        position: "absolute",
                        whiteSpace: "nowrap",
                        willChange: "transform, opacity",
                        transformOrigin: "center center"
                      }}
                    >
                      Vision to Life
                    </span>
                  )}
                </div>
             )}

          </div>
        )}
 
     </div>
   );
 };

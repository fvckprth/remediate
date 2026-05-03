"use client";

import { useEffect, useState, useRef } from "react";

// ── Pear logo ────────────────────────────────────────────────
function PearLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 695 901" fill="currentColor" className={className}>
      <path d="M322.619 0C334.388 1.07153 353.969 15.059 360.833 24.7604C362.352 26.9059 362.578 30.2723 361.115 32.5385C356.235 40.087 350.106 46.7097 345.091 54.2263C332.122 73.9082 322.178 95.4222 315.59 118.052C322.656 110.681 333.341 96.9382 339.856 88.9911C414.159 -1.67528 531.483 -20.1338 622.698 58.9998C644.9 78.2611 669 101.091 694.313 117.855C694.08 118.022 693.854 118.188 693.621 118.354C630.676 159.567 549.252 175.785 477.257 149.835C455.343 141.933 436.6 131.487 416.394 120.055C407.711 115.143 395.931 110.923 386.158 108.988C357.968 103.404 324.009 118.31 309.859 143.437C309.087 144.807 307.153 156.138 306.73 158.424C389.526 179.658 394.804 260.509 411.11 329.684C415.249 345.334 419.957 361.92 426.191 376.858C455.955 448.187 508.846 508.352 526.688 585.196C529.682 598.11 533.32 615.224 533.454 628.462C537.361 685.087 521.986 741.371 489.821 788.138C449.63 845.162 388.363 883.805 319.588 895.518C246.378 908.579 164.419 894.287 103.906 851.475C-1.23044 777.098 -30.4723 627.69 34.1106 517.438C44.4273 499.829 56.2484 480.761 68.8576 464.762C107.618 415.582 138.414 365.465 153.421 303.992C161.471 272.116 171.992 233.284 190.999 205.637C211.025 176.508 235.85 162.091 270.612 156.058C270.711 147.858 273.053 127.097 274.559 118.539C280.774 83.2232 291.667 47.1101 310.349 16.2898C313.796 10.607 317.182 3.81588 322.619 0Z" />
    </svg>
  );
}

// ── Animated cursor ──────────────────────────────────────────
function AnimatedCursor({ x, y, clicking, crosshair = false }: { x: number | string; y: number | string; clicking: boolean; crosshair?: boolean }) {
  const left = typeof x === "number" ? `${x}%` : x;
  const top = typeof y === "number" ? `${y}%` : y;
  return (
    <div
      data-mock-cursor
      className="absolute z-[60] pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ left, top }}
    >
      {crosshair ? (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          strokeLinecap="round"
          className="drop-shadow-lg -translate-x-3 -translate-y-3"
        >
          <g stroke="black" strokeWidth="4" strokeLinecap="round">
            <line x1="12" y1="4" x2="12" y2="20" />
            <line x1="4" y1="12" x2="20" y2="12" />
          </g>
          <g stroke="white" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="4" x2="12" y2="20" />
            <line x1="4" y1="12" x2="20" y2="12" />
          </g>
        </svg>
      ) : (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="#0a0a0a"
          stroke="white"
          strokeWidth="1.5"
          className={`drop-shadow-lg transition-transform duration-150 ${clicking ? "scale-[0.85]" : "scale-100"}`}
        >
          <path d="M5 3l14 8-6.5 1.5L11 19z" />
        </svg>
      )}
    </div>
  );
}

// ── Icons (exact paths from package/src/components/icons.tsx) ──
function Icon({ size = 20, d }: { size?: number; d: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d={d} />
    </svg>
  );
}

function ScanLine({ size = 20 }: { size?: number }) {
  return <Icon size={size} d="M4 15a1 1 0 0 1 .993.883L5 16v3h4a1 1 0 0 1 .117 1.993L9 21H5a2 2 0 0 1-1.995-1.85L3 19v-3a1 1 0 0 1 1-1m16 0a1 1 0 0 1 1 1v3a2 2 0 0 1-2 2h-4a1 1 0 1 1 0-2h4v-3a1 1 0 0 1 1-1m0-4a1 1 0 0 1 .117 1.993L20 13H4a1 1 0 0 1-.117-1.993L4 11zM9 3a1 1 0 0 1 0 2H5v3a1 1 0 0 1-2 0V5a2 2 0 0 1 2-2zm10 0a2 2 0 0 1 2 2v3a1 1 0 1 1-2 0V5h-4a1 1 0 1 1 0-2z" />;
}

function Cursor3Fill({ size = 20 }: { size?: number }) {
  return <Icon size={size} d="M10 3a1 1 0 0 0-2 0v2a1 1 0 0 0 2 0zM5.464 4.05A1 1 0 1 0 4.05 5.464L5.464 6.88A1 1 0 1 0 6.88 5.464zm4.327 4.16c-.978-.326-1.907.603-1.582 1.58l3.533 10.598c.357 1.072 1.84 1.158 2.319.134l2.055-4.406 4.406-2.055c1.024-.478.938-1.962-.134-2.319zm4.159-4.16a1 1 0 0 1 0 1.414L12.536 6.88a1 1 0 1 1-1.415-1.415l1.415-1.414a1 1 0 0 1 1.414 0M2 9a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1m4.879 3.536a1 1 0 1 0-1.415-1.415L4.05 12.536a1 1 0 1 0 1.414 1.414z" />;
}

function PenFill({ size = 20 }: { size?: number }) {
  return <Icon size={size} d="m14.295 4.98 4.724 4.725a2 2 0 0 1 .443 2.157l-2.365 5.913a2 2 0 0 1-1.605 1.24l-5.079.635q-.196.023-.41.056l-.444.072-.232.042-.723.14-.495.105-.745.168-.955.228-1.552.396-.646.174a1.01 1.01 0 0 1-1.265-1.134l.034-.146.295-1.112.264-1.048.228-.955.167-.745.105-.496.141-.722.08-.457.064-.428.66-5.28a2 2 0 0 1 1.241-1.605l5.913-2.365a2 2 0 0 1 2.157.443Zm-3.71 5.605a2 2 0 0 0-.507 1.968 1 1 0 0 0-.2.154L5.82 16.765a.2.2 0 0 0-.053.098l-.089.385-.178.743-.086.351a.2.2 0 0 0 .244.244l.717-.175.763-.178a.2.2 0 0 0 .097-.054l4.058-4.058a1 1 0 0 0 .154-.199 2 2 0 1 0-.861-3.337Zm4.658-7.484a1 1 0 0 1 1.32-.084l.094.084L20.9 7.343a1 1 0 0 1-1.32 1.498l-.095-.084-4.242-4.242a1 1 0 0 1 0-1.414" />;
}

function CloseLine({ size = 20 }: { size?: number }) {
  return <Icon size={size} d="m12 13.414 5.657 5.657a1 1 0 0 0 1.414-1.414L13.414 12l5.657-5.657a1 1 0 0 0-1.414-1.414L12 10.586 6.343 4.929A1 1 0 0 0 4.93 6.343L10.586 12l-5.657 5.657a1 1 0 1 0 1.414 1.414z" />;
}

function SendFill({ size = 20 }: { size?: number }) {
  return <Icon size={size} d="M18.314 3.766c1.195-.433 2.353.725 1.92 1.92l-5.282 14.605c-.434 1.198-2.07 1.344-2.709.241l-3.217-5.558-5.558-3.217c-1.103-.639-.957-2.275.241-2.709z" />;
}

function Delete2Fill({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.28 2a2 2 0 0 1 1.897 1.368L16.72 5H20a1 1 0 1 1 0 2l-.003.071-.867 12.143A3 3 0 0 1 16.138 22H7.862a3 3 0 0 1-2.992-2.786L4.003 7.07 4 7a1 1 0 0 1 0-2h3.28l.543-1.632A2 2 0 0 1 9.721 2zM9 10a1 1 0 0 0-.993.883L8 11v6a1 1 0 0 0 1.993.117L10 17v-6a1 1 0 0 0-1-1m6 0a1 1 0 0 0-1 1v6a1 1 0 1 0 2 0v-6a1 1 0 0 0-1-1m-.72-6H9.72l-.333 1h5.226z" />
    </svg>
  );
}

function CheckLine({ size = 20 }: { size?: number }) {
  return <Icon size={size} d="M21.192 5.465a1 1 0 0 1 0 1.414L9.95 18.122a1.1 1.1 0 0 1-1.556 0l-5.586-5.586a1 1 0 1 1 1.415-1.415l4.95 4.95L19.777 5.465a1 1 0 0 1 1.414 0Z" />;
}

function CameraFill({ size = 20 }: { size?: number }) {
  return <Icon size={size} d="M19 3a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm-7 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10m0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6m7-3h-1a1 1 0 0 0-.117 1.993L18 8h1a1 1 0 0 0 .117-1.993z" />;
}

function CamcorderFill({ size = 20 }: { size?: number }) {
  return <Icon size={size} d="M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.21l2.094 1.29A1.25 1.25 0 0 0 22 16.018V7.984a1.25 1.25 0 0 0-1.906-1.065L18 8.21V6a2 2 0 0 0-2-2z" />;
}

function Message4Fill({ size = 20 }: { size?: number }) {
  return <Icon size={size} d="M19 3a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7.333L4 21.5c-.824.618-2 .03-2-1V6a3 3 0 0 1 3-3zm-8 9H8a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2m5-4H8a1 1 0 0 0-.117 1.993L8 10h8a1 1 0 0 0 .117-1.993z" />;
}

function VoiceFill({ size = 20 }: { size?: number }) {
  return <Icon size={size} d="M12 2.5a1.5 1.5 0 0 1 1.493 1.356L13.5 4v16a1.5 1.5 0 0 1-2.993.144L10.5 20V4A1.5 1.5 0 0 1 12 2.5m-4 3A1.5 1.5 0 0 1 9.5 7v10a1.5 1.5 0 0 1-3 0V7A1.5 1.5 0 0 1 8 5.5m8 0A1.5 1.5 0 0 1 17.5 7v10a1.5 1.5 0 0 1-3 0V7A1.5 1.5 0 0 1 16 5.5m-12 3A1.5 1.5 0 0 1 5.5 10v4a1.5 1.5 0 0 1-3 0v-4A1.5 1.5 0 0 1 4 8.5m16 0a1.5 1.5 0 0 1 1.493 1.356L21.5 10v4a1.5 1.5 0 0 1-2.993.144L18.5 14v-4A1.5 1.5 0 0 1 20 8.5" />;
}

function StopFill({ size = 20 }: { size?: number }) {
  return <Icon size={size} d="M8 6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z" />;
}

function PlayFill({ size = 20 }: { size?: number }) {
  return <Icon size={size} d="M5.669 4.76a1.47 1.47 0 0 1 2.04-1.177c1.062.454 3.442 1.533 6.462 3.276 3.021 1.744 5.146 3.267 6.069 3.958.788.591.79 1.763.001 2.356-.914.687-3.013 2.19-6.07 3.956-3.06 1.766-5.412 2.832-6.464 3.28-.906.387-1.92-.2-2.038-1.177-.138-1.142-.396-3.735-.396-7.237 0-3.5.257-6.092.396-7.235" />;
}

function EyeLine({ size = 20 }: { size?: number }) {
  return <Icon size={size} d="M12 5c4.97 0 9.27 3.11 10.72 7.5C21.27 16.89 16.97 20 12 20s-9.27-3.11-10.72-7.5C2.73 8.11 7.03 5 12 5m0 2a8.72 8.72 0 0 0-8.16 5.5A8.72 8.72 0 0 0 12 18a8.72 8.72 0 0 0 8.16-5.5A8.72 8.72 0 0 0 12 7m0 2a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7m0 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3" />;
}

// ── Shared styles ──────────────────────────────────────────────
const PANEL_SHADOW = "3px 4px 11px rgba(0,0,0,0.08), 13px 14px 19px rgba(0,0,0,0.07), 29px 32px 26px rgba(0,0,0,0.04), 52px 57px 31px rgba(0,0,0,0.01)";
const PANEL_BG = "#1c1c1c";
const ACCENT = "#3B82F6";
const FG = "#e7e7e7";
const FG50 = "rgba(231,231,231,0.5)";
const FG25 = "rgba(231,231,231,0.25)";
const FG10 = "rgba(231,231,231,0.1)";
const FG05 = "rgba(231,231,231,0.05)";
const FONT = "'Open Runde', -apple-system, sans-serif";

// ── Waveform bars generator (matches real VoicePanel) ──────────
const BAR_COUNT = 22;
function generateBars(active: boolean, seed: number): number[] {
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    if (!active) return 4;
    const base = Math.sin((i + seed) * 0.7) * 0.5 + 0.5;
    const noise = Math.sin((i * 3.7 + seed * 2.3)) * 0.3;
    return Math.max(4, Math.min(28, (base + noise) * 28));
  });
}

// ── Widget states ────────────────────────────────────────────
type WidgetState =
  | "idle"
  | "expanded"
  | "captureMenu"
  | "areaSelect"
  | "areaDragging"
  | "captured"
  | "capturePanel"
  | "noteMenu"
  | "textPanel"
  | "voiceRecording"
  | "voicePreview"
  | "countOnly"
  | "annotating"
  | "annotateHover"
  | "annotatePopover"
  | "reviewing"
  | "success";

type Priority = "none" | "low" | "medium" | "high" | "urgent";

interface AnimStep {
  scrollY?: number;
  state: WidgetState;
  cursorX: number | string;
  cursorY: number | string;
  click: boolean;
  duration: number;
  itemCount?: number;
  dragStartX?: number | string;
  dragStartY?: number | string;
  /** Characters to show in typing animation */
  typedChars?: number;
  priority?: Priority;
  hoveredIcon?: "capture" | "annotate" | "note" | "delete" | "send" | "close";
}

const CAPTURE_NOTE = "Button is misaligned";
const TEXT_NOTE = "Colors feel off on this section";
const ANNOT_NOTE = "Make this 200";

// Default placeholder cursor positions (calibrate.js will overwrite cursorX/cursorY for QA-checked steps).
const C = "calc(100% - 65px)";
const CY = "calc(100% - 40px)";

const ANIM_STEPS: AnimStep[] = [
  // ── ACT 0: Idle (steps 0-2) ──
  /*  0 */ { state: "idle",           cursorX: "50%", cursorY: "50%", click: false, duration: 1200, scrollY: 0 },
  /*  1 */ { state: "idle",           cursorX: C, cursorY: CY, click: false, duration: 600, scrollY: 0 },
  /*  2 */ { state: "idle",           cursorX: C, cursorY: CY, click: true,  duration: 200, scrollY: 0 },

  // ── ACT 1: Screenshot capture (steps 3-23) ──
  /*  3 */ { state: "expanded",       cursorX: C, cursorY: CY, click: false, duration: 700, scrollY: 0 },
  /*  4 */ { state: "expanded",       cursorX: "calc(100% - 161px)", cursorY: "calc(100% - 40px)", click: false, duration: 500, scrollY: 0, hoveredIcon: "capture" },
  /*  5 */ { state: "expanded",       cursorX: "calc(100% - 161px)", cursorY: "calc(100% - 40px)", click: true,  duration: 200, scrollY: 0, hoveredIcon: "capture" },
  /*  6 */ { state: "captureMenu",    cursorX: "calc(100% - 161px)", cursorY: CY, click: false, duration: 400, scrollY: 0 },
  /*  7 */ { state: "captureMenu",    cursorX: "calc(100% - 152px)", cursorY: "calc(100% - 108px)", click: false, duration: 400, scrollY: 0 },
  /*  8 */ { state: "captureMenu",    cursorX: "calc(100% - 152px)", cursorY: "calc(100% - 108px)", click: true,  duration: 200, scrollY: 0 },
  /*  9 */ { state: "areaSelect",     cursorX: 20, cursorY: 30, click: false, duration: 800, scrollY: 0 },
  /* 10 */ { state: "areaDragging",   cursorX: 20, cursorY: 30, click: true,  duration: 200, dragStartX: 20, dragStartY: 30, scrollY: 0 },
  /* 11 */ { state: "areaDragging",   cursorX: 60, cursorY: 65, click: false, duration: 1000, dragStartX: 20, dragStartY: 30, scrollY: 0 },
  /* 12 */ { state: "areaDragging",   cursorX: 60, cursorY: 65, click: false, duration: 300, dragStartX: 20, dragStartY: 30, scrollY: 0 },
  /* 13 */ { state: "captured",       cursorX: 60, cursorY: 65, click: false, duration: 500, scrollY: 0 },
  /* 14 */ { state: "capturePanel",   cursorX: "calc(100% - 64px)", cursorY: "calc(100% - 96px)", click: false, duration: 800, typedChars: 0, scrollY: 0 },
  /* 15 */ { state: "capturePanel",   cursorX: "calc(100% - 160px)", cursorY: "calc(100% - 187px)", click: false, duration: 300, typedChars: 7, scrollY: 0 },
  /* 16 */ { state: "capturePanel",   cursorX: "calc(100% - 160px)", cursorY: "calc(100% - 187px)", click: false, duration: 250, typedChars: 14, scrollY: 0 },
  /* 17 */ { state: "capturePanel",   cursorX: "calc(100% - 64px)", cursorY: "calc(100% - 96px)", click: false, duration: 400, typedChars: 20, scrollY: 0 },
  /* 18 */ { state: "capturePanel",   cursorX: "calc(100% - 200px)", cursorY: "calc(100% - 130px)", click: false, duration: 350, typedChars: 20, scrollY: 0, priority: "none" },
  /* 19 */ { state: "capturePanel",   cursorX: "calc(100% - 259px)", cursorY: "calc(100% - 143px)", click: true,  duration: 250, typedChars: 20, scrollY: 0, priority: "low" },
  /* 20 */ { state: "capturePanel",   cursorX: "calc(100% - 259px)", cursorY: "calc(100% - 143px)", click: true,  duration: 350, typedChars: 20, scrollY: 0, priority: "urgent" },
  /* 21 */ { state: "capturePanel",   cursorX: "calc(100% - 61px)", cursorY: "calc(100% - 98px)", click: false, duration: 400, typedChars: 20, scrollY: 0, priority: "urgent" },
  /* 22 */ { state: "capturePanel",   cursorX: "calc(100% - 61px)", cursorY: "calc(100% - 98px)", click: true,  duration: 200, typedChars: 20, scrollY: 0, priority: "urgent" },
  /* 23 */ { state: "countOnly",      cursorX: "calc(100% - 64px)", cursorY: "calc(100% - 96px)", click: false, duration: 800, itemCount: 1, scrollY: 0 },

  // ── ACT 2: Annotate (steps 24-42) ──
  /* 24 */ { state: "countOnly",      cursorX: "calc(100% - 38px)", cursorY: "calc(100% - 40px)", click: false, duration: 500, itemCount: 1, scrollY: 0 },
  /* 25 */ { state: "countOnly",      cursorX: "calc(100% - 38px)", cursorY: "calc(100% - 40px)", click: true,  duration: 250, itemCount: 1, scrollY: 0 },
  /* 26 */ { state: "expanded",       cursorX: "calc(100% - 38px)", cursorY: CY, click: false, duration: 600, itemCount: 1, scrollY: 0 },
  /* 27 */ { state: "expanded",       cursorX: "calc(100% - 206px)", cursorY: "calc(100% - 40px)", click: false, duration: 500, itemCount: 1, scrollY: 0, hoveredIcon: "annotate" },
  /* 28 */ { state: "expanded",       cursorX: "calc(100% - 206px)", cursorY: "calc(100% - 40px)", click: true,  duration: 200, itemCount: 1, scrollY: 0, hoveredIcon: "annotate" },
  /* 29 */ { state: "annotating",     cursorX: "50%", cursorY: "60%", click: false, duration: 350, itemCount: 1, scrollY: 0 },
  /* 30 */ { state: "annotateHover",  cursorX: "259px", cursorY: "122px", click: false, duration: 500, itemCount: 1, scrollY: 0 },
  /* 31 */ { state: "annotateHover",  cursorX: "259px", cursorY: "122px", click: true,  duration: 250, itemCount: 1, scrollY: 0 },
  /* 32 */ { state: "annotatePopover", cursorX: "50%", cursorY: "180px", click: false, duration: 600, itemCount: 1, typedChars: 0, scrollY: 0 },
  /* 33 */ { state: "annotatePopover", cursorX: "396px", cursorY: "203px", click: false, duration: 350, itemCount: 1, typedChars: 5, scrollY: 0 },
  /* 34 */ { state: "annotatePopover", cursorX: "396px", cursorY: "203px", click: false, duration: 350, itemCount: 1, typedChars: 13, scrollY: 0 },
  /* 35 */ { state: "annotatePopover", cursorX: "299px", cursorY: "248px", click: false, duration: 300, itemCount: 1, typedChars: 13, scrollY: 0, priority: "none" },
  /* 36 */ { state: "annotatePopover", cursorX: "299px", cursorY: "248px", click: true,  duration: 250, itemCount: 1, typedChars: 13, scrollY: 0, priority: "low" },
  /* 37 */ { state: "annotatePopover", cursorX: "299px", cursorY: "248px", click: true,  duration: 250, itemCount: 1, typedChars: 13, scrollY: 0, priority: "medium" },
  /* 38 */ { state: "annotatePopover", cursorX: "299px", cursorY: "248px", click: true,  duration: 250, itemCount: 1, typedChars: 13, scrollY: 0, priority: "high" },
  /* 39 */ { state: "annotatePopover", cursorX: "299px", cursorY: "248px", click: true,  duration: 250, itemCount: 1, typedChars: 13, scrollY: 0, priority: "urgent" },
  /* 40 */ { state: "annotatePopover", cursorX: "299px", cursorY: "248px", click: true,  duration: 350, itemCount: 1, typedChars: 13, scrollY: 0, priority: "high" },
  /* 41 */ { state: "annotatePopover", cursorX: "494px", cursorY: "293px", click: false, duration: 400, itemCount: 1, typedChars: 13, scrollY: 0, priority: "high" },
  /* 42 */ { state: "annotatePopover", cursorX: "494px", cursorY: "293px", click: true,  duration: 250, itemCount: 1, typedChars: 13, scrollY: 0, priority: "high" },

  // ── ACT 3: Text note (steps 43-61) ──
  /* 43 */ { state: "countOnly",      cursorX: "calc(100% - 38px)", cursorY: "calc(100% - 40px)", click: false, duration: 500, itemCount: 2, scrollY: 0 },
  /* 44 */ { state: "countOnly",      cursorX: "calc(100% - 38px)", cursorY: "calc(100% - 40px)", click: true,  duration: 250, itemCount: 2, scrollY: 0 },
  /* 45 */ { state: "expanded",       cursorX: "calc(100% - 38px)", cursorY: CY, click: false, duration: 600, itemCount: 2, scrollY: 0 },
  /* 46 */ { state: "expanded",       cursorX: "calc(100% - 168px)", cursorY: "calc(100% - 40px)", click: false, duration: 500, itemCount: 2, scrollY: 0, hoveredIcon: "note" },
  /* 47 */ { state: "expanded",       cursorX: "calc(100% - 168px)", cursorY: "calc(100% - 40px)", click: true,  duration: 200, itemCount: 2, scrollY: 0, hoveredIcon: "note" },
  /* 48 */ { state: "noteMenu",       cursorX: "calc(100% - 168px)", cursorY: CY, click: false, duration: 400, itemCount: 2, scrollY: 0 },
  /* 49 */ { state: "noteMenu",       cursorX: "calc(100% - 152px)", cursorY: "calc(100% - 108px)", click: false, duration: 400, itemCount: 2, scrollY: 0 },
  /* 50 */ { state: "noteMenu",       cursorX: "calc(100% - 152px)", cursorY: "calc(100% - 108px)", click: true,  duration: 200, itemCount: 2, scrollY: 0 },
  /* 51 */ { state: "textPanel",      cursorX: "calc(100% - 66px)", cursorY: "calc(100% - 96px)", click: false, duration: 700, itemCount: 2, typedChars: 0, scrollY: 0 },
  /* 52 */ { state: "textPanel",      cursorX: "calc(100% - 160px)", cursorY: "calc(100% - 187px)", click: false, duration: 300, itemCount: 2, typedChars: 7, scrollY: 0 },
  /* 53 */ { state: "textPanel",      cursorX: "calc(100% - 160px)", cursorY: "calc(100% - 187px)", click: false, duration: 350, itemCount: 2, typedChars: 16, scrollY: 0 },
  /* 54 */ { state: "textPanel",      cursorX: "calc(100% - 66px)", cursorY: "calc(100% - 96px)", click: false, duration: 300, itemCount: 2, typedChars: 24, scrollY: 0 },
  /* 55 */ { state: "textPanel",      cursorX: "calc(100% - 66px)", cursorY: "calc(100% - 96px)", click: false, duration: 350, itemCount: 2, typedChars: 31, scrollY: 0 },
  /* 56 */ { state: "textPanel",      cursorX: "calc(100% - 200px)", cursorY: "calc(100% - 130px)", click: false, duration: 350, itemCount: 2, typedChars: 31, scrollY: 0, priority: "none" },
  /* 57 */ { state: "textPanel",      cursorX: "calc(100% - 257px)", cursorY: "calc(100% - 143px)", click: true,  duration: 250, itemCount: 2, typedChars: 31, scrollY: 0, priority: "low" },
  /* 58 */ { state: "textPanel",      cursorX: "calc(100% - 257px)", cursorY: "calc(100% - 143px)", click: true,  duration: 350, itemCount: 2, typedChars: 31, scrollY: 0, priority: "medium" },
  /* 59 */ { state: "textPanel",      cursorX: "calc(100% - 63px)", cursorY: "calc(100% - 98px)", click: false, duration: 400, itemCount: 2, typedChars: 31, scrollY: 0, priority: "medium" },
  /* 60 */ { state: "textPanel",      cursorX: "calc(100% - 63px)", cursorY: "calc(100% - 98px)", click: true,  duration: 200, itemCount: 2, typedChars: 31, scrollY: 0, priority: "medium" },
  /* 61 */ { state: "countOnly",      cursorX: "calc(100% - 66px)", cursorY: "calc(100% - 96px)", click: false, duration: 800, itemCount: 3, scrollY: 0 },

  // ── ACT 4: Voice note (steps 62-77) ──
  /* 62 */ { state: "countOnly",      cursorX: "calc(100% - 38px)", cursorY: "calc(100% - 40px)", click: false, duration: 500, itemCount: 3, scrollY: 0 },
  /* 63 */ { state: "countOnly",      cursorX: "calc(100% - 38px)", cursorY: "calc(100% - 40px)", click: true,  duration: 250, itemCount: 3, scrollY: 0 },
  /* 64 */ { state: "expanded",       cursorX: "calc(100% - 38px)", cursorY: CY, click: false, duration: 600, itemCount: 3, scrollY: 0 },
  /* 65 */ { state: "expanded",       cursorX: "calc(100% - 168px)", cursorY: "calc(100% - 40px)", click: false, duration: 500, itemCount: 3, scrollY: 0, hoveredIcon: "note" },
  /* 66 */ { state: "expanded",       cursorX: "calc(100% - 168px)", cursorY: "calc(100% - 40px)", click: true,  duration: 200, itemCount: 3, scrollY: 0, hoveredIcon: "note" },
  /* 67 */ { state: "noteMenu",       cursorX: "calc(100% - 168px)", cursorY: CY, click: false, duration: 400, itemCount: 3, scrollY: 0 },
  /* 68 */ { state: "noteMenu",       cursorX: "calc(100% - 64px)", cursorY: "calc(100% - 108px)", click: false, duration: 400, itemCount: 3, scrollY: 0 },
  /* 69 */ { state: "noteMenu",       cursorX: "calc(100% - 64px)", cursorY: "calc(100% - 108px)", click: true,  duration: 200, itemCount: 3, scrollY: 0 },
  /* 70 */ { state: "voiceRecording", cursorX: "calc(100% - 40px)", cursorY: "calc(100% - 88px)", click: false, duration: 800, itemCount: 3, scrollY: 0 },
  /* 71 */ { state: "voiceRecording", cursorX: "calc(100% - 40px)", cursorY: "calc(100% - 88px)", click: false, duration: 1000, itemCount: 3, scrollY: 140 },
  /* 72 */ { state: "voiceRecording", cursorX: "calc(100% - 40px)", cursorY: "calc(100% - 88px)", click: false, duration: 1000, itemCount: 3, scrollY: 260 },
  /* 73 */ { state: "voiceRecording", cursorX: "calc(100% - 40px)", cursorY: "calc(100% - 88px)", click: true,  duration: 200, itemCount: 3, scrollY: 260 },
  /* 74 */ { state: "voicePreview",   cursorX: "calc(100% - 62px)", cursorY: "calc(100% - 94px)", click: false, duration: 1000, itemCount: 3, scrollY: 260 },
  /* 75 */ { state: "voicePreview",   cursorX: "calc(100% - 59px)", cursorY: "calc(100% - 96px)", click: false, duration: 350, itemCount: 3, scrollY: 260 },
  /* 76 */ { state: "voicePreview",   cursorX: "calc(100% - 59px)", cursorY: "calc(100% - 96px)", click: true,  duration: 200, itemCount: 3, scrollY: 260 },
  /* 77 */ { state: "countOnly",      cursorX: "calc(100% - 62px)", cursorY: "calc(100% - 94px)", click: false, duration: 800, itemCount: 4, scrollY: 0 },

  // ── ACT 5: Review & submit (steps 78-85) ──
  /* 78 */ { state: "countOnly",      cursorX: "calc(100% - 38px)", cursorY: "calc(100% - 40px)", click: false, duration: 500, itemCount: 4, scrollY: 0 },
  /* 79 */ { state: "countOnly",      cursorX: "calc(100% - 38px)", cursorY: "calc(100% - 40px)", click: true,  duration: 250, itemCount: 4, scrollY: 0 },
  /* 80 */ { state: "expanded",       cursorX: "calc(100% - 38px)", cursorY: CY, click: false, duration: 600, itemCount: 4, scrollY: 0 },
  /* 81 */ { state: "expanded",       cursorX: "calc(100% - 85px)", cursorY: "calc(100% - 40px)", click: false, duration: 500, itemCount: 4, scrollY: 0, hoveredIcon: "send" },
  /* 82 */ { state: "expanded",       cursorX: "calc(100% - 85px)", cursorY: "calc(100% - 40px)", click: true,  duration: 200, itemCount: 4, scrollY: 0, hoveredIcon: "send" },
  /* 83 */ { state: "reviewing",      cursorX: "calc(100% - 62px)", cursorY: "calc(100% - 94px)", click: false, duration: 1000, itemCount: 4, scrollY: 0 },
  /* 84 */ { state: "reviewing",      cursorX: "calc(100% - 68px)", cursorY: "calc(100% - 96px)", click: false, duration: 350, itemCount: 4, scrollY: 0 },
  /* 85 */ { state: "reviewing",      cursorX: "calc(100% - 68px)", cursorY: "calc(100% - 96px)", click: true,  duration: 200, itemCount: 4, scrollY: 0 },
];

// ── Mock panels ────────────────────────────────────────────────

function MockSubMenu({ items }: { items: { icon: React.ReactNode; label: string; target?: string }[] }) {
  return (
    <div
      className="absolute bottom-[48px] right-0 flex items-center gap-2 p-1 rounded-2xl animate-[fadeInUp_200ms_ease-out]"
      style={{ background: PANEL_BG, boxShadow: PANEL_SHADOW, fontFamily: FONT }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          data-mock-target={item.target}
          className="flex flex-col items-center justify-center gap-2 rounded-xl"
          style={{ width: 80, height: 72, color: FG50 }}
        >
          <span className="flex items-center justify-center">{item.icon}</span>
          <span className="text-[13px] font-medium" style={{ letterSpacing: "-0.48px" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

const PRIORITY_LABELS: Record<Priority, string> = {
  none: "Set priority",
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const PRIORITY_FG: Record<Priority, string> = {
  none: FG50,
  low: "#45ff64",
  medium: "#ffed2d",
  high: "#ff882d",
  urgent: "#ff4545",
};

function MockPriorityButton({ priority = "none", targetPrefix }: { priority?: Priority; targetPrefix: string }) {
  const isUrgent = priority === "urgent";
  const dim = "rgba(255,255,255,0.2)";
  const c1 = priority === "low" || priority === "medium" || priority === "high" ? (priority === "low" ? "#45ff64" : priority === "medium" ? "#ffed2d" : "#ff882d") : dim;
  const c2 = priority === "medium" || priority === "high" ? (priority === "medium" ? "#ffed2d" : "#ff882d") : dim;
  const c3 = priority === "high" ? "#ff882d" : dim;
  return (
    <button
      data-mock-target={`${targetPrefix}-priority`}
      className="inline-flex items-center gap-1 text-[13px] font-medium"
      style={{ color: PRIORITY_FG[priority], letterSpacing: "-0.48px", transition: "color 200ms ease" }}
    >
      {isUrgent ? (
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" fill="#ff4545" />
          <path d="M8 4.5v4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="8" cy="11" r="0.9" fill="#fff" />
        </svg>
      ) : (
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
          <rect x="3" y="10" width="3" height="4" rx="1.5" fill={c1} />
          <rect x="7" y="6" width="3" height="8" rx="1.5" fill={c2} />
          <rect x="11" y="2" width="3" height="12" rx="1.5" fill={c3} />
        </svg>
      )}
      <span>{PRIORITY_LABELS[priority]}</span>
    </button>
  );
}

function MockCapturePanel({ typedChars = 0, priority = "none" }: { typedChars?: number; priority?: Priority }) {
  const text = CAPTURE_NOTE.slice(0, typedChars);
  return (
    <div
      className="absolute bottom-[48px] right-0 flex flex-col gap-2 rounded-2xl animate-[fadeInUp_200ms_ease-out]"
      style={{ width: 280, padding: 14, background: PANEL_BG, boxShadow: PANEL_SHADOW, fontFamily: FONT }}
    >
      {/* Fake header */}
      <div className="text-[11px] font-medium" style={{ color: FG25, letterSpacing: "-0.48px" }}>
        320 × 240 at (45, 60)
      </div>
      {/* Preview */}
      <div className="rounded-lg overflow-hidden" style={{ height: 120, background: "linear-gradient(135deg, #2a2a4a, #1a1a3a)" }}>
        <img src="/capture-preview.png" alt="Screenshot preview" className="w-full h-full object-cover" />
      </div>
      {/* Textarea + priority */}
      <div className="rounded-xl flex flex-col gap-1.5 px-3 py-2" style={{ background: FG05, border: `1px solid ${FG10}` }}>
        <div data-mock-target="capture-textarea" className="text-[13px] min-h-[52px]" style={{ color: text ? FG : FG25 }}>
          {text || "Add a note (optional)"}
          {typedChars < CAPTURE_NOTE.length && <span className="animate-pulse">|</span>}
        </div>
        <div className="flex items-center">
          <MockPriorityButton priority={priority} targetPrefix="capture" />
        </div>
      </div>
      {/* Footer */}
      <div className="flex justify-end gap-1.5">
        <button data-mock-target="capture-cancel" className="px-3.5 py-1.5 rounded-full text-[13px] font-medium" style={{ color: FG50 }}>
          Cancel
        </button>
        <button data-mock-target="capture-add" className="px-3.5 py-1.5 rounded-full text-[13px] font-medium" style={{ background: ACCENT, color: FG }}>
          Add
        </button>
      </div>
    </div>
  );
}

function MockTextPanel({ typedChars = 0, priority = "none" }: { typedChars?: number; priority?: Priority }) {
  const text = TEXT_NOTE.slice(0, typedChars);
  return (
    <div
      className="absolute bottom-[48px] right-0 flex flex-col rounded-2xl animate-[fadeInUp_200ms_ease-out]"
      style={{ width: 280, padding: "12px 16px 14px", background: PANEL_BG, boxShadow: PANEL_SHADOW, fontFamily: FONT }}
    >
      <p className="text-[13px] mb-2" style={{ color: FG50 }}>Text</p>
      {/* Textarea + priority */}
      <div className="rounded-xl flex flex-col gap-1.5 px-3 py-2" style={{ background: FG05, border: `1px solid ${FG10}` }}>
        <div data-mock-target="text-textarea" className="text-[13px] min-h-[52px]" style={{ color: text ? FG : FG25 }}>
          {text || "What's on your mind?"}
          {typedChars < TEXT_NOTE.length && <span className="animate-pulse">|</span>}
        </div>
        <div className="flex items-center">
          <MockPriorityButton priority={priority} targetPrefix="text" />
        </div>
      </div>
      {/* Footer */}
      <div className="flex justify-end gap-1.5 mt-2">
        <button data-mock-target="text-cancel" className="px-3.5 py-1.5 rounded-full text-[13px] font-medium" style={{ color: FG50 }}>
          Cancel
        </button>
        <button
          data-mock-target="text-add"
          className="px-3.5 py-1.5 rounded-full text-[13px] font-medium"
          style={{ background: ACCENT, color: FG, opacity: text.trim() ? 1 : 0.4 }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function MockAnnotationPopover({ typedChars = 0, priority = "none" }: { typedChars?: number; priority?: Priority }) {
  const text = ANNOT_NOTE.slice(0, typedChars);
  return (
    <div
      className="absolute z-40 flex flex-col rounded-2xl animate-[fadeInUp_200ms_ease-out]"
      style={{
        top: 130,
        left: "50%",
        transform: "translateX(-50%)",
        width: 280,
        padding: "12px 16px 14px",
        background: PANEL_BG,
        boxShadow: PANEL_SHADOW,
        fontFamily: FONT,
      }}
    >
      <p className="text-[12px] mb-2" style={{ color: FG50, letterSpacing: "-0.3px" }}>span</p>
      {/* Textarea + priority */}
      <div className="rounded-xl flex flex-col gap-1.5 px-3 py-2" style={{ background: FG05, border: `1px solid ${FG10}` }}>
        <div data-mock-target="annot-textarea" className="text-[13px] min-h-[52px]" style={{ color: text ? FG : FG25 }}>
          {text || "What should change?"}
          {typedChars < ANNOT_NOTE.length && <span className="animate-pulse">|</span>}
        </div>
        <div className="flex items-center">
          <MockPriorityButton priority={priority} targetPrefix="annot" />
        </div>
      </div>
      {/* Footer */}
      <div className="flex justify-end gap-1.5 mt-2">
        <button data-mock-target="annot-cancel" className="px-3.5 py-1.5 rounded-full text-[13px] font-medium" style={{ color: FG50 }}>
          Cancel
        </button>
        <button
          data-mock-target="annot-add"
          className="px-3.5 py-1.5 rounded-full text-[13px] font-medium"
          style={{ background: ACCENT, color: FG, opacity: text.trim() ? 1 : 0.4 }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function MockVoiceRecording({ bars, time }: { bars: number[]; time: string }) {
  return (
    <div
      className="absolute bottom-[48px] right-0 flex items-center rounded-full animate-[fadeInUp_200ms_ease-out]"
      style={{ width: 240, padding: "4px 4px 4px 16px", height: 40, background: PANEL_BG, boxShadow: PANEL_SHADOW, fontFamily: FONT }}
    >
      {/* Waveform */}
      <div className="flex-1 flex items-center justify-between gap-[3px] h-6 min-w-0 overflow-hidden" style={{
        maskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
      }}>
        {bars.map((h, i) => (
          <div
            key={i}
            className="shrink-0 rounded-[1px]"
            style={{ width: 2, minWidth: 2, height: h, background: FG50, transition: "height 80ms ease" }}
          />
        ))}
      </div>
      {/* Timer */}
      <span className="text-[12px] font-medium shrink-0 mx-2 tabular-nums" style={{ color: FG, letterSpacing: "-0.48px", width: 32 }}>
        {time}
      </span>
      {/* Stop button */}
      <div
        data-mock-target="voice-stop"
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "rgba(255, 95, 87, 0.25)", color: "#ff4545" }}
      >
        <StopFill size={20} />
      </div>
    </div>
  );
}

function MockVoicePreview({ bars, priority = "none" }: { bars: number[]; priority?: Priority }) {
  return (
    <div
      className="absolute bottom-[48px] right-0 flex flex-col rounded-2xl animate-[fadeInUp_200ms_ease-out]"
      style={{ width: 240, padding: 12, background: PANEL_BG, boxShadow: PANEL_SHADOW, fontFamily: FONT }}
    >
      {/* Top row: play + waveform */}
      <div className="flex items-center">
        <div
          data-mock-target="voice-play"
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mr-2"
          style={{ background: FG05, color: FG }}
        >
          <PlayFill size={14} />
        </div>
        <div className="flex-1 flex items-center justify-between gap-[3px] h-6 min-w-0 overflow-hidden" style={{
          maskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
        }}>
          {bars.map((h, i) => (
            <div
              key={i}
              className="shrink-0 rounded-[1px]"
              style={{ width: 2, minWidth: 2, height: h, background: FG50 }}
            />
          ))}
        </div>
      </div>
      {/* Textarea + priority */}
      <div className="rounded-xl mt-2.5 flex flex-col gap-1.5 px-3 py-2" style={{ background: FG05, border: `1px solid ${FG10}` }}>
        <div data-mock-target="voice-textarea" className="text-[13px] min-h-[40px]" style={{ color: FG25 }}>
          Add a note…
        </div>
        <div className="flex items-center">
          <MockPriorityButton priority={priority} targetPrefix="voice" />
        </div>
      </div>
      {/* Footer */}
      <div className="flex justify-end gap-1.5 mt-2.5">
        <button data-mock-target="voice-cancel" className="px-3.5 py-1.5 rounded-full text-[13px] font-medium" style={{ color: FG50 }}>
          Cancel
        </button>
        <button data-mock-target="voice-add" className="px-3.5 py-1.5 rounded-full text-[13px] font-medium" style={{ background: ACCENT, color: FG }}>
          Add
        </button>
      </div>
    </div>
  );
}

function MockReviewPanel({ itemCount }: { itemCount: number }) {
  const items = [
    { icon: <CameraFill size={16} />, label: "320 × 240 at (45, 60)" },
    { icon: <Message4Fill size={16} />, label: TEXT_NOTE },
    { icon: <VoiceFill size={16} />, label: "~1 minute" },
  ].slice(0, itemCount);

  return (
    <div
      className="absolute bottom-[48px] right-0 flex flex-col gap-4 rounded-2xl animate-[fadeInUp_200ms_ease-out]"
      style={{ width: 280, padding: 12, background: PANEL_BG, boxShadow: PANEL_SHADOW, fontFamily: FONT }}
    >
      {/* Item list */}
      <div className="flex flex-col gap-1">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-3 rounded-xl"
            style={{ background: FG05 }}
          >
            {/* Priority placeholder */}
            <span className="text-[10px] shrink-0" style={{ color: FG25, letterSpacing: "-0.5px", width: 16 }}>---</span>
            <span className="flex shrink-0" style={{ color: FG50 }}>{item.icon}</span>
            <span className="text-[13px] truncate" style={{ color: FG50, letterSpacing: "-0.48px" }}>{item.label}</span>
          </div>
        ))}
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[13px]" style={{ color: FG25 }}>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
        <div className="flex gap-1.5">
          <button data-mock-target="review-cancel" className="px-3.5 py-1.5 rounded-full text-[13px] font-medium" style={{ color: FG50 }}>
            Cancel
          </button>
          <button data-mock-target="review-submit" className="px-3.5 py-1.5 rounded-full text-[13px] font-medium" style={{ background: ACCENT, color: FG }}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Feedback widget (visual only) ────────────────────────────
function MockFeedbackBar({ widgetState, itemCount, typedChars, priority, hoveredIcon, voiceBars, voiceTime }: {
  widgetState: WidgetState;
  itemCount: number;
  typedChars?: number;
  priority?: Priority;
  hoveredIcon?: AnimStep["hoveredIcon"];
  voiceBars: number[];
  voiceTime: string;
}) {
  const isIdle = widgetState === "idle";
  const isCountOnly = widgetState === "countOnly";
  const isSuccess = widgetState === "success";
  const showToolbar = !isIdle && !isCountOnly && !isSuccess;
  const showSendBadge = itemCount > 0 && showToolbar;

  const captureActive = widgetState === "captureMenu" || widgetState === "capturePanel" || hoveredIcon === "capture";
  const annotateActive = widgetState === "annotating" || widgetState === "annotateHover" || widgetState === "annotatePopover" || hoveredIcon === "annotate";
  const noteActive = widgetState === "noteMenu" || widgetState === "textPanel" || widgetState === "voiceRecording" || widgetState === "voicePreview" || hoveredIcon === "note";

  return (
    <div className="absolute bottom-5 right-5 z-10">
      {/* Panels above the bar */}
      {widgetState === "captureMenu" && (
        <MockSubMenu items={[
          { icon: <CameraFill size={20} />, label: "Screenshot", target: "screenshot" },
          { icon: <CamcorderFill size={20} />, label: "Record", target: "record" },
        ]} />
      )}
      {widgetState === "noteMenu" && (
        <MockSubMenu items={[
          { icon: <Message4Fill size={20} />, label: "Text", target: "text" },
          { icon: <VoiceFill size={20} />, label: "Voice", target: "voice" },
        ]} />
      )}
      {widgetState === "capturePanel" && <MockCapturePanel typedChars={typedChars} priority={priority} />}
      {widgetState === "textPanel" && <MockTextPanel typedChars={typedChars} priority={priority} />}
      {widgetState === "voiceRecording" && <MockVoiceRecording bars={voiceBars} time={voiceTime} />}
      {widgetState === "voicePreview" && <MockVoicePreview bars={voiceBars} priority={priority} />}
      {widgetState === "reviewing" && <MockReviewPanel itemCount={itemCount} />}

      {/* Toolbar bar */}
      <div
        data-mock-target={isIdle ? "feedback-pill" : isCountOnly ? "count-pill" : undefined}
        className="flex items-center justify-end rounded-full overflow-hidden"
        style={{
          background: isSuccess ? "#22c55e" : isCountOnly ? ACCENT : PANEL_BG,
          boxShadow: PANEL_SHADOW,
          padding: 4,
          height: 40,
          width: isCountOnly ? (itemCount > 9 ? 48 : 40) : isSuccess ? 48 : isIdle ? 90 : showSendBadge ? 242 : 164,
          fontFamily: FONT,
          transition: "width 400ms cubic-bezier(0.19,1,0.22,1), height 400ms cubic-bezier(0.19,1,0.22,1), background-color 400ms cubic-bezier(0.19,1,0.22,1)",
        }}
      >
        {/* Idle: "Feedback" text */}
        {isIdle && (
          <div className="flex items-center justify-center px-2 h-8">
            <span className="text-[14px] font-medium whitespace-nowrap tracking-[-0.02em]" style={{ color: FG }}>
              Feedback
            </span>
          </div>
        )}

        {/* Count-only: number */}
        {isCountOnly && (
          <div className="flex items-center justify-center w-full h-full">
            <span className="text-[14px] font-medium tabular-nums" style={{ color: FG }}>{itemCount}</span>
          </div>
        )}

        {/* Success: checkmark */}
        {isSuccess && (
          <div className="flex items-center justify-center w-full h-full" style={{ color: FG }}>
            <CheckLine size={24} />
          </div>
        )}

        {/* Expanded toolbar */}
        {showToolbar && (
          <div className="flex items-center gap-[6px]">
            {/* Capture */}
            <div data-mock-target="capture" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${captureActive ? "bg-white/25 text-white" : "text-white/50"}`}>
              <ScanLine />
            </div>
            {/* Annotate */}
            <div data-mock-target="annotate" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${annotateActive ? "bg-white/25 text-white" : "text-white/50"}`}>
              <Cursor3Fill />
            </div>
            {/* Note */}
            <div data-mock-target="note" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${noteActive ? "bg-white/25 text-white" : "text-white/50"}`}>
              <PenFill />
            </div>

            {showSendBadge && (
              <>
                <div className="w-px h-4" style={{ background: FG05 }} />
                {/* Delete */}
                <div data-mock-target="delete" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hoveredIcon === "delete" ? "bg-white/25 text-white" : "text-white/50"}`}>
                  <Delete2Fill />
                </div>
                {/* Send + badge */}
                <div data-mock-target="send" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors relative ${hoveredIcon === "send" ? "bg-white/25 text-white" : "text-white/50"}`}>
                  <SendFill />
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center text-[11px] font-semibold rounded-full px-1 leading-none tabular-nums"
                    style={{ background: ACCENT, color: FG }}
                  >
                    {itemCount}
                  </span>
                </div>
              </>
            )}

            <div className="w-px h-4" style={{ background: FG05 }} />
            {/* Close */}
            <div data-mock-target="close" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hoveredIcon === "close" ? "bg-white/25 text-white" : "text-white/50"}`}>
              <CloseLine />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Aqua traffic light button ─────────────────────────────────
function TrafficLight({ color }: { color: "red" | "yellow" | "green" }) {
  const styles = {
    red: {
      gradient: "linear-gradient(rgb(193, 58, 45), rgb(205, 73, 52))",
      shadow: "rgba(0,0,0,0.5) 0px 1px 2px, rgba(0,0,0,0.3) 0px 0px 0px 0.5px inset, rgba(150,40,30,0.8) 0px 1px 2px inset, rgba(225,70,64,0.75) 0px 1px 2px 1px inset",
    },
    yellow: {
      gradient: "linear-gradient(rgb(202, 130, 13), rgb(253, 253, 149))",
      shadow: "rgba(0,0,0,0.5) 0px 1px 2px, rgba(0,0,0,0.3) 0px 0px 0px 0.5px inset, rgb(155,78,21) 0px 1px 2px inset, rgb(241,157,20) 0px 1px 2px 1px inset",
    },
    green: {
      gradient: "linear-gradient(rgb(111, 174, 58), rgb(138, 192, 50))",
      shadow: "rgba(0,0,0,0.5) 0px 1px 2px, rgba(0,0,0,0.3) 0px 0px 0px 0.5px inset, rgb(53,91,17) 0px 1px 2px inset, rgb(98,187,19) 0px 1px 2px 1px inset",
    },
  };

  const s = styles[color];

  return (
    <div
      className="rounded-full relative overflow-hidden"
      style={{ width: "11px", height: "11px", background: s.gradient, boxShadow: s.shadow }}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          height: "28%",
          background: "linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.3))",
          width: "calc(100% - 4px)",
          borderRadius: "4px 4px 0 0",
          top: "1px",
        }}
      />
    </div>
  );
}

// ── 2002-era Pear.com ─────────────────────────────────────────
function PearSite() {
  return (
    <div className="flex flex-col bg-white" style={{ minHeight: "100%", fontFamily: "'Lucida Grande', Geneva, Verdana, sans-serif" }}>
      {/* Tab navigation bar */}
      <div
        className="flex items-center shrink-0 sticky top-0 z-10"
        style={{ background: "linear-gradient(to bottom, #b8b8b8, #8e8e8e)", borderBottom: "1px solid #555" }}
      >
        <div className="px-3 py-[5px] flex items-center" style={{ background: "linear-gradient(to bottom, #4a4a4a, #2a2a2a)" }}>
          <PearLogo className="size-[14px] text-white" />
        </div>
        {["Hardware", "Software", "Made4Pear", "Education", ".Pear", "Support"].map((tab, i) => (
          <div
            key={tab}
            className="px-3 py-[5px] text-[10px] font-medium text-white/90 border-l border-white/15"
            style={{
              background: i === 0 ? "linear-gradient(to bottom, #7ec47e, #4a9a4a)" : "transparent",
              boxShadow: i === 0 ? "inset 0 1px 0 rgba(255,255,255,0.25), 0 1px 2px rgba(0,0,0,0.15)" : "none",
              textShadow: "0 -1px 0 rgba(0,0,0,0.3)",
            }}
          >
            {tab}
          </div>
        ))}
        <div className="ml-auto px-3">
          <div className="flex items-center gap-1 px-2 py-[2px] text-[9px] text-black/50" style={{ background: "white", borderRadius: "10px", border: "1px solid #999" }}>
            <span>Search</span>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" className="opacity-30">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="text-center py-6 px-6" style={{ background: "linear-gradient(to bottom, #f5f5f5, #e8e8e8)" }}>
        <p className="text-[10px] text-[#666] tracking-wide uppercase mb-1">Introducing</p>
        <h1 className="text-[32px] font-light text-black tracking-[-0.5px] leading-[1.1]" style={{ fontFamily: "'Apple Garamond', Georgia, serif" }}>
          Pear OS X Nectar
        </h1>
        <p className="text-[12px] text-[#555] mt-2 leading-relaxed max-w-[80%] mx-auto">
          Over <span data-mock-target="annotation-target">150</span> new features. The world&apos;s juiciest operating system.
        </p>
        <span className="text-[11px] text-[#06c] underline mt-2 inline-block">Learn more &gt;</span>
        <img src="/pear-lineup.png" alt="Pear product lineup" className="mt-4 mx-auto w-full max-w-[420px]" />
      </div>

      {/* Three-column strip */}
      <div className="grid grid-cols-3 border-t border-b border-[#ccc]">
        {[
          { title: "pPod", desc: "10,000 songs in your pocket.", link: "Buy now", img: "/pear-pod.png" },
          { title: "pPhoto", desc: "Share your photo library.", link: "Learn more", img: "/pear-photo.png" },
          { title: "Pear Store", desc: "Free shipping. Easy returns.", link: "Shop now", img: "/pear-store.png" },
        ].map(({ title, desc, link, img }, i) => (
          <div key={title} className="text-center py-5 px-3" style={{ borderRight: i < 2 ? "1px solid #ccc" : "none" }}>
            <img src={img} alt={title} className="w-[48px] h-[48px] mx-auto mb-2 rounded-[10px] object-cover" style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }} />
            <h3 className="text-[16px] text-black" style={{ fontFamily: "'Apple Garamond', Georgia, serif" }}>{title}</h3>
            <p className="text-[10px] text-[#555] mt-0.5">{desc}</p>
            <span className="text-[10px] text-[#06c] underline mt-1 inline-block">{link} &gt;</span>
          </div>
        ))}
      </div>

      {/* Hot News */}
      <div className="px-6 py-5">
        <h2 className="text-[14px] font-bold text-black border-b border-[#ccc] pb-1 mb-3">Hot News</h2>
        <div className="flex flex-col gap-2">
          {[
            "New pMac G4 with 17-inch flat panel display now available",
            "pTunes 3 now available with Smart Playlists",
            "Third quarter results — revenue up 7 percent",
            "Pear OS X 10.2 Nectar available August 24",
          ].map((headline) => (
            <div key={headline} className="flex items-start gap-2">
              <span className="text-[#06c] text-[10px] mt-0.5 shrink-0">&#9654;</span>
              <span className="text-[10px] text-[#333] leading-relaxed">{headline}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto px-6 py-3 border-t border-[#ccc]" style={{ background: "#f0f0f0" }}>
        <div className="flex items-center justify-center gap-3 text-[9px] text-[#888]">
          <span>Copyright &copy; 2002 Pear Computer, Inc.</span>
          <span>|</span>
          <span className="text-[#06c] underline">Privacy Policy</span>
          <span>|</span>
          <span className="text-[#06c] underline">Terms of Use</span>
        </div>
      </div>
    </div>
  );
}

// ── Aqua menu bar ─────────────────────────────────────────────
function AquaMenuBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="h-[22px] shrink-0 flex items-center justify-between px-3 text-[11px] text-black/85 font-medium select-none"
      style={{
        background: "linear-gradient(to bottom, #fafafa 0%, #d4d4d4 100%)",
        borderBottom: "1px solid rgba(0,0,0,0.35)",
        fontFamily: "'Lucida Grande', 'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div className="flex items-center gap-4">
        <PearLogo className="size-[14px] text-black/80 -mt-px" />
        <span className="font-bold">Finder</span>
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Go</span>
        <span>Window</span>
        <span>Help</span>
      </div>
      <div className="flex items-center gap-3 text-[11px]">
        <span className="tabular-nums">{time}</span>
      </div>
    </div>
  );
}

// ── Aqua window title bar ─────────────────────────────────────
function AquaTitleBar() {
  return (
    <div
      className="h-[22px] shrink-0 flex items-center px-2 select-none relative"
      style={{
        background: "linear-gradient(to bottom, #f6f6f6 0%, #dadada 100%)",
        borderBottom: "1px solid rgba(0,0,0,0.35)",
        borderRadius: "8px 8px 0 0",
      }}
    >
      <div className="flex items-center gap-[6px] ml-0.5">
        <TrafficLight color="red" />
        <TrafficLight color="yellow" />
        <TrafficLight color="green" />
      </div>
      <span
        className="absolute left-1/2 -translate-x-1/2 text-[13px] text-black/80 pointer-events-none whitespace-nowrap"
        style={{
          fontWeight: 500,
          fontFamily: "'Lucida Grande', 'Helvetica Neue', system-ui, sans-serif",
          textShadow: "0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        Kalahari
      </span>
    </div>
  );
}

// ── Aqua browser toolbar ──────────────────────────────────────
function AquaToolbar() {
  return (
    <div
      className="shrink-0 flex items-center gap-2 px-2 py-1"
      style={{
        background: "#ececec",
        borderBottom: "1px solid rgba(0,0,0,0.2)",
        fontFamily: "'Lucida Grande', 'Helvetica Neue', system-ui, sans-serif",
      }}
    >
      <div className="flex items-center gap-0.5">
        <div
          className="w-[22px] h-[20px] rounded flex items-center justify-center"
          style={{
            background: "linear-gradient(to bottom, #fefefe, #d8d8d8)",
            border: "1px solid rgba(0,0,0,0.3)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 1px rgba(0,0,0,0.08)",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </div>
        <div
          className="w-[22px] h-[20px] rounded flex items-center justify-center"
          style={{
            background: "linear-gradient(to bottom, #fefefe, #d8d8d8)",
            border: "1px solid rgba(0,0,0,0.3)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 1px rgba(0,0,0,0.08)",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
      <div className="flex-1 flex justify-center">
        <div
          className="w-full max-w-[320px] flex items-center justify-center py-[2px] px-3 text-[11px] text-black/60"
          style={{
            background: "white",
            border: "1px solid rgba(0,0,0,0.3)",
            borderRadius: "4px",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
            fontFamily: "'Lucida Grande', system-ui, sans-serif",
          }}
        >
          https://www.pear.com
        </div>
      </div>
      <div
        className="w-[22px] h-[20px] rounded flex items-center justify-center"
        style={{
          background: "linear-gradient(to bottom, #fefefe, #d8d8d8)",
          border: "1px solid rgba(0,0,0,0.3)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 1px rgba(0,0,0,0.08)",
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </div>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────
export function BrowserMockup() {
  const [stepIndex, setStepIndex] = useState(0);
  const [clicking, setClicking] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Voice waveform animation
  const [voiceBars, setVoiceBars] = useState<number[]>(() => generateBars(false, 0));
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const voiceSeedRef = useRef(0);
  const voiceAnimRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const frozenStep = params?.get("step") ? Number(params.get("step")) : null;
  const actualStepIndex = frozenStep !== null ? frozenStep : stepIndex;
  const step = ANIM_STEPS[actualStepIndex];

  // Animate voice waveform when in voiceRecording state
  useEffect(() => {
    if (step.state === "voiceRecording") {
      setVoiceSeconds(0);
      voiceSeedRef.current = 0;
      voiceTimerRef.current = setInterval(() => setVoiceSeconds((s) => s + 1), 1000);
      voiceAnimRef.current = setInterval(() => {
        voiceSeedRef.current += 1;
        setVoiceBars(generateBars(true, voiceSeedRef.current));
      }, 80);
    } else if (step.state === "voicePreview") {
      // Freeze bars
      if (voiceAnimRef.current) clearInterval(voiceAnimRef.current);
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    } else {
      if (voiceAnimRef.current) clearInterval(voiceAnimRef.current);
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      setVoiceBars(generateBars(false, 0));
    }
    return () => {
      if (voiceAnimRef.current) clearInterval(voiceAnimRef.current);
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    };
  }, [step.state]);

  // Step advancement
  useEffect(() => {
    if (frozenStep !== null) return;

    function advance() {
      setStepIndex((prev) => (prev + 1) % ANIM_STEPS.length);
    }

    const s = ANIM_STEPS[stepIndex];
    if (s.click) {
      setClicking(true);
      const clickTimer = setTimeout(() => setClicking(false), 150);
      timerRef.current = setTimeout(() => {
        clearTimeout(clickTimer);
        advance();
      }, s.duration);
    } else {
      setClicking(false);
      timerRef.current = setTimeout(advance, s.duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stepIndex, frozenStep]);

  
  // Scroll effect
  useEffect(() => {
    if (scrollContainerRef.current && step.scrollY !== undefined) {
      scrollContainerRef.current.scrollTo({
        top: step.scrollY,
        behavior: "smooth",
      });
    }
  }, [step.scrollY]);

  const voiceTime = `${Math.floor(voiceSeconds / 60)}:${String(voiceSeconds % 60).padStart(2, "0")}`;

  // Map states to what the bar sees. While annotating/hovering an element on the page or while a
  // popover is open, the toolbar bar itself stays in its expanded layout (just with the annotate
  // icon active) so the cursor positions remain stable for QA.
  const barState: WidgetState =
    step.state === "areaSelect" || step.state === "areaDragging" || step.state === "captured"
      ? "expanded"
      : step.state === "annotating" || step.state === "annotateHover" || step.state === "annotatePopover"
      ? "expanded"
      : step.state;

  const showAnnotationPopover = step.state === "annotatePopover";
  const isAnnotateCursor = step.state === "annotating" || step.state === "annotateHover";

  return (
    <div className="w-full h-full relative rounded-[12px] border-4 border-foreground/25">
      {/* Desktop background */}
      <div className="w-full h-full relative overflow-hidden rounded-[8px] bg-cover bg-center" style={{ backgroundImage: "url('/mockup-bg.png')" }}>
        {/* Aqua menu bar */}
        <AquaMenuBar />

        {/* Aqua Kalahari window */}
        <div
          className="flex flex-col overflow-hidden origin-center absolute inset-x-1 lg:inset-x-4"
          style={{
            top: "50%",
            transform: "translateY(calc(-50% + 11px)) scale(0.87)",
            height: "calc(100% - 32px)",
            borderRadius: "8px",
            border: "1px solid rgba(0,0,0,0.4)",
            boxShadow: "0 8px 25px rgba(0,0,0,0.5)",
          }}
        >
          <AquaTitleBar />
          <AquaToolbar />
          <div className="relative flex-1 overflow-hidden bg-white">
            <div ref={scrollContainerRef} className="absolute inset-0 overflow-hidden scrollbar-none" style={{ scrollBehavior: "smooth" }}>
              <PearSite />
            </div>

            {/* Area select overlay */}
            {(step.state === "areaSelect" || step.state === "areaDragging") && (
              <div className="absolute inset-0 z-20 bg-black/40 transition-opacity duration-300" />
            )}

            {/* Selection rectangle */}
            {step.state === "areaDragging" && step.dragStartX != null && step.dragStartY != null && (
              <div
                className="absolute z-30 border-2 border-[#3B82F6] bg-[#3B82F6]/10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  left: `${Math.min(Number(step.dragStartX), Number(step.cursorX))}%`,
                  top: `${Math.min(Number(step.dragStartY), Number(step.cursorY))}%`,
                  width: `${Math.abs(Number(step.cursorX) - Number(step.dragStartX))}%`,
                  height: `${Math.abs(Number(step.cursorY) - Number(step.dragStartY))}%`,
                }}
              >
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#3B82F6] rounded-full" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#3B82F6] rounded-full" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#3B82F6] rounded-full" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#3B82F6] rounded-full" />
              </div>
            )}

            {/* Capture flash */}
            {step.state === "captured" && (
              <div className="absolute inset-0 z-30 bg-white animate-[captureFlash_500ms_ease-out_both]" />
            )}

            <MockFeedbackBar
              widgetState={barState}
              itemCount={step.itemCount ?? 0}
              typedChars={step.typedChars}
              priority={step.priority}
              hoveredIcon={step.hoveredIcon}
              voiceBars={voiceBars}
              voiceTime={voiceTime}
            />

            {showAnnotationPopover && <MockAnnotationPopover typedChars={step.typedChars} priority={step.priority} />}

            {/* Cursor */}
            <AnimatedCursor
              x={step.cursorX}
              y={step.cursorY}
              clicking={clicking}
              crosshair={step.state === "areaSelect" || step.state === "areaDragging" || isAnnotateCursor}
            />
          </div>
        </div>

        {/* Debug HUD */}
        {frozenStep !== null && (
          <div className="absolute bottom-2 left-2 z-50 pointer-events-none bg-black/80 text-white text-[10px] font-mono px-2 py-1 rounded">
            Step {actualStepIndex} / {ANIM_STEPS.length - 1} — {step.state}
          </div>
        )}
      </div>
    </div>
  );
}

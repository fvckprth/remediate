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
function AnimatedCursor({ x, y, clicking, crosshair = false }: { x: number; y: number; clicking: boolean; crosshair?: boolean }) {
  return (
    <div
      className="absolute z-[60] pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {crosshair ? (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          className="drop-shadow-lg -translate-x-3 -translate-y-3"
        >
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="4" y1="12" x2="20" y2="12" />
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

// ── Widget icons (matching real Remediate toolbar) ────────────
function ScanIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

function CursorIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 2l16 9.25-7.2 1.65L11 20z" />
    </svg>
  );
}

function PenIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function SendIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

function CloseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z" />
      <path d="M9 2L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.17L15 2H9z" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1a4 4 0 00-4 4v7a4 4 0 008 0V5a4 4 0 00-4-4z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Widget states ────────────────────────────────────────────
type WidgetState = "idle" | "expanded" | "captureMenu" | "areaSelect" | "areaDragging" | "captured" | "noteMenu" | "hasItems" | "reviewing" | "success";

interface AnimStep {
  state: WidgetState;
  cursorX: number;
  cursorY: number;
  click: boolean;
  duration: number;
  itemCount?: number;
  /** For areaDragging: where the drag started */
  dragStartX?: number;
  dragStartY?: number;
}

const ANIM_STEPS: AnimStep[] = [
  // Cursor drifts in from offscreen
  { state: "idle",        cursorX: 95, cursorY: 95, click: false, duration: 1200 },
  // Slowly approach the feedback button
  { state: "idle",        cursorX: 90, cursorY: 90, click: false, duration: 800 },
  { state: "idle",        cursorX: 88, cursorY: 88, click: false, duration: 600 },
  // Hover over feedback — small pause
  { state: "idle",        cursorX: 87, cursorY: 86, click: false, duration: 400 },
  // Click feedback
  { state: "idle",        cursorX: 87, cursorY: 86, click: true,  duration: 200 },
  // Widget expands
  { state: "expanded",    cursorX: 87, cursorY: 86, click: false, duration: 700 },
  // Move to capture button
  { state: "expanded",    cursorX: 74, cursorY: 87, click: false, duration: 600 },
  // Hover pause
  { state: "expanded",    cursorX: 74, cursorY: 87, click: false, duration: 300 },
  // Click capture
  { state: "expanded",    cursorX: 74, cursorY: 87, click: true,  duration: 200 },
  // Capture menu opens
  { state: "captureMenu", cursorX: 74, cursorY: 87, click: false, duration: 600 },
  // Move to Screenshot option
  { state: "captureMenu", cursorX: 74, cursorY: 79, click: false, duration: 400 },
  // Click Screenshot
  { state: "captureMenu", cursorX: 74, cursorY: 79, click: true,  duration: 200 },
  // Screen dims — area select mode, cursor moves to start position
  { state: "areaSelect",  cursorX: 15, cursorY: 25, click: false, duration: 800 },
  // Click down to start drag
  { state: "areaDragging", cursorX: 15, cursorY: 25, click: true,  duration: 200, dragStartX: 15, dragStartY: 25 },
  // Drag to expand selection — cursor moves while holding
  { state: "areaDragging", cursorX: 55, cursorY: 55, click: false, duration: 1000, dragStartX: 15, dragStartY: 25 },
  // Brief pause at full size
  { state: "areaDragging", cursorX: 55, cursorY: 55, click: false, duration: 400, dragStartX: 15, dragStartY: 25 },
  // Release — capture flash
  { state: "captured",    cursorX: 55, cursorY: 55, click: false, duration: 500 },
  // Back to expanded with screenshot taken
  { state: "expanded",    cursorX: 55, cursorY: 55, click: false, duration: 800, itemCount: 1 },
  // Pause to show the result
  { state: "expanded",    cursorX: 80, cursorY: 80, click: false, duration: 1500, itemCount: 1 },
  // Reset
  { state: "idle",        cursorX: 95, cursorY: 95, click: false, duration: 1000 },
];

// ── Feedback widget (visual only) ────────────────────────────
function MockFeedbackBar({ widgetState, itemCount }: { widgetState: WidgetState; itemCount: number }) {
  const isIdle = widgetState === "idle";
  const showItems = itemCount > 0 && !isIdle;
  const isSuccess = widgetState === "success";

  return (
    <div className="absolute bottom-5 right-5 z-10">
      {/* Panels above the bar */}
      {widgetState === "captureMenu" && (
        <div className="absolute bottom-[48px] right-0 bg-[#1c1c1c] rounded-xl p-1.5 shadow-2xl border border-white/10 w-[176px] animate-[fadeInUp_200ms_ease-out]">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] text-white/80 hover:bg-white/5 transition-colors">
            <CameraIcon /> Screenshot
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] text-white/80 hover:bg-white/5 transition-colors">
            <VideoIcon /> Record
          </button>
        </div>
      )}
      {widgetState === "noteMenu" && (
        <div className="absolute bottom-[48px] right-0 bg-[#1c1c1c] rounded-xl p-1.5 shadow-2xl border border-white/10 w-[176px] animate-[fadeInUp_200ms_ease-out]">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] text-white/80 hover:bg-white/5 transition-colors">
            <TextIcon /> Text
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] text-white/80 hover:bg-white/5 transition-colors">
            <MicIcon /> Voice
          </button>
        </div>
      )}
      {widgetState === "reviewing" && (
        <div className="absolute bottom-[48px] right-0 bg-[#1c1c1c] rounded-2xl p-4 shadow-2xl border border-white/10 w-[220px] animate-[fadeInUp_200ms_ease-out]">
          <div className="text-[15px] font-semibold text-white/90 mb-3">Review ({itemCount})</div>
          <div className="flex flex-col gap-1.5">
            {["Screenshot", "Text note", "Voice note"].slice(0, itemCount).map((label, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 text-[13px] text-white/70">
                <div className="w-2.5 h-2.5 rounded-full bg-[#406dff] shrink-0" />
                {label}
              </div>
            ))}
          </div>
          <button className="mt-3 w-full bg-[#406dff] hover:bg-[#3058d9] text-white text-[14px] font-medium text-center py-2.5 rounded-xl transition-colors">
            Submit
          </button>
        </div>
      )}
      {isSuccess && (
        <div className="absolute bottom-[48px] right-0 bg-[#1c1c1c] rounded-2xl p-5 shadow-2xl border border-white/10 w-[160px] animate-[fadeInUp_200ms_ease-out] flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckIcon />
          </div>
          <span className="text-[13px] text-white/60">Sent</span>
        </div>
      )}

      {/* Toolbar bar */}
      <div
        className="flex items-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.19,1,0.22,1)]"
        style={{
          background: "#1c1c1c",
          boxShadow: "3px 4px 11px rgba(0,0,0,0.08), 13px 14px 19px rgba(0,0,0,0.07), 29px 32px 26px rgba(0,0,0,0.04)",
          padding: "4px",
          height: "40px",
        }}
      >
        {isIdle && !isSuccess ? (
          <div className="flex items-center justify-center px-2 h-8">
            <span className="text-[14px] font-medium text-white/90 whitespace-nowrap tracking-[-0.02em]" style={{ fontFamily: "'Open Runde', -apple-system, sans-serif" }}>
              Feedback
            </span>
          </div>
        ) : isSuccess ? (
          <div className="flex items-center justify-center px-3 h-8">
            <span className="text-[14px] font-medium text-emerald-400 whitespace-nowrap">Sent</span>
          </div>
        ) : (
          <div className="flex items-center gap-[6px]">
            {/* Capture */}
            <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${widgetState === "captureMenu" ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10"}`}>
              <ScanIcon />
            </button>
            {/* Annotate */}
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors">
              <CursorIcon />
            </button>
            {/* Note */}
            <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${widgetState === "noteMenu" ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10"}`}>
              <PenIcon />
            </button>
            {showItems && (
              <>
                <div className="w-px h-5 bg-white/10" />
                <button className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 relative">
                  <SendIcon />
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-[#406dff] text-white text-[11px] font-semibold rounded-full px-1 leading-none">
                    {itemCount}
                  </span>
                </button>
              </>
            )}
            <div className="w-px h-5 bg-white/10" />
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10 transition-colors">
              <CloseIcon />
            </button>
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
      {/* Top shine */}
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
        className="flex items-center shrink-0"
        style={{ background: "linear-gradient(to bottom, #b8b8b8, #8e8e8e)", borderBottom: "1px solid #555" }}
      >
        <div className="px-3 py-[5px] flex items-center" style={{ background: "linear-gradient(to bottom, #4a4a4a, #2a2a2a)" }}>
          {/* Pear logo */}
          <PearLogo className="size-[14px] text-white" />
        </div>
        {["Hardware", "Software", "Made4Pear", "Education", ".Pear", "Support"].map((tab, i) => (
          <div
            key={tab}
            className="px-3 py-[5px] text-[10px] font-medium text-white/90 border-l border-white/15"
            style={{
              background: i === 0 ? "linear-gradient(to bottom, #7ca3d4, #4778b0)" : "transparent",
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
        <h1 className="text-[32px] font-light text-black tracking-[-0.5px] leading-[1.1]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          Pear OS X Nectar
        </h1>
        <p className="text-[12px] text-[#555] mt-2 leading-relaxed max-w-[80%] mx-auto">
          Over 150 new features. The world&apos;s juiciest operating system.
        </p>
        <span className="text-[11px] text-[#06c] underline mt-2 inline-block">Learn more &gt;</span>
        <img src="/pear-lineup.png" alt="Pear product lineup" className="mt-4 mx-auto w-full max-w-[420px]" />
      </div>

      {/* Three-column strip */}
      <div className="grid grid-cols-3 border-t border-b border-[#ccc]">
        {[
          { title: "pPod", desc: "10,000 songs in your pocket.", link: "Buy now", bg: "none", icon: null, img: "/pear-pod.png" },
          { title: "pPhoto", desc: "Share your photo library.", link: "Learn more", bg: "none", icon: null, img: "/pear-photo.png" },
          { title: "Pear Store", desc: "Free shipping. Easy returns.", link: "Shop now", bg: "none", icon: null, img: "/pear-store.png" },
        ].map(({ title, desc, link, bg, icon, img }, i) => (
          <div key={title} className="text-center py-5 px-3" style={{ borderRight: i < 2 ? "1px solid #ccc" : "none" }}>
            {img ? (
              <img src={img} alt={title} className="w-[48px] h-[48px] mx-auto mb-2 rounded-[10px] object-cover" style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }} />
            ) : (
              <div
                className="w-[48px] h-[48px] mx-auto mb-2 rounded-[10px] flex items-center justify-center"
                style={{ background: bg, boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
              >
                {icon && <span className={`text-[20px] ${i === 1 ? "text-white" : ""}`}>{icon}</span>}
              </div>
            )}
            <h3 className="text-[13px] font-bold text-black">{title}</h3>
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
        {/* Pear logo */}
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
      {/* Traffic lights */}
      <div className="flex items-center gap-[6px] ml-0.5">
        <TrafficLight color="red" />
        <TrafficLight color="yellow" />
        <TrafficLight color="green" />
      </div>

      {/* Centered title */}
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
      {/* Back / Forward buttons */}
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

      {/* URL bar */}
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

      {/* Reload button */}
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
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function advance() {
      setStepIndex((prev) => (prev + 1) % ANIM_STEPS.length);
    }

    const step = ANIM_STEPS[stepIndex];
    if (step.click) {
      setClicking(true);
      const clickTimer = setTimeout(() => setClicking(false), 150);
      timerRef.current = setTimeout(() => {
        clearTimeout(clickTimer);
        advance();
      }, step.duration);
    } else {
      setClicking(false);
      timerRef.current = setTimeout(advance, step.duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stepIndex]);

  const step = ANIM_STEPS[stepIndex];

  return (
    <div className="w-full relative rounded-[12px] border-4 border-foreground/25">
      {/* Desktop background */}
      <div className="w-full aspect-[16/10] relative overflow-hidden rounded-[8px] bg-cover bg-center" style={{ backgroundImage: "url('/mockup-bg.png')" }}>
        {/* Aqua menu bar */}
        <AquaMenuBar />

        {/* Aqua Kalahari window */}
        <div
          className="mx-4 flex flex-col overflow-hidden origin-center absolute inset-x-4"
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
            <div className="absolute inset-0 overflow-y-auto scrollbar-none">
              <PearSite />
            </div>

            {/* Area select overlay */}
            {(step.state === "areaSelect" || step.state === "areaDragging") && (
              <div className="absolute inset-0 z-20 bg-black/40 transition-opacity duration-300" />
            )}

            {/* Selection rectangle */}
            {step.state === "areaDragging" && step.dragStartX != null && step.dragStartY != null && (
              <div
                className="absolute z-30 border-2 border-[#406dff] bg-[#406dff]/10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  left: `${Math.min(step.dragStartX, step.cursorX)}%`,
                  top: `${Math.min(step.dragStartY, step.cursorY)}%`,
                  width: `${Math.abs(step.cursorX - step.dragStartX)}%`,
                  height: `${Math.abs(step.cursorY - step.dragStartY)}%`,
                }}
              >
                {/* Corner handles */}
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#406dff] rounded-full" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#406dff] rounded-full" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#406dff] rounded-full" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#406dff] rounded-full" />
              </div>
            )}

            {/* Capture flash */}
            {step.state === "captured" && (
              <div className="absolute inset-0 z-30 bg-white animate-[captureFlash_500ms_ease-out_both]" />
            )}

            <MockFeedbackBar widgetState={step.state === "areaSelect" || step.state === "areaDragging" || step.state === "captured" ? "expanded" : step.state} itemCount={step.itemCount ?? 0} />
          </div>
        </div>

        {/* Cursor */}
        <AnimatedCursor x={step.cursorX} y={step.cursorY} clicking={clicking} crosshair={step.state === "areaSelect" || step.state === "areaDragging"} />
      </div>
    </div>
  );
}

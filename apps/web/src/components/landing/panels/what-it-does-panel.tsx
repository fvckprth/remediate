"use client";

/* SVG paths from the widget icon set (20×20 in 24×24 viewBox) */
const SCAN_LINE =
  "M4 15a1 1 0 0 1 .993.883L5 16v3h4a1 1 0 0 1 .117 1.993L9 21H5a2 2 0 0 1-1.995-1.85L3 19v-3a1 1 0 0 1 1-1m16 0a1 1 0 0 1 1 1v3a2 2 0 0 1-2 2h-4a1 1 0 1 1 0-2h4v-3a1 1 0 0 1 1-1m0-4a1 1 0 0 1 .117 1.993L20 13H4a1 1 0 0 1-.117-1.993L4 11zM9 3a1 1 0 0 1 0 2H5v3a1 1 0 0 1-2 0V5a2 2 0 0 1 2-2zm10 0a2 2 0 0 1 2 2v3a1 1 0 1 1-2 0V5h-4a1 1 0 1 1 0-2z";
const CURSOR_3_FILL =
  "M10 3a1 1 0 0 0-2 0v2a1 1 0 0 0 2 0zM5.464 4.05A1 1 0 1 0 4.05 5.464L5.464 6.88A1 1 0 1 0 6.88 5.464zm4.327 4.16c-.978-.326-1.907.603-1.582 1.58l3.533 10.598c.357 1.072 1.84 1.158 2.319.134l2.055-4.406 4.406-2.055c1.024-.478.938-1.962-.134-2.319zm4.159-4.16a1 1 0 0 1 0 1.414L12.536 6.88a1 1 0 1 1-1.415-1.415l1.415-1.414a1 1 0 0 1 1.414 0M2 9a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1m4.879 3.536a1 1 0 1 0-1.415-1.415L4.05 12.536a1 1 0 1 0 1.414 1.414z";
const PEN_FILL =
  "m14.295 4.98 4.724 4.725a2 2 0 0 1 .443 2.157l-2.365 5.913a2 2 0 0 1-1.605 1.24l-5.079.635q-.196.023-.41.056l-.444.072-.232.042-.723.14-.495.105-.745.168-.955.228-1.552.396-.646.174a1.01 1.01 0 0 1-1.265-1.134l.034-.146.295-1.112.264-1.048.228-.955.167-.745.105-.496.141-.722.08-.457.064-.428.66-5.28a2 2 0 0 1 1.241-1.605l5.913-2.365a2 2 0 0 1 2.157.443Zm-3.71 5.605a2 2 0 0 0-.507 1.968 1 1 0 0 0-.2.154L5.82 16.765a.2.2 0 0 0-.053.098l-.089.385-.178.743-.086.351a.2.2 0 0 0 .244.244l.717-.175.763-.178a.2.2 0 0 0 .097-.054l4.058-4.058a1 1 0 0 0 .154-.199 2 2 0 1 0-.861-3.337Zm4.658-7.484a1 1 0 0 1 1.32-.084l.094.084L20.9 7.343a1 1 0 0 1-1.32 1.498l-.095-.084-4.242-4.242a1 1 0 0 1 0-1.414";
const SETTINGS_1_FILL =
  "M10.75 2.567a2.5 2.5 0 0 1 2.5 0L19.544 6.2a2.5 2.5 0 0 1 1.25 2.165v7.268a2.5 2.5 0 0 1-1.25 2.165l-6.294 3.634a2.5 2.5 0 0 1-2.5 0l-6.294-3.634a2.5 2.5 0 0 1-1.25-2.165V8.366A2.5 2.5 0 0 1 4.456 6.2zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6";
const CLOSE_LINE =
  "m12 13.414 5.657 5.657a1 1 0 0 0 1.414-1.414L13.414 12l5.657-5.657a1 1 0 0 0-1.414-1.414L12 10.586 6.343 4.929A1 1 0 0 0 4.93 6.343L10.586 12l-5.657 5.657a1 1 0 1 0 1.414 1.414z";
const CHECK_LINE =
  "M9.55 18a1 1 0 0 1-.71-.29l-4.55-4.55a1 1 0 1 1 1.42-1.41L9.55 15.59l9.79-9.79a1 1 0 0 1 1.41 1.41l-10.5 10.5a1 1 0 0 1-.7.29";

const ACTION_ICONS = [SCAN_LINE, CURSOR_3_FILL, PEN_FILL, SETTINGS_1_FILL];

type Phase = "idle" | "toolbar" | "sent";

const WIDTH: Record<Phase, number> = { idle: 90, toolbar: 195, sent: 120 };
const EASING_MORPH = "cubic-bezier(0.19, 1, 0.22, 1)";
const EASING_TOOLS_IN = "cubic-bezier(0.32, 0.72, 0, 1)";

interface WidgetMorphPanelProps {
  phase: Phase;
}

export function WidgetMorphPanel({ phase }: WidgetMorphPanelProps) {
  const isIdle = phase === "idle";
  const isToolbar = phase === "toolbar";
  const isSent = phase === "sent";

  return (
    <div className="flex items-center justify-center h-full">
      <div
        style={{
          transform: "scale(1.5)",
          width: WIDTH[phase],
          height: 40,
          background: "#1c1c1c",
          borderRadius: 9999,
          padding: 4,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          boxShadow:
            "3px 4px 11px 0px rgba(0,0,0,0.08), 13px 14px 19px 0px rgba(0,0,0,0.07), 29px 32px 26px 0px rgba(0,0,0,0.04), 52px 57px 31px 0px rgba(0,0,0,0.01)",
          transition: `width 400ms ${EASING_MORPH}`,
        }}
      >
        {/* "Feedback" label — visible in idle */}
        <div
          style={{
            position: "absolute",
            inset: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: isIdle ? 1 : 0,
            filter: isIdle ? "blur(0px)" : "blur(4px)",
            transform: isIdle ? "scale(1)" : "scale(0.95)",
            transition:
              "opacity 150ms ease-out, filter 150ms ease-out, transform 150ms ease-out",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#e7e7e7",
              fontFamily: '"Open Runde", -apple-system, sans-serif',
              letterSpacing: "-0.02em",
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            Feedback
          </span>
        </div>

        {/* Toolbar icons — visible in toolbar */}
        <div
          style={{
            position: "absolute",
            right: 4,
            top: 4,
            bottom: 4,
            display: "flex",
            alignItems: "center",
            opacity: isToolbar ? 1 : 0,
            filter: isToolbar ? "blur(0px)" : "blur(4px)",
            transform: isToolbar ? "scale(1)" : "scale(0.9)",
            transition: isToolbar
              ? `filter 400ms ${EASING_TOOLS_IN} 50ms, opacity 400ms ${EASING_TOOLS_IN} 50ms, transform 400ms ${EASING_TOOLS_IN} 50ms`
              : `filter 150ms ${EASING_MORPH}, opacity 150ms ${EASING_MORPH}, transform 150ms ${EASING_MORPH}`,
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {ACTION_ICONS.map((d, i) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(231,231,231,0.5)",
                }}
              >
                <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
                  <path d={d} />
                </svg>
              </div>
            ))}
          </div>

          <div
            style={{
              width: 1,
              height: 16,
              background: "rgba(231,231,231,0.05)",
              borderRadius: 9999,
              margin: "0 4px",
              flexShrink: 0,
            }}
          />

          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(231,231,231,0.5)",
            }}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
              <path d={CLOSE_LINE} />
            </svg>
          </div>
        </div>

        {/* Checkmark + "Sent" — visible in sent */}
        <div
          style={{
            position: "absolute",
            inset: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            opacity: isSent ? 1 : 0,
            filter: isSent ? "blur(0px)" : "blur(4px)",
            transform: isSent ? "scale(1)" : "scale(0.95)",
            transition:
              "opacity 150ms ease-out, filter 150ms ease-out, transform 150ms ease-out",
            pointerEvents: "none",
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="#e7e7e7">
            <path d={CHECK_LINE} />
          </svg>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#e7e7e7",
              fontFamily: '"Open Runde", -apple-system, sans-serif',
              letterSpacing: "-0.02em",
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            Sent
          </span>
        </div>
      </div>
    </div>
  );
}

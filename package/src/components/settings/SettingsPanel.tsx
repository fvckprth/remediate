import { MARKER_COLORS } from "../../types";
import { CheckLine, SunLine, MoonLine } from "../icons";

interface SettingsPanelProps {
  markerColor: string;
  blockInteractions: boolean;
  widgetTheme: "light" | "dark";
  onSetColor: (color: string) => void;
  onSetBlock: (blocked: boolean) => void;
  onSetTheme: (theme: "light" | "dark") => void;
}

export function SettingsPanel({
  markerColor,
  blockInteractions,
  widgetTheme,
  onSetColor,
  onSetBlock,
  onSetTheme,
}: SettingsPanelProps) {
  const isDark = widgetTheme === "dark";

  return (
    <div className="rm-settings" data-remediate-widget="">
      {/* Header */}
      <div className="rm-settings__header">
        <span className="rm-settings__title">/remediate</span>
        <span className="rm-settings__version">v0.1.0</span>
        <button
          className="rm-theme-toggle"
          onClick={() => onSetTheme(isDark ? "light" : "dark")}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="rm-theme-icon-wrapper">
            <span className="rm-theme-icon" key={isDark ? "sun" : "moon"}>
              {isDark ? <SunLine size={16} /> : <MoonLine size={16} />}
            </span>
          </span>
        </button>
      </div>

      {/* Theme */}
      <span className="rm-settings__label">Theme</span>
      <div className="rm-color-swatches">
        {MARKER_COLORS.map((color) => (
          <div
            key={color}
            className={`rm-swatch-ring ${markerColor === color ? "rm-swatch-ring--active" : ""}`}
            style={{ "--swatch-color": color } as React.CSSProperties}
            onClick={() => onSetColor(color)}
            role="button"
            aria-label={`Set theme color to ${color}`}
          >
            <div className={`rm-swatch ${markerColor === color ? "rm-swatch--active" : ""}`} />
          </div>
        ))}
      </div>

      {/* Checkboxes */}
      <div className="rm-settings__checkbox-row">
        <button
          className={`rm-settings__checkbox ${blockInteractions ? "rm-settings__checkbox--checked" : ""}`}
          onClick={() => onSetBlock(!blockInteractions)}
          aria-label="Toggle block page interactions"
        >
          {blockInteractions && <CheckLine size={12} />}
        </button>
        <span
          className="rm-settings__checkbox-label"
          onClick={() => onSetBlock(!blockInteractions)}
        >
          Block page interactions
        </span>
      </div>
    </div>
  );
}

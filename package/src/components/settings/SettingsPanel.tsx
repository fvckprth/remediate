import { CheckLine, SunLine, MoonLine } from "../icons";

interface SettingsPanelProps {
  blockInteractions: boolean;
  widgetTheme: "light" | "dark";
  onSetBlock: (blocked: boolean) => void;
  onSetTheme: (theme: "light" | "dark") => void;
}

export function SettingsPanel({
  blockInteractions,
  widgetTheme,
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

import { useState } from "react";
import { MARKER_COLORS } from "../../types";
import { CheckLine } from "../icons";

const STORAGE_KEY_NAME = "rm_reporter_name";
const STORAGE_KEY_EMAIL = "rm_reporter_email";

interface SettingsPanelProps {
  markerColor: string;
  blockInteractions: boolean;
  onSetColor: (color: string) => void;
  onSetBlock: (blocked: boolean) => void;
}

export function SettingsPanel({
  markerColor,
  blockInteractions,
  onSetColor,
  onSetBlock,
}: SettingsPanelProps) {
  const [name, setName] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_NAME) : null) ?? "",
  );
  const [email, setEmail] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_EMAIL) : null) ?? "",
  );

  function handleNameChange(value: string) {
    setName(value);
    localStorage.setItem(STORAGE_KEY_NAME, value);
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    localStorage.setItem(STORAGE_KEY_EMAIL, value);
  }

  return (
    <div className="rm-settings" data-remediate-widget="">
      {/* Header */}
      <div className="rm-settings__header">
        <span className="rm-settings__title">/remediate</span>
        <span className="rm-settings__version">v0.1.0</span>
      </div>

      {/* Reporter */}
      <div className="rm-settings__input-group">
        <input
          className="rm-settings__input"
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          autoComplete="off"
        />
        <input
          className="rm-settings__input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          autoComplete="off"
        />
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

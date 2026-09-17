interface PanelActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  cancelLabel?: string;
  disabled?: boolean;
  tabIndex?: number;
}

/** Cancel + primary action pair used at the bottom of every panel. */
export function PanelActions({ onCancel, onSubmit, submitLabel, cancelLabel = "Cancel", disabled, tabIndex }: PanelActionsProps) {
  return (
    <div className="rm-actions">
      <button type="button" className="rm-btn rm-btn--ghost" onClick={onCancel} tabIndex={tabIndex}>
        {cancelLabel}
      </button>
      <button type="button" className="rm-btn rm-btn--accent" onClick={onSubmit} disabled={disabled} tabIndex={tabIndex}>
        {submitLabel}
      </button>
    </div>
  );
}

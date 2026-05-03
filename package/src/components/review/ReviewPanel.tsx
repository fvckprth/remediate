import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedbackItem } from "../../types";
import {
  CameraFill, CamcorderFill, Cursor3Fill, Message4Fill, VoiceFill,
  CloseLine, EyeLine,
} from "../icons";
import { PriorityIcon } from "../shared/PriorityButton";

interface ReviewPanelProps {
  items: FeedbackItem[];
  isSubmitting?: boolean;
  onRemoveItem: (id: string) => void;
  onPreviewItem: (id: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

function itemIcon(type: FeedbackItem["type"]) {
  switch (type) {
    case "photo": return <CameraFill size={16} />;
    case "video": return <CamcorderFill size={16} />;
    case "annotation": return <Cursor3Fill size={16} />;
    case "textNote": return <Message4Fill size={16} />;
    case "voiceNote": return <VoiceFill size={16} />;
  }
}

function itemLabel(item: FeedbackItem) {
  switch (item.type) {
    case "photo":
      return `${Math.round(item.area.width)} \u00d7 ${Math.round(item.area.height)} at (${Math.round(item.area.x)}, ${Math.round(item.area.y)})`;
    case "video":
      return `${item.duration} seconds`;
    case "annotation": {
      const suffix = item.priority && item.priority !== "none" ? ` [${item.priority}]` : "";
      return item.element.name + suffix;
    }
    case "textNote":
      return item.text;
    case "voiceNote":
      return `~${Math.ceil(item.duration / 60)} minute${Math.ceil(item.duration / 60) !== 1 ? "s" : ""}`;
  }
}

export function ReviewPanel({ items, isSubmitting, onRemoveItem, onPreviewItem, onBack, onSubmit }: ReviewPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMask, setScrollMask] = useState({ top: false, bottom: false });

  const updateScrollMask = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setScrollMask({
      top: el.scrollTop > 0,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    });
  }, []);

  useEffect(() => {
    updateScrollMask();
  }, [items.length, updateScrollMask]);

  return (
    <div
      className="rm-review-panel"
      data-remediate-widget=""
    >
      <div
        ref={listRef}
        className="rm-review-panel__list"
        onScroll={updateScrollMask}
        data-mask-top={scrollMask.top || undefined}
        data-mask-bottom={scrollMask.bottom || undefined}
      >
        {items.map((item, i) => (
          <div
            key={item.id}
            className="rm-review-item"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className="rm-review-item__priority">
              {item.priority && item.priority !== "none" ? (
                <PriorityIcon priority={item.priority} />
              ) : (
                <span className="rm-review-item__no-priority">---</span>
              )}
            </span>
            <div className="rm-review-item__meta">
              <span className="rm-review-item__icon">{itemIcon(item.type)}</span>
              <span className="rm-review-item__label">{itemLabel(item)}</span>
            </div>
            <div className="rm-review-item__actions">
              <button
                className="rm-review-item__action-btn"
                onClick={() => onPreviewItem(item.id)}
                aria-label={`Preview item ${item.index}`}
              >
                <EyeLine size={16} />
              </button>
              <button
                className="rm-review-item__action-btn rm-review-item__action-btn--danger"
                onClick={() => onRemoveItem(item.id)}
                aria-label={`Remove item ${item.index}`}
              >
                <CloseLine size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rm-review-panel__footer">
        <span className="rm-review-panel__count">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
        <div className="rm-popover__actions">
          <button className="rm-popover__cancel" onClick={onBack}>
            Cancel
          </button>
          <button
            className="rm-popover__submit"
            onClick={onSubmit}
            disabled={items.length === 0 || isSubmitting}
          >
            {isSubmitting ? "Sending\u2026" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

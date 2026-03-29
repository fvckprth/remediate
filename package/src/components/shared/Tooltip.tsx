import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: string;
  children: ReactNode;
  delay?: number;
  disabled?: boolean;
  /** Reference element whose top edge the tooltip sits above (with gap) */
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export function Tooltip({ content, children, delay = 500, disabled = false, anchorRef }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When disabled flips to true, immediately hide
  useEffect(() => {
    if (disabled) {
      if (enterTimerRef.current) {
        clearTimeout(enterTimerRef.current);
        enterTimerRef.current = null;
      }
      setVisible(false);
      setShouldRender(false);
    }
  }, [disabled]);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Position above the anchor element (e.g. toolbar bar) if provided, otherwise above the trigger
    const anchorTop = anchorRef?.current?.getBoundingClientRect().top ?? rect.top;
    setPosition({
      top: anchorTop - 6,
      left: rect.left + rect.width / 2,
    });
  }, [anchorRef]);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    setShouldRender(true);
    updatePosition();
    enterTimerRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  }, [delay, updatePosition, disabled]);

  const handleMouseLeave = useCallback(() => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    setVisible(false);
    exitTimerRef.current = setTimeout(() => {
      setShouldRender(false);
    }, 150);
  }, []);

  useEffect(() => {
    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ display: "inline-flex" }}
      >
        {children}
      </span>
      {shouldRender &&
        createPortal(
          <div
            className={`rm-tooltip${visible ? " rm-tooltip--visible" : ""}`}
            data-remediate-widget=""
            style={{
              top: position.top,
              left: position.left,
              transform: `translateX(-50%) translateY(-100%)${visible ? "" : " translateY(4px)"}`,
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}

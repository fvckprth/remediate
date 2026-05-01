import { useState, useEffect, useRef, useCallback, useLayoutEffect, type ReactNode } from "react";
import { useMeasure } from "../../utils/use-measure";

const EXIT_MS = 150; // matches rm-fade-out duration

interface PanelHostProps {
  panelKey: string | null;
  position?: { bottom?: number; top?: number; left?: number; right?: number };
  below?: boolean;
  maxWidth?: number;
  pill?: boolean;
  children: ReactNode;
}

interface PanelItem {
  id: string;
  key: string;
  content: ReactNode;
  isExiting: boolean;
}

function PanelMeasurer({
  panelKey,
  isExiting,
  children,
  onMeasure,
}: {
  panelKey: string;
  isExiting: boolean;
  children: ReactNode;
  onMeasure: (key: string, bounds: { width: number; height: number }) => void;
}) {
  const [ref, bounds] = useMeasure<HTMLDivElement>();

  // Synchronous measurement on mount to prevent 1-frame delay
  useLayoutEffect(() => {
    if (ref.current && !isExiting) {
      const rect = ref.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        onMeasure(panelKey, { width: rect.width, height: rect.height });
      }
    }
  }, [panelKey, isExiting, onMeasure]);

  // Async measurement for dynamic resizing
  useEffect(() => {
    if (bounds.width > 0 && bounds.height > 0 && !isExiting) {
      onMeasure(panelKey, bounds);
    }
  }, [bounds, panelKey, isExiting, onMeasure]);

  return (
    <div ref={ref} style={{ width: "max-content", height: "max-content" }}>
      {children}
    </div>
  );
}

export function PanelHost({ panelKey, position, below, maxWidth, pill, children }: PanelHostProps) {
  const [panels, setPanels] = useState<PanelItem[]>([]);
  const idCounter = useRef(0);
  const contentRef = useRef(children);
  contentRef.current = children;

  const [hostBounds, setHostBounds] = useState({ width: 0, height: 0 });
  const [measuredPanelKey, setMeasuredPanelKey] = useState<string | null>(panelKey);
  const prevPositionRef = useRef(position);

  // Disable CSS transitions after panel swap settles so internal resizes
  // (e.g. accordion toggle) don't fight the content's own transitions.
  const [isSettled, setIsSettled] = useState(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setIsSettled(false);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    if (panelKey !== null) {
      settleTimerRef.current = setTimeout(() => setIsSettled(true), 400);
    }
    return () => { if (settleTimerRef.current) clearTimeout(settleTimerRef.current); };
  }, [panelKey]);

  // Refs for shrink-delay: when morphing to a smaller panel, delay the
  // container resize so the exit animation plays without clipping.
  const hostBoundsRef = useRef({ width: 0, height: 0 });
  const measuredKeyRef = useRef<string | null>(null);
  const shrinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHostClosed = hostBounds.width === 0;
  const isWaitingForMeasurement = panelKey !== null && panelKey !== measuredPanelKey;
  const isExiting = panelKey === null && panels.length > 0;

  const shouldUsePrevious = (isWaitingForMeasurement && !isHostClosed) || isExiting;

  if (!shouldUsePrevious) {
    prevPositionRef.current = position;
  }

  const activePosition = shouldUsePrevious ? prevPositionRef.current : position;

  const handleMeasure = useCallback((key: string, bounds: { width: number, height: number }) => {
    if (shrinkTimerRef.current) {
      clearTimeout(shrinkTimerRef.current);
      shrinkTimerRef.current = null;
    }

    const current = hostBoundsRef.current;
    const isNewPanel = key !== measuredKeyRef.current;
    const isShrinking = isNewPanel && current.width > 0 && current.height > 0 &&
      (bounds.width < current.width || bounds.height < current.height);

    const apply = () => {
      hostBoundsRef.current = bounds;
      measuredKeyRef.current = key;
      setHostBounds(bounds);
      setMeasuredPanelKey(key);
    };

    if (isShrinking) {
      // Let exit animation play before container starts shrinking
      shrinkTimerRef.current = setTimeout(apply, 80);
    } else {
      apply();
    }
  }, []);

  useEffect(() => {
    setPanels((currentPanels) => {
      const nextPanels = currentPanels.map((p) =>
        p.isExiting ? p : { ...p, isExiting: true }
      );

      if (panelKey) {
        idCounter.current += 1;
        nextPanels.push({
          id: String(idCounter.current),
          key: panelKey,
          content: contentRef.current,
          isExiting: false,
        });
      }

      return nextPanels;
    });
  }, [panelKey]);

  useEffect(() => {
    setPanels((currentPanels) => {
      const activePanel = currentPanels.find((p) => !p.isExiting && p.key === panelKey);
      if (!activePanel || activePanel.content === children) return currentPanels;
      return currentPanels.map((p) =>
        p === activePanel ? { ...p, content: children } : p
      );
    });
  }, [children, panelKey]);

  const hasExiting = panels.some((p) => p.isExiting);
  const isHostExiting = panels.every((p) => p.isExiting);

  useEffect(() => {
    if (!hasExiting) return;
    const timer = setTimeout(() => {
      setPanels((currentPanels) => currentPanels.filter((p) => !p.isExiting));
      if (isHostExiting) {
        setHostBounds({ width: 0, height: 0 });
        hostBoundsRef.current = { width: 0, height: 0 };
        measuredKeyRef.current = null;
      }
    }, EXIT_MS);
    return () => clearTimeout(timer);
  }, [hasExiting, isHostExiting]);

  useEffect(() => {
    return () => {
      if (shrinkTimerRef.current) clearTimeout(shrinkTimerRef.current);
    };
  }, []);

  if (panels.length === 0) return null;

  return (
    <div
      className="rm-panel-host"
      data-exiting={isHostExiting ? "" : undefined}
      data-below={below ? "" : undefined}
      data-pill={pill ? "" : undefined}
      data-settled={isSettled ? "" : undefined}
      style={{
        bottom: activePosition?.bottom,
        top: activePosition?.top,
        left: activePosition?.left,
        right: activePosition?.right,
        width: hostBounds.width > 0 ? hostBounds.width : undefined,
        height: hostBounds.height > 0 ? hostBounds.height : undefined,
        maxWidth: maxWidth,
      }}
    >
      {panels.map((panel) => (
        <div
          key={panel.id}
          className="rm-panel-wrapper"
          data-exiting={panel.isExiting ? "" : undefined}
        >
          <PanelMeasurer
            panelKey={panel.key}
            isExiting={panel.isExiting}
            onMeasure={handleMeasure}
          >
            {panel.content}
          </PanelMeasurer>
        </div>
      ))}
    </div>
  );
}

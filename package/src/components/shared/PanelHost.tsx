import { useState, useEffect, useRef, useCallback, useLayoutEffect, type ReactNode } from "react";
import { useMeasure } from "../../utils/use-measure";

const EXIT_MS = 200; // matches rm-fade-out duration

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

  // Synchronous measurement on mount to prevent 1-frame delay.
  // Uses offsetWidth/offsetHeight instead of getBoundingClientRect so
  // ancestor transforms (e.g. rm-fade-in's scale(0.96)) don't skew the value.
  useLayoutEffect(() => {
    if (ref.current && !isExiting) {
      const w = ref.current.offsetWidth;
      const h = ref.current.offsetHeight;
      if (w > 0 && h > 0) {
        onMeasure(panelKey, { width: w, height: h });
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

  // Track host bounds and measured panel key
  const hostBoundsRef = useRef({ width: 0, height: 0 });
  const measuredKeyRef = useRef<string | null>(null);

  // During internal resizes (e.g. accordion toggle), we briefly disable transitions
  // so the container snaps instead of fighting the content's own layout animations.
  const [isSnapping, setIsSnapping] = useState(false);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => { if (snapTimerRef.current) clearTimeout(snapTimerRef.current); };
  }, []);

  const isHostClosed = hostBounds.width === 0;
  const isWaitingForMeasurement = panelKey !== null && panelKey !== measuredPanelKey;
  const isExiting = panelKey === null && panels.length > 0;

  const shouldUsePrevious = (isWaitingForMeasurement && !isHostClosed) || isExiting;

  if (!shouldUsePrevious) {
    prevPositionRef.current = position;
  }

  const activePosition = shouldUsePrevious ? prevPositionRef.current : position;

  const handleMeasure = useCallback((key: string, bounds: { width: number, height: number }) => {
    const isNewPanel = key !== measuredKeyRef.current;
    
    const apply = () => {
      hostBoundsRef.current = bounds;
      measuredKeyRef.current = key;
      setHostBounds(bounds);
      setMeasuredPanelKey(key);
    };

    if (!isNewPanel) {
      // Skip if dimensions haven't meaningfully changed — prevents the
      // ResizeObserver's initial notification from triggering snapping mode
      // and killing the in-progress CSS morph transition.
      const prev = hostBoundsRef.current;
      if (Math.abs(prev.width - bounds.width) < 1 && Math.abs(prev.height - bounds.height) < 1) {
        return;
      }
      setIsSnapping(true);
      apply();
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
      snapTimerRef.current = setTimeout(() => setIsSnapping(false), 50);
    } else {
      apply();
    }
  }, []);

  useLayoutEffect(() => {
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

  useLayoutEffect(() => {
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

  if (panels.length === 0) return null;

  return (
    <div
      className="rm-panel-host"
      data-exiting={isHostExiting ? "" : undefined}
      data-below={below ? "" : undefined}
      data-pill={pill ? "" : undefined}
      data-snapping={isSnapping ? "" : undefined}
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

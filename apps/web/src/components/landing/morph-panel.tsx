"use client";

import { useEffect, useRef, useState } from "react";
import { BuiltForPanel } from "./panels/built-for-panel";
import { DeliveredPanel } from "./panels/delivered-panel";
import { OpenSourcePanel } from "./panels/open-source-panel";
import { SetupPanel } from "./panels/setup-panel";
import { WidgetMorphPanel } from "./panels/what-it-does-panel";

/* Sections that share the WidgetMorphPanel — skip crossfade between them */
const MORPH_CHAIN_SECTIONS = new Set(["theWidget", "captureAnything", "oneClick"]);

const PHASE_MAP: Record<string, "idle" | "toolbar" | "sent"> = {
  theWidget: "idle",
  captureAnything: "toolbar",
  oneClick: "sent",
};

interface MorphPanelProps {
  activeSection: string;
}

export function MorphPanel({ activeSection }: MorphPanelProps) {
  const [displayed, setDisplayed] = useState(activeSection);
  const [transitioning, setTransitioning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (activeSection === displayed) return;

    /* Both sections use the same WidgetMorphPanel — update immediately, no crossfade */
    if (MORPH_CHAIN_SECTIONS.has(activeSection) && MORPH_CHAIN_SECTIONS.has(displayed)) {
      setDisplayed(activeSection);
      return;
    }

    setTransitioning(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setDisplayed(activeSection);
      setTransitioning(false);
    }, 150);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [activeSection, displayed]);

  function renderPanel() {
    if (MORPH_CHAIN_SECTIONS.has(displayed)) {
      const phase = PHASE_MAP[activeSection] ?? PHASE_MAP[displayed] ?? "idle";
      return <WidgetMorphPanel phase={phase} />;
    }
    switch (displayed) {
      case "whereLands":
        return <DeliveredPanel />;
      case "builtFor":
        return <BuiltForPanel />;
      case "getStarted":
        return <SetupPanel />;
      case "openSource":
        return <OpenSourcePanel />;
      default:
        return null;
    }
  }

  return (
    <div className="flex-1 h-full relative overflow-hidden rounded-xl bg-foreground/5">
      <div
        className="absolute inset-0 transition-opacity duration-150"
        style={{
          opacity: transitioning ? 0 : 1,
          transitionTimingFunction: "cubic-bezier(0.19, 1, 0.22, 1)",
        }}
      >
        {renderPanel()}
      </div>
    </div>
  );
}

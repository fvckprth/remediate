"use client";

import { useEffect, useRef, useState } from "react";

const TABS = ["hosted", "react", "script tag"] as const;
type Tab = (typeof TABS)[number];

function HostedContent() {
  return (
    <div className="flex flex-col gap-4">
      {[
        "sign up at remediate.dev",
        "create a project",
        "copy your project key",
        "paste it into the widget",
      ].map((text, i) => (
        <div key={i} className="flex gap-3 leading-[1.35]">
          <span className="text-foreground/25 shrink-0">{i + 1}.</span>
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}

function ReactContent() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg bg-background p-4 font-mono text-[14px] text-foreground/50">
        npm install remediate
      </div>
      <div className="rounded-lg bg-background p-4 font-mono text-[14px] text-foreground/50 whitespace-pre">{`import { Remediate } from 'remediate'

<Remediate endpoint="/api/feedback" />`}</div>
    </div>
  );
}

function ScriptTagContent() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg bg-background p-4 font-mono text-[14px] text-foreground/50 whitespace-pre">{`<script src="https://unpkg.com/remediate"></script>

<remediate-widget endpoint="/api/feedback" />`}</div>
    </div>
  );
}

const TAB_CONTENT: Record<Tab, () => React.JSX.Element> = {
  hosted: HostedContent,
  react: ReactContent,
  "script tag": ScriptTagContent,
};

export function SetupPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("hosted");
  const [displayed, setDisplayed] = useState<Tab>("hosted");
  const [transitioning, setTransitioning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (activeTab === displayed) return;

    setTransitioning(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setDisplayed(activeTab);
      setTransitioning(false);
    }, 150);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [activeTab, displayed]);

  const Content = TAB_CONTENT[displayed];

  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      <div className="flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-full text-[14px] font-medium tracking-[-0.56px] transition-colors cursor-pointer ${
              activeTab === tab
                ? "bg-foreground/10 text-foreground"
                : "text-foreground/25 hover:text-foreground/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div
        className="flex-1 transition-opacity duration-150 text-[16px] font-medium tracking-[-0.64px] text-foreground/50"
        style={{
          opacity: transitioning ? 0 : 1,
          transitionTimingFunction: "cubic-bezier(0.19, 1, 0.22, 1)",
        }}
      >
        <Content />
      </div>
    </div>
  );
}

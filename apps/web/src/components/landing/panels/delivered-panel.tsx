"use client";

import { useEffect, useRef, useState } from "react";

const TABS = ["Slack", "Linear", "GitHub", "Email", "Webhooks"] as const;
type Tab = (typeof TABS)[number];

function SlackContent() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[14px]">
        <span className="text-foreground/25 font-medium">#</span>
        <span className="text-foreground/50 font-medium">product-feedback</span>
      </div>
      <div className="rounded-lg border border-foreground/5 bg-background p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-foreground/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-foreground/30">R</span>
          </div>
          <span className="text-foreground/75 font-semibold text-[14px]">remediate</span>
          <span className="text-foreground/20 text-[12px]">10:42 AM</span>
        </div>
        <div className="border-l-[3px] border-foreground/10 pl-3 flex flex-col gap-2.5">
          <div className="text-[14px] font-semibold text-foreground/60">
            Button overlap on mobile nav
          </div>
          <div className="flex flex-col gap-1 text-[13px] text-foreground/35">
            <div className="flex gap-1">
              <span className="text-foreground/20">Priority:</span>
              <span className="text-[#ef4444]/70">High</span>
            </div>
            <div className="flex gap-1">
              <span className="text-foreground/20">Page:</span>
              <span>/dashboard/settings</span>
            </div>
            <div className="flex gap-1">
              <span className="text-foreground/20">Browser:</span>
              <span>Chrome 124 · macOS</span>
            </div>
          </div>
          <div className="h-[48px] w-[80px] rounded-md bg-foreground/5 flex items-center justify-center">
            <span className="text-[10px] text-foreground/15">screenshot</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinearContent() {
  return (
    <div className="rounded-lg border border-foreground/5 bg-background p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-4 rounded-full border-2 border-[#f59e0b]/50" />
          <span className="text-[13px] text-foreground/30 font-medium">REM-42</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ef4444]/5">
            <div className="size-1.5 rounded-full bg-[#ef4444]/50" />
            <span className="text-[11px] text-[#ef4444]/60 font-medium">Urgent</span>
          </div>
          <div className="size-5 rounded-full bg-foreground/5" />
        </div>
      </div>
      <div className="text-[15px] font-semibold text-foreground/70">
        Button overlap on mobile nav
      </div>
      <div className="flex flex-col gap-1.5 text-[13px] text-foreground/35 leading-relaxed">
        <p>Navigation buttons overlap at 375px viewport width. Submit and cancel buttons stack incorrectly.</p>
      </div>
      <div className="flex gap-2">
        <div className="px-2 py-0.5 rounded-md bg-foreground/5 text-[11px] text-foreground/30 font-medium">
          bug
        </div>
        <div className="px-2 py-0.5 rounded-md bg-foreground/5 text-[11px] text-foreground/30 font-medium">
          feedback
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-foreground/5">
        <div className="h-[40px] w-[64px] rounded-md bg-foreground/5 flex items-center justify-center">
          <span className="text-[9px] text-foreground/15">screenshot</span>
        </div>
        <div className="h-[40px] w-[64px] rounded-md bg-foreground/5 flex items-center justify-center">
          <span className="text-[9px] text-foreground/15">recording</span>
        </div>
      </div>
    </div>
  );
}

function GitHubContent() {
  return (
    <div className="rounded-lg border border-foreground/5 bg-background p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <svg width={16} height={16} viewBox="0 0 16 16" className="text-[#28c840]/60" fill="currentColor">
          <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
        </svg>
        <span className="text-[13px] text-foreground/25 font-medium">Open</span>
      </div>
      <div className="flex items-start gap-2">
        <span className="text-[15px] font-semibold text-foreground/70">
          Button overlap on mobile nav
        </span>
        <span className="text-[15px] text-foreground/20 font-medium">#42</span>
      </div>
      <div className="flex gap-1.5">
        <div className="px-2 py-0.5 rounded-full bg-[#ef4444]/10 text-[11px] text-[#ef4444]/50 font-medium border border-[#ef4444]/10">
          bug
        </div>
        <div className="px-2 py-0.5 rounded-full bg-foreground/5 text-[11px] text-foreground/30 font-medium border border-foreground/5">
          feedback
        </div>
        <div className="px-2 py-0.5 rounded-full bg-[#f59e0b]/10 text-[11px] text-[#f59e0b]/50 font-medium border border-[#f59e0b]/10">
          priority: high
        </div>
      </div>
      <div className="flex flex-col gap-1.5 text-[13px] text-foreground/35 leading-relaxed">
        <p>Navigation buttons overlap at 375px viewport width. Submit and cancel buttons stack incorrectly.</p>
        <p className="text-foreground/20 italic">Submitted via remediate widget</p>
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-foreground/5">
        <div className="h-[40px] w-[64px] rounded-md bg-foreground/5 flex items-center justify-center">
          <span className="text-[9px] text-foreground/15">screenshot</span>
        </div>
      </div>
    </div>
  );
}

function EmailContent() {
  return (
    <div className="rounded-lg border border-foreground/5 bg-background overflow-hidden">
      <div className="px-5 py-3 border-b border-foreground/5 flex flex-col gap-1">
        <div className="flex gap-2 text-[13px]">
          <span className="text-foreground/20 w-12 shrink-0">From</span>
          <span className="text-foreground/50 font-medium">feedback@acme.com</span>
        </div>
        <div className="flex gap-2 text-[13px]">
          <span className="text-foreground/20 w-12 shrink-0">Subject</span>
          <span className="text-foreground/50 font-medium">New feedback: Button overlap on mobile nav</span>
        </div>
      </div>
      <div className="p-5 flex flex-col gap-3 text-[13px] text-foreground/35 leading-relaxed">
        <div className="flex flex-col gap-1">
          <span className="text-foreground/50 font-medium text-[14px]">Button overlap on mobile nav</span>
          <div className="flex gap-3 text-[12px] text-foreground/25">
            <span>Priority: High</span>
            <span>Page: /dashboard/settings</span>
          </div>
        </div>
        <p>Navigation buttons overlap at 375px viewport width. Submit and cancel buttons stack incorrectly.</p>
        <div className="h-[56px] w-[96px] rounded-md bg-foreground/5 flex items-center justify-center">
          <span className="text-[9px] text-foreground/15">screenshot</span>
        </div>
      </div>
    </div>
  );
}

function WebhooksContent() {
  const json = `{
  "event": "feedback.created",
  "priority": "high",
  "page": "/dashboard/settings",
  "message": "Button overlap on mobile nav",
  "attachments": [
    { "type": "screenshot", "url": "https://..." },
    { "type": "recording", "url": "https://..." }
  ],
  "browser": "Chrome 124.0",
  "os": "macOS 14.4",
  "viewport": "375x812",
  "timestamp": "2024-03-15T10:42:00Z"
}`;

  return (
    <div className="rounded-lg bg-[#1c1c1c] p-5 font-mono text-[13px] leading-relaxed overflow-hidden">
      <pre className="text-[#e7e7e7]/50 whitespace-pre">{json}</pre>
    </div>
  );
}

const TAB_CONTENT: Record<Tab, () => React.JSX.Element> = {
  Slack: SlackContent,
  Linear: LinearContent,
  GitHub: GitHubContent,
  Email: EmailContent,
  Webhooks: WebhooksContent,
};

export function DeliveredPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("Slack");
  const [displayed, setDisplayed] = useState<Tab>("Slack");
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
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col gap-6 w-[520px]">
        <div className="flex gap-2 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`h-[32px] px-3 rounded-full text-[16px] font-medium tracking-[-0.64px] transition-colors cursor-pointer ${
                activeTab === tab
                  ? "bg-foreground/25 text-foreground"
                  : "bg-foreground/5 text-foreground/50 hover:text-foreground/75"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div
          className="transition-opacity duration-150"
          style={{
            opacity: transitioning ? 0 : 1,
            transitionTimingFunction: "cubic-bezier(0.19, 1, 0.22, 1)",
          }}
        >
          <Content />
        </div>
      </div>
    </div>
  );
}

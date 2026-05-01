"use client";

import { useCallback, useEffect, useRef } from "react";
import { Section } from "./section";

const SECTION_KEYS = [
  "theWidget",
  "captureAnything",
  "oneClick",
  "whereLands",
  "builtFor",
  "getStarted",
  "openSource",
] as const;

interface SectionsProps {
  activeSection: string;
  onActiveSectionChange: (key: string) => void;
}

export function Sections({ activeSection, onActiveSectionChange }: SectionsProps) {
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);

  const setRef = useCallback(
    (key: string) => (el: HTMLDivElement | null) => {
      if (el) sectionRefs.current.set(key, el);
      else sectionRefs.current.delete(key);
    },
    []
  );

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const refs = sectionRefs.current;
    const elToKey = new Map<Element, string>();
    for (const [key, el] of refs) elToKey.set(el, key);

    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const key = elToKey.get(entry.target);
          if (key) ratios.set(key, entry.intersectionRatio);
        }

        let best = SECTION_KEYS[0] as string;
        let bestRatio = 0;
        for (const [key, ratio] of ratios) {
          if (ratio > bestRatio) {
            best = key;
            bestRatio = ratio;
          }
        }
        onActiveSectionChange(best);
      },
      {
        root: scrollContainer,
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      }
    );

    for (const el of refs.values()) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [onActiveSectionChange]);

  return (
    <div className="relative flex-1 min-h-0">
      {/* Top fade mask */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-20 bg-linear-to-b from-background to-transparent z-10" />

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto landing-scroll"
      >
        <div className="flex flex-col gap-10 pt-20 pb-[30vh]">
          <Section
            ref={setRef("theWidget")}
            title="the widget"
            isActive={activeSection === "theWidget"}
          >
            a dark pill that floats on your page. your users see one word
            — feedback. they click it, and it opens.
          </Section>

          <Section
            ref={setRef("captureAnything")}
            title="capture anything"
            isActive={activeSection === "captureAnything"}
          >
            <div className="flex flex-col gap-4">
              {[
                "screenshots — select any area of the page",
                "video — record what's happening, not just what it looks like",
                "annotations — click elements, add notes, set priority",
                "voice — sometimes talking is faster than typing",
                "text — freeform feedback in their own words",
              ].map((text, i) => (
                <div key={i} className="flex gap-3 leading-[1.35]">
                  <span className="bullet shrink-0">—</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section
            ref={setRef("oneClick")}
            title="one click to send"
            isActive={activeSection === "oneClick"}
          >
            they hit submit. everything bundles into one request —
            screenshots, recordings, voice, annotations, browser context —
            and it&apos;s delivered.
          </Section>

          <Section
            ref={setRef("whereLands")}
            title="where it lands"
            isActive={activeSection === "whereLands"}
          >
            <div className="flex flex-col gap-4">
              <p>feedback goes where your team already works.</p>
              <div className="flex flex-col gap-4">
                {[
                  "slack — formatted messages with screenshots and priority",
                  "linear — issues created with full context attached",
                  "github — issues with labels, attachments, and repro detail",
                  "email — html digest with inline screenshots",
                  "webhooks — structured json for zapier, make, or your own pipeline",
                ].map((text, i) => (
                  <div key={i} className="flex gap-3 leading-[1.35]">
                    <span className="bullet shrink-0">—</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <p>or skip all of that and use the dashboard.</p>
            </div>
          </Section>

          <Section
            ref={setRef("builtFor")}
            title="built for"
            isActive={activeSection === "builtFor"}
          >
            <div className="flex flex-col gap-4">
              {[
                "dev teams shipping for design partners or early customers",
                "qa teams who need cleaner repro and less back-and-forth.",
                "collaborators reviewing apps or websites — mark improvements, fixes, bugs, etc.",
              ].map((text, i) => (
                <div key={i} className="flex gap-3 leading-[1.35]">
                  <span className="bullet shrink-0">—</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section
            ref={setRef("getStarted")}
            title="get started"
            isActive={activeSection === "getStarted"}
          >
            <div className="flex flex-col gap-4">
              {[
                "hosted — sign up, create a project, paste your project key",
                "react — npm install and drop in the component",
                "script tag — paste one line, works on any site",
              ].map((text, i) => (
                <div key={i} className="flex gap-3 leading-[1.35]">
                  <span className="bullet shrink-0">—</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section
            ref={setRef("openSource")}
            title="open source"
            isActive={activeSection === "openSource"}
          >
            <div className="flex flex-col gap-4">
              <p>free for individuals and teams. mit licensed. self-host everything.</p>
              <div className="flex flex-col gap-4">
                {[
                  "the full widget is open source — read it, fork it, extend it",
                  "your data never touches our servers",
                  "no accounts, no api keys, no usage limits",
                ].map((text, i) => (
                  <div key={i} className="flex gap-3 leading-[1.35]">
                    <span className="bullet shrink-0">—</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* Bottom fade mask */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent z-10" />
    </div>
  );
}

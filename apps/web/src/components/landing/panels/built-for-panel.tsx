"use client";

import { useState } from "react";
import { Remediate } from "remediate";
import { HeartFill } from "@mingcute/react";
import { BrowserMockup } from "./browser-mockup";

const TABS = ["Product Engineers", "Early Teams", "Consultants"] as const;
type Tab = (typeof TABS)[number];

function EmbeddedFeedback() {
  return (
    <div className="builtin-feedback-scope absolute bottom-3 right-3 z-10">
      <Remediate />
    </div>
  );
}

const TAB_URLS: Record<Tab, string> = {
  "Product Engineers": "http://localhost:3000",
  "Early Teams": "app.acme.com/dashboard",
  Consultants: "mystore.myshopify.com",
};

function UnifiedBrowserContent({ activeTab }: { activeTab: Tab }) {
  const isConsultants = activeTab === "Consultants";
  const isStaging = activeTab === "Product Engineers";

  return (
    <div className="relative overflow-hidden h-[340px] border-l border-r border-b border-foreground/5 rounded-b-lg">
      {/* Dashboard Layout (PE & FT) */}
      <div
        className={`absolute inset-0 flex transition-all duration-400 ease-[cubic-bezier(0.19,1,0.22,1)] ${
          isConsultants ? "opacity-0 translate-x-8 pointer-events-none" : "opacity-100 translate-x-0"
        }`}
      >
        {/* Sidebar */}
        <div
          className={`relative w-[48px] bg-foreground/5 shrink-0 transition-transform duration-400 ease-[cubic-bezier(0.19,1,0.22,1)] ${
            isConsultants ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          <div className="absolute left-[11.5px] top-[16px] size-[24px] rounded-[6px] bg-foreground/5" />
          <div className="absolute left-[11.5px] top-[52px] size-[24px] rounded-[6px] bg-foreground/5" />
          <div className="absolute left-[11.5px] top-[88px] size-[24px] rounded-[6px] bg-foreground/5" />
          <div className="absolute left-[11.5px] top-[300px] size-[24px] rounded-[6px] bg-foreground/5" />
        </div>

        {/* Main content */}
        <div className="flex-1 relative">
          <div className="flex flex-col gap-[16px] p-[24px]">
            {/* Skeleton text lines */}
            <div className="flex flex-col gap-[8px] w-[240px]">
              <div className="h-[8px] w-[140px] rounded-[2px] bg-foreground/5" />
              <div className="h-[8px] w-[240px] rounded-[2px] bg-foreground/5" />
              <div className="h-[8px] w-[200px] rounded-[2px] bg-foreground/5" />
            </div>

            {/* Buttons row */}
            <div className="flex items-center justify-between">
              <div className="flex gap-[8px]">
                <div
                  className={`flex items-center justify-center h-[32px] px-[16px] rounded-[8px] transition-all duration-400 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden ${
                    isStaging
                      ? "bg-foreground/5 w-[81px]"
                      : "bg-[rgba(64,109,255,0.05)] w-[81px]"
                  }`}
                  style={{ width: '81px' }}
                >
                  <span
                    className={`text-sm font-medium leading-none whitespace-nowrap transition-colors duration-400 ease-[cubic-bezier(0.19,1,0.22,1)] ${
                      isStaging ? "text-[#666]" : "text-[#406dff]"
                    }`}
                  >
                    Deploy
                  </span>
                </div>
                <div
                  className={`flex items-center justify-center h-[32px] px-[16px] rounded-[8px] bg-foreground/5 transition-all duration-400 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden ${
                    isStaging ? "w-[81px]" : "w-[81px]"
                  }`}
                >
                  <span className="text-sm font-medium leading-none text-[#666] whitespace-nowrap">
                    Create
                  </span>
                </div>
              </div>
              <div
                className={`flex items-center justify-center h-[32px] px-[16px] rounded-[8px] bg-foreground/5 transition-all duration-400 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden ${
                  isStaging ? "w-[81px]" : "w-[81px]"
                }`}
              >
                <span className="text-sm font-medium leading-none text-[#666] whitespace-nowrap">
                  Settings
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex gap-[8px]">
              {/* First card - morphs to red in FT */}
              <div
                className={`flex-1 h-[70px] rounded-[8px] relative transition-colors duration-400 ease-[cubic-bezier(0.19,1,0.22,1)] ${
                  isStaging ? "bg-[rgba(239,68,68,0.05)]" : "bg-foreground/5"
                }`}
              >
                <div
                  className={`absolute left-[17px] top-[17px] h-[10px] w-[80px] rounded-[5px] transition-colors duration-400 ease-[cubic-bezier(0.19,1,0.22,1)] ${
                    isStaging ? "bg-[#ef4444]" : "bg-foreground/5"
                  }`}
                />
                <div
                  className={`absolute left-[17px] top-[35px] h-[10px] w-[60px] rounded-[5px] transition-colors duration-400 ease-[cubic-bezier(0.19,1,0.22,1)] ${
                    isStaging ? "bg-[#ef4444]" : "bg-foreground/5"
                  }`}
                />
              </div>
              
              {/* Second card - always present */}
              <div className="flex-1 h-[70px] rounded-[8px] bg-foreground/5 relative">
                <div className="absolute left-[17px] top-[17px] h-[10px] w-[60px] rounded-[5px] bg-foreground/5" />
                <div className="absolute left-[17px] top-[35px] h-[10px] w-[80px] rounded-[5px] bg-foreground/5" />
              </div>

              {/* Third card - disappears in FT */}
              <div
                className={`h-[70px] rounded-[8px] bg-foreground/5 relative transition-all duration-400 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden ${
                  isStaging ? "flex-[0_0_0px] opacity-0 ml-[-8px] border-0" : "flex-1 opacity-100 ml-0"
                }`}
              >
                <div className="absolute left-[17px] top-[17px] h-[10px] w-[70px] rounded-[5px] bg-foreground/5" />
                <div className="absolute left-[17px] top-[35px] h-[10px] w-[50px] rounded-[5px] bg-foreground/5" />
              </div>
            </div>

            {/* Bottom skeleton lines */}
            <div className="flex flex-col gap-[8px]">
              <div className="h-[8px] w-full rounded-[2px] bg-foreground/5" />
              <div className="h-[8px] w-[379px] rounded-[2px] bg-foreground/5" />
            </div>
          </div>

          {/* Staging badge */}
          <div
            className={`absolute left-[24px] top-[300px] flex items-center justify-center h-[24px] px-[16px] rounded-[8px] bg-[rgba(255,189,46,0.05)] transition-all duration-400 ease-[cubic-bezier(0.19,1,0.22,1)] origin-left ${
              isStaging ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            <span className="text-xs font-medium leading-none text-[#ffbd2e] whitespace-nowrap">
              Staging
            </span>
          </div>
        </div>
      </div>

      {/* Storefront Layout (Consultants) */}
      <div
        className={`absolute inset-0 transition-all duration-400 ease-[cubic-bezier(0.19,1,0.22,1)] ${
          isConsultants ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8 pointer-events-none"
        }`}
      >
        {/* Logo placeholder */}
        <div className="absolute left-[24px] top-[20px] h-[16px] w-[40px] rounded-[5px] bg-foreground/5" />

        {/* Nav pills — centered */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[16px] flex gap-[8px] items-center">
          <div className="flex items-center justify-center h-[24px] px-[16px] rounded-[8px] bg-foreground/5">
            <span className="text-sm font-medium leading-none tracking-[-0.48px] text-foreground/25 whitespace-nowrap">
              Products
            </span>
          </div>
          <div className="flex items-center justify-center h-[24px] px-[16px] rounded-[8px] bg-foreground/5">
            <span className="text-sm font-medium leading-none tracking-[-0.48px] text-foreground/25 whitespace-nowrap">
              About
            </span>
          </div>
        </div>

        {/* Heart icon */}
        <div className="absolute right-[88px] top-[16px]">
          <HeartFill size={24} style={{ color: "#ef4444" }} />
        </div>

        {/* Cart pill */}
        <div className="absolute right-[24px] top-[16px] flex items-center justify-center h-[24px] px-[16px] rounded-[8px] bg-[rgba(64,109,255,0.05)]">
          <span className="text-sm font-medium leading-none tracking-[-0.48px] text-[#406dff] whitespace-nowrap">
            Cart
          </span>
        </div>

        {/* Hero banner */}
        <div className="absolute left-[24px] top-[56px] w-[592px] h-[120px] rounded-[8px] bg-foreground/5">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[10px] w-[70px] rounded-[5px] bg-foreground/5" />
        </div>

        {/* Product cards */}
        <div className="absolute left-[24px] top-[184px] flex gap-[10px] w-[590px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 flex flex-col gap-[12px] p-[8px] rounded-[8px] bg-foreground/5">
              <div className="h-[40px] w-full rounded-[6px] bg-foreground/5" />
              <div className="flex flex-col gap-[4px] w-[99px]">
                <div className="h-[8px] w-full rounded-[3px] bg-foreground/5" />
                <div className="h-[8px] w-1/2 rounded-[3px] bg-foreground/5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <EmbeddedFeedback />
    </div>
  );
}

export function BuiltForPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("Product Engineers");

  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col gap-6 w-[640px]">
        {/* Tabs */}
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

        {/* Browser Mockup */}
        <BrowserMockup url={TAB_URLS[activeTab]}>
          <UnifiedBrowserContent activeTab={activeTab} />
        </BrowserMockup>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";
import { Agentation } from "agentation";
import { Header } from "./header";
import { Sections } from "./sections";
import { Footer } from "./footer";
import { MorphPanel } from "./morph-panel";

export function LandingPage() {
  const [activeSection, setActiveSection] = useState("theWidget");

  const handleActiveSectionChange = useCallback((key: string) => {
    setActiveSection(key);
  }, []);

  return (
    <div className="h-screen overflow-hidden flex items-start justify-center p-6">
      <div className="flex gap-6 w-full h-[calc(100vh-48px)]">
        {/* Left column */}
        <div className="flex flex-col w-[400px] h-full">
          <Header />
          <Sections
            activeSection={activeSection}
            onActiveSectionChange={handleActiveSectionChange}
          />
          <Footer />
        </div>

        {/* Right column */}
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          <MorphPanel activeSection={activeSection} />
        </div>
      </div>
      <Agentation />
    </div>
  );
}

import { DocsNav } from "@/components/docs/docs-nav";
import { MobileHeader } from "@/components/mobile-menu";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh overflow-hidden">
      {/* Desktop nav — hidden on mobile */}
      <div className="hidden lg:block fixed top-10 left-10 z-30 h-[calc(100vh-80px)]">
        <DocsNav />
      </div>

      {/* Mobile header — hidden on desktop */}
      <div className="lg:hidden">
        <MobileHeader />
      </div>

      {/* Content */}
      <main className="h-full flex items-center justify-center p-5 pt-20 lg:p-10 lg:pt-10">
        <div className="flex gap-20 w-full max-w-3xl h-full">
          <div className="hidden lg:block shrink-0 w-[120px]" />
          {children}
        </div>
      </main>
    </div>
  );
}

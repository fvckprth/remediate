import { DocsNav } from "@/components/docs/docs-nav";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden">
      {/* Nav — pinned top-left */}
      <div className="fixed top-10 left-10 z-30 h-[calc(100vh-80px)]">
        <DocsNav />
      </div>

      {/* Content — same position as before */}
      <div className="h-full flex items-center justify-center p-10">
        <div className="flex gap-20 w-full max-w-3xl h-full">
          <div className="shrink-0 w-[120px]" />
          {children}
        </div>
      </div>
    </div>
  );
}

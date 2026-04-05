import { DocsHeader } from "@/components/docs/docs-header";
import { DocsSidebar } from "@/components/docs/docs-sidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden flex flex-col p-6">
      <DocsHeader />
      <div className="flex gap-6 mt-6 flex-1 min-h-0">
        {/* Left column — sidebar */}
        <aside className="w-[280px] shrink-0 overflow-y-auto landing-scroll">
          <DocsSidebar />
        </aside>

        {/* Right column — content */}
        <main className="flex-1 min-w-0 overflow-y-auto landing-scroll">
          <div className="max-w-[760px] mx-auto pb-20 pr-4">{children}</div>
        </main>
      </div>
    </div>
  );
}

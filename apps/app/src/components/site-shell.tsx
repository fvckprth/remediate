import { DocsNav } from "@/components/docs/docs-nav";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden flex items-center justify-center p-10">
      <div className="flex gap-20 w-full max-w-3xl h-full">
        <DocsNav />
        {children}
      </div>
    </div>
  );
}

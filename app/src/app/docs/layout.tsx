import { SiteShell } from "@/components/site-shell";
import { DocsScrollArea } from "@/components/docs/docs-scroll-area";
import { DocsFadeIn } from "@/components/docs/docs-fade-in";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell>
      <DocsScrollArea>
        <div className="max-w-[480px] min-h-full flex flex-col">
          <DocsFadeIn>
            {children}
          </DocsFadeIn>

          {/* Footer — always at the bottom */}
          <div className="flex items-center text-sm font-medium tracking-tight leading-none text-foreground/25 mt-20">
            <p>
              Made by{" "}
              <a
                href="https://withparth.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/50 underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground/70"
              >
                Parth Patel
              </a>
            </p>
          </div>
        </div>
      </DocsScrollArea>
    </SiteShell>
  );
}

"use client";

interface BrowserMockupProps {
  url: string;
  children: React.ReactNode;
}

export function BrowserMockup({ url, children }: BrowserMockupProps) {
  return (
    <div className="flex flex-col w-full rounded-lg overflow-hidden">
      {/* Chrome bar */}
      <div className="flex items-center gap-[10px] h-[45px] px-[14px] bg-foreground/5 shrink-0">
        <div className="flex gap-1 shrink-0">
          <div className="size-2 rounded-[5px] bg-[#ff5f57]" />
          <div className="size-2 rounded-[5px] bg-[#ffbd2e]" />
          <div className="size-2 rounded-[5px] bg-[#28c840]" />
        </div>
        <div className="flex-1 h-[25px] rounded-[6px] bg-foreground/10 flex items-center px-3">
          <span className="text-sm font-medium leading-none text-foreground/40">
            {url}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

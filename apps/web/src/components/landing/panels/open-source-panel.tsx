"use client";

export function OpenSourcePanel() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-[480px] rounded-xl bg-[#1c1c1c] overflow-hidden shadow-lg">
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 h-10 bg-[#161616]">
          <div className="size-3 rounded-full bg-[#ff5f57]" />
          <div className="size-3 rounded-full bg-[#ffbd2e]" />
          <div className="size-3 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-[13px] text-white/25 font-medium">terminal</span>
        </div>
        {/* Terminal body */}
        <div className="p-5 font-mono text-[14px] leading-[1.8] select-none">
          <div>
            <span className="text-white/30">$ </span>
            <span className="text-white/60">git clone https://github.com/remediate/remediate</span>
          </div>
          <div>
            <span className="text-white/30">$ </span>
            <span className="text-white/60">cd remediate</span>
          </div>
          <div>
            <span className="text-white/30">$ </span>
            <span className="text-white/60">docker compose up</span>
          </div>
          <div className="mt-3 text-[#28c840]/60 text-[13px]">
            ✓ Running on http://localhost:3000
          </div>
        </div>
      </div>
    </div>
  );
}

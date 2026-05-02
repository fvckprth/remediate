interface PropRow {
  name: string;
  description: string;
}

interface PropsTableProps {
  rows: PropRow[];
}

export function PropsTable({ rows }: PropsTableProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Header */}
      <div className="flex w-full">
        <div className="flex-1 min-w-0 bg-foreground/5 border-l border-t border-b border-foreground/5 rounded-tl-xl rounded-bl-lg h-10 flex items-center p-2 lg:p-3">
          <span className="text-[13px] lg:text-sm font-medium tracking-tight leading-normal text-foreground/25">
            prop
          </span>
        </div>
        <div className="flex-1 min-w-0 bg-foreground/5 border-r border-t border-b border-foreground/5 rounded-tr-xl rounded-br-lg h-10 flex items-center p-2 lg:p-3">
          <span className="text-[13px] lg:text-sm font-medium tracking-tight leading-normal text-foreground/25">
            what is it
          </span>
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, i) => {
        const isLast = i === rows.length - 1;
        const isShort = row.description.length < 40;
        return (
          <div
            key={row.name}
            className={`flex w-full bg-foreground/5 border border-foreground/5 ${
              isLast
                ? "rounded-bl-xl rounded-br-xl rounded-tl-lg rounded-tr-lg"
                : "rounded-lg"
            } ${isShort ? "h-12 items-center" : "items-start"}`}
          >
            <div className={`flex-1 min-w-0 flex items-center p-2 lg:p-3 self-stretch`}>
              <span className="inline-flex items-center h-5 lg:h-6 font-mono text-[11px] lg:text-xs tracking-tight text-foreground/75 leading-none">
                {row.name}
              </span>
            </div>
            <div className="flex-1 min-w-0 flex items-center p-2 lg:p-3">
              <span className="text-[13px] lg:text-sm tracking-tight text-foreground/50 leading-normal">
                {row.description}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

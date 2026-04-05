import { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="mb-10 flex flex-col gap-3">
      {eyebrow ? (
        <p className="text-[14px] font-bold tracking-[-0.56px] leading-none text-foreground/25 uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-[40px] font-bold tracking-[-1.6px] leading-[1.05] text-foreground">
        {title}
      </h1>
      {description ? (
        <p className="text-[20px] font-medium tracking-[-0.8px] leading-[1.45] text-foreground/50">
          {description}
        </p>
      ) : null}
    </div>
  );
}

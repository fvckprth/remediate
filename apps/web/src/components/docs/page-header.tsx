import { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-base font-bold tracking-tight leading-none text-foreground">
        {title}
      </p>
      {description ? (
        <p className="text-sm font-medium tracking-[-0.28px] leading-[1.5] text-foreground/50">
          {description}
        </p>
      ) : null}
    </div>
  );
}

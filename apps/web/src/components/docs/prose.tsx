import { ComponentProps, ReactNode } from "react";

function slugify(children: ReactNode): string {
  if (typeof children === "string") {
    return children
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  }
  if (Array.isArray(children)) {
    return children.map((c) => (typeof c === "string" ? c : "")).join("").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
  }
  return "";
}

function H1({ children, className = "", ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={`text-[32px] font-bold tracking-[-1.28px] leading-tight text-foreground ${className}`}
      {...props}
    >
      {children}
    </h1>
  );
}

function H2({ children, className = "", id, ...props }: ComponentProps<"h2">) {
  const resolvedId = id ?? slugify(children);
  return (
    <h2
      id={resolvedId}
      className={`text-[24px] font-bold tracking-[-0.96px] leading-tight text-foreground mt-12 mb-4 scroll-mt-8 ${className}`}
      {...props}
    >
      {children}
    </h2>
  );
}

function H3({ children, className = "", ...props }: ComponentProps<"h3">) {
  return (
    <h3
      className={`text-[20px] font-bold tracking-[-0.8px] leading-tight text-foreground mt-8 mb-3 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

function P({ children, className = "", ...props }: ComponentProps<"p">) {
  return (
    <p
      className={`text-[18px] font-medium tracking-[-0.72px] leading-[1.5] text-foreground/75 my-4 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

function Lead({ children, className = "", ...props }: ComponentProps<"p">) {
  return (
    <p
      className={`text-[20px] font-medium tracking-[-0.8px] leading-[1.45] text-foreground/50 my-4 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

function Ul({ children, className = "", ...props }: ComponentProps<"ul">) {
  return (
    <ul
      className={`list-disc pl-6 my-4 space-y-2 text-[18px] font-medium tracking-[-0.72px] leading-[1.5] text-foreground/75 marker:text-foreground/25 ${className}`}
      {...props}
    >
      {children}
    </ul>
  );
}

function Ol({ children, className = "", ...props }: ComponentProps<"ol">) {
  return (
    <ol
      className={`list-decimal pl-6 my-4 space-y-2 text-[18px] font-medium tracking-[-0.72px] leading-[1.5] text-foreground/75 marker:text-foreground/25 ${className}`}
      {...props}
    >
      {children}
    </ol>
  );
}

function Li({ children, className = "", ...props }: ComponentProps<"li">) {
  return (
    <li className={`pl-1 ${className}`} {...props}>
      {children}
    </li>
  );
}

function InlineCode({ children, className = "", ...props }: ComponentProps<"code">) {
  return (
    <code
      className={`inline rounded bg-surface border border-border px-1.5 py-0.5 text-[0.9em] font-mono text-foreground ${className}`}
      {...props}
    >
      {children}
    </code>
  );
}

const LINK_CLASS =
  "text-foreground underline decoration-foreground/30 decoration-2 underline-offset-4 transition-colors hover:decoration-foreground";

function A({ children, className = "", ...props }: ComponentProps<"a">) {
  return (
    <a className={`${LINK_CLASS} ${className}`} {...props}>
      {children}
    </a>
  );
}

function Table({ children, className = "", ...props }: ComponentProps<"table">) {
  return (
    <div className="my-6 overflow-x-auto rounded-xl border border-border">
      <table
        className={`w-full text-[16px] font-medium tracking-[-0.64px] ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

function Thead({ children, className = "", ...props }: ComponentProps<"thead">) {
  return (
    <thead className={`bg-surface ${className}`} {...props}>
      {children}
    </thead>
  );
}

function Tr({ children, className = "", ...props }: ComponentProps<"tr">) {
  return (
    <tr className={`border-b border-border last:border-b-0 ${className}`} {...props}>
      {children}
    </tr>
  );
}

function Th({ children, className = "", ...props }: ComponentProps<"th">) {
  return (
    <th
      className={`text-left px-4 py-3 font-bold text-foreground ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "", ...props }: ComponentProps<"td">) {
  return (
    <td className={`px-4 py-3 align-top text-foreground/75 ${className}`} {...props}>
      {children}
    </td>
  );
}

function Hr({ className = "", ...props }: ComponentProps<"hr">) {
  return <hr className={`my-10 border-t border-border ${className}`} {...props} />;
}

function Blockquote({ children, className = "", ...props }: ComponentProps<"blockquote">) {
  return (
    <blockquote
      className={`my-6 border-l-2 border-foreground/20 pl-4 text-[18px] font-medium tracking-[-0.72px] leading-[1.5] text-foreground/50 ${className}`}
      {...props}
    >
      {children}
    </blockquote>
  );
}

export const Prose = {
  H1,
  H2,
  H3,
  P,
  Lead,
  Ul,
  Ol,
  Li,
  InlineCode,
  A,
  Table,
  Thead,
  Tr,
  Th,
  Td,
  Hr,
  Blockquote,
  linkClass: LINK_CLASS,
};

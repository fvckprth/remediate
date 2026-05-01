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
      className={`text-[16px] font-bold tracking-[-0.42px] leading-[1.35] text-foreground ${className}`}
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
      className={`text-base font-bold tracking-tight leading-tight text-foreground scroll-mt-6 ${className}`}
      {...props}
    >
      {children}
    </h2>
  );
}

function H3({ children, className = "", ...props }: ComponentProps<"h3">) {
  return (
    <h3
      className={`text-[14px] font-bold tracking-[-0.28px] leading-snug text-foreground/75 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

function P({ children, className = "", ...props }: ComponentProps<"p">) {
  return (
    <p
      className={`text-[14px] font-medium tracking-[-0.28px] leading-[1.5] text-foreground/50 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

function Lead({ children, className = "", ...props }: ComponentProps<"p">) {
  return (
    <p
      className={`text-[14px] font-medium tracking-[-0.28px] leading-[1.5] text-foreground/50 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

function Ul({ children, className = "", ...props }: ComponentProps<"ul">) {
  return (
    <ul
      className={`list-disc pl-6 text-[14px] font-medium tracking-[-0.28px] leading-[1.5] text-foreground/50 ${className}`}
      {...props}
    >
      {children}
    </ul>
  );
}

function Ol({ children, className = "", ...props }: ComponentProps<"ol">) {
  return (
    <ol
      className={`list-decimal pl-6 text-[14px] font-medium tracking-[-0.28px] leading-[1.5] text-foreground/50 ${className}`}
      {...props}
    >
      {children}
    </ol>
  );
}

function Li({ children, className = "", ...props }: ComponentProps<"li">) {
  return (
    <li className={`mt-1.5 first:mt-0 ${className}`} {...props}>
      {children}
    </li>
  );
}

function InlineCode({ children, className = "", ...props }: ComponentProps<"code">) {
  return (
    <code
      className={`inline-flex items-center h-6 px-2 bg-foreground/5 border border-foreground/5 rounded-lg font-mono text-xs tracking-[-0.48px] text-foreground ${className}`}
      {...props}
    >
      {children}
    </code>
  );
}

const LINK_CLASS =
  "text-[#406DFF] underline decoration-[#406DFF]/30 decoration-1 underline-offset-4 transition-colors hover:decoration-[#406DFF]";

function A({ children, className = "", ...props }: ComponentProps<"a">) {
  return (
    <a className={`${LINK_CLASS} ${className}`} {...props}>
      {children}
    </a>
  );
}

function Table({ children, className = "", ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table
        className={`w-full text-[14px] tracking-[-0.28px] ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

function Thead({ children, className = "", ...props }: ComponentProps<"thead">) {
  return (
    <thead className={`${className}`} {...props}>
      {children}
    </thead>
  );
}

function Tr({ children, className = "", ...props }: ComponentProps<"tr">) {
  return (
    <tr className={`border-b border-foreground/5 last:border-b-0 ${className}`} {...props}>
      {children}
    </tr>
  );
}

function Th({ children, className = "", ...props }: ComponentProps<"th">) {
  return (
    <th
      className={`text-left px-3 py-2 font-medium text-foreground/25 text-[14px] bg-foreground/5 first:rounded-tl-xl last:rounded-tr-xl ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "", ...props }: ComponentProps<"td">) {
  return (
    <td className={`px-3 py-3 align-top text-foreground/50 text-[14px] bg-foreground/5 ${className}`} {...props}>
      {children}
    </td>
  );
}

function Hr({ className = "", ...props }: ComponentProps<"hr">) {
  return <hr className={`border-t border-foreground/5 ${className}`} {...props} />;
}

function Blockquote({ children, className = "", ...props }: ComponentProps<"blockquote">) {
  return (
    <blockquote
      className={`border-l-2 border-foreground/10 pl-4 text-[14px] font-medium tracking-[-0.28px] leading-[1.5] text-foreground/50 ${className}`}
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

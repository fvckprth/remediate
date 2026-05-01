import type { MDXComponents } from "mdx/types";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import Link from "next/link";
import { Prose } from "@/components/docs/prose";
import { CodeBlock } from "@/components/docs/code-block";
import { PageHeader } from "@/components/docs/page-header";
import { PropsTable } from "@/components/docs/props-table";
import { AltInstall } from "@/components/docs/alt-install";
import { FaqItem } from "@/components/docs/faq-item";
import { Checklist, ChecklistItem } from "@/components/docs/checklist";

type CodeElementProps = ComponentProps<"code"> & { className?: string };

function extractLanguage(className?: string): string | undefined {
  if (!className) return undefined;
  const match = className.match(/language-([\w-]+)/);
  return match?.[1];
}

function flattenToString(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenToString).join("");
  if (isValidElement(node)) {
    const { children } = (node.props ?? {}) as { children?: ReactNode };
    return flattenToString(children);
  }
  return "";
}

function Pre({ children, ...props }: ComponentProps<"pre">) {
  // MDX wraps fenced code blocks as <pre><code className="language-xxx">…</code></pre>.
  // If the child is a <code> element with a language- className, render via CodeBlock.
  if (isValidElement(children)) {
    const element = children as ReactElement<CodeElementProps>;
    const codeProps = element.props;
    const language = extractLanguage(codeProps.className);
    const content = flattenToString(codeProps.children).replace(/\n$/, "");
    return <CodeBlock language={language}>{content}</CodeBlock>;
  }
  return <pre {...props}>{children}</pre>;
}

function Code({ className, children, ...props }: CodeElementProps) {
  // Fenced code inside <pre> — return a plain <code> so Pre can extract it.
  if (className && className.startsWith("language-")) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }
  // Inline code.
  return <Prose.InlineCode {...props}>{children}</Prose.InlineCode>;
}

function Anchor({ href = "", children, className, ...props }: ComponentProps<"a">) {
  const isInternal = href.startsWith("/") || href.startsWith("#");
  const mergedClass = className ? `${Prose.linkClass} ${className}` : Prose.linkClass;
  if (isInternal) {
    return (
      <Link href={href} className={mergedClass} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={mergedClass}
      {...props}
    >
      {children}
    </a>
  );
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: Prose.H1,
    h2: Prose.H2,
    h3: Prose.H3,
    p: Prose.P,
    ul: Prose.Ul,
    ol: Prose.Ol,
    li: Prose.Li,
    table: Prose.Table,
    thead: Prose.Thead,
    tr: Prose.Tr,
    th: Prose.Th,
    td: Prose.Td,
    hr: Prose.Hr,
    blockquote: Prose.Blockquote,
    a: Anchor,
    pre: Pre,
    code: Code,
    PageHeader,
    CodeBlock,
    PropsTable,
    AltInstall,
    FaqItem,
    Checklist,
    ChecklistItem,
    // `Prose` is an object namespace (Prose.H2, Prose.InlineCode, etc.),
    // not a component — MDXComponents' strict typing doesn't allow it,
    // but MDX accepts it at runtime for inline `<Prose.X>` usage in .mdx files.
    Prose: Prose as unknown as MDXComponents[string],
    ...components,
  };
}

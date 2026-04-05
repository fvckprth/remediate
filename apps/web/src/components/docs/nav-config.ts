export interface DocsNavItem {
  slug: string;
  title: string;
  href: string;
}

export interface DocsNavSection {
  title: string;
  items: DocsNavItem[];
}

export const docsNav: DocsNavSection[] = [
  {
    title: "getting started",
    items: [
      { slug: "overview", title: "overview", href: "/docs" },
      { slug: "quickstart", title: "quickstart", href: "/docs/quickstart" },
    ],
  },
  {
    title: "integrations",
    items: [
      { slug: "slack", title: "slack", href: "/docs/integrations/slack" },
      { slug: "linear", title: "linear", href: "/docs/integrations/linear" },
      { slug: "github", title: "github", href: "/docs/integrations/github" },
      { slug: "email", title: "email", href: "/docs/integrations/email" },
      { slug: "webhook", title: "webhook", href: "/docs/integrations/webhook" },
    ],
  },
  {
    title: "reference",
    items: [
      { slug: "payload", title: "payload", href: "/docs/reference/payload" },
      { slug: "troubleshooting", title: "troubleshooting", href: "/docs/troubleshooting" },
    ],
  },
];

"use client";

import { usePathname } from "next/navigation";

const labels: Record<string, string> = {
  install: "Getting Started",
  recipes: "Recipes",
  payload: "Payload",
  privacy: "Privacy & Capture",
  reference: "API Reference",
  faq: "FAQ",
  "use-cases": "Use Cases",
};

export function DocsBreadcrumbJsonLd() {
  const pathname = usePathname();
  const slug = pathname.split("/").pop() ?? "";
  const label = labels[slug];
  if (!label) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Remediate",
        item: "https://www.remediate.ski",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Docs",
        item: "https://www.remediate.ski/docs/install",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: label,
        item: `https://www.remediate.ski${pathname}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

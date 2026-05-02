import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://remediate.ski";

  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/docs/install`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/docs/recipes`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/docs/payload`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/docs/reference`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/docs/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/docs/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ];
}

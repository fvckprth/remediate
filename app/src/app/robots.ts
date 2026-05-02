import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/lab"],
      },
    ],
    sitemap: "https://www.remediate.ski/sitemap.xml",
  };
}

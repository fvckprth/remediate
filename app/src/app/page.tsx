import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";

export const metadata: Metadata = {
  alternates: { canonical: "https://remediate.ski" },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Remediate",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            description:
              "Open-source React component that captures screenshots, video, voice notes, and annotations from users as in-app feedback. Routes to Slack, Linear, GitHub, email, or webhooks.",
            url: "https://remediate.ski",
            downloadUrl: "https://www.npmjs.com/package/remediate",
            license: "https://opensource.org/licenses/MIT",
            programmingLanguage: ["TypeScript", "React"],
            author: {
              "@type": "Person",
              name: "Parth Patel",
              url: "https://withparth.com",
            },
          }),
        }}
      />
      <LandingPage />
    </>
  );
}

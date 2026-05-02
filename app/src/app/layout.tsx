import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import { GlobalWidgets } from "@/components/global-widgets";
import "./globals.css";

const openRunde = localFont({
  src: [
    { path: "../fonts/OpenRunde-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/OpenRunde-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-open-runde",
  display: "swap",
});

const berkeleyMono = localFont({
  src: [
    { path: "../fonts/BerkeleyMono-Regular.otf", weight: "400", style: "normal" },
  ],
  variable: "--font-berkeley-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.remediate.ski"),
  title: {
    default: "Remediate — Open-Source In-App Feedback for React",
    template: "%s | Remediate",
  },
  description:
    "Capture screenshots, video, voice notes, and annotations from users as in-app feedback. One React component, one server helper. Routes to Slack, Linear, GitHub, email, or webhooks. MIT licensed.",
  keywords: [
    "react feedback widget",
    "in-app feedback",
    "screenshot capture",
    "screen recording",
    "voice notes",
    "bug reporting",
    "user feedback",
    "open source feedback tool",
    "react component",
    "annotation tool",
  ],
  authors: [{ name: "Parth Patel", url: "https://withparth.com" }],
  creator: "Parth Patel",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.remediate.ski",
    siteName: "Remediate",
    title: "Remediate — Open-Source In-App Feedback for React",
    description:
      "Capture screenshots, video, voice notes, and annotations from users as in-app feedback. One React component, one server helper. MIT licensed.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Remediate — Open-Source In-App Feedback for React",
    description:
      "Capture screenshots, video, voice notes, and annotations from users as in-app feedback. One React component, one server helper. MIT licensed.",
  },
  alternates: {
    canonical: "https://www.remediate.ski",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${openRunde.variable} ${berkeleyMono.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Remediate",
              url: "https://www.remediate.ski",
              description:
                "Open-source React component for in-app feedback. Captures screenshots, video, voice notes, and annotations.",
              publisher: {
                "@type": "Person",
                name: "Parth Patel",
                url: "https://withparth.com",
              },
            }),
          }}
        />
        <Providers>
          {children}
          <GlobalWidgets />
        </Providers>
      </body>
    </html>
  );
}

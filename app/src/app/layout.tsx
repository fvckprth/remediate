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
  title: "Remediate",
  description: "Visual feedback widget for web apps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${openRunde.variable} ${berkeleyMono.variable} antialiased`}>
        <Providers>
          {children}
          <GlobalWidgets />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import "./globals.css";

const openRunde = localFont({
  src: [
    { path: "../fonts/OpenRunde-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/OpenRunde-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-open-runde",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Remediate",
  description: "Feedback dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${openRunde.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

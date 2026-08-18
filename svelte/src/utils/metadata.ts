import type { FeedbackSubmission } from "../types";

function parseBrowser(ua: string): { name: string; version: string } {
  const browsers: [RegExp, string][] = [
    [/Edg\/(\d+[\d.]*)/, "Edge"],
    [/OPR\/(\d+[\d.]*)/, "Opera"],
    [/Chrome\/(\d+[\d.]*)/, "Chrome"],
    [/Firefox\/(\d+[\d.]*)/, "Firefox"],
    [/Safari\/(\d+[\d.]*)/, "Safari"],
  ];

  for (const [pattern, name] of browsers) {
    const match = ua.match(pattern);
    if (match) return { name, version: match[1] };
  }
  return { name: "Unknown", version: "0" };
}

function parseOS(ua: string): { name: string; version: string } {
  if (ua.includes("Win")) {
    const match = ua.match(/Windows NT (\d+\.\d+)/);
    return { name: "Windows", version: match?.[1] ?? "" };
  }
  if (ua.includes("Mac")) {
    const match = ua.match(/Mac OS X ([\d_]+)/);
    return { name: "macOS", version: match?.[1]?.replace(/_/g, ".") ?? "" };
  }
  if (ua.includes("Linux")) return { name: "Linux", version: "" };
  if (ua.includes("Android")) {
    const match = ua.match(/Android ([\d.]+)/);
    return { name: "Android", version: match?.[1] ?? "" };
  }
  if (ua.includes("iPhone") || ua.includes("iPad")) {
    const match = ua.match(/OS ([\d_]+)/);
    return { name: "iOS", version: match?.[1]?.replace(/_/g, ".") ?? "" };
  }
  return { name: "Unknown", version: "" };
}

export function collectEnvironment(): FeedbackSubmission["environment"] {
  const ua = navigator.userAgent;
  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  return {
    userAgent: ua,
    browser: parseBrowser(ua),
    os: parseOS(ua),
    viewport: { width: window.innerWidth, height: window.innerHeight },
    screen: { width: screen.width, height: screen.height },
    devicePixelRatio: window.devicePixelRatio,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    colorScheme,
  };
}

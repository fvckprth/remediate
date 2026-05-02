import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Remediate",
    short_name: "Remediate",
    description:
      "Open-source React component for in-app feedback. Captures screenshots, video, voice notes, and annotations.",
    start_url: "/",
    display: "browser",
    background_color: "#000000",
    theme_color: "#3B82F6",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

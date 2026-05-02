"use client";

import { useEffect } from "react";
import { useWebHaptics } from "web-haptics/react";

export function GlobalHaptics() {
  const { trigger } = useWebHaptics();

  useEffect(() => {
    const handler = () => trigger(10);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [trigger]);

  return null;
}

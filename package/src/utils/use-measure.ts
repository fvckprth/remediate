import { useState, useEffect, useRef } from "react";

export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use borderBoxSize if available for more accurate dimensions
        if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
          setBounds({
            width: entry.borderBoxSize[0].inlineSize,
            height: entry.borderBoxSize[0].blockSize,
          });
        } else {
          setBounds({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, bounds] as const;
}

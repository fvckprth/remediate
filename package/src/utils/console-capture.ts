/**
 * Captures console.error and console.warn entries for "Detailed" output mode.
 * Monkey-patches console methods and restores them on stop().
 */

export interface ConsoleEntry {
  level: "error" | "warn";
  message: string;
  timestamp: number;
}

const MAX_ENTRIES = 50;

export interface ConsoleCapture {
  entries: ConsoleEntry[];
  stop: () => void;
}

export function startConsoleCapture(): ConsoleCapture {
  const entries: ConsoleEntry[] = [];
  const origError = console.error;
  const origWarn = console.warn;

  function capture(level: "error" | "warn", args: unknown[]) {
    if (entries.length >= MAX_ENTRIES) return;
    const message = args
      .map((a) => (typeof a === "string" ? a : String(a)))
      .join(" ");
    entries.push({ level, message, timestamp: Date.now() });
  }

  console.error = (...args: unknown[]) => {
    capture("error", args);
    origError.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    capture("warn", args);
    origWarn.apply(console, args);
  };

  return {
    entries,
    stop() {
      console.error = origError;
      console.warn = origWarn;
    },
  };
}

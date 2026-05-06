interface ReactFiberResult {
  chain: string[];
  sourceLocation: { fileName: string; lineNumber: number } | null;
}

const EMPTY: ReactFiberResult = { chain: [], sourceLocation: null };

function getFiber(el: HTMLElement): unknown | null {
  const key = Object.keys(el).find(
    (k) => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"),
  );
  return key ? (el as Record<string, unknown>)[key] : null;
}

export function getReactComponentChain(el: HTMLElement): ReactFiberResult {
  try {
    const fiber = getFiber(el) as Record<string, unknown> | null;
    if (!fiber) return EMPTY;

    const chain: string[] = [];
    let sourceLocation: ReactFiberResult["sourceLocation"] = null;
    let current = fiber;

    while (current) {
      const type = current.type;

      if (typeof type === "function" || (typeof type === "object" && type !== null)) {
        const t = type as Record<string, unknown>;
        const name = (t.displayName || t.name) as string | undefined;
        if (name) chain.push(name);

        if (!sourceLocation && current._debugSource) {
          const src = current._debugSource as Record<string, unknown>;
          const fileName = src.fileName as string | undefined;
          const lineNumber = src.lineNumber as number | undefined;
          if (fileName && typeof lineNumber === "number") {
            sourceLocation = { fileName, lineNumber };
          }
        }
      }

      current = current.return as Record<string, unknown> | null;
    }

    return { chain, sourceLocation };
  } catch {
    return EMPTY;
  }
}

import { readFileSync } from "fs";
import { join } from "path";

const isDev = process.env.NODE_ENV !== "production";

function loadWidget(): string {
  try {
    return readFileSync(
      join(process.cwd(), "../../package/dist/widget.js"),
      "utf-8",
    );
  } catch {
    try {
      return readFileSync(join(process.cwd(), "public/widget.js"), "utf-8");
    } catch {
      return "console.error('Remediate widget not found. Build the package first.')";
    }
  }
}

// In production, cache at module scope. In dev, read fresh each request.
const cachedWidget = isDev ? null : loadWidget();

export async function GET() {
  const body = cachedWidget ?? loadWidget();
  return new Response(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": isDev
        ? "no-cache"
        : "public, max-age=3600, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

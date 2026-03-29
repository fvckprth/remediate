import { defineConfig } from "tsup";
import { writeFileSync, readFileSync, copyFileSync, readdirSync, existsSync, unlinkSync } from "fs";
import { join } from "path";

// jsDelivr serves npm package files automatically once published.
// Font URL will resolve after `npm publish`.
const CDN_FONT_URL =
  "https://cdn.jsdelivr.net/npm/remediate@latest/dist/OpenRunde-Medium.woff2";

/** Rewrite relative font url() references to the jsDelivr CDN URL. */
function rewriteFontUrls(css: string): string {
  return css.replace(
    /url\([^)]*OpenRunde-Medium[^)]*\.woff2[^)]*\)/g,
    `url("${CDN_FONT_URL}")`,
  );
}

export default defineConfig([
  // 1. Client-side widget (React, "use client")
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: !process.env.TSUP_WATCH,
    external: ["react", "react-dom"],
    treeshake: true,
    outDir: "dist",
    onSuccess: async () => {
      // Read extracted CSS and rewrite font URLs for the injected version.
      // The extracted dist/index.css keeps relative paths (fonts co-located).
      const cssPath = join(process.cwd(), "dist/index.css");
      const cssContent = readFileSync(cssPath, "utf-8");
      const cssForInjection = rewriteFontUrls(cssContent);

      // CSS injection IIFE — runs at module evaluation time, SSR-safe
      const injectionCode = [
        `(function(){`,
        `if(typeof document==="undefined")return;`,
        `var id="remediate-widget-styles";`,
        `if(document.getElementById(id))return;`,
        `var s=document.createElement("style");`,
        `s.id=id;`,
        `s.textContent=${JSON.stringify(cssForInjection)};`,
        `document.head.appendChild(s);`,
        `})();`,
      ].join("");

      // Copy hashed font file to stable name so the jsDelivr CDN URL resolves
      const distDir = join(process.cwd(), "dist");
      const hashedFont = readdirSync(distDir).find(
        (f) => f.startsWith("OpenRunde-Medium") && f.endsWith(".woff2"),
      );
      if (hashedFont && hashedFont !== "OpenRunde-Medium.woff2") {
        copyFileSync(
          join(distDir, hashedFont),
          join(distDir, "OpenRunde-Medium.woff2"),
        );
      }

      // Prepend "use client" + CSS injection to output files
      for (const file of ["dist/index.js", "dist/index.cjs"]) {
        const filepath = join(process.cwd(), file);
        const content = readFileSync(filepath, "utf-8");
        writeFileSync(
          filepath,
          `"use client";\n${injectionCode}\n${content}`,
        );
      }
    },
  },
  // 2. Server-side helpers (no React, no "use client")
  {
    entry: {
      server: "src/server/index.ts",
      "integrations/slack": "src/integrations/slack.ts",
      "integrations/linear": "src/integrations/linear.ts",
      "integrations/github": "src/integrations/github.ts",
      "integrations/webhook": "src/integrations/webhook.ts",
      "integrations/email": "src/integrations/email.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: false,
    external: ["react", "react-dom"],
    treeshake: true,
    outDir: "dist",
  },
  // 3. Script-tag embed (self-contained IIFE, bundles React + everything)
  {
    entry: { widget: "src/embed.tsx" },
    format: ["iife"],
    globalName: "RemediateWidget",
    platform: "browser",
    target: "es2017",
    minify: true,
    sourcemap: true,
    clean: false,
    noExternal: [/.*/],
    treeshake: true,
    outDir: "dist",
    // CSS is extracted to widget.css, then merged into JS in onSuccess below.
    // Using injectStyle caused double-encoding of the CSS string by esbuild's minifier.
    injectStyle: false,
    esbuildOptions(options) {
      // Ignore .woff2 files — font is loaded via CDN URL in the injected CSS
      options.loader = { ...options.loader, ".woff2": "empty" };
    },
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    onSuccess: async () => {
      const dir = join(process.cwd(), "dist");

      // 1. Embed extracted CSS into the JS bundle (bypasses esbuild minifier's double-encoding)
      const cssPath = join(dir, "widget.css");
      const jsGlobalPath = join(dir, "widget.global.js");

      if (existsSync(cssPath) && existsSync(jsGlobalPath)) {
        const rawCss = readFileSync(cssPath, "utf-8");
        const css = rewriteFontUrls(rawCss);
        const js = readFileSync(jsGlobalPath, "utf-8");

        const injector = [
          `(function(){`,
          `if(typeof document==="undefined")return;`,
          `var id="remediate-embed-styles";`,
          `if(document.getElementById(id))return;`,
          `var s=document.createElement("style");`,
          `s.id=id;`,
          `s.textContent=${JSON.stringify(css)};`,
          `document.head.appendChild(s);`,
          `})();`,
        ].join("");

        writeFileSync(jsGlobalPath, injector + js);
        unlinkSync(cssPath);
      }

      // 2. Rename widget.global.js → widget.js
      const { renameSync } = await import("fs");
      for (const [from, to] of [
        ["widget.global.js", "widget.js"],
        ["widget.global.js.map", "widget.js.map"],
      ] as const) {
        const src = join(dir, from);
        if (existsSync(src)) renameSync(src, join(dir, to));
      }
    },
  },
]);

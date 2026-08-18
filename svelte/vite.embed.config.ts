import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";

// Script-tag embed build: a self-contained IIFE that bundles Svelte + the
// widget + CSS + fonts (via CDN). Mirrors the React package's dist/widget.js.
export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    target: "es2017",
    minify: true,
    lib: {
      entry: resolve(__dirname, "src/embed.ts"),
      name: "RemediateWidget",
      formats: ["iife"],
      fileName: () => "widget.js",
    },
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

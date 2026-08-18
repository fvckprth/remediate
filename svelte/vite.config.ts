import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";

// Main library build: ESM entry (Svelte components) + server helpers.
// CSS is injected at runtime via src/inject-styles.ts (mirrors the React
// package's auto-injecting behaviour), so consumers don't import a stylesheet.
export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        server: resolve(__dirname, "src/server/index.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: ["svelte", /^svelte\//],
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "[name][extname]",
      },
    },
  },
});

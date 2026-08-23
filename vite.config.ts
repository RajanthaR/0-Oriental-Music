// Minimal vite config for scripts/dump-publication-parity.mjs (vite-node).
// Vitest keeps reading vitest.config.ts; this file only exists so the parity
// reproducer resolves the "@/..." alias outside the test runner.
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

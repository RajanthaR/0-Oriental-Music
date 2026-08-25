// Minimal vite config for vite-node-run scripts (vitest keeps reading
// vitest.config.ts and is unaffected):
// - scripts/dump-publication-parity.mjs (parity-oracle reproducer)
// - scripts/verify-symbol-anchors.mjs (CI traceability-anchor gate)
// Both import TypeScript modules through the "@/..." alias defined below.
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

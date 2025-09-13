import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: resolve(__dirname, "src/background.ts"),
      output: {
        entryFileNames: "background.js",
        format: "iife",
      },
    },
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
  },
  publicDir: "public",
});
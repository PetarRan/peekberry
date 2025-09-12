import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // Only build the content script
        content: resolve(__dirname, "src/contentScript.tsx"),
      },
      output: {
        entryFileNames: "contentScript.js",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
  publicDir: "public", // will copy manifest.json
});

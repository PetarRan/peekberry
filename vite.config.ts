import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // Build both the popup and content script
        popup: resolve(__dirname, "index.html"),
        content: resolve(__dirname, "src/contentScript.tsx"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'content' ? 'contentScript.js' : 'assets/[name]-[hash].js';
        },
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
  publicDir: "public", // will copy manifest.json
});

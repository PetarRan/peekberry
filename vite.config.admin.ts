import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src/webapp",        // point to webapp folder
  plugins: [react()],
  envDir: "../..", 
  build: {
    outDir: "../../out",      // relative to project root
    emptyOutDir: true,
  },
});
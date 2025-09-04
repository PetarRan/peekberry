import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      __VITE_SUPABASE_URL__: JSON.stringify(env.VITE_SUPABASE_URL),
      __VITE_SUPABASE_ANON_KEY__: JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    build: {
      rollupOptions: {
        input: {
          popup: resolve(__dirname, "src/extension/popup/index.html"),
          content: resolve(
            __dirname,
            "src/extension/content/ContentScript.tsx"
          ),
          background: resolve(
            __dirname,
            "src/extension/background/BackgroundScript.ts"
          ),
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: "[name].[ext]",
        },
      },
      outDir: "dist",
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
  };
});

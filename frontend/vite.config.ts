import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), wasm(), topLevelAwait()],
    optimizeDeps: {
      exclude: ["@itsmeadarsh/warper"],
    },
    server: {
      port: parseInt(env.VITE_PORT || "5173", 10),
      proxy: {
        "/api": {
          target: env.VITE_API_TARGET || "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
  };
});

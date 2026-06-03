import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      middlewareMode: false,
      headers: {
        "Connection": "keep-alive"
      },
      proxy: {
        "/api": {
          target: env.VITE_PROXY_TARGET || "https://allgrops.onrender.com",
          changeOrigin: true,
          secure: true,
        },
        "/uploads": {
          target: env.VITE_PROXY_TARGET || "https://allgrops.onrender.com",
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});

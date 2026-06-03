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
          target: env.VITE_PROXY_TARGET || "http://localhost:8080",
          changeOrigin: true,
          secure: false,
          onProxyReq: (proxyReq, req, res) => {
            // Vite's default max header size; Node.js allows increasing it via:
            // NODE_OPTIONS="--max-http-header-size=16384"
          },
        },
        "/uploads": {
          target: env.VITE_PROXY_TARGET || "http://localhost:8080",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});

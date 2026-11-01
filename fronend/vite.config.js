import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = (
    env.VITE_PROXY_TARGET || "http://10.0.3.6:8888"
  ).replace(/\/$/, "");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        app: path.resolve(__dirname, "src/app"),
        pages: path.resolve(__dirname, "src/pages"),
        features: path.resolve(__dirname, "src/features"),
        shared: path.resolve(__dirname, "src/shared"),
      },
    },
    build: {
      outDir: "build",
      sourcemap: true,
    },
    server: {
      host: "localhost",
      port: 3000,
      strictPort: true,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/ws": {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts",
      css: true,
    },
  };
});

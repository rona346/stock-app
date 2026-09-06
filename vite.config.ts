import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const backendUrl =
    env.BACKEND_URL ||
    (mode === "production" ? "https://stock-app-22he.onrender.com" : "");

  return {
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.BACKEND_URL": JSON.stringify(backendUrl.replace(/\/$/, "")),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
    },
  };
});

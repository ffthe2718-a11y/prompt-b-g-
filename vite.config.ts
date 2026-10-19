import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";

/**
 * The marketing pages, the owner dashboard and each public salon site are
 * separate chunks so a first-time visitor never downloads dashboard code.
 * Long-lived vendor chunks (React, Motion) cache well across deploys.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    hmr: process.env.DISABLE_HMR !== "true",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          motion: ["motion", "motion/react"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});

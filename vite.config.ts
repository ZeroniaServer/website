import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Site is served from the domain root (custom domain on GitHub Pages).
  base: "/",
  server: {
    port: 3000,
  },
  build: {
    outDir: "dist",
  },
});

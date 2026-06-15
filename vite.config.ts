import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the build works whether served at the domain root
  // (zeronia.org) or at a project subpath (…github.io/website/).
  base: "./",
  server: {
    port: 3000,
  },
  build: {
    outDir: "dist",
  },
});

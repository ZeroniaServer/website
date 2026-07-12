import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Absolute base: path routing (zeronia.org/<slug>) needs assets resolved
  // from the domain root regardless of the current path.
  base: "/",
  server: {
    port: 3000,
  },
  build: {
    outDir: "dist",
  },
});

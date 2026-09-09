import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// PAGES_BASE_PATH can be set to "/" for a custom domain or a user/organization
// Pages site. The default targets this repository's project Pages URL.
export default defineConfig(({ mode }) => ({
  base: process.env.PAGES_BASE_PATH ?? "/crawler-command-interface/",
  build: {
    outDir: mode === "concepts" ? "dist-concepts" : "dist-pages",
    emptyOutDir: true,
    ...(mode === "concepts" ? { rollupOptions: { input: "concepts.html" } } : {}),
  },
  plugins: [react()],
}));

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub project Pages needs a repository-relative asset prefix. Override this
// for a user/organization site or a custom domain with PAGES_BASE_PATH=/.
const base = process.env.PAGES_BASE_PATH ?? "/crawler-command-interface/";

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
  },
});

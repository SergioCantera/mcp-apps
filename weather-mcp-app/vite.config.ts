import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { readdirSync, existsSync } from "fs";
import { join } from "path";

// Auto-detect HTML entries in src/apps/*/index.html
const appsDir = "src/apps";
export const entries = readdirSync(appsDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => join(appsDir, dirent.name, "index.html"))
  .filter((path) => existsSync(path));

// When BUILD_ENTRY is set, build only that entry (for single-file output)
const buildEntry = process.env.BUILD_ENTRY;

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    emptyOutDir: !buildEntry, // Only empty on first build
    minify: "terser",
    rollupOptions: {
      input: buildEntry || entries[0],
    },
  },
});

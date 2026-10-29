import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { visualizer } from "rollup-plugin-visualizer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    preact(),
    visualizer({
      open: false,
      filename: "stats.html",
      sourcemap: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    minify: "terser",
    sourcemap: true,
    emptyOutDir: true,
    outDir: `${__dirname}/dist`,
    lib: {
      entry: `${__dirname}/output/Main/index.js`,
      name: "clmStats",
      formats: ["es"],
      fileName: () => "clmStatsApp.js",
    },
  },
});

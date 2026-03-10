import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [preact()],
  build: {
    emptyOutDir: true,
    outDir: `${__dirname}/dist`,
    lib: {
      entry: `${__dirname}/js/ssrApp.js`,
      formats: ["cjs"],
      fileName: () => "ssrApp.cjs",
    },
  },
});

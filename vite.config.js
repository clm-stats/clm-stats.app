import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
const clmStatsCO = process.env["CLM_STATS_PAGES_CO"];
const forceProxy = process.env["CLM_STATS_APP_FORCE_PROXY"] === "yes";

const useLocal = Boolean(clmStatsCO && !forceProxy);

const target = "http://clm-stats.github.io";
const proxyServer = { proxy: { "/db": { target, changeOrigin: true } } };
export default defineConfig({
  ...(useLocal ? {} : { server: proxyServer }),
  publicDir: useLocal ? clmStatsCO + "/docs" : "./static",
  plugins: [preact()],
});

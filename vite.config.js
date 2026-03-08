import path from "node:path";
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

const clmStatsCO = process.env["CLM_STATS_PAGES_CO"];
const forceProxy = process.env["CLM_STATS_APP_FORCE_PROXY"] === "yes";

const useLocal = Boolean(clmStatsCO && !forceProxy);
const publicDir = useLocal ? path.join(clmStatsCO, "docs") : "./static";

const target = "http://clm-stats.github.io";
const proxyServer = { proxy: { "/db": { target, changeOrigin: true } } };
const _g = "https://github.com/clm-stats/clm-stats.github.io/tree/main/docs/db";
const dbSrc = useLocal ? publicDir : _g;
console.log(`[clm-stats dev-server]  {Info} -Database Source-`);
console.log(` {Info}  ${dbSrc}`);
const serverConfig = useLocal ? {} : { server: proxyServer };
const plugins = [preact()];
export default defineConfig({ ...serverConfig, publicDir, plugins });

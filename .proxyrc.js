const { createProxyMiddleware } = require("http-proxy-middleware");
const fs = require("fs");
const path = require("path");
const StaticServer = require("static-server");
const { mkdirpSync } = require("mkdirp");

const clmStatsCO = process.env["CLM_STATS_PAGES_CO"];

const STATIC_SERVER_PORT = 2145;

const staticServer = new StaticServer({
  rootPath: path.join(clmStatsCO, "docs"),
  port: STATIC_SERVER_PORT,
});

const favIco = "/favicon.ico";
const isFavIco = (s) => s === favIco;

function timestamp() {
  const date = new Date();
  const pad = (n, s = 2) => `${new Array(s).fill(0)}${n}`.slice(-s);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

mkdirpSync(path.join(__dirname, "dist"));
function log(...args) {
  fs.appendFileSync(
    `${path.join(__dirname, "dist", "out.log")}`,
    [timestamp(), "", ...args].join(" ") + "\n",
  );
}

staticServer.start(function () {
  log("Static Server listening to", staticServer.port);
});

const mkPathFilter = (s) => (url) => {
  const filepath = path.join(clmStatsCO, `docs${s}`, url);
  return !fs.existsSync(filepath);
};

module.exports = function (app) {
  log("proxy-setup");
  const useProxy = (s) => {
    app.use(
      s,
      createProxyMiddleware({
        target: `http://clm-stats.github.io${s}`,
        changeOrigin: true,
        pathFilter: mkPathFilter(s),
        ...(!isFavIco(s) ? {} : { pathRewrite: () => "" }),
      }),
    );
    app.use(
      s,
      createProxyMiddleware({
        target: `http://localhost:${STATIC_SERVER_PORT}${s}`,
        changeOrigin: true,
        ...(!isFavIco(s) ? {} : { pathRewrite: () => "" }),
      }),
    );
  };
  useProxy("/db");
  useProxy("/chars");
  useProxy("/img");
  useProxy("/favicon.ico");
};

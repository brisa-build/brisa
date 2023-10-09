import fs from "node:fs";
import getConstants from "../../constants";
import { serveOptions } from "./serve-options";

const { IS_PRODUCTION, BUILD_DIR, PAGES_DIR, LOG_PREFIX } = getConstants();

if (IS_PRODUCTION && !fs.existsSync(BUILD_DIR)) {
  console.error('Not exist "build" yet. Please run "brisa build" first');
  process.exit(1);
}

if (!fs.existsSync(PAGES_DIR)) {
  const path = IS_PRODUCTION ? "build/pages" : "src/pages";
  const cli = IS_PRODUCTION ? "brisa start" : "brisa dev";

  console.error(`Not exist ${path}" directory. It\'s required to run "${cli}"`);
  process.exit(1);
}

const server = Bun.serve(serveOptions);

console.log(
  LOG_PREFIX.READY,
  `listening on http://${server.hostname}:${server.port}...`,
);

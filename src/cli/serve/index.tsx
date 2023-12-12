import fs from "node:fs";
import getConstants from "../../constants";
import { serveOptions } from "./serve-options";
import { ServeOptions, Server } from "bun";

const { IS_PRODUCTION, BUILD_DIR, PAGES_DIR, LOG_PREFIX } = getConstants();

if (IS_PRODUCTION && !fs.existsSync(BUILD_DIR)) {
  console.log(
    LOG_PREFIX.ERROR,
    'Not exist "build" yet. Please run "brisa build" first',
  );
  process.exit(1);
}

if (!fs.existsSync(PAGES_DIR)) {
  const path = IS_PRODUCTION ? "build/pages" : "src/pages";
  const cli = IS_PRODUCTION ? "brisa start" : "brisa dev";

  console.log(
    LOG_PREFIX.ERROR,
    `Not exist ${path}" directory. It\'s required to run "${cli}"`,
  );
  process.exit(1);
}

function init(options: ServeOptions) {
  try {
    const server = Bun.serve(options);

    globalThis.brisaServer = server;
    console.log(
      LOG_PREFIX.READY,
      `listening on http://${server.hostname}:${server.port}...`,
    );
  } catch (error) {
    const { message } = error as Error;

    if (message?.includes(`Is port ${options.port} in use?`)) {
      console.log(LOG_PREFIX.ERROR, message);
      init({ ...options, port: 0 });
    } else {
      console.error(LOG_PREFIX.ERROR, message ?? "Error on start server");
      process.exit(1);
    }
  }
}

init(serveOptions);

declare global {
  var brisaServer: Server;
}

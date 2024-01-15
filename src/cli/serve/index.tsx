import constants from "@/constants";
import { serveOptions } from "./serve-options";
import type { ServeOptions, Server } from "bun";

const { LOG_PREFIX } = constants;

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

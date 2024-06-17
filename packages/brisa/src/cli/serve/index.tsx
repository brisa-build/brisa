import constants from "@/constants";
import { getServeOptions } from "./serve-options";
import type { ServeOptions, Server } from "bun";
import { blueLog, boldLog } from "@/utils/log/log-color";
import { logError } from "@/utils/log/log-build";

const { LOG_PREFIX } = constants;

function init(options: ServeOptions) {
  try {
    const server = Bun.serve(options);

    globalThis.brisaServer = server;
    console.log(
      LOG_PREFIX.READY,
      `listening on http://${server.hostname}:${server.port}`,
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

function handleError(errorName: string) {
  return (e: Error) => {
    logError({
      messages: [
        `Oops! An ${errorName} occurred:`,
        "",
        ...e.message.split("\n").map(boldLog),
        "",
        `This happened because there might be an unexpected issue in the code or an unforeseen situation.`,
        `If the problem persists, please report this error to the Brisa team:`,
        blueLog("🔗 https://github.com/brisa-build/brisa/issues/new"),
        `Please don't worry, we are here to help.`,
        "More details about the error:",
      ],
      stack: e.stack,
    });
    // throw e; // To display the error message, the stack trace and exit the process
  };
}

process.on("unhandledRejection", handleError("Unhandled Rejection"));
process.on("uncaughtException", handleError("Uncaught Exception"));
process.on(
  "uncaughtExceptionMonitor",
  handleError("Uncaught Exception Monitor"),
);
process.setUncaughtExceptionCaptureCallback(
  handleError("Uncaught Exception Capture Callback"),
);

const serveOptions = await getServeOptions();

if (!serveOptions) process.exit(1);

init(serveOptions);

declare global {
  var brisaServer: Server;
}

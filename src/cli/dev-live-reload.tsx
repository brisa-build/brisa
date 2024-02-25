import { watch } from "node:fs";
import path from "node:path";
import constants from "@/constants";
import dangerHTML from "@/utils/danger-html";
import compileAll from "@/utils/compile-all";

const { LOG_PREFIX, SRC_DIR, IS_DEVELOPMENT } = constants;
const LIVE_RELOAD_WEBSOCKET_PATH = "__brisa_live_reload__";
const LIVE_RELOAD_COMMAND = "reload";

let semaphore = false;
let waitFilename = "";

if (IS_DEVELOPMENT) {
  if (globalThis.watcher) {
    globalThis.watcher.close();
  } else {
    console.log(LOG_PREFIX.INFO, "hot reloading enabled");
  }

  globalThis.watcher = watch(
    SRC_DIR,
    { recursive: true },
    async (event, filename) => {
      const filePath = path.join(SRC_DIR, filename as string);

      if (event !== "change" && Bun.file(filePath).size !== 0) return;

      console.log(LOG_PREFIX.WAIT, `recompiling ${filename}...`);
      if (semaphore) waitFilename = filename as string;
      else recompile(filename as string);
    },
  );

  process.on("SIGINT", () => {
    globalThis.watcher?.close();
    process.exit(0);
  });
}

async function recompile(filename: string) {
  semaphore = true;
  globalThis.Loader.registry.clear();

  const nsStart = Bun.nanoseconds();
  const success = await compileAll();
  const nsEnd = Bun.nanoseconds();
  const ms = ((nsEnd - nsStart) / 1000000).toFixed(2);

  if (!success) {
    console.log(LOG_PREFIX.ERROR, `failed to recompile ${filename}`);
    semaphore = false;
    return;
  }

  console.log(LOG_PREFIX.READY, `hot reloaded successfully in ${ms}ms`);

  if (!globalThis.brisaServer) return;

  globalThis.brisaServer.publish("hot-reload", LIVE_RELOAD_COMMAND);

  if (waitFilename) {
    let popFilename = waitFilename;
    waitFilename = "";
    await recompile(popFilename);
  }
  semaphore = false;
}

export function LiveReloadScript({
  port,
  children,
}: {
  port: number;
  children: JSX.Element;
}) {
  const PORT = globalThis.brisaServer?.port ?? port;
  const wsUrl = `ws://0.0.0.0:${PORT}/${LIVE_RELOAD_WEBSOCKET_PATH}`;

  return (
    <>
      <script>
        {dangerHTML(
          `(new WebSocket("${wsUrl}")).onmessage = e => e.data === "${LIVE_RELOAD_COMMAND}" && location.reload();`,
        )}
      </script>
      {children}
    </>
  );
}

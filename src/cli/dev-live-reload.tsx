import { SpawnOptions } from "bun";
import { watch } from "node:fs";
import path from "node:path";
import getConstants from "../constants";
import dangerHTML from "../utils/danger-html";

type Spawn = SpawnOptions.OptionsObject<
  SpawnOptions.Writable,
  SpawnOptions.Readable,
  SpawnOptions.Readable
> & { cmd: string[] };

const { LOG_PREFIX, SRC_DIR, IS_DEVELOPMENT } = getConstants();
const LIVE_RELOAD_WEBSOCKET_PATH = "__brisa_live_reload__";
const LIVE_RELOAD_COMMAND = "reload";
const buildPath = path.join(import.meta.dir, "..", "build.js");
const spawnOptions: Spawn = {
  cmd: [process.execPath, buildPath],
  env: process.env,
  stderr: "pipe",
};

let semaphore = false;
let waitFilename = "";

if (IS_DEVELOPMENT) {
  console.log(LOG_PREFIX.INFO, "hot reloading enabled");
  watch(SRC_DIR, { recursive: true }, async (event, filename) => {
    const filePath = path.join(SRC_DIR, filename as string);

    if (event !== "change" && Bun.file(filePath).size !== 0) return;

    console.log(LOG_PREFIX.WAIT, `recompiling ${filename}...`);
    if (semaphore) waitFilename = filename as string;
    else recompile(filename as string);
  });
}

function recompile(filename: string) {
  semaphore = true;
  globalThis.Loader.registry.clear();

  const nsStart = Bun.nanoseconds();
  const { exitCode, stderr } = Bun.spawnSync(spawnOptions);
  const nsEnd = Bun.nanoseconds();
  const ms = ((nsEnd - nsStart) / 1000000).toFixed(2);

  if (exitCode !== 0) {
    console.log(
      LOG_PREFIX.ERROR,
      `failed to recompile ${filename}`,
      stderr.toString()
    );
    semaphore = false;
    return;
  }

  console.log(LOG_PREFIX.READY, `hot reloaded successfully in ${ms}ms`);

  if (!globalThis.brisaServer) return;

  globalThis.brisaServer.publish("hot-reload", LIVE_RELOAD_COMMAND);

  if (waitFilename) {
    let popFilename = waitFilename;
    waitFilename = "";
    recompile(popFilename);
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
          `(new WebSocket("${wsUrl}")).onmessage = e => e.data === "${LIVE_RELOAD_COMMAND}" && location.reload();`
        )}
      </script>
      {children}
    </>
  );
}

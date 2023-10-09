import { watch } from "node:fs";
import path from "node:path";
import dangerHTML from "../core/danger-html";
import getConstants from "../constants";

const { LOG_PREFIX, SRC_DIR, IS_PRODUCTION } = getConstants();
const LIVE_RELOAD_WEBSOCKET_PATH = "__brisa_live_reload__";
const LIVE_RELOAD_COMMAND = "reload";

if (!IS_PRODUCTION) {
  console.log(LOG_PREFIX.INFO, "hot reloading enabled");
  watch(SRC_DIR, { recursive: true }, async (event, filename) => {
    if (event !== "change") return;

    console.log(LOG_PREFIX.WAIT, `recompiling ${filename}...`);
    globalThis.Loader.registry.clear();

    const nsStart = Bun.nanoseconds();
    const { exitCode, stderr } = Bun.spawnSync({
      cmd: [process.execPath, path.join(import.meta.dir, "..", "build.js")],
      env: process.env,
      stderr: "pipe",
      stdout: "inherit",
    });
    const nsEnd = Bun.nanoseconds();
    const ms = ((nsEnd - nsStart) / 1000000).toFixed(2);

    if (exitCode !== 0) {
      console.log(
        LOG_PREFIX.ERROR,
        `failed to recompile ${filename}`,
        stderr.toString(),
      );
      return;
    }

    console.log(LOG_PREFIX.READY, `recompiled successfully in ${ms}ms`);
    globalThis?.ws?.send(LIVE_RELOAD_COMMAND);
  });
}

export function LiveReloadScript({
  port,
  children,
}: {
  port: number;
  children: JSX.Element;
}) {
  const wsUrl = `ws://0.0.0.0:${port}/${LIVE_RELOAD_WEBSOCKET_PATH}`;

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

import { watch } from "node:fs";
import path from "node:path";
import constants from "@/constants";
import dangerHTML from "@/utils/danger-html";
import compileAll from "@/utils/compile-all";
import { toInline } from "@/helpers";

const { LOG_PREFIX, SRC_DIR, IS_DEVELOPMENT, IS_SERVE_PROCESS } = constants;
const LIVE_RELOAD_WEBSOCKET_PATH = "__brisa_live_reload__";
const LIVE_RELOAD_COMMAND = "reload";
const hashSet = new Set();
const MAX_HASHES = 100;

export async function activateHotReload() {
  let semaphore = false;
  let waitFilename = "";

  async function watchSourceListener(event: any, filename: any) {
    const filePath = path.join(SRC_DIR, filename);
    const file = Bun.file(filePath);

    if (event !== "change" && file.size !== 0) return;

    const hash = Bun.hash(await file.arrayBuffer());

    if (hashSet.has(hash)) return;
    if (hashSet.size > MAX_HASHES) hashSet.clear();

    hashSet.add(hash);

    console.log(LOG_PREFIX.WAIT, `recompiling ${filename}...`);
    if (semaphore) waitFilename = filename as string;
    else recompile(filename as string);
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

  if (globalThis.watcher) {
    globalThis.watcher.close();
  } else {
    console.log(LOG_PREFIX.INFO, "hot reloading enabled");
  }

  globalThis.watcher = watch(SRC_DIR, { recursive: true }, watchSourceListener);

  process.on("SIGINT", () => {
    globalThis.watcher?.close();
    process.exit(0);
  });
}

// Checking IS_SERVE_PROCESS is totally necessary because this component is
// put inside the renderToReadableStream, but at the same time this method
// could be used outside for other reasons without having to run hotreloading,
// it only makes sense to start hotreloading if it is the serve process.
// IS_DEVELOPMENT instead of !IS_PRODUCTION to avoid Test environments.
if (IS_DEVELOPMENT && IS_SERVE_PROCESS) activateHotReload();

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
      <script id="hotreloading-script">
        {dangerHTML(
          toInline(
            `(()=>{
            let s;
            let tries = 0;

            function wsc() {
              tries++;
              if(tries > 10) return;
              if(s) s.close();
              s = new WebSocket("${wsUrl}");
              s.onmessage = e => {
                if(e.data === "${LIVE_RELOAD_COMMAND}"){
                  window._xm = "native";
                  location.reload();
                }
              };
              s.onopen = () => { tries = 0 };
              s.onclose = wsc;
              s.onerror = () => s.close();
            }
            wsc();
          })();`,
          ),
        )}
      </script>
      {children}
    </>
  );
}

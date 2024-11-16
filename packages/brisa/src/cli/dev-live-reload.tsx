import { watch, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import constants, { reinitConstants } from '@/constants';
import dangerHTML from '@/utils/danger-html';
import { toInline } from '@/helpers';
import { logError } from '@/utils/log/log-build';

const { LOG_PREFIX, SRC_DIR, IS_DEVELOPMENT, IS_SERVE_PROCESS } = constants;
const LIVE_RELOAD_WEBSOCKET_PATH = '__brisa_live_reload__';
const LIVE_RELOAD_COMMAND = 'reload';

// Similar than Bun.nanoseconds, but also working with Node.js
function nanoseconds() {
  return Number(process.hrtime.bigint());
}

async function activateHotReload() {
  let semaphore = false;
  let waitFilename = '';

  async function watchSourceListener(event: any, filename: any) {
    try {
      // Compile assets only once (there are some issues with variable fonts)
      // - https://github.com/brisa-build/brisa/issues/227
      // - https://github.com/brisa-build/brisa/issues/228
      if (filename.split(path.sep)[0] === 'public') return;

      const filePath = path.join(SRC_DIR, filename);

      if (!existsSync(filePath)) return;
      if (event !== 'change' && statSync(filePath).size !== 0) return;

      console.log(LOG_PREFIX.WAIT, `recompiling ${filename}...`);
      if (semaphore) waitFilename = filename as string;
      else recompile(filename as string);
    } catch (e: any) {
      logError({
        messages: [e.message, `Error while trying to recompile ${filename}`],
        stack: e.stack,
        docTitle: `Please, file a GitHub issue to Brisa's team`,
        docLink: 'https://github.com/brisa-build/brisa/issues/new',
      });
    }
  }

  async function recompile(filename: string) {
    semaphore = true;

    if (typeof Bun !== 'undefined') {
      globalThis.Loader.registry.clear();
    }

    const nsStart = nanoseconds();

    // Note: we are using spawnSync instead of executing directly the build because
    // we prefer to separate both processes. In this way, serve can be executed in
    // different runtimes, like Node.js or Bun, however, the build process is always
    // executed in Bun.
    // https://github.com/brisa-build/brisa/issues/404
    const { error } = spawnSync(
      process.execPath,
      [path.join(process.argv[1], '..', '..', 'build.js')],
      {
        env: Object.assign(process.env, { QUIET_MODE: 'true' }),
        stdio: ['inherit', 'inherit', 'pipe'],
      },
    );

    const nsEnd = nanoseconds();
    const ms = ((nsEnd - nsStart) / 1000000).toFixed(2);

    if (error) {
      console.log(
        LOG_PREFIX.ERROR,
        `failed to recompile ${filename}`,
        error.toString(),
      );
      semaphore = false;
      return;
    }

    console.log(LOG_PREFIX.READY, `hot reloaded successfully in ${ms}ms`);

    if (!globalThis.brisaServer) return;

    await reinitConstants();
    globalThis.brisaServer.publish('hot-reload', LIVE_RELOAD_COMMAND);

    if (waitFilename) {
      const popFilename = waitFilename;
      waitFilename = '';
      await recompile(popFilename);
    }
    semaphore = false;
  }

  if (globalThis.watcher) {
    globalThis.watcher.close();
  } else {
    console.log(LOG_PREFIX.INFO, 'hot reloading enabled');
  }

  globalThis.watcher = watch(SRC_DIR, { recursive: true }, watchSourceListener);

  process.on('SIGINT', () => {
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
  const wsUrl = `ws://localhost:${PORT}/${LIVE_RELOAD_WEBSOCKET_PATH}`;

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

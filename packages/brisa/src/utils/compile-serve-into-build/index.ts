import path from 'node:path';
import fs from 'node:fs';
import { getConstants } from '@/constants';
import { logBuildError } from '../log/log-build';

/**
 * This function move the brisa/cli/out/serve/index.js file into the build folder
 * executing the constants in a Macro to don't calculate them on runtime anymore.
 *
 * The idea of doing this process is that they can use the build folder and run
 * the server from anywhere, now the constants are calculated at runtime from
 * the root of the project, so if the ROOT_DIR is hardcoded, the server
 * would not work if called from another place that is not the root of the project.
 */
export default async function compileServeIntoBuild(
  servePathname = path.join(import.meta.dirname, 'serve', 'index.js'),
) {
  const { BUILD_DIR, LOG_PREFIX, CONFIG, ROOT_DIR } = getConstants();
  const out = path.join(BUILD_DIR, 'server.js');
  const isNode = CONFIG.output === 'node';
  const runtimeName = isNode ? 'Node.js' : 'Bun.js';
  const runtimeExec = isNode ? 'node' : 'bun run';

  const output = await Bun.build({
    entrypoints: [servePathname],
    target: isNode ? 'node' : 'bun',
    define: {
      'process.env.ROOT_DIR': `"${ROOT_DIR}"`,
      'process.env.WORKSPACE': `"${BUILD_DIR}"`,
      'process.env.BRISA_BUILD_FOLDER': `"${BUILD_DIR}"`,
    },
  });

  if (!output.success) {
    logBuildError(`Error compiling the ${runtimeName} server`, output.logs);
  }

  fs.writeFileSync(out, await output.outputs[0].text());
  console.log(LOG_PREFIX.INFO);
  console.log(
    LOG_PREFIX.INFO,
    LOG_PREFIX.TICK,
    `${runtimeName} Server compiled into build folder`,
  );
  console.log(
    LOG_PREFIX.INFO,
    `\t- To run the ${runtimeName} server: brisa start`,
  );
  console.log(
    LOG_PREFIX.INFO,
    `\t- Or directly from the build folder: NODE_ENV=production ${runtimeExec} ${out}`,
  );
  console.log(LOG_PREFIX.INFO);
}

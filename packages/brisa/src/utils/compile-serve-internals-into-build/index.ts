import path from 'node:path';
import fs from 'node:fs';
import { getConstants } from '@/constants';
import { logBuildError } from '../log/log-build';
import getImportableFilepath from '../get-importable-filepath';

const SERVER_OUTPUTS = new Set(['bun', 'node']);

/**
 * This function move the brisa/cli/out/serve/index.js file into the build folder
 * and defining the ROOT_DIR, BUILD_DIR, WORKSPACE constants.
 *
 * Also moves the brisa.config.js file into the build folder.
 *
 * The idea of doing this process is that they can use the build folder and run
 * the server from anywhere, now the constants are calculated at runtime from
 * the root of the project, so if the ROOT_DIR is hardcoded, the server
 * would not work if called from another place that is not the root of the project.
 *
 */
export default async function compileServeInternalsIntoBuild(
  servePathname = path.join(import.meta.dirname, 'serve', 'index.js'),
) {
  const { BUILD_DIR, LOG_PREFIX, CONFIG, ROOT_DIR, IS_PRODUCTION } =
    getConstants();
  const isNode = CONFIG.output === 'node';
  const runtimeName = isNode ? 'Node.js' : 'Bun.js';
  const runtimeExec = isNode ? 'node' : 'bun run';
  const entrypoints = [];
  const configImportPath = getImportableFilepath('brisa.config', ROOT_DIR);
  const isServer = IS_PRODUCTION && SERVER_OUTPUTS.has(CONFIG.output ?? 'bun');
  const serverOutPath = path.join(BUILD_DIR, 'server.js');

  if (configImportPath) {
    entrypoints.push(configImportPath);
  }

  if (isServer) {
    entrypoints.push(servePathname);
  }

  if (!entrypoints.length) {
    return;
  }

  const output = await Bun.build({
    entrypoints,
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

  for (const file of output.outputs) {
    const out = file.path.includes('brisa.config')
      ? path.join(BUILD_DIR, 'brisa.config.js')
      : serverOutPath;

    fs.writeFileSync(out, await file.text());
  }

  if (isServer) {
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
      `\t- Or directly from the build folder: NODE_ENV=production ${runtimeExec} ${serverOutPath}`,
    );
    console.log(LOG_PREFIX.INFO);
  }
}

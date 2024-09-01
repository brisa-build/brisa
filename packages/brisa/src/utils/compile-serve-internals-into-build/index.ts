import path from 'node:path';
import fs from 'node:fs';
import { getConstants } from '@/constants';
import { logBuildError } from '../log/log-build';
import getImportableFilepath from '../get-importable-filepath';

const SERVER_OUTPUTS = new Set(['bun', 'node']);
const BRISA_ROOT_DIR = path.join(import.meta.dirname, '..', '..');
const NO_SERVER_EXPORTS = new Set([
  './client',
  './client-simplified',
  './test',
  './cli.js',
]);

/**
 * This function move the brisa/cli/out/serve/index.js file into the build folder
 * and defining the ROOT_DIR, BUILD_DIR, WORKSPACE constants.
 *
 * Also moves the brisa.config.js file into the build folder and creates a package.json.
 *
 * The idea of doing this process is that they can use the build folder and run
 * the server from anywhere, now the constants are calculated at runtime from
 * the root of the project, so if the ROOT_DIR is hardcoded, the server
 * would not work if called from another place that is not the root of the project.
 *
 */
export default async function compileServeInternalsIntoBuild() {
  const { BUILD_DIR, LOG_PREFIX, CONFIG, ROOT_DIR, IS_PRODUCTION, BRISA_DIR } =
    getConstants();
  const servePathname = path.join(
    BRISA_DIR!,
    'out',
    'cli',
    'serve',
    'index.js',
  );
  const isNode = CONFIG.output === 'node';
  const runtimeName = isNode ? 'Node.js' : 'Bun.js';
  const runtimeExec = isNode ? 'node' : 'bun run';
  const entrypoints = [];
  const configImportPath = getImportableFilepath('brisa.config', ROOT_DIR);
  const isServer = IS_PRODUCTION && SERVER_OUTPUTS.has(CONFIG.output ?? 'bun');
  const serverOutPath = path.join(BUILD_DIR, 'server.js');
  const indexPath = path.join(BUILD_DIR, 'index.js');

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
    outdir: BUILD_DIR,
    naming: {
      entry: '[name].[ext]',
    },
    external: CONFIG.external,
    target: isNode ? 'node' : 'bun',
    define: {
      'process.env.IS_SERVE_PROCESS': 'true',
      'process.env.IS_PROD': 'true',
      'process.env.IS_STANDALONE_SERVER': 'true',
    },
  });

  if (!output.success) {
    logBuildError(`Error compiling the ${runtimeName} server`, output.logs);
  }

  if (fs.existsSync(indexPath)) {
    fs.renameSync(indexPath, serverOutPath);
  }

  createBrisaModule(runtimeExec);
  addBrisaModule();

  if (isServer) {
    const relativeServerFilePath = path.join(
      path.relative(ROOT_DIR, BUILD_DIR),
      'server.js',
    );

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
      `\t- Or directly from the build folder: ${runtimeExec} ${relativeServerFilePath}`,
    );
    console.log(LOG_PREFIX.INFO);
  }
}

function createBrisaModule(runtimeExec: string) {
  const { BUILD_DIR, VERSION } = getConstants();
  const packageJSON = {
    name: 'brisa-app',
    version: '0.0.1',
    type: 'module',
    main: 'server.js',
    private: true,
    scripts: {
      start: `${runtimeExec} server.js`,
    },
    dependencies: {
      brisa: VERSION,
    },
  };

  fs.writeFileSync(
    path.join(BUILD_DIR, 'package.json'),
    JSON.stringify(packageJSON, null, 2),
  );
}

type Module = {
  import: string;
  require: string;
  node: string;
  bun: string;
};

function addBrisaModule() {
  const { BUILD_DIR, BRISA_DIR, VERSION } = getConstants();
  const packageJSONPath = path.join(BRISA_DIR!, 'package.json');
  const BRISA_PACKAGE_JSON = fs.existsSync(packageJSONPath)
    ? JSON.parse(fs.readFileSync(packageJSONPath, 'utf-8'))
    : {};
  const brisaModulePath = path.join(BUILD_DIR, 'node_modules', 'brisa');
  const brisaPackageJSON = {
    name: 'brisa',
    version: VERSION,
    type: 'module',
    main: 'index.js',
    private: true,
    exports: {},
  };

  const exports = Object.entries<Module>(BRISA_PACKAGE_JSON.exports ?? {});

  if (!fs.existsSync(brisaModulePath)) {
    fs.mkdirSync(brisaModulePath, { recursive: true });
  }

  for (const [key, value] of exports) {
    if (NO_SERVER_EXPORTS.has(key)) continue;
    const isIndex = key === '.';
    const normalizedName = isIndex
      ? 'index.js'
      : key.replace('./', '').replaceAll('/', '-') + '.js';

    (brisaPackageJSON.exports as Record<string, Module>)[key] = {
      import: `./${normalizedName}`,
      require: `./${normalizedName}`,
      node: `./${normalizedName}`,
      bun: `./${normalizedName}`,
    };

    fs.copyFileSync(
      path.join(BRISA_DIR!, value.import),
      path.join(brisaModulePath, normalizedName),
    );
  }

  fs.writeFileSync(
    path.join(brisaModulePath, 'package.json'),
    JSON.stringify(brisaPackageJSON, null, 2),
  );
}

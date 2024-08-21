import fs from 'node:fs';
import path from 'node:path';
import { getConstants } from '@/constants';
import { logError } from '@/utils/log/log-build';
import { getWebComponentListFromFilePaths } from '@/utils/get-web-components-list';
import getDefinedEnvVar from '@/utils/client-build-plugin/get-defined-env-var';
import clientBuildPlugin from '@/utils/client-build-plugin';
import createContextPlugin from '@/utils/create-context/create-context-plugin';
import serverComponentPlugin from '@/utils/server-component-plugin';

export default async function buildStandalone(
  standaloneWC: string[],
  standaloneSC: string[],
) {
  const { BUILD_DIR, LOG_PREFIX } = getConstants();
  const start = Bun.nanoseconds();

  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true });
  }

  if (!standaloneSC.length && !standaloneWC.length) {
    logError({ messages: ['No standalone components provided'] });
    process.exit(1);
  }

  console.log(LOG_PREFIX.WAIT, `🚀 building your standalone components...`);

  const serverRes = await compileStandaloneServerComponents(
    standaloneSC,
    standaloneWC,
  );
  const clientRes = await compileStandaloneWebComponents(standaloneWC);

  console.dir({ clientRes, serverRes }, { depth: null });

  const end = Bun.nanoseconds();
  const ms = ((end - start) / 1e6).toFixed(2);

  console.log(LOG_PREFIX.INFO, `✨  Done in ${ms}ms.`);
}

async function compileStandaloneServerComponents(
  standaloneSC: string[],
  standaloneWC: string[],
) {
  const allWebComponents = getWebComponentListFromFilePaths(standaloneWC);
  const { BUILD_DIR, LOG_PREFIX, SRC_DIR, IS_PRODUCTION, CONFIG } =
    getConstants();
  const extendPlugins = CONFIG.extendPlugins ?? ((plugins) => plugins);
  const entrypoints = [...standaloneSC, ...standaloneWC];
  return Bun.build({
    entrypoints,
    outdir: BUILD_DIR,
    root: SRC_DIR,
    // Standalone components can be used in other frameworks, is better
    // to use the Node.js target to avoid any issues
    target: 'node',
    minify: IS_PRODUCTION,
    splitting: false,
    naming: '[dir]/[name].server.[ext]',
    // To load the SSR of this standalone component on another framework
    // or plain Node.js/Bun.js, you need to use "brisa" and "brisa/server"
    // so, we need to externalize these dependencies
    external: ['brisa', 'brisa/server'],
    define: getDefine(),
    plugins: extendPlugins(
      [
        {
          name: 'standalone-server-components',
          setup(build) {
            build.onLoad(
              { filter: /\.(tsx|jsx|mdx)$/ },
              async ({ path, loader }) => {
                let code = await Bun.file(path).text();

                try {
                  const result = serverComponentPlugin(code, {
                    path,
                    allWebComponents,
                    fileID: '',
                  });
                  if (result.hasActions) {
                    // TODO: log error (actions are not allowed in standalone)
                  }

                  code = result.code;
                } catch (error) {
                  console.log(LOG_PREFIX.ERROR, `Error transforming ${path}`);
                  console.log(LOG_PREFIX.ERROR, (error as Error).message);
                }

                return {
                  contents: code,
                  loader,
                };
              },
            );
          },
        },
        createContextPlugin(),
      ],
      { dev: !IS_PRODUCTION, isServer: true },
    ),
  });
}

async function compileStandaloneWebComponents(standaloneWC: string[]) {
  const { BUILD_DIR, LOG_PREFIX, SRC_DIR, IS_PRODUCTION, CONFIG } =
    getConstants();
  const extendPlugins = CONFIG.extendPlugins ?? ((plugins) => plugins);

  return Bun.build({
    entrypoints: [...standaloneWC],
    root: SRC_DIR,
    outdir: BUILD_DIR,
    target: 'browser',
    minify: IS_PRODUCTION,
    define: getDefine(),
    external: ['brisa', 'brisa/client'],
    naming: '[dir]/[name].client.[ext]',
    plugins: extendPlugins(
      [
        {
          name: 'standalone-web-components',
          setup(build) {
            build.onLoad(
              {
                filter: /\.(tsx|jsx|mdx)$/,
              },
              async ({ path, loader }) => {
                let code = await Bun.file(path).text();

                try {
                  const res = clientBuildPlugin(code, path, {
                    forceBuild: true,
                  });
                  code = res.code;
                } catch (error) {
                  console.log(LOG_PREFIX.ERROR, `Error transforming ${path}`);
                  console.log(LOG_PREFIX.ERROR, (error as Error).message);
                }

                return {
                  contents: code,
                  loader,
                };
              },
            );
          },
        },
        createContextPlugin(),
      ],
      { dev: !IS_PRODUCTION, isServer: false, entrypoint: '' },
    ),
  });
}

function getDefine() {
  const { IS_PRODUCTION } = getConstants();

  return {
    __DEV__: (!IS_PRODUCTION).toString(),
    // For standalone components, we don't use the following variables:
    __WEB_CONTEXT_PLUGINS__: 'false',
    __BASE_PATH__: 'false',
    __ASSET_PREFIX__: 'false',
    __TRAILING_SLASH__: 'false',
    __USE_LOCALE__: 'false',
    __USE_PAGE_TRANSLATION__: 'false',
    ...getDefinedEnvVar(),
  };
}

if (import.meta.main) {
  const { ROOT_DIR } = getConstants();
  const standaloneWC: string[] = [];
  const standaloneSC: string[] = [];

  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === 'WC') {
      standaloneWC.push(path.resolve(ROOT_DIR, process.argv[i + 1]));
    }
    if (process.argv[i] === 'SC') {
      standaloneSC.push(path.resolve(ROOT_DIR, process.argv[i + 1]));
    }
  }

  await buildStandalone(standaloneWC, standaloneSC);
  process.exit(0);
}

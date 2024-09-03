import type { Adapter } from 'brisa';
import path from 'node:path';
import fs from 'node:fs/promises';
import { Config } from '.';

const REGEX_INDEX_HTML = /(\/?index)?\.html?$/;

type Route = {
  src?: string;
  dest?: string;
  headers?: Record<string, string>;
  status?: number;
  handle?: string;
  has?: {
    type: string;
    key: string;
    value: string;
  }[];
  continue?: boolean;
};

export default function vercelAdapter({
  memory,
  regions,
  maxDuration,
}: Config = {}): Adapter {
  return {
    name: 'vercel',
    async adapt({ CONFIG, ROOT_DIR, BUILD_DIR }, generatedMap) {
      const vercelFolder = path.join(ROOT_DIR, '.vercel');
      const outputFolder = path.join(vercelFolder, 'output');
      const configPath = path.join(outputFolder, 'config.json');
      const outDir = path.join(ROOT_DIR, 'out');
      const publicDir = path.join(BUILD_DIR, 'public');
      const staticDir = path.join(outputFolder, 'static');

      switch (CONFIG.output) {
        case 'static': {
          await initVercelOutput();
          await adaptStaticOutput();
          break;
        }
        case 'node': {
          await initVercelOutput();
          await adaptNodeOutput();
          break;
        }
        default: {
          console.error(
            'Vercel adapter only supports "node" and "static" output. Please set the "output" field in the brisa.config.ts file',
          );
          return;
        }
      }

      async function initVercelOutput() {
        await fs.rm(vercelFolder, { recursive: true, force: true });
        await fs.mkdir(vercelFolder);
        await fs.mkdir(outputFolder);
      }

      async function adaptNodeOutput() {
        const fnFolder = path.join(outputFolder, 'functions', 'fn.func');
        const packageJSON = path.join(fnFolder, 'package.json');
        const vcConfig = path.join(fnFolder, '.vc-config.json');

        await adaptStaticOutput({ useFileSystem: true });

        if (!(await fs.exists(fnFolder))) {
          await fs.mkdir(fnFolder, { recursive: true });
        }

        const vsConfig: Record<string, any> = {
          runtime: 'nodejs20.x',
          handler: 'build/server.js',
          launcherType: 'Nodejs',
          supportsResponseStreaming: true,
          environment: {
            USE_HANDLER: 'true',
          },
        };

        if (memory) vsConfig.memory = memory;

        await fs.writeFile(packageJSON, '{"type":"module"}', 'utf-8');
        await fs.writeFile(
          vcConfig,
          JSON.stringify(vsConfig, null, 2),
          'utf-8',
        );

        // Move all the build folder inside fnFolder:
        const buildFolder = path.join(fnFolder, 'build');
        await fs.cp(BUILD_DIR, buildFolder, { recursive: true });
      }

      async function adaptStaticOutput({ useFileSystem = false } = {}) {
        const pages = Array.from(
          generatedMap?.values() ?? [],
        ).flat() as string[];
        const sepSrc = CONFIG.trailingSlash ? '/' : '';
        const sepDest = CONFIG.trailingSlash ? '' : '/';
        const routes = pages.flatMap<Route>((originalPage) => {
          const page = originalPage.replace(/^\//, '');

          if (page === 'index.html') {
            return [
              {
                src: '/',
                dest: '/index.html',
              },
            ];
          }

          const pageFile = page.replace(REGEX_INDEX_HTML, '');
          const src = `/${pageFile}${sepSrc}`;
          const dest = `/${pageFile}${sepDest}`;

          return [
            {
              src,
              dest,
            },
            {
              headers: {
                Location: src,
              },
              src: dest,
              status: 308,
            },
          ];
        });

        const overrides = {};

        for (const originalPage of pages) {
          const page = originalPage.replace(/^\//, '');
          overrides[page] = {
            path: page.replace(REGEX_INDEX_HTML, ''),
          };
        }

        // https://vercel.com/docs/deployments/skew-protection
        if (process.env.VERCEL_SKEW_PROTECTION_ENABLED) {
          routes.push({
            src: '/.*',
            has: [
              {
                type: 'header',
                key: 'Sec-Fetch-Dest',
                value: 'document',
              },
            ],
            headers: {
              'Set-Cookie': `__vdpl=${process.env.VERCEL_DEPLOYMENT_ID}; Path=${CONFIG.basePath ?? ''}/; SameSite=Strict; Secure; HttpOnly`,
            },
            continue: true,
          });
        }

        if (useFileSystem) {
          routes.push(
            ...[
              {
                handle: 'filesystem',
              },
              {
                src: '/.*',
                dest: '/fn',
              },
            ],
          );
        }

        const configJSON = { version: 3, routes, overrides };

        await fs.writeFile(configPath, JSON.stringify(configJSON, null, 2));
        await fs.mkdir(staticDir);

        const assetsFolder = useFileSystem ? publicDir : outDir;

        if (await fs.exists(assetsFolder)) {
          await fs.cp(assetsFolder, staticDir, { recursive: true });
        }
      }
    },
  };
}

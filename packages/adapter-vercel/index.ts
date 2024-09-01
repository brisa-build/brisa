import type { Adapter } from 'brisa';
import path from 'node:path';
import fs from 'node:fs/promises';

const REGEX_INDEX_HTML = /(\/?index)?\.html?$/;

type Route = {
  src?: string;
  dest?: string;
  headers?: Record<string, string>;
  status?: number;
  handle?: string;
};

export default function vercelAdapter(): Adapter {
  return {
    name: 'vercel',
    async adapt({ CONFIG, ROOT_DIR }, generatedMap) {
      const vercelFolder = path.join(ROOT_DIR, '.vercel');
      const outputFolder = path.join(vercelFolder, 'output');
      const configPath = path.join(outputFolder, 'config.json');
      const outDir = path.join(ROOT_DIR, 'out');
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
          // Skip adaptation
          return;
        }
      }

      async function initVercelOutput() {
        await fs.rm(vercelFolder, { recursive: true, force: true });
        await fs.mkdir(vercelFolder);
        await fs.mkdir(outputFolder);
      }

      async function adaptNodeOutput() {
        await adaptStaticOutput({ useFileSystem: true });
        const fnFolder = path.join(vercelFolder, 'functions', 'fn.func');

        if (!(await fs.exists(fnFolder))) {
          await fs.mkdir(fnFolder, { recursive: true });
        }
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
        await fs.cp(outDir, staticDir, { recursive: true });
      }
    },
  };
}

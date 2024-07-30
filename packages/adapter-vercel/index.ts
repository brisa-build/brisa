import type { Adapter } from 'brisa';
import path from 'node:path';
import fs from 'node:fs/promises';

const REGEX_INDEX_HTML = /(\/?index)?\.html?$/;

export default function vercelAdapter(): Adapter {
  return {
    name: 'vercel',
    async adapt({ CONFIG, ROOT_DIR }, generatedMap) {
      const vercelFolder = path.join(ROOT_DIR, '.vercel');
      const outputFolder = path.join(vercelFolder, 'output');
      const configPath = path.join(outputFolder, 'config.json');
      const outDir = path.join(ROOT_DIR, 'out');
      const staticDir = path.join(outputFolder, 'static');

      // TODO: Support output=server
      if (CONFIG.output !== 'static') {
        console.error(
          'Vercel adapter only supports static output. Please set the output to "static" in the brisa.config.ts file',
        );
        // Skip the adaptation
        return;
      } else {
        await adaptStaticOutput();
      }

      async function initVercelOutput() {
        await fs.rm(vercelFolder, { recursive: true, force: true });
        await fs.mkdir(vercelFolder);
        await fs.mkdir(outputFolder);
      }

      async function adaptStaticOutput() {
        await initVercelOutput();
        const pages = Array.from(generatedMap?.values() ?? []).flat();
        const sepSrc = CONFIG.trailingSlash ? '/' : '';
        const sepDest = CONFIG.trailingSlash ? '' : '/';
        const routes = pages.flatMap((originalPage) => {
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

        const configJSON = { version: 3, routes, overrides };

        await fs.writeFile(configPath, JSON.stringify(configJSON, null, 2));
        await fs.mkdir(staticDir);
        await fs.cp(outDir, staticDir, { recursive: true });
      }
    },
  };
}

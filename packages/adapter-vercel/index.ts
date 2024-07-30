import type { Adapter, BrisaConstants } from 'brisa';
import path from 'node:path';
import fs from 'node:fs/promises';

const REGEX_INDEX_HTML = /(index)?\.html$/;

export default function vercelAdapter(): Adapter {
  return {
    name: 'vercel',
    async adapt({ CONFIG, ROOT_DIR }, generatedMap) {
      const vercelFolder = path.join(ROOT_DIR, '.vercel');
      const outputFolder = path.join(vercelFolder, 'output');
      const configPath = path.join(outputFolder, 'config.json');

      // Remove the .vercel folder if it exists
      await fs.rm(vercelFolder, { recursive: true, force: true });

      // Create the .vercel folder with the output folder
      await fs.mkdir(vercelFolder);
      await fs.mkdir(outputFolder);

      const pages = Array.from(generatedMap?.values() ?? []).flat();
      const routes = pages.flatMap((page) => {
        if (page === 'index.html') {
          return [
            {
              src: '/',
              dest: '/index.html',
            },
          ];
        }

        const src = `/${page.replace(REGEX_INDEX_HTML, '')}`;
        const dest = `${src}/`;

        return [
          {
            src,
            dest,
          },
          {
            headers: {
              Location: src,
            },
            src: src + '/',
            status: 308,
          },
        ];
      });

      const overrides = {};

      for (const page of pages) {
        overrides[page] = {
          path: page.replace(REGEX_INDEX_HTML, ''),
        };
      }

      const configJSON = {
        version: 3,
        routes,
        overrides,
      };

      // Create the .vercel/output/config.json file
      await fs.writeFile(configPath, JSON.stringify(configJSON, null, 2));

      console.log('Vercel adapter has been adapted');
    },
  };
}

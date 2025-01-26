import path from 'node:path';
import type {Loader} from 'bun';
import fs from 'node:fs';
import { getConstants } from '@/constants';
import { logError } from '../log/log-build';
import { gzipSync, Glob } from 'bun';
import { brotliCompressSync } from 'node:zlib';

const cssGlob = new Glob('**/*.css');

export default async function handleCSSFiles() {
  try {
    const { BUILD_DIR, CONFIG, LOG_PREFIX, IS_BUILD_PROCESS, IS_PRODUCTION } =
      getConstants();
    const publicFolder = path.join(BUILD_DIR, 'public');

    if (!fs.existsSync(publicFolder)) fs.mkdirSync(publicFolder);

    const cssFilePaths: string[] = await moveCSSInsidePublic(BUILD_DIR);
    const integrations = (CONFIG?.integrations ?? []).filter(
      (integration) => integration.transpileCSS,
    );

    // Using CSS integrations
    if (integrations.length > 0) {
      for (const integration of integrations) {
        const startTime = Date.now();

        if (IS_BUILD_PROCESS) {
          console.log(
            LOG_PREFIX.WAIT,
            `transpiling CSS with ${integration.name}...`,
          );
        }

        let useDefault = true;

        for (const file of cssFilePaths) {
          const pathname = path.join(publicFolder, file);
          const rawContent = fs.readFileSync(pathname, 'utf-8');
          const content =
            (await integration.transpileCSS?.(pathname, rawContent)) ?? '';
          useDefault &&=
            integration.defaultCSS?.applyDefaultWhenEvery?.(rawContent) ?? true;
          fs.writeFileSync(path.join(publicFolder, file), content);
        }

        if (useDefault && integration.defaultCSS) {
          const content =
            (await integration.transpileCSS?.(
              'base.css',
              integration.defaultCSS.content,
            )) ?? '';
          const filename = `base-${Bun.hash(content)}.css`;
          fs.writeFileSync(path.join(publicFolder, filename), content);
          cssFilePaths.unshift(filename);
        }

        if (IS_BUILD_PROCESS) {
          const endTime = Date.now();
          const ms = ((endTime - startTime) / 1000).toFixed(2);
          console.log(
            LOG_PREFIX.INFO,
            LOG_PREFIX.TICK,
            `CSS transpiled with ${integration.name} in ${ms}ms`,
          );
        }
      }
    }

    // Compression to gzip & brotli
    if (IS_PRODUCTION && CONFIG.assetCompression) {
      const start = Date.now();

      for (const file of cssFilePaths) {
        const buffer = fs.readFileSync(path.join(publicFolder, file));
        Bun.write(path.join(publicFolder, file + '.gz'), gzipSync(buffer as any) as any);
        Bun.write(
          path.join(publicFolder, file + '.br'),
          brotliCompressSync(buffer as any) as any,
        );
      }

      const ms = ((Date.now() - start) / 1000).toFixed(2);
      console.log(
        LOG_PREFIX.INFO,
        LOG_PREFIX.TICK,
        `CSS files compressed successfully in ${ms}ms`,
      );
    }

    // Write css-files.js
    fs.writeFileSync(
      path.join(BUILD_DIR, 'css-files.js'),
      'export default ' + JSON.stringify(cssFilePaths),
    );
  } catch (e: any) {
    logError({
      messages: ['Failed to handle CSS files', e.message],
      stack: e.stack,
    });
  }
}

async function moveCSSInsidePublic(buildDir: string) {
  const files = [];

  for await (const filename of cssGlob.scan(buildDir)) {
    const filePath = path.join(buildDir, filename);
    const hash = Bun.hash(await Bun.file(filePath).arrayBuffer());
    const newFilename = `style-${hash}.css`

    fs.renameSync(filePath, path.join(buildDir, 'public', newFilename));
    files.push(newFilename);
  }

  return files;
}

export function getCSSLoader(): { [x: string]: Loader } | undefined {
  const { CONFIG } =
  getConstants();
  const useExternalTranspiler = (CONFIG?.integrations ?? []).some(
    (integration) => integration.transpileCSS,
  );

  // Adding plain text loader for CSS files avoid the Bun CSS Parser for these files 
  // already handled by the external transpiler (Tailwind, PandaCSS, etc)
  if(useExternalTranspiler) {
    return {
      '.css': 'text',
      '.scss': 'text',
      '.sass': 'text',
      '.less': 'text',
    }
  }
}

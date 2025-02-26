import path from 'node:path';
import type { Loader } from 'bun';
import fs from 'node:fs';
import { getConstants } from '@/constants';
import { gzipSync, Glob } from 'bun';
import { brotliCompressSync } from 'node:zlib';

const cssGlob = new Glob('**/*.css');

export default async function handleCSSFiles() {
  const {
    BUILD_DIR,
    CONFIG,
    LOG_PREFIX,
    IS_BUILD_PROCESS,
    IS_PRODUCTION,
    SRC_DIR,
  } = getConstants();
  const publicFolder = path.join(BUILD_DIR, 'public');

  if (!fs.existsSync(publicFolder)) fs.mkdirSync(publicFolder);

  const cssFilePaths: string[] = await handleCSSInsidePublic(
    BUILD_DIR,
    publicFolder,
  );
  const integrations = (CONFIG?.integrations ?? []).filter(
    (integration) => integration.transpileCSS,
  );

  // Using CSS integrations
  if (integrations.length > 0) {
    // Use the "src" CSS files to transpile it with the integration parser
    // instead of the "build" because they are not transpiled by Bun CSS Parser
    const cssFilePathsFromSrc = await handleCSSInsidePublic(
      SRC_DIR,
      publicFolder,
    );
    for (const file of cssFilePathsFromSrc) {
      if (!cssFilePaths.includes(file)) cssFilePaths.push(file);
    }

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
      Bun.write(
        path.join(publicFolder, file + '.gz'),
        gzipSync(buffer as any) as any,
      );
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
}

async function handleCSSInsidePublic(dir: string, outDir: string) {
  const files = [];

  for await (const filename of cssGlob.scan(dir)) {
    const filePath = path.join(dir, filename);
    const hash = Bun.hash(await Bun.file(filePath).arrayBuffer());
    const newFilename = `style-${hash}.css`;

    fs.copyFileSync(filePath, path.join(outDir, newFilename));
    files.push(newFilename);
  }

  return files;
}

export function getCSSLoader(): { [x: string]: Loader } | undefined {
  const { CONFIG } = getConstants();
  const useExternalTranspiler = (CONFIG?.integrations ?? []).some(
    (integration) => integration.transpileCSS,
  );

  // Adding plain text loader for CSS files avoid the Bun CSS Parser for these files
  // already handled by the external transpiler (Tailwind, PandaCSS, etc)
  if (useExternalTranspiler) {
    return {
      '.css': 'text',
      '.scss': 'text',
      '.sass': 'text',
      '.less': 'text',
    };
  }
}

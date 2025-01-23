import path from 'node:path';
import fs from 'node:fs';
import { getConstants } from '@/constants';
import { logError } from '../log/log-build';
import { gzipSync, type BuildArtifact } from 'bun';
import { brotliCompressSync } from 'node:zlib';

export default async function handleCSSFiles(outputs: BuildArtifact[]) {
  try {
    const { BUILD_DIR, CONFIG, LOG_PREFIX, IS_BUILD_PROCESS, IS_PRODUCTION } =
      getConstants();
    const publicFolder = path.join(BUILD_DIR, 'public');
    const cssFiles = outputs.filter(
      (o) => o.kind === 'asset' && o.path.endsWith('.css'),
    );
    const cssFilePaths: string[] = [];
    const integrations = (CONFIG?.integrations ?? []).filter(
      (integration) => integration.transpileCSS,
    );

    if (!fs.existsSync(publicFolder)) fs.mkdirSync(publicFolder);

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

        for (const output of cssFiles) {
          const fileName = outputToFilename(output);
          const pathname = output.path;
          const rawContent = fs.readFileSync(pathname, 'utf-8');
          const content =
            (await integration.transpileCSS?.(pathname, rawContent)) ?? '';
          useDefault &&=
            integration.defaultCSS?.applyDefaultWhenEvery?.(rawContent) ?? true;
          fs.writeFileSync(path.join(publicFolder, fileName), content);
          cssFilePaths.push(fileName);
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

    // Without integrations
    else {
      for (const cssOutput of cssFiles) {
        const fileName = outputToFilename(cssOutput);
        fs.renameSync(cssOutput.path, path.join(publicFolder, fileName));
        cssFilePaths.push(fileName);
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

function outputToFilename(output: BuildArtifact) {
  return path.basename(output.path).replace('.css', `-${output.hash}.css`);
}

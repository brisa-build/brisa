import path from 'node:path';
import fs from 'node:fs';
import { getConstants } from '@/constants';

export default async function handleCSSFiles() {
  const { BUILD_DIR, CONFIG, LOG_PREFIX } = getConstants();
  const publicFolder = path.join(BUILD_DIR, 'public');
  const allFiles = fs.readdirSync(BUILD_DIR);
  const cssFilePaths: string[] = [];
  const integrations = (CONFIG?.integrations ?? []).filter(
    (integration) => integration.transpileCSS,
  );

  if (!fs.existsSync(publicFolder)) fs.mkdirSync(publicFolder);

  // Using CSS integrations
  if (integrations.length > 0) {
    const cssFiles = allFiles.filter((file) => file.endsWith('.css'));

    for (const integration of integrations) {
      const startTime = Date.now();
      console.log(LOG_PREFIX.INFO, `Transpiling CSS with ${integration.name}`);
      let useDefault = true;

      for (const file of cssFiles) {
        const pathname = path.join(BUILD_DIR, file);
        const content =
          (await integration.transpileCSS?.(
            pathname,
            fs.readFileSync(pathname, 'utf-8'),
          )) ?? '';
        useDefault &&=
          integration.defaultCSS?.applyDefaultWhenEvery?.(content) ?? true;
        fs.writeFileSync(path.join(publicFolder, file), content);
        cssFilePaths.push(file);
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

      const endTime = Date.now();
      const ms = ((endTime - startTime) / 1000).toFixed(2);
      console.log(
        LOG_PREFIX.INFO,
        LOG_PREFIX.TICK,
        `CSS transpiled with ${integration.name} in ${ms}ms`,
      );
    }
  }

  // Without integrations
  else {
    for (const file of allFiles) {
      if (!file.endsWith('.css')) continue;
      fs.renameSync(path.join(BUILD_DIR, file), path.join(publicFolder, file));
      cssFilePaths.push(file);
    }
  }

  // Write css-files.json
  fs.writeFileSync(
    path.join(BUILD_DIR, 'css-files.json'),
    JSON.stringify(cssFilePaths),
  );
}

import path from 'node:path';
import fs from 'node:fs';
import { getConstants } from '@/constants';
import compileAssets from '@/utils/compile-assets';
import compileFiles from '@/utils/compile-files';
import { logBuildError } from '@/utils/log/log-build';

export default async function compileAll() {
  await compileAssets();

  const { success, logs, pagesSize } = await compileFiles();

  if (!success) {
    logBuildError('Failed to compile pages', logs);
  }

  handleCSSFiles();

  return { success, logs, pagesSize };
}

function handleCSSFiles() {
  const { BUILD_DIR } = getConstants();
  const publicFolder = path.join(BUILD_DIR, 'public');
  const allFiles = fs.readdirSync(BUILD_DIR);
  const cssFilePaths: string[] = [];

  for (const file of allFiles) {
    if (!file.endsWith('.css')) continue;
    fs.renameSync(path.join(BUILD_DIR, file), path.join(publicFolder, file));
    cssFilePaths.push(file);
  }

  fs.writeFileSync(
    path.join(BUILD_DIR, 'css-files.json'),
    JSON.stringify(cssFilePaths),
  );
}

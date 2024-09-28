import path from 'node:path';
import fs from 'node:fs';
import { getConstants } from '@/constants';

export default function handleCSSFiles() {
  const { BUILD_DIR } = getConstants();
  const publicFolder = path.join(BUILD_DIR, 'public');
  const allFiles = fs.readdirSync(BUILD_DIR);
  const cssFilePaths: string[] = [];

  if (!fs.existsSync(publicFolder)) fs.mkdirSync(publicFolder);

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

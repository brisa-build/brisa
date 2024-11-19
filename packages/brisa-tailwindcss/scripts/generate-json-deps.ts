import fs from 'node:fs';
import path from 'node:path';
import packageJSON from '../package.json';

const TAILWIND_VERSION = packageJSON.devDependencies.tailwindcss;
const tempDir = path.join(import.meta.dirname, 'temp');

fs.mkdirSync(tempDir);
fs.writeFileSync(
  path.join(tempDir, 'package.json'),
  JSON.stringify({
    dependencies: {
      tailwindcss: TAILWIND_VERSION,
      '@tailwindcss/postcss': TAILWIND_VERSION,
    },
  }),
);

await Bun.$`cd ${tempDir} && bun i`.quiet();

const libs = fs
  .readdirSync(path.join(tempDir, 'node_modules'))
  .filter((lib) => !lib.startsWith('.'));

fs.writeFileSync(
  path.join(import.meta.dirname, '..', 'libs.json'),
  JSON.stringify(libs),
);
fs.rmSync(tempDir, { recursive: true });

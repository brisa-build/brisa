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

const nodeModules = path.join(tempDir, 'node_modules');
const lightningcssPackage = JSON.parse(
  fs.readFileSync(
    path.join(nodeModules, 'lightningcss', 'package.json'),
    'utf-8',
  ),
);
const libs = new Set(Object.keys(lightningcssPackage.optionalDependencies));

for (const lib of fs.readdirSync(nodeModules)) {
  if (lib.startsWith('.')) continue;
  libs.add(lib);
}

fs.writeFileSync(
  path.join(import.meta.dirname, '..', 'libs.json'),
  JSON.stringify([...libs]),
);
fs.rmSync(tempDir, { recursive: true });

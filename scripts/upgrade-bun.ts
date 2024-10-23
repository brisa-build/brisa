import fs from 'node:fs';
import { $ } from 'bun';
import { join } from 'node:path';
import packageJSON from '../package.json';
import brisaPackageJSON from '../packages/brisa/package.json';
import createBrisaPackageJSON from '../packages/create-brisa/package.json';
import wwwwPackageJSON from '../packages/www/package.json';
import adapterVercelPackageJSON from '../packages/adapter-vercel/package.json';
import brisaTailwindCSSPackageJSON from '../packages/brisa-tailwindcss/package.json';
import brisaPandaCSSPackageJSON from '../packages/brisa-pandacss/package.json';

const oldVersion = packageJSON.packageManager.replace('bun@', '');

await $`bun upgrade`;

const version = (await $`bun --version`.text()).trim();

packageJSON.packageManager =
  brisaPackageJSON.packageManager =
  createBrisaPackageJSON.packageManager =
  wwwwPackageJSON.packageManager =
  adapterVercelPackageJSON.packageManager =
  brisaTailwindCSSPackageJSON.packageManager =
    `bun@${version}`;
brisaPandaCSSPackageJSON.packageManager = `bun@${version}`;
packageJSON.engines =
  brisaPackageJSON.engines =
  createBrisaPackageJSON.engines =
  wwwwPackageJSON.engines =
  adapterVercelPackageJSON.engines =
  brisaTailwindCSSPackageJSON.engines =
    {
      bun: `>= ${version}`,
      npm: '>= 10.0.0',
      yarn: '>= 3.0.0',
      pnpm: '>= 9.8.0',
    };
brisaPandaCSSPackageJSON.engines = {
  bun: `>= ${version}`,
  npm: '>= 10.0.0',
  yarn: '>= 3.0.0',
  pnpm: '>= 9.8.0',
};
// Update all the package.json files
fs.writeFileSync(
  join(import.meta.dir, '..', 'package.json'),
  JSON.stringify(packageJSON, null, 2),
);
fs.writeFileSync(
  join(import.meta.dir, '..', 'packages', 'brisa', 'package.json'),
  JSON.stringify(brisaPackageJSON, null, 2),
);
fs.writeFileSync(
  join(import.meta.dir, '..', 'packages', 'create-brisa', 'package.json'),
  JSON.stringify(createBrisaPackageJSON, null, 2),
);
fs.writeFileSync(
  join(import.meta.dir, '..', 'packages', 'www', 'package.json'),
  JSON.stringify(wwwwPackageJSON, null, 2),
);
fs.writeFileSync(
  join(import.meta.dir, '..', 'packages', 'adapter-vercel', 'package.json'),
  JSON.stringify(adapterVercelPackageJSON, null, 2),
);
fs.writeFileSync(
  join(import.meta.dir, '..', 'packages', 'brisa-tailwindcss', 'package.json'),
  JSON.stringify(brisaTailwindCSSPackageJSON, null, 2),
);
fs.writeFileSync(
  join(import.meta.dir, '..', 'packages', 'brisa-pandacss', 'package.json'),
  JSON.stringify(brisaPandaCSSPackageJSON, null, 2),
);

// Update the test.yml file
const pipelinePath = join(
  import.meta.dir,
  '..',
  '.github',
  'workflows',
  'test.yml',
);
const yml = fs
  .readFileSync(pipelinePath)
  .toString()
  .replaceAll(`bun-version: ${oldVersion}`, `bun-version: ${version}`);
fs.writeFileSync(pipelinePath, yml);

// Update docs
const dockerMdPath = join(
  import.meta.dir,
  '..',
  'docs',
  'building-your-application',
  'deploying',
  'docker.md',
);
const quickStartMdPath = join(
  import.meta.dir,
  '..',
  'docs',
  'getting-started',
  'quick-start.md',
);
const dockerMd = fs
  .readFileSync(dockerMdPath)
  .toString()
  .replace(`BUN_VERSION=${oldVersion}`, `BUN_VERSION=${version}`);
const quickStartMd = fs
  .readFileSync(quickStartMdPath)
  .toString()
  .replace(`text="${oldVersion}"`, `text="${version}"`);

fs.writeFileSync(dockerMdPath, dockerMd);
fs.writeFileSync(quickStartMdPath, quickStartMd);

console.log('Updated to version: ', version, '🎉');

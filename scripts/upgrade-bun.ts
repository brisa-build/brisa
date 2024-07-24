import fs from 'node:fs';
import { $ } from 'bun';
import { join } from 'node:path';
import packageJSON from '../package.json';
import brisaPackageJSON from '../packages/brisa/package.json';
import createBrisaPackageJSON from '../packages/create-brisa/package.json';
import docsPackageJSON from '../packages/docs/package.json';
import wwwwPackageJSON from '../packages/www/package.json';

const oldVersion = packageJSON.packageManager.replace('bun@', '');

await $`bun upgrade`;

const version = (await $`bun --version`.text()).trim();

packageJSON.packageManager =
  brisaPackageJSON.packageManager =
  createBrisaPackageJSON.packageManager =
  docsPackageJSON.packageManager =
    `bun@${version}`;
packageJSON.engines =
  brisaPackageJSON.engines =
  createBrisaPackageJSON.engines =
  docsPackageJSON.engines =
    {
      bun: `>= ${version}`,
      npm: 'please-use-bun',
      yarn: 'please-use-bun',
      pnpm: 'please-use-bun',
    };
// Update all the package.json files
fs.writeFileSync(join(import.meta.dir, '..', 'package.json'), JSON.stringify(packageJSON, null, 2));
fs.writeFileSync(
  join(import.meta.dir, '..', 'packages', 'brisa', 'package.json'),
  JSON.stringify(brisaPackageJSON, null, 2),
);
fs.writeFileSync(
  join(import.meta.dir, '..', 'packages', 'create-brisa', 'package.json'),
  JSON.stringify(createBrisaPackageJSON, null, 2),
);
fs.writeFileSync(
  join(import.meta.dir, '..', 'packages', 'docs', 'package.json'),
  JSON.stringify(docsPackageJSON, null, 2),
);
fs.writeFileSync(
  join(import.meta.dir, '..', 'packages', 'www', 'package.json'),
  JSON.stringify(wwwwPackageJSON, null, 2),
);

// Update the test.yml file
const pipelinePath = join(import.meta.dir, '..', '.github', 'workflows', 'test.yml');
const yml = fs
  .readFileSync(pipelinePath)
  .toString()
  .replace(`bun-version: ${oldVersion}`, `bun-version: ${version}`);
fs.writeFileSync(pipelinePath, yml);

// Update docs
const dockerMdPath = join(
  import.meta.dir,
  '..',
  'packages',
  'docs',
  'building-your-application',
  'deploying',
  'docker.md',
);
const quickStartMdPath = join(
  import.meta.dir,
  '..',
  'packages',
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

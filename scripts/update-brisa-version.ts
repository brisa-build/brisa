import fs from 'node:fs';
import { join } from 'node:path';
import packageJSON from '../package.json';
import brisaPackageJSON from '../packages/brisa/package.json';
import createBrisaPackageJSON from '../packages/create-brisa/package.json';
import wwwPackageJSON from '../packages/www/package.json';
import adapterVercelPackageJSON from '../packages/adapter-vercel/package.json';
import brisaTailwindCSSPackageJSON from '../packages/brisa-tailwindcss/package.json';

function updatePackageJSONOfExamplesToLatestVersion(version: string) {
  const EXAMPLES_FOLDER = join(import.meta.dir, '..', 'examples');
  const examples = fs.readdirSync(EXAMPLES_FOLDER);

  examples.forEach((example) => {
    const examplePath = join(EXAMPLES_FOLDER, example);
    const examplePackageJSONPath = join(examplePath, 'package.json');

    if (fs.existsSync(examplePackageJSONPath)) {
      const examplePackageJSON = JSON.parse(
        fs.readFileSync(examplePackageJSONPath).toString(),
      );

      examplePackageJSON.dependencies.brisa = version;
      if (examplePackageJSON.dependencies['brisa-tailwindcss']) {
        examplePackageJSON.dependencies['brisa-tailwindcss'] = version;
      }

      fs.writeFileSync(
        examplePackageJSONPath,
        JSON.stringify(examplePackageJSON, null, 2),
      );
    }
  });
}

const currentVersion = packageJSON.version;
const version = prompt(
  `Introduce the new version of Brisa (now ${currentVersion}): `,
);

if (
  !version ||
  currentVersion === version ||
  !Bun.semver.satisfies(version, '>= 0.0.0') ||
  [currentVersion, version].sort(Bun.semver.order)[0] !== currentVersion
) {
  console.error('Invalid version, must be greater than the current one.');
  process.exit(1);
}

// Examples package.json
updatePackageJSONOfExamplesToLatestVersion(version);

// Root monorepo package.json
packageJSON.version = version;
fs.writeFileSync(
  join(import.meta.dir, '..', 'package.json'),
  JSON.stringify(packageJSON, null, 2),
);

// Brisa package.json
brisaPackageJSON.version = version;
fs.writeFileSync(
  join(import.meta.dir, '..', 'packages', 'brisa', 'package.json'),
  JSON.stringify(brisaPackageJSON, null, 2),
);

// Create Brisa package.json
createBrisaPackageJSON.version = version;
fs.writeFileSync(
  join(import.meta.dir, '..', 'packages', 'create-brisa', 'package.json'),
  JSON.stringify(createBrisaPackageJSON, null, 2),
);

// WWW package.json
wwwPackageJSON.version = version;
fs.writeFileSync(
  join(import.meta.dir, '..', 'packages', 'www', 'package.json'),
  JSON.stringify(wwwPackageJSON, null, 2),
);

// adapterVercel package.json
adapterVercelPackageJSON.version = version;
fs.writeFileSync(
  join(import.meta.dir, '..', 'packages', 'adapter-vercel', 'package.json'),
  JSON.stringify(adapterVercelPackageJSON, null, 2),
);

// brisa-tailwindcss package.json
brisaTailwindCSSPackageJSON.version = version;
fs.writeFileSync(
  join(import.meta.dir, '..', 'packages', 'brisa-tailwindcss', 'package.json'),
  JSON.stringify(brisaTailwindCSSPackageJSON, null, 2),
);

// Update Brisa CLI version
const createBrisaCLIPath = join(
  import.meta.dir,
  '..',
  'packages',
  'create-brisa',
  'create-brisa.cjs',
);
const createBrisaCLI = fs
  .readFileSync(createBrisaCLIPath)
  .toString()
  .replace(
    `BRISA_VERSION = "${currentVersion}";`,
    `BRISA_VERSION = "${version}";`,
  );

fs.writeFileSync(createBrisaCLIPath, createBrisaCLI);

console.log('Version updated successfully!');

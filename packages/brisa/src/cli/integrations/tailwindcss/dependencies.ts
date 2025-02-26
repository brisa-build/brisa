import { join } from 'path';

const brisaTailwindCSSPackageJSONPath = join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'brisa-tailwindcss',
  'package.json',
);

export async function getBrisaTailwindCSSDependencies() {
  return import(brisaTailwindCSSPackageJSONPath).then((module) => ({
    [module.name]: module.version,
    ...module.dependencies,
  }));
}

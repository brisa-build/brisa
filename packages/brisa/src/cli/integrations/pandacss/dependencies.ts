import { join } from 'path';

const brisaPandaCSSPackageJSONPath = join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'brisa-pandacss',
  'package.json',
);

export async function getBrisaPandaCSSDependencies() {
  return import(brisaPandaCSSPackageJSONPath).then((module) => ({
    [module.name]: module.version,
    ...module.dependencies,
  })); 
}
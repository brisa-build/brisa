import fs from 'node:fs';
import path from 'node:path';
import { getConstants } from '@/constants';

export function createDenoJSON() {
  const { BUILD_DIR } = getConstants();
  const denoJSON = getDenoJSON();
  fs.writeFileSync(
    path.join(BUILD_DIR, 'deno.json'),
    JSON.stringify(denoJSON, null, 2),
  );
}

function getDenoJSON() {
  const { ROOT_DIR, SRC_DIR } = getConstants();
  const defaultDenoJSON = {
    imports: {
      'fs/promises': 'node:fs/promises',
      path: 'node:path',
    },
    permissions: {
      read: true,
      write: true,
      run: 'inherit',
    },
  };

  if (fs.existsSync(path.join(ROOT_DIR, 'deno.json'))) {
    const denoJSON = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'deno.json'), 'utf-8'),
    );
    return {
      ...denoJSON,
      imports: {
        ...defaultDenoJSON.imports,
        ...denoJSON.imports,
      },
      permissions: {
        ...defaultDenoJSON.permissions,
        ...denoJSON.permissions,
      },
    };
  }

  if (fs.existsSync(path.join(SRC_DIR, 'deno.json'))) {
    const denoJSON = JSON.parse(
      fs.readFileSync(path.join(SRC_DIR, 'deno.json'), 'utf-8'),
    );
    return {
      ...denoJSON,
      imports: {
        ...defaultDenoJSON.imports,
        ...denoJSON.imports,
      },
      permissions: {
        ...defaultDenoJSON.permissions,
        ...denoJSON.permissions,
      },
    };
  }

  return defaultDenoJSON;
}

import { getBrisaTailwindCSSDependencies } from './dependencies' with {
  type: 'macro',
};
import cp from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { getConstants } from '@/constants';
import getImportableFilepath from '@/utils/get-importable-filepath';
import { boldLog } from '@/utils/log/log-color';

const defaultTailwindCSSConfig = `import type { Configuration } from "brisa";
import tailwindcss from 'brisa-tailwindcss';

export default {
  integrations: [tailwindcss()],
} as Configuration;

`;

export default async function integrateTailwindCSS() {
  const { ROOT_DIR, LOG_PREFIX } = getConstants();
  const brisaConfig = getImportableFilepath('brisa.config', ROOT_DIR);
  const dependencies = Object.entries(getBrisaTailwindCSSDependencies());
  console.log(LOG_PREFIX.WAIT, 'Adding TailwindCSS dependencies...');
  cp.spawnSync(
    'bun',
    ['add', ...dependencies.map(([name, version]) => `${name}@${version}`)],
    {
      stdio: 'inherit',
    },
  );

  console.log(
    LOG_PREFIX.INFO,
    LOG_PREFIX.TICK,
    'TailwindCSS dependencies added!',
  );

  if (!brisaConfig) {
    fs.writeFileSync(
      path.join(ROOT_DIR, 'brisa.config.ts'),
      defaultTailwindCSSConfig,
    );
    console.log(
      LOG_PREFIX.INFO,
      LOG_PREFIX.TICK,
      'TailwindCSS configuration added!',
    );
  } else {
    console.log(
      LOG_PREFIX.WARN,
      `Almost there! We detected an existing ${boldLog('brisa.config.ts')} file.`,
    );
    console.log(
      LOG_PREFIX.WARN,
      'Please add the following configuration to integrate TailwindCSS:',
    );
    console.log(LOG_PREFIX.WARN);
    defaultTailwindCSSConfig
      .split('\n')
      .forEach((line) => console.log(LOG_PREFIX.WARN, boldLog(line)));
  }
}

if (import.meta.main) {
  await integrateTailwindCSS();
  process.exit(0);
}

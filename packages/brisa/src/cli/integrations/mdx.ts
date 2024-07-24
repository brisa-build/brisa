import { getConstants } from '@/constants';
import path from 'node:path';
import fs from 'node:fs';

const ALLOWED_CONFIG_FORMATS = ['.ts', '.tsx', '.js', '.jsx'];

export default function integrateMDX() {
  const { ROOT_DIR } = getConstants();

  // brisa.config.ts check...
  const existBrisaConfig = ALLOWED_CONFIG_FORMATS.some((format) =>
    fs.existsSync(path.join(ROOT_DIR, `brisa.config${format}`)),
  );

  if (!existBrisaConfig) {
    fs.writeFileSync(path.join(ROOT_DIR, 'brisa.config.ts'), defaultMDXConfig);
    return;
  }

  console.log('TODO: Integrate MDX into existing brisa.config.ts');
}

const defaultMDXConfig = `import mdx from '@mdx-js/esbuild';
import type { Configuration } from "brisa";
import type { BunPlugin } from 'bun';

const mdxPlugin = mdx({ jsxImportSource: "brisa" }) as unknown as BunPlugin;

export default {
  extendPlugins: (brisaPlugins) => [mdxPlugin, ...brisaPlugins],
} satisfies Configuration;
`;

if (import.meta.main) {
  integrateMDX();
  console.log('MDX integration completed!');
  process.exit(0);
}

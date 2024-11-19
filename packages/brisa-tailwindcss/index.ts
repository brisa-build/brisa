import tailwindcss from '@tailwindcss/postcss';
import postcss from 'postcss';
import fs from 'node:fs/promises';
import path from 'node:path';
import libs from './libs.json';

// Note: is not bundled here to avoid issues with lightningcss
export default function brisaTailwindcss() {
  return {
    name: 'brisa-tailwindcss',
    async transpileCSS(pathname: string, content: string) {
      const transpiledContent = await postcss([tailwindcss]).process(content, {
        from: pathname,
      });
      // Add :host to all :root selectors to support shadow DOM
      return transpiledContent.css.replaceAll(':root', ':root, :host');
    },
    defaultCSS: {
      content: `
        @import "tailwindcss/theme" layer(theme);
        @import "tailwindcss/preflight" layer(base);
        @import "tailwindcss/utilities" layer(utilities);
      `,
      applyDefaultWhenEvery: (content: string) => !content.includes('tailwind'),
    },
    // Tailwind has a subdependency called lightwindcss, which cannot be included in the bundle
    // https://github.com/parcel-bundler/lightningcss/issues/701
    // then as a solution is to put it as "external" so the build works correctly. However, for the standalone
    // build to continue being standalone, it needs this dependency along with all its subdependencies to
    // work correctly. As a solution, we install tailwind in the build folder and in this way the problem is solved.
    // Issue: https://github.com/brisa-build/brisa/issues/637
    async afterBuild({ BUILD_DIR, LOG_PREFIX }) {
      const start = Date.now();
      const destNodeModules = path.join(BUILD_DIR, 'node_modules');
      const nodeModules = Bun.resolveSync('brisa', BUILD_DIR).split('brisa')[0];

      console.log(LOG_PREFIX.INFO, '');
      console.log(
        LOG_PREFIX.WAIT,
        ' Embedding TailwindCSS in the build folder...',
      );

      await Promise.all(
        libs.map(async (lib) => {
          const from = path.join(nodeModules, lib);
          const to = path.join(destNodeModules, lib);

          if (await fs.exists(from)) {
            return fs.cp(from, to, { recursive: true });
          }
        }),
      );

      const milliseconds = Date.now() - start;
      console.log(
        LOG_PREFIX.INFO,
        LOG_PREFIX.TICK,
        `TailwindCSS embedded in ${milliseconds}ms`,
      );
    },
  };
}

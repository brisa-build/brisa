import path from 'node:path';

const src = path.join(import.meta.dirname, '..', 'src');
const outdir = path.join(import.meta.dirname, '..', 'compiler');

await Bun.build({
  outdir,
  entrypoints: [path.join(src, 'core', 'compiler', 'index.ts')],
  minify: true,
  // Remove all server dependencies
  plugins: [
    {
      name: 'remove-node-deps',
      setup(build) {
        build.onResolve(
          { filter: /^(node:|@\/(utils\/wyhash|constants))/ },
          (args) => {
            return {
              ...args,
              path: path
                .resolve(path.join(src, 'empty-server.ts'))
                // Workaround to work in Windows
                // https://github.com/oven-sh/bun/issues/13897
                .replaceAll('\\', '/'),
            };
          },
        );
      },
    },
  ],
}).catch((e) => {
  console.error(e);
  process.exit(1);
});

import path from 'node:path';

// Skip in Windows for now for a Bug in Bun.build and absolute paths
// inside onResolve. TODO: Change it when this issue is fixed
// https://github.com/oven-sh/bun/issues/13897
if (process.platform === 'win32') {
  process.exit(0);
}

const src = path.join(import.meta.dirname, '..', 'src');
const outdir = path.join(import.meta.dirname, '..', 'compiler');

const output = await Bun.build({
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
              path: path.resolve(path.join(src, 'empty-server.ts')),
            };
          },
        );
      },
    },
  ],
});

if (!output.success) {
  console.error(output.logs);
  process.exit(1);
}

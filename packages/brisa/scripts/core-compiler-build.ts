import path from 'node:path';

const src = path.join(import.meta.dirname, '..', 'src');
const outdir = path.join(import.meta.dirname, '..', 'compiler');

const output = await Bun.build({
  outdir,
  entrypoints: [path.join(src, 'core', 'compiler', 'index.ts')],
  minify: true,
  plugins: [
    {
      name: 'remove-node-deps',
      setup(build) {
        build.onResolve({ filter: /^node:/ }, (args) => {
          return {
            ...args,
            path: path.resolve(path.join(src, 'empty-node.ts')),
          };
        });
        build.onResolve({ filter: /^@\/utils\/wyhash/ }, (args) => {
          return {
            ...args,
            path: path.resolve(path.join(src, 'empty-node.ts')),
          };
        });
        build.onResolve({ filter: /^@\/constants/ }, (args) => {
          return {
            ...args,
            path: path.resolve(path.join(src, 'empty-node.ts')),
          };
        });
      },
    },
  ],
});

if (!output.success) {
  console.error(output.logs);
  process.exit(1);
}

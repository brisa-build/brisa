// Standalone build script spawned from inject-client.ts macro
// This avoids calling Bun.build inside a macro (deadlock in Bun >= 1.2)
import path from 'node:path';
import clientBuildPlugin from '@/utils/client-build-plugin';

const pathname = path.join(import.meta.dir, 'client.tsx');
const internalComponentId = '__BRISA_CLIENT__contextProvider';

const { success, outputs } = await Bun.build({
  throw: false,
  entrypoints: [pathname],
  target: 'browser',
  external: ['brisa'],
  plugins: [
    {
      name: 'context-provider-transformer',
      setup(build) {
        build.onLoad({ filter: /.*/ }, async ({ path, loader }) => ({
          contents: clientBuildPlugin(
            await Bun.readableStreamToText(Bun.file(path).stream()),
            internalComponentId,
          ),
          loader,
        }));
      },
    },
  ],
});

if (success && outputs?.[0]) {
  process.stdout.write(await outputs[0].text());
}

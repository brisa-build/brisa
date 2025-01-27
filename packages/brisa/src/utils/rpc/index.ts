import path from 'node:path';
import constants from '@/constants';
import { logBuildError } from '@/utils/log/log-build';

// Should be used via macro
export async function injectRPCCode() {
  return await buildRPC('rpc.ts');
}

// Should be used via macro
export async function injectRPCCodeForStaticApp() {
  return await buildRPC('rpc.ts', true);
}

// Should be used via macro
export async function injectRPCLazyCode() {
  return await buildRPC(path.join('resolve-rpc', 'index.ts'));
}

async function buildRPC(file: string, isStatic = false) {
  const { success, logs, outputs } = await Bun.build({
    // TODO: adapt to Bun > 1.2 (for now this is to force the old behavior)
    throw: false,
    entrypoints: [path.join(import.meta.dir, file)],
    target: 'browser',
    minify: true,
    define: {
      __RPC_LAZY_FILE__: `'/_brisa/pages/_rpc-lazy-${constants.VERSION}.js'`,
      __IS_STATIC__: isStatic.toString(),
    },
  });

  if (!success) {
    logBuildError('Failed to compile RPC code', logs);
  }

  const code = (await outputs?.[0]?.text?.()) ?? '';

  return `(()=>{${code}})()`;
}

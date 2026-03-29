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
  const entrypoint = path.join(import.meta.dir, file);
  const result = Bun.spawnSync([
    'bun',
    'build',
    entrypoint,
    '--target',
    'browser',
    '--minify',
    '--define',
    `__RPC_LAZY_FILE__='/_brisa/pages/_rpc-lazy-${constants.VERSION}.js'`,
    '--define',
    `__IS_STATIC__=${isStatic.toString()}`,
  ]);

  if (result.exitCode !== 0) {
    logBuildError('Failed to compile RPC code', []);
  }

  const code = result.stdout.toString();

  return `(()=>{${code}})()`;
}

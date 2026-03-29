import { logBuildError } from '@/utils/log/log-build';
import path from 'node:path';

// Should be used via macro
export async function injectUnsuspenseCode() {
  const entrypoint = path.join(import.meta.dir, 'unsuspense.ts');
  const result = Bun.spawnSync([
    'bun',
    'build',
    entrypoint,
    '--target',
    'browser',
    '--minify',
  ]);

  if (result.exitCode !== 0) {
    logBuildError('Failed to compile unsuspense code', []);
  }

  return result.stdout.toString();
}

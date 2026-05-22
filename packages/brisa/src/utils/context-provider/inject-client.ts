import path from 'node:path';
import { logBuildError } from '@/utils/log/log-build';

// Should be used via macro
export async function injectClientContextProviderCode() {
  const scriptPath = path.join(import.meta.dir, 'build-inject-client.ts');
  const result = Bun.spawnSync(['bun', 'run', scriptPath]);

  if (result.exitCode !== 0) {
    logBuildError('Failed to compile client context provider', []);
  }

  return result.stdout.toString();
}

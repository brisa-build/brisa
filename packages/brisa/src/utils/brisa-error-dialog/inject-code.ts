import path from 'node:path';
import { logBuildError } from '@/utils/log/log-build';

// Should be used via macro
export async function injectBrisaDialogErrorCode() {
  const scriptPath = path.join(import.meta.dir, 'build-inject-code.ts');
  const result = Bun.spawnSync(['bun', 'run', scriptPath]);

  if (result.exitCode !== 0) {
    logBuildError('Failed to use brisa dialog error in development', []);
  }

  return result.stdout.toString();
}

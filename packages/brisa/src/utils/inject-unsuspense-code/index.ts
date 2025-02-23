import { logBuildError } from '@/utils/log/log-build';
import path from 'node:path';

// Should be used via macro
export async function injectUnsuspenseCode() {
  const { success, logs, outputs } = await Bun.build({
    // TODO: adapt to Bun > 1.2 (for now this is to force the old behavior)
    throw: false,
    entrypoints: [path.join(import.meta.dir, 'unsuspense.ts')],
    target: 'browser',
    minify: true,
  });

  if (!success) {
    logBuildError('Failed to compile unsuspense code', logs);
  }

  return (await outputs?.[0]?.text?.()) ?? '';
}

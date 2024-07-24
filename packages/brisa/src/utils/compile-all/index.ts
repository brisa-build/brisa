import compileAssets from '@/utils/compile-assets';
import compileFiles from '@/utils/compile-files';
import { logBuildError } from '@/utils/log/log-build';

export default async function compileAll() {
  await compileAssets();

  const { success, logs, pagesSize } = await compileFiles();

  if (!success) {
    logBuildError('Failed to compile pages', logs);
  }

  return { success, logs, pagesSize };
}

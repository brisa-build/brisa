import compileAssets from '@/utils/compile-assets';
import compileFiles from '@/utils/compile-files';
import { logBuildError } from '@/utils/log/log-build';
import handleCSSFiles from '@/utils/handle-css-files';

export default async function compileAll() {
  await compileAssets();

  const { success, logs, pagesSize } = await compileFiles();

  if (!success) {
    logBuildError('Failed to compile pages', logs);
  }

  handleCSSFiles();

  return { success, logs, pagesSize };
}

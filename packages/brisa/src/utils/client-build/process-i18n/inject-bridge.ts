import { logBuildError } from '@/utils/log/log-build';
import { join } from 'node:path';

type I18nBridgeConfig = {
  usei18nKeysLogic?: boolean;
  useFormatter?: boolean;
};

export async function build(
  { usei18nKeysLogic = false, useFormatter = false }: I18nBridgeConfig = {
    usei18nKeysLogic: false,
    useFormatter: false,
  },
) {
  const scriptPath = join(import.meta.dir, 'build-inject-bridge.ts');
  const result = Bun.spawnSync([
    'bun',
    'run',
    scriptPath,
    usei18nKeysLogic.toString(),
    useFormatter.toString(),
  ]);

  if (result.exitCode !== 0) {
    logBuildError('Failed to integrate i18n core', []);
  }

  return result.stdout.toString();
}

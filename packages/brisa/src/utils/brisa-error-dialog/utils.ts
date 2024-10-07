import { getConstants } from '@/constants';
import { logWarning } from '../log/log-build';

export function getFilterDevRuntimeErrors() {
  const { CONFIG } = getConstants();
  const filterType = typeof CONFIG.filterRuntimeDevErrors;

  if (filterType === 'function') {
    return CONFIG.filterRuntimeDevErrors!.toString();
  }

  if (filterType !== 'undefined') {
    logWarning(
      ['CONFIG.filterRuntimeDevErrors should be a function'],
      'Docs: https://brisa.build/building-your-application/configuring/filter-runtime-dev-errors',
    );
  }

  return '() => true';
}

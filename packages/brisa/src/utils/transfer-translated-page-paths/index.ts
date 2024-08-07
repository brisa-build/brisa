import type { i18nPages } from '@/types';

export default function transferTranslatedPagePaths(pages?: i18nPages) {
  if (!pages) return;

  const transferToClient = pages?.config?.transferToClient;

  if (transferToClient === true) {
    return Object.fromEntries(
      Object.entries(pages).filter(([path]) => path !== 'config'),
    );
  }

  if (Array.isArray(transferToClient) && transferToClient.length > 0) {
    const paths = new Set(transferToClient);

    return Object.fromEntries(
      Object.entries(pages).filter(
        ([path]: any) => paths.has(path) && path !== 'config',
      ),
    );
  }
}

import fs from 'node:fs';
import path from 'node:path';
import { getConstants } from '@/constants';
import type { RequestContext } from '@/types';

export default function isAssetRequest(request: RequestContext) {
  const { ASSETS_DIR } = getConstants();
  const url = new URL(request.finalURL);
  const assetPath = path.join(ASSETS_DIR, url.pathname);
  const isHome = url.pathname === '/';

  return !isHome && fs.existsSync(assetPath);
}

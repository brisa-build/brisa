import { getConstants } from '@/constants';
import type { RequestContext } from '@/types';
import { redirect } from '@/utils/redirect';

export default function redirectTrailingSlash(
  request: RequestContext,
): Response | undefined {
  const { CONFIG } = getConstants();
  const { trailingSlash } = CONFIG;
  const url = new URL(request.finalURL);
  const { pathname } = url;
  const isHome = pathname === '/';

  if (trailingSlash && !pathname.endsWith('/') && !isHome) {
    return redirect(newURL(pathname + '/', url).toString());
  }

  if (!trailingSlash && pathname.endsWith('/') && !isHome) {
    return redirect(newURL(pathname.slice(0, -1), url).toString());
  }
}

function newURL(pathname: string, url: URL) {
  const newUrl = new URL(pathname, url);
  newUrl.search = url.search;
  newUrl.hash = url.hash;
  return newUrl;
}

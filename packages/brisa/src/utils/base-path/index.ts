import { getConstants } from '@/constants';

export function addBasePathToStringURL(url: string) {
  return processURLBasePath(url, (pathname, basePath) => `${basePath}${pathname}`);
}

export function removeBasePathFromStringURL(url: string) {
  return processURLBasePath(url, (pathname, basePath) => pathname.replace(basePath, ''));
}

function processURLBasePath(url: string, operate: (pathname: string, basePath: string) => string) {
  const { CONFIG } = getConstants();
  const basePath = CONFIG.basePath || '';
  let finalUrl;

  if (!basePath) return url;

  if (URL.canParse(url)) {
    const urlInstance = new URL(url);
    urlInstance.pathname = operate(urlInstance.pathname, basePath);
    finalUrl = urlInstance.toString();
  } else {
    finalUrl = operate(url, basePath);
  }

  // Remove trailing slash if the original url doesn't have it
  if (!url.endsWith('/') && finalUrl.endsWith('/')) {
    return finalUrl.slice(0, -1);
  }

  return finalUrl;
}

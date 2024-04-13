import { getConstants } from "@/constants";

export function addBasePathToStringURL(url: string) {
  const { CONFIG } = getConstants();
  const basePath = CONFIG.basePath || "";

  return processURL(url, (pathname) => `${basePath}${pathname}`);
}

export function removeBasePathFromStringURL(url: string) {
  const { CONFIG } = getConstants();
  const basePath = CONFIG.basePath || "";

  return processURL(url, (pathname) => pathname.replace(basePath, ""));
}

function processURL(url: string, operate: (pathname: string) => string) {
  let finalUrl;

  if (URL.canParse(url)) {
    const urlInstance = new URL(url);
    urlInstance.pathname = operate(urlInstance.pathname);
    finalUrl = urlInstance.toString();
  } else {
    finalUrl = operate(url);
  }

  // Remove trailing slash if the original url doesn't have it
  if (!url.endsWith("/") && finalUrl.endsWith("/")) {
    return finalUrl.slice(0, -1);
  }

  return finalUrl;
}

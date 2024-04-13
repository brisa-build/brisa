import { getConstants } from "@/constants";

export function addBasePathToStringURL(url: string) {
  const { CONFIG } = getConstants();
  const basePath = CONFIG.basePath || "";
  let finalUrl;

  if (URL.canParse(url)) {
    const urlInstance = new URL(url);
    urlInstance.pathname = basePath + urlInstance.pathname;
    finalUrl = urlInstance.toString();
  } else {
    finalUrl = basePath + url;
  }

  // Remove trailing slash if the original url doesn't have it
  if (!url.endsWith("/") && finalUrl.endsWith("/")) {
    return finalUrl.slice(0, -1);
  }

  return finalUrl;
}

export function removeBasePathFromStringURL(url: string) {
  const { CONFIG } = getConstants();
  const basePath = CONFIG.basePath || "";
  let finalUrl;

  if (URL.canParse(url)) {
    const urlInstance = new URL(url);
    urlInstance.pathname = urlInstance.pathname.replace(basePath, "");
    finalUrl = urlInstance.toString();
  } else {
    finalUrl = url.replace(basePath, "");
  }

  // Remove trailing slash if the original url doesn't have it
  if (!url.endsWith("/") && finalUrl.endsWith("/")) {
    return finalUrl.slice(0, -1);
  }

  return finalUrl;
}

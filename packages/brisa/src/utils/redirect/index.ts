import type { RequestContext } from "@/types";
import extendRequestContext from "@/utils/extend-request-context";
import isAssetRequest from "@/utils/is-asset-request";
import handleI18n from "@/utils/handle-i18n";
import redirectTrailingSlash from "@/utils/redirect-trailing-slash";
import { getConstants } from "@/constants";

export function redirect(url: string, status = 301) {
  return new Response(null, {
    status,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      expires: "-1",
      pragma: "no-cache",
      location: addBasePathToStringURL(url),
      vary: "Accept-Language",
    },
  });
}

export function redirectFromUnnormalizedURL(
  url: URL,
  currentRequest: RequestContext,
) {
  if (url.origin !== new URL(currentRequest.url).origin) {
    return redirect(url.toString(), 307);
  }

  const req = extendRequestContext({ originalRequest: new Request(url) });
  const isAnAsset = isAssetRequest(req);
  const i18nRes = isAnAsset ? {} : handleI18n(req);
  const isAnAction =
    currentRequest.method === "POST" && currentRequest.headers.has("x-action");

  if (i18nRes.response) return i18nRes.response;

  if (!isAnAsset && !isAnAction) {
    const res = redirectTrailingSlash(req);

    if (res) return res;
  }

  return redirect(url.toString());
}

function addBasePathToStringURL(url: string) {
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

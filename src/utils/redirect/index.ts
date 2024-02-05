import type { RequestContext } from "@/types";
import extendRequestContext from "@/utils/extend-request-context";
import isAssetRequest from "../is-asset-request";
import handleI18n from "../handle-i18n";
import redirectTrailingSlash from "../redirect-trailing-slash";

export function redirect(url: string, status = 301) {
  return new Response(null, {
    status,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      expires: "-1",
      pragma: "no-cache",
      location: url,
      vary: "Accept-Language",
    },
  });
}

export function redirectFromUnnormalizedURL(
  url: URL,
  currentRequest: RequestContext,
) {
  if (url.origin !== new URL(currentRequest.url).origin) {
    return redirect(url.toString());
  }

  const req = extendRequestContext({ originalRequest: new Request(url) });
  const isAnAsset = isAssetRequest(req);
  const i18nRes = isAnAsset ? {} : handleI18n(req);

  if (i18nRes.response) {
    return i18nRes.response;
  }

  if (!isAnAsset) {
    const res = redirectTrailingSlash(req);
    if (res) return res;
  }

  return redirect(url.toString());
}

import getConstants from "@/constants";
import type { RequestContext } from "@/types";

export default function redirectTrailingSlash(
  request: RequestContext,
): Response | undefined {
  const { CONFIG } = getConstants();
  const { trailingSlash } = CONFIG;
  const url = new URL(request.finalURL);
  const { pathname } = url;
  const isHome = pathname === "/";

  if (trailingSlash && !pathname.endsWith("/") && !isHome) {
    return redirect(new URL(pathname + "/", url).toString());
  }

  if (!trailingSlash && pathname.endsWith("/") && !isHome) {
    return redirect(new URL(pathname.slice(0, -1), url).toString());
  }
}

function redirect(url: string) {
  return new Response(null, {
    status: 301,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      expires: "-1",
      pragma: "no-cache",
      location: url,
      vary: "Accept-Language",
    },
  });
}

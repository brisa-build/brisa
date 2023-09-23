import { RequestContext } from "../../bunrise";
import getConstants from "../../constants";

export default function redirectTrailingSlash(
  request: RequestContext,
): Response | undefined {
  const { CONFIG } = getConstants();
  const { trailingSlash } = CONFIG;
  const url = new URL(request.url);
  const { pathname } = url;

  if (trailingSlash && !pathname.endsWith("/")) {
    return redirect(new URL(pathname + "/", url).toString());
  }

  if (!trailingSlash && pathname.endsWith("/")) {
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

import type { RequestContext } from "@/types";
import { PREFIX_MESSAGE, SUFFIX_MESSAGE } from "@/utils/rerender-in-action";
import responseRenderedPage from "@/utils/response-rendered-page";
import getRouteMatcher from "@/utils/get-route-matcher";
import { getConstants } from "@/constants";
import { logError } from "@/utils/log/log-build";
import { AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL } from "@/utils/ssr-web-component";

type ResolveActionParams = {
  req: RequestContext;
  error: Error;
  component: JSX.Element;
};

const headers = {
  "Content-Type": "text/html; charset=utf-8",
  "Transfer-Encoding": "chunked",
  vary: "Accept-Encoding",
};

/**
 *
 * This method is called inside the catch block of the action function.
 */
export default async function resolveAction({
  req,
  error,
  component,
}: ResolveActionParams) {
  const { PAGES_DIR, RESERVED_PAGES } = getConstants();
  const url = new URL(req.headers.get("referer") ?? "", req.url);

  // Avoid declarative shadow dom
  req.store.set(AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL, true);

  // Navigate to another page
  if (error.name === "navigate") {
    return new Response(null, {
      status: 200,
      headers: {
        ...headers,
        "X-Navigate": error.message,
      },
    });
  }

  // Redirect to 404 page
  if (error.name === "NotFoundError") {
    url.searchParams.set("_not-found", "1");

    return new Response(null, {
      status: 200,
      headers: {
        ...headers,
        "X-Navigate": url.toString(),
      },
    });
  }

  // Error not caught
  if (error.name !== "rerender") {
    return new Response(error.message, { status: 500 });
  }

  const options = JSON.parse(
    error.message.replace(PREFIX_MESSAGE, "").replace(SUFFIX_MESSAGE, ""),
  );

  // Rerender page
  if (options.type === "page") {
    const pagesRouter = getRouteMatcher(
      PAGES_DIR,
      RESERVED_PAGES,
      req.i18n?.locale,
    );

    const { route, isReservedPathname } = pagesRouter.match(req);

    if (!route || isReservedPathname) {
      const errorMessage = `Error rerendering page ${url}. Page route not found`;
      logError([errorMessage]);
      return new Response(errorMessage, { status: 404 });
    }

    const res = await responseRenderedPage({ req, route });

    res.headers.set("X-Mode", options.mode);

    return res;
  }

  // Rerender component: TODO: Implement this
  return new Response(`TODO RERENDER component`, {
    status: 200,
    headers: {
      ...headers,
      "X-Mode": options.mode,
    },
  });
}

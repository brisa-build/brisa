import type { RequestContext } from "@/types";

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
export default function resolveAction({
  req,
  error,
  component,
}: ResolveActionParams) {
  if (error.name === "navigate") {
    return new Response(null, {
      status: 200,
      headers: {
        ...headers,
        "X-Navigate": error.message,
      },
    });
  }

  if (error.name === "rerender" && error.message === "component") {
    // TODO: should return streaming response
    return new Response("TODO RERENDER COMPONENT");
  }

  if (error.name === "rerender" && error.message === "page") {
    // TODO: should return streaming response
    return new Response("TODO RERENDER PAGE");
  }

  if (error.name === "NotFoundError") {
    const url = new URL(req.headers.get("referer") ?? "", req.url);

    url.searchParams.set("_not-found", "1");

    return new Response(null, {
      status: 200,
      headers: {
        ...headers,
        "X-Navigate": url.toString(),
      },
    });
  }

  return new Response(error.message, { status: 500 });
}

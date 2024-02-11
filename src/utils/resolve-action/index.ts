import type { RequestContext } from "@/types";
import { PREFIX_MESSAGE, SUFFIX_MESSAGE } from "../rerender-in-action";

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

  if (error.name === "rerender") {
    const options = JSON.parse(
      error.message.replace(PREFIX_MESSAGE, "").replace(SUFFIX_MESSAGE, ""),
    );

    return new Response(`TODO RERENDER ${options.type}`, {
      status: 200,
      headers: {
        ...headers,
        "X-Mode": options.mode,
      },
    });
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

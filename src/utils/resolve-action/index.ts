import type { RequestContext } from "@/types";

type ResolveActionParams = {
  req: RequestContext;
  error: Error;
  component: JSX.Element;
};

const headers = {
  "Content-Type": "application/x-ndjson",
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
    return new Response(
      JSON.stringify({ action: "navigate", params: [error.message] }),
      { status: 200, headers },
    );
  }

  if (error.name === "rerender" && error.message === "component") {
    // TODO: should return streaming response
    return new Response("TODO RERENDER COMPONENT");
  }

  if (error.name === "rerender" && error.message === "page") {
    // TODO: should return streaming response
    return new Response("TODO RERENDER SERVER");
  }

  if (error.name === "NotFoundError") {
    const url = new URL(req.headers.get("referer") ?? "", req.url);

    url.searchParams.set("_not-found", "1");

    return new Response(
      JSON.stringify({ action: "navigate", params: [url.toString()] }),
      { status: 200, headers },
    );
  }

  return new Response(error.message, { status: 500 });
}

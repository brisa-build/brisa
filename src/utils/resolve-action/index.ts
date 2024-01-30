type ResolveActionParams = {
  req: Request;
  error: Error;
  pagePath: string;
  component: JSX.Element;
};

// TODO: #47 - Implement rerender component and page
export default function resolveAction({
  req,
  error,
  pagePath,
  component,
}: ResolveActionParams) {
  if (error.name === "redirect") {
    return new Response(`{action:"navigate", params:["${error.message}"]}`);
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
    return new Response(null, { status: 404 });
  }

  return new Response(error.message, { status: 500 });
}

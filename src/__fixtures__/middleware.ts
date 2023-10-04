import { RequestContext } from "../types";

export default async function middleware(request: RequestContext) {
  const url = new URL(request.finalURL);

  if (url.pathname !== "/test") return;

  return new Response("", {
    status: 302,
    headers: {
      Location: "/",
    },
  });
}

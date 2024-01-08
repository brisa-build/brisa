import { RequestContext } from "@/types";
import notFound from "@/utils/not-found";

export default async function middleware(request: RequestContext) {
  const url = new URL(request.finalURL);

  if (url.searchParams.get("throws-error")) {
    throw new Error("Some internal error");
  }

  if (url.searchParams.get("throws-not-found")) {
    notFound();
  }

  if (url.searchParams.get("redirect")) {
    return new Response("", {
      status: 301,
      headers: {
        Location: "/" + request.i18n.locale,
      },
    });
  }
}

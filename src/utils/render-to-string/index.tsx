import renderToReadableStream from "@/utils/render-to-readable-stream";
import extendRequestContext from "@/utils/extend-request-context";

export default async function renderToString(
  element: JSX.Element,
  request = extendRequestContext({ originalRequest: new Request("http://localhost") }),
): Promise<string> {
  return await Bun.readableStreamToText(
    renderToReadableStream(element, { request, log: false } as any),
  );
}

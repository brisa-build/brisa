import renderToReadableStream from "@/utils/render-to-readable-stream";

export default async function renderToString(
  element: JSX.Element,
  request = new Request("http://localhost"),
): Promise<string> {
  return await Bun.readableStreamToText(
    renderToReadableStream(element, { request, log: false } as any),
  );
}

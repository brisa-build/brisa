import renderToReadableStream from '@/utils/render-to-readable-stream';
import type { JSXNode } from '@/types';

export default async function renderToString(
  element: JSXNode,
  {
    request = new Request('http://localhost'),
    applySuspense = false,
  }: { request?: Request; applySuspense?: boolean } = {},
): Promise<string> {
  return await Bun.readableStreamToText(
    renderToReadableStream(element, { request, isPage: false, applySuspense }),
  );
}

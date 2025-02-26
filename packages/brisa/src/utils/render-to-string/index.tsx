import readableStreamToText from '@/utils/readable-stream-to-text';
import renderToReadableStream from '@/utils/render-to-readable-stream';

export default async function renderToString(
  element: JSX.Element,
  {
    request = new Request('http://localhost'),
    applySuspense = false,
  }: { request?: Request; applySuspense?: boolean } = {},
): Promise<string> {
  return await readableStreamToText(
    renderToReadableStream(element, { request, isPage: false, applySuspense }),
  );
}

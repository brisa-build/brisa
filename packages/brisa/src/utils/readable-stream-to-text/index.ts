// Version of Bun.readableStreamToText but more runtime agnostic
export async function agnosticReadableStreamToText(
  stream: ReadableStream<Uint8Array | ArrayBuffer | string>,
) {
  const reader = stream.getReader();
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decodeChunk(value);
  }

  return result;
}

function decodeChunk(chunk: Uint8Array | ArrayBuffer | string): string {
  if (typeof chunk === 'string') {
    return chunk;
  } else {
    const decoder = new TextDecoder();
    return decoder.decode(chunk, { stream: true });
  }
}

export default typeof Bun !== 'undefined'
  ? Bun.readableStreamToText
  : agnosticReadableStreamToText;

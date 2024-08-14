// Version of Bun.readableStreamToText but more runtime agnostic
export async function agnosticReadableStreamToText(
  stream: ReadableStream<ArrayBufferView | ArrayBuffer>,
) {
  let result = '';
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();

  while (true) {
    const { done, value } = await reader.read();

    if (done || !value || !value?.length) break;

    result += value;
  }

  return result;
}

export default typeof Bun !== 'undefined'
  ? Bun.readableStreamToText
  : agnosticReadableStreamToText;

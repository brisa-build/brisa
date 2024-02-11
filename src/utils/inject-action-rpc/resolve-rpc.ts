async function resolveRPC(res: Response) {
  const urlToNavigate = res.headers.get("X-Navigate");

  return urlToNavigate
    ? (window.location.href = urlToNavigate)
    : updateDOMFromHTMLStreamReader(res.body!.getReader());
}

async function updateDOMFromHTMLStreamReader(
  reader: ReadableStreamDefaultReader<Uint8Array>,
) {
  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    const text = new TextDecoder().decode(value);

    // TODO: Implement the logic to update the DOM from the HTML stream
  }
}

window._rpc = resolveRPC;

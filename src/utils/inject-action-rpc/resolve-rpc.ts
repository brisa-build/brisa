/// <reference lib="dom.iterable" />

async function resolveRPC(res: Response) {
  const reader = res.body!.getReader();

  /**
   * The chunk is using Newline-delimited JSON (NDJSON) format.
   * This format is used to parse JSON objects from a stream.
   *
   * Content-Type: application/x-ndjson
   *
   * https://en.wikipedia.org/wiki/JSON_streaming#Newline-delimited_JSON
   *
   * Example:
   *
   * {"action": "foo"} \n {"action": "bar"} \n {"action": "baz"}
   *
   * The difference between this format and JSON is that this format
   * is not a valid JSON, but it is a valid JSON stream.
   *
   */
  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    const text = new TextDecoder().decode(value);

    for (const json of text.split("\n")) {
      if (!json) continue;
      const { action, params, selector } = JSON.parse(json);

      // Redirect to a different page
      if (action === "navigate") {
        window.location.href = params[0];
      }
    }
  }
}

window._rpc = resolveRPC;

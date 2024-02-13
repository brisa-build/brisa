const START_CHUNK_SELECTOR = "S-C";
const decoder = new TextDecoder();
const parser = new DOMParser();

/**
 * Create a generator that extracts nodes from a stream of HTML.
 *
 * This is useful to work with the RPC response stream and
 * transform the HTML into a stream of nodes to use in the
 * diffing algorithm.
 */
export default async function* parseHTMLStream(
  streamReader: ReadableStreamDefaultReader<Uint8Array>,
  text = "",
): AsyncGenerator<Node> {
  const { done, value } = await streamReader.read();

  if (done) return;

  // Append the new chunk to the text with a marker.
  // This marker is necessary because without it, we
  // can't know where the new chunk starts and ends.
  text = `${text.replace(
    `<${START_CHUNK_SELECTOR} />`,
    "",
  )}<${START_CHUNK_SELECTOR} />${decoder.decode(value)}`;

  // Parse the text into a DOM document with the text of all
  // the chunks that have arrived to don't lose the previous
  // node because some chunks are only end tags, opening tags,
  // or text and we need to keep the full context
  const doc = parser.parseFromString(text, "text/html");

  // Iterate over the chunk nodes
  for (
    let node = getNextNode(doc.querySelector(START_CHUNK_SELECTOR) as Node);
    node;
    node = getNextNode(node)
  )
    yield node;

  // Continue reading the stream
  yield* await parseHTMLStream(streamReader, text);
}

/**
 * Get the next node in the tree. A difference here between the normal
 * Virtual DOM diffing algorith is that we need to change the breadth-first
 * to depth-first search in order to work with the streamed HTML.
 */
function getNextNode(node: Node | null, deeperDone?: Boolean): Node | null {
  if (!node) return null;
  if (node.childNodes.length && !deeperDone) return node.firstChild;
  return node.nextSibling ?? getNextNode(node.parentNode, true);
}

type NodeWithChildNodes = {
  childNodes: Node[];
  firstChild: Node | null;
  nextSibling: Node | null;
  parentNode: Node | null;
  nodeName: string;
};

type Node = NodeWithChildNodes | null;

const START_CHUNK_SELECTOR = "start-next-chunk";
const decoder = new TextDecoder();

async function resolveRPC(res: Response) {
  const urlToNavigate = res.headers.get("X-Navigate");

  return urlToNavigate
    ? (window.location.href = urlToNavigate)
    : diffDOMStream(res.body!.getReader());
}

async function diffDOMStream(
  streamReader: ReadableStreamDefaultReader<Uint8Array>,
  wrapper = document.createElement("html"),
  text = "",
) {
  const { done, value } = await streamReader.read();

  if (done) return;

  // Append the new chunk to the text with a marker.
  // This marker is necessary because without it, we
  // can't know where the new chunk starts and ends.
  text = `${text.replace(
    START_CHUNK_SELECTOR,
    "",
  )}<${START_CHUNK_SELECTOR} />${decoder.decode(value)}`;

  // Replace the wrapper with the text of all the chunks that have arrived
  // to don't lose the previous nodes because some chunks are only end tags,
  // opening tags, or text and we need to keep the full context
  wrapper.innerHTML = text;

  // Iterate over the chunk nodes to diff
  for (
    let node = nextNode(wrapper.querySelector(START_CHUNK_SELECTOR) as Node);
    node;
    node = nextNode(node)
  ) {
    console.log(node.nodeName);
    // TODO: Implement diffing algorithm
  }

  // Continue reading the stream, doing the diff of the next chunk
  return await diffDOMStream(streamReader, wrapper, text);
}

/**
 * Get the next node in the tree (depth-first search)
 */
function nextNode(node: Node, deeperDone = 0): Node | undefined {
  if (!node) return;
  if (node.childNodes.length && !deeperDone) return node.firstChild;
  return node.nextSibling ?? nextNode(node.parentNode, 1);
}

window._rpc = resolveRPC;

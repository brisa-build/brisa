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
    : diffStream(res.body!.getReader());
}

async function diffStream(
  streamReader: ReadableStreamDefaultReader<Uint8Array>,
  wrapper = document.createElement("html"),
  text = "",
) {
  const { done, value } = await streamReader.read();

  if (done) return;

  // Append the new chunk to the text with a marker
  text = `${text.replace(
    START_CHUNK_SELECTOR,
    "",
  )}<${START_CHUNK_SELECTOR} />${decoder.decode(value)}`;

  wrapper.innerHTML = text;

  for (
    let node = nextNode(wrapper.querySelector(START_CHUNK_SELECTOR) as Node);
    node;
    node = nextNode(node)
  ) {
    console.log(node.nodeName);
    // TODO: Implement diffing algorithm
  }

  return await diffStream(streamReader, wrapper, text);
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

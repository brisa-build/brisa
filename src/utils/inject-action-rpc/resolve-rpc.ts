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
const parser = new DOMParser();

async function resolveRPC(res: Response) {
  const urlToNavigate = res.headers.get("X-Navigate");

  if (urlToNavigate) {
    window.location.href = urlToNavigate;
    return;
  }

  await updateDOMReactively(res.body!.getReader());
}

async function updateDOMReactively(
  streamReader: ReadableStreamDefaultReader<Uint8Array>,
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

  // Parse the text into a DOM document with declarative shadow roots
  // @ts-ignore
  const doc = parser.parseFromString(text, "text/html", {
    includeShadowRoots: true,
  });

  // Replace the wrapper with the text of all the chunks that have
  // arrived to don't lose the previous node because some chunks
  // are only end tags, opening tags, or text and we need to keep
  // the full context
  // wrapper.innerHTML = text;

  // Iterate over the chunk nodes to diff
  for (
    let node = nextNode(doc.querySelector(START_CHUNK_SELECTOR) as Node);
    node;
    node = nextNode(node)
  ) {
    console.log(node.nodeName);
    // TODO: Implement diffing algorithm
  }

  // Continue reading the stream, doing the diff of the next chunk
  return await updateDOMReactively(streamReader, text);
}

/**
 * Get the next node in the tree. A difference here between the normal
 * Virtual DOM diffing algorith is that we need to change the breadth-first
 * to depth-first search in order to work with the streamed HTML.
 */
function nextNode(node: Node | null, deeperDone?: Boolean): Node | null {
  if (!node) return null;
  if (node.childNodes.length && !deeperDone) return node.firstChild;
  return node.nextSibling ?? nextNode(node.parentNode, true);
}

window._rpc = resolveRPC;

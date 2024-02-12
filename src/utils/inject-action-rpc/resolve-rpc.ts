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

  if (urlToNavigate) {
    window.location.href = urlToNavigate;
    return;
  }

  updateDOMReactively(res.body!.getReader());
}

async function updateDOMReactively(
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

  // Replace the wrapper with the text of all the chunks that have
  // arrived to don't lose the previous element because some chunks
  // are only end tags, opening tags, or text and we need to keep
  // the full context
  wrapper.innerHTML = text;

  // Iterate over the chunk elements to diff
  for (
    let element = nextElement(wrapper.querySelector(START_CHUNK_SELECTOR));
    element;
    element = nextElement(element)
  ) {
    console.log(element.nodeName);
    // TODO: Implement diffing algorithm
  }

  // Continue reading the stream, doing the diff of the next chunk
  return await updateDOMReactively(streamReader, wrapper, text);
}

/**
 * Get the next element in the tree. A difference here between the normal
 * Virtual DOM diffing algorith is that we need to change the breadth-first
 * to depth-first search in order to work with the streamed HTML.
 */
function nextElement(element: Element | null, deeperDone = 0): Element | null {
  if (!element) return null;
  if (element.children.length && !deeperDone) return element.firstElementChild;
  return element.nextElementSibling ?? nextElement(element.parentElement, 1);
}

window._rpc = resolveRPC;

import parseHTMLStream, { getNextNode } from "../parse-html-stream";

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;
const SUPPORTED_NODES = new Set([TEXT_NODE, ELEMENT_NODE]);

async function resolveRPC(res: Response) {
  const urlToNavigate = res.headers.get("X-Navigate");

  if (urlToNavigate) {
    window.location.href = urlToNavigate;
    return;
  }

  const vNodeGenerator = parseHTMLStream(res.body!.getReader());
  const currentVNode = (await vNodeGenerator.next()).value;
  const currentRealNode = document.querySelector("html")!;

  await diff(currentRealNode, currentVNode, vNodeGenerator);
}

async function diff(
  node: Element | Text,
  vNode: Element | Text,
  vNodeGenerator: AsyncGenerator<Node, void, unknown>,
) {
  if (
    !SUPPORTED_NODES.has(node.nodeType) ||
    !SUPPORTED_NODES.has(vNode.nodeType)
  )
    return;

  // Remove node
  if (!vNode && node) node.remove();
  // Replace node if it's a different type / text
  else if (
    node.nodeName !== vNode.nodeName ||
    ((node.nodeType === TEXT_NODE || node.nodeType === TEXT_NODE) &&
      vNode.textContent !== node.textContent)
  ) {
    node.replaceWith(vNode);
  }

  // Diff more deeply
  else {
    diffAttributes(node, vNode);

    const nextNode = getNextNode(node) as Element;
    const nextVNode = (await vNodeGenerator.next()).value as Element;

    if (nextNode) await diff(nextNode, nextVNode, vNodeGenerator);
  }
}

function diffAttributes(node: Node, vNode: Node) {
  if (node instanceof Element && vNode instanceof Element) {
    for (const { name, value } of Array.from(vNode.attributes)) {
      if (node.getAttribute(name) !== value) {
        node.setAttribute(name, value);
      }
    }

    for (const { name } of Array.from(node.attributes)) {
      if (!vNode.hasAttribute(name)) {
        node.removeAttribute(name);
      }
    }
  }
}

window._rpc = resolveRPC;

/**
 * This file contains a diffing algorithm that is used to update the DOM
 * inspired by the set-dom library https://github.com/DylanPiercey/set-dom
 * but using the parse-html-stream library to parse the html stream.
 */
import htmlStreamWalker from "parse-html-stream/walker";

type Walker = ReturnType<typeof htmlStreamWalker>;

const ELEMENT_TYPE = 1;
const DOCUMENT_TYPE = 9;
const DOCUMENT_FRAGMENT_TYPE = 11;

export default async function diff(
  oldNode: Node,
  newNode: Node,
  walker: Walker,
) {
  if (oldNode.nodeType === DOCUMENT_TYPE) {
    oldNode = (oldNode as Document).documentElement;
  }

  if ((newNode as Node).nodeType === DOCUMENT_FRAGMENT_TYPE) {
    await setChildNodes(oldNode, newNode as Node, walker);
  } else {
    await updateNode(oldNode, newNode as Node, walker);
  }
}

/**
 * Updates a specific htmlNode and does whatever it takes to convert it to another one.
 */
async function updateNode(oldNode: Node, newNode: Node, walker: Walker) {
  if (oldNode.nodeType !== newNode.nodeType) {
    return oldNode.parentNode!.replaceChild(newNode, oldNode);
  }

  if (oldNode.nodeType === ELEMENT_TYPE) {
    if (oldNode.isEqualNode(newNode)) return;

    await setChildNodes(oldNode, newNode, walker);

    if (oldNode.nodeName === newNode.nodeName) {
      setAttributes(
        (oldNode as Element).attributes,
        (newNode as Element).attributes,
      );
    } else {
      const newPrev = newNode.cloneNode();
      while (oldNode.firstChild) newPrev.appendChild(oldNode.firstChild);
      oldNode.parentNode!.replaceChild(newPrev, oldNode);
    }
  } else if (oldNode.nodeValue !== newNode.nodeValue) {
    oldNode.nodeValue = newNode.nodeValue;
  }
}

/**
 * Utility that will update one list of attributes to match another.
 */
function setAttributes(
  oldAttributes: NamedNodeMap,
  newAttributes: NamedNodeMap,
) {
  let i, oldAttribute, newAttribute, namespace, name;

  // Remove old attributes.
  for (i = oldAttributes.length; i--; ) {
    oldAttribute = oldAttributes[i];
    namespace = oldAttribute.namespaceURI;
    name = oldAttribute.localName;
    newAttribute = newAttributes.getNamedItemNS(namespace, name);

    if (!newAttribute) oldAttributes.removeNamedItemNS(namespace, name);
  }

  // Set new attributes.
  for (i = newAttributes.length; i--; ) {
    oldAttribute = newAttributes[i];
    namespace = oldAttribute.namespaceURI;
    name = oldAttribute.localName;
    newAttribute = oldAttributes.getNamedItemNS(namespace, name);

    if (!newAttribute) {
      // Add a new attribute.
      newAttributes.removeNamedItemNS(namespace, name);
      oldAttributes.setNamedItemNS(oldAttribute);
    } else if (newAttribute.value !== oldAttribute.value) {
      // Update existing attribute.
      newAttribute.value = oldAttribute.value;
    }
  }
}

/**
 * Utility that will nodes childern to match another nodes children.
 */
async function setChildNodes(oldParent: Node, newParent: Node, walker: Walker) {
  let checkOld;
  let oldKey;
  let checkNew;
  let newKey;
  let foundNode;
  let keyedNodes: Record<string, Node> | null = null;
  let oldNode = oldParent.firstChild;
  let newNode = await walker.firstChild(newParent);
  let extra = 0;

  // Extract keyed nodes from previous children and keep track of total count.
  while (oldNode) {
    extra++;
    checkOld = oldNode;
    oldKey = getKey(checkOld);
    oldNode = (await walker.nextSibling(oldNode)) as ChildNode;

    if (oldKey) {
      if (!keyedNodes) keyedNodes = {};
      keyedNodes[oldKey] = checkOld;
    }
  }

  oldNode = oldParent.firstChild;

  // Loop over new nodes and perform updates.
  while (newNode) {
    extra--;
    checkNew = newNode;
    newNode = (await walker.nextSibling(newNode)) as ChildNode;

    // Unsuspense the "suspense" component phase
    if (
      checkNew.nodeName === "SCRIPT" &&
      /R:(1-9)*/.test((checkNew as HTMLScriptElement).id)
    ) {
      u$?.((checkNew as HTMLScriptElement).id.replace("R:", ""));
      continue;
    }

    if (
      keyedNodes &&
      (newKey = getKey(checkNew)) &&
      (foundNode = keyedNodes[newKey])
    ) {
      delete keyedNodes[newKey];
      if (foundNode !== oldNode) {
        oldParent.insertBefore(foundNode, oldNode);
      } else {
        oldNode = oldNode.nextSibling;
      }

      await updateNode(foundNode, checkNew, walker);
    } else if (oldNode) {
      checkOld = oldNode;
      oldNode = oldNode.nextSibling;
      if (getKey(checkOld)) {
        oldParent.insertBefore(checkNew, checkOld);
      } else {
        await updateNode(checkOld, checkNew, walker);
      }
    } else {
      oldParent.appendChild(checkNew);
    }
  }

  // Remove old keyed nodes.
  for (oldKey in keyedNodes) {
    extra--;
    oldParent.removeChild(keyedNodes![oldKey]!);
  }

  // If we have any remaining unkeyed nodes remove them from the end.
  while (--extra >= 0) oldParent.removeChild(oldParent.lastChild!);
}

function getKey(node: Node) {
  return (node as Element)?.getAttribute?.("key") || (node as Element).id;
}

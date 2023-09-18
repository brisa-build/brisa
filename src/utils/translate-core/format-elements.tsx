export const tagParsingRegex = /<(\w+) *>(.*?)<\/\1 *>|<(\w+) *\/>/;

const nlRe = /(?:\r\n|\r|\n)/g;

function getElements(
  parts: Array<string | undefined>,
): Array<string | undefined>[] {
  if (!parts.length) return [];

  const [paired, children, unpaired, after] = parts.slice(0, 4);

  return [
    [(paired || unpaired) as string, children || ("" as string), after],
  ].concat(getElements(parts.slice(4, parts.length)));
}

export default function formatElements(
  value: string,
  elements: JSX.Element[] | Record<string, JSX.Element> = [],
) {
  const parts = value.replace(nlRe, "").split(tagParsingRegex);

  if (parts.length === 1) return value;

  const tree: (string | Element)[] = [];

  const before = parts.shift();
  if (before) tree.push(before);

  const allElements = getElements(parts);

  for (const [key, children, after] of allElements) {
    const element = elements[key as string] || <></>;
    const elementWithChildren = {
      ...element,
      props: {
        ...(element.props ?? {}),
        children: children
          ? formatElements(children, elements)
          : element.props.children,
      },
    };

    tree.push(elementWithChildren);

    if (after) tree.push(after);
  }

  return tree;
}

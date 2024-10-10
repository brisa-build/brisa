import type { BrisaElement } from '@/types';

export const tagParsingRegex = /<(\w+) *>(.*?)<\/\1 *>|<(\w+) *\/>/;

const symbol = { [Symbol.for('isJSX')]: true };
const createEl = (el: any) =>
  Object.assign([null, {}, el] as BrisaElement, symbol);
const nlRe = /(?:\r\n|\r|\n)/g;

function getElements(
  parts: Array<string | undefined>,
): Array<string | undefined>[] {
  if (!parts.length) return [];

  const [paired, children, unpaired, after] = parts.slice(0, 4);

  return [
    [(paired || unpaired) as string, children || ('' as string), after],
  ].concat(getElements(parts.slice(4, parts.length)));
}

export default function formatElements(
  value: string,
  elements: JSX.Element[] | Record<string, JSX.Element> = [],
) {
  const parts = value.replace(nlRe, '').split(tagParsingRegex);

  if (parts.length === 1) return value;

  const tree: BrisaElement[] = [];
  const pushJSXElement = (e: any) => tree.push(createEl(e));

  const before = parts.shift();
  if (before) pushJSXElement(before);

  const allElements = getElements(parts);

  for (const [key, children, after] of allElements) {
    const element = (elements as any)[key!] || createEl(key);

    element[2] = children ? formatElements(children, elements) : children;

    pushJSXElement(element);

    if (after) pushJSXElement(after);
  }

  return tree;
}

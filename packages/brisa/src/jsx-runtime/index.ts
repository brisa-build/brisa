import type { BrisaElement, JSXType, Primitives, Props } from '@/types';

const JSX_SYMBOL = Symbol.for('isJSX');

function Fragment(
  props: Props<{
    children?: BrisaElement | Primitives;
  }>,
) {
  return createNode(null, props);
}

function createNode(
  type: JSXType,
  {
    children,
    ...props
  }: Props & {
    children?:
      | (BrisaElement & { [JSX_SYMBOL]?: boolean })[]
      | (BrisaElement & { [JSX_SYMBOL]?: boolean })
      | Primitives;
  },
  key?: string,
): { [JSX_SYMBOL]: boolean } & BrisaElement {
  let child = children;

  if (Array.isArray(children) && !isArrawOfJSXContent(children)) {
    child = children.map((c) =>
      c?.[JSX_SYMBOL] ? c : Fragment({ children: c }),
    );
  }

  return Object.assign([type, { ...props, key }, child], {
    [JSX_SYMBOL]: true,
  }) as { [JSX_SYMBOL]: boolean } & BrisaElement;
}

export function isArrawOfJSXContent(
  content: unknown,
): content is BrisaElement & { [JSX_SYMBOL]?: boolean } {
  return (
    Array.isArray(content) && (JSX_SYMBOL in content || isDangerHTML(content))
  );
}

export function isDangerHTML(content: unknown[]): boolean {
  return (
    content?.[0] === 'HTML' &&
    typeof (content[1] as { html?: string })?.html === 'string'
  );
}

export {
  createNode as jsx,
  createNode as jsxs,
  createNode as jsxDEV,
  Fragment,
};

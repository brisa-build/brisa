import type { BrisaElement, JSXType, Props } from '@/types';

export type JSXSymbolMark = { [JSX_SYMBOL]: boolean };
export type ElementWithJSXMark = JSX.Element & JSXSymbolMark;

const JSX_SYMBOL = Symbol.for('isJSX');

function Fragment(props: Props) {
  return createNode(null, props);
}

function createNode(
  type: JSXType,
  {
    children,
    ...props
  }: Props & {
    children?: JSX.Element | JSX.Element[];
  },
  key?: string,
): JSXSymbolMark & BrisaElement {
  let child: any = children;

  if (Array.isArray(children) && !isArrawOfJSXContent(children)) {
    child = children.map((c) =>
      (c as ElementWithJSXMark)?.[JSX_SYMBOL] ? c : Fragment({ children: c }),
    );
  }

  return Object.assign([type, { ...props, key }, child], {
    [JSX_SYMBOL]: true,
  }) as JSXSymbolMark & BrisaElement;
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

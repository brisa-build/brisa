import type { Type, Props } from '@/types';

const JSX_SYMBOL = Symbol.for('isJSX');
const Fragment: any = (props: Props) => createNode(null, props);

function createNode(
  type: Type,
  { children, ...props }: Props,
  key?: string,
): any[] & { [x: symbol]: boolean } {
  let child = children;

  if (Array.isArray(children) && !isArrawOfJSXContent(children)) {
    child = children.map((c) =>
      c?.[JSX_SYMBOL] ? c : Fragment({ children: c }),
    );
  }

  return Object.assign([type, { ...props, key }, child], {
    [JSX_SYMBOL]: true,
  }) as unknown as any[] & { [x: symbol]: boolean };
}

export function isArrawOfJSXContent(content: unknown): content is JSX.Element {
  return (
    Array.isArray(content) && (JSX_SYMBOL in content || isDangerHTML(content))
  );
}

export function isDangerHTML(content: unknown[]): boolean {
  return (
    content?.[0] === 'HTML' && typeof (content[1] as any)?.html === 'string'
  );
}

Fragment.__isFragment = true;

export {
  createNode as jsx,
  createNode as jsxs,
  createNode as jsxDEV,
  Fragment,
};

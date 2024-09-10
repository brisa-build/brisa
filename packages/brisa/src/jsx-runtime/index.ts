import type { Type, Props } from '@/types';

const JSX = Symbol.for('isJSX');
const Fragment: any = (props: Props) => createNode(null, props);

function createNode(
  type: Type,
  { children, ...props }: Props,
  key?: string,
): any[] & { [x: symbol]: boolean } {
  let child = children;

  if (Array.isArray(children) && !children?.[JSX as any]) {
    child = children.map((c) => (c?.[JSX] ? c : Fragment({ children: c })));
  }

  return Object.assign([type, { ...props, key }, child], {
    [JSX]: true,
  }) as unknown as any[] & { [x: symbol]: boolean };
}

Fragment.__isFragment = true;

export {
  createNode as jsx,
  createNode as jsxs,
  createNode as jsxDEV,
  Fragment,
};

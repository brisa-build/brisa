import type { Type, Props } from '@/types';

const Fragment = (props: Props) => props.children;
const createNode = (
  type: Type,
  { children, ...props }: Props,
  key?: string,
) => [type, { ...props, key }, children];

Fragment.__isFragment = true;

export {
  createNode as jsx,
  createNode as jsxs,
  createNode as jsxDEV,
  Fragment,
};

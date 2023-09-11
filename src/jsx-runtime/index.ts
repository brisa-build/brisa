import type { Type, Props } from "../types/index";

const Fragment = (props: Props) => props.children;
const createNode = (type: Type, props: Props) => ({ type, props });

Fragment.__isFragment = true;

export {
  createNode as jsx,
  createNode as jsxs,
  createNode as jsxDEV,
  Fragment,
};

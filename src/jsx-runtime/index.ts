import type { Props } from "../types/index";

function Fragment(props: Props) {
  return props.children;
}

function createNode(
  type: string | number | object | Function,
  props: Props,
  key: string,
  __source: unknown,
  __self: unknown,
) {
  return {
    type,
    props,
    key,
    ref: props?.ref,
    __source,
    __self,
  };
}

export {
  createNode as jsx,
  createNode as jsxs,
  createNode as jsxDEV,
  Fragment,
};

import type { Type, Props } from "../types/index";

function escapeHTML(unsafeText: unknown) {
  if (typeof unsafeText !== 'string') return unsafeText ?? "";
  let div = document.createElement('div');
  div.innerText = unsafeText;
  return div.innerHTML;
}

const Fragment = (props: Props) => props.children;
const createNode = (type: Type, props: Props) => {
  if (typeof window === "undefined") return { type, props };

  let { children, ...restProps } = props;
  const childrenString = Array.isArray(children) ? children.map(escapeHTML).join("") : escapeHTML(children);

  // @ts-ignore
  if (type.__isFragment) return childrenString;

  let attributes = Object.entries(restProps)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");

  if (attributes) attributes = " " + attributes;

  return { toString: () => `<${type}${attributes}>${childrenString}</${type}>` };
};

Fragment.__isFragment = true;

export {
  createNode as jsx,
  createNode as jsxs,
  createNode as jsxDEV,
  Fragment,
};

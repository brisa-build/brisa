import type { Type, Props } from "../types/index";

// function escapeHTML(unsafeText: string) {
//   let div = document.createElement('div');
//   div.innerText = unsafeText;
//   return div.innerHTML;
// }

const Fragment = (props: Props) => props.children;
const createNode = (type: Type, props: Props) => {
  if (typeof window === "undefined") return { type, props };

  // Web Components JSX are converted to string
  let { children, ...restProps } = props;
  const childrenString = Array.isArray(children) ? children.join("") : children;
  let attributes = Object.entries(restProps)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");

  if (attributes) attributes = " " + attributes;

  // @ts-ignore
  if (type.__isFragment) return childrenString;

  return `<${type}${attributes}>${childrenString}</${type}>`;
};

Fragment.__isFragment = true;

export {
  createNode as jsx,
  createNode as jsxs,
  createNode as jsxDEV,
  Fragment,
};

import type { Props, JSXNode, JSXElement } from "../../types/index";

function renderAttributes(props: Props): string {
  let attributes = '';

  for (const prop in props) {
    if (prop !== 'children') attributes += ` ${prop}="${props[prop]}"`;
  }

  return attributes;
}

function renderChildren(children: JSXNode | undefined): string {
  const renderChild = (child: JSXNode | undefined) => {
    if (typeof child === 'string') return child;
    if (typeof child === 'object') return renderToString(child);
    return '';
  }

  if (Array.isArray(children)) return children.map(renderChild).join('');

  return renderChild(children);
}

export function renderToString({ type, props }: JSXElement): string {
  if (typeof type === 'function') {
    const jsx = type(props)
    return typeof jsx === 'string' || typeof jsx === 'number' ? jsx.toString() : renderToString(jsx)
  }

  const attributes = renderAttributes(props)
  const content = renderChildren(props.children)

  return `<${type}${attributes}>${content}</${type}>`
}

export function page(element: JSXElement, responseOptions?: ResponseInit) {
  return new Response(renderToString(element), responseOptions ?? {
    headers: {
      'content-type': 'text/html;charset=UTF-8'
    }
  })
}

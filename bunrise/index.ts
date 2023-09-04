interface Props {
  [key: string]: any;
  children?: JSXNode;
}

type JSXNode = string | number | JSXElement;

interface JSXElement {
  type: string | JSXComponent;
  props: Props;
}

type JSXComponent = (props: Props) => JSXNode;

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

export function renderToString(element: JSXElement): string {
  if (typeof element.type === 'function') {
    const jsx = element.type(element.props)
    return typeof jsx === 'string' || typeof jsx === 'number' ? jsx.toString() : renderToString(jsx)
  }

  const attributes = renderAttributes(element.props)
  const content = renderChildren(element.props.children)
  const openTag = `<${element.type}${attributes}>`

  return `${openTag}${content}</${element.type}>`
}


export function page(element: JSXElement, responseOptions?: ResponseInit) {
  return new Response(renderToString(element), responseOptions ?? {
    headers: {
      'content-type': 'text/html;charset=UTF-8'
    }
  })
}

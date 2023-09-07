import type { Props, JSXNode, JSXElement } from "../types/index";

function renderAttributes(props: Props): string {
  let attributes = '';

  for (const prop in props) {
    if (prop !== 'children') attributes += ` ${prop}="${props[prop]}"`;
  }

  return attributes;
}

async function renderChildren(children: JSXNode | undefined, request: BunriseRequest): Promise<string> {
  const renderChild = (child: JSXNode | undefined) => {
    if (typeof child === 'string') return child;
    if (typeof child === 'object') return renderToString(child, request);
    return '';
  }

  if (Array.isArray(children)) return (await Promise.all(children.map(renderChild))).join('');

  return renderChild(children);
}

export async function renderToString(element: JSXElement | Promise<JSXElement>, request: BunriseRequest): Promise<string> {
  const { type, props } = await Promise.resolve(element)

  if (typeof type === 'function') {
    const jsx = await Promise.resolve(type(props, request))

    if (typeof jsx === 'string' || typeof jsx === 'number') return jsx.toString()

    return renderToString(jsx, request)
  }

  const attributes = renderAttributes(props)
  const content = await renderChildren(props.children, request)

  return `<${type}${attributes}>${content}</${type}>`
}

export async function page(element: JSXElement, request: Request, responseOptions?: ResponseInit) {
  return new Response(await renderToString(element, new BunriseRequest(request)), responseOptions ?? {
    headers: {
      'content-type': 'text/html;charset=UTF-8'
    }
  })
}

export class BunriseRequest extends Request {
  constructor(request: Request) {
    super(request)
  }

  context = new Map<string, any>();
}

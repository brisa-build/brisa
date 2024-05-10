async function render(
  element: JSX.Element | Response | string,
  baseElement?: HTMLElement,
): Promise<{ container: HTMLElement; unmount: () => void }>;

async function serveRoute(route: string): Promise<Response>;

async function waitFor(fn: () => unknown): Promise<void>;

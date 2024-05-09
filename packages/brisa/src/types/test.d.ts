async function render(
  element: JSX.Element | Response,
  baseElement?: HTMLElement,
): Promise<{ container: HTMLElement; unmount: () => void }>;

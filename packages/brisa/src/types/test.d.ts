/**
 *  render - Brisa Test API
 * 
 * Render a JSX element, a string or a Response object into a container.
 * 
 * Example:
 * 
 * ```tsx
 * import { render } from "brisa";
 * 
 * const { container, unmount } = await render(<div>Hello World</div>);
 * ```
 * 
 * - [Brisa docs](https://brisa.build/building-your-application/testing/test-api#render)
 */
export async function render(
  element: JSX.Element | Response | string,
  baseElement?: HTMLElement,
): Promise<{ container: HTMLElement; unmount: () => void }>;

export async function serveRoute(route: string): Promise<Response>;

export async function waitFor(fn: () => unknown): Promise<void>;

export function debug(): void;

type userEvent = {
  click(element: Element): void;
  dblClick(element: Element): void;
  type(element: HTMLInputElement, text: string): void;
  hover(element: Element): void;
  unhover(element: Element): void;
  focus(element: Element): void;
  blur(element: Element): void;
  select(element: HTMLSelectElement, value: string): void;
  deselect(element: HTMLSelectElement, value: string): void;
  upload(element: HTMLInputElement, file: File): void;
  clear(element: HTMLInputElement): void;
  tab(): void;
  paste(element: Element, text: string): void;
};

export const userEvent: userEvent;
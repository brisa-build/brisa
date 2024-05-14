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
  /**
   * The element to render, can be a JSX element, a string or a Response object.
   *
   * Example with JSX element:
   *
   * ```tsx
   * import { render } from "brisa";
   *
   * const { container, unmount } = await render(<div>Hello World</div>);
   * ```
   *
   * Example with string:
   *
   * ```tsx
   * import { render, serveRoute } from "brisa";
   *
   * const response = await serveRoute("/path");
   * const { container, unmount } = await render(await response.text());
   * ```
   *
   * Example with Response object:
   *
   * ```tsx
   * import { render, serveRoute } from "brisa";
   *
   * const response = await serveRoute("/path");
   * const { container, unmount } = await render(response);
   * ```
   */
  element: JSX.Element | Response | string,
  /**
   * The base element to append the container.
   *
   * Default: `document.documentElement`
   */
  baseElement?: HTMLElement,
): Promise<{ container: HTMLElement; unmount: () => void }>;

/**
 * serveRoute - Brisa Test API
 *
 * Serve a route and return the response.
 *
 * Example:
 *
 * ```tsx
 * import { serveRoute } from "brisa";
 *
 * const response = await serveRoute("/path");
 * ```
 *
 * - [Brisa docs](https://brisa.build/building-your-application/testing/test-api#serveroute)
 */
export async function serveRoute(route: string): Promise<Response>;

/**
 * waitFor - Brisa Test API
 *
 * Wait for an "expect" assertion to pass.
 *
 * Example:
 *
 * ```tsx
 * import { waitFor } from "brisa";
 *
 * await waitFor(() => expect(document.querySelector("button")).not.toBeNull());
 * ```
 *
 * > Note: The maxMilliseconds parameter is the maximum time to wait for the assertion to pass. By default, it is 1000 milliseconds.
 *
 * - [Brisa docs](https://brisa.build/building-your-application/testing/test-api#waitfor)
 */
export async function waitFor(
  fn: () => unknown,
  maxMilliseconds: number,
): Promise<void>;

/**
 * debug - Brisa Test API
 *
 * Log the current HTML of the DOM into the console on a pretty format.
 *
 * Example:
 *
 * ```tsx
 * import { debug } from "brisa";
 *
 * await render(<div>Hello World</div>);
 * debug();
 * ```
 *
 * In the console you will see:
 *
 * ```html
 * <html>
 *  <head>
 * </head>
 * <body>
 *  <div>Hello World</div>
 * </body>
 * </html>
 * ```
 *
 * - [Brisa docs](https://brisa.build/building-your-application/testing/test-api#debug)
 */
export function debug(): void;

type userEvent = {
  /**
   * Simulate a click event on an element.
   *
   * Example:
   *
   * ```tsx
   * import { render, userEvent } from "brisa";
   *
   * const mockFn = mock(() => {});
   * const { container } = await render(<button onClick={mockFn}>Click me</button>);
   * const button = container.querySelector("button");
   *
   * userEvent.click(button);
   * expect(mockFn).toHaveBeenCalled();
   * ```
   *
   * - [Brisa docs](https://brisa.build/building-your-application/testing/test-api#userevent)
   */
  click(element: Element): void;

  /**
   * Simulate a double click event on an element.
   *
   * Example:
   *
   * ```tsx
   * import { expect, mock } from "bun:test";
   * import { render, userEvent } from "brisa";
   *
   * const mockFn = mock(() => {});
   * const { container } = await render(<button onDblClick={mockFn}>Click me</button>);
   * const button = container.querySelector("button");
   *
   * userEvent.dblClick(button);
   * expect(mockFn).toHaveBeenCalled();
   * ```
   *
   * - [Brisa docs](https://brisa.build/building-your-application/testing/test-api#userevent)
   */
  dblClick(element: Element): void;

  /**
   * Simulate a submit event on a form element.
   *
   * Example:
   *
   * ```tsx
   * import { render, userEvent } from "brisa";
   * import { mock, expect } from "bun:test";
   *
   * const mockFn = mock(() => {});
   *
   * const { container } = await render(
   *  <form onSubmit={mockFn}>
   *   <input type="text" />
   *  <button type="submit">Submit</button>
   * </form>
   * );
   *
   * const form = container.querySelector("form");
   *
   * userEvent.submit(form);
   *
   * expect(mockFn).toHaveBeenCalled();
   * ```
   *
   * - [Brisa docs](https://brisa.build/building-your-application/testing/test-api#userevent)
   */
  submit(form: HTMLFormElement): void;

  /**
   * Simulate typing text on an input element.
   *
   * Example:
   *
   * ```tsx
   * import { render, userEvent } from "brisa";
   *
   * const { container } = await render(<input type="text" />);
   * const input = container.querySelector("input");
   *
   * userEvent.type(input, "Hello World");
   * expect(input.value).toBe("Hello World");
   * ```
   *
   * - [Brisa docs](https://brisa.build/building-your-application/testing/test-api#userevent)
   */
  type(element: HTMLInputElement, text: string): void;

  /**
   * Simulate hovering an element.
   *
   * Example:
   *
   * ```tsx
   * import { render, userEvent } from "brisa";
   *
   * const { container } = await render(<button>Hover me</button>);
   * const button = container.querySelector("button");
   *
   *
   * userEvent.hover(button);
   * ```
   *
   * - [Brisa docs](https://brisa.build/building-your-application/testing/test-api#userevent)
   */
  hover(element: Element): void;

  /**
   * Simulate unhovering an element.
   *
   * Example:
   *
   * ```tsx
   * import { render, userEvent } from "brisa";
   *
   * const { container } = await render(<button>Hover me</button>);
   * const button = container.querySelector("button");
   *
   * userEvent.hover(button);
   * userEvent.unhover(button); // Unhover the button
   * ```
   */
  unhover(element: Element): void;

  /**
   * Simulate focusing an element.
   *
   * Example:
   *
   * ```tsx
   * import { render, userEvent } from "brisa";
   *
   * const { container } = await render(<input type="text" />);
   * const input = container.querySelector("input");
   *
   * userEvent.focus(input);
   * ```
   */
  focus(element: Element): void;

  /**
   * Simulate blurring an element.
   *
   * Example:
   *
   * ```tsx
   * import { render, userEvent } from "brisa";
   *
   * const { container } = await render(<input type="text" />);
   * const input = container.querySelector("input");
   *
   * userEvent.focus(input);
   * userEvent.blur(input); // Blur the input
   * ```
   */
  blur(element: Element): void;

  /**
   * Simulate selecting an option on a select element.
   *
   * Example:
   *
   * ```tsx
   * import { render, userEvent } from "brisa";
   *
   * const { container } = await render(
   *   <select>
   *     <option value="1">Option 1</option>
   *     <option value="2">Option 2</option>
   *   </select>
   * );
   * const select = container.querySelector("select");
   *
   * userEvent.select(select, "2");
   * expect(select.value).toBe("2");
   * ```
   */
  select(element: HTMLSelectElement, value: string): void;

  /**
   * Simulate deselecting an option on a select element.
   *
   * Example:
   *
   * ```tsx
   * import { render, userEvent } from "brisa";
   *
   * const { container } = await render(
   *   <select>
   *     <option value="1">Option 1</option>
   *     <option value="2">Option 2</option>
   *   </select>
   * );
   * const select = container.querySelector("select");
   *
   * userEvent.select(select, "2");
   * userEvent.deselect(select, "2");
   * expect(select.value).toBe("");
   * ```
   */
  deselect(element: HTMLSelectElement, value: string): void;

  /**
   * Simulate uploading a file on an input element.
   *
   * Example:
   *
   * ```tsx
   * import { render, userEvent } from "brisa";
   *
   * const { container } = await render(<input type="file" />);
   * const input = container.querySelector("input");
   *
   * userEvent.upload(input, new File([""], "file.txt"));
   * ```
   */
  upload(element: HTMLInputElement, file: File): void;

  /**
   * Simulate clearing an input element.
   *
   * Example:
   *
   * ```tsx
   * import { render, userEvent } from "brisa";
   *
   * const { container } = await render(<input type="text" value="Hello World" />);
   * const input = container.querySelector("input");
   *
   * userEvent.clear(input);
   * expect(input.value).toBeEmpty();
   * ```
   *
   * - [Brisa docs](https://brisa.build/building-your-application/testing/test-api#userevent)
   */
  clear(element: HTMLInputElement): void;

  /**
   * Simulate a tab event on an element.
   *
   * Example:
   *
   * ```tsx
   * import { render, userEvent } from "brisa";
   *
   * const { container } = await render(<input type="text" />);
   * const input = container.querySelector("input");
   *
   * userEvent.tab();
   * expect(input.isEqualNode(document.activeElement)).toBeTrue();
   * ```
   *
   * - [Brisa docs](https://brisa.build/building-your-application/testing/test-api#userevent)
   */
  tab(): void;

  /**
   * Simulate pasting text on an element.
   *
   * Example:
   *
   * ```tsx
   * import { render, userEvent } from "brisa";
   *
   * const { container } = await render(<input type="text" />);
   * const input = container.querySelector("input");
   *
   * userEvent.paste(input, "Hello World");
   * expect(input.value).toBe("Hello World");
   * ```
   */
  paste(element: Element, text: string): void;
};

/**
 * User events
 *
 * The userEvent object contains methods to simulate user events like click, type, hover, focus, etc.
 *
 * - [Brisa docs](https://brisa.build/building-your-application/testing/test-api#userevent)
 */
export const userEvent: userEvent;

/**
 * cleanup - Brisa Test API
 * 
 * Cleanup the test environment cleaning up the DOM and other resources.
 * 
 * Example:
 * 
 * ```tsx
 * import { cleanup } from "brisa";
 * import { afterEach } from "bun:test";
 * 
 * afterEach(() => {
 *  cleanup();
 * });
 * ```
 * 
 * - [Brisa docs](https://brisa.build/building-your-application/testing/test-api#cleanup)
 */
export function cleanup(): void;
export type Options = {
  request: Request | RequestContext;
  head?: ComponentType;
  log?: boolean;
};

export type RerenderInActionProps = {
  type?: "component" | "page";
  mode?: "reactivity" | "transition";
};

/**
 * `renderToReadableStream`
 *
 * This is a helper function to render a component to a readable stream:
 *
 * Example:
 *
 * ```tsx
 * renderToReadableStream(<Component {...props} />, { request: new Request('http://localhost') });
 * ```
 */
export function renderToReadableStream(
  element: JSX.Element,
  options: Options,
): ReadableStream<any>;

/**
 * `renderToString`
 *
 * This is a helper function to render a component to a string:
 *
 * Example:
 *
 * ```tsx
 * await renderToString(<Component {...props} />, new Request('http://localhost'));
 * ```
 */
export async function renderToString(
  element: JSX.Element,
  request?: Request,
): Promise<string>;

/**
 * Description:
 *
 * The `rerenderInAction` method is used to rerender the component or the page
 * inside a server action. Outside of an action, it throws an error.
 *
 * Params:
 *
 * - `type`: The type of the rerender. It can be `component` or `page`.
 *           By default, it is `component`.
 * - `mode`: The type of the rerender. It can be `reactivity` or `transition`.
 *           By default, it is `reactivity`.
 *
 * Example:
 *
 * ```ts
 * rerenderInAction({ type: 'page' });
 * ```
 *
 * Docs:
 *
 * - [How to use `rerenderInAction`](https://brisa.build/api-reference/functions/rerenderInAction)
 */
export function rerenderInAction(props: RerenderInActionProps = {}): never;

import type { ServeOptions } from "bun";

export type Options = {
  request: Request | RequestContext;
  head?: ComponentType;
  isPage?: boolean;
  applySuspense?: boolean;
};

type RenderMode = "reactivity" | "transition";

export type RerenderInActionProps<T> =
  | {
      type?: "currentComponent" | "targetComponent";
      renderMode?: RenderMode;
      props?: T;
    }
  | {
      type?: "page";
      renderMode?: RenderMode;
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
  options: { request?: Request; applySuspense?: boolean } = {},
): Promise<string>;

/**
 * Description:
 *
 * The `rerenderInAction` method is used to rerender the component or the page
 * inside a server action. Outside of an action, it throws an error.
 *
 * Params:
 *
 * - `type`: `type`: The type of the rerender. It can be `currentComponent`,
 *           `targetComponent` or `page`. By default, it is `currentComponent`,
 *            this means that it is going to rerender the component that called
 *            the `rerenderInAction` method. When using `targetComponent` it is
 *            going to rerender the component that fired the original action.
 *            When using `page` it is going to rerender the whole page.
 * - `renderMode`: The type of the rerender. It can be `reactivity` or `transition`.
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
 * - [How to use `rerenderInAction`](https://brisa.build/api-reference/server-apis/rerenderInAction#rerenderinaction)
 */
export function rerenderInAction<PropsType>(
  props: RerenderInActionProps<PropsType> = {},
): never;

/**
 * Description:
 *
 * The `getServeOptions` method is used to get the serve options for the Brisa server.
 *
 * By default, Brisa includes its own server with brisa start. If you have an existing backend,
 * you can still use it with Brisa (this is not a custom server). A custom Brisa server allows
 * you to start a server 100% programmatically in order to use custom server patterns. Most of the time, you will not need this - but it's available for complete customization.
 *
 * Example:
 *
 * ```ts
 * import { getServeOptions } from "brisa/server";
 *
 * const serveOptions = await getServeOptions();
 *
 * // See Bun.js serve options: https://bun.sh/docs/api/http
 * const server = Bun.serve({
 *  ...serveOptions,
 *  port: 3001,
 * });
 *
 * // Necessary for Brisa internals
 * globalThis.brisaServer = server;
 *
 * console.log(
 *  "Server ready 🥳",
 *  `listening on http://${server.hostname}:${server.port}...`,
 * );
 * ```
 *
 * Docs:
 *
 * - [How to use `getServeOptions`](https://brisa.build/building-your-application/configuring/custom-server)
 */
export async function getServeOptions(): Promise<ServeOptions>;

export interface RenderInitiatorType {
  readonly INITIAL_REQUEST: "INITIAL_REQUEST";
  readonly SPA_NAVIGATION: "SPA_NAVIGATION";
  readonly SERVER_ACTION: "SERVER_ACTION";
}

export const RenderInitiator: RenderInitiatorType;

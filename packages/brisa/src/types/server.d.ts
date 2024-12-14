import type { MatchedBrisaRoute } from '@/types';
import type { ServeOptions, Server } from 'bun';

export type Options = {
  request: Request | RequestContext;
  head?: ComponentType;
  isPage?: boolean;
  applySuspense?: boolean;
};

type RenderMode = 'reactivity' | 'transition';

export type RenderPageProps = {
  withTransition?: boolean;
};

export type RenderComponentProps = {
  element?: JSX.Element;
  target?: string;
  placement?: 'replace' | 'before' | 'after' | 'append' | 'prepend';
  withTransition?: boolean;
};

export type FileSystemRouterOptions = {
  dir: string;
  fileExtensions?: string[];
};

export type FileSystemRouter = {
  routes: [string, string];
  match: (routeToMatch: string) => MatchedBrisaRoute | null;
};

/**
 * Encrypt sensible data to don't be visible on the client and then recover on a server action:
 *
 * ```tsx
 *  <button
 *   onClick={(e: Event) =>
 *     console.log(
 *       decrypt((e.target as HTMLButtonElement).dataset.encrypted)
 *      )
 *   }
 *   data-encrypted={encrypt("hello")}
 * >
 *   Sensible data
 * </button>
 * ```
 */
export function encrypt(textOrObject: unknown): string;

/**
 * Decrypt sensible data on a server action:
 *
 * ```tsx
 *  <button
 *   onClick={(e: Event) =>
 *     console.log(
 *       decrypt((e.target as HTMLButtonElement).dataset.encrypted)
 *      )
 *   }
 *   data-encrypted={encrypt("hello")}
 * >
 *   Sensible data
 * </button>
 * ```
 */
export function decrypt(text: string): unknown;

export function fileSystemRouter(
  options: FileSystemRouterOptions,
): FileSystemRouter;

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
export function renderToString(
  element: JSX.Element,
  options: { request?: Request; applySuspense?: boolean } = {},
): Promise<string>;

/**
 * Description:
 *
 * The `renderPage` method is used to rerender the page inside a server action.
 * Outside of an action, it throws an error.
 *
 * Params:
 *
 * - `withTransition` (optional): A boolean to enable the transition mode. By default, it's `false`.
 *
 * Example:
 *
 * ```ts
 * renderPage();
 * ```
 *
 * Docs:
 *
 * - [How to use `renderPage`](https://brisa.build/api-reference/server-apis/renderPage#renderPage)
 */
export function renderPage(config?: RenderPageProps): never;

/**
 * Description:
 *
 * The `renderComponent` method is used to rerender the component inside a server action.
 * Outside of an action, it throws an error.
 *
 * Also is useful to render an specific component in a specific place.
 *
 * Params:
 *
 * - `element` (optional): The JSX element to render. By default, it's the target component that triggers the action.
 * - `target` (optional): CSS Selector to target the component to render.
 * - `placement` (optional): `replace`, `before`, `after`, `append` or `prepend`. By default, it's `replace`.
 * - `withTransition` (optional): A boolean to enable the transition mode. By default, it's `false`.
 *
 * Example of re-render:
 *
 * ```ts
 * renderComponent();
 * ```
 *
 * Example of render a specific component in a specific place:
 *
 * ```ts
 * renderComponent({ element: <Component />, target: '#target' });
 * ```
 *
 * Docs:
 *
 * - [How to use `renderComponent`](https://brisa.build/api-reference/server-apis/renderComponent#renderComponent)
 */
export function renderComponent(config?: RenderComponentProps): never;

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
export function getServeOptions(): Promise<ServeOptions>;

export interface InitiatorType {
  readonly INITIAL_REQUEST: 'INITIAL_REQUEST';
  readonly SPA_NAVIGATION: 'SPA_NAVIGATION';
  readonly SERVER_ACTION: 'SERVER_ACTION';
  readonly API_REQUEST: 'API_REQUEST';
}

export const Initiator: InitiatorType;

/**
 * This serve function is used to start a Bun.js server.
 *
 * Useful if you want to serve your Brisa application with a custom server.
 *
 * Example:
 *
 * ```ts
 * import { serve } from 'brisa/server';
 *
 * const { port, hostname, server } = serve({ port: 3001 });
 * ```
 *
 * Docs:
 *
 * [Custom Server](https://brisa.build/building-your-application/configuring/custom-server#custom-server)
 */
export function serve(options: ServeOptions): {
  port: number;
  hostname: string;
  server: Server;
};

/**
 * SSRWebComponent is to render a web component on the server side without the help of the compiler.
 *
 * The Brisa compiler already does this work for you, so you can write `<web-component foo="bar" />`
 * directly without worrying. However, there are cases where you want to have a little more control.
 * This component is for this, the previous equivalent would be:
 *
 * ```tsx
 * import { SSRWebComponent } from 'brisa/server';
 * import Component from '@/web-components/web-component';
 *
 * // ...
 * <SSRWebComponent ssr-selector="web-component" ssr-Component={Component} foo="bar" />
 * ```
 *
 * Docs:
 *
 * - [SSRWebComponent](https://brisa.build/api-reference/server-apis/SSRWebComponent)
 */
export function SSRWebComponent<T>(
  props: T & {
    'ssr-selector': string;
    'ssr-Component': ComponentType<T>;
    children?: JSX.Element;
  },
): JSX.Element;

/**
 * `getServer`
 *
 * This method is used to get the server instance.
 *
 * Example:
 *
 * ```ts
 * import { getServer } from 'brisa/server';
 *
 * const { port, hostname, server, subscriberCount } = getServer();
 * ```
 *
 * Docs:
 *
 * - [How to use `getServer`](https://brisa.build/api-reference/server-apis/getServer)
 */
export function getServer(): ReturnType<typeof Bun.serve>;

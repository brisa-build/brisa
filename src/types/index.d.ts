/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { IntrinsicCustomElements } from "@/../build/_brisa/types";
import { BunPlugin, MatchedRoute, ServerWebSocket, TLSOptions } from "bun";
import * as CSS from "csstype";

declare module "bun" {
  interface Env {
    /**
     * Description:
     *
     * The `BRISA_BUILD_FOLDER` is the path to the build folder.
     *
     * Useful to compile C ABI libraries inside the build folder.
     *
     * Docs:
     *
     * - [How to use `BRISA_BUILD_FOLDER`](https://brisa.build/docs/building-your-application/configuring/zig-rust-c-files#create-a-jsts-bridge)
     */
    BRISA_BUILD_FOLDER: string;
  }
}

/**
 * Description:
 *
 * Request context is a set of utilities to use within your server components with the context of the request.
 */
export interface RequestContext extends Request {
  /**
   * Description:
   *
   * The store is a map where you can store any value and use it in any server part:
   * middleware, layout, page, components, api, etc.
   *
   * Example setting a value:
   *
   * ```ts
   * store.set('count', 0);
   * ```
   *
   * Example getting a value:
   *
   * ```ts
   * <div>{store.get('count')}</div>
   * ```
   *
   * Docs:
   *
   * - [How to use `store`](https://brisa.build/docs/components-details/server-components#store-store-method)
   */
  store: Map<string | symbol, any> & {
    /**
     * Description:
     *
     * The `transferToClient` method is used to transfer the store values to the client.
     *
     * Example:
     *
     * ```ts
     * store.transferToClient(['count']);
     * ```
     *
     * Docs:
     *
     * - [How to use `transferToClient`](https://brisa.build/docs/building-your-application/data-fetching/fetching#share-server-web-data-between-components)
     */
    transferToClient: (keys: string[]) => void;
  };

  /**
   * Description:
   *
   * The `useContext` method is used to consume a context value.
   *
   * Example:
   *
   * ```tsx
   * const foo = useContext(context);
   *
   * <div>{foo.value}</div>
   * ```
   *
   * Docs:
   *
   * - [How to use `useContext`](https://brisa.build/docs/components-details/context)
   */
  useContext: <T>(context: BrisaContext<T>) => { value: T };

  /**
   * Description:
   *
   * The route is the matched route of the request.
   *
   * You can access to:
   *
   * params, filePath, pathname, query, name and kind,
   *
   * Example:
   *
   * ```ts
   * <div>{route.pathname}</div>
   * ```
   */
  route: MatchedRoute;

  /**
   * Description:
   *
   * The `i18n` object is a set of utilities to use within your components
   * to access to the locale and consume the translations.
   *
   * Example:
   *
   * ```ts
   * const { t, locale } = i18n;
   *
   * <div>{t('hello-world')}</div>
   * ```
   *
   * Docs:
   *
   * - [How to use `i18n`](https://brisa.build/docs/building-your-application/routing/internationalization)
   */
  i18n: I18n;

  /**
   * Description:
   *
   * The `ws` is the WebSocket instance of the request.
   *
   * Example:
   *
   * ```ts
   * ws.send('Hello World');
   * ```
   *
   * Docs:
   *
   * - [How to use `ws`](https://brisa.build/docs/building-your-application/routing/websockets)
   */
  ws: ServerWebSocket<unknown>;

  /**
   * Description:
   *
   * The `getIP` method returns the IP of the request.
   *
   * Example:
   *
   * ```ts
   * const ip = getIP();
   * ```
   */
  getIP: () => SocketAddress | null;

  /**
   * Description:
   *
   * The `finalURL` is the URL of your page, regardless of the fact that for the users it is another one.
   *
   * Example:
   *
   * User enter to:
   *
   * `/es/sobre-nosotros/`
   *
   * But the `finalURL` is:
   *
   * `/about-us`
   *
   * Because your page is in `src/pages/about-us/index.tsx`
   *
   * Docs:
   *
   * - [How to use `finalURL`](https://brisa.build/docs/building-your-application/routing/internationalization#final-url)
   */
  finalURL: string;

  /**
   * Description:
   *
   * The `id` is the unique identifier of the request. This id is used internally by Brisa,
   * but we expose it to you because it can be useful for tracking.
   *
   * Example:
   *
   * ```ts
   * console.log(id); // 1edfa3c2-e101-40e3-af57-8890795dacd4
   * ```
   *
   * Docs:
   *
   * - [How to use `id`](https://brisa.build/docs/building-your-application/data-fetching/request-context)
   */
  id: string;
}

type Effect = () => void | Promise<void>;
type Cleanup = Effect;

export interface BaseWebContext {
  /**
   * Description:
   *
   * The store is a reactive map where you can store any value and use it in any web-component.
   *
   * Unlike state, instead of being a local component state, store is global for all web-components.
   *
   * Example setting a value:
   *
   * ```ts
   * store.set('count', 0);
   * ```
   *
   * Example getting a value:
   *
   * ```ts
   * <div>{store.get('count')}</div>
   * ```
   *
   * Docs:
   *
   * - [How to use `store`](https://brisa.build/docs/components-details/web-components#store-store-method)
   */
  store: ReactiveMap;

  /**
   * Description:
   *
   * The `useContext` method is used to consume a context value.
   *
   * Example:
   *
   * ```tsx
   * const foo = useContext(context);
   *
   * <div>{foo.value}</div>
   * ```
   *
   * Docs:
   *
   * - [How to use `useContext`](https://brisa.build/docs/components-details/context)
   */
  useContext: <T>(context: BrisaContext<T>) => { value: T };

  /**
   * Description:
   *
   * The state is under a signal. This means that to consume it you have to use the `.value` clause.
   *
   * Whenever a state mutate (change the `.value`) reactively updates these parts of the DOM where the signal has been set.
   *
   * Example declaration:
   *
   * ```ts
   * const count = state<number>(0);
   * ```
   *
   * Example usage:
   *
   * ```ts
   * <div>{count.value}</div>
   * ```
   *
   * Example mutation:
   *
   * ```ts
   * count.value += 1;
   * ```
   *
   * Docs:
   *  - [How to use `state`](https://brisa.build/docs/components-details/web-components#state-state-method)
   */
  state<T>(initialValue?: T): Signal<T>;

  /**
   * Description:
   *
   * The effect is a function that will be executed when the component is mount and
   * every time the state/prop signal that is registered inside changes.
   *
   * Example:
   *
   * ```ts
   * effect(() => { console.log('Hello World') })
   * ```
   *
   *  - will be executed when the component is mount
   *
   * ```ts
   * effect(() => { console.log(count.value) })
   * ```
   *
   *  - will be executed when the component is mount and every time the `count` state changes
   *
   * Docs:
   *
   * - [How to use `effect`](https://brisa.build/docs/components-details/web-components#effect-effect-method)
   */
  effect(fn: Effect): void;

  /**
   * Description:
   *
   * The cleanup is a function that will be executed when the component is unmount or to clean up an effect.
   *
   * Example:
   *
   * ```ts
   * cleanup(() => { console.log('Hello World') })
   * ```
   *
   *  - will be executed when the component is unmount
   *
   * ```ts
   * effect(() => { cleanup(() => { console.log('Hello World') }) })
   * ```
   *
   *  - will be executed when the component is unmount or when the effect is re-executed
   *
   * Docs:
   *
   * - [How to use `cleanup`](https://brisa.build/docs/components-details/web-components#clean-effects-cleanup-method)
   */
  cleanup(fn: Cleanup): void;

  /**
   * Description:
   *
   * The `derived` method is useful to create signals derived from other signals such as state or props.
   *
   * Example of declaration:
   *
   * ```ts
   * const doubleCount = derived(() => count.value * 2);
   * ```
   *
   * Example of usage:
   *
   * ```ts
   * <div>{doubleCount.value}</div>
   * ```
   *
   * Docs:
   *
   * - [How to use `derived`](https://brisa.build/docs/components-details/web-components#derived-state-and-props-derived-method)
   */
  derived<T>(fn: () => T): Signal<T>;

  /**
   * Description:
   *
   * The `onMount` method is triggered only once, when the component has been mounted.
   * In the case that the component is unmounted and mounted again, it will be called again,
   * although it would be another instance of the component starting with its initial state.
   *
   * It is useful for using things during the life of the component, for example document events,
   * or for accessing rendered DOM elements and having control over them.
   *
   * To delete the events recorded during this lifetime, there is the following
   * [`cleanup`](#clean-effects-cleanup-method) method.
   *
   * Example:
   *
   * ```ts
   * onMount(() => { console.log('Yeah! Component has been mounted') })
   * ```
   *
   * Docs:
   *
   * - [How to use `onMount`](https://brisa.build/docs/components-details/web-components#effect-on-mount-onmount-method)
   */
  onMount(fn: Effect): void;

  /**
   * Description:
   *
   * The `css` method is used to inject reactive CSS into the DOM.
   *
   * Example:
   *
   * ```ts
   * css`div { background-color: ${color.value}; }`
   * ```
   *
   * Docs:
   *
   * - [How to use `css`](https://brisa.build/docs/components-details/web-components#template-literal-css)
   */
  css(strings: TemplateStringsArray, ...values: string[]): void;

  /**
   * Description:
   *
   * The `i18n` object is a set of utilities to use within your components
   * to access to the locale and consume the translations.
   *
   * Example:
   *
   * ```ts
   * const { t, locale } = i18n;
   *
   * <div>{t('hello-world')}</div>
   * ```
   *
   * Docs:
   *
   * - [How to use `i18n`](https://brisa.build/docs/building-your-application/routing/internationalization)
   */
  i18n: I18n;

  /**
   * Description:
   *
   * The `reset` method calls all the cleanups and then remove all the
   * effects and cleanups from memory.
   *
   * Please, use it carefully, it is used internally by Brisa. We expose it,
   * but it is not recommended to use it.
   *
   * Example:
   *
   * ```ts
   * reset();
   * ```
   *
   * Docs:
   *
   * - [How to use `reset`](https://brisa.build/docs/building-your-application/data-fetching/web-context#reset)
   */
  reset: () => void;

  /**
   * Description:
   *
   * The `self` attribute is the reference to the web-component itself.
   *
   * It is necessary to watch when to use it, it does not exist during SSR.
   *
   * Example:
   *
   * ```ts
   * effect(() => self.addEventListener('click', () => { console.log('Hello World') }));
   * ```
   *
   * Docs:
   *
   * - [How to use `self`](https://brisa.build/docs/building-your-application/data-fetching/web-context#self)
   */
  self?: HTMLElement;
}

/**
 * Description:
 *
 *  Web Context is a set of utilities to use within your web components without losing the context where you are.
 *  The state, cleanups, effects, and so on, will be applied without conflicting with other components.
 */
export interface WebContext extends BaseWebContext {
  /**
   * The "WebContext" interface extends the BaseWebContext, serving as a foundation
   * for web-related contextual information. It is intentionally void to facilitate
   * extensibility. Developers can leverage the webContextPlugins mechanism to
   * seamlessly augment the WebContext with additional properties, enabling the
   * creation of customized signals as needed.
   *
   * Example (web-context.d.ts):
   *
   * ```ts
   * import 'brisa';
   *
   * declare module 'brisa' {
   *  interface WebContext {
   *    store: BaseWebContext['store'] & {
   *      sync: (key: string, storage?: 'localStorage' | 'sessionStorage') => void;
   *   }
   * }
   * ```
   */
}

type WebContextPluginExtras = {
  /**
   * Description:
   *
   * The `transferredStore` is a map transferred from the server to the client.
   *
   * This is the store after applied the `transferToClient` method.
   */
  transferredStore: Map<string | symbol, any>;

  /**
   *
   * Description:
   *
   * The `reset` method is used to reset all effects, calling all the cleanups.
   */
  reset: () => void;
};

export type WebContextPlugin = (
  webContext: WebContext,
  extras: WebContextPluginExtras,
) => WebContext;

type ReactiveMap = {
  get: <T>(key: string) => T;
  set: <T>(key: string, value: T) => void;
  delete: (key: string) => void;
  Map: Map<string, unknown>;
};

type Props = Record<string, unknown> & {
  children?: JSXElement;
};

export type ResponseHeaders = (
  req: RequestContext,
  status: number,
) => HeadersInit;

export type JSXNode = string | number | null | JSXElement | JSXNode[];

export type Type = string | number | ComponentType | Promise<ComponentType>;

export type Configuration = {
  /**
   * Description:
   *
   * The `trailingSlash` config property is used to add or
   * remove the trailing slash from the URL.
   *
   * Example:
   *
   * ```ts
   * trailingSlash: true
   * ```
   *
   * Then, the URL `/about` will be redirected to `/about/`.
   *
   * Docs:
   *
   * - [How to use `trailingSlash`](https://brisa.build/docs/building-your-application/configuring/trailing-slash)
   */
  trailingSlash?: boolean;

  /**
   * Description:
   *
   * The `assetPrefix` config property is used to add a prefix to the assets.
   *
   * Example:
   *
   * ```ts
   * assetPrefix: 'https://cdn.example.com'
   * ```
   *
   * Then, the image `/assets/image.png` will be redirected to `https://cdn.example.com/assets/image.png`.
   *
   * Docs:
   *
   * - [How to use `assetPrefix`](https://brisa.build/docs/building-your-application/configuring/asset-prefix)
   */
  assetPrefix?: string;

  /**
   * Description:
   *
   * The `plugins` config property is used to add Bun/esbuild plugins
   * to the build process.
   *
   * Example:
   *
   * ```ts
   * plugins: [
   *  {
   *   name: 'my-plugin',
   *   setup(build) {
   *    build.onLoad({ filter: /\.txt$/ }, async (args) => {
   *      return {
   *        contents: 'export default ' + JSON.stringify(args.path) + ';',
   *        loader: 'js',
   *      };
   *    });
   *   },
   * }],
   * ```
   *
   * Docs:
   *
   * - [How to use `plugins`](https://brisa.build/docs/building-your-application/configuring/plugins)
   */
  plugins?: BunPlugin[];

  /**
   * @todo TODO: implement it
   */
  basePath?: string;

  /**
   * Description:
   *
   * The `tls` config property is used to enable HTTPS.
   *
   * Example:
   *
   * ```ts
   * tls: {
   *  cert: Bun.file("cert.pem"),
   *  key: Bun.file("key.pem"),
   * }
   * ```
   *
   * Docs:
   *
   * - [How to use `tls`](https://brisa.build/docs/building-your-application/configuring/tls)
   */
  tls?: TLSOptions;

  /**
   * Description:
   *
   * The `output` config property is used to change the output type.
   *
   * The default value is `server`.
   *
   * Difference between `server`, `static` and `desktop`:
   *
   * - `server`: The output is a server that can be deployed to a server.
   * - `static`: The output is a static export that can be deployed to a static hosting.
   * - `desktop`: The output is a desktop app that can be deployed to a desktop.
   *
   * Example:
   *
   * ```ts
   * output: 'static'
   * ```
   *
   * Docs:
   *
   * - [How to use `output`](https://brisa.build/docs/building-your-application/configuring/output)
   */
  output?: "static" | "server" | "desktop";
};

export type JSXElement =
  | Promise<JSXElement>
  | JSXElement[]
  | JSXNode
  | {
      type: Type;
      props: Props;
    };

export type JSXComponent = (
  props: Props,
  request: RequestContext,
) => JSXNode | Promise<JSXNode>;

export interface I18nDictionary {
  [key: string]: string | I18nDictionary | I18nDictionary[];
}

export interface TranslationQuery {
  [name: string]: any;
}

export type Translations = {
  [locale: string]: string;
};

export type I18nDomainConfig = {
  defaultLocale: string;
  protocol?: "http" | "https";
  dev?: boolean;
};

type i18nPages = {
  [pageName: string]: Translations;
};

export type I18nConfig<T = I18nDictionary> = {
  defaultLocale: string;
  locales: string[];
  domains?: Record<string, I18nDomainConfig>;
  messages?: Record<string, T>;
  interpolation?: {
    prefix?: string;
    suffix?: string;
    format?: (value: unknown, format: string, locale: string) => string;
  };
  allowEmptyStrings?: boolean;
  keySeparator?: string;
  pages?: i18nPages;
  hrefLangOrigin?: string | Translations;
};

type RouterType = {
  match: (req: RequestContext) => {
    route: MatchedRoute | null;
    isReservedPathname: boolean;
  };
  reservedRoutes: Record<string, MatchedRoute | null>;
};

type RemovePlural<Key extends string> = Key extends `${infer Prefix}${
  | "_zero"
  | "_one"
  | "_two"
  | "_few"
  | "_many"
  | "_other"
  | `_${number}`}`
  ? Prefix
  : Key;

type Join<S1, S2> = S1 extends string
  ? S2 extends string
    ? `${S1}.${S2}`
    : never
  : never;

export type Paths<T> = RemovePlural<
  {
    [K in Extract<keyof T, string>]: T[K] extends Record<string, unknown>
      ? Join<K, Paths<T[K]>>
      : K;
  }[Extract<keyof T, string>]
>;

type ExtendedWebContext =
  typeof import("@/web-components/_integrations").ExtendedWebContext;

type I18nKey = typeof import("@/i18n").default extends I18nConfig<infer T>
  ? Paths<T extends object ? T : I18nDictionary>
  : string;

export type TranslateOptions = {
  returnObjects?: boolean;
  fallback?: string | string[];
  default?: T | string;
  elements?: JSX.Element[] | Record<string, JSX.Element>;
};

export type PageModule = {
  default: (props: { error?: Error }) => JSX.Element;
  responseHeaders?: (req: Request, status: number) => HeadersInit;
  Head?: ComponentType;
};

export type Translate = <T extends unknown = string>(
  i18nKey: I18nKey,
  query?: TranslationQuery | null,
  options?: TranslateOptions,
) => T;

export type I18n = {
  locale: string;
  defaultLocale: string;
  locales: string[];
  pages: i18nPages;
  t: Translate;

  /**
   * Description:
   *
   * The `overrideMessages` method is used to override the messages of the current session.
   *
   * Example:
   *
   * ```ts
   * overrideMessages((originalMessages) => ({ ...originalMessages, 'hello-world': 'Hello World' }));
   * ```
   *
   * Docs:
   *
   * - [How to use `overrideMessages`](https://brisa.build/docs/building-your-application/routing/internationalization#override-translations)
   */
  overrideMessages: <T = Record<string, unknown>>(callback: (T) => T) => void;
};

export interface ComponentType extends JSXComponent {
  error: (
    props: Props & {
      error?: Error;
    },
    request: RequestContext,
  ) => JSXNode | Promise<JSXNode>;
}

export type ContextProvider<T> = {
  context: BrisaContext<T>;
  value: T;
  store: Map<string | symbol, any>;
  webComponentSymbol?: symbol;
};

export type BrisaContext<T> = {
  defaultValue: T;
  id: string;
};

export type Signal<T> = { value: T };

/**
 * Description:
 *
 * `createContext` is used to create a context with a default value.
 *
 * This context should be used with the `context-provider` in order to
 * set a shared value to a sub-tree of components.
 *
 * Example provider:
 *
 * ```tsx
 * <context-provider context={context} value={value}>
 *  {children}
 * </context-provider>
 * ```
 *
 * So, all the children of this provider will have access to the value
 * of the context.
 *
 * Example consumer:
 *
 * ```tsx
 * <div>{context.value}</div>
 * ```
 *
 * Example updating the provider value from any sub-tree component:
 *
 * ```tsx
 * context.value = 'foo';
 * ```
 *
 * Docs:
 *
 * - [How to use `createContext`](https://brisa.build/docs/components-details/server-components#create-context-createcontext)
 */
export function createContext<T>(defaultValue?: T): BrisaContext<T>;

/**
 * Description:
 *
 *   Inject HTML string to the DOM.
 *
 * Example:
 *
 * ```ts
 * <div>{dangerHTML('<h1>Hello World</h1>')}</div>
 * ```
 *
 * Docs:
 *
 * - [How to use `dangerHTML`](https://brisa.build/docs/components-details/web-components#inject-html-dangerhtml)
 */
export function dangerHTML(html: string): DangerHTMLOutput;

/**
 * Description:
 *
 * The `notFound` method throws an error and is used to render the 404 page.
 *
 * Example:
 *
 * ```ts
 * notFound();
 * ```
 *
 * Docs:
 *
 * - [How to use `notFound`](https://brisa.build/docs/building-your-application/routing/custom-error#notfound-function)
 */
export function notFound(): never;

/**
 * Description:
 *
 * The `navigate` method throws an error to proceed a 301 redirect.
 *
 * If used during streaming or on the client, navigation is done from the client.
 *
 * Example:
 *
 * ```ts
 * navigate('/some-page');
 * ```
 *
 * Docs:
 *
 * - [How to use `navigate`](https://brisa.build/docs/building-your-application/routing/linking-and-navigating#navigate-function)
 */
export function navigate(page: string): never;

type DangerHTMLOutput = {
  type: "HTML";
  props: {
    html: string;
  };
};

/**
 * Description:
 *
 *   `createPortal` lets you render some children into a different part of the DOM.
 *
 *    To create a portal, call `createPortal`, passing some JSX, and the DOM node where it should be rendered.
 *
 * Example:
 *
 * ```ts
 * <div>{createPortal(<h1>Hello World</h1>, document.body)}</div>
 * ```
 *
 * Docs:
 *
 * - [How to use `createPortal`](https://brisa.build/docs/components-details/web-components#portals-createportal)
 */
export function createPortal(
  element: JSX.Element,
  target: HTMLElement,
): CreatePortalOutput;

type CreatePortalOutput = {
  type: "portal";
  props: {
    element: JSX.Element;
    target: HTMLElement;
  };
};

export interface BrisaDOMAttributes {
  /**
   * Description:
   *
   * The "children" property is used to display the content between the opening and closing tags.
   *
   * Example:
   *
   * ```tsx
   * <div>Hello World</div>
   * ```
   *
   * The "Hello World" string is the children of the div.
   *
   * It's also supported like this (but not recommended):
   *
   * ```tsx
   * <div children="Hello World" />
   * ```
   */
  children?: JSXElement;

  /**
   * Description:
   *
   * The "key" property is used to identify the element.
   *
   * Useful to unmount and mount the web-component again when the key changes.
   *
   * Example:
   *
   * ```tsx
   * <div key="foo" />
   * ```
   */
  key?: string | number | symbol | undefined;

  /**
   * Description:
   *
   * The "ref" property is used to get the reference of the element.
   *
   * Once you have the reference, you can access to the element DOM properties.
   *
   * Example:
   *
   * ```tsx
   * export default ({}, { onMount, cleanup, state }: WebContext) => {
   *  const ref = state(null);
   *
   *  function onClick(e) {
   *    console.log("Event via ref", e);
   *  }
   *
   *  onMount(() => ref.value.addEventListener("click", onClick));
   *  cleanup(() => ref.value.removeEventListener("click", onClick));
   *
   *  return <div ref={ref}>Example</div>;
   * };
   * ```
   *
   * Docs:
   *
   * - [How to use `ref`](https://brisa.build/docs/components-details/web-components#events-on-ref)
   */
  ref?: Signal<unknown>;
}

declare global {
  export namespace JSX {
    type Element = JSXElement;

    interface ElementChildrenAttribute {
      children: JSXElement;
    }

    interface ContextProviderAttributes<
      Target extends EventTarget = HTMLElement,
    > extends HTMLAttributes<Target> {
      context: BrisaContext<unknown>;
      value: unknown;
      children: unknown;
      serverOnly?: boolean;
    }

    export type WebComponentAttributes<T extends (...args: any[]) => any> = {
      [K in keyof Parameters<T>[0]]: Parameters<T>[0][K];
    } & {
      children?: JSXElement;
      skipSSR?: boolean;
    } & HTMLAttributes<HTMLElement>;

    export interface CSSProperties extends CSS.Properties<string | number> {
      /**
       * The index signature was removed to enable closed typing for style
       * using CSSType. You're able to use type assertion or module augmentation
       * to add properties or an index signature of your own.
       *
       * For examples and more information, visit:
       * https://github.com/frenic/csstype#what-should-i-do-when-i-get-type-errors
       */
    }

    // All the WAI-ARIA 1.1 attributes from https://www.w3.org/TR/wai-aria-1.1/
    export interface AriaAttributes {
      /**
       * Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-activedescendant)
       */
      "aria-activedescendant"?: string | undefined;
      /**
       * Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute.
       *
       *  - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-atomic)
       */
      "aria-atomic"?: boolean | undefined;
      /**
       * Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
       * presented if they are made.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-autocomplete)
       */
      "aria-autocomplete"?: "none" | "inline" | "list" | "both" | undefined;
      /**
       * Defines a string value that labels the current element, which is intended to be converted into Braille.
       * @see aria-label.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-braillelabel)
       */
      "aria-braillelabel"?: string | undefined;
      /**
       * Defines a human-readable, author-localized abbreviated description for the role of an element, which is intended to be converted into Braille.
       * @see aria-roledescription.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-brailleroledescription)
       */
      "aria-brailleroledescription"?: string | undefined;
      /**
       *  Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-busy)
       */
      "aria-busy"?: boolean | undefined;
      /**
       * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
       * @see aria-pressed
       * @see aria-selected.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-checked)
       */
      "aria-checked"?: boolean | "mixed" | undefined;
      /**
       * Defines the total number of columns in a table, grid, or treegrid.
       * @see aria-colindex.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-colcount)
       */
      "aria-colcount"?: number | undefined;
      /**
       * Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.
       * @see aria-colcount
       * @see aria-colspan.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-colindex)
       */
      "aria-colindex"?: number | undefined;
      /**
       * Defines a human readable text alternative of aria-colindex.
       * @see aria-rowindextext.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-colindextext)
       */
      "aria-colindextext"?: string | undefined;
      /**
       * Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.
       * @see aria-colindex
       * @see aria-rowspan.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-colspan)
       */
      "aria-colspan"?: number | undefined;
      /**
       * Identifies the element (or elements) whose contents or presence are controlled by the current element.
       * @see aria-owns.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-controls)
       */
      "aria-controls"?: string | undefined;
      /**
       * Indicates the element that represents the current item within a container or set of related elements.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current)
       */
      "aria-current"?:
        | boolean
        | "page"
        | "step"
        | "location"
        | "date"
        | "time"
        | undefined;
      /**
       * Identifies the element (or elements) that describes the object.
       * @see aria-labelledby
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby)
       */
      "aria-describedby"?: string | undefined;
      /**
       * Defines a string value that describes or annotates the current element.
       * @see related aria-describedby.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-description)
       */
      "aria-description"?: string | undefined;
      /**
       * Identifies the element that provides a detailed, extended description for the object.
       * @see aria-describedby.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-details)
       */
      "aria-details"?: string | undefined;
      /**
       * Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
       * @see aria-hidden
       * @see aria-readonly.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-disabled)
       */
      "aria-disabled"?: boolean | undefined;
      /**
       * Identifies the element that provides an error message for the object.
       * @see aria-invalid
       * @see aria-describedby.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-errormessage)
       */
      "aria-errormessage"?: string | undefined;
      /**
       * Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-expanded)
       */
      "aria-expanded"?: boolean | undefined;
      /**
       * Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
       * allows assistive technology to override the general default of reading in document source order.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-flowto)
       */
      "aria-flowto"?: string | undefined;
      /**
       * Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-haspopup)
       */
      "aria-haspopup"?:
        | boolean
        | "menu"
        | "listbox"
        | "tree"
        | "grid"
        | "dialog"
        | undefined;
      /**
       * Indicates whether the element is exposed to an accessibility API.
       * @see aria-disabled.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden)
       */
      "aria-hidden"?: boolean | undefined;
      /**
       * Indicates the entered value does not conform to the format expected by the application.
       * @see aria-errormessage.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-invalid)
       */
      "aria-invalid"?: boolean | "grammar" | "spelling" | undefined;
      /**
       *  Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-keyshortcuts)
       */
      "aria-keyshortcuts"?: string | undefined;
      /**
       * Defines a string value that labels the current element.
       * @see aria-labelledby.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label)
       */
      "aria-label"?: string | undefined;
      /**
       * Identifies the element (or elements) that labels the current element.
       * @see aria-describedby.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby)
       */
      "aria-labelledby"?: string | undefined;
      /**
       * Defines the hierarchical level of an element within a structure.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-level)
       */
      "aria-level"?: number | undefined;
      /**
       * Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live)
       */
      "aria-live"?: "off" | "assertive" | "polite" | undefined;
      /**
       * Indicates whether an element is modal when displayed.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-modal)
       */
      "aria-modal"?: boolean | undefined;
      /**
       * Indicates whether a text box accepts multiple lines of input or only a single line.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-multiline)
       */
      "aria-multiline"?: boolean | undefined;
      /**
       * Indicates that the user may select more than one item from the current selectable descendants.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-multiselectable)
       */
      "aria-multiselectable"?: boolean | undefined;
      /**
       * Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-orientation)
       */
      "aria-orientation"?: "horizontal" | "vertical" | undefined;
      /**
       * Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
       * between DOM elements where the DOM hierarchy cannot be used to represent the relationship.
       * @see aria-controls.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-owns)
       */
      "aria-owns"?: string | undefined;
      /**
       * Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
       * A hint could be a sample value or a brief description of the expected format.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-placeholder)
       */
      "aria-placeholder"?: string | undefined;
      /**
       * Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
       * @see aria-setsize.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-posinset)
       */
      "aria-posinset"?: number | undefined;
      /**
       * Indicates the current "pressed" state of toggle buttons.
       * @see aria-checked
       * @see aria-selected.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-pressed)
       */
      "aria-pressed"?: boolean | "mixed" | undefined;
      /**
       * Indicates that the element is not editable, but is otherwise operable.
       * @see aria-disabled.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-readonly)
       */
      "aria-readonly"?: boolean | undefined;
      /**
       * Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.
       * @see aria-atomic.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-relevant)
       */
      "aria-relevant"?:
        | "additions"
        | "additions removals"
        | "additions text"
        | "all"
        | "removals"
        | "removals additions"
        | "removals text"
        | "text"
        | "text additions"
        | "text removals"
        | undefined;
      /**
       * Indicates that user input is required on the element before a form may be submitted.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-required)
       */
      "aria-required"?: boolean | undefined;
      /**
       * Defines a human-readable, author-localized description for the role of an element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-roledescription)
       */
      "aria-roledescription"?: string | undefined;
      /**
       * Defines the total number of rows in a table, grid, or treegrid.
       * @see aria-rowindex.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-rowcount)
       */
      "aria-rowcount"?: number | undefined;
      /**
       * Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.
       * @see aria-rowcount
       * @see aria-rowspan.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-rowindex)
       */
      "aria-rowindex"?: number | undefined;
      /**
       * Defines a human readable text alternative of aria-rowindex.
       * @see aria-colindextext.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-rowindextext)
       */
      "aria-rowindextext"?: string | undefined;
      /**
       * Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
       * @see aria-rowindex
       * @see aria-colspan.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-rowspan)
       */
      "aria-rowspan"?: number | undefined;
      /**
       * Indicates the current "selected" state of various widgets.
       * @see aria-checked
       * @see aria-pressed.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-selected)
       */
      "aria-selected"?: boolean | undefined;
      /**
       * Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
       * @see aria-posinset.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-setsize)
       */
      "aria-setsize"?: number | undefined;
      /**
       * Indicates if items in a table or grid are sorted in ascending or descending order.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-sort)
       */
      "aria-sort"?: "none" | "ascending" | "descending" | "other" | undefined;
      /**
       * Defines the maximum allowed value for a range widget.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-valuemax)
       */
      "aria-valuemax"?: number | undefined;
      /**
       * Defines the minimum allowed value for a range widget.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-valuemin)
       */
      "aria-valuemin"?: number | undefined;
      /**
       * Defines the current value for a range widget.
       * @see aria-valuetext.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-valuenow)
       */
      "aria-valuenow"?: number | undefined;
      /**
       * Defines the human readable text alternative of aria-valuenow for a range widget.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-valuetext)
       */
      "aria-valuetext"?: string | undefined;
    }

    // All the WAI-ARIA 1.2 role attribute values from https://www.w3.org/TR/wai-aria-1.2/#role_definitions
    type AriaRole =
      | "alert"
      | "alertdialog"
      | "application"
      | "article"
      | "banner"
      | "blockquote"
      | "button"
      | "caption"
      | "cell"
      | "checkbox"
      | "code"
      | "columnheader"
      | "combobox"
      | "command"
      | "complementary"
      | "composite"
      | "contentinfo"
      | "definition"
      | "deletion"
      | "dialog"
      | "directory"
      | "document"
      | "emphasis"
      | "feed"
      | "figure"
      | "form"
      | "generic"
      | "grid"
      | "gridcell"
      | "group"
      | "heading"
      | "img"
      | "input"
      | "insertion"
      | "landmark"
      | "link"
      | "list"
      | "listbox"
      | "listitem"
      | "log"
      | "main"
      | "marquee"
      | "math"
      | "meter"
      | "menu"
      | "menubar"
      | "menuitem"
      | "menuitemcheckbox"
      | "menuitemradio"
      | "navigation"
      | "none"
      | "note"
      | "option"
      | "paragraph"
      | "presentation"
      | "progressbar"
      | "radio"
      | "radiogroup"
      | "range"
      | "region"
      | "roletype"
      | "row"
      | "rowgroup"
      | "rowheader"
      | "scrollbar"
      | "search"
      | "searchbox"
      | "section"
      | "sectionhead"
      | "select"
      | "separator"
      | "slider"
      | "spinbutton"
      | "status"
      | "strong"
      | "structure"
      | "subscript"
      | "superscript"
      | "switch"
      | "tab"
      | "table"
      | "tablist"
      | "tabpanel"
      | "term"
      | "textbox"
      | "time"
      | "timer"
      | "toolbar"
      | "tooltip"
      | "tree"
      | "treegrid"
      | "treeitem"
      | "widget"
      | "window"
      | "none presentation";

    export interface SVGAttributes<Target extends EventTarget = SVGElement>
      extends HTMLAttributes<Target> {
      /**
       * The accumulate attribute is used to create a simple slide show of elements, where each new element replaces the previous one.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/accumulate)
       */
      accumulate?: "none" | "sum" | undefined;
      /**
       * The additive attribute controls whether or not an animation is additive.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/additive)
       */
      additive?: "replace" | "sum" | undefined;
      /**
       * The alignment-baseline attribute specifies how an object is aligned with respect to its parent.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/alignment-baseline)
       */
      alignmentBaseline?:
        | "auto"
        | "baseline"
        | "before-edge"
        | "text-before-edge"
        | "middle"
        | "central"
        | "after-edge"
        | "text-after-edge"
        | "ideographic"
        | "alphabetic"
        | "hanging"
        | "mathematical"
        | "inherit"
        | undefined;
      "alignment-baseline"?:
        | "auto"
        | "baseline"
        | "before-edge"
        | "text-before-edge"
        | "middle"
        | "central"
        | "after-edge"
        | "text-after-edge"
        | "ideographic"
        | "alphabetic"
        | "hanging"
        | "mathematical"
        | "inherit"
        | undefined;
      /**
       * The attributeName attribute defines the name of the attribute to be changed.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/attributeName)
       */
      attributeName?: string | undefined;
      /**
       * The attributeName attribute defines the namespace of the attribute to be changed.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/attributeType)
       */
      attributeType?: string | undefined;
      /**
       * The baseFrequency attribute represents the base frequency parameter for the noise function of the <feTurbulence> filter primitive.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/baseFrequency)
       */
      baseFrequency?: number | string | undefined;
      /**
       * The begin attribute defines the begin time for the element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/begin)
       */
      begin?: number | string | undefined;
      /**
       * The bias attribute shifts the range of the filter.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/bias)
       */
      bias?: number | string | undefined;
      /**
       * The by attribute specifies a relative offset value for an attribute that will be modified during an animation.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/by)
       */
      by?: number | string | undefined;
      /**
       * The calcMode attribute defines the interpolation mode for the animation.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/calcMode)
       */
      calcMode?: number | string | undefined;
      /**
       * The clip attribute is a presentation attribute defining the visible region of an element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/clip)
       */
      clip?: number | string | undefined;
      /**
       * The clip-path presentation attribute defines or associates a clipping path with the element it is related to.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/clip-path)
       */
      clipPath?: string | undefined;
      /**
       * The clip-path presentation attribute defines or associates a clipping path with the element it is related to.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/clip-path)
       */
      "clip-path"?: string | undefined;
      /**
       * The clipPathUnits attribute defines the coordinate system for the contents of the <clipPath> element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/clipPathUnits)
       */
      clipPathUnits?: number | string | undefined;
      /**
       * The clip-rule attribute only applies to graphics elements that are contained within a <clipPath> element.
       *
       * The clip-rule attribute basically works as the fill-rule attribute, except that it applies to <clipPath> definitions.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/clip-rule)
       */
      clipRule?: number | string | undefined;
      /**
       * The clip-rule attribute only applies to graphics elements that are contained within a <clipPath> element.
       *
       * The clip-rule attribute basically works as the fill-rule attribute, except that it applies to <clipPath> definitions.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/clip-rule)
       */
      "clip-rule"?: number | string | undefined;
      /**
       * The color attribute is used to provide a potential indirect value (currentColor) for the fill, stroke, stop-color, flood-color and lighting-color attributes.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/color)
       */
      colorInterpolation?: number | string | undefined;
      /**
       * The color attribute is used to provide a potential indirect value (currentColor) for the fill, stroke, stop-color, flood-color and lighting-color attributes.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/color)
       */
      "color-interpolation"?: number | string | undefined;
      /**
       * The color-interpolation-filters attribute specifies the color space for imaging operations performed via filter effects.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/color-interpolation-filters)
       */
      colorInterpolationFilters?:
        | "auto"
        | "sRGB"
        | "linearRGB"
        | "inherit"
        | undefined;
      /**
       * The color-interpolation-filters attribute specifies the color space for imaging operations performed via filter effects.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/color-interpolation-filters)
       */
      "color-interpolation-filters"?:
        | "auto"
        | "sRGB"
        | "linearRGB"
        | "inherit"
        | undefined;
      /**
       * The cursor attribute specifies the mouse cursor displayed when the mouse pointer is over an element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/cursor)
       */
      cursor?: number | string | undefined;
      /**
       * The cx attribute defines the x-coordinate of the center of the circle.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/cx)
       */
      cx?: number | string | undefined;
      /**
       * The cy attribute defines the y-coordinate of the center of the circle.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/cy)
       */
      cy?: number | string | undefined;
      /**
       * The d attribute defines a path to be drawn.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d)
       */
      d?: string | undefined;
      /**
       * The diffuseConstant attribute defines the constant kd in the Phong lighting model.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/diffuseConstant)
       */
      diffuseConstant?: number | string | undefined;
      /**
       * The direction attribute defines the filter function that is used to stretch an image.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/direction)
       */
      direction?: number | string | undefined;
      /**
       * The display attribute is used to define the visibility of an element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/display)
       */
      display?: number | string | undefined;
      /**
       * The divisor attribute defines the number to divide the input value by.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/divisor)
       */
      divisor?: number | string | undefined;
      /**
       * The dominant-baseline attribute is used to determine or re-determine a scaled-baseline-table.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/dominant-baseline)
       */
      dominantBaseline?: number | string | undefined;
      /**
       * The dominant-baseline attribute is used to determine or re-determine a scaled-baseline-table.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/dominant-baseline)
       */
      "dominant-baseline"?: number | string | undefined;
      /**
       * The dur attribute defines the duration of the animation.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/dur)
       */
      dur?: number | string | undefined;
      /**
       * The dx attribute defines a list of numbers that indicate horizontal displacement.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/dx)
       */
      dx?: number | string | undefined;
      /**
       * The dy attribute defines a list of numbers that indicate vertical displacement.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/dy)
       */
      dy?: number | string | undefined;
      /**
       * The edgeMode attribute defines the edge mode for the filter primitive.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/edgeMode)
       */
      edgeMode?: number | string | undefined;
      /**
       * The elevation attribute defines the light source's position.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/elevation)
       */
      elevation?: number | string | undefined;
      /**
       * The end attribute defines the end value of the animation.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/end)
       */
      end?: number | string | undefined;
      /**
       * The exponent attribute defines the exponent to use in the gamma function.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/exponent)
       */
      exponent?: number | string | undefined;
      /**
       * The fill attribute is a presentation attribute that defines the color of the interior of the given graphical element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill)
       */
      fill?: string | undefined;
      /**
       * The fill-opacity attribute is a presentation attribute defining the opacity of the paint server used to paint the interior of the given graphical element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-opacity)
       */
      fillOpacity?: number | string | undefined;
      /**
       * The fill-opacity attribute is a presentation attribute defining the opacity of the paint server used to paint the interior of the given graphical element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-opacity)
       */
      "fill-opacity"?: number | string | undefined;
      /**
       * The fill-rule attribute indicates the algorithm which is to be used to determine what side of a path is inside the shape.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-rule)
       */
      fillRule?: "nonzero" | "evenodd" | "inherit" | undefined;
      /**
       * The fill-rule attribute indicates the algorithm which is to be used to determine what side of a path is inside the shape.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-rule)
       */
      "fill-rule"?: "nonzero" | "evenodd" | "inherit" | undefined;
      /**
       * The filter attribute references a filter to be applied to the given element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/filter)
       */
      filter?: string | undefined;
      /**
       * The filterUnits attribute defines the coordinate system for attributes x, y, width and height.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/filterUnits)
       */
      filterUnits?: number | string | undefined;
      /**
       * The flood-color attribute defines the color to use to flood the current filter primitive subregion.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/flood-color)
       */
      floodColor?: number | string | undefined;
      /**
       * The flood-color attribute defines the color to use to flood the current filter primitive subregion.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/flood-color)
       */
      "flood-color"?: number | string | undefined;
      /**
       * The flood-opacity attribute defines the opacity value to use across the current filter primitive subregion.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/flood-opacity)
       */
      floodOpacity?: number | string | undefined;
      /**
       * The flood-opacity attribute defines the opacity value to use across the current filter primitive subregion.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/flood-opacity)
       */
      "flood-opacity"?: number | string | undefined;
      /**
       * The font-family attribute allows for multiple comma-separated values as a fallback system.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/font-family)
       */
      fontFamily?: string | undefined;
      /**
       * The font-family attribute allows for multiple comma-separated values as a fallback system.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/font-family)
       */
      "font-family"?: string | undefined;
      /**
       * The font-size attribute refers to the size of the font from baseline to baseline when multiple lines of text are set solid in a multiline layout environment.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/font-size)
       */
      fontSize?: number | string | undefined;
      /**
       * The font-size attribute refers to the size of the font from baseline to baseline when multiple lines of text are set solid in a multiline layout environment.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/font-size)
       */
      "font-size"?: number | string | undefined;
      /**
       * The font-size-adjust attribute allows authors to specify an aspect value for an element that will preserve the x-height of the first choice font.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/font-size-adjust)
       */
      fontSizeAdjust?: number | string | undefined;
      /**
       * The font-size-adjust attribute allows authors to specify an aspect value for an element that will preserve the x-height of the first choice font.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/font-size-adjust)
       */
      "font-size-adjust"?: number | string | undefined;
      /**
       * The font-stretch attribute refers to the normal, condensed, and expanded faces.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/font-stretch)
       */
      fontStretch?: number | string | undefined;
      /**
       * The font-stretch attribute refers to the normal, condensed, and expanded faces.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/font-stretch)
       */
      "font-stretch"?: number | string | undefined;
      /**
       * The font-style attribute refers to the slant of the glyphs in the font.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/font-style)
       */
      fontStyle?: number | string | undefined;
      /**
       * The font-style attribute refers to the slant of the glyphs in the font.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/font-style)
       */
      "font-style"?: number | string | undefined;
      /**
       * The font-variant attribute refers to the normal, small-caps and inherit faces.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/font-variant)
       */
      fontVariant?: number | string | undefined;
      /**
       * The font-variant attribute refers to the normal, small-caps and inherit faces.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/font-variant)
       */
      "font-variant"?: number | string | undefined;
      /**
       * The font-weight attribute refers to the boldness of the glyphs in the font.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/font-weight)
       */
      fontWeight?: number | string | undefined;
      /**
       * The font-weight attribute refers to the boldness of the glyphs in the font.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/font-weight)
       */
      "font-weight"?: number | string | undefined;
      /**
       * The from attribute defines the start interval value of the animation.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/from)
       */
      from?: number | string | undefined;
      /**
       * The fx attribute defines the x-coordinate of the focal point of the lighting effect.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fx)
       */
      fx?: number | string | undefined;
      /**
       * The fy attribute defines the y-coordinate of the focal point of the lighting effect.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fy)
       */
      fy?: number | string | undefined;
      /**
       * The gradientTransform attribute specifies a transformation that is applied to the gradient.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/gradientTransform)
       */
      gradientTransform?: string | undefined;
      /**
       * The gradientUnits attribute specifies the coordinate system for attributes x1, y1, x2, y2.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/gradientUnits)
       */
      gradientUnits?: string | undefined;
      /**
       * The image-rendering attribute provides a hint to the renderer about what tradeoffs to make as it renders the graphic.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/image-rendering)
       */
      imageRendering?: number | string | undefined;
      /**
       * The image-rendering attribute provides a hint to the renderer about what tradeoffs to make as it renders the graphic.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/image-rendering)
       */
      "image-rendering"?: number | string | undefined;
      /**
       * The in2 attribute identifies the second input for the given filter primitive. It works exactly like the in attribute.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/in2)
       */
      in2?: number | string | undefined;
      /**
       * The in attribute identifies input for the given filter primitive.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/in)
       */
      in?: string | undefined;
      /**
       * The intercept attribute defines the intercept of the linear function.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/intercept)
       */
      intercept?: number | string | undefined;
      /**
       * The k1 attribute defines the first coefficient of the linear function.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/k1)
       */
      k1?: number | string | undefined;
      /**
       * The k2 attribute defines the second coefficient of the linear function.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/k2)
       */
      k2?: number | string | undefined;
      /**
       * The k3 attribute defines the third coefficient of the linear function.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/k3)
       */
      k3?: number | string | undefined;
      /**
       * The k4 attribute defines the fourth coefficient of the linear function.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/k4)
       */
      k4?: number | string | undefined;
      /**
       * The kernelMatrix attribute defines a convolution matrix that is used to modify an image using a matrix of values.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/kernelMatrix)
       */
      kernelMatrix?: number | string | undefined;
      /**
       * The keyPoints attribute defines the key points for the gradient.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/keyPoints)
       */
      keyPoints?: number | string | undefined;
      /**
       * The keySplines attribute defines the control points for a cubic Bézier function that controls the rate of change of the animation value.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/keySplines)
       */
      keySplines?: number | string | undefined;
      /**
       * The keyTimes attribute defines the time of the key points.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/keyTimes)
       */
      keyTimes?: number | string | undefined;
      /**
       * The lengthAdjust attribute indicates the type of adjustment which will be made for the given text.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/lengthAdjust)
       */
      lengthAdjust?: number | string | undefined;
      /**
       * The lengthSpacing attribute defines the spacing behavior between text characters.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/CSS/letter-spacing)
       */
      letterSpacing?: number | string | undefined;
      /**
       * The lengthSpacing attribute defines the spacing behavior between text characters.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/CSS/letter-spacing)
       */
      "letter-spacing"?: number | string | undefined;
      /**
       * The lighting-color attribute defines the color of the light source for filter primitives feDiffuseLighting and feSpecularLighting.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/lighting-color)
       */
      lightingColor?: number | string | undefined;
      /**
       * The lighting-color attribute defines the color of the light source for filter primitives feDiffuseLighting and feSpecularLighting.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/lighting-color)
       */
      "lighting-color"?: number | string | undefined;
      /**
       * The limitingConeAngle attribute represents the angle of the cone.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/limitingConeAngle)
       */
      limitingConeAngle?: number | string | undefined;
      /**
       * The marker-end attribute defines the arrowhead or polymarker that will be drawn at the final vertex of the given <path> element or basic shape.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/marker-end)
       */
      markerEnd?: string | undefined;
      /**
       * The marker-end attribute defines the arrowhead or polymarker that will be drawn at the final vertex of the given <path> element or basic shape.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/marker-end)
       */
      "marker-end"?: string | undefined;
      /**
       * The markerHeight attribute defines the height of the viewport into which the marker is to be fitted when it is rendered.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/markerHeight)
       */
      markerHeight?: number | string | undefined;
      /**
       * The marker-height attribute defines the height of the viewport into which the marker is to be fitted when it is rendered.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/markerHeight)
       */
      "marker-height"?: number | string | undefined;
      /**
       * The markerMid attribute defines the arrowhead or polymarker that will be drawn at every vertex other than the first and last vertex of the given <path> element or basic shape.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/marker-mid)
       */
      markerMid?: string | undefined;
      /**
       * The markerMid attribute defines the arrowhead or polymarker that will be drawn at every vertex other than the first and last vertex of the given <path> element or basic shape.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/marker-mid)
       */
      "marker-mid"?: string | undefined;
      /**
       * The markerStart attribute defines the arrowhead or polymarker that will be drawn at the first vertex of the given <path> element or basic shape.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/marker-start)
       */
      markerStart?: string | undefined;
      /**
       * The markerStart attribute defines the arrowhead or polymarker that will be drawn at the first vertex of the given <path> element or basic shape.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/marker-start)
       */
      "marker-start"?: string | undefined;
      /**
       * The markerUnits attribute defines the coordinate system for the attributes markerWidth, markerHeight and the contents of the marker.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/markerUnits)
       */
      markerUnits?: number | string | undefined;
      /**
       * The markerWidth attribute defines the width of the viewport into which the marker is to be fitted when it is rendered.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/markerWidth)
       */
      markerWidth?: number | string | undefined;
      /**
       * The marker-width attribute defines the width of the viewport into which the marker is to be fitted when it is rendered.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/markerWidth)
       */
      mask?: string | undefined;
      /**
       * The mask attribute references a <mask> element that defines the mask to use.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/mask)
       */
      maskContentUnits?: number | string | undefined;
      /**
       * The maskUnits attribute defines the coordinate system for attributes x, y, width and height.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/maskUnits)
       */
      maskUnits?: number | string | undefined;
      /**
       * The mode attribute defines the blending mode used in the feBlend filter primitive.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/mode)
       */
      mode?: number | string | undefined;
      /**
       * The numOctaves attribute defines the number of octaves for the noise.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/numOctaves)
       */
      numOctaves?: number | string | undefined;
      /**
       * The offset attribute shifts the filter primitive as if it were rendered at a different location.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/CSS/offset)
       */
      offset?: number | string | undefined;
      /**
       * The opacity attribute specifies the transparency of an object or of a group of objects, that is, the degree to which the background behind the element is overlaid.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/opacity)
       */
      opacity?: number | string | undefined;
      /**
       * The operator attribute defines the compositing operation that is to be performed.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/operator)
       */
      operator?: number | string | undefined;
      /**
       * The order attribute specifies the order for the filter primitive.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/order)
       */
      order?: number | string | undefined;
      /**
       * The orient attribute indicates how the gradient is oriented.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/orient)
       */
      orient?: number | string | undefined;
      /**
       * The origin attribute defines the origin of the gradient.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/origin)
       */
      origin?: number | string | undefined;
      /**
       * The overflow attribute specifies what to do with elements that render outside the viewport area.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/overflow)
       */
      overflow?: number | string | undefined;
      /**
       * The overlinePosition attribute defines the position of the overline text decoration on text.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/overline-position)
       */
      overlinePosition?: number | string | undefined;
      /**
       * The overlinePosition attribute defines the position of the overline text decoration on text.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/overline-position)
       */
      "overline-position"?: number | string | undefined;
      /**
       * The overlineThickness attribute defines the thickness of the overline text decoration on text.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/overline-thickness)
       */
      overlineThickness?: number | string | undefined;
      /**
       * The overlineThickness attribute defines the thickness of the overline text decoration on text.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/overline-thickness)
       */
      "overline-thickness"?: number | string | undefined;
      /**
       * The paint-order attribute defines the order for painting objects.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/paint-order)
       */
      paintOrder?: number | string | undefined;
      /**
       * The paint-order attribute defines the order for painting objects.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/paint-order)
       */
      "paint-order"?: number | string | undefined;
      /**
       * The pathLength attribute lets authors specify the total length for the path, in user units.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/pathLength)
       */
      pathLength?: number | string | undefined;
      /**
       * The patternContentUnits attribute defines the coordinate system for attributes x, y, width and height.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/patternContentUnits)
       */
      patternContentUnits?: string | undefined;
      /**
       * The patternTransform attribute modifies the pattern by transforming it in the pattern coordinate system.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/patternTransform)
       */
      patternTransform?: number | string | undefined;
      /**
       * The patternUnits attribute defines the coordinate system for attributes x, y, width and height.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/patternUnits)
       */
      patternUnits?: string | undefined;
      /**
       * The pointerEvents attribute determines under what circumstances a particular graphic element can be the target element for a pointer event.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/pointer-events)
       */
      "pointer-events"?: number | string | undefined;
      /**
       * The points attribute defines the list of points for the given shape.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/points)
       */
      points?: string | undefined;
      /**
       * The pointsAtX attribute defines the x coordinate of the focal point for the light source.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/pointsAtX)
       */
      pointsAtX?: number | string | undefined;
      /**
       * The pointsAtY attribute defines the y coordinate of the focal point for the light source.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/pointsAtY)
       */
      pointsAtY?: number | string | undefined;
      /**
       * The pointsAtZ attribute defines the z coordinate of the focal point for the light source.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/pointsAtZ)
       */
      pointsAtZ?: number | string | undefined;
      /**
       * The preserveAlpha attribute is a presentation attribute defining if the alpha channel should be preserved.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/preserveAlpha)
       */
      preserveAlpha?: number | string | undefined;
      /**
       * The preserveAspectRatio attribute indicates how an element handles the aspect ratio of the viewBox specified by the viewBox attribute.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/preserveAspectRatio)
       */
      preserveAspectRatio?: string | undefined;
      /**
       * The primitiveUnits attribute defines the coordinate system for the various attributes.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/primitiveUnits)
       */
      primitiveUnits?: number | string | undefined;
      /**
       * The r attribute defines the radius of the circle.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/r)
       */
      r?: number | string | undefined;
      /**
       * The radius attribute defines the radius of the feMorphology operator.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/radius)
       */
      radius?: number | string | undefined;
      /**
       * The refX attribute defines the x-coordinate of the reference point of the filter effect.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/refX)
       */
      refX?: number | string | undefined;
      /**
       * The refY attribute defines the y-coordinate of the reference point of the filter effect.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/refY)
       */
      refY?: number | string | undefined;
      /**
       * The repeatCount attribute defines the number of repetitions of the animation.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/repeatCount)
       */
      repeatCount?: number | string | undefined;
      /**
       * The repeatDur attribute defines the total duration for the animation.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/repeatDur)
       */
      repeatDur?: number | string | undefined;
      /**
       * The restart attribute defines the conditions for restarting the animation.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/restart)
       */
      restart?: number | string | undefined;
      /**
       * The result attribute defines the name for the result of the filter effect.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/result)
       */
      result?: string | undefined;
      /**
       * The rotate attribute defines a transformation that rotates the element around a fixed point.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/rotate)
       */
      rotate?: number | string | undefined;
      /**
       * The rx attribute defines the x-axis radius of the ellipse.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/rx)
       */
      rx?: number | string | undefined;
      /**
       * The ry attribute defines the y-axis radius of the ellipse.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/ry)
       */
      ry?: number | string | undefined;
      /**
       * The scale attribute defines a scale transformation.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/scale)
       */
      scale?: number | string | undefined;
      /**
       * The seed attribute defines the random number generator initial value.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/seed)
       */
      seed?: number | string | undefined;
      /**
       * The shape-rendering attribute provides hints to the renderer about what tradeoffs to make when rendering shapes.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/shape-rendering)
       */
      "shape-rendering"?: number | string | undefined;
      /**
       * The spacing attribute defines a distance between the copies of the filter effect.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/spacing)
       */
      spacing?: number | string | undefined;
      /**
       * The specularConstant attribute defines the ks in the Phong lighting model.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/specularConstant)
       */
      specularConstant?: number | string | undefined;
      /**
       * The specularExponent attribute defines the ns in the Phong lighting model.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/specularExponent)
       */
      specularExponent?: number | string | undefined;
      /**
       * The spreadMethod attribute provides a hint for gradient interpolation.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/spreadMethod)
       */
      spreadMethod?: string | undefined;
      /**
       * The startOffset attribute defines where the gradient starts.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/startOffset)
       */
      startOffset?: number | string | undefined;
      /**
       * The stdDeviation attribute defines the standard deviation for the blur operation.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stdDeviation)
       */
      stdDeviation?: number | string | undefined;
      /**
       * The stitchTiles attribute provides a hint for how to provide tiles for the feTurbulence filter.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stitchTiles)
       */
      stitchTiles?: number | string | undefined;
      /**
       * The stop-color attribute defines the color of the gradient stop.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stop-color)
       */
      "stop-color"?: string | undefined;
      /**
       * The stop-opacity attribute defines the opacity of the gradient stop.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stop-opacity)
       */
      "stop-opacity"?: number | string | undefined;
      /**
       * The strikethrough-position attribute defines the position of the strikethrough text decoration on text.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/strikethrough-position)
       */
      "strikethrough-position"?: number | string | undefined;
      /**
       * The strikethrough-thickness attribute defines the thickness of the strikethrough text decoration on text.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/strikethrough-thickness)
       */
      "strikethrough-thickness"?: number | string | undefined;
      /**
       * The stoke attribute is a presentation attribute defining the color of the outline of the given graphical element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke)
       */
      stroke?: string | undefined;
      /**
       * The stroke-dasharray attribute is a presentation attribute defining the pattern of dashes and gaps used to paint the outline of the shape.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray)
       */
      "stroke-dasharray"?: string | number | undefined;
      /**
       * The stroke-dashoffset attribute is a presentation attribute defining the distance into the dash pattern to start the dash.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dashoffset)
       */
      "stroke-dashoffset"?: string | number | undefined;
      /**
       * The stroke-linecap attribute is a presentation attribute defining the shape to be used at the end of open subpaths when they are stroked.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linecap)
       */
      "stroke-linecap"?: "butt" | "round" | "square" | "inherit" | undefined;
      /**
       * The stroke-linejoin attribute is a presentation attribute defining the shape to be used at the corners of paths or basic shapes when they are stroked.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linejoin)
       */
      "stroke-linejoin"?: "miter" | "round" | "bevel" | "inherit" | undefined;
      /**
       * The stroke-miterlimit attribute is a presentation attribute defining the limit for the ratio of the miter length to the stroke-width.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-miterlimit)
       */
      "stroke-miterlimit"?: string | number | undefined;
      /**
       * The stroke-opacity attribute is a presentation attribute defining the opacity of the paint server used to paint the outline of the shape.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-opacity)
       */
      "stroke-opacity"?: number | string | undefined;
      /**
       * The stroke-width attribute is a presentation attribute defining the width of the outline on the current object.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-width)
       */
      "stroke-width"?: number | string | undefined;
      /**
       * The surfaceScale attribute defines the height of the surface for the light filter primitive.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/surfaceScale)
       */
      surfaceScale?: number | string | undefined;
      /**
       * The systemLanguage attribute defines the allowable language of the content in the given element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/systemLanguage)
       */
      systemLanguage?: number | string | undefined;
      /**
       * The tableValues attribute specifies the remapping of the input color value.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/tableValues)
       */
      tableValues?: number | string | undefined;
      /**
       * The targetX attribute defines the x-axis coordinate of the shadow.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/targetX)
       */
      targetX?: number | string | undefined;
      /**
       * The targetY attribute defines the y-axis coordinate of the shadow.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/targetY)
       */
      targetY?: number | string | undefined;
      /**
       * The text-anchor attribute is a presentation attribute defining the alignment of the anchored text.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-anchor)
       */
      "text-anchor"?: string | undefined;
      /**
       * The text-decoration attribute is a presentation attribute defining the text decoration line to be used.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-decoration)
       */
      "text-decoration"?: number | string | undefined;
      /**
       * The textLength attribute indicates the width of the space into which the text should be rendered.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/textLength)
       */
      textLength?: number | string | undefined;
      /**
       * The text-rendering attribute provides a hint to the renderer about what tradeoffs to make as it renders text.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-rendering)
       */
      "text-rendering"?: number | string | undefined;
      /**
       * The to attribute defines the final transformation of the given element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/to)
       */
      to?: number | string | undefined;
      /**
       * The transform attribute defines a list of transform definitions that are applied to an element and the element's children.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform)
       */
      transform?: string | undefined;
      /**
       * The underline-position attribute defines the position of the underline text decoration on text.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/underline-position)
       */
      "underline-position"?: number | string | undefined;
      /**
       * The underline-thickness attribute defines the thickness of the underline text decoration on text.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/underline-thickness)
       */
      "underline-thickness"?: number | string | undefined;
      /**
       * The unicode-bidi attribute is a presentation attribute that is used to specify whether a text should be laid out for right-to-left or left-to-right text direction, and whether the text should be laid out for weak bidirectionality, including the direction of embeddings.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/unicode-bidi)
       */
      "unicode-bidi"?: number | string | undefined;
      /**
       * The values attribute has different meanings, depending upon the context where it's used, either it defines a sequence of values used over the course of an animation, or it's a list of numbers for a color matrix, which is interpreted differently depending on the type of color change to be performed.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/values)
       */
      values?: string | undefined;
      /**
       * The vector-effect property specifies the vector effect to use when drawing an object. Vector effects are applied before any of the other compositing operations, i.e. filters, masks and clips.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/vector-effect)
       */
      "vector-effect"?: number | string | undefined;
      /**
       * The viewBox attribute defines the position and dimension, in user space, of an SVG viewport.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox)
       */
      viewBox?: string | undefined;
      /**
       * The visibility attribute specifies whether an element is visible or not.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/visibility)
       */
      visibility?: number | string | undefined;
      /**
       * The word-spacing attribute is a presentation attribute defining the space after the end of each word.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/word-spacing)
       */
      "word-spacing"?: number | string | undefined;
      /**
       * The writing-mode attribute defines the orientation of the dominant baseline and the direction of the dominant baseline.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/writing-mode)
       */
      "writing-mode"?: number | string | undefined;
      /**
       * The x1 attribute defines the x-coordinate of the start of the line.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/x1)
       */
      x1?: number | string | undefined;
      /**
       * The x2 attribute defines the x-coordinate of the end of the line.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/x2)
       */
      x2?: number | string | undefined;
      /**
       * The x attribute defines the x-coordinate of the given element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/x)
       */
      x?: number | string | undefined;
      /**
       * The xChannelSelector attribute indicates which channel the input will affect for the feDisplacementMap filter primitive.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/xChannelSelector)
       */
      xChannelSelector?: string | undefined;
      /**
       * The y1 attribute defines the y-coordinate of the start of the line.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/y1)
       */
      y1?: number | string | undefined;
      /**
       * The y2 attribute defines the y-coordinate of the end of the line.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/y2)
       */
      y2?: number | string | undefined;
      /**
       * The y attribute defines the y-coordinate of the given element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/y)
       */
      y?: number | string | undefined;
      /**
       * The yChannelSelector attribute indicates which channel the input will affect for the feDisplacementMap filter primitive.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/yChannelSelector)
       */
      yChannelSelector?: string | undefined;
      /**
       * The z attribute defines the z-coordinate of the given element.
       *
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/z)
       */
      z?: number | string | undefined;
    }

    export type TargetedEvent<
      Target extends EventTarget = EventTarget,
      TypedEvent extends Event = Event,
    > = Omit<TypedEvent, "currentTarget"> & {
      readonly currentTarget: Target;
    };

    export type TargetedAnimationEvent<Target extends EventTarget> =
      TargetedEvent<Target, AnimationEvent>;
    export type TargetedClipboardEvent<Target extends EventTarget> =
      TargetedEvent<Target, ClipboardEvent>;
    export type TargetedCompositionEvent<Target extends EventTarget> =
      TargetedEvent<Target, CompositionEvent>;
    export type TargetedDragEvent<Target extends EventTarget> = TargetedEvent<
      Target,
      DragEvent
    >;
    export type TargetedFocusEvent<Target extends EventTarget> = TargetedEvent<
      Target,
      FocusEvent
    >;
    export type TargetedInputEvent<Target extends EventTarget> = TargetedEvent<
      Target,
      InputEvent
    >;
    export type TargetedKeyboardEvent<Target extends EventTarget> =
      TargetedEvent<Target, KeyboardEvent>;
    export type TargetedMouseEvent<Target extends EventTarget> = TargetedEvent<
      Target,
      MouseEvent
    >;
    export type TargetedPointerEvent<Target extends EventTarget> =
      TargetedEvent<Target, PointerEvent>;
    export type TargetedSubmitEvent<Target extends EventTarget> = TargetedEvent<
      Target,
      SubmitEvent
    >;
    export type TargetedTouchEvent<Target extends EventTarget> = TargetedEvent<
      Target,
      TouchEvent
    >;
    export type TargetedTransitionEvent<Target extends EventTarget> =
      TargetedEvent<Target, TransitionEvent>;
    export type TargetedUIEvent<Target extends EventTarget> = TargetedEvent<
      Target,
      UIEvent
    >;
    export type TargetedWheelEvent<Target extends EventTarget> = TargetedEvent<
      Target,
      WheelEvent
    >;
    export type TargetedPictureInPictureEvent<Target extends EventTarget> =
      TargetedEvent<Target, PictureInPictureEvent>;

    export type EventHandler<E extends TargetedEvent> = {
      bivarianceHack(event: E): void;
    }["bivarianceHack"];

    export type AnimationEventHandler<Target extends EventTarget> =
      EventHandler<TargetedAnimationEvent<Target>>;
    export type ClipboardEventHandler<Target extends EventTarget> =
      EventHandler<TargetedClipboardEvent<Target>>;
    export type CompositionEventHandler<Target extends EventTarget> =
      EventHandler<TargetedCompositionEvent<Target>>;
    export type DragEventHandler<Target extends EventTarget> = EventHandler<
      TargetedDragEvent<Target>
    >;
    export type FocusEventHandler<Target extends EventTarget> = EventHandler<
      TargetedFocusEvent<Target>
    >;
    export type GenericEventHandler<Target extends EventTarget> = EventHandler<
      TargetedEvent<Target>
    >;
    export type InputEventHandler<Target extends EventTarget> = EventHandler<
      TargetedInputEvent<Target>
    >;
    export type KeyboardEventHandler<Target extends EventTarget> = EventHandler<
      TargetedKeyboardEvent<Target>
    >;
    export type MouseEventHandler<Target extends EventTarget> = EventHandler<
      TargetedMouseEvent<Target>
    >;
    export type PointerEventHandler<Target extends EventTarget> = EventHandler<
      TargetedPointerEvent<Target>
    >;
    export type SubmitEventHandler<Target extends EventTarget> = EventHandler<
      TargetedSubmitEvent<Target> & { formData?: FormData | undefined }
    >;
    export type TouchEventHandler<Target extends EventTarget> = EventHandler<
      TargetedTouchEvent<Target>
    >;
    export type TransitionEventHandler<Target extends EventTarget> =
      EventHandler<TargetedTransitionEvent<Target>>;
    export type UIEventHandler<Target extends EventTarget> = EventHandler<
      TargetedUIEvent<Target>
    >;
    export type WheelEventHandler<Target extends EventTarget> = EventHandler<
      TargetedWheelEvent<Target>
    >;
    export type PictureInPictureEventHandler<Target extends EventTarget> =
      EventHandler<TargetedPictureInPictureEvent<Target>>;

    export interface DOMAttributes<Target extends EventTarget>
      extends BrisaDOMAttributes {
      // Image Events

      /**
       * Milliseconds to wait before executing the `onLoad` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <img onLoad-debounce={500} onLoad={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onLoad-debounce"?: number | undefined;
      /**
       * The onLoad event is fired when an object has been loaded.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event)
       */
      onLoad?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onError` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <img onError-debounce={500} onError={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onError-debounce"?: number | undefined;
      /**
       * The onError event is fired when an object has been loaded.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Window/error_event)
       */
      onError?: GenericEventHandler<Target> | undefined;

      // Clipboard Events

      /**
       * Milliseconds to wait before executing the `onCopy` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <p onCopy-debounce={500} onCopy={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onCopy-debounce"?: number | undefined;
      /**
       * The onCopy event is fired when the user copies the content of an element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/copy_event)
       */
      onCopy?: ClipboardEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onCut` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <p onCut-debounce={500} onCut={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onCut-debounce"?: number | undefined;
      /**
       * The onCut event is fired when the user cuts the content of an element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/cut_event)
       */
      onCut?: ClipboardEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPaste` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <p onPaste-debounce={500} onPaste={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPaste-debounce"?: number | undefined;
      /**
       * The onPaste event is fired when the user pastes some content in an element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event)
       */
      onPaste?: ClipboardEventHandler<Target> | undefined;

      // Composition Events:

      /**
       * Milliseconds to wait before executing the `onCompositionEnd` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onCompositionEnd-debounce={500} onCompositionEnd={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onCompositionEnd-debounce"?: number | undefined;
      /**
       * The onCompositionEnd event is fired when the composition of a passage of text has been completed or canceled.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionend_event)
       */
      onCompositionEnd?: CompositionEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onCompositionStart` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onCompositionStart-debounce={500} onCompositionStart={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onCompositionStart-debounce"?: number | undefined;
      /**
       * The onCompositionStart event is fired when the user starts to enter the composition of a passage of text.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionstart_event)
       */
      onCompositionStart?: CompositionEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onCompositionUpdate` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onCompositionUpdate-debounce={500} onCompositionUpdate={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onCompositionUpdate-debounce"?: number | undefined;
      /**
       * The onCompositionUpdate event is fired when the user is entering text.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionupdate_event)
       */
      onCompositionUpdate?: CompositionEventHandler<Target> | undefined;

      // Details Events:

      /**
       * Milliseconds to wait before executing the `onToggle` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onToggle-debounce={500} onToggle={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onToggle-debounce"?: number | undefined;
      /**
       * The onToggle event is fired when the user opens or closes the details element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDetailsElement/toggle_event)
       */
      onToggle?: GenericEventHandler<Target> | undefined;

      // Dialog Events:

      /**
       * Milliseconds to wait before executing the `onClose` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <dialog onClose-debounce={500} onClose={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onClose-debounce"?: number | undefined;
      /**
       * The onClose event is fired when the user closes the dialog element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/close_event)
       */
      onClose?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onCancel` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <dialog onCancel-debounce={500} onCancel={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onCancel-debounce"?: number | undefined;
      /**
       * The onCancel event is fired when the user cancels the dialog element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/cancel_event)
       */
      onCancel?: GenericEventHandler<Target> | undefined;

      // Focus Events:

      /**
       * Milliseconds to wait before executing the `onFocus` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onFocus-debounce={500} onFocus={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onFocus-debounce"?: number | undefined;
      /**
       * The onFocus event is fired when an element gets focus.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/focus_event)
       */
      onFocus?: FocusEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onfocusin` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onfocusin-debounce={500} onfocusin={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onfocusin-debounce"?: number | undefined;
      /**
       * The onfocusin event is fired when an element is about to get focus.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event)
       */
      onfocusin?: FocusEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onfocusout` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onfocusout-debounce={500} onfocusout={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onfocusout-debounce"?: number | undefined;
      /**
       * The onfocusout event is fired when an element is about to lose focus.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusout_event)
       */
      onfocusout?: FocusEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onBlur` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onBlur-debounce={500} onBlur={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onBlur-debounce"?: number | undefined;
      /**
       * The onBlur event is fired when an element loses focus.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event)
       */
      onBlur?: FocusEventHandler<Target> | undefined;

      // Form Events:

      /**
       * Milliseconds to wait before executing the `onChange` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onChange-debounce={500} onChange={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onChange-debounce"?: number | undefined;
      /**
       * The onChange event is fired when the value of an element has been changed.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event)
       */
      onChange?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onInput` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onInput-debounce={500} onInput={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onInput-debounce"?: number | undefined;
      /**
       * The onInput event is fired when the value of an element has been changed.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event)
       */
      onInput?: InputEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onBeforeInput` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onBeforeInput-debounce={500} onBeforeInput={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onBeforeInput-debounce"?: number | undefined;
      /**
       * The onBeforeInput event is fired when the value of an element has been changed.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/beforeinput_event)
       */
      onBeforeInput?: InputEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onSearch` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onSearch-debounce={500} onSearch={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onSearch-debounce"?: number | undefined;
      /**
       * The onSearch event is fired when the user writes something in a search input (text input with `search` type).
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/search_event)
       */
      onSearch?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onSubmit` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <form onSubmit-debounce={500} onSubmit={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onSubmit-debounce"?: number | undefined;
      /**
       * The onSubmit event is fired when a form is submitted.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event)
       */
      onSubmit?: SubmitEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onInvalid` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onInvalid-debounce={500} onInvalid={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onInvalid-debounce"?: number | undefined;
      /**
       * The onInvalid event is fired when a form is submitted and has validation errors.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/invalid_event)
       */
      onInvalid?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onReset` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <form onReset-debounce={500} onReset={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onReset-debounce"?: number | undefined;
      /**
       * The onReset event is fired when a form is reset.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reset_event)
       */
      onReset?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onFormData` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <form onFormData-debounce={500} onFormData={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onFormData-debounce"?: number | undefined;
      /**
       * The onFormData event is fired when a form is submitted and has validation errors.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/formdata_event)
       */
      onFormData?: GenericEventHandler<Target> | undefined;

      // Keyboard Events:

      /**
       * Milliseconds to wait before executing the `onKeyDown` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onKeyDown-debounce={500} onKeyDown={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onKeyDown-debounce"?: number | undefined;
      /**
       * The onKeyDown event is fired when a key is pressed down.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Document/keydown_event)
       */
      onKeyDown?: KeyboardEventHandler<Target> | undefined;;

      /**
       * Milliseconds to wait before executing the `onKeyUp` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onKeyUp-debounce={500} onKeyUp={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onKeyUp-debounce"?: number | undefined;
      /**
       * The onKeyUp event is fired when a key is released.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Document/keyup_event)
       */
      onKeyUp?: KeyboardEventHandler<Target> | undefined;

      // Media Events:

      /**
       * Milliseconds to wait before executing the `onAbort` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onAbort-debounce={500} onAbort={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onAbort-debounce"?: number | undefined;
      /**
       * The onAbort event is fired when the loading of a media is aborted.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/abort_event)
       */
      onAbort?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onCanPlay` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onCanPlay-debounce={500} onCanPlay={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onCanPlay-debounce"?: number | undefined;
      /**
       * The onCanPlay event is fired when the browser can start playing the media (when it has buffered enough to begin).
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canplay_event)
       */
      onCanPlay?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onCanPlayThrough` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onCanPlayThrough-debounce={500} onCanPlayThrough={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onCanPlayThrough-debounce"?: number | undefined;
      /**
       * The onCanPlayThrough event is fired when the browser can play through the media without stopping for buffering.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canplaythrough_event)
       */
      onCanPlayThrough?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDurationChange` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onDurationChange-debounce={500} onDurationChange={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDurationChange-debounce"?: number | undefined;
      /**
       * The onDurationChange event is fired when the duration of the media has changed.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/durationchange_event)
       */
      onDurationChange?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onEmptied` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onEmptied-debounce={500} onEmptied={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onEmptied-debounce"?: number | undefined;
      /**
       * The onEmptied event is fired when the media has become empty; for example, when the media has already been loaded (or partially loaded), and the load() method is called to reload it.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/emptied_event)
       */
      onEmptied?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onEncrypted` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onEncrypted-debounce={500} onEncrypted={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onEncrypted-debounce"?: number | undefined;
      /**
       * The onEncrypted event is fired when the media has become empty; for example, when the media has already been loaded (or partially loaded), and the load() method is called to reload it.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/encrypted_event)
       */
      onEncrypted?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onEnded` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onEnded-debounce={500} onEnded={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onEnded-debounce"?: number | undefined;
      /**
       * The onEnded event is fired when the media has reached the end.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/ended_event)
       */
      onEnded?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onLoadedData` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onLoadedData-debounce={500} onLoadedData={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onLoadedData-debounce"?: number | undefined;
      /**
       * The onLoadedData event is fired when the media's data is loaded.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/loadeddata_event)
       */
      onLoadedData?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onLoadedMetadata` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onLoadedMetadata-debounce={500} onLoadedMetadata={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onLoadedMetadata-debounce"?: number | undefined;
      /**
       * The onLoadedMetadata event is fired when the metadata has been loaded.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/loadedmetadata_event)
       */
      onLoadedMetadata?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onLoadStart` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onLoadStart-debounce={500} onLoadStart={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onLoadStart-debounce"?: number | undefined;
      /**
       * The onLoadStart event is fired when the browser starts looking for the specified media.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/loadstart_event)
       */
      onLoadStart?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPause` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onPause-debounce={500} onPause={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPause-debounce"?: number | undefined;
      /**
       * The onPause event is fired when the media has been paused.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/pause_event)
       */
      onPause?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPlay` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onPlay-debounce={500} onPlay={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPlay-debounce"?: number | undefined;
      /**
       * The onPlay event is fired when the media has been started or is no longer paused.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play_event)
       */
      onPlay?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPlaying` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onPlaying-debounce={500} onPlaying={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPlaying-debounce"?: number | undefined;
      /**
       * The onPlaying event is fired when the media has started playing.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playing_event)
       */
      onPlaying?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onProgress` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onProgress-debounce={500} onProgress={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onProgress-debounce"?: number | undefined;
      /**
       * The onProgress event is fired when the browser is in the process of getting the media data (downloading the media).
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/progress_event)
       */
      onProgress?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onRateChange` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onRateChange-debounce={500} onRateChange={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onRateChange-debounce"?: number | undefined;
      /**
       * The onRateChange event is fired when the playback rate has changed.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/ratechange_event)
       */
      onRateChange?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onSeeked` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onSeeked-debounce={500} onSeeked={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onSeeked-debounce"?: number | undefined;
      /**
       * The onSeeked event is fired when the seeking property is false, meaning that the seeking has ended.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/seeked_event)
       */
      onSeeked?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onSeeking` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onSeeking-debounce={500} onSeeking={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onSeeking-debounce"?: number | undefined;
      /**
       * The onSeeking event is fired when the seeking property is true, meaning that the media is seeking a position.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/seeking_event)
       */
      onSeeking?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onStalled` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onStalled-debounce={500} onStalled={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onStalled-debounce"?: number | undefined;
      /**
       * The onStalled event is fired when the browser is trying to get media data, but data is not available.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/stalled_event)
       */
      onStalled?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onSuspend` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onSuspend-debounce={500} onSuspend={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onSuspend-debounce"?: number | undefined;
      /**
       * The onSuspend event is fired when the loading of a media is suspended.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/suspend_event)
       */
      onSuspend?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onTimeUpdate` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onTimeUpdate-debounce={500} onTimeUpdate={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTimeUpdate-debounce"?: number | undefined;
      /**
       * The onTimeUpdate event is fired when the time indicated by the currentTime attribute has been updated.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/timeupdate_event)
       */
      onTimeUpdate?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onVolumeChange` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onVolumeChange-debounce={500} onVolumeChange={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onVolumeChange-debounce"?: number | undefined;
      /**
       * The onVolumeChange event is fired when the volume has changed.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volumechange_event)
       */
      onVolumeChange?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onWaiting` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onWaiting-debounce={500} onWaiting={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onWaiting-debounce"?: number | undefined;
      /**
       * The onWaiting event is fired when the media has paused but is expected to resume (like when the media is buffering).
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/waiting_event)
       */
      onWaiting?: GenericEventHandler<Target> | undefined;

      // MouseEvents:

      /**
       * Milliseconds to wait before executing the `onClick` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onClick-debounce={500} onClick={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onClick-debounce"?: number | undefined;
      /**
       * The onClick event is fired when a pointing device button (usually a mouse) is pressed and released on a single element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event)
       */
      onClick?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onContextMenu` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onContextMenu-debounce={500} onContextMenu={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onContextMenu-debounce"?: number | undefined;
      /**
       * The onContextMenu event is fired when the right button of the mouse is clicked on an element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/contextmenu_event)
       */
      onContextMenu?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDblClick` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDblClick-debounce={500} onDblClick={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDblClick-debounce"?: number | undefined;
      /**
       * The onDblClick event is fired when a pointing device button (usually a mouse) is clicked twice on a single element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/dblclick_event)
       */
      onDblClick?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDrag` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDrag-debounce={500} onDrag={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDrag-debounce"?: number | undefined;
      /**
       * The onDrag event is fired when an element or text selection is being dragged.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drag_event)
       */
      onDrag?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDragEnd` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDragEnd-debounce={500} onDragEnd={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDragEnd-debounce"?: number | undefined;
      /**
       * The onDragEnd event is fired when a drag operation is being ended (by releasing a mouse button or hitting the escape key).
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragend_event)
       */
      onDragEnd?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDragEnter` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDragEnter-debounce={500} onDragEnter={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDragEnter-debounce"?: number | undefined;
      /**
       * The onDragEnter event is fired when a drag operation is being ended (by releasing a mouse button or hitting the escape key).
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragenter_event)
       */
      onDragEnter?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDragLeave` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDragLeave-debounce={500} onDragLeave={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDragLeave-debounce"?: number | undefined;
      /**
       * The onDragLeave event is fired when a dragged element or text selection leaves a valid drop target.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragleave_event)
       */
      onDragLeave?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDragOver` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDragOver-debounce={500} onDragOver={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDragOver-debounce"?: number | undefined;
      /**
       * The onDragOver event is fired when an element or text selection is being dragged over a valid drop target (every few hundred milliseconds).
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragover_event)
       */
      onDragOver?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDragStart` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDragStart-debounce={500} onDragStart={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDragStart-debounce"?: number | undefined;
      /**
       * The onDragStart event is fired when the user starts dragging an element or text selection.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragstart_event)
       */
      onDragStart?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDrop` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDrop-debounce={500} onDrop={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDrop-debounce"?: number | undefined;
      /**
       * The onDrop event is fired when an element or text selection is dropped on a valid drop target.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drop_event)
       */
      onDrop?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onMouseDown` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onMouseDown-debounce={500} onMouseDown={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onMouseDown-debounce"?: number | undefined;
      /**
       * The onMouseDown event is fired when a pointing device button is pressed on an element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/mousedown_event)
       */
      onMouseDown?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onMouseEnter` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onMouseEnter-debounce={500} onMouseEnter={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onMouseEnter-debounce"?: number | undefined;
      /**
       * The onMouseEnter event is fired when a pointing device is moved onto the element that has the listener attached.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseenter_event)
       */
      onMouseEnter?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onMouseLeave` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onMouseLeave-debounce={500} onMouseLeave={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onMouseLeave-debounce"?: number | undefined;
      /**
       * The onMouseLeave event is fired when a pointing device is moved off the element that has the listener attached.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseleave_event)
       */
      onMouseLeave?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onMouseMove` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onMouseMove-debounce={500} onMouseMove={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onMouseMove-debounce"?: number | undefined;
      /**
       * The onMouseMove event is fired when a pointing device is moved over an element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event)
       */
      onMouseMove?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onMouseOut` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onMouseOut-debounce={500} onMouseOut={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onMouseOut-debounce"?: number | undefined;
      /**
       * The onMouseOut event is fired when a pointing device is moved off the element that has the listener attached or off one of its children.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseout_event)
       */
      onMouseOut?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onMouseOver` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onMouseOver-debounce={500} onMouseOver={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onMouseOver-debounce"?: number | undefined;
      /**
       * The onMouseOver event is fired when a pointing device is moved onto the element that has the listener attached.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseover_event)
       */
      onMouseOver?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onMouseUp` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onMouseUp-debounce={500} onMouseUp={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onMouseUp-debounce"?: number | undefined;
      /**
       * The onMouseUp event is fired when a pointing device button is released over an element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseup_event)
       */
      onMouseUp?: MouseEventHandler<Target> | undefined;

      // Selection Events:

      /**
       * Milliseconds to wait before executing the `onSelect` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onSelect-debounce={500} onSelect={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onSelect-debounce"?: number | undefined;
      /**
       * The onSelect event is fired when the user selects some text in a text field.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/select_event)
       */
      onSelect?: GenericEventHandler<Target> | undefined;

      // Touch Events:

      /**
       * Milliseconds to wait before executing the `onTouchCancel` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onTouchCancel-debounce={500} onTouchCancel={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTouchCancel-debounce"?: number | undefined;
      /**
       * The onTouchCancel event is fired when a touch point has been disrupted in an implementation-specific manner (for example, too many touch points are created).
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/ontouchcancel)
       */
      onTouchCancel?: TouchEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onTouchEnd` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onTouchEnd-debounce={500} onTouchEnd={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTouchEnd-debounce"?: number | undefined;
      /**
       * The onTouchEnd event is fired when a touch point is removed from the touch surface.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/ontouchend)
       */
      onTouchEnd?: TouchEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onTouchMove` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onTouchMove-debounce={500} onTouchMove={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTouchMove-debounce"?: number | undefined;
      /**
       * The onTouchMove event is fired when a touch point is moved along the touch surface.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/ontouchmove)
       */
      onTouchMove?: TouchEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onTouchStart` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onTouchStart-debounce={500} onTouchStart={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTouchStart-debounce"?: number | undefined;
      /**
       * The onTouchStart event is fired when a touch point is placed on the touch surface.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/ontouchstart)
       */
      onTouchStart?: TouchEventHandler<Target> | undefined;

      // Pointer Events:

      /**
       * Milliseconds to wait before executing the `onPointerOver` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onPointerOver-debounce={500} onPointerOver={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPointerOver-debounce"?: number | undefined;
      /**
       * The onPointerOver event is fired when a pointing device is moved onto the element that has the listener attached.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerover_event)
       */
      onPointerOver?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPointerEnter` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onPointerEnter-debounce={500} onPointerEnter={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPointerEnter-debounce"?: number | undefined;
      /**
       * The onPointerEnter event is fired when a pointing device is moved onto the element that has the listener attached.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerenter_event)
       */
      onPointerEnter?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPointerDown` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onPointerDown-debounce={500} onPointerDown={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPointerDown-debounce"?: number | undefined;
      /**
       * The onPointerDown event is fired when a pointer becomes active.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerdown_event)
       */
      onPointerDown?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPointerMove` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onPointerMove-debounce={500} onPointerMove={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPointerMove-debounce"?: number | undefined;
      /**
       * The onPointerMove event is fired when a pointer changes coordinates.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointermove_event)
       */
      onPointerMove?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPointerUp` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onPointerUp-debounce={500} onPointerUp={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPointerUp-debounce"?: number | undefined;
      /**
       * The onPointerUp event is fired when a pointer is no longer active.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerup_event)
       */
      onPointerUp?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPointerCancel` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onPointerCancel-debounce={500} onPointerCancel={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPointerCancel-debounce"?: number | undefined;
      /**
       * The onPointerCancel event is fired when a pointer has been disrupted in an implementation-specific manner (for example, a device stops sending data).
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointercancel_event)
       */
      onPointerCancel?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPointerOut` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onPointerOut-debounce={500} onPointerOut={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPointerOut-debounce"?: number | undefined;
      /**
       * The onPointerOut event is fired when a pointing device is moved off the element that has the listener attached.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerout_event)
       */
      onPointerOut?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPointerLeave` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onPointerLeave-debounce={500} onPointerLeave={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPointerLeave-debounce"?: number | undefined;
      /**
       * The onPointerLeave event is fired when a pointing device is moved off the element that has the listener attached.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerleave_event)
       */
      onPointerLeave?: PointerEventHandler<Target> | undefined;


      /**
       * Milliseconds to wait before executing the `onGotPointerCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onGotPointerCapture-debounce={500} onGotPointerCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onGotPointerCapture-debounce"?: number | undefined;
      /**
       * The onGotPointerCapture event is fired when an element captures a pointer.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/gotpointercapture_event)
       */
      onGotPointerCapture?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onLostPointerCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onLostPointerCapture-debounce={500} onLostPointerCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onLostPointerCapture-debounce"?: number | undefined;
      /**
       * The onLostPointerCapture event is fired after a pointer has been captured by an element and then is released.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/lostpointercapture_event)
       */
      onLostPointerCapture?: PointerEventHandler<Target> | undefined;

      // UI Events:

      /**
       * Milliseconds to wait before executing the `onScroll` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onScroll-debounce={500} onScroll={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onScroll-debounce"?: number | undefined;
      /**
       * The onScroll event is fired when an element's scrollbar is being scrolled.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/scroll_event)
       */
      onScroll?: UIEventHandler<Target> | undefined;

      // Wheel Events:

      /**
       * Milliseconds to wait before executing the `onWheel` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onWheel-debounce={500} onWheel={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onWheel-debounce"?: number | undefined;
      /**
       * The onWheel event is fired when a wheel button of a pointing device is rotated in any direction.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event)
       */
      onWheel?: WheelEventHandler<Target> | undefined;

      // Animation Events:

      /**
       * Milliseconds to wait before executing the `onAnimationStart` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onAnimationStart-debounce={500} onAnimationStart={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onAnimationStart-debounce"?: number | undefined;
      /**
       * The onAnimationStart event is fired when a CSS animation has started.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/animationstart_event)
       */
      onAnimationStart?: AnimationEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onAnimationEnd` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onAnimationEnd-debounce={500} onAnimationEnd={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onAnimationEnd-debounce"?: number | undefined;
      /**
       * The onAnimationEnd event is fired when a CSS animation has completed.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/animationend_event)
       */
      onAnimationEnd?: AnimationEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onAnimationIteration` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onAnimationIteration-debounce={500} onAnimationIteration={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onAnimationIteration-debounce"?: number | undefined;
      /**
       * The onAnimationIteration event is fired when a CSS animation has completed one iteration.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/animationiteration_event)
       */
      onAnimationIteration?: AnimationEventHandler<Target> | undefined;

      // Transition Events:

      /**
       * Milliseconds to wait before executing the `onTransitionCancel` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onTransitionCancel-debounce={500} onTransitionCancel={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTransitionCancel-debounce"?: number | undefined;
      /**
       * The onTransitionCancel event is fired when a CSS transition has been interrupted.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/transitioncancel_event)
       */
      onTransitionCancel?: TransitionEventHandler<Target>;

      /**
       * Milliseconds to wait before executing the `onTransitionEnd` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onTransitionEnd-debounce={500} onTransitionEnd={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTransitionEnd-debounce"?: number | undefined;
      /**
       * The onTransitionEnd event is fired when a CSS transition has completed.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/transitionend_event)
       */
      onTransitionEnd?: TransitionEventHandler<Target>;

      /**
       * Milliseconds to wait before executing the `onTransitionRun` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onTransitionRun-debounce={500} onTransitionRun={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTransitionRun-debounce"?: number | undefined;
      /**
       * The onTransitionRun event is fired when a CSS transition has started.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/transitionrun_event)
       */
      onTransitionRun?: TransitionEventHandler<Target>;

      /**
       * Milliseconds to wait before executing the `onTransitionStart` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onTransitionStart-debounce={500} onTransitionStart={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTransitionStart-debounce"?: number | undefined;
      /**
       * The onTransitionStart event is fired when a CSS transition has started.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/transitionstart_event)
       */
      onTransitionStart?: TransitionEventHandler<Target>;

      // PictureInPicture Events:

      /**
       * Milliseconds to wait before executing the `onEnterPictureInPicture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onEnterPictureInPicture-debounce={500} onEnterPictureInPicture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onEnterPictureInPicture-debounce"?: number | undefined;
      /**
       * The onEnterPictureInPicture event is fired when a video enters picture-in-picture mode.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/enterpictureinpicture_event)
       */
      onEnterPictureInPicture?: PictureInPictureEventHandler<Target>;

      /**
       * Milliseconds to wait before executing the `onLeavePictureInPicture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onLeavePictureInPicture-debounce={500} onLeavePictureInPicture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onLeavePictureInPicture-debounce"?: number | undefined;
      /**
       * The onLeavePictureInPicture event is fired when a video leaves picture-in-picture mode.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/leavepictureinpicture_event)
       */
      onLeavePictureInPicture?: PictureInPictureEventHandler<Target>;

      /**
       * Milliseconds to wait before executing the `onResize` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onResize-debounce={500} onResize={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onResize-debounce"?: number | undefined;
      /**
       * The onResize event is fired when a picture-in-picture window is resized.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Window/resize_event)
       */
      onResize?: PictureInPictureEventHandler<Target>;
    }

    export interface HTMLAttributes<RefType extends EventTarget = EventTarget>
      extends DOMAttributes<RefType>,
        AriaAttributes {
      // Standard HTML Attributes
      accept?: string | undefined;
      acceptCharset?: string | undefined;
      "accept-charset"?: HTMLAttributes["acceptCharset"];
      accessKey?: string | undefined;
      accesskey?: HTMLAttributes["accessKey"];
      action?: string | undefined;
      allow?: string | undefined;
      allowFullScreen?: boolean | undefined;
      allowTransparency?: boolean | undefined;
      alt?: string | undefined;
      as?: string | undefined;
      async?: boolean | undefined;
      autocomplete?: string | undefined;
      autoComplete?: string | undefined;
      autocorrect?: string | undefined;
      autoCorrect?: string | undefined;
      autofocus?: boolean | undefined;
      autoFocus?: boolean | undefined;
      autoPlay?: boolean | undefined;
      autoplay?: boolean | undefined;
      capture?: boolean | string | undefined;
      cellPadding?: number | string | undefined;
      cellSpacing?: number | string | undefined;
      charSet?: string | undefined;
      charset?: string | undefined;
      challenge?: string | undefined;
      checked?: boolean | undefined;
      cite?: string | undefined;
      class?: string | undefined;
      className?: string | undefined;
      cols?: number | undefined;
      colSpan?: number | undefined;
      colspan?: number | undefined;
      content?: string | undefined;
      contentEditable?: boolean | "" | "plaintext-only" | "inherit" | undefined;
      contenteditable?: HTMLAttributes["contentEditable"];
      controls?: boolean | undefined;
      controlsList?: string | undefined;
      coords?: string | undefined;
      crossOrigin?: string | undefined;
      crossorigin?: string | undefined;
      data?: string | undefined;
      dateTime?: string | undefined;
      datetime?: string | undefined;
      default?: boolean | undefined;
      defaultChecked?: boolean | undefined;
      defaultValue?: string | undefined;
      defer?: boolean | undefined;
      dir?: "auto" | "rtl" | "ltr" | undefined;
      disabled?: boolean | undefined;
      disableRemotePlayback?: boolean | undefined;
      download?: any | undefined;
      decoding?: "sync" | "async" | "auto" | undefined;
      draggable?: boolean | undefined;
      encType?: string | undefined;
      enctype?: string | undefined;
      enterkeyhint?:
        | "enter"
        | "done"
        | "go"
        | "next"
        | "previous"
        | "search"
        | "send"
        | undefined;
      elementTiming?: string | undefined;
      elementtiming?: HTMLAttributes["elementTiming"];
      exportparts?: string | undefined;
      for?: string | undefined;
      form?: string | undefined;
      formAction?: string | undefined;
      formaction?: string | undefined;
      formEncType?: string | undefined;
      formenctype?: string | undefined;
      formMethod?: string | undefined;
      formmethod?: string | undefined;
      formNoValidate?: boolean | undefined;
      formnovalidate?: boolean | undefined;
      formTarget?: string | undefined;
      formtarget?: string | undefined;
      frameBorder?: number | string | undefined;
      frameborder?: number | string | undefined;
      headers?: string | undefined;
      height?: number | string | undefined;
      hidden?: boolean | "hidden" | "until-found" | undefined;
      high?: number | undefined;
      href?: string | undefined;
      hrefLang?: string | undefined;
      hreflang?: string | undefined;
      htmlFor?: string | undefined;
      httpEquiv?: string | undefined;
      "http-equiv"?: string | undefined;
      icon?: string | undefined;
      id?: string | undefined;
      indeterminate?: boolean | undefined;
      inert?: boolean | undefined;
      inputMode?: string | undefined;
      inputmode?: string | undefined;
      integrity?: string | undefined;
      is?: string | undefined;
      keyParams?: string | undefined;
      keyType?: string | undefined;
      kind?: string | undefined;
      label?: string | undefined;
      lang?: string | undefined;
      list?: string | undefined;
      loading?: "eager" | "lazy" | undefined;
      loop?: boolean | undefined;
      low?: number | undefined;
      manifest?: string | undefined;
      marginHeight?: number | undefined;
      marginWidth?: number | undefined;
      max?: number | string | undefined;
      maxLength?: number | undefined;
      maxlength?: number | undefined;
      media?: string | undefined;
      mediaGroup?: string | undefined;
      method?: string | undefined;
      min?: number | string | undefined;
      minLength?: number | undefined;
      minlength?: number | undefined;
      multiple?: boolean | undefined;
      muted?: boolean | undefined;
      name?: string | undefined;
      nomodule?: boolean | undefined;
      nonce?: string | undefined;
      noValidate?: boolean | undefined;
      novalidate?: boolean | undefined;
      open?: boolean | undefined;
      optimum?: number | undefined;
      part?: string | undefined;
      pattern?: string | undefined;
      ping?: string | undefined;
      placeholder?: string | undefined;
      playsInline?: boolean | undefined;
      playsinline?: boolean | undefined;
      poster?: string | undefined;
      preload?: string | undefined;
      radioGroup?: string | undefined;
      readonly?: boolean | undefined;
      readOnly?: boolean | undefined;
      referrerpolicy?:
        | "no-referrer"
        | "no-referrer-when-downgrade"
        | "origin"
        | "origin-when-cross-origin"
        | "same-origin"
        | "strict-origin"
        | "strict-origin-when-cross-origin"
        | "unsafe-url"
        | undefined;
      rel?: string | undefined;
      required?: boolean | undefined;
      reversed?: boolean | undefined;
      role?: AriaRole | undefined;
      rows?: number | undefined;
      rowSpan?: number | undefined;
      rowspan?: number | undefined;
      sandbox?: string | undefined;
      scope?: string | undefined;
      scoped?: boolean | undefined;
      scrolling?: string | undefined;
      seamless?: boolean | undefined;
      selected?: boolean | undefined;
      shape?: string | undefined;
      size?: number | undefined;
      sizes?: string | undefined;
      slot?: string | undefined;
      span?: number | undefined;
      spellcheck?: boolean | undefined;
      spellCheck?: boolean | undefined;
      src?: string | undefined;
      srcSet?: string | undefined;
      srcset?: string | undefined;
      srcDoc?: string | undefined;
      srcdoc?: string | undefined;
      srcLang?: string | undefined;
      srclang?: string | undefined;
      start?: number | undefined;
      step?: number | string | undefined;
      style?: string | CSSProperties | undefined;
      summary?: string | undefined;
      tabIndex?: number | undefined;
      tabindex?: number | undefined;
      target?: string | undefined;
      title?: string | undefined;
      type?: string | undefined;
      useMap?: string | undefined;
      usemap?: string | undefined;
      value?: string | string[] | number | undefined;
      volume?: string | number | undefined;
      width?: number | string | undefined;
      wmode?: string | undefined;
      wrap?: string | undefined;

      // template attributes
      shadowrootmode?: ShadowRootMode | undefined;

      // Non-standard attributes
      autocapitalize?:
        | "off"
        | "none"
        | "on"
        | "sentences"
        | "words"
        | "characters"
        | undefined;
      autoCapitalize?:
        | "off"
        | "none"
        | "on"
        | "sentences"
        | "words"
        | "characters"
        | undefined;
      disablePictureInPicture?: boolean | undefined;
      results?: number | undefined;
      translate?: "yes" | "no" | undefined;

      // RDFa Attributes
      about?: string | undefined;
      datatype?: string | undefined;
      inlist?: any;
      prefix?: string | undefined;
      property?: string | undefined;
      resource?: string | undefined;
      typeof?: string | undefined;
      vocab?: string | undefined;

      // Microdata Attributes
      itemProp?: string | undefined;
      itemprop?: string | undefined;
      itemScope?: boolean | undefined;
      itemscope?: boolean | undefined;
      itemType?: string | undefined;
      itemtype?: string | undefined;
      itemID?: string | undefined;
      itemid?: string | undefined;
      itemRef?: string | undefined;
      itemref?: string | undefined;
    }

    interface IntrinsicElements extends IntrinsicCustomElements {
      // HTML
      a: HTMLAttributes<HTMLAnchorElement>;
      abbr: HTMLAttributes<HTMLElement>;
      address: HTMLAttributes<HTMLElement>;
      area: HTMLAttributes<HTMLAreaElement>;
      article: HTMLAttributes<HTMLElement>;
      aside: HTMLAttributes<HTMLElement>;
      audio: HTMLAttributes<HTMLAudioElement>;
      b: HTMLAttributes<HTMLElement>;
      base: HTMLAttributes<HTMLBaseElement>;
      bdi: HTMLAttributes<HTMLElement>;
      bdo: HTMLAttributes<HTMLElement>;
      big: HTMLAttributes<HTMLElement>;
      blockquote: HTMLAttributes<HTMLQuoteElement>;
      body: HTMLAttributes<HTMLBodyElement>;
      br: HTMLAttributes<HTMLBRElement>;
      button: HTMLAttributes<HTMLButtonElement>;
      canvas: HTMLAttributes<HTMLCanvasElement>;
      caption: HTMLAttributes<HTMLTableCaptionElement>;
      cite: HTMLAttributes<HTMLElement>;
      code: HTMLAttributes<HTMLElement>;
      col: HTMLAttributes<HTMLTableColElement>;
      colgroup: HTMLAttributes<HTMLTableColElement>;
      data: HTMLAttributes<HTMLDataElement>;
      datalist: HTMLAttributes<HTMLDataListElement>;
      dd: HTMLAttributes<HTMLElement>;
      del: HTMLAttributes<HTMLModElement>;
      details: HTMLAttributes<HTMLDetailsElement>;
      dfn: HTMLAttributes<HTMLElement>;
      dialog: HTMLAttributes<HTMLDialogElement>;
      div: HTMLAttributes<HTMLDivElement>;
      dl: HTMLAttributes<HTMLDListElement>;
      dt: HTMLAttributes<HTMLElement>;
      em: HTMLAttributes<HTMLElement>;
      embed: HTMLAttributes<HTMLEmbedElement>;
      fieldset: HTMLAttributes<HTMLFieldSetElement>;
      figcaption: HTMLAttributes<HTMLElement>;
      figure: HTMLAttributes<HTMLElement>;
      footer: HTMLAttributes<HTMLElement>;
      form: HTMLAttributes<HTMLFormElement>;
      h1: HTMLAttributes<HTMLHeadingElement>;
      h2: HTMLAttributes<HTMLHeadingElement>;
      h3: HTMLAttributes<HTMLHeadingElement>;
      h4: HTMLAttributes<HTMLHeadingElement>;
      h5: HTMLAttributes<HTMLHeadingElement>;
      h6: HTMLAttributes<HTMLHeadingElement>;
      head: HTMLAttributes<HTMLHeadElement>;
      header: HTMLAttributes<HTMLElement>;
      hgroup: HTMLAttributes<HTMLElement>;
      hr: HTMLAttributes<HTMLHRElement>;
      html: HTMLAttributes<HTMLHtmlElement>;
      i: HTMLAttributes<HTMLElement>;
      iframe: HTMLAttributes<HTMLIFrameElement>;
      img: HTMLAttributes<HTMLImageElement>;
      input: HTMLAttributes<HTMLInputElement>;
      ins: HTMLAttributes<HTMLModElement>;
      kbd: HTMLAttributes<HTMLElement>;
      keygen: HTMLAttributes<HTMLUnknownElement>;
      label: HTMLAttributes<HTMLLabelElement>;
      legend: HTMLAttributes<HTMLLegendElement>;
      li: HTMLAttributes<HTMLLIElement>;
      link: HTMLAttributes<HTMLLinkElement>;
      main: HTMLAttributes<HTMLElement>;
      map: HTMLAttributes<HTMLMapElement>;
      mark: HTMLAttributes<HTMLElement>;
      template: HTMLAttributes<HTMLTemplateElement>;
      marquee: HTMLAttributes<HTMLMarqueeElement>;
      menu: HTMLAttributes<HTMLMenuElement>;
      menuitem: HTMLAttributes<HTMLUnknownElement>;
      meta: HTMLAttributes<HTMLMetaElement>;
      meter: HTMLAttributes<HTMLMeterElement>;
      nav: HTMLAttributes<HTMLElement>;
      noscript: HTMLAttributes<HTMLElement>;
      object: HTMLAttributes<HTMLObjectElement>;
      ol: HTMLAttributes<HTMLOListElement>;
      optgroup: HTMLAttributes<HTMLOptGroupElement>;
      option: HTMLAttributes<HTMLOptionElement>;
      output: HTMLAttributes<HTMLOutputElement>;
      p: HTMLAttributes<HTMLParagraphElement>;
      param: HTMLAttributes<HTMLParamElement>;
      picture: HTMLAttributes<HTMLPictureElement>;
      pre: HTMLAttributes<HTMLPreElement>;
      progress: HTMLAttributes<HTMLProgressElement>;
      q: HTMLAttributes<HTMLQuoteElement>;
      rp: HTMLAttributes<HTMLElement>;
      rt: HTMLAttributes<HTMLElement>;
      ruby: HTMLAttributes<HTMLElement>;
      s: HTMLAttributes<HTMLElement>;
      samp: HTMLAttributes<HTMLElement>;
      script: HTMLAttributes<HTMLScriptElement>;
      search: HTMLAttributes<HTMLElement>;
      section: HTMLAttributes<HTMLElement>;
      select: HTMLAttributes<HTMLSelectElement>;
      slot: HTMLAttributes<HTMLSlotElement>;
      small: HTMLAttributes<HTMLElement>;
      source: HTMLAttributes<HTMLSourceElement>;
      span: HTMLAttributes<HTMLSpanElement>;
      strong: HTMLAttributes<HTMLElement>;
      style: HTMLAttributes<HTMLStyleElement>;
      sub: HTMLAttributes<HTMLElement>;
      summary: HTMLAttributes<HTMLElement>;
      sup: HTMLAttributes<HTMLElement>;
      table: HTMLAttributes<HTMLTableElement>;
      tbody: HTMLAttributes<HTMLTableSectionElement>;
      td: HTMLAttributes<HTMLTableCellElement>;
      textarea: HTMLAttributes<HTMLTextAreaElement>;
      tfoot: HTMLAttributes<HTMLTableSectionElement>;
      th: HTMLAttributes<HTMLTableCellElement>;
      thead: HTMLAttributes<HTMLTableSectionElement>;
      time: HTMLAttributes<HTMLTimeElement>;
      title: HTMLAttributes<HTMLTitleElement>;
      tr: HTMLAttributes<HTMLTableRowElement>;
      track: HTMLAttributes<HTMLTrackElement>;
      u: HTMLAttributes<HTMLElement>;
      ul: HTMLAttributes<HTMLUListElement>;
      var: HTMLAttributes<HTMLElement>;
      video: HTMLAttributes<HTMLVideoElement>;
      wbr: HTMLAttributes<HTMLElement>;

      //SVG
      svg: SVGAttributes<SVGSVGElement>;
      animate: SVGAttributes<SVGAnimateElement>;
      circle: SVGAttributes<SVGCircleElement>;
      animateMotion: SVGAttributes<SVGAnimateMotionElement>;
      animateTransform: SVGAttributes<SVGAnimateTransformElement>;
      clipPath: SVGAttributes<SVGClipPathElement>;
      defs: SVGAttributes<SVGDefsElement>;
      desc: SVGAttributes<SVGDescElement>;
      ellipse: SVGAttributes<SVGEllipseElement>;
      feBlend: SVGAttributes<SVGFEBlendElement>;
      feColorMatrix: SVGAttributes<SVGFEColorMatrixElement>;
      feComponentTransfer: SVGAttributes<SVGFEComponentTransferElement>;
      feComposite: SVGAttributes<SVGFECompositeElement>;
      feConvolveMatrix: SVGAttributes<SVGFEConvolveMatrixElement>;
      feDiffuseLighting: SVGAttributes<SVGFEDiffuseLightingElement>;
      feDisplacementMap: SVGAttributes<SVGFEDisplacementMapElement>;
      feDistantLight: SVGAttributes<SVGFEDistantLightElement>;
      feDropShadow: SVGAttributes<SVGFEDropShadowElement>;
      feFlood: SVGAttributes<SVGFEFloodElement>;
      feFuncA: SVGAttributes<SVGFEFuncAElement>;
      feFuncB: SVGAttributes<SVGFEFuncBElement>;
      feFuncG: SVGAttributes<SVGFEFuncGElement>;
      feFuncR: SVGAttributes<SVGFEFuncRElement>;
      feGaussianBlur: SVGAttributes<SVGFEGaussianBlurElement>;
      feImage: SVGAttributes<SVGFEImageElement>;
      feMerge: SVGAttributes<SVGFEMergeElement>;
      feMergeNode: SVGAttributes<SVGFEMergeNodeElement>;
      feMorphology: SVGAttributes<SVGFEMorphologyElement>;
      feOffset: SVGAttributes<SVGFEOffsetElement>;
      fePointLight: SVGAttributes<SVGFEPointLightElement>;
      feSpecularLighting: SVGAttributes<SVGFESpecularLightingElement>;
      feSpotLight: SVGAttributes<SVGFESpotLightElement>;
      feTile: SVGAttributes<SVGFETileElement>;
      feTurbulence: SVGAttributes<SVGFETurbulenceElement>;
      filter: SVGAttributes<SVGFilterElement>;
      foreignObject: SVGAttributes<SVGForeignObjectElement>;
      g: SVGAttributes<SVGGElement>;
      image: SVGAttributes<SVGImageElement>;
      line: SVGAttributes<SVGLineElement>;
      linearGradient: SVGAttributes<SVGLinearGradientElement>;
      marker: SVGAttributes<SVGMarkerElement>;
      mask: SVGAttributes<SVGMaskElement>;
      metadata: SVGAttributes<SVGMetadataElement>;
      mpath: SVGAttributes<SVGMPathElement>;
      path: SVGAttributes<SVGPathElement>;
      pattern: SVGAttributes<SVGPatternElement>;
      polygon: SVGAttributes<SVGPolygonElement>;
      polyline: SVGAttributes<SVGPolylineElement>;
      radialGradient: SVGAttributes<SVGRadialGradientElement>;
      rect: SVGAttributes<SVGRectElement>;
      set: SVGAttributes<SVGSetElement>;
      stop: SVGAttributes<SVGStopElement>;
      switch: SVGAttributes<SVGSwitchElement>;
      symbol: SVGAttributes<SVGSymbolElement>;
      text: SVGAttributes<SVGTextElement>;
      textPath: SVGAttributes<SVGTextPathElement>;
      tspan: SVGAttributes<SVGTSpanElement>;
      use: SVGAttributes<SVGUseElement>;
      view: SVGAttributes<SVGViewElement>;

      /**
       * Description:
       *
       * The `context-provider` is used to set a shared value to a sub-tree of components.
       *
       * Useful to avoid passing props down manually at every level.
       *
       * Example:
       *
       * ```tsx
       * <context-provider context={context} value={value}>
       *  {children}
       * </context-provider>
       * ```
       *
       * Docs:
       *
       * - [How to use `context-provider`](https://brisa.build/docs/components-details/context)
       */
      "context-provider": ContextProviderAttributes<HTMLElement>;
    }
  }
}

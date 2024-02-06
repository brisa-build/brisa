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
      /** Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. */
      "aria-activedescendant"?: string | undefined;
      /** Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. */
      "aria-atomic"?: boolean | undefined;
      /**
       * Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
       * presented if they are made.
       */
      "aria-autocomplete"?: "none" | "inline" | "list" | "both" | undefined;
      /**
       * Defines a string value that labels the current element, which is intended to be converted into Braille.
       * @see aria-label.
       */
      "aria-braillelabel"?: string | undefined;
      /**
       * Defines a human-readable, author-localized abbreviated description for the role of an element, which is intended to be converted into Braille.
       * @see aria-roledescription.
       */
      "aria-brailleroledescription"?: string | undefined;
      /** Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user. */
      "aria-busy"?: boolean | undefined;
      /**
       * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
       * @see aria-pressed
       * @see aria-selected.
       */
      "aria-checked"?: boolean | "mixed" | undefined;
      /**
       * Defines the total number of columns in a table, grid, or treegrid.
       * @see aria-colindex.
       */
      "aria-colcount"?: number | undefined;
      /**
       * Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.
       * @see aria-colcount
       * @see aria-colspan.
       */
      "aria-colindex"?: number | undefined;
      /**
       * Defines a human readable text alternative of aria-colindex.
       * @see aria-rowindextext.
       */
      "aria-colindextext"?: string | undefined;
      /**
       * Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.
       * @see aria-colindex
       * @see aria-rowspan.
       */
      "aria-colspan"?: number | undefined;
      /**
       * Identifies the element (or elements) whose contents or presence are controlled by the current element.
       * @see aria-owns.
       */
      "aria-controls"?: string | undefined;
      /** Indicates the element that represents the current item within a container or set of related elements. */
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
       */
      "aria-describedby"?: string | undefined;
      /**
       * Defines a string value that describes or annotates the current element.
       * @see related aria-describedby.
       */
      "aria-description"?: string | undefined;
      /**
       * Identifies the element that provides a detailed, extended description for the object.
       * @see aria-describedby.
       */
      "aria-details"?: string | undefined;
      /**
       * Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
       * @see aria-hidden
       * @see aria-readonly.
       */
      "aria-disabled"?: boolean | undefined;
      /**
       * Indicates what functions can be performed when a dragged object is released on the drop target.
       * @deprecated in ARIA 1.1
       */
      "aria-dropeffect"?:
        | "none"
        | "copy"
        | "execute"
        | "link"
        | "move"
        | "popup"
        | undefined;
      /**
       * Identifies the element that provides an error message for the object.
       * @see aria-invalid
       * @see aria-describedby.
       */
      "aria-errormessage"?: string | undefined;
      /** Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. */
      "aria-expanded"?: boolean | undefined;
      /**
       * Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
       * allows assistive technology to override the general default of reading in document source order.
       */
      "aria-flowto"?: string | undefined;
      /**
       * Indicates an element's "grabbed" state in a drag-and-drop operation.
       * @deprecated in ARIA 1.1
       */
      "aria-grabbed"?: boolean | undefined;
      /** Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. */
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
       */
      "aria-hidden"?: boolean | undefined;
      /**
       * Indicates the entered value does not conform to the format expected by the application.
       * @see aria-errormessage.
       */
      "aria-invalid"?: boolean | "grammar" | "spelling" | undefined;
      /** Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. */
      "aria-keyshortcuts"?: string | undefined;
      /**
       * Defines a string value that labels the current element.
       * @see aria-labelledby.
       */
      "aria-label"?: string | undefined;
      /**
       * Identifies the element (or elements) that labels the current element.
       * @see aria-describedby.
       */
      "aria-labelledby"?: string | undefined;
      /** Defines the hierarchical level of an element within a structure. */
      "aria-level"?: number | undefined;
      /** Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. */
      "aria-live"?: "off" | "assertive" | "polite" | undefined;
      /** Indicates whether an element is modal when displayed. */
      "aria-modal"?: boolean | undefined;
      /** Indicates whether a text box accepts multiple lines of input or only a single line. */
      "aria-multiline"?: boolean | undefined;
      /** Indicates that the user may select more than one item from the current selectable descendants. */
      "aria-multiselectable"?: boolean | undefined;
      /** Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. */
      "aria-orientation"?: "horizontal" | "vertical" | undefined;
      /**
       * Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
       * between DOM elements where the DOM hierarchy cannot be used to represent the relationship.
       * @see aria-controls.
       */
      "aria-owns"?: string | undefined;
      /**
       * Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
       * A hint could be a sample value or a brief description of the expected format.
       */
      "aria-placeholder"?: string | undefined;
      /**
       * Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
       * @see aria-setsize.
       */
      "aria-posinset"?: number | undefined;
      /**
       * Indicates the current "pressed" state of toggle buttons.
       * @see aria-checked
       * @see aria-selected.
       */
      "aria-pressed"?: boolean | "mixed" | undefined;
      /**
       * Indicates that the element is not editable, but is otherwise operable.
       * @see aria-disabled.
       */
      "aria-readonly"?: boolean | undefined;
      /**
       * Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.
       * @see aria-atomic.
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
      /** Indicates that user input is required on the element before a form may be submitted. */
      "aria-required"?: boolean | undefined;
      /** Defines a human-readable, author-localized description for the role of an element. */
      "aria-roledescription"?: string | undefined;
      /**
       * Defines the total number of rows in a table, grid, or treegrid.
       * @see aria-rowindex.
       */
      "aria-rowcount"?: number | undefined;
      /**
       * Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.
       * @see aria-rowcount
       * @see aria-rowspan.
       */
      "aria-rowindex"?: number | undefined;
      /**
       * Defines a human readable text alternative of aria-rowindex.
       * @see aria-colindextext.
       */
      "aria-rowindextext"?: string | undefined;
      /**
       * Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
       * @see aria-rowindex
       * @see aria-colspan.
       */
      "aria-rowspan"?: number | undefined;
      /**
       * Indicates the current "selected" state of various widgets.
       * @see aria-checked
       * @see aria-pressed.
       */
      "aria-selected"?: boolean | undefined;
      /**
       * Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
       * @see aria-posinset.
       */
      "aria-setsize"?: number | undefined;
      /** Indicates if items in a table or grid are sorted in ascending or descending order. */
      "aria-sort"?: "none" | "ascending" | "descending" | "other" | undefined;
      /** Defines the maximum allowed value for a range widget. */
      "aria-valuemax"?: number | undefined;
      /** Defines the minimum allowed value for a range widget. */
      "aria-valuemin"?: number | undefined;
      /**
       * Defines the current value for a range widget.
       * @see aria-valuetext.
       */
      "aria-valuenow"?: number | undefined;
      /** Defines the human readable text alternative of aria-valuenow for a range widget. */
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
      accentHeight?: number | string | undefined;
      accumulate?: "none" | "sum" | undefined;
      additive?: "replace" | "sum" | undefined;
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
      allowReorder?: "no" | "yes" | undefined;
      "allow-reorder"?: "no" | "yes" | undefined;
      alphabetic?: number | string | undefined;
      amplitude?: number | string | undefined;
      /** @deprecated See https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/arabic-form */
      arabicForm?: "initial" | "medial" | "terminal" | "isolated" | undefined;
      /** @deprecated See https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/arabic-form */
      "arabic-form"?:
        | "initial"
        | "medial"
        | "terminal"
        | "isolated"
        | undefined;
      ascent?: number | string | undefined;
      attributeName?: string | undefined;
      attributeType?: string | undefined;
      autoReverse?: number | string | undefined;
      azimuth?: number | string | undefined;
      baseFrequency?: number | string | undefined;
      baselineShift?: number | string | undefined;
      "baseline-shift"?: number | string | undefined;
      baseProfile?: number | string | undefined;
      bbox?: number | string | undefined;
      begin?: number | string | undefined;
      bias?: number | string | undefined;
      by?: number | string | undefined;
      calcMode?: number | string | undefined;
      capHeight?: number | string | undefined;
      "cap-height"?: number | string | undefined;
      clip?: number | string | undefined;
      clipPath?: string | undefined;
      "clip-path"?: string | undefined;
      clipPathUnits?: number | string | undefined;
      clipRule?: number | string | undefined;
      "clip-rule"?: number | string | undefined;
      colorInterpolation?: number | string | undefined;
      "color-interpolation"?: number | string | undefined;
      colorInterpolationFilters?:
        | "auto"
        | "sRGB"
        | "linearRGB"
        | "inherit"
        | undefined;
      "color-interpolation-filters"?:
        | "auto"
        | "sRGB"
        | "linearRGB"
        | "inherit"
        | undefined;
      colorProfile?: number | string | undefined;
      "color-profile"?: number | string | undefined;
      colorRendering?: number | string | undefined;
      "color-rendering"?: number | string | undefined;
      contentScriptType?: number | string | undefined;
      "content-script-type"?: number | string | undefined;
      contentStyleType?: number | string | undefined;
      "content-style-type"?: number | string | undefined;
      cursor?: number | string | undefined;
      cx?: number | string | undefined;
      cy?: number | string | undefined;
      d?: string | undefined;
      decelerate?: number | string | undefined;
      descent?: number | string | undefined;
      diffuseConstant?: number | string | undefined;
      direction?: number | string | undefined;
      display?: number | string | undefined;
      divisor?: number | string | undefined;
      dominantBaseline?: number | string | undefined;
      "dominant-baseline"?: number | string | undefined;
      dur?: number | string | undefined;
      dx?: number | string | undefined;
      dy?: number | string | undefined;
      edgeMode?: number | string | undefined;
      elevation?: number | string | undefined;
      enableBackground?: number | string | undefined;
      "enable-background"?: number | string | undefined;
      end?: number | string | undefined;
      exponent?: number | string | undefined;
      externalResourcesRequired?: number | string | undefined;
      fill?: string | undefined;
      fillOpacity?: number | string | undefined;
      "fill-opacity"?: number | string | undefined;
      fillRule?: "nonzero" | "evenodd" | "inherit" | undefined;
      "fill-rule"?: "nonzero" | "evenodd" | "inherit" | undefined;
      filter?: string | undefined;
      filterRes?: number | string | undefined;
      filterUnits?: number | string | undefined;
      floodColor?: number | string | undefined;
      "flood-color"?: number | string | undefined;
      floodOpacity?: number | string | undefined;
      "flood-opacity"?: number | string | undefined;
      focusable?: number | string | undefined;
      fontFamily?: string | undefined;
      "font-family"?: string | undefined;
      fontSize?: number | string | undefined;
      "font-size"?: number | string | undefined;
      fontSizeAdjust?: number | string | undefined;
      "font-size-adjust"?: number | string | undefined;
      fontStretch?: number | string | undefined;
      "font-stretch"?: number | string | undefined;
      fontStyle?: number | string | undefined;
      "font-style"?: number | string | undefined;
      fontVariant?: number | string | undefined;
      "font-variant"?: number | string | undefined;
      fontWeight?: number | string | undefined;
      "font-weight"?: number | string | undefined;
      format?: number | string | undefined;
      from?: number | string | undefined;
      fx?: number | string | undefined;
      fy?: number | string | undefined;
      g1?: number | string | undefined;
      g2?: number | string | undefined;
      glyphName?: number | string | undefined;
      "glyph-name"?: number | string | undefined;
      glyphOrientationHorizontal?: number | string | undefined;
      "glyph-orientation-horizontal"?: number | string | undefined;
      glyphOrientationVertical?: number | string | undefined;
      "glyph-orientation-vertical"?: number | string | undefined;
      glyphRef?: number | string | undefined;
      gradientTransform?: string | undefined;
      gradientUnits?: string | undefined;
      hanging?: number | string | undefined;
      horizAdvX?: number | string | undefined;
      "horiz-adv-x"?: number | string | undefined;
      horizOriginX?: number | string | undefined;
      "horiz-origin-x"?: number | string | undefined;
      ideographic?: number | string | undefined;
      imageRendering?: number | string | undefined;
      "image-rendering"?: number | string | undefined;
      in2?: number | string | undefined;
      in?: string | undefined;
      intercept?: number | string | undefined;
      k1?: number | string | undefined;
      k2?: number | string | undefined;
      k3?: number | string | undefined;
      k4?: number | string | undefined;
      k?: number | string | undefined;
      kernelMatrix?: number | string | undefined;
      kernelUnitLength?: number | string | undefined;
      kerning?: number | string | undefined;
      keyPoints?: number | string | undefined;
      keySplines?: number | string | undefined;
      keyTimes?: number | string | undefined;
      lengthAdjust?: number | string | undefined;
      letterSpacing?: number | string | undefined;
      "letter-spacing"?: number | string | undefined;
      lightingColor?: number | string | undefined;
      "lighting-color"?: number | string | undefined;
      limitingConeAngle?: number | string | undefined;
      local?: number | string | undefined;
      markerEnd?: string | undefined;
      "marker-end"?: string | undefined;
      markerHeight?: number | string | undefined;
      markerMid?: string | undefined;
      "marker-mid"?: string | undefined;
      markerStart?: string | undefined;
      "marker-start"?: string | undefined;
      markerUnits?: number | string | undefined;
      markerWidth?: number | string | undefined;
      mask?: string | undefined;
      maskContentUnits?: number | string | undefined;
      maskUnits?: number | string | undefined;
      mathematical?: number | string | undefined;
      mode?: number | string | undefined;
      numOctaves?: number | string | undefined;
      offset?: number | string | undefined;
      opacity?: number | string | undefined;
      operator?: number | string | undefined;
      order?: number | string | undefined;
      orient?: number | string | undefined;
      orientation?: number | string | undefined;
      origin?: number | string | undefined;
      overflow?: number | string | undefined;
      overlinePosition?: number | string | undefined;
      "overline-position"?: number | string | undefined;
      overlineThickness?: number | string | undefined;
      "overline-thickness"?: number | string | undefined;
      paintOrder?: number | string | undefined;
      "paint-order"?: number | string | undefined;
      panose1?: number | string | undefined;
      "panose-1"?: number | string | undefined;
      pathLength?: number | string | undefined;
      patternContentUnits?: string | undefined;
      patternTransform?: number | string | undefined;
      patternUnits?: string | undefined;
      pointerEvents?: number | string | undefined;
      "pointer-events"?: number | string | undefined;
      points?: string | undefined;
      pointsAtX?: number | string | undefined;
      pointsAtY?: number | string | undefined;
      pointsAtZ?: number | string | undefined;
      preserveAlpha?: number | string | undefined;
      preserveAspectRatio?: string | undefined;
      primitiveUnits?: number | string | undefined;
      r?: number | string | undefined;
      radius?: number | string | undefined;
      refX?: number | string | undefined;
      refY?: number | string | undefined;
      renderingIntent?: number | string | undefined;
      "rendering-intent"?: number | string | undefined;
      repeatCount?: number | string | undefined;
      "repeat-count"?: number | string | undefined;
      repeatDur?: number | string | undefined;
      "repeat-dur"?: number | string | undefined;
      requiredExtensions?: number | string | undefined;
      requiredFeatures?: number | string | undefined;
      restart?: number | string | undefined;
      result?: string | undefined;
      rotate?: number | string | undefined;
      rx?: number | string | undefined;
      ry?: number | string | undefined;
      scale?: number | string | undefined;
      seed?: number | string | undefined;
      shapeRendering?: number | string | undefined;
      "shape-rendering"?: number | string | undefined;
      slope?: number | string | undefined;
      spacing?: number | string | undefined;
      specularConstant?: number | string | undefined;
      specularExponent?: number | string | undefined;
      speed?: number | string | undefined;
      spreadMethod?: string | undefined;
      startOffset?: number | string | undefined;
      stdDeviation?: number | string | undefined;
      stemh?: number | string | undefined;
      stemv?: number | string | undefined;
      stitchTiles?: number | string | undefined;
      stopColor?: string | undefined;
      "stop-color"?: string | undefined;
      stopOpacity?: number | string | undefined;
      "stop-opacity"?: number | string | undefined;
      strikethroughPosition?: number | string | undefined;
      "strikethrough-position"?: number | string | undefined;
      strikethroughThickness?: number | string | undefined;
      "strikethrough-thickness"?: number | string | undefined;
      string?: number | string | undefined;
      stroke?: string | undefined;
      strokeDasharray?: string | number | undefined;
      "stroke-dasharray"?: string | number | undefined;
      strokeDashoffset?: string | number | undefined;
      "stroke-dashoffset"?: string | number | undefined;
      strokeLinecap?: "butt" | "round" | "square" | "inherit" | undefined;
      "stroke-linecap"?: "butt" | "round" | "square" | "inherit" | undefined;
      strokeLinejoin?: "miter" | "round" | "bevel" | "inherit" | undefined;
      "stroke-linejoin"?: "miter" | "round" | "bevel" | "inherit" | undefined;
      strokeMiterlimit?: string | number | undefined;
      "stroke-miterlimit"?: string | number | undefined;
      strokeOpacity?: number | string | undefined;
      "stroke-opacity"?: number | string | undefined;
      strokeWidth?: number | string | undefined;
      "stroke-width"?: number | string | undefined;
      surfaceScale?: number | string | undefined;
      systemLanguage?: number | string | undefined;
      tableValues?: number | string | undefined;
      targetX?: number | string | undefined;
      targetY?: number | string | undefined;
      textAnchor?: string | undefined;
      "text-anchor"?: string | undefined;
      textDecoration?: number | string | undefined;
      "text-decoration"?: number | string | undefined;
      textLength?: number | string | undefined;
      textRendering?: number | string | undefined;
      to?: number | string | undefined;
      transform?: string | undefined;
      u1?: number | string | undefined;
      u2?: number | string | undefined;
      underlinePosition?: number | string | undefined;
      "underline-position"?: number | string | undefined;
      underlineThickness?: number | string | undefined;
      "underline-thickness"?: number | string | undefined;
      unicode?: number | string | undefined;
      unicodeBidi?: number | string | undefined;
      "unicode-bidi"?: number | string | undefined;
      unicodeRange?: number | string | undefined;
      "unicode-range"?: number | string | undefined;
      unitsPerEm?: number | string | undefined;
      "units-per-em"?: number | string | undefined;
      vAlphabetic?: number | string | undefined;
      "v-alphabetic"?: number | string | undefined;
      values?: string | undefined;
      vectorEffect?: number | string | undefined;
      "vector-effect"?: number | string | undefined;
      version?: string | undefined;
      vertAdvY?: number | string | undefined;
      "vert-adv-y"?: number | string | undefined;
      vertOriginX?: number | string | undefined;
      "vert-origin-x"?: number | string | undefined;
      vertOriginY?: number | string | undefined;
      "vert-origin-y"?: number | string | undefined;
      vHanging?: number | string | undefined;
      "v-hanging"?: number | string | undefined;
      vIdeographic?: number | string | undefined;
      "v-ideographic"?: number | string | undefined;
      viewBox?: string | undefined;
      viewTarget?: number | string | undefined;
      visibility?: number | string | undefined;
      vMathematical?: number | string | undefined;
      "v-mathematical"?: number | string | undefined;
      widths?: number | string | undefined;
      wordSpacing?: number | string | undefined;
      "word-spacing"?: number | string | undefined;
      writingMode?: number | string | undefined;
      "writing-mode"?: number | string | undefined;
      x1?: number | string | undefined;
      x2?: number | string | undefined;
      x?: number | string | undefined;
      xChannelSelector?: string | undefined;
      xHeight?: number | string | undefined;
      "x-height"?: number | string | undefined;
      xlinkActuate?: string | undefined;
      "xlink:actuate"?: SVGAttributes["xlinkActuate"];
      xlinkArcrole?: string | undefined;
      "xlink:arcrole"?: string | undefined;
      xlinkHref?: string | undefined;
      "xlink:href"?: string | undefined;
      xlinkRole?: string | undefined;
      "xlink:role"?: string | undefined;
      xlinkShow?: string | undefined;
      "xlink:show"?: string | undefined;
      xlinkTitle?: string | undefined;
      "xlink:title"?: string | undefined;
      xlinkType?: string | undefined;
      "xlink:type"?: string | undefined;
      xmlBase?: string | undefined;
      "xml:base"?: string | undefined;
      xmlLang?: string | undefined;
      "xml:lang"?: string | undefined;
      xmlns?: string | undefined;
      xmlnsXlink?: string | undefined;
      xmlSpace?: string | undefined;
      "xml:space"?: string | undefined;
      y1?: number | string | undefined;
      y2?: number | string | undefined;
      y?: number | string | undefined;
      yChannelSelector?: string | undefined;
      z?: number | string | undefined;
      zoomAndPan?: string | undefined;
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
      TargetedSubmitEvent<Target>
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
      onLoad?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onLoadCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <img onLoadCapture-debounce={500} onLoadCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onLoadCapture-debounce"?: number | undefined;
      onLoadCapture?: GenericEventHandler<Target> | undefined;

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
      onError?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onErrorCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <img onErrorCapture-debounce={500} onErrorCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onErrorCapture-debounce"?: number | undefined;
      onErrorCapture?: GenericEventHandler<Target> | undefined;

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
      onCopy?: ClipboardEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onCopyCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <p onCopyCapture-debounce={500} onCopyCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onCopyCapture-debounce"?: number | undefined;
      onCopyCapture?: ClipboardEventHandler<Target> | undefined;

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
      onCut?: ClipboardEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onCutCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <p onCutCapture-debounce={500} onCutCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onCutCapture-debounce"?: number | undefined;
      onCutCapture?: ClipboardEventHandler<Target> | undefined;

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
      onPaste?: ClipboardEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPasteCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <p onPasteCapture-debounce={500} onPasteCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPasteCapture-debounce"?: number | undefined;
      onPasteCapture?: ClipboardEventHandler<Target> | undefined;

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
      onCompositionEnd?: CompositionEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onCompositionEndCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onCompositionEndCapture-debounce={500} onCompositionEndCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onCompositionEndCapture-debounce"?: number | undefined;
      onCompositionEndCapture?: CompositionEventHandler<Target> | undefined;

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
      onCompositionStart?: CompositionEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onCompositionStartCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onCompositionStartCapture-debounce={500} onCompositionStartCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onCompositionStartCapture-debounce"?: number | undefined;
      onCompositionStartCapture?: CompositionEventHandler<Target> | undefined;

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
      onCompositionUpdate?: CompositionEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onCompositionUpdateCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onCompositionUpdateCapture-debounce={500} onCompositionUpdateCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onCompositionUpdateCapture-debounce"?: number | undefined;
      onCompositionUpdateCapture?: CompositionEventHandler<Target> | undefined;

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
      onFocus?: FocusEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onFocusCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onFocusCapture-debounce={500} onFocusCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onFocusCapture-debounce"?: number | undefined;
      onFocusCapture?: FocusEventHandler<Target> | undefined;

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
      onfocusin?: FocusEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onfocusinCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onfocusinCapture-debounce={500} onfocusinCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onfocusinCapture-debounce"?: number | undefined;
      onfocusinCapture?: FocusEventHandler<Target> | undefined;

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
      onfocusout?: FocusEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onfocusoutCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onfocusoutCapture-debounce={500} onfocusoutCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onfocusoutCapture-debounce"?: number | undefined;
      onfocusoutCapture?: FocusEventHandler<Target> | undefined;

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
      onBlur?: FocusEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onBlurCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onBlurCapture-debounce={500} onBlurCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onBlurCapture-debounce"?: number | undefined;
      onBlurCapture?: FocusEventHandler<Target> | undefined;

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
      onChange?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onChangeCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onChangeCapture-debounce={500} onChangeCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onChangeCapture-debounce"?: number | undefined;
      onChangeCapture?: GenericEventHandler<Target> | undefined;

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
      onInput?: InputEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onInputCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onInputCapture-debounce={500} onInputCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onInputCapture-debounce"?: number | undefined;
      onInputCapture?: InputEventHandler<Target> | undefined;

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
      onBeforeInput?: InputEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onBeforeInputCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onBeforeInputCapture-debounce={500} onBeforeInputCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onBeforeInputCapture-debounce"?: number | undefined;
      onBeforeInputCapture?: InputEventHandler<Target> | undefined;

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
      onSearch?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onSearchCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onSearchCapture-debounce={500} onSearchCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onSearchCapture-debounce"?: number | undefined;
      onSearchCapture?: GenericEventHandler<Target> | undefined;

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
      onSubmit?: SubmitEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onSubmitCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <form onSubmitCapture-debounce={500} onSubmitCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onSubmitCapture-debounce"?: number | undefined;
      onSubmitCapture?: SubmitEventHandler<Target> | undefined;

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
      onInvalid?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onInvalidCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onInvalidCapture-debounce={500} onInvalidCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onInvalidCapture-debounce"?: number | undefined;
      onInvalidCapture?: GenericEventHandler<Target> | undefined;

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
      onReset?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onResetCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <form onResetCapture-debounce={500} onResetCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onResetCapture-debounce"?: number | undefined;
      onResetCapture?: GenericEventHandler<Target> | undefined;

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
      onFormData?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onFormDataCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <form onFormDataCapture-debounce={500} onFormDataCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onFormDataCapture-debounce"?: number | undefined;
      onFormDataCapture?: GenericEventHandler<Target> | undefined;

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
      onKeyDown?: KeyboardEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onKeyDownCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onKeyDownCapture-debounce={500} onKeyDownCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onKeyDownCapture-debounce"?: number | undefined;
      onKeyDownCapture?: KeyboardEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onKeyPress` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onKeyPress-debounce={500} onKeyPress={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onKeyPress-debounce"?: number | undefined;
      onKeyPress?: KeyboardEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onKeyPressCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onKeyPressCapture-debounce={500} onKeyPressCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onKeyPressCapture-debounce"?: number | undefined;
      onKeyPressCapture?: KeyboardEventHandler<Target> | undefined;

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
      onKeyUp?: KeyboardEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onKeyUpCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onKeyUpCapture-debounce={500} onKeyUpCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onKeyUpCapture-debounce"?: number | undefined;
      onKeyUpCapture?: KeyboardEventHandler<Target> | undefined;

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
      onAbort?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onAbortCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onAbortCapture-debounce={500} onAbortCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onAbortCapture-debounce"?: number | undefined;
      onAbortCapture?: GenericEventHandler<Target> | undefined;

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
      onCanPlay?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onCanPlayCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onCanPlayCapture-debounce={500} onCanPlayCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onCanPlayCapture-debounce"?: number | undefined;
      onCanPlayCapture?: GenericEventHandler<Target> | undefined;

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
      onCanPlayThrough?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onCanPlayThroughCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onCanPlayThroughCapture-debounce={500} onCanPlayThroughCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onCanPlayThroughCapture-debounce"?: number | undefined;
      onCanPlayThroughCapture?: GenericEventHandler<Target> | undefined;

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
      onDurationChange?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDurationChangeCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onDurationChangeCapture-debounce={500} onDurationChangeCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDurationChangeCapture-debounce"?: number | undefined;
      onDurationChangeCapture?: GenericEventHandler<Target> | undefined;

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
      onEmptied?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onEmptiedCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onEmptiedCapture-debounce={500} onEmptiedCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onEmptiedCapture-debounce"?: number | undefined;
      onEmptiedCapture?: GenericEventHandler<Target> | undefined;

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
      onEncrypted?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onEncryptedCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onEncryptedCapture-debounce={500} onEncryptedCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onEncryptedCapture-debounce"?: number | undefined;
      onEncryptedCapture?: GenericEventHandler<Target> | undefined;

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
      onEnded?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onEndedCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onEndedCapture-debounce={500} onEndedCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onEndedCapture-debounce"?: number | undefined;
      onEndedCapture?: GenericEventHandler<Target> | undefined;

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
      onLoadedData?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onLoadedDataCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onLoadedDataCapture-debounce={500} onLoadedDataCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onLoadedDataCapture-debounce"?: number | undefined;
      onLoadedDataCapture?: GenericEventHandler<Target> | undefined;

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
      onLoadedMetadata?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onLoadedMetadataCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onLoadedMetadataCapture-debounce={500} onLoadedMetadataCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onLoadedMetadataCapture-debounce"?: number | undefined;
      onLoadedMetadataCapture?: GenericEventHandler<Target> | undefined;

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
      onLoadStart?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onLoadStartCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onLoadStartCapture-debounce={500} onLoadStartCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onLoadStartCapture-debounce"?: number | undefined;
      onLoadStartCapture?: GenericEventHandler<Target> | undefined;

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
      onPause?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPauseCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onPauseCapture-debounce={500} onPauseCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPauseCapture-debounce"?: number | undefined;
      onPauseCapture?: GenericEventHandler<Target> | undefined;

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
      onPlay?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPlayCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onPlayCapture-debounce={500} onPlayCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPlayCapture-debounce"?: number | undefined;
      onPlayCapture?: GenericEventHandler<Target> | undefined;

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
      onPlaying?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPlayingCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onPlayingCapture-debounce={500} onPlayingCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPlayingCapture-debounce"?: number | undefined;
      onPlayingCapture?: GenericEventHandler<Target> | undefined;

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
      onProgress?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onProgressCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onProgressCapture-debounce={500} onProgressCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onProgressCapture-debounce"?: number | undefined;
      onProgressCapture?: GenericEventHandler<Target> | undefined;

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
      onRateChange?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onRateChangeCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onRateChangeCapture-debounce={500} onRateChangeCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onRateChangeCapture-debounce"?: number | undefined;
      onRateChangeCapture?: GenericEventHandler<Target> | undefined;

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
      onSeeked?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onSeekedCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onSeekedCapture-debounce={500} onSeekedCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onSeekedCapture-debounce"?: number | undefined;
      onSeekedCapture?: GenericEventHandler<Target> | undefined;

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
      onSeeking?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onSeekingCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onSeekingCapture-debounce={500} onSeekingCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onSeekingCapture-debounce"?: number | undefined;
      onSeekingCapture?: GenericEventHandler<Target> | undefined;

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
      onStalled?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onStalledCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onStalledCapture-debounce={500} onStalledCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onStalledCapture-debounce"?: number | undefined;
      onStalledCapture?: GenericEventHandler<Target> | undefined;

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
      onSuspend?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onSuspendCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onSuspendCapture-debounce={500} onSuspendCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onSuspendCapture-debounce"?: number | undefined;
      onSuspendCapture?: GenericEventHandler<Target> | undefined;

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
      onTimeUpdate?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onTimeUpdateCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onTimeUpdateCapture-debounce={500} onTimeUpdateCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTimeUpdateCapture-debounce"?: number | undefined;
      onTimeUpdateCapture?: GenericEventHandler<Target> | undefined;

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
      onVolumeChange?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onVolumeChangeCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onVolumeChangeCapture-debounce={500} onVolumeChangeCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onVolumeChangeCapture-debounce"?: number | undefined;
      onVolumeChangeCapture?: GenericEventHandler<Target> | undefined;

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
      onWaiting?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onWaitingCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onWaitingCapture-debounce={500} onWaitingCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onWaitingCapture-debounce"?: number | undefined;
      onWaitingCapture?: GenericEventHandler<Target> | undefined;

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
      onClick?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onClickCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onClickCapture-debounce={500} onClickCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onClickCapture-debounce"?: number | undefined;
      onClickCapture?: MouseEventHandler<Target> | undefined;

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
      onContextMenu?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onContextMenuCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onContextMenuCapture-debounce={500} onContextMenuCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onContextMenuCapture-debounce"?: number | undefined;
      onContextMenuCapture?: MouseEventHandler<Target> | undefined;

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
      onDblClick?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDblClickCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDblClickCapture-debounce={500} onDblClickCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDblClickCapture-debounce"?: number | undefined;
      onDblClickCapture?: MouseEventHandler<Target> | undefined;

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
      onDrag?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDragCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDragCapture-debounce={500} onDragCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDragCapture-debounce"?: number | undefined;
      onDragCapture?: DragEventHandler<Target> | undefined;

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
      onDragEnd?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDragEndCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDragEndCapture-debounce={500} onDragEndCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDragEndCapture-debounce"?: number | undefined;
      onDragEndCapture?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDragEndCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDragEndCapture-debounce={500} onDragEndCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDragEndCapture-debounce"?: number | undefined;
      onDragEnter?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDragEnterCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDragEnterCapture-debounce={500} onDragEnterCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDragEnterCapture-debounce"?: number | undefined;
      onDragEnterCapture?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDragExit` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDragExit-debounce={500} onDragExit={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDragExit-debounce"?: number | undefined;
      onDragExit?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDragExitCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDragExitCapture-debounce={500} onDragExitCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDragExitCapture-debounce"?: number | undefined;
      onDragExitCapture?: DragEventHandler<Target> | undefined;

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
      onDragLeave?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDragLeaveCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDragLeaveCapture-debounce={500} onDragLeaveCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDragLeaveCapture-debounce"?: number | undefined;
      onDragLeaveCapture?: DragEventHandler<Target> | undefined;

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
      onDragOver?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDragOverCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDragOverCapture-debounce={500} onDragOverCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDragOverCapture-debounce"?: number | undefined;
      onDragOverCapture?: DragEventHandler<Target> | undefined;

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
      onDragStart?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDragStartCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDragStartCapture-debounce={500} onDragStartCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDragStartCapture-debounce"?: number | undefined;
      onDragStartCapture?: DragEventHandler<Target> | undefined;

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
      onDrop?: DragEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onDropCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onDropCapture-debounce={500} onDropCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onDropCapture-debounce"?: number | undefined;
      onDropCapture?: DragEventHandler<Target> | undefined;

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
      onMouseDown?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onMouseDownCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onMouseDownCapture-debounce={500} onMouseDownCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onMouseDownCapture-debounce"?: number | undefined;
      onMouseDownCapture?: MouseEventHandler<Target> | undefined;

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
      onMouseEnter?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onMouseEnterCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onMouseEnterCapture-debounce={500} onMouseEnterCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onMouseEnterCapture-debounce"?: number | undefined;
      onMouseEnterCapture?: MouseEventHandler<Target> | undefined;

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
      onMouseLeave?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onMouseLeaveCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onMouseLeaveCapture-debounce={500} onMouseLeaveCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onMouseLeaveCapture-debounce"?: number | undefined;
      onMouseLeaveCapture?: MouseEventHandler<Target> | undefined;

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
      onMouseMove?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onMouseMoveCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onMouseMoveCapture-debounce={500} onMouseMoveCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onMouseMoveCapture-debounce"?: number | undefined;
      onMouseMoveCapture?: MouseEventHandler<Target> | undefined;

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
      onMouseOut?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onMouseOutCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onMouseOutCapture-debounce={500} onMouseOutCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onMouseOutCapture-debounce"?: number | undefined;
      onMouseOutCapture?: MouseEventHandler<Target> | undefined;

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
      onMouseOver?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onMouseOverCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onMouseOverCapture-debounce={500} onMouseOverCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onMouseOverCapture-debounce"?: number | undefined;
      onMouseOverCapture?: MouseEventHandler<Target> | undefined;

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
      onMouseUp?: MouseEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onMouseUpCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onMouseUpCapture-debounce={500} onMouseUpCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onMouseUpCapture-debounce"?: number | undefined;
      onMouseUpCapture?: MouseEventHandler<Target> | undefined;

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
      onSelect?: GenericEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onSelectCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <input onSelectCapture-debounce={500} onSelectCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onSelectCapture-debounce"?: number | undefined;
      onSelectCapture?: GenericEventHandler<Target> | undefined;

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
      onTouchCancel?: TouchEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onTouchCancelCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onTouchCancelCapture-debounce={500} onTouchCancelCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTouchCancelCapture-debounce"?: number | undefined;
      onTouchCancelCapture?: TouchEventHandler<Target> | undefined;

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
      onTouchEnd?: TouchEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onTouchEndCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onTouchEndCapture-debounce={500} onTouchEndCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTouchEndCapture-debounce"?: number | undefined;
      onTouchEndCapture?: TouchEventHandler<Target> | undefined;

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
      onTouchMove?: TouchEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onTouchMoveCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onTouchMoveCapture-debounce={500} onTouchMoveCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTouchMoveCapture-debounce"?: number | undefined;
      onTouchMoveCapture?: TouchEventHandler<Target> | undefined;

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
      onTouchStart?: TouchEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onTouchStartCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onTouchStartCapture-debounce={500} onTouchStartCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTouchStartCapture-debounce"?: number | undefined;
      onTouchStartCapture?: TouchEventHandler<Target> | undefined;

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
      onPointerOver?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPointerOverCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onPointerOverCapture-debounce={500} onPointerOverCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPointerOverCapture-debounce"?: number | undefined;
      onPointerOverCapture?: PointerEventHandler<Target> | undefined;

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
      onPointerEnter?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPointerEnterCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onPointerEnterCapture-debounce={500} onPointerEnterCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPointerEnterCapture-debounce"?: number | undefined;
      onPointerEnterCapture?: PointerEventHandler<Target> | undefined;

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
      onPointerDown?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPointerDownCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onPointerDownCapture-debounce={500} onPointerDownCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPointerDownCapture-debounce"?: number | undefined;
      onPointerDownCapture?: PointerEventHandler<Target> | undefined;

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
      onPointerMove?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPointerMoveCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onPointerMoveCapture-debounce={500} onPointerMoveCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPointerMoveCapture-debounce"?: number | undefined;
      onPointerMoveCapture?: PointerEventHandler<Target> | undefined;

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
      onPointerUp?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPointerUpCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onPointerUpCapture-debounce={500} onPointerUpCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPointerUpCapture-debounce"?: number | undefined;
      onPointerUpCapture?: PointerEventHandler<Target> | undefined;

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
      onPointerCancel?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPointerCancelCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onPointerCancelCapture-debounce={500} onPointerCancelCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPointerCancelCapture-debounce"?: number | undefined;
      onPointerCancelCapture?: PointerEventHandler<Target> | undefined;

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
      onPointerOut?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPointerOutCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onPointerOutCapture-debounce={500} onPointerOutCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPointerOutCapture-debounce"?: number | undefined;
      onPointerOutCapture?: PointerEventHandler<Target> | undefined;

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
      onPointerLeave?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onPointerLeaveCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onPointerLeaveCapture-debounce={500} onPointerLeaveCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onPointerLeaveCapture-debounce"?: number | undefined;
      onPointerLeaveCapture?: PointerEventHandler<Target> | undefined;

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
      onGotPointerCapture?: PointerEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onGotPointerCaptureCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onGotPointerCaptureCapture-debounce={500} onGotPointerCaptureCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onGotPointerCaptureCapture-debounce"?: number | undefined;
      onGotPointerCaptureCapture?: PointerEventHandler<Target> | undefined;

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
      onScroll?: UIEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onScrollCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onScrollCapture-debounce={500} onScrollCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onScrollCapture-debounce"?: number | undefined;
      onScrollCapture?: UIEventHandler<Target> | undefined;

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
      onWheel?: WheelEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onWheelCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onWheelCapture-debounce={500} onWheelCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onWheelCapture-debounce"?: number | undefined;
      onWheelCapture?: WheelEventHandler<Target> | undefined;

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
      onAnimationStart?: AnimationEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onAnimationStartCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onAnimationStartCapture-debounce={500} onAnimationStartCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onAnimationStartCapture-debounce"?: number | undefined;
      onAnimationStartCapture?: AnimationEventHandler<Target> | undefined;

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
      onAnimationEnd?: AnimationEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onAnimationEndCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onAnimationEndCapture-debounce={500} onAnimationEndCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onAnimationEndCapture-debounce"?: number | undefined;
      onAnimationEndCapture?: AnimationEventHandler<Target> | undefined;

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
      onAnimationIteration?: AnimationEventHandler<Target> | undefined;

      /**
       * Milliseconds to wait before executing the `onAnimationIterationCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onAnimationIterationCapture-debounce={500} onAnimationIterationCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onAnimationIterationCapture-debounce"?: number | undefined;
      onAnimationIterationCapture?: AnimationEventHandler<Target> | undefined;

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
      onTransitionCancel?: TransitionEventHandler<Target>;

      /**
       * Milliseconds to wait before executing the `onTransitionCancelCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onTransitionCancelCapture-debounce={500} onTransitionCancelCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTransitionCancelCapture-debounce"?: number | undefined;
      onTransitionCancelCapture?: TransitionEventHandler<Target>;

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
      onTransitionEnd?: TransitionEventHandler<Target>;

      /**
       * Milliseconds to wait before executing the `onTransitionEndCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onTransitionEndCapture-debounce={500} onTransitionEndCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTransitionEndCapture-debounce"?: number | undefined;
      onTransitionEndCapture?: TransitionEventHandler<Target>;

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
      onTransitionRun?: TransitionEventHandler<Target>;

      /**
       * Milliseconds to wait before executing the `onTransitionRunCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onTransitionRunCapture-debounce={500} onTransitionRunCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTransitionRunCapture-debounce"?: number | undefined;
      onTransitionRunCapture?: TransitionEventHandler<Target>;

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
      onTransitionStart?: TransitionEventHandler<Target>;

      /**
       * Milliseconds to wait before executing the `onTransitionStartCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <div onTransitionStartCapture-debounce={500} onTransitionStartCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onTransitionStartCapture-debounce"?: number | undefined;
      onTransitionStartCapture?: TransitionEventHandler<Target>;

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
      onEnterPictureInPicture?: PictureInPictureEventHandler<Target>;

      /**
       * Milliseconds to wait before executing the `onEnterPictureInPictureCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onEnterPictureInPictureCapture-debounce={500} onEnterPictureInPictureCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onEnterPictureInPictureCapture-debounce"?: number | undefined;
      onEnterPictureInPictureCapture?: PictureInPictureEventHandler<Target>;

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
      onLeavePictureInPicture?: PictureInPictureEventHandler<Target>;

      /**
       * Milliseconds to wait before executing the `onLeavePictureInPictureCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onLeavePictureInPictureCapture-debounce={500} onLeavePictureInPictureCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onLeavePictureInPictureCapture-debounce"?: number | undefined;
      onLeavePictureInPictureCapture?: PictureInPictureEventHandler<Target>;

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
      onResize?: PictureInPictureEventHandler<Target>;

      /**
       * Milliseconds to wait before executing the `onResizeCapture` server action.
       *
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       *
       * Default: 0
       *
       * Example:
       *
       * ```tsx
       * <video onResizeCapture-debounce={500} onResizeCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.dev/docs/docs/components-details/server-actions#debounce-actions)
       */
      "onResizeCapture-debounce"?: number | undefined;
      onResizeCapture?: PictureInPictureEventHandler<Target>;
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
      /** @deprecated See https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contextmenu */
      contextMenu?: string | undefined;
      /** @deprecated See https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contextmenu */
      contextmenu?: string | undefined;
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

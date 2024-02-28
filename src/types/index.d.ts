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
   * 
   * Description:
   * 
   * The `indicate` method is used to get control of the
   * "processing state" of the server action. 
   * 
   * It's necessary to link the indicator with the server action 
   * via the `indicate[Event]` attribute.
   * 
   * When the attribute "indicator"
   * is used, the "brisa-request" class is added to the element during
   * the processing state. Useful to show a spinner, disable a button, etc. All
   * via CSS.
   * 
   * Example:
   * 
   * ```tsx
   * const incInd = indicate('increment');
   * 
   * return (
   *   <button
   *    indicator={incInd}
   *    indicateClick={incInd}
   *    onClick={() => store.set('count', store.get('count') + 1)}
   *   >
   *    Increment <span indicator={incInd} class="spinner" />
   *   </button>
   * );
   * ```
   * 
   * Docs:
   * 
   * - [How to use `indicate`](https://brisa.build/docs/api-reference/request-context/indicate)
   */
  indicate: (key: string) => IndicatorSignal;

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
   * The `indicate` method is used to get control of the
   * "processing state" of the web-component action.
   * 
   * It's necessary to link the indicator with the server action 
   * via the `indicate[Event]` attribute.
   * 
   * On server component:
   * 
   * ```tsx
   * const incInd = indicate('increment');
   * // ...
   * <button indicateClick={incInd} onClick={onIncrementAction}>
   *  Increment
   * </button>
   * ```
   * 
   * When the attribute "indicator"  is used, the "brisa-request" class
   * is added to the element during the processing state. Useful to show a spinner,
   * disable a button, etc. All via CSS.
   * 
   * With action attributes:
   * 
   * ```tsx
   * const incInd = indicate('increment');
   *
   * return (
   *    <button
   *      indicator={incInd}
   *      onClick={() => store.set('count', store.get('count') + 1)}
   *    >
   *      Increment <span indicator={incInd} class="spinner" />
   *    </button>
   * );
   * ```
   * 
   * With signals (only for web components):
   * 
   * ```tsx
   * const incInd = indicate('increment');
   * 
   * return (
   *   <button
   *    disabled={incInd.value}
   *    onClick={onIncrementAction}
   *  >
   *   Increment {incInd.value && <span class="spinner" />}
   * </button>
   * );
   * ```
   *
   * Docs:
   *
   * - [How to use `indicate`](https://brisa.build/docs/api-reference/web-context/indicate)
   */
  indicate: (key: string) =>  IndicatorSignal;

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

export type IndicatorSignal = {
  id: string;
  value: boolean;
};

export type RerenderInActionProps = {
  type?: "component" | "page";
  mode?: "reactivity" | "transition";
};

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
 * - [How to use `createContext`](https://brisa.build/docs/api-reference/functions/createContext)
 */
export function createContext<T>(defaultValue?: T): BrisaContext<T>;

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
 * - [How to use `rerenderInAction`](https://brisa.build/docs/api-reference/functions/rerenderInAction)
 */
export function rerenderInAction(props: RerenderInActionProps = {}): never;

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
 * - [How to use `dangerHTML`](https://brisa.build/docs/api-reference/functions/dangerHTML)
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
 * - [How to use `notFound`](https://brisa.build/docs/api-reference/functions/notFound)
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
 * - [How to use `navigate`](https://brisa.build/docs/api-reference/functions/navigate)
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
 * - [How to use `createPortal`](https://brisa.build/Users/aralroca/docs/api-reference/functions/createPortal)
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
       * <img debounceLoad={500} onLoad={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceLoad"?: number | undefined;
      /**
       * The indicateLoad attribute is an `IndicatorSignal` to connect it to a `load` event 
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <img indicateLoad={indicator} onLoad={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateLoad?: IndicatorSignal | undefined;
      /**
       * The onLoad event is fired when an object has been loaded.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <img debounceError={500} onError={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceonError"?: number | undefined;
      /**
       * The indicateLoad attribute is an `IndicatorSignal` to connect it to a `load` event 
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <img indicateError={indicator} onError={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateError?: IndicatorSignal | undefined;
      /**
       * The onError event is fired when an object has been loaded.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <p debounceCopy={500} onCopy={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceCopy"?: number | undefined;
        /**
       * The indicateLoad attribute is an `IndicatorSignal` to connect it to a `load` event 
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <p indicateCopy={indicator} onCopy={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateCopy?: IndicatorSignal | undefined;
      /**
       * The onCopy event is fired when the user copies the content of an element.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <p debounceCut={500} onCut={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceCut"?: number | undefined;
      /**
       * The indicateLoad attribute is an `IndicatorSignal` to connect it to a `load` event 
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <p indicateCut={indicator} onCut={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateCut?: IndicatorSignal | undefined;
      /**
       * The onCut event is fired when the user cuts the content of an element.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <p debouncePaste={500} onPaste={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debouncePaste"?: number | undefined;
      /**
       * The indicateLoad attribute is an `IndicatorSignal` to connect it to a `load` event 
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <p indicatePaste={indicator} onPaste={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicatePaste?: IndicatorSignal | undefined;
      /**
       * The onPaste event is fired when the user pastes some content in an element.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <input debounceCompositionEnd{500} onCompositionEnd={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceCompositionEnd"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <input indicateCompositionEnd={indicator} onCompositionEnd={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateCompositionEnd?: IndicatorSignal | undefined;
      /**
       * The onCompositionEnd event is fired when the composition of a passage of text has been completed or canceled.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <input debounceCompositionStart={500} onCompositionStart={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceCompositionStart"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <input indicateCompositionStart={indicator} onCompositionStart={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateCompositionStart?: IndicatorSignal | undefined;
      /**
       * The onCompositionStart event is fired when the user starts to enter the composition of a passage of text.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <input debounceCompositionUpdate={500} onCompositionUpdate={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceCompositionUpdate"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <input indicateCompositionUpdate={indicator} onCompositionUpdate={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateCompositionUpdate?: IndicatorSignal | undefined;
      /**
       * The onCompositionUpdate event is fired when the user is entering text.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceToggle={500} onToggle={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceToggle"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateToggle={indicator} onToggle={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateToggle?: IndicatorSignal | undefined;
      /**
       * The onToggle event is fired when the user opens or closes the details element.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <dialog debounceClose={500} onClose={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceClose"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateClose={indicator} onClose={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateClose?: IndicatorSignal | undefined;
      /**
       * The onClose event is fired when the user closes the dialog element.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <dialog debounceCancel={500} onCancel={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceCancel"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateCancel={indicator} onCancel={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateCancel?: IndicatorSignal | undefined;
      /**
       * The onCancel event is fired when the user cancels the dialog element.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <input debounceFocus={500} onFocus={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceFocus"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <input indicateFocus={indicator} onFocus={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateFocus?: IndicatorSignal | undefined;
      /**
       * The onFocus event is fired when an element gets focus.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <input debounceFocusin={500} onfocusin={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceFocusin"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <input indicateFocusin={indicator} onFocusin={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateFocusin?: IndicatorSignal | undefined;
      /**
       * The onfocusin event is fired when an element is about to get focus.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <input debounceFocusout={500} onfocusout={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceFocusout"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <input indicateFocusout={indicator} onFocusout={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateFocusout?: IndicatorSignal | undefined;
      /**
       * The onfocusout event is fired when an element is about to lose focus.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <input debounceBlur={500} onBlur={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceBlur"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <input indicateBlur={indicator} onBlur={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateBlur?: IndicatorSignal | undefined;
      /**
       * The onBlur event is fired when an element loses focus.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <input debounceChange={500} onChange={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceChange"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <input indicateChange={indicator} onChange={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateChange?: IndicatorSignal | undefined;
      /**
       * The onChange event is fired when the value of an element has been changed.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <input debounceInput={500} onInput={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceInput"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <input indicateInput={indicator} onInput={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateInput?: IndicatorSignal | undefined;
      /**
       * The onInput event is fired when the value of an element has been changed.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <input debounceBeforeInput={500} onBeforeInput={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceBeforeInput"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <input indicateBeforeInput={indicator} onBeforeInput={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateBeforeInput?: IndicatorSignal | undefined;
      /**
       * The onBeforeInput event is fired when the value of an element has been changed.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <input debounceSearch={500} onSearch={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceSearch"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <input indicateSearch={indicator} onSearch={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateSearch?: IndicatorSignal | undefined;
      /**
       * The onSearch event is fired when the user writes something in a search input (text input with `search` type).
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <form debounceSubmit={500} onSubmit={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceSubmit"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <form indicateSubmit={indicator} onSubmit={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateSubmit?: IndicatorSignal | undefined;
      /**
       * The `onSubmit` event is fired when a form is submitted.
       * 
       * In Brisa, there is a difference between the `onSubmit` of web components and server components:
       * 
       * - Web components: it is the normal `onSubmit` of the browser.
       * - Server components: the event already contains the formData field. The event is transformed to [FormDataEvent](https://developer.mozilla.org/en-US/docs/Web/API/FormDataEvent).
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*- [Brisa docs](https://brisa.build/docs/components-details/forms)
       * 
       * **Docs**:
       * 
       * - [Brisa docs](https://brisa.build/docs/components-details/forms)
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
       * <input debounceInvalid={500} onInvalid={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceInvalid"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <input indicateInvalid={indicator} onInvalid={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateInvalid?: IndicatorSignal | undefined;
      /**
       * The onInvalid event is fired when a form is submitted and has validation errors.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <form debounceReset={500} onReset={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceReset"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <form indicateReset={indicator} onReset={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateReset?: IndicatorSignal | undefined;
      /**
       * The onReset event is fired when a form is reset.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <form debounceFormData={500} onFormData={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceFormData"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <form indicateFormData={indicator} onFormData={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateFormData?: IndicatorSignal | undefined;
      /**
       * The onFormData event is fired when a form is submitted and has validation errors.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <input debounceKeyDown={500} onKeyDown={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceKeyDown"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <input indicateKeyDown={indicator} onKeyDown={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateKeyDown?: IndicatorSignal | undefined;
      /**
       * The onKeyDown event is fired when a key is pressed down.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <input debounceKeyUp={500} onKeyUp={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceKeyUp"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <input indicateKeyUp={indicator} onKeyUp={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateKeyUp?: IndicatorSignal | undefined;
      /**
       * The onKeyUp event is fired when a key is released.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceAbort={500} onAbort={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceAbort"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateAbort={indicator} onAbort={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateAbort?: IndicatorSignal | undefined;
      /**
       * The onAbort event is fired when the loading of a media is aborted.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceCanPlay={500} onCanPlay={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceCanPlay"?: number | undefined;
        /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateCanPlay={indicator} onCanPlay={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateCanPlay?: IndicatorSignal | undefined;
      /**
       * The onCanPlay event is fired when the browser can start playing the media (when it has buffered enough to begin).
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceCanPlayThrough={500} onCanPlayThrough={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceCanPlayThrough"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateCanPlayThrough={indicator} onCanPlayThrough={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateCanPlayThrough?: IndicatorSignal | undefined;
      /**
       * The onCanPlayThrough event is fired when the browser can play through the media without stopping for buffering.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceDurationChange={500} onDurationChange={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceDurationChange"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateDurationChange={indicator} onDurationChange={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateDurationChange?: IndicatorSignal | undefined;
      /**
       * The onDurationChange event is fired when the duration of the media has changed.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceEmptied={500} onEmptied={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceEmptied"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateEmptied={indicator} onEmptied={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateEmptied?: IndicatorSignal | undefined;
      /**
       * The onEmptied event is fired when the media has become empty; for example, when the media has already been loaded (or partially loaded), and the load() method is called to reload it.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceEncrypted={500} onEncrypted={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceEncrypted"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateEncrypted={indicator} onEncrypted={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateEncrypted?: IndicatorSignal | undefined;
      /**
       * The onEncrypted event is fired when the media has become empty; for example, when the media has already been loaded (or partially loaded), and the load() method is called to reload it.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceEnded={500} onEnded={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceEnded"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateEnded={indicator} onEnded={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateEnded?: IndicatorSignal | undefined;
      /**
       * The onEnded event is fired when the media has reached the end.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceLoadedData={500} onLoadedData={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceLoadedData"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateLoadedData={indicator} onLoadedData={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateLoadedData?: IndicatorSignal | undefined;
      /**
       * The onLoadedData event is fired when the media's data is loaded.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceLoadedMetadata={500} onLoadedMetadata={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceLoadedMetadata"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateLoadedMetadata={indicator} onLoadedMetadata={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateLoadedMetadata?: IndicatorSignal | undefined;
      /**
       * The onLoadedMetadata event is fired when the metadata has been loaded.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceLoadStart={500} onLoadStart={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceLoadStart"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateLoadStart={indicator} onLoadStart={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateLoadStart?: IndicatorSignal | undefined;
      /**
       * The onLoadStart event is fired when the browser starts looking for the specified media.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debouncePause={500} onPause={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debouncePause"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicatePause={indicator} onPause={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
        indicatePause?: IndicatorSignal | undefined;
      /**
       * The onPause event is fired when the media has been paused.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debouncePlay={500} onPlay={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debouncePlay"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicatePlay={indicator} onPlay={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicatePlay?: IndicatorSignal | undefined;
      /**
       * The onPlay event is fired when the media has been started or is no longer paused.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debouncePlaying={500} onPlaying={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debouncePlaying"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicatePlaying={indicator} onPlaying={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicatePlaying?: IndicatorSignal | undefined;
      /**
       * The onPlaying event is fired when the media has started playing.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceProgress={500} onProgress={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceProgress"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateProgress={indicator} onProgress={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateProgress?: IndicatorSignal | undefined;
      /**
       * The onProgress event is fired when the browser is in the process of getting the media data (downloading the media).
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceRateChange={500} onRateChange={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceRateChange"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateRateChange={indicator} onRateChange={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateRateChange?: IndicatorSignal | undefined;
      /**
       * The onRateChange event is fired when the playback rate has changed.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceSeeked={500} onSeeked={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceSeeked"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateSeeked={indicator} onSeeked={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateSeeked?: IndicatorSignal | undefined;
      /**
       * The onSeeked event is fired when the seeking property is false, meaning that the seeking has ended.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceSeeking={500} onSeeking={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceSeeking"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateSeeking={indicator} onSeeking={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateSeeking?: IndicatorSignal | undefined;
      /**
       * The onSeeking event is fired when the seeking property is true, meaning that the media is seeking a position.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceStalled={500} onStalled={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceStalled"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateStalled={indicator} onStalled={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateStalled?: IndicatorSignal | undefined;
      /**
       * The onStalled event is fired when the browser is trying to get media data, but data is not available.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceSuspend={500} onSuspend={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceSuspend"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateSuspend={indicator} onSuspend={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateSuspend?: IndicatorSignal | undefined;
      /**
       * The onSuspend event is fired when the loading of a media is suspended.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceTimeUpdate={500} onTimeUpdate={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceTimeUpdate"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateTimeUpdate={indicator} onTimeUpdate={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateTimeUpdate?: IndicatorSignal | undefined;
      /**
       * The onTimeUpdate event is fired when the time indicated by the currentTime attribute has been updated.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceVolumeChange={500} onVolumeChange={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceVolumeChange"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateVolumeChange={indicator} onVolumeChange={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateVolumeChange?: IndicatorSignal | undefined;
      /**
       * The onVolumeChange event is fired when the volume has changed.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceWaiting={500} onWaiting={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceWaiting"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <video indicateWaiting={indicator} onWaiting={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateWaiting?: IndicatorSignal | undefined;
      /**
       * The onWaiting event is fired when the media has paused but is expected to resume (like when the media is buffering).
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceClick={500} onClick={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceClick"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateClick={indicator} onClick={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateClick?: IndicatorSignal | undefined;
      /**
       * The onClick event is fired when a pointing device button (usually a mouse) is pressed and released on a single element.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceContextMenu={500} onContextMenu={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceContextMenu"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateContextMenu={indicator} onContextMenu={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateContextMenu?: IndicatorSignal | undefined;
      /**
       * The onContextMenu event is fired when the right button of the mouse is clicked on an element.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceDblClick={500} onDblClick={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceDblClick"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateDblClick={indicator} onDblClick={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateDblClick?: IndicatorSignal | undefined;
      /**
       * The onDblClick event is fired when a pointing device button (usually a mouse) is clicked twice on a single element.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceDrag={500} onDrag={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceDrag"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateDrag={indicator} onDrag={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateDrag?: IndicatorSignal | undefined;
      /**
       * The onDrag event is fired when an element or text selection is being dragged.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceDragEnd={500} onDragEnd={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceDragEnd"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateDragEnd={indicator} onDragEnd={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateDragEnd?: IndicatorSignal | undefined;
      /**
       * The onDragEnd event is fired when a drag operation is being ended (by releasing a mouse button or hitting the escape key).
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceDragEnter={500} onDragEnter={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceDragEnter"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateDragEnter={indicator} onDragEnter={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateDragEnter?: IndicatorSignal | undefined;
      /**
       * The onDragEnter event is fired when a drag operation is being ended (by releasing a mouse button or hitting the escape key).
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceDragLeave={500} onDragLeave={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceDragLeave"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateDragLeave={indicator} onDragLeave={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateDragLeave?: IndicatorSignal | undefined;
      /**
       * The onDragLeave event is fired when a dragged element or text selection leaves a valid drop target.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceDragOver={500} onDragOver={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceDragOver"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateDragOver={indicator} onDragOver={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateDragOver?: IndicatorSignal | undefined;
      /**
       * The onDragOver event is fired when an element or text selection is being dragged over a valid drop target (every few hundred milliseconds).
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceDragStart={500} onDragStart={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceDragStart"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateDragStart={indicator} onDragStart={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateDragStart?: IndicatorSignal | undefined;
      /**
       * The onDragStart event is fired when the user starts dragging an element or text selection.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceDrop={500} onDrop={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceDrop"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateDrop={indicator} onDrop={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateDrop?: IndicatorSignal | undefined;
      /**
       * The onDrop event is fired when an element or text selection is dropped on a valid drop target.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceMouseDown={500} onMouseDown={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceMouseDown"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateMouseDown={indicator} onMouseDown={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateMouseDown?: IndicatorSignal | undefined;
      /**
       * The onMouseDown event is fired when a pointing device button is pressed on an element.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceMouseEnter={500} onMouseEnter={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceMouseEnter"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateMouseEnter={indicator} onMouseEnter={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateMouseEnter?: IndicatorSignal | undefined;
      /**
       * The onMouseEnter event is fired when a pointing device is moved onto the element that has the listener attached.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceMouseLeave={500} onMouseLeave={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceMouseLeave"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateMouseLeave={indicator} onMouseLeave={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateMouseLeave?: IndicatorSignal | undefined;
      /**
       * The onMouseLeave event is fired when a pointing device is moved off the element that has the listener attached.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceMouseMove={500} onMouseMove={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceMouseMove"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateMouseMove={indicator} onMouseMove={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateMouseMove?: IndicatorSignal | undefined;
      /**
       * The onMouseMove event is fired when a pointing device is moved over an element.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceMouseOut={500} onMouseOut={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceMouseOut"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateMouseOut={indicator} onMouseOut={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateMouseOut?: IndicatorSignal | undefined;
      /**
       * The onMouseOut event is fired when a pointing device is moved off the element that has the listener attached or off one of its children.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceMouseOver={500} onMouseOver={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceMouseOver"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateMouseOver={indicator} onMouseOver={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateMouseOver?: IndicatorSignal | undefined;
      /**
       * The onMouseOver event is fired when a pointing device is moved onto the element that has the listener attached.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceMouseUp={500} onMouseUp={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceMouseUp"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateMouseUp={indicator} onMouseUp={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateMouseUp?: IndicatorSignal | undefined;
      /**
       * The onMouseUp event is fired when a pointing device button is released over an element.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <input debounceSelect={500} onSelect={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceSelect"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateSelect={indicator} onSelect={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateSelect?: IndicatorSignal | undefined;
      /**
       * The onSelect event is fired when the user selects some text in a text field.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceTouchCancel={500} onTouchCancel={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceTouchCancel"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateTouchCancel={indicator} onTouchCancel={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateTouchCancel?: IndicatorSignal | undefined;
      /**
       * The onTouchCancel event is fired when a touch point has been disrupted in an implementation-specific manner (for example, too many touch points are created).
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceTouchEnd={500} onTouchEnd={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceTouchEnd"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateTouchEnd={indicator} onTouchEnd={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateTouchEnd?: IndicatorSignal | undefined;
      /**
       * The onTouchEnd event is fired when a touch point is removed from the touch surface.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceTouchMove={500} onTouchMove={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceTouchMove"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateTouchMove={indicator} onTouchMove={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateTouchMove?: IndicatorSignal | undefined;
      /**
       * The onTouchMove event is fired when a touch point is moved along the touch surface.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceTouchStart={500} onTouchStart={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceTouchStart"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateTouchStart={indicator} onTouchStart={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateTouchStart?: IndicatorSignal | undefined;
      /**
       * The onTouchStart event is fired when a touch point is placed on the touch surface.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debouncePointerOver={500} onPointerOver={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debouncePointerOver"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicatePointerOver={indicator} onPointerOver={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicatePointerOver?: IndicatorSignal | undefined;
      /**
       * The onPointerOver event is fired when a pointing device is moved onto the element that has the listener attached.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debouncePointerEnter={500} onPointerEnter={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debouncePointerEnter"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicatePointerEnter={indicator} onPointerEnter={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicatePointerEnter?: IndicatorSignal | undefined;
      /**
       * The onPointerEnter event is fired when a pointing device is moved onto the element that has the listener attached.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debouncePointerDown={500} onPointerDown={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debouncePointerDown"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicatePointerDown={indicator} onPointerDown={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicatePointerDown?: IndicatorSignal | undefined;
      /**
       * The onPointerDown event is fired when a pointer becomes active.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debouncePointerMove={500} onPointerMove={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debouncePointerMove"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicatePointerMove={indicator} onPointerMove={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicatePointerMove?: IndicatorSignal | undefined;
      /**
       * The onPointerMove event is fired when a pointer changes coordinates.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debouncePointerUp={500} onPointerUp={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debouncePointerUp"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicatePointerUp={indicator} onPointerUp={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicatePointerUp?: IndicatorSignal | undefined;
      /**
       * The onPointerUp event is fired when a pointer is no longer active.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debouncePointerCancel={500} onPointerCancel={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debouncePointerCancel"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicatePointerCancel={indicator} onPointerCancel={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicatePointerCancel?: IndicatorSignal | undefined;
      /**
       * The onPointerCancel event is fired when a pointer has been disrupted in an implementation-specific manner (for example, a device stops sending data).
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debouncePointerOut={500} onPointerOut={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debouncePointerOut"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicatePointerOut={indicator} onPointerOut={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicatePointerOut?: IndicatorSignal | undefined;
      /**
       * The onPointerOut event is fired when a pointing device is moved off the element that has the listener attached.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debouncePointerLeave={500} onPointerLeave={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debouncePointerLeave"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicatePointerLeave={indicator} onPointerLeave={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicatePointerLeave?: IndicatorSignal | undefined;
      /**
       * The onPointerLeave event is fired when a pointing device is moved off the element that has the listener attached.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceGotPointerCapture={500} onGotPointerCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceGotPointerCapture"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateGotPointerCapture={indicator} onGotPointerCapture={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateGotPointerCapture?: IndicatorSignal | undefined;
      /**
       * The onGotPointerCapture event is fired when an element captures a pointer.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceLostPointerCapture={500} onLostPointerCapture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceLostPointerCapture"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicatePointerCapture={indicator} onPointerCapture={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicatePointerCapture?: IndicatorSignal | undefined;
      /**
       * The onLostPointerCapture event is fired after a pointer has been captured by an element and then is released.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceScroll={500} onScroll={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceScroll"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateScroll={indicator} onScroll={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateScroll?: IndicatorSignal | undefined;
      /**
       * The onScroll event is fired when an element's scrollbar is being scrolled.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceWheel={500} onWheel={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceWheel"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateWheel={indicator} onWheel={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateWheel?: IndicatorSignal | undefined;
      /**
       * The onWheel event is fired when a wheel button of a pointing device is rotated in any direction.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceAnimationStart={500} onAnimationStart={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceAnimationStart"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateAnimationStart={indicator} onAnimationStart={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateAnimationStart?: IndicatorSignal | undefined;
      /**
       * The onAnimationStart event is fired when a CSS animation has started.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceAnimationEnd={500} onAnimationEnd={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceAnimationEnd"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateAnimationEnd={indicator} onAnimationEnd={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateAnimationEnd?: IndicatorSignal | undefined;
      /**
       * The onAnimationEnd event is fired when a CSS animation has completed.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceAnimationIteration={500} onAnimationIteration={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceAnimationIteration"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateAnimationIteration={indicator} onAnimationIteration={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateAnimationIteration?: IndicatorSignal | undefined;
      /**
       * The onAnimationIteration event is fired when a CSS animation has completed one iteration.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceTransitionCancel={500} onTransitionCancel={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceTransitionCancel"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateTransitionCancel={indicator} onTransitionCancel={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateTransitionCancel?: IndicatorSignal | undefined;
      /**
       * The onTransitionCancel event is fired when a CSS transition has been interrupted.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceTransitionEnd={500} onTransitionEnd={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceTransitionEnd"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateTransitionEnd={indicator} onTransitionEnd={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateTransitionEnd?: IndicatorSignal | undefined;
      /**
       * The onTransitionEnd event is fired when a CSS transition has completed.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceTransitionRun={500} onTransitionRun={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceTransitionRun"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateTransitionRun={indicator} onTransitionRun={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateTransitionRun?: IndicatorSignal | undefined;
      /**
       * The onTransitionRun event is fired when a CSS transition has started.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <div debounceTransitionStart={500} onTransitionStart={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceTransitionStart"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateTransitionStart={indicator} onTransitionStart={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateTransitionStart?: IndicatorSignal | undefined;
      /**
       * The onTransitionStart event is fired when a CSS transition has started.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceEnterPictureInPicture={500} onEnterPictureInPicture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceEnterPictureInPicture"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateEnterPictureInPicture={indicator} onEnterPictureInPicture={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
      indicateEnterPictureInPicture?: IndicatorSignal | undefined;
      /**
       * The onEnterPictureInPicture event is fired when a video enters picture-in-picture mode.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceLeavePictureInPicture={500} onLeavePictureInPicture={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceLeavePictureInPicture"?: number | undefined;
      /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateLeavePictureInPicture={indicator} onLeavePictureInPicture={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
        indicateLeavePictureInPicture?: IndicatorSignal | undefined;
      /**
       * The onLeavePictureInPicture event is fired when a video leaves picture-in-picture mode.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
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
       * <video debounceResize={500} onResize={() => {}} />
       * ```
       *
       * Docs:
       *
       * - [How debounce works in server actions](https://brisa.build/docs/api-reference/extended-html-attributes/debounceEvent)
       */
      "debounceResize"?: number | undefined;
        /**
       * The `indicate[Event]` attribute is an `IndicatorSignal` to connect it to an event
       * that fires a server action.
       * 
       * This is NOT a standard HTML attribute, and is not possible to use
       * in web components. It is a Brisa-specific attribute for server components.
       * 
       * Default: undefined
       * 
       * Example:
       * 
       * ```tsx
       * const indicator = indicate('some-action-id');
       * // ...
       * <div indicateResize={indicator} onResize={someAction} />
       * ```
       * 
       * Docs:
       * 
       * - [How to use `indicate`](https://brisa.build/docs/api-reference/extended-html-attributes/indicateEvent)
       */
        indicateResize?: IndicatorSignal | undefined;
      /**
       * The onResize event is fired when a picture-in-picture window is resized.
       * 
       * *🚨 In server, the `preventDefault` method is already called, so you don't need to call it.*
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Window/resize_event)
       */
      onResize?: PictureInPictureEventHandler<Target>;
    }

    export interface BrisaAttributes{
      /**
       * The `indicator` attribute is an extended HTML attribute by Brisa that is present on each element.
       *  
       * When some specified indicator is executing a server action then the `brisa-request` class is added to the element. 
       * 
       * This allows you to display a loading indicator or disable a button while the server action is executing, all without writing any JavaScript code, via the `brisa-request` class.
       * 
       * - [Brisa reference](https://brisa.build/docs/api-reference/extended-html-attributes/indicator)
       */
      indicator?: IndicatorSignal | IndicatorSignal[]
    }

    export interface HTMLAttributes<RefType extends EventTarget = EventTarget>
      extends DOMAttributes<RefType>,
        AriaAttributes, BrisaAttributes {
      // Standard HTML Attributes

      /**
       * The `accept` attribute specifies a filter for what file types the user can pick from the file input dialog box.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#accept)
       */
      accept?: string | undefined;
      /**
       * The `accept-charset` attribute specifies the character encodings that are to be used for the form submission.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#accept-charset)
       */      
      "accept-charset"?: HTMLAttributes["acceptCharset"];
      /**
       * The `accesskey` attribute specifies a shortcut key to activate/focus an element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/accesskey)
       */      
      accesskey?: HTMLAttributes["accessKey"];
      /**
       * The `action` attribute specifies where to send the form-data when a form is submitted.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#action)
       */
      action?: string | undefined;
      /**
       * The `allow` attribute is a space-separated list of the features the iframe's document is allowed to use.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#allow)
       */
      allow?: string | undefined;
      /**
       * The `allowFullScreen` attribute is a boolean attribute that is present on the `<iframe>` element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#allowfullscreen)
       */
      allowFullScreen?: boolean | undefined;
      /**
       * The `alt` attribute specifies an alternate text for an image, if the image cannot be displayed.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/alt#usage_notes)
       */
      alt?: string | undefined;
      /**
       * The `as` attribute is a hint to the browser to load the specified resource in a specific way.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#as)
       */
      as?: string | undefined;
      /**
       * The `async` attribute is a boolean attribute that is present on the `<script>` element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#async)
       */
      async?: boolean | undefined;
      /**
       * The `autoComplete` attribute is a string attribute that is present on the `<form>` and `<input>` elements.
       * 
       * - [MDN reference](hhttps://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete)
       */
      autocomplete?: string | undefined;
      /**
       * The `autoComplete` attribute is a string attribute that is present on the `<form>` and `<input>` elements.
       * 
       * - [MDN reference](hhttps://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete)
       */
      autoComplete?: string | undefined;
      /**
       * The `autocorrect` non-standard attribute is a string indicating whether autocorrect is on or off. **Safari only**.
       * 
       * - [MDN reference](hhttps://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#non-standard_attributes)
       */
      autocorrect?: string | undefined;
      /**
       * The `autoCorrect` non-standard attribute is a string indicating whether autocorrect is on or off. **Safari only**.
       * 
       * - [MDN reference](hhttps://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#non-standard_attributes)
       */
      autoCorrect?: string | undefined;
      /**
       * The `autoFocus` attribute is a boolean attribute that is present on the `<button>`, `<input>`, `<keygen>`, `<select>`, and `<textarea>` elements.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#autofocus)
       */
      autofocus?: boolean | undefined;
      /**
       * The `autoFocus` attribute is a boolean attribute that is present on the `<button>`, `<input>`, `<keygen>`, `<select>`, and `<textarea>` elements.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#autofocus)
       */
      autoFocus?: boolean | undefined;
      /**
       * The `autoPlay` attribute is a boolean attribute that is present on the `<audio>` and `<video>` elements.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#autoplay)
       */
      autoPlay?: boolean | undefined;
      /**
       * The `autoPlay` attribute is a boolean attribute that is present on the `<audio>` and `<video>` elements.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#autoplay)
       */
      autoplay?: boolean | undefined;
      /**
       * The `capture` attribute is a boolean attribute that is present on the `<input>` element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture)
       */
      capture?: boolean | string | undefined;
      /**
       * The `cellPadding` attribute is a string attribute that is present on the `<table>` element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table#cellpadding)
       */
      cellPadding?: number | string | undefined;
      /**
       * The `cellSpacing` attribute is a string attribute that is present on the `<table>` element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table#cellspacing)
       */
      cellSpacing?: number | string | undefined;
      /**
       * The `checked` attribute is used to indicate whether the element should be checked or not. 
       * 
       * Example: `<input type="checkbox" checked>`.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox#checked)
       */
      checked?: boolean | undefined;
      /**
       * The `cite` attribute is a string attribute that is present on the `<blockquote>`, `<del>`, `<ins>`, `<q>`, and `<video>` elements.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote#cite)
       */
      cite?: string | undefined;
      /**
       * The `class` attribute is a string attribute to specify one or more class names for an element. A class name is a reference to a class in a style sheet.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/class)
       */
      class?: string | undefined;
      /**
       * The `cols` attribute is a string attribute that is present on the `<textarea>` element to specify the visible width of the text area.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#cols)
       */
      cols?: number | undefined;
      /**
       * The `colSpan` attribute is a string attribute that is present on the `<td>` and `<th>` elements to specify the number of columns a cell should span.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#colspan)
       */
      colSpan?: number | undefined;
      /**
       * The `colSpan` attribute is a string attribute that is present on the `<td>` and `<th>` elements to specify the number of columns a cell should span.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#colspan)
       */
      colspan?: number | undefined;
      /**
       * The `content` attribute is a string attribute that is present on the `<meta>` element to specify the value associated with the http-equiv or name attribute.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#content)
       */
      content?: string | undefined;
      /**
       * The `contentEditable` attribute is a string attribute that is present on the `<element>` element to specify whether the content of an element is editable or not.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable)
       */
      contentEditable?: boolean | "" | "plaintext-only" | "inherit" | undefined;
      /**
       * The `contentEditable` attribute is a string attribute that is present on the `<element>` element to specify whether the content of an element is editable or not.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable)
       */
      contenteditable?: HTMLAttributes["contentEditable"];
      /**
       * The `controls` attribute is a boolean attribute that is present on the `<audio>` and `<video>` elements to show browser's default controls.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#controls)
       */
      controls?: boolean | undefined;
      /**
       * The `controlsList` attribute is a string attribute that is present on the `<audio>` and `<video>` elements to specify the controls that should be displayed.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#controlslist)
       */
      controlsList?: string | undefined;
      /**
       * The `coords` attribute is a string attribute that is present on the `<area>` element to specify the coordinates of the area.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area#coords)
       */
      coords?: string | undefined;
      /**
       * The `crossOrigin` attribute is a string attribute that is present on the `<img>`, `<link>`, and `<script>` elements to specify how the element handles cross-origin requests.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes)
       */
      crossOrigin?: string | undefined;
      /**
       * The `crossOrigin` attribute is a string attribute that is present on the `<img>`, `<link>`, and `<script>` elements to specify how the element handles cross-origin requests.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes)
       */
      crossorigin?: string | undefined;
      /**
       * The `data` attribute is a string attribute that is present on the `<object>` element to specify the URL of the resource.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object#data)
       */
      data?: string | undefined;
      /**
       * The `dateTime` attribute is a string attribute that is present on the `<del>` and `<ins>` elements to specify the date and time of the change.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time#datetime)
       */
      dateTime?: string | undefined;
      /**
       * The `dateTime` attribute is a string attribute that is present on the `<del>` and `<ins>` elements to specify the date and time of the change.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time#datetime)
       */
      datetime?: string | undefined;
      /**
       * The `default` attribute is a boolean attribute that is present on the `<track>` element to specify that the track should be enabled unless the user's preferences indicate something different.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track#default)
       */
      default?: boolean | undefined;
      /**
       * The `defer` attribute is a boolean attribute that is present on the `<script>` element to specify that the script should be executed after the page has finished parsing.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#defer)
       */
      defer?: boolean | undefined;
      /**
       * The `dir` attribute is a string attribute that is present on the `<element>` element to specify the direction of the text.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir)
       */
      dir?: "auto" | "rtl" | "ltr" | undefined;
      /**
       * The `disabled` attribute is a boolean attribute that is present on the `<button>`, `<fieldset>`, `<input>`, `<optgroup>`, `<option>`, `<select>`, and `<textarea>` elements to specify that the element should be disabled.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled)
       */
      disabled?: boolean | undefined;
      /**
       * The `disableRemorePlayback` attribute is a boolean attribute that is present on the `<video>` and `<audio>` elements to specify that the remote playback is disabled.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#disableremoteplayback)
       */
      disableRemotePlayback?: boolean | undefined;
      /**
       * The `download` attribute is a string attribute that is present on the `<a>` and `<area>` elements to specify that the target will be downloaded when a user clicks on the hyperlink.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#download)
       */
      download?: any | undefined;
      /**
       * The `decoding` attribute is a string attribute that is present on the `<img>` element to specify the decoding process to use.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#decoding)
       */
      decoding?: "sync" | "async" | "auto" | undefined;
      /**
       * The `draggable` attribute is a boolean attribute that is present on the `<element>` element to specify whether the element is draggable or not.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/draggable)
       */
      draggable?: boolean | undefined;
      /**
       * The `encType` attribute is a string attribute that is present on the `<form>` element to specify the content type of the form data when the method is POST.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#enctype)
       */
      encType?: string | undefined;
      /**
       * The `encType` attribute is a string attribute that is present on the `<form>` element to specify the content type of the form data when the method is POST.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#enctype)
       */
      enctype?: string | undefined;
      /**
       * The `enterkeyhint` attribute is a string attribute that is present on the `<input>` and `<textarea>` elements to specify the action for the enter key.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/enterkeyhint)
       */
      enterkeyhint?:
        | "enter"
        | "done"
        | "go"
        | "next"
        | "previous"
        | "search"
        | "send"
        | undefined;
      /**
       * The `elementTiming` attribute is used to indicate that an element is flagged for tracking by PerformanceObserver objects using the "element" type.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/elementtiming)
       */
      elementTiming?: string | undefined;
      /**
       * The `elementTiming` attribute is used to indicate that an element is flagged for tracking by PerformanceObserver objects using the "element" type.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/elementtiming)
       */
      elementtiming?: HTMLAttributes["elementTiming"];
      /**
       * The `exportparts` attribute allows you to select and style elements existing in nested shadow trees, by exporting their part names.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/exportparts)
       */
      exportparts?: string | undefined;
      /**
       * The `for` attribute is a string attribute that is present on the `<label>` element to specify which form element a label is bound to.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label#for)
       */
      for?: string | undefined;
      /**
       * The `form` attribute is a string attribute that is present on the `<button>`, `<fieldset>`, `<input>`, `<label>`, `<meter>`, `<object>`, `<output>`, `<select>`, and `<textarea>` elements to specify the form the element belongs to.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#form)
       */
      form?: string | undefined;
      /**
       * The `formAction` attribute is a string attribute that is present on the `<button>`, `<input>`, and `<object>` elements to specify the URL of the file that will process the input control when the form is submitted.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#formaction)
       */
      formAction?: string | undefined;
      /**
       * The `formAction` attribute is a string attribute that is present on the `<button>`, `<input>`, and `<object>` elements to specify the URL of the file that will process the input control when the form is submitted.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#formaction)
       */
      formaction?: string | undefined;
      /**
       * The `formEncType` attribute is a string attribute that is present on the `<button>`, `<input>`, and `<object>` elements to specify the content type of the form data when the method is POST.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#enctype)
       */
      formEncType?: string | undefined;
      /**
       * The `formEncType` attribute is a string attribute that is present on the `<button>`, `<input>`, and `<object>` elements to specify the content type of the form data when the method is POST.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#enctype)
       */
      formenctype?: string | undefined;
      /**
       * The `formMethod` attribute is a string attribute that is present on the `<button>`, `<input>`, and `<object>` elements to specify the HTTP method to use when the form is submitted.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#formmethod)
       */
      formMethod?: string | undefined;
      /**
       * The `formMethod` attribute is a string attribute that is present on the `<button>`, `<input>`, and `<object>` elements to specify the HTTP method to use when the form is submitted.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#formmethod)
       */
      formmethod?: string | undefined;
      /**
       * The `formNoValidate` attribute is a boolean attribute that is present on the `<button>`, `<input>`, and `<object>` elements to specify that the form should not be validated when it is submitted.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#formnovalidate)
       */
      formNoValidate?: boolean | undefined;
      /**
       * The `formNoValidate` attribute is a boolean attribute that is present on the `<button>`, `<input>`, and `<object>` elements to specify that the form should not be validated when it is submitted.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#formnovalidate)
       */
      formnovalidate?: boolean | undefined;
      /**
       * The `formTarget` attribute is a string attribute that is present on the `<button>`, `<input>`, and `<object>` elements to specify where to display the response after submitting the form.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#formtarget)
       */
      formTarget?: string | undefined;
      /**
       * The `formTarget` attribute is a string attribute that is present on the `<button>`, `<input>`, and `<object>` elements to specify where to display the response after submitting the form.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#formtarget)
       */
      formtarget?: string | undefined;
      /**
       * The `headers` attribute is a string attribute that is present on the `<td>` and `<th>` elements to specify one or more headers cells a cell is related to.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#headers)
       */
      headers?: string | undefined;
      /**
       * The `height` attribute is a string attribute that is present on the `<canvas>`, `<embed>`, `<iframe>`, `<img>`, `<input>`, `<object>`, and `<video>` elements to specify the height of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#height)
       */
      height?: number | string | undefined;
      /**
       * The `hidden` attribute is a boolean attribute that is present on the `<element>` element to specify that the element is not yet, or is no longer, relevant.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden)
       */
      hidden?: boolean | "hidden" | "until-found" | undefined;
      /**
       * The `high` attribute is a string attribute that is present on the `<meter>` element to specify the range that is considered to be a high value.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter#high)
       */
      high?: number | undefined;
      /**
       * The `href` attribute is a string attribute that is present on the `<a>`, `<area>`, and `<base>` elements to specify the URL of the page the link goes to.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#href)
       */
      href?: string | undefined;
      /**
       * The `hrefLang` attribute is a string attribute that is present on the `<a>`, `<area>`, and `<link>` elements to specify the language of the linked resource.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#hreflang)
       */
      hrefLang?: string | undefined;
      /**
       * The `hrefLang` attribute is a string attribute that is present on the `<a>`, `<area>`, and `<link>` elements to specify the language of the linked resource.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#hreflang)
       */
      hreflang?: string | undefined;
      /**
       * The `htmlFor` attribute is a string attribute that is present on the `<label>` element to specify the id of the form element the label is bound to.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLabelElement/htmlFor)
       */
      htmlFor?: string | undefined;
      /**
       * The `http-equiv` attribute is a string attribute that is present on the `<meta>` element to specify the HTTP header that will be set when the page is requested.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#http-equiv)
       */
      "http-equiv"?: string | undefined;
      /**
       * The `id` attribute is a string attribute that is present on the `<element>` element to specify a unique id for an element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id)
       */
      id?: string | undefined;
      /**
       * The `indeterminate` attribute is a boolean attribute that is present on the `<input type="checkbox">` and `<input type="radio">` elements to specify that the user has not specified a value for the input.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox#indeterminate_state_checkboxes)
       */
      indeterminate?: boolean | undefined;
      /**
       * The `inert` attribute is a boolean attribute that is present on an element to specify that the element is not interactive.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert)
       */
      inert?: boolean | undefined;
      /**
       * The `inputMode` attribute is a string attribute that is present on the `<input>` and `<textarea>` elements to specify the type of data that is expected to be entered by the user.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode)
       */
      inputMode?: string | undefined;
      /**
       * The `inputMode` attribute is a string attribute that is present on the `<input>` and `<textarea>` elements to specify the type of data that is expected to be entered by the user.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode)
       */
      inputmode?: string | undefined;
      /**
       * The `integrity` attribute is a string attribute that is present on the `<link>` and `<script>` elements to specify the cryptographic hash of the resource.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#integrity)
       */
      integrity?: string | undefined;
      /**
       * The `is` global attribute allows you to specify that a standard HTML element should behave like a defined custom built-in element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/is
       */
      is?: string | undefined;
      /**
       * The `kind` attribute is a string attribute that is present on the `<track>` element to specify the kind of text track.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track#kind)
       */
      kind?: string | undefined;
      /**
       * The `label` attribute is a string attribute that is present on the `<optgroup>`, `<option>`, and `<track>` elements to specify the label for the option group.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup#label)
       */
      label?: string | undefined;
      /**
       * The `lang` attribute is a string attribute that is present on an element to specify the language of the element's content.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang)
       */
      lang?: string | undefined;
      /**
       * The `list` attribute is a string attribute that is present on the `<input>` element to specify the id of a `<datalist>` element that contains pre-defined options for the input.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#list)
       */
      list?: string | undefined;
      /**
       * The `loading` attribute is a string attribute that is present on the `<img>` and `<iframe>` elements to specify how the element should be loaded.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#loading)
       */
      loading?: "eager" | "lazy" | undefined;
      /**
       * The `loop` attribute is a boolean attribute that is present on the `<audio>` and `<video>` elements to specify that the media should play in a loop.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#loop)
       */
      loop?: boolean | undefined;
      /**
       * The `low` attribute is a string attribute that is present on the `<meter>` element to specify the range that is considered to be a low value.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter#low)
       */
      low?: number | undefined;
      /**
       * The `manifest` attribute is a string attribute that is present on the `<html>` element to specify the URL of the document's cache manifest.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html#manifest)
       */
      manifest?: string | undefined;
      /**
       * The `marginHeight` attribute is a number attribute that is present on the `<frame>` and `<iframe>` elements to specify the top and bottom margins of the frame.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#marginheight)
       */
      marginHeight?: number | undefined;
      /**
       * The `marginWidth` attribute is a number attribute that is present on the `<frame>` and `<iframe>` elements to specify the left and right margins of the frame.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#marginwidth)
       */
      marginWidth?: number | undefined;
      /**
       * The `max` attribute is a string attribute that is present on the `<input>`, `<meter>`, and `<progress>` elements to specify the maximum value of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#max)
       */
      max?: number | string | undefined;
      /**
       * The `maxLength` attribute is a number attribute that is present on the `<input>` and `<textarea>` elements to specify the maximum number of characters allowed in the input.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/maxlength)
       */
      maxLength?: number | undefined;
      /**
       * The `maxLength` attribute is a number attribute that is present on the `<input>` and `<textarea>` elements to specify the maximum number of characters allowed in the input.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/maxlength)
       */
      maxlength?: number | undefined;
      /**
       * The `media` attribute is a string attribute that is present on the `<a>`, `<area>`, `<link>`, `<source>`, and `<style>` elements to specify the media the linked resource applies to.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#media)
       */
      media?: string | undefined;
      /**
       * The `method` attribute is a string attribute that is present on the `<form>` element to specify the HTTP method to use when the form is submitted.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#method)
       */
      method?: string | undefined;
      /**
       * The `min` attribute is a string attribute that is present on the `<input>`, `<meter>`, and `<progress>` elements to specify the minimum value of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/min)
       */
      min?: number | string | undefined;
      /**
       * The `minLength` attribute is a number attribute that is present on the `<input>` and `<textarea>` elements to specify the minimum number of characters allowed in the input.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/minlength)
       */
      minLength?: number | undefined;
      /**
       * The `minLength` attribute is a number attribute that is present on the `<input>` and `<textarea>` elements to specify the minimum number of characters allowed in the input.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/minlength)
       */
      minlength?: number | undefined;
      /**
       * The `multiple` attribute is a boolean attribute that is present on the `<input>` and `<select>` elements to specify that the user is allowed to enter more than one value.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#multiple)
       */
      multiple?: boolean | undefined;
      /**
       * The `muted` attribute is a boolean attribute that is present on the `<audio>` and `<video>` elements to specify that the media should be muted by default.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#muted)
       */
      muted?: boolean | undefined;
      /**
       * The `name` attribute is a string attribute that is present on the `<button>`, `<form>`, `<fieldset>`, `<iframe>`, `<input>`, `<map>`, `<meta>`, `<object>`, `<output>`, `<param>`, `<select>`, and `<textarea>` elements to specify the name of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#name)
       */
      name?: string | undefined;
      /**
       * The `nomodule` attribute is a boolean attribute that is present on the `<script>` element to specify that the script should not be executed in user agents that support module scripts.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#nomodule)
       */
      nomodule?: boolean | undefined;
      /**
       * The `nonce` attribute is a string attribute that is present on the `<script>` and `<style>` elements to specify a cryptographic nonce.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce)
       */
      nonce?: string | undefined;
      /**
       * The `noValidate` attribute is a boolean attribute that is present on the `<form>` element to specify that the form should not be validated when it is submitted.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#novalidate)
       */
      noValidate?: boolean | undefined;
      /**
       * The `noValidate` attribute is a boolean attribute that is present on the `<form>` element to specify that the form should not be validated when it is submitted.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#novalidate)
       */
      novalidate?: boolean | undefined;
      /**
       * The `open` attribute is a boolean attribute that is present on the `<details>` element to specify that the details should be visible by default.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details#open)
       */
      open?: boolean | undefined;
      /**
       * The `optimum` attribute is a number attribute that is present on the `<meter>` element to specify what the author thinks is the optimal value for the gauge.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter#optimum)
       */
      optimum?: number | undefined;
      /**
       * The `part` attribute is a string attribute that is present on the `<element>` element to specify the part name of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/part)
       */
      part?: string | undefined;
      /**
       * The `pattern` attribute is a string attribute that is present on the `<input>` element to specify a regular expression that the input's value is checked against.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern)
       */
      pattern?: string | undefined;
      /**
       * The `ping` attribute is a string attribute that is present on the `<a>` and `<area>` elements to specify a space-separated list of URLs to which, when the link is followed, post requests with the body PING will be sent by the browser (in the background).
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#ping)
       */
      ping?: string | undefined;
      /**
       * The `placeholder` attribute is a string attribute that is present on the `<input>`, `<textarea>`, and `<select>` elements to specify a short hint that describes the expected value of the input.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#placeholder)
       */
      placeholder?: string | undefined;
      /**
       * The `playsInline` attribute is a boolean attribute that is present on the `<video>` and `<audio>` elements to specify that the video should play inline, instead of in fullscreen mode.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#playsinline)
       */
      playsInline?: boolean | undefined;
      /**
       * The `playsInline` attribute is a boolean attribute that is present on the `<video>` and `<audio>` elements to specify that the video should play inline, instead of in fullscreen mode.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#playsinline)
       */
      playsinline?: boolean | undefined;
      /**
       * The `poster` attribute is a string attribute that is present on the `<video>` element to specify an image to be shown while the video is downloading, or until the user hits the play button.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#poster)
       */
      poster?: string | undefined;
      /**
       * The `preload` attribute is a string attribute that is present on the `<audio>` and `<video>` elements to specify how the media should be preloaded.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#preload)
       */
      preload?: string | undefined;
      /**
       * The `readOnly` attribute is a boolean attribute that is present on the `<input>` and `<textarea>` elements to specify that the element is read-only.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/readonly)
       */
      readonly?: boolean | undefined;
      /**
       * The `readOnly` attribute is a boolean attribute that is present on the `<input>` and `<textarea>` elements to specify that the element is read-only.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/readonly)
       */
      readOnly?: boolean | undefined;
      /**
       * The `referrerpolicy` attribute is a string attribute that is present on the `<a>`, `<area>`, `<iframe>`, `<img>`, `<link>`, and `<script>` elements to specify which referrer to send when fetching the resource.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#referrerpolicy)
       */
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
      /**
       * The `rel` attribute is a string attribute that is present on various elements, such as `<a>` and `<link>`, to specify the relationship between the current document and the linked resource.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel)
       */
      rel?: string | undefined;
      /**
       * The `required` attribute is a boolean attribute that is present on the `<input>`, `<select>`, and `<textarea>` elements to specify that the input must be filled out before submitting the form.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/required)
       */
      required?: boolean | undefined;
      /**
       * The `reversed` attribute is a boolean attribute that is present on the `<ol>` element to specify that the list should be displayed in reverse order.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol#reversed)
       */
      reversed?: boolean | undefined;
      /**
       * The `role` attribute is present on various elements to define the role of the element in the accessibility tree.
       * 
       * - AriaRole is a custom type representing possible values for the `role` attribute.
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)
       */
      role?: AriaRole | undefined;
      /**
       * The `rows` attribute is a number attribute that is present on the `<textarea>` element to specify the number of visible text lines for the control.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#rows)
       */
      rows?: number | undefined;
      /**
       * The `rowSpan` attribute is a number attribute that is present on the `<td>` and `<th>` elements to specify the number of rows a cell should span.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#rowspan)
       */
      rowSpan?: number | undefined;
      /**
       * The `rowSpan` attribute is a number attribute that is present on the `<td>` and `<th>` elements to specify the number of rows a cell should span.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td#rowspan)
       */
      rowspan?: number | undefined;
      /**
       * The `sandbox` attribute is a string attribute that is present on the `<iframe>` element to specify extra restrictions for the content in the iframe.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox)
       */
      sandbox?: string | undefined;
      /**
       * The `scope` attribute is a string attribute that is present on the `<th>` element to specify the cells that the header element relates to.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th#scope)
       */
      scope?: string | undefined;
      /**
       * The `scrolling` attribute is a string attribute that is present on the `<iframe>` element to specify whether or not to display scrollbars in the frame.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#scrolling)
       */
      scrolling?: string | undefined;
      /**
       * The `selected` attribute is a boolean attribute that is present on the `<option>` element to specify that the option should be pre-selected when the page loads.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option#selected)
       */
      selected?: boolean | undefined;
      /**
       * The `shape` attribute is a string attribute that is present on the `<area>` element to specify the shape of the area.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area#shape)
       */
      shape?: string | undefined;
      /**
       * The `size` attribute is a number attribute that is present on the `<input>` and `<select>` elements to specify the width of the control.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/size)
       */
      size?: number | undefined;
      /**
       * The `sizes` attribute is a string attribute that is present on the `<link>` and `<img>` elements to specify the sizes of icons for visual media.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#sizes)
       */
      sizes?: string | undefined;
      /**
       * The `slot` attribute is a string attribute that is present on the `<slot>` element to specify the name of the slot.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot#slot)
       */
      slot?: string | undefined;
      /**
       * The `span` attribute is a number attribute that is present on the `<col>` and `<colgroup>` elements to specify the number of columns that a `<colgroup>` element spans.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup#span)
       */
      span?: number | undefined;
      /**
       * The `spellCheck` attribute is a boolean attribute that is present on the `<element>` element to specify whether the element is to have its spelling and grammar checked.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/spellcheck)
       */
      spellcheck?: boolean | undefined;
      /**
       * The `spellCheck` attribute is a boolean attribute that is present on the `<element>` element to specify whether the element is to have its spelling and grammar checked.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/spellcheck)
       */
      spellCheck?: boolean | undefined;
      /**
       * The `src` attribute is a string attribute that is present on the `<audio>`, `<embed>`, `<iframe>`, `<img>`, `<input>`, `<script>`, `<source>`, and `<track>` elements to specify the URL of the media to embed.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#src)
       */
      src?: string | undefined;
      /**
       * The `srcSet` attribute is a string attribute that is present on the `<img>` and `<source>` elements to specify the URL of the image to use in different situations.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#srcset)
       */
      srcSet?: string | undefined;
      /**
       * The `srcSet` attribute is a string attribute that is present on the `<img>` and `<source>` elements to specify the URL of the image to use in different situations.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#srcset)
       */
      srcset?: string | undefined;
      /**
       * The `srcDoc` attribute is a string attribute that is present on the `<iframe>` element to specify the HTML content of the page to show in the frame.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#srcdoc)
       */
      srcDoc?: string | undefined;
      /**
       * The `srcDoc` attribute is a string attribute that is present on the `<iframe>` element to specify the HTML content of the page to show in the frame.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#srcdoc)
       */
      srcdoc?: string | undefined;
      /**
       * The `srcLang` attribute is a string attribute that is present on the `<track>` element to specify the language of the track text data.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track#srclang)
       */
      srcLang?: string | undefined;
      /**
       * The `srcLang` attribute is a string attribute that is present on the `<track>` element to specify the language of the track text data.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track#srclang)
       */
      srclang?: string | undefined;
      /**
       * The `start` attribute is a number attribute that is present on the `<ol>` element to specify the starting number of the list.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol#start)
       */
      start?: number | undefined;
      /**
       * The `step` attribute is a number attribute that is present on the `<input>` element to specify the legal number intervals for an input field.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#step)
       */
      step?: number | string | undefined;
      /**
       * The `style` attribute is a string attribute that is present on the `<element>` element to specify the inline style for the element.
       * 
       * In Brisa you can also use an object with the CSSProperties.
       * 
       * Example:
       * 
       * ```tsx
       * <div style={{ color: 'red' }} />
       * ```
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/style)
       */
      style?: string | CSSProperties | undefined;
      /**
       * The `summary` attribute is a string attribute that is present on the `<table>` element to specify a summary of the content of the table.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table#summary)
       */
      summary?: string | undefined;
      /**
       * The `tabIndex` attribute is a number attribute that is present on the `<element>` element to specify the position of the element in the tab order.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex)
       */
      tabIndex?: number | undefined;
      /**
       * The `tabIndex` attribute is a number attribute that is present on the `<element>` element to specify the position of the element in the tab order.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex)
       */
      tabindex?: number | undefined;
      /**
       * The `target` attribute is a string attribute that is present on the `<a>`, `<area>`, and `<form>` elements to specify where to display the linked resource.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#target)
       */
      target?: string | undefined;
      /**
       * The `title` attribute is a string attribute that is present on the `<element>` element to specify advisory information for the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/title)
       */
      title?: string | undefined;
      /**
       * The `type` attribute is a string attribute that is present on the `<button>`, `<input>`, `<command>`, `<embed>`, `<object>`, `<script>`, and `<source>` elements to specify the type of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#type)
       */
      type?: string | undefined;
      /**
       * The `useMap` attribute is a string attribute that is present on the `<img>` and `<object>` elements to specify the URL of the image map to use.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#usemap)
       */
      useMap?: string | undefined;
      /**
       * The `useMap` attribute is a string attribute that is present on the `<img>` and `<object>` elements to specify the URL of the image map to use.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#usemap)
       */
      usemap?: string | undefined;
      /**
       * The `value` attribute is a string attribute that is present on the `<button>`, `<input>`, `<li>`, `<option>`, and `<progress>` elements to specify the value of the element.
       * 
       * In Brisa the `value` attribute is also used to define the context content inside `<context-provider>`.
       * 
       * - [Brisa docs](https://brisa.build/docs/components-details/context#provider)
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#value)
       */
      value?: string | string[] | number | undefined;
      /**
       * The `volume` attribute sets the volume at which the media will be played.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volume)
       */
      volume?: string | number | undefined;
      /**
       * The `width` attribute is a number attribute that is present on the `<canvas>`, `<embed>`, `<iframe>`, `<img>`, `<input>`, `<object>`, and `<video>` elements to specify the width of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#width)
       */
      width?: number | string | undefined;
      /**
       * The `wrap` attribute is a string attribute that is present on the `<textarea>` element to specify whether or not the text should be wrapped.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#wrap)
       */
      wrap?: string | undefined;

      // template attributes

      /**
       * The `shadowrootmode` attribute is a string attribute that is present on the `<template>` element to specify the mode of the shadow root.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template#shadowrootmode)
       */
      shadowrootmode?: ShadowRootMode | undefined;

      // Non-standard attributes

      /**
       * The `allowCapitalize` attribute is a string attribute that is present on the `<input>` and `<textarea>` elements to specify the capitalization behavior of the input.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autocapitalize)
       */
      autocapitalize?:
        | "off"
        | "none"
        | "on"
        | "sentences"
        | "words"
        | "characters"
        | undefined;
      /**
       * The `allowCapitalize` attribute is a string attribute that is present on the `<input>` and `<textarea>` elements to specify the capitalization behavior of the input.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autocapitalize)
       */
      autoCapitalize?:
        | "off"
        | "none"
        | "on"
        | "sentences"
        | "words"
        | "characters"
        | undefined;
      /**
       * The `disablePictureInPicture` attribute is a boolean attribute that is present on the `<video>` and `<iframe>` elements to specify that the user should not be able to enter picture-in-picture mode.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#disablepictureinpicture)
       */
      disablePictureInPicture?: boolean | undefined;
      /**
       * The `results` attribute is a number attribute that is present on the `<input>` element to specify the number of items that should be displayed in the drop-down list.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#results)
       */
      results?: number | undefined;

      /**
       * The `translate` attribute is a string attribute that is present on the `<element>` element to specify whether the content of the element should be translated or not.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/translate)
       */
      translate?: "yes" | "no" | undefined;

      // RDFa Attributes

      /**
       * The `prefix` attribute is a string attribute that is present on the `<element>` element to specify the prefix of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/Attr/prefix)
       */
      prefix?: string | undefined;

      // Microdata Attributes

      /**
       * The `itemProp` attribute is a string attribute that is present on the `<element>` element to specify the item property of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemprop)
       */
      itemProp?: string | undefined;
      /**
       * The `itemProp` attribute is a string attribute that is present on the `<element>` element to specify the item property of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemprop)
       */
      itemprop?: string | undefined;
      /**
       * The `itemScope` attribute is a boolean attribute that is present on the `<element>` element to specify the item scope of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemscope)
       */
      itemScope?: boolean | undefined;
      /**
       * The `itemScope` attribute is a boolean attribute that is present on the `<element>` element to specify the item scope of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemscope)
       */
      itemscope?: boolean | undefined;
      /**
       * The `itemType` attribute is a string attribute that is present on the `<element>` element to specify the item type of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemtype)
       */
      itemType?: string | undefined;
      /**
       * The `itemType` attribute is a string attribute that is present on the `<element>` element to specify the item type of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemtype)
       */
      itemtype?: string | undefined;
      /**
       * The `itemID` attribute is a string attribute that is present on the `<element>` element to specify the item ID of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemid)
       */
      itemID?: string | undefined;
      /**
       * The `itemID` attribute is a string attribute that is present on the `<element>` element to specify the item ID of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemid)
       */
      itemid?: string | undefined;
      /**
       * The `itemRef` attribute is a string attribute that is present on the `<element>` element to specify the item reference of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemref)
       */
      itemRef?: string | undefined;
      /**
       * The `itemRef` attribute is a string attribute that is present on the `<element>` element to specify the item reference of the element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemref)
       */
      itemref?: string | undefined;
    }

    interface IntrinsicElements extends IntrinsicCustomElements {
      // HTML

      /**
       * The `a` element is used to create hyperlinks to other web pages, files, locations within the same page, email addresses, or any other URL.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a)
       */
      a: HTMLAttributes<HTMLAnchorElement>;
      /**
       * The `abbr` element is used to mark up the name of an abbreviation or acronym, like "M.D." or "NATO".
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/abbr)
       */
      abbr: HTMLAttributes<HTMLElement>;
      /**
       * The `address` element is used to provide contact information for a document or a section of a document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/address)
       */
      address: HTMLAttributes<HTMLElement>;
      /**
       * The `area` element is used to define a hot-spot region on an image map.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/area)
       */
      area: HTMLAttributes<HTMLAreaElement>;
      /**
       * The `article` element is used to represent a self-contained composition in a document, page, application, or site, which is intended to be independently distributable or reusable.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article)
       */
      article: HTMLAttributes<HTMLElement>;
      /**
       * The `aside` element is used to mark additional content that is related to the primary content of the document, but does not constitute the main content of the document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/aside)
       */
      aside: HTMLAttributes<HTMLElement>;
      /**
       * The `audio` element is used to embed sound content in documents.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio)
       */
      audio: HTMLAttributes<HTMLAudioElement>;
      /**
       * The `b` element is used to draw the reader's attention to the element's contents, which are not otherwise granted special importance.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/b)
       */
      b: HTMLAttributes<HTMLElement>;
      /**
       * The `base` element is used to specify the base URL to use for all relative URLs in a document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base)
       */
      base: HTMLAttributes<HTMLBaseElement>;
      /**
       * The `bdi` element is used to indicate text that is isolated from its surrounding for the purposes of bidirectional text formatting.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdi)
       */
      bdi: HTMLAttributes<HTMLElement>;
      /**
       * The `bdo` element is used to override the current text direction.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bdo)
       */
      bdo: HTMLAttributes<HTMLElement>;
      /**
       * The `blockquote` element is used to indicate that the enclosed text is an extended quotation.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blockquote)
       */
      blockquote: HTMLAttributes<HTMLQuoteElement>;
      /**
       * The `body` element represents the content of an HTML document. There can be only one `<body>` element in a document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body)
       */
      body: HTMLAttributes<HTMLBodyElement>;
      /**
       * The `br` element is used to create a line break in a document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br)
       */
      br: HTMLAttributes<HTMLBRElement>;
      /**
       * The `button` element is used to create a clickable button.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button)
       */
      button: HTMLAttributes<HTMLButtonElement>;
      /**
       * The `canvas` element is used to draw graphics, on the fly, via scripting (usually JavaScript).
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas)
       */
      canvas: HTMLAttributes<HTMLCanvasElement>;
      /**
       * The `caption` element is used to define a table caption.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption)
       */
      caption: HTMLAttributes<HTMLTableCaptionElement>;
      /**
       * The `cite` element is used to describe a reference to a cited creative work, and must include the title of that work.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/cite)
       */
      cite: HTMLAttributes<HTMLElement>;
      /**
       * The `code` element is used to define a piece of computer code.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/code)
       */
      code: HTMLAttributes<HTMLElement>;
      /**
       * The `col` element is used to define a column within a table.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col)
       */
      col: HTMLAttributes<HTMLTableColElement>;
      /**
       * The `colgroup` element is used to define a group of columns within a table.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup)
       */
      colgroup: HTMLAttributes<HTMLTableColElement>;
      /**
       * The `data` element is used to represent the result of a calculation (like one performed by a script).
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/data)
       */
      data: HTMLAttributes<HTMLDataElement>;
      /**
       * The `datalist` element is used to provide a list of pre-defined options for an `<input>` element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/datalist)
       */
      datalist: HTMLAttributes<HTMLDataListElement>;
      /**
       * The `dd` element is used to define a description of a term in a description list.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dd)
       */
      dd: HTMLAttributes<HTMLElement>;
      /**
       * The `del` element is used to represent a range of text that has been deleted from a document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/del)
       */
      del: HTMLAttributes<HTMLModElement>;
      /**
       * The `details` element is used to create a disclosure widget in which information is visible only when the widget is toggled into an "open" state.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details)
       */
      details: HTMLAttributes<HTMLDetailsElement>;
      /**
       * The `dfn` element is used to indicate the term being defined within the context of a definition phrase or sentence.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dfn)
       */
      dfn: HTMLAttributes<HTMLElement>;
      /**
       * The `dialog` element is used to define a dialog box or subwindow.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)
       */
      dialog: HTMLAttributes<HTMLDialogElement>;
      /**
       * The `div` element is used as a container for other HTML elements.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div)
       */
      div: HTMLAttributes<HTMLDivElement>;
      /**
       * The `dl` element is used to define a description list.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl)
       */
      dl: HTMLAttributes<HTMLDListElement>;
      /**
       * The `dt` element is used to define a term in a description list.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dt)
       */
      dt: HTMLAttributes<HTMLElement>;
      /**
       * The `em` element is used to indicate emphasis on the enclosed text.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/em)
       */
      em: HTMLAttributes<HTMLElement>;
      /**
       * The `embed` element is used to embed multimedia content, such as a plugin or an applet.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed)
       */
      embed: HTMLAttributes<HTMLEmbedElement>;
      /**
       * The `fieldset` element is used to group several controls as well as labels (`<label>`) within a web form.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset)
       */
      fieldset: HTMLAttributes<HTMLFieldSetElement>;
      /**
       * The `figcaption` element is used to add a caption to an `<figure>` element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figcaption)
       */
      figcaption: HTMLAttributes<HTMLElement>;
      /**
       * The `figure` element is used to mark up a photo, diagram, code listing, or other figure, and may contain a `<figcaption>` element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/figure)
       */
      figure: HTMLAttributes<HTMLElement>;
      /**
       * The `footer` element is used to define a footer for a document or section.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/footer)
       */
      footer: HTMLAttributes<HTMLElement>;
      /**
       * The `form` element is used to create an HTML form for user input.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form)
       */
      form: HTMLAttributes<HTMLFormElement>;
      /**
       * The `h1` element is used to define the most important heading.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h1)
       */
      h1: HTMLAttributes<HTMLHeadingElement>;
      /**
       * The `h2` element is used to define the second most important heading.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h2)
       */
      h2: HTMLAttributes<HTMLHeadingElement>;
      /**
       * The `h3` element is used to define the third most important heading.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h3)
       */
      h3: HTMLAttributes<HTMLHeadingElement>;
      /**
       * The `h4` element is used to define the fourth most important heading.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h4)
       */
      h4: HTMLAttributes<HTMLHeadingElement>;
      /**
       * The `h5` element is used to define the fifth most important heading.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h5)
       */
      h5: HTMLAttributes<HTMLHeadingElement>;
      /**
       * The `h6` element is used to define the least important heading.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/h6)
       */
      h6: HTMLAttributes<HTMLHeadingElement>;
      /**
       * The `head` element is used to contain metadata for the HTML document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head)
       */
      head: HTMLAttributes<HTMLHeadElement>;
      /**
       * The `header` element is used to define a header for a document or section.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/header)
       */
      header: HTMLAttributes<HTMLElement>;
      /**
       * The `hgroup` element is used to group a set of `<h1>` to `<h6>` elements when a heading has multiple levels.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hgroup)
       */
      hgroup: HTMLAttributes<HTMLElement>;
      /**
       * The `hr` element is used to create a thematic break in an HTML page.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr)
       */
      hr: HTMLAttributes<HTMLHRElement>;
      /**
       * The `html` element is the root element of an HTML document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html)
       */
      html: HTMLAttributes<HTMLHtmlElement>;
      /**
       * The `i` element is used to represent a span of text in an alternate voice or mood, or otherwise offset from the normal prose in a manner indicating a different quality of text.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/i)
       */
      i: HTMLAttributes<HTMLElement>;
      /**
       * The `iframe` element is used to embed another document within the current HTML document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe)
       */
      iframe: HTMLAttributes<HTMLIFrameElement>;
      /**
       * The `img` element is used to embed an image in an HTML page.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img)
       */
      img: HTMLAttributes<HTMLImageElement>;
      /**
       * The `input` element is used to create interactive controls for web-based forms in order to accept data from the user.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input)
       */
      input: HTMLAttributes<HTMLInputElement>;
      /**
       * The `ins` element is used to represent a range of text that has been added to a document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ins)
       */
      ins: HTMLAttributes<HTMLModElement>;
      /**
       * The `kbd` element is used to define keyboard input.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd)
       */
      kbd: HTMLAttributes<HTMLElement>;
      /**
       * The `label` element is used to define a label for several elements.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label)
       */
      label: HTMLAttributes<HTMLLabelElement>;
      /**
       * The `legend` element is used to define a caption for the `<fieldset>` element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/legend)
       */
      legend: HTMLAttributes<HTMLLegendElement>;
      /**
       * The `li` element is used to define a list item.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li)
       */
      li: HTMLAttributes<HTMLLIElement>;
      /**
       * The `link` element is used to link to external style sheets.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link)
       */
      link: HTMLAttributes<HTMLLinkElement>;
      /**
       * The `main` element is used to mark the main content of a document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main)
       */
      main: HTMLAttributes<HTMLElement>;
      /**
       * The `map` element is used to define a client-side image map.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map)
       */
      map: HTMLAttributes<HTMLMapElement>;
      /**
       * The `mark` element is used to represent a run of text in one document marked or highlighted for reference purposes, due to its relevance in another context.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark)
       */
      mark: HTMLAttributes<HTMLElement>;
      /**
       * The `template` element is used to declare fragments of HTML that can be cloned and inserted in the document by script.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template)
       */
      template: HTMLAttributes<HTMLTemplateElement>;
      /**
       * The `marquee` element is used to create a scrolling area of text.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/marquee)
       */
      marquee: HTMLAttributes<HTMLMarqueeElement>;
      /**
       * The `menu` element is used to define a list of commands that a user can perform or activate.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menu)
       */
      menu: HTMLAttributes<HTMLMenuElement>;
      /**
       * The `menuitem` element is used to define a command that a user can invoke from a popup menu.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menuitem)
       */
      menuitem: HTMLAttributes<HTMLUnknownElement>;
      /**
       * The `meta` element is used to specify metadata that can't be represented by other HTML meta-related elements.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta)
       */
      meta: HTMLAttributes<HTMLMetaElement>;
      /**
       * The `meter` element is used to represent a scalar measurement within a known range or a fractional value.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter)
       */
      meter: HTMLAttributes<HTMLMeterElement>;
      /**
       * The `nav` element is used to define a section of navigation links.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav)
       */
      nav: HTMLAttributes<HTMLElement>;
      /**
       * The `noscript` element is used to provide a script that displays only if scripting is not supported.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noscript)
       */
      noscript: HTMLAttributes<HTMLElement>;
      /**
       * The `object` element is used to embed an object in an HTML document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object)
       */
      object: HTMLAttributes<HTMLObjectElement>;
      /**
       * The `ol` element is used to define an ordered list of items.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol)
       */
      ol: HTMLAttributes<HTMLOListElement>;
      /**
       * The `optgroup` element is used to group several options within a `<select>` element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/optgroup)
       */
      optgroup: HTMLAttributes<HTMLOptGroupElement>;
      /**
       * The `option` element is used to define an item contained in a `<select>`, an `<optgroup>`, or a `<datalist>` element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option)
       */
      option: HTMLAttributes<HTMLOptionElement>;
      /**
       * The `output` element is used to represent the result of a calculation or user action.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output)
       */
      output: HTMLAttributes<HTMLOutputElement>;
      /**
       * The `p` element represents a paragraph.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p)
       */
      p: HTMLAttributes<HTMLParagraphElement>;
      /**
       * The `param` element is used to define parameters for plugins invoked by object elements.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/param)
       */
      param: HTMLAttributes<HTMLParamElement>;
      /**
       * The `picture` element is used to define a container for multiple image sources.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture)
       */
      picture: HTMLAttributes<HTMLPictureElement>;
      /**
       * The `pre` element is used to define preformatted text.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre)
       */
      pre: HTMLAttributes<HTMLPreElement>;
      /**
       * The `progress` element is used to represent the completion progress of a task.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/progress)
       */
      progress: HTMLAttributes<HTMLProgressElement>;
      /**
       * The `q` element is used to define a short inline quotation.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/q)
       */
      q: HTMLAttributes<HTMLQuoteElement>;
      /**
       * The `rp` element is used to provide fallback text to be displayed by user agents that don't support ruby annotations.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rp)
       */
      rp: HTMLAttributes<HTMLElement>;
      /**
       * The `rt` element is used to provide the pronunciation of the characters, characters, or words in a ruby annotation.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rt)
       */
      rt: HTMLAttributes<HTMLElement>;
      /**
       * The `ruby` element is used to provide ruby annotations for East Asian typography.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ruby)
       */
      ruby: HTMLAttributes<HTMLElement>;
      /**
       * The `s` element is used to represent contents that are no longer accurate or no longer relevant.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/s)
       */
      s: HTMLAttributes<HTMLElement>;
      /**
       * The `samp` element is used to enclose inline text which represents sample (or quoted) output from a computer program.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/samp)
       */
      samp: HTMLAttributes<HTMLElement>;
      /**
       * The `script` element is used to embed or reference an executable script within an HTML or XHTML document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script)
       */
      script: HTMLAttributes<HTMLScriptElement>;
      /**
       * The `search` element is used to create a search field.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search)
       */
      search: HTMLAttributes<HTMLElement>;
      /**
       * The `section` element is used to define sections in a document, such as chapters, headers, footers, or any other sections of the document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section)
       */
      section: HTMLAttributes<HTMLElement>;
      /**
       * The `select` element is used to create a drop-down list.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select)
       */
      select: HTMLAttributes<HTMLSelectElement>;
      /**
       * The `slot` element is used to define a slot for the insertion of content from a parent component.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot)
       */
      slot: HTMLAttributes<HTMLSlotElement>;
      /**
       * The `small` element is used to represent side comments such as small print.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/small)
       */
      small: HTMLAttributes<HTMLElement>;
      /**
       * The `source` element is used to specify multiple media resources for media elements, such as `<video>` and `<audio>`.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source)
       */
      source: HTMLAttributes<HTMLSourceElement>;
      /**
       * The `span` element is used to group inline-elements in a document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/span)
       */
      span: HTMLAttributes<HTMLSpanElement>;
      /**
       * The `strong` element is used to indicate strong importance for its contents.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong)
       */
      strong: HTMLAttributes<HTMLElement>;
      /**
       * The `style` element is used to define style information for a document, or part of a document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/style)
       */
      style: HTMLAttributes<HTMLStyleElement>;
      /**
       * The `sub` element is used to specify the subscript text.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sub)
       */
      sub: HTMLAttributes<HTMLElement>;
      /**
       * The `summary` element is used to define a visible heading for the `<details>` element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/summary)
       */
      summary: HTMLAttributes<HTMLElement>;
      /**
       * The `sup` element is used to specify the superscript text.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/sup)
       */
      sup: HTMLAttributes<HTMLElement>;
      /**
       * The `table` element is used to create a table.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table)
       */
      table: HTMLAttributes<HTMLTableElement>;
      /**
       * The `tbody` element is used to group the body content in a table.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tbody)
       */
      tbody: HTMLAttributes<HTMLTableSectionElement>;
      /**
       * The `td` element is used to define a cell in a table.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td)
       */
      td: HTMLAttributes<HTMLTableCellElement>;
      /**
       * The `textarea` element is used to create a multiline text input.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea)
       */
      textarea: HTMLAttributes<HTMLTextAreaElement>;
      /**
       * The `tfoot` element is used to group the footer content in a table.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tfoot)
       */
      tfoot: HTMLAttributes<HTMLTableSectionElement>;
      /**
       * The `th` element is used to define a header cell in a table.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th)
       */
      th: HTMLAttributes<HTMLTableCellElement>;
      /**
       * The `thead` element is used to group the header content in a table.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/thead)
       */
      thead: HTMLAttributes<HTMLTableSectionElement>;
      /**
       * The `time` element is used to represent a specific period in time.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/time)
       */
      time: HTMLAttributes<HTMLTimeElement>;
      /**
       * The `title` element is used to define a title for the document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title)
       */
      title: HTMLAttributes<HTMLTitleElement>;
      /**
       * The `tr` element is used to define a row in a table.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tr)
       */
      tr: HTMLAttributes<HTMLTableRowElement>;
      /**
       * The `track` element is used to specify text tracks for video elements.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track)
       */
      track: HTMLAttributes<HTMLTrackElement>;
      /**
       * The `u` element is used to represent text with an unarticulated, though explicitly rendered, non-textual annotation.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/u)
       */
      u: HTMLAttributes<HTMLElement>;
      /**
       * The `ul` element is used to define an unordered list of items.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul)
       */
      ul: HTMLAttributes<HTMLUListElement>;
      /**
       * The `var` element is used to define a variable in programming or in a mathematical expression.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/var)
       */
      var: HTMLAttributes<HTMLElement>;
      /**
       * The `video` element is used to embed video content in a document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)
       */
      video: HTMLAttributes<HTMLVideoElement>;
      /**
       * The `wbr` element is used to define a word break opportunity within text content.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/wbr)
       */
      wbr: HTMLAttributes<HTMLElement>;

      //SVG

      /**
       * The `svg` element is used to define a container for SVG graphics.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg)
       */
      svg: SVGAttributes<SVGSVGElement>;
      /**
       * The `animate` element is used to animate an attribute of an element over time.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animate)
       */
      animate: SVGAttributes<SVGAnimateElement>;
      /**
       * The `circle` element is used to create a circle.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/circle)
       */
      circle: SVGAttributes<SVGCircleElement>;
      /**
       * The `animateMotion` element is used to animate an element along a motion path.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animateMotion)
       */
      animateMotion: SVGAttributes<SVGAnimateMotionElement>;
      /**
       * The `animateTransform` element is used to animate a transformation on an element, such as a translate, scale, rotate, or skew.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/animateTransform)
       */
      animateTransform: SVGAttributes<SVGAnimateTransformElement>;
      /**
       * The `clipPath` element is used to define a clipping path.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/clipPath)
       */
      clipPath: SVGAttributes<SVGClipPathElement>;
      /**
       * The `defs` element is used to define a set of reusable elements.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/defs)
       */
      defs: SVGAttributes<SVGDefsElement>;
      /**
       * The `desc` element is used to provide a description for an SVG document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/desc)
       */
      desc: SVGAttributes<SVGDescElement>;
      /**
       * The `ellipse` element is used to create an ellipse.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/ellipse)
       */
      ellipse: SVGAttributes<SVGEllipseElement>;
      /**
       * The `feBlend` element is used to blend two objects together.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feBlend)
       */
      feBlend: SVGAttributes<SVGFEBlendElement>;
      /**
       * The `feColorMatrix` element is used to apply a matrix transformation on the RGBA color and alpha values of each pixel.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feColorMatrix)
       */
      feColorMatrix: SVGAttributes<SVGFEColorMatrixElement>;
      /**
       * The `feComponentTransfer` element is used to apply a linear transformation on the input color values.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feComponentTransfer)
       */
      feComponentTransfer: SVGAttributes<SVGFEComponentTransferElement>;
      /**
       * The `feComposite` element is used to combine two objects together.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feComposite)
       */
      feComposite: SVGAttributes<SVGFECompositeElement>;
      /**
       * The `feConvolveMatrix` element is used to apply a matrix convolution filter effect.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feConvolveMatrix)
       */
      feConvolveMatrix: SVGAttributes<SVGFEConvolveMatrixElement>;
      /**
       * The `feDiffuseLighting` element is used to create a lighting effect using the alpha channel as a bump map.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDiffuseLighting)
       */
      feDiffuseLighting: SVGAttributes<SVGFEDiffuseLightingElement>;
      /**
       * The `feDisplacementMap` element is used to create a displacement effect.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDisplacementMap)
       */
      feDisplacementMap: SVGAttributes<SVGFEDisplacementMapElement>;
      /**
       * The `feDistantLight` element is used to create a distant light source.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDistantLight)
       */
      feDistantLight: SVGAttributes<SVGFEDistantLightElement>;
      /**
       * The `feDropShadow` element is used to create a drop shadow effect.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDropShadow)
       */
      feDropShadow: SVGAttributes<SVGFEDropShadowElement>;
      /**
       * The `feFlood` element is used to create a solid color fill.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFlood)
       */
      feFlood: SVGAttributes<SVGFEFloodElement>;
      /**
       * The `feFuncA` element is used to define the alpha component of the color.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncA)
       */
      feFuncA: SVGAttributes<SVGFEFuncAElement>;
      /**
       * The `feFuncB` element is used to define the blue component of the color.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncB)
       */
      feFuncB: SVGAttributes<SVGFEFuncBElement>;
      /**
       * The `feFuncG` element is used to define the green component of the color.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncG)
       */
      feFuncG: SVGAttributes<SVGFEFuncGElement>;
      /**
       * The `feFuncR` element is used to define the red component of the color.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feFuncR)
       */
      feFuncR: SVGAttributes<SVGFEFuncRElement>;
      /**
       * The `feGaussianBlur` element is used to create a Gaussian blur effect.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feGaussianBlur)
       */
      feGaussianBlur: SVGAttributes<SVGFEGaussianBlurElement>;
      /**
       * The `feImage` element is used to include an externally defined graphics file.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feImage)
       */
      feImage: SVGAttributes<SVGFEImageElement>;
      /**
       * The `feMerge` element is used to combine two objects together.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMerge)
       */
      feMerge: SVGAttributes<SVGFEMergeElement>;
      /**
       * The `feMergeNode` element is used to specify the input for the feMerge filter primitive.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMergeNode)
       */
      feMergeNode: SVGAttributes<SVGFEMergeNodeElement>;
      /**
       * The `feMorphology` element is used to create a morphology effect.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feMorphology)
       */
      feMorphology: SVGAttributes<SVGFEMorphologyElement>;
      /**
       * The `feOffset` element is used to create a drop shadow effect.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feOffset)
       */
      feOffset: SVGAttributes<SVGFEOffsetElement>;
      /**
       * The `fePointLight` element is used to create a point light effect.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/fePointLight)
       */
      fePointLight: SVGAttributes<SVGFEPointLightElement>;
      /**
       * The `feSpecularLighting` element is used to create a specular lighting effect.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feSpecularLighting)
       */
      feSpecularLighting: SVGAttributes<SVGFESpecularLightingElement>;
      /**
       * The `feSpotLight` element is used to create a spotlight effect.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feSpotLight)
       */
      feSpotLight: SVGAttributes<SVGFESpotLightElement>;
      /**
       * The `feTile` element is used to create a tile effect.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTile)
       */
      feTile: SVGAttributes<SVGFETileElement>;
      /**
       * The `feTurbulence` element is used to create a turbulence effect.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTurbulence)
       */
      feTurbulence: SVGAttributes<SVGFETurbulenceElement>;
      /**
       * The `filter` element is used to define a filter effect.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/filter)
       */
      filter: SVGAttributes<SVGFilterElement>;
      /**
       * The `foreignObject` element is used to include a DOM subtree within an SVG.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject)
       */
      foreignObject: SVGAttributes<SVGForeignObjectElement>;
      /**
       * The `g` element is used to group SVG shapes together.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g)
       */
      g: SVGAttributes<SVGGElement>;
      /**
       * The `image` element is used to embed images into an SVG.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/image)
       */
      image: SVGAttributes<SVGImageElement>;
      /**
       * The `line` element is used to create a line.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/line)
       */
      line: SVGAttributes<SVGLineElement>;
      /**
       * The `linearGradient` element is used to define a linear gradient.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/linearGradient)
       */
      linearGradient: SVGAttributes<SVGLinearGradientElement>;
      /**
       * The `marker` element is used to define a marker.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/marker)
       */
      marker: SVGAttributes<SVGMarkerElement>;
      /**
       * The `mask` element is used to define a mask.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/mask)
       */
      mask: SVGAttributes<SVGMaskElement>;
      /**
       * The `metadata` element is used to provide metadata for the SVG document.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/metadata)
       */
      metadata: SVGAttributes<SVGMetadataElement>;
      /**
       * The `mpath` element is used to animate an object along a motion path.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/mpath)
       */
      mpath: SVGAttributes<SVGMPathElement>;
      /**
       * The `path` element is used to define a path.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/path)
       */
      path: SVGAttributes<SVGPathElement>;
      /**
       * The `pattern` element is used to define a pattern.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/pattern)
       */
      pattern: SVGAttributes<SVGPatternElement>;
      /**
       * The `polygon` element is used to create a polygon.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/polygon)
       */
      polygon: SVGAttributes<SVGPolygonElement>;
      /**
       * The `polyline` element is used to create a polyline.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/polyline)
       */
      polyline: SVGAttributes<SVGPolylineElement>;
      /**
       * The `radialGradient` element is used to define a radial gradient.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/radialGradient)
       */
      radialGradient: SVGAttributes<SVGRadialGradientElement>;
      /**
       * The `rect` element is used to create a rectangle.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/rect)
       */
      rect: SVGAttributes<SVGRectElement>;
      /**
       * The `set` element is used to define the value of an attribute for a specified duration.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/set)
       */
      set: SVGAttributes<SVGSetElement>;
      /**
       * The `stop` element is used to define the color and opacity of a gradient stop.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/stop)
       */
      stop: SVGAttributes<SVGStopElement>;
      /**
       * The `switch` element is used to group a set of alternatives.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/switch)
       */
      switch: SVGAttributes<SVGSwitchElement>;
      /**
       * The `symbol` element is used to define a symbol.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/symbol)
       */
      symbol: SVGAttributes<SVGSymbolElement>;
      /**
       * The `text` element is used to define text.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/text)
       */
      text: SVGAttributes<SVGTextElement>;
      /**
       * The `textPath` element is used to define a path along which text is to be rendered.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/textPath)
       */
      textPath: SVGAttributes<SVGTextPathElement>;
      /**
       * The `tspan` element is used to define a sub-text within a text element.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/tspan)
       */
      tspan: SVGAttributes<SVGTSpanElement>;
      /**
       * The `use` element is used to reference a symbol defined elsewhere.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use)
       */
      use: SVGAttributes<SVGUseElement>;
      /**
       * The `view` element is used to define a view.
       * 
       * - [MDN reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/view)
       */
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

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

/**
 * Description:
 *
 *  Web Context is a set of utilities to use within your web components without losing the context where you are.
 *  The state, cleanups, effects, and so on, will be applied without conflicting with other components.
 */
export interface WebContext {
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
   * The `self` attribute is the reference to the web-component itself.
   */
  self: HTMLElement;
}

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
  trailingSlash?: boolean;
  assetPrefix?: string;
  plugins?: BunPlugin[];
  basePath?: string;
  tls?: TLSOptions;
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
  [key: string]: string | I18nDictionary;
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
) => T | JSX.Element[] | string;

export type I18n = {
  locale: string;
  defaultLocale: string;
  locales: string[];
  pages: i18nPages;
  t: Translate;
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
      onLoad?: GenericEventHandler<Target> | undefined;
      onLoadCapture?: GenericEventHandler<Target> | undefined;
      onError?: GenericEventHandler<Target> | undefined;
      onErrorCapture?: GenericEventHandler<Target> | undefined;

      // Clipboard Events
      onCopy?: ClipboardEventHandler<Target> | undefined;
      onCopyCapture?: ClipboardEventHandler<Target> | undefined;
      onCut?: ClipboardEventHandler<Target> | undefined;
      onCutCapture?: ClipboardEventHandler<Target> | undefined;
      onPaste?: ClipboardEventHandler<Target> | undefined;
      onPasteCapture?: ClipboardEventHandler<Target> | undefined;

      // Composition Events
      onCompositionEnd?: CompositionEventHandler<Target> | undefined;
      onCompositionEndCapture?: CompositionEventHandler<Target> | undefined;
      onCompositionStart?: CompositionEventHandler<Target> | undefined;
      onCompositionStartCapture?: CompositionEventHandler<Target> | undefined;
      onCompositionUpdate?: CompositionEventHandler<Target> | undefined;
      onCompositionUpdateCapture?: CompositionEventHandler<Target> | undefined;

      // Details Events
      onToggle?: GenericEventHandler<Target> | undefined;

      // Dialog Events
      onClose?: GenericEventHandler<Target> | undefined;
      onCancel?: GenericEventHandler<Target> | undefined;

      // Focus Events
      onFocus?: FocusEventHandler<Target> | undefined;
      onFocusCapture?: FocusEventHandler<Target> | undefined;
      onfocusin?: FocusEventHandler<Target> | undefined;
      onfocusinCapture?: FocusEventHandler<Target> | undefined;
      onfocusout?: FocusEventHandler<Target> | undefined;
      onfocusoutCapture?: FocusEventHandler<Target> | undefined;
      onBlur?: FocusEventHandler<Target> | undefined;
      onBlurCapture?: FocusEventHandler<Target> | undefined;

      // Form Events
      onChange?: GenericEventHandler<Target> | undefined;
      onChangeCapture?: GenericEventHandler<Target> | undefined;
      onInput?: InputEventHandler<Target> | undefined;
      onInputCapture?: InputEventHandler<Target> | undefined;
      onBeforeInput?: InputEventHandler<Target> | undefined;
      onBeforeInputCapture?: InputEventHandler<Target> | undefined;
      onSearch?: GenericEventHandler<Target> | undefined;
      onSearchCapture?: GenericEventHandler<Target> | undefined;
      onSubmit?: SubmitEventHandler<Target> | undefined;
      onSubmitCapture?: SubmitEventHandler<Target> | undefined;
      onInvalid?: GenericEventHandler<Target> | undefined;
      onInvalidCapture?: GenericEventHandler<Target> | undefined;
      onReset?: GenericEventHandler<Target> | undefined;
      onResetCapture?: GenericEventHandler<Target> | undefined;
      onFormData?: GenericEventHandler<Target> | undefined;
      onFormDataCapture?: GenericEventHandler<Target> | undefined;

      // Keyboard Events
      onKeyDown?: KeyboardEventHandler<Target> | undefined;
      onKeyDownCapture?: KeyboardEventHandler<Target> | undefined;
      onKeyPress?: KeyboardEventHandler<Target> | undefined;
      onKeyPressCapture?: KeyboardEventHandler<Target> | undefined;
      onKeyUp?: KeyboardEventHandler<Target> | undefined;
      onKeyUpCapture?: KeyboardEventHandler<Target> | undefined;

      // Media Events
      onAbort?: GenericEventHandler<Target> | undefined;
      onAbortCapture?: GenericEventHandler<Target> | undefined;
      onCanPlay?: GenericEventHandler<Target> | undefined;
      onCanPlayCapture?: GenericEventHandler<Target> | undefined;
      onCanPlayThrough?: GenericEventHandler<Target> | undefined;
      onCanPlayThroughCapture?: GenericEventHandler<Target> | undefined;
      onDurationChange?: GenericEventHandler<Target> | undefined;
      onDurationChangeCapture?: GenericEventHandler<Target> | undefined;
      onEmptied?: GenericEventHandler<Target> | undefined;
      onEmptiedCapture?: GenericEventHandler<Target> | undefined;
      onEncrypted?: GenericEventHandler<Target> | undefined;
      onEncryptedCapture?: GenericEventHandler<Target> | undefined;
      onEnded?: GenericEventHandler<Target> | undefined;
      onEndedCapture?: GenericEventHandler<Target> | undefined;
      onLoadedData?: GenericEventHandler<Target> | undefined;
      onLoadedDataCapture?: GenericEventHandler<Target> | undefined;
      onLoadedMetadata?: GenericEventHandler<Target> | undefined;
      onLoadedMetadataCapture?: GenericEventHandler<Target> | undefined;
      onLoadStart?: GenericEventHandler<Target> | undefined;
      onLoadStartCapture?: GenericEventHandler<Target> | undefined;
      onPause?: GenericEventHandler<Target> | undefined;
      onPauseCapture?: GenericEventHandler<Target> | undefined;
      onPlay?: GenericEventHandler<Target> | undefined;
      onPlayCapture?: GenericEventHandler<Target> | undefined;
      onPlaying?: GenericEventHandler<Target> | undefined;
      onPlayingCapture?: GenericEventHandler<Target> | undefined;
      onProgress?: GenericEventHandler<Target> | undefined;
      onProgressCapture?: GenericEventHandler<Target> | undefined;
      onRateChange?: GenericEventHandler<Target> | undefined;
      onRateChangeCapture?: GenericEventHandler<Target> | undefined;
      onSeeked?: GenericEventHandler<Target> | undefined;
      onSeekedCapture?: GenericEventHandler<Target> | undefined;
      onSeeking?: GenericEventHandler<Target> | undefined;
      onSeekingCapture?: GenericEventHandler<Target> | undefined;
      onStalled?: GenericEventHandler<Target> | undefined;
      onStalledCapture?: GenericEventHandler<Target> | undefined;
      onSuspend?: GenericEventHandler<Target> | undefined;
      onSuspendCapture?: GenericEventHandler<Target> | undefined;
      onTimeUpdate?: GenericEventHandler<Target> | undefined;
      onTimeUpdateCapture?: GenericEventHandler<Target> | undefined;
      onVolumeChange?: GenericEventHandler<Target> | undefined;
      onVolumeChangeCapture?: GenericEventHandler<Target> | undefined;
      onWaiting?: GenericEventHandler<Target> | undefined;
      onWaitingCapture?: GenericEventHandler<Target> | undefined;

      // MouseEvents
      onClick?: MouseEventHandler<Target> | undefined;
      onClickCapture?: MouseEventHandler<Target> | undefined;
      onContextMenu?: MouseEventHandler<Target> | undefined;
      onContextMenuCapture?: MouseEventHandler<Target> | undefined;
      onDblClick?: MouseEventHandler<Target> | undefined;
      onDblClickCapture?: MouseEventHandler<Target> | undefined;
      onDrag?: DragEventHandler<Target> | undefined;
      onDragCapture?: DragEventHandler<Target> | undefined;
      onDragEnd?: DragEventHandler<Target> | undefined;
      onDragEndCapture?: DragEventHandler<Target> | undefined;
      onDragEnter?: DragEventHandler<Target> | undefined;
      onDragEnterCapture?: DragEventHandler<Target> | undefined;
      onDragExit?: DragEventHandler<Target> | undefined;
      onDragExitCapture?: DragEventHandler<Target> | undefined;
      onDragLeave?: DragEventHandler<Target> | undefined;
      onDragLeaveCapture?: DragEventHandler<Target> | undefined;
      onDragOver?: DragEventHandler<Target> | undefined;
      onDragOverCapture?: DragEventHandler<Target> | undefined;
      onDragStart?: DragEventHandler<Target> | undefined;
      onDragStartCapture?: DragEventHandler<Target> | undefined;
      onDrop?: DragEventHandler<Target> | undefined;
      onDropCapture?: DragEventHandler<Target> | undefined;
      onMouseDown?: MouseEventHandler<Target> | undefined;
      onMouseDownCapture?: MouseEventHandler<Target> | undefined;
      onMouseEnter?: MouseEventHandler<Target> | undefined;
      onMouseEnterCapture?: MouseEventHandler<Target> | undefined;
      onMouseLeave?: MouseEventHandler<Target> | undefined;
      onMouseLeaveCapture?: MouseEventHandler<Target> | undefined;
      onMouseMove?: MouseEventHandler<Target> | undefined;
      onMouseMoveCapture?: MouseEventHandler<Target> | undefined;
      onMouseOut?: MouseEventHandler<Target> | undefined;
      onMouseOutCapture?: MouseEventHandler<Target> | undefined;
      onMouseOver?: MouseEventHandler<Target> | undefined;
      onMouseOverCapture?: MouseEventHandler<Target> | undefined;
      onMouseUp?: MouseEventHandler<Target> | undefined;
      onMouseUpCapture?: MouseEventHandler<Target> | undefined;

      // Selection Events
      onSelect?: GenericEventHandler<Target> | undefined;
      onSelectCapture?: GenericEventHandler<Target> | undefined;

      // Touch Events
      onTouchCancel?: TouchEventHandler<Target> | undefined;
      onTouchCancelCapture?: TouchEventHandler<Target> | undefined;
      onTouchEnd?: TouchEventHandler<Target> | undefined;
      onTouchEndCapture?: TouchEventHandler<Target> | undefined;
      onTouchMove?: TouchEventHandler<Target> | undefined;
      onTouchMoveCapture?: TouchEventHandler<Target> | undefined;
      onTouchStart?: TouchEventHandler<Target> | undefined;
      onTouchStartCapture?: TouchEventHandler<Target> | undefined;

      // Pointer Events
      onPointerOver?: PointerEventHandler<Target> | undefined;
      onPointerOverCapture?: PointerEventHandler<Target> | undefined;
      onPointerEnter?: PointerEventHandler<Target> | undefined;
      onPointerEnterCapture?: PointerEventHandler<Target> | undefined;
      onPointerDown?: PointerEventHandler<Target> | undefined;
      onPointerDownCapture?: PointerEventHandler<Target> | undefined;
      onPointerMove?: PointerEventHandler<Target> | undefined;
      onPointerMoveCapture?: PointerEventHandler<Target> | undefined;
      onPointerUp?: PointerEventHandler<Target> | undefined;
      onPointerUpCapture?: PointerEventHandler<Target> | undefined;
      onPointerCancel?: PointerEventHandler<Target> | undefined;
      onPointerCancelCapture?: PointerEventHandler<Target> | undefined;
      onPointerOut?: PointerEventHandler<Target> | undefined;
      onPointerOutCapture?: PointerEventHandler<Target> | undefined;
      onPointerLeave?: PointerEventHandler<Target> | undefined;
      onPointerLeaveCapture?: PointerEventHandler<Target> | undefined;
      onGotPointerCapture?: PointerEventHandler<Target> | undefined;
      onGotPointerCaptureCapture?: PointerEventHandler<Target> | undefined;
      onLostPointerCapture?: PointerEventHandler<Target> | undefined;
      onLostPointerCaptureCapture?: PointerEventHandler<Target> | undefined;

      // UI Events
      onScroll?: UIEventHandler<Target> | undefined;
      onScrollCapture?: UIEventHandler<Target> | undefined;

      // Wheel Events
      onWheel?: WheelEventHandler<Target> | undefined;
      onWheelCapture?: WheelEventHandler<Target> | undefined;

      // Animation Events
      onAnimationStart?: AnimationEventHandler<Target> | undefined;
      onAnimationStartCapture?: AnimationEventHandler<Target> | undefined;
      onAnimationEnd?: AnimationEventHandler<Target> | undefined;
      onAnimationEndCapture?: AnimationEventHandler<Target> | undefined;
      onAnimationIteration?: AnimationEventHandler<Target> | undefined;
      onAnimationIterationCapture?: AnimationEventHandler<Target> | undefined;

      // Transition Events
      onTransitionCancel?: TransitionEventHandler<Target>;
      onTransitionCancelCapture?: TransitionEventHandler<Target>;
      onTransitionEnd?: TransitionEventHandler<Target>;
      onTransitionEndCapture?: TransitionEventHandler<Target>;
      onTransitionRun?: TransitionEventHandler<Target>;
      onTransitionRunCapture?: TransitionEventHandler<Target>;
      onTransitionStart?: TransitionEventHandler<Target>;
      onTransitionStartCapture?: TransitionEventHandler<Target>;

      // PictureInPicture Events
      onEnterPictureInPicture?: PictureInPictureEventHandler<Target>;
      onEnterPictureInPictureCapture?: PictureInPictureEventHandler<Target>;
      onLeavePictureInPicture?: PictureInPictureEventHandler<Target>;
      onLeavePictureInPictureCapture?: PictureInPictureEventHandler<Target>;
      onResize?: PictureInPictureEventHandler<Target>;
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

/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { IntrinsicCustomElements } from "@/../build/_brisa/types";
import { BunPlugin, MatchedRoute, TLSOptions } from "bun";

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
   * - [How to use `store`](https://brisa.dev/docs/components-details/server-components#store-store-method)
   */
  store: Map<string | symbol, any>;

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
   * - [How to use `useContext`](https://brisa.dev/docs/components-details/context)
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
   * The `i18n` object is a set of utilities to use within your server components
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
   * - [How to use `i18n`](https://brisa.dev/docs/building-your-application/routing/internationalization)
   */
  i18n: I18nFromRequest;

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
   * - [How to use `ws`](https://brisa.dev/docs/building-your-application/routing/websockets)
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
   * - [How to use `finalURL`](https://brisa.dev/docs/building-your-application/routing/internationalization#final-url)
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
   * - [How to use `id`](https://brisa.dev/docs/building-your-application/data-fetching/request-context)
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
   * - [How to use `store`](https://brisa.dev/docs/components-details/web-components#store-store-method)
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
   * - [How to use `useContext`](https://brisa.dev/docs/components-details/context)
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
   *  - [How to use `state`](https://brisa.dev/docs/components-details/web-components#state-state-method)
   */
  state<T>(initialValue?: T): { value: T };

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
   * - [How to use `effect`](https://brisa.dev/docs/components-details/web-components#effect-effect-method)
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
   * - [How to use `cleanup`](https://brisa.dev/docs/components-details/web-components#clean-effects-cleanup-method)
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
   * - [How to use `derived`](https://brisa.dev/docs/components-details/web-components#derived-state-and-props-derived-method)
   */
  derived<T>(fn: () => T): { value: T };

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
   * - [How to use `onMount`](https://brisa.dev/docs/components-details/web-components#effect-on-mount-onmount-method)
   */
  onMount(fn: Effect): void;

  /**
   * Description:
   *
   * The `css` method is used to inject CSS into the DOM.
   *
   * Example:
   *
   * ```ts
   * css`body { background-color: red; }`
   * ```
   *
   */
  css(strings: TemplateStringsArray, ...values: string[]): void;

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
  children?: Child;
};

export type ResponseHeaders = (
  req: RequestContext,
  status: number,
) => HeadersInit;

export type JSXNode = string | number | JSXElement | JSXNode[];

type Child = JSXNode | Child[];

export type Type = string | number | ComponentType | Promise<ComponentType>;

export type Configuration = {
  trailingSlash?: boolean;
  assetPrefix?: string;
  plugins?: BunPlugin[];
  basePath?: string;
  tls?: TLSOptions;
};

export type JSXElement = {
  type: Type;
  props: Props;
} & (number | string);

export type JSXComponent = (
  props: Props,
  request: RequestContext,
) => JSXNode | Promise<JSXNode>;

export interface ParsedFilePkg {
  program: ts.Program;
  checker: ts.TypeChecker;
  sourceFile: ts.SourceFile;
  fileSymbol?: ts.Symbol;
  transform: (transformer: Transformer) => void;
  getCode: () => string;
}

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
    prefix: string;
    suffix: string;
    format: (value: unknown, format: string, locale: string) => string;
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

export type Translate = <T extends unknown = string>(
  i18nKey: I18nKey | TemplateStringsArray,
  query?: TranslationQuery | null,
  options?: {
    returnObjects?: boolean;
    fallback?: string | string[];
    default?: T | string;
    elements?: JSX.Element[] | Record<string, JSX.Element>;
  },
) => T | JSX.Element[] | string;

export type I18nFromRequest = {
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
};

export type BrisaContext<T> = {
  defaultValue: T;
  id: string;
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
 * - [How to use `createContext`](https://brisa.dev/docs/components-details/server-components#create-context-createcontext)
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
 * - [How to use `dangerHTML`](https://brisa.dev/docs/components-details/web-components#inject-html-dangerhtml)
 */
export function dangerHTML(html: string): DangerHTMLOutput;

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
 * - [How to use `createPortal`](https://brisa.dev/docs/components-details/web-components#portals-createportal)
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

interface ContextProviderAttributes {
  context: BrisaContext<unknown>;
  value: unknown;
  children: unknown;
  serverOnly?: boolean;
}

declare global {
  export namespace JSX {
    type Element = JSXElement | Promise<JSXElement>;

    interface ElementChildrenAttribute {
      children: Child;
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

      // Custom Elements
      "context-provider": ContextProviderAttributes;
    }
  }
}

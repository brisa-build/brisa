import { BunPlugin } from "bun";
import { IntrinsicCustomElements } from "@/../build/_brisa/types";

export interface RequestContext extends Request {
  context: Map<string, any>;
  route?: MatchedRoute;
  i18n: I18nFromRequest;
  ws?: ServerWebSocket<unknown>;
  getIP: () => SocketAddress | null;
  finalURL: string;
}

type Props = Record<string, unknown> & {
  children?: Child;
};

export type ResponseHeaders = (
  req: RequestContext,
  status: number,
) => HeadersInit;

export type JSXNode = string | number | JSXElement;

type Child = JSXNode | Child[];

export type Type = string | number | ComponentType | Promise<ComponentType>;

export type Configuration = {
  trailingSlash?: boolean;
  assetPrefix?: string;
  plugins?: BunPlugin[];
  basePath?: string;
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

interface ComponentType extends JSXComponent {
  error: (
    props: Props & {
      error?: Error;
    },
    request: RequestContext,
  ) => JSXNode | Promise<JSXNode>;
}

export function dangerHTML(html: string): {
  type: "danger-html";
  props: {
    html: string;
  };
};

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
    }
  }
}

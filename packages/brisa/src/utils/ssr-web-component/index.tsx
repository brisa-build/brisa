import { toInline } from '@/helpers';
import { Fragment as BrisaFragment } from '@/jsx-runtime';
import type { RequestContext } from '@/types';
import { getConstants } from '@/constants';
import dangerHTML from '../danger-html';

export const AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL = Symbol.for(
  'AVOID_DECLARATIVE_SHADOW_DOM',
);

type Props = {
  'ssr-Component': any;
  'ssr-selector': string;
  [key: string]: any;
};

const voidFn = () => {};

export default async function SSRWebComponent(
  {
    'ssr-Component': Component,
    'ssr-selector': selector,
    __key,
    ...props
  }: Props,
  { store, useContext, i18n, indicate, route }: RequestContext,
) {
  // Note: only can happen with libraries in old versions of Brisa
  // TODO: Remove in the future
  if (!Component) {
    Component = props.Component;
    selector = props.selector;
  }

  const { WEB_CONTEXT_PLUGINS, CSS_FILES } = getConstants();
  const showContent = !store.has(AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL);
  const self = { shadowRoot: {}, attachInternals: voidFn } as any;
  let style = '';
  const Selector = selector;

  // Note: For renderOn="build" we need to import the component inside
  // to execute the SSRWebComponent in a macro with serialized props.
  // Note: Should be an absolute path.
  if (typeof Component === 'string') {
    Component = await import(Component).then((m) => m.default);
  }

  // @ts-ignore
  store.setOptimistic = voidFn;

  const webContext = {
    store,
    self,
    state: (value: unknown) => ({ value }),
    effect: voidFn,
    onMount: voidFn,
    reset: voidFn,
    derived: (fn: () => unknown) => ({ value: fn() }),
    cleanup: voidFn,
    indicate,
    useContext,
    i18n,
    css: (template: TemplateStringsArray, ...values: string[]) => {
      style += String.raw(
        template,
        ...values.map((v: unknown) => (typeof v === 'function' ? v() : v)),
      );
    },
    route: {
      name: route?.name,
      pathname: route?.pathname,
      params: route?.params,
      query: route?.query,
    },
  } as unknown as RequestContext;

  for (const plugin of WEB_CONTEXT_PLUGINS) {
    // @ts-ignore
    Object.assign(webContext, plugin(webContext));
  }

  const componentProps = { ...props, children: <slot /> };
  let content: any;

  if (showContent) {
    try {
      content = await (typeof Component?.suspense === 'function'
        ? Component.suspense(componentProps, webContext)
        : Component(componentProps, webContext));
    } catch (error) {
      if (Component?.error) {
        content = await Component.error(
          { ...componentProps, error },
          webContext,
        );
      } else {
        throw error;
      }
    }
  }

  // This should be calculated after the Component execution because the devs can
  // skip global CSS setting adoptedStyleSheets to an empty array
  // (this approach works in both worlds: SSR + client-side)
  const skipGlobalCSS = self.shadowRoot.adoptedStyleSheets?.length === 0;
  const useCSSImports = !skipGlobalCSS && CSS_FILES.length > 0;

  return (
    // @ts-ignore
    <Selector key={__key} {...props} __isWebComponent>
      {showContent && (
        <template
          shadowrootmode="open"
          // @ts-ignore
          __skipGlobalCSS={skipGlobalCSS}
        >
          {content}
          {style.length > 0 && <style>{toInline(style)}</style>}
          {useCSSImports &&
            dangerHTML(`<style>${getCSSImports(CSS_FILES)}</style>`)}
        </template>
      )}
      {/* @ts-ignore */}
      <BrisaFragment slot="">{props.children}</BrisaFragment>
    </Selector>
  );
}

function getCSSImports(CSS_FILES: string[]) {
  return CSS_FILES.map((file) => `@import '/${file}'`).join(';');
}

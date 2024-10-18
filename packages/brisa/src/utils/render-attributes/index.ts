import { getConstants } from '@/constants';
import type {
  I18nConfig,
  IndicatorSignal,
  Props,
  RequestContext,
} from '@/types';
import routeMatchPathname from '@/utils/route-match-pathname';
import { serializeServer } from '@/utils/serialization/server';
import stylePropsToString from '@/utils/style-props-to-string';
import substituteI18nRouteValues from '@/utils/substitute-i18n-route-values';
import isAnAction from '@/utils/is-an-action';
import { addBasePathToStringURL } from '@/utils/base-path';
import { logWarning } from '@/utils/log/log-build';
import { boldLog } from '@/utils/log/log-color';
import { BOOLEANS_IN_HTML } from '@/public-constants';

const PROPS_TO_IGNORE = new Set([
  'children',
  '__isWebComponent',
  '__skipGlobalCSS',
]);
const VALUES_TYPE_TO_IGNORE = new Set(['function', 'undefined']);
const fakeOrigin = 'http://localhost';

export default function renderAttributes({
  elementProps,
  request,
  type,
  componentProps,
  componentID,
}: {
  elementProps: Props;
  request: RequestContext & { _actionIndex?: number };
  type: string;
  componentProps?: Props;
  componentID?: string;
}): string {
  const { IS_PRODUCTION, CONFIG } = getConstants();
  const locale = request.i18n?.locale;
  const { basePath, assetPrefix } = CONFIG;
  const keys = new Set<string>();
  let attributes = '';
  let submitAction = elementProps['data-action-onsubmit'];

  for (const prop in elementProps) {
    const key = prop.toLowerCase();
    let value = elementProps[prop];

    if (keys.has(key)) continue;

    // Add the key to the set to avoid duplicates
    if (value !== undefined) keys.add(key);

    if (
      PROPS_TO_IGNORE.has(prop) ||
      (locale && type === 'html' && prop === 'lang')
    )
      continue;

    // Add the basePath or assetPrefix to internal assets (img, picture, video, audio, script)
    if (
      prop === 'src' &&
      (assetPrefix || basePath) &&
      !URL.canParse(value as string)
    ) {
      value = `${assetPrefix ? assetPrefix : basePath}${value}`;
    }

    const isFn = typeof value === 'function';

    // Warn about functions that are not event handlers
    if (!IS_PRODUCTION && isFn && !key.startsWith('on')) {
      logWarning(
        [
          `The prop "${prop}" is a function and it's not an event handler.`,
          `It should start with "on" to be considered an event handler`,
          `Example: ${boldLog('on' + prop[0].toUpperCase() + prop.slice(1))}`,
        ],
        `Event handlers docs: https://brisa.build/building-your-application/components-details/web-components#events`,
      );
    }

    // Manage unregistered actions (useful to use it outside of Brisa to recover the actions)
    // In Brisa, currently it's only useful for the testing API (render method), to recover
    // the actions to test them.
    if (isFn && globalThis.REGISTERED_ACTIONS && !isAnAction(value)) {
      (value as any).actionId =
        globalThis.REGISTERED_ACTIONS.push(value as Function) - 1;
    }

    // Nested actions (coming from props)
    if (isAnAction(value)) {
      const actionKey = `data-action`;
      const actionToEventKey = `${actionKey}-${key}`;
      const modifiedAttributes = attributes.replace(
        new RegExp(`${actionToEventKey}=".*?"`),
        `${actionToEventKey}="${value.actionId}"`,
      );

      if (key === 'onsubmit') {
        submitAction = value.actionId;
      }

      if (keys.has(actionToEventKey)) {
        attributes = modifiedAttributes;
      } else {
        keys.add(actionToEventKey);
        attributes += ` ${actionToEventKey}="${value.actionId}"`;
      }

      if (!keys.has(actionKey)) {
        keys.add(actionKey);
        attributes += ` ${actionKey}`;
      }

      continue;
    }

    // Simplify indicator signals
    if (key === 'indicator') {
      const arr = Array.isArray(value) ? value : [value];
      attributes += ` ${key}='${serializeServer(arr.map((a) => a.id))}'`;
      continue;
    }
    // `indicate` attribute
    if (
      key.startsWith('indicate') &&
      (value as IndicatorSignal)?.id?.startsWith('__ind:')
    ) {
      value = (value as IndicatorSignal).id;
    }

    // Skip types that are not supported in HTML
    if (VALUES_TYPE_TO_IGNORE.has(typeof value)) {
      continue;
    }

    // Example <dialog open> => <dialog>
    if (typeof value === 'boolean' && BOOLEANS_IN_HTML.has(key)) {
      if (value) attributes += ` ${key}`;
      continue;
    }

    // Example data-test={ bar: "foo" } => <div data-test="{'bar':'foo'}">
    if (typeof value === 'object') {
      attributes += ` ${key}='${
        value && key === 'style'
          ? stylePropsToString(value as JSX.CSSProperties)
          : serializeServer(value)
      }'`;
      continue;
    }

    // Improve navigation: i18n, trailing slash, basepath etc.
    if (
      prop === 'href' &&
      typeof value === 'string' &&
      (type === 'a' || (type === 'link' && elementProps.rel === 'prefetch'))
    ) {
      attributes += ` ${key}="${renderHrefAttribute(value, request)}"`;
      continue;
    }

    attributes += ` ${key}="${value}"`;
  }

  const hasActionRegistered = keys.has('data-action');

  // Add component ID (cid) and "key" to the element if it has an action
  if (hasActionRegistered && componentID) {
    if (!request._actionIndex) request._actionIndex = 0;
    attributes += ` data-cid="${componentID}"`;

    // This is necessary to unregister actions + register new ones
    // after navigation diffing (the componentID change in every render)
    // https://github.com/brisa-build/brisa/issues/558
    if (!keys.has('key')) {
      attributes += ` key="${componentID}:${++request._actionIndex}"`;
    }
  }

  // Add external action ids into data-actions attribute.
  //
  // This allows an action to call other actions without having to transfer
  // anything. It is exposed in the client (HTML) the id of the actions that
  // could call the current action, this way when the action is loaded the
  // props are passed with the other actions.
  //
  // For security, we prefer not to expose other props or server variables
  // in the HTML. To support this it is necessary for developers to have
  // control over which variables they want to transfer, and to encrypt/decrypt
  // the most sensitive ones or find an alternative such as asking for the
  // values back in the database. Unlike current frameworks that use Server
  // Actions we don't want to do this kind of magic out of the developer's
  // control, because encrypting/decrypting props slows down requests and
  // exposes code without the developer's will.
  if (hasActionRegistered && componentProps) {
    const entries = [];
    let dependencies = [];

    for (const [key, value] of Object.entries(componentProps)) {
      if (!isAnAction(value)) continue;

      // Note: value.cid does not come from a rerender of a component inside
      // a server action, however all the dependencies are the same rendered
      // dependencies (already including these entries)
      if (value.cid) {
        entries.push([key, value.actionId, value.cid]);
      }

      if (dependencies.length === 0 && value.actions?.length) {
        dependencies = value.actions.slice() as any[];
      }
    }

    const hasEntries = entries.length > 0;
    const hasDeps = hasEntries || dependencies.length > 0;

    if (hasEntries) dependencies.unshift(entries);
    if (hasDeps)
      attributes += ` data-actions='${serializeServer(dependencies)}'`;
  }

  // Form action - Add "action" and "method" if not present
  if (submitAction && type === 'form') {
    if (!keys.has('action')) {
      const url = new URL(request.url);

      url.searchParams.set('_aid', submitAction as string);
      keys.add('action');
      attributes += ` action="${url.pathname}${url.search}"`;
    }

    if (!keys.has('enctype')) {
      keys.add('enctype');
      attributes += ` enctype="multipart/form-data"`;
    }

    if (!keys.has('method')) {
      keys.add('method');
      attributes += ` method="POST"`;
    }
  }

  if (locale && type === 'html') {
    const localeInfo = new Intl.Locale(locale) as any;
    // Note: In some versions of some js-runtimes, "getTextInfo" method
    // was implemented as an accessor property called textInfo
    const { direction } = localeInfo.textInfo ?? localeInfo.getTextInfo();

    attributes += ` lang="${locale}" dir="${direction}"`;
  }

  if (type === 'head' && basePath) {
    attributes += ` basepath="${basePath}"`;
  }

  return attributes;
}

export function renderHrefAttribute(
  hrefValue: string,
  request: RequestContext,
) {
  const { I18N_CONFIG } = getConstants();
  const { pages } = I18N_CONFIG ?? {};
  const { locale, locales } = request.i18n ?? {};
  const isExternalUrl = URL.canParse(hrefValue);
  let formattedHref = hrefValue.replace(/\/$/, '');

  for (const [key, value] of Object.entries(request.route?.params ?? {})) {
    formattedHref = formattedHref.replace(`[${key}]`, value as string);
  }

  if (isExternalUrl) {
    return hrefValue;
  }

  if (!locale) {
    return manageTrailingSlash(addBasePathToStringURL(hrefValue));
  }

  const page = findTranslatedPage(pages, formattedHref);

  if (page) {
    const [pageName, translations] = page;
    const translatedPage = (translations as any)?.[locale] ?? pageName;
    formattedHref = substituteI18nRouteValues(translatedPage, formattedHref);
  }

  if (formattedHref && formattedHref[0] !== '/') {
    formattedHref = '/' + formattedHref;
  }

  const useI18n = !locales?.some(
    (locale) => formattedHref?.split('/')?.[1] === locale,
  );
  const fixedUrl = manageTrailingSlash(
    useI18n ? `/${locale}${formattedHref}` : formattedHref,
  );

  return addBasePathToStringURL(fixedUrl);
}

function findTranslatedPage(pages: I18nConfig['pages'], href: string) {
  const url = new URL(href, fakeOrigin);
  const pathnameWithoutTrailingSlash = url.pathname.replace(/\/$/, '');

  for (const page of Object.entries(pages ?? {})) {
    if (routeMatchPathname(page[0], pathnameWithoutTrailingSlash)) return page;
  }
}

function manageTrailingSlash(urlString: string) {
  const { CONFIG } = getConstants();

  if (!CONFIG.trailingSlash) return urlString;

  const url = new URL(urlString, fakeOrigin);

  url.pathname = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;

  return url.toString().replace(fakeOrigin, '');
}

import { BunriseRequest } from "../../bunrise";
import getLocaleFromRequest from "../get-locale-from-request";
import getRouteMatcher from "../get-route-matcher";
import getConstants from "../../constants";

export default function handleI18n(req: BunriseRequest): {
  response?: Response;
  pagesRouter?: ReturnType<typeof getRouteMatcher>;
  rootRouter?: ReturnType<typeof getRouteMatcher>;
} {
  const { PAGES_DIR, ROOT_DIR, RESERVED_PAGES, I18N_CONFIG } = getConstants();
  const { locales, defaultLocale } = I18N_CONFIG || {};

  if (!defaultLocale || !locales?.length) return {};

  const locale = getLocaleFromRequest(req);
  const url = new URL(req.url);
  const [, localeFromUrl] = url.pathname.split("/");

  // Redirect to default locale if there is no locale in the URL
  if (localeFromUrl !== locale) {
    const location = `/${locale}${url.pathname}${url.search}${url.hash}`;

    return {
      response: new Response(null, {
        status: 301,
        headers: {
          location,
        },
      }),
    };
  }

  req.i18n = { defaultLocale: defaultLocale, locales: locales, locale };

  return {
    pagesRouter: getRouteMatcher(PAGES_DIR, RESERVED_PAGES, locale),
    rootRouter: getRouteMatcher(ROOT_DIR, undefined, locale),
  };
}

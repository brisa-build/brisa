import { RequestContext } from "../../bunrise";
import getLocaleFromRequest from "../get-locale-from-request";
import getRouteMatcher from "../get-route-matcher";
import getConstants from "../../constants";
import translateCore from "../translate-core";
import adaptRouterToPageTranslations from "../adapt-router-to-page-translations";

export default function handleI18n(req: RequestContext): {
  response?: Response;
  pagesRouter?: ReturnType<typeof getRouteMatcher>;
  rootRouter?: ReturnType<typeof getRouteMatcher>;
} {
  const { PAGES_DIR, ROOT_DIR, RESERVED_PAGES, I18N_CONFIG } = getConstants();
  const { locales, defaultLocale, pages } = I18N_CONFIG || {};

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
          "Cache-Control": "no-cache, no-store, must-revalidate",
          expires: "-1",
          pragma: "no-cache",
          location,
          vary: "Accept-Language",
        },
      }),
    };
  }

  // Set i18n to the request
  req.i18n = {
    defaultLocale,
    locales,
    locale,
    t: translateCore(locale),
  };

  const routers = {
    pagesRouter: getRouteMatcher(PAGES_DIR, RESERVED_PAGES, locale),
    rootRouter: getRouteMatcher(ROOT_DIR, undefined, locale),
  };

  if (pages) {
    routers.pagesRouter = adaptRouterToPageTranslations(
      pages,
      routers.pagesRouter,
    );
  }

  return routers;
}

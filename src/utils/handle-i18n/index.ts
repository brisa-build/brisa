import getLocaleFromRequest from "../get-locale-from-request";
import getRouteMatcher from "../get-route-matcher";
import getConstants from "../../constants";
import translateCore from "../translate-core";
import adaptRouterToPageTranslations from "../adapt-router-to-page-translations";
import { RequestContext } from "../../types";

export default function handleI18n(req: RequestContext): {
  response?: Response;
  pagesRouter?: ReturnType<typeof getRouteMatcher>;
  rootRouter?: ReturnType<typeof getRouteMatcher>;
} {
  const {
    PAGES_DIR,
    ROOT_DIR,
    RESERVED_PAGES,
    I18N_CONFIG,
    CONFIG,
    IS_PRODUCTION,
  } = getConstants();
  const { locales, defaultLocale, pages, domains } = I18N_CONFIG || {};
  const trailingSlashSymbol = CONFIG.trailingSlash ? "/" : "";

  if (!defaultLocale || !locales?.length) return {};

  const locale = getLocaleFromRequest(req);
  const url = new URL(req.finalURL);
  const [, localeFromUrl] = url.pathname.split("/");
  const pathname = url.pathname.replace(/\/$/, "");

  const routers = {
    pagesRouter: getRouteMatcher(PAGES_DIR, RESERVED_PAGES, locale),
    rootRouter: getRouteMatcher(ROOT_DIR, undefined, locale),
  };

  // Redirect to default locale if there is no locale in the URL
  if (localeFromUrl !== locale) {
    const { route } = routers.pagesRouter.match(req);
    const translatedRoute = pages?.[route?.name]?.[locale] ?? pathname;
    const [domain, domainConf] =
      Object.entries(domains || {}).find(
        ([, domainConf]) => domainConf.defaultLocale === locale,
      ) ?? [];

    const finalPathname = `/${locale}${translatedRoute}${url.search}${url.hash}${trailingSlashSymbol}`;
    const applyDomain = domain && (IS_PRODUCTION || domainConf?.dev);
    const location = applyDomain
      ? `${domainConf?.protocol || "https"}://${domain}${finalPathname}`
      : finalPathname;

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

  if (pages) {
    routers.pagesRouter = adaptRouterToPageTranslations(
      pages,
      routers.pagesRouter,
    );
  }

  return routers;
}

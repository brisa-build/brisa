import getLocaleFromRequest from "@/utils/get-locale-from-request";
import getRouteMatcher from "@/utils/get-route-matcher";
import { getConstants } from "@/constants";
import translateCore from "@/utils/translate-core";
import adaptRouterToPageTranslations from "@/utils/adapt-router-to-page-translations";
import type { RequestContext } from "@/types";
import { logError } from "@/utils/log/log-build";
import { redirect } from "@/utils/redirect";

export default function handleI18n(req: RequestContext): {
  response?: Response;
  pagesRouter?: ReturnType<typeof getRouteMatcher>;
  rootRouter?: ReturnType<typeof getRouteMatcher>;
} {
  const {
    PAGES_DIR,
    BUILD_DIR,
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
    rootRouter: getRouteMatcher(BUILD_DIR, undefined, locale),
  };

  // Redirect to default locale if there is no locale in the URL
  if (localeFromUrl !== locale) {
    const { route } = routers.pagesRouter.match(req);
    const translatedRoute = pages?.[route?.name!]?.[locale] ?? pathname;
    const [domain, domainConf] =
      Object.entries(domains || {}).find(
        ([, domainConf]) => domainConf.defaultLocale === locale,
      ) ?? [];

    const finalPathname = `/${locale}${translatedRoute}${url.search}${url.hash}${trailingSlashSymbol}`;
    const applyDomain = domain && (IS_PRODUCTION || domainConf?.dev);
    const location = applyDomain
      ? `${domainConf?.protocol || "https"}://${domain}${finalPathname}`
      : finalPathname;

    return { response: redirect(location) };
  }

  // Inject messages from overrideMessages callback
  const translateCoreConfig = {
    ...I18N_CONFIG,
    get _messages() {
      return req.store.get("_messages");
    },
  };

  // Set i18n to the request
  req.i18n = {
    defaultLocale,
    locales,
    locale,
    t: translateCore(locale, translateCoreConfig),
    pages: pages ?? {},
    overrideMessages: (callback) => {
      if (typeof callback !== "function") {
        return logError(
          ["overrideMessages requires a callback function"],
          undefined,
          req,
        );
      }

      const messages = callback(I18N_CONFIG?.messages?.[locale]);
      const save = (messages: Record<string, any>) =>
        req.store.set("_messages", messages);

      if (messages instanceof Promise) {
        messages.then(save);
      } else {
        save(messages as Record<string, any>);
      }
    },
  };

  if (pages) {
    routers.pagesRouter = adaptRouterToPageTranslations(
      pages,
      routers.pagesRouter,
    );
  }

  return routers;
}

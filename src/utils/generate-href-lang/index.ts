import getConstants from "@/constants";
import { RequestContext } from "@/types";
import substituteI18nRouteValues from "@/utils/substitute-i18n-route-values";

export default function generateHrefLang(request: RequestContext) {
  const { locale } = request.i18n ?? {};
  const { I18N_CONFIG, RESERVED_PAGES, CONFIG } = getConstants();
  const { locales, hrefLangOrigin } = I18N_CONFIG ?? {};
  const pageRoute = request.route?.name || "";

  if (!locale || !hrefLangOrigin || RESERVED_PAGES.includes(pageRoute))
    return "";

  return locales
    .map((lang: string) => {
      if (lang === locale) return "";

      const domain = getHrefLangDomain(lang);

      if (!domain) return "";

      const url = getURLInAnotherLang(domain, lang, request);
      const urlWithoutTrailingSlash = url.toString().replace(/\/$/, "");
      const finalUrl = `${urlWithoutTrailingSlash}${
        CONFIG.trailingSlash ? "/" : ""
      }`;

      return `<link rel="alternate" hreflang="${lang}" href="${finalUrl}" />`;
    })
    .join("");
}

function getHrefLangDomain(locale: string): string {
  const { I18N_CONFIG, IS_PRODUCTION } = getConstants();
  const { hrefLangOrigin } = I18N_CONFIG ?? {};
  const domain =
    typeof hrefLangOrigin === "string"
      ? hrefLangOrigin
      : hrefLangOrigin?.[locale];

  if (!domain) return "";

  if (domain && !URL.canParse(domain)) {
    if (!IS_PRODUCTION)
      console.warn(
        `hrefLangOrigin for ${locale} is not a valid URL. Please check that has protocol and domain.`,
      );
    return "";
  }

  return domain;
}

function getURLInAnotherLang(
  domain: string,
  locale: string,
  request: RequestContext,
) {
  const { I18N_CONFIG, LOCALES_SET } = getConstants();
  const paths = new URL(request.finalURL).pathname.split("/");
  const page = LOCALES_SET.has(paths[1])
    ? paths.join("/").slice(3)
    : paths.join("/");
  const url = new URL(page, domain);
  const { pages = {} } = I18N_CONFIG ?? {};
  const pageRoute = request.route?.name || "";
  const pageTranslatedRoute = pages[pageRoute]?.[locale] || pageRoute;
  const translation = substituteI18nRouteValues(pageTranslatedRoute, page);

  url.pathname = `/${locale}${translation}`;

  return url;
}

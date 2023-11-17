import getConstants from "../../constants";
import { I18nConfig, RequestContext } from "../../types";

export default function getLocaleFromRequest(request: RequestContext): string {
  const { I18N_CONFIG = {}, LOCALES_SET } = getConstants();
  const { pathname } = new URL(request.finalURL);
  const [, locale] = pathname.split("/");

  if (LOCALES_SET.has(locale)) return locale;

  const localeFromCookie = getLocaleFromCookie(request);

  if (localeFromCookie && LOCALES_SET.has(localeFromCookie)) {
    return localeFromCookie;
  }

  const browserLocales = getLocalesFromAcceptLanguage(request);
  const browserLocale = getFirstSupportedLocale(browserLocales, LOCALES_SET);

  return browserLocale ? browserLocale : getDefaultLocale(request, I18N_CONFIG);
}

function getLocaleFromCookie(request: Request): string | undefined {
  const cookies = request.headers.get("Cookie");
  const cookie = cookies?.match(/BRISA_LOCALE=(?<locale>\w+)/);

  return cookie?.groups?.locale;
}

function getLocalesFromAcceptLanguage(request: Request): string[] | undefined {
  const acceptLanguage = request.headers.get("Accept-Language");

  return acceptLanguage?.split(",").map((locale) => locale.split(";")[0]);
}

function getDefaultLocale(
  request: RequestContext,
  I18N_CONFIG: I18nConfig
): string {
  const domain = new URL(request.finalURL).hostname;
  const domainDefaultLocale = I18N_CONFIG.domains?.[domain]?.defaultLocale;

  return domainDefaultLocale ?? I18N_CONFIG.defaultLocale;
}

function getFirstSupportedLocale(
  locales: string[] = [],
  supportedLocales: Set<string>
): string | undefined {
  for (const locale of locales) {
    if (supportedLocales.has(locale)) return locale;

    const [language] = locale.split("-");

    if (supportedLocales.has(language)) return language;
  }
}

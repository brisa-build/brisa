import getConstants from "../../constants";

export default function getLocaleFromRequest(request: Request): string {
  const { I18N_CONFIG = {}, LOCALES_SET } = getConstants();
  const { pathname } = new URL(request.url);
  const [, locale] = pathname.split("/");

  if (LOCALES_SET.has(locale)) return locale;

  const localeFromCookie = getLocaleFromCookie(request);

  if (localeFromCookie && LOCALES_SET.has(localeFromCookie)) {
    return localeFromCookie;
  }

  const browserLocales = getLocalesFromAcceptLanguage(request);
  const browserLocale = getFirstSupportedLocale(browserLocales, LOCALES_SET);

  return browserLocale ? browserLocale : I18N_CONFIG.defaultLocale;
}

function getLocaleFromCookie(request: Request): string | undefined {
  const cookies = request.headers.get("Cookie");
  const cookie = cookies?.match(/BUNRISE_LOCALE=(?<locale>\w+)/);

  return cookie?.groups?.locale;
}

function getLocalesFromAcceptLanguage(request: Request): string[] | undefined {
  const acceptLanguage = request.headers.get("Accept-Language");

  return acceptLanguage?.split(",").map((locale) => locale.split(";")[0]);
}

function getFirstSupportedLocale(
  locales: string[] = [],
  supportedLocales: Set<string>,
): string | undefined {
  for (const locale of locales) {
    if (supportedLocales.has(locale)) return locale;

    const [language] = locale.split("-");

    if (supportedLocales.has(language)) return language;
  }
}

import getConstants from "../../constants";

export default function getLocaleFromRequest(request: Request): string {
  const { I18N_CONFIG = {}, LOCALES_SET } = getConstants();
  const { pathname } = new URL(request.url);
  const [, locale] = pathname.split("/");

  if (LOCALES_SET.has(locale)) return locale;

  const acceptLanguage = request.headers.get("Accept-Language");
  const browserLocales = acceptLanguage
    ?.split(",")
    .map((locale) => locale.split(";")[0]);

  if (browserLocales?.length) {
    for (const browserLocale of browserLocales) {
      if (LOCALES_SET.has(browserLocale)) return browserLocale;

      const [language] = browserLocale.split("-");

      if (LOCALES_SET.has(language)) return language;
    }
  }

  return I18N_CONFIG.defaultLocale;
}

import { I18nConfig } from "../../types";

export default function getLocaleFromRequest(
  i18n: I18nConfig,
  request: Request,
): string {
  const { defaultLocale, locales } = i18n;
  const { pathname } = new URL(request.url);
  const [, locale] = pathname.split("/");

  if (locales.includes(locale)) return locale;

  return defaultLocale;
}

import getConstants from "../../constants";

export default function getLocaleFromRequest(request: Request): string {
  const { defaultLocale, locales } = getConstants().I18N_CONFIG || {};
  const { pathname } = new URL(request.url);
  const [, locale] = pathname.split("/");

  if (locales?.includes(locale)) return locale;

  return defaultLocale;
}

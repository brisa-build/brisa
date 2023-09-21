import { RequestContext } from "../../bunrise";
import getConstants from "../../constants";
import translatePathname from "../translate-pathname";

export default function generateHrefLang(request: RequestContext) {
  const { locale } = request.i18n ?? {};
  const page = new URL(request.url).pathname;
  const { I18N_CONFIG } = getConstants();
  const { locales, hrefLangOrigin } = I18N_CONFIG ?? {};

  if (!locale || !hrefLangOrigin) return "";

  return locales
    .map((lang: string) => {
      if (lang === locale) return "";
      const domain = getHrefLangDomain(lang);

      if (!domain) return "";

      const url = new URL(`${domain}${page}`);
      const request = new RequestContext(new Request(url));
      request.i18n = { ...I18N_CONFIG, locale: lang };
      const pathname = translatePathname(url.pathname, request);
      url.pathname = pathname;

      return `<link rel="alternate" hreflang="${lang}" href="${url.toString()}" />`;
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

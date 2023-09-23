import { describe, it, expect, mock, afterEach } from "bun:test";
import generateHrefLang from ".";
import getConstants from "../../constants";
import { RequestContext } from "../../bunrise";
import { MatchedRoute } from "bun";

const warn = console.warn.bind(console);

describe("utils", () => {
  afterEach(() => {
    globalThis.mockConstants = undefined;
    console.warn = warn;
  });
  describe("generateHrefLang", () => {
    it("should generate the hreflang with the rest of locales", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        LOCALES_SET: new Set(["es", "en"]),
        I18N_CONFIG: {
          locales: ["es", "en"],
          pages: {
            "/somepage": {
              es: "/alguna-pagina",
            },
          },
          hrefLangOrigin: {
            es: "https://www.example.com",
            en: "https://www.example.co.uk",
          },
        },
      };
      const input = new RequestContext(
        new Request("https://www.example.com/somepage"),
        { name: "/somepage" } as MatchedRoute,
      );
      input.i18n = {
        ...getConstants().I18N_CONFIG,
        locale: "es",
      };
      const output = generateHrefLang(input);
      expect(output).toBe(
        `<link rel="alternate" hreflang="en" href="https://www.example.co.uk/en/somepage" />`,
      );
    });

    it("should warn and return empty string if hrefLangOrigin is not a valid URL", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        LOCALES_SET: new Set(["es", "en"]),
        I18N_CONFIG: {
          locales: ["es", "en"],
          pages: {
            "/somepage": {
              es: "/alguna-pagina",
            },
          },
          hrefLangOrigin: {
            es: "https://www.example.com",
            en: "www.example.co.uk",
          },
        },
      };
      const mockWarn = mock((v) => v);
      console.warn = mockWarn;
      const input = new RequestContext(
        new Request("https://www.example.com/somepage"),
        { name: "/somepage" } as MatchedRoute,
      );
      input.i18n = {
        ...getConstants().I18N_CONFIG,
        locale: "es",
      };
      const output = generateHrefLang(input);
      expect(output).toBe("");
      expect(mockWarn.mock.results[0].value).toBe(
        `hrefLangOrigin for en is not a valid URL. Please check that has protocol and domain.`,
      );
    });

    it("should work with hrefLangOrigin as string", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        LOCALES_SET: new Set(["es", "en"]),
        I18N_CONFIG: {
          locales: ["es", "en"],
          pages: {
            "/somepage": {
              es: "/alguna-pagina",
            },
          },
          hrefLangOrigin: "https://www.example.com",
        },
      };
      const input = new RequestContext(
        new Request("https://www.example.com/somepage"),
        { name: "/somepage" } as MatchedRoute,
      );
      input.i18n = {
        ...getConstants().I18N_CONFIG,
        locale: "es",
      };
      const output = generateHrefLang(input);
      expect(output).toBe(
        `<link rel="alternate" hreflang="en" href="https://www.example.com/en/somepage" />`,
      );
    });

    it("should work with dynamic pages without translations", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        LOCALES_SET: new Set(["es", "en"]),
        I18N_CONFIG: {
          locales: ["es", "en"],
          pages: {
            "/somepage/[id]": {
              es: "/alguna-pagina/[id]",
            },
          },
          hrefLangOrigin: "https://www.example.com",
        },
      };
      const input = new RequestContext(
        new Request("https://www.example.com/somepage/1"),
        { name: "/somepage/[id]" } as MatchedRoute,
      );
      input.i18n = {
        ...getConstants().I18N_CONFIG,
        locale: "es",
      };
      const output = generateHrefLang(input);
      expect(output).toBe(
        `<link rel="alternate" hreflang="en" href="https://www.example.com/en/somepage/1" />`,
      );
    });

    it("should work with dynamic pages with translations", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        LOCALES_SET: new Set(["es", "en"]),
        I18N_CONFIG: {
          locales: ["es", "en"],
          pages: {
            "/somepage/[id]": {
              es: "/alguna-pagina/[id]",
              en: "/somepage/[id]",
            },
          },
          hrefLangOrigin: "https://www.example.com",
        },
      };
      const input = new RequestContext(
        new Request("https://www.example.com/somepage/1"),
        { name: "/somepage/[id]" } as MatchedRoute,
      );
      input.i18n = {
        ...getConstants().I18N_CONFIG,
        locale: "en",
      };
      const output = generateHrefLang(input);
      expect(output).toBe(
        `<link rel="alternate" hreflang="es" href="https://www.example.com/es/alguna-pagina/1" />`,
      );
    });

    it("should return empty string if locale is not defined", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        LOCALES_SET: new Set(["es", "en"]),
        I18N_CONFIG: {
          locales: ["es", "en"],
          pages: {
            "/somepage": {
              es: "/alguna-pagina",
            },
          },
          hrefLangOrigin: "https://www.example.com",
        },
      };
      const input = new RequestContext(
        new Request("https://www.example.com/somepage"),
        { name: "/somepage" } as MatchedRoute,
      );
      input.i18n = {
        ...getConstants().I18N_CONFIG,
        locale: undefined,
      };
      const output = generateHrefLang(input);
      expect(output).toBe("");
    });

    it("should work with catchAll routes with translations", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        LOCALES_SET: new Set(["es", "en"]),
        I18N_CONFIG: {
          locales: ["es", "en"],
          pages: {
            "/somepage/[[...catchAll]]": {
              es: "/alguna-pagina/[[...catchAll]]",
              en: "/somepage/[[...catchAll]]",
            },
          },
          hrefLangOrigin: "https://www.example.com",
        },
      };
      const input = new RequestContext(
        new Request("https://www.example.com/somepage/1/2/3"),
        { name: "/somepage/[[...catchAll]]" } as MatchedRoute,
      );
      input.i18n = {
        ...getConstants().I18N_CONFIG,
        locale: "en",
      };
      const output = generateHrefLang(input);
      expect(output).toBe(
        `<link rel="alternate" hreflang="es" href="https://www.example.com/es/alguna-pagina/1/2/3" />`,
      );
    });

    it("should work with dynamic routes and rest dynamic with translations", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        LOCALES_SET: new Set(["es", "en"]),
        I18N_CONFIG: {
          locales: ["es", "en"],
          pages: {
            "/somepage/[id]/settings/[...rest]": {
              es: "/alguna-pagina/[id]/settings/[...rest]",
              en: "/somepage/[id]/settings/[...rest]",
            },
          },
          hrefLangOrigin: "https://www.example.com",
        },
      };
      const input = new RequestContext(
        new Request("https://www.example.com/somepage/1/settings/2/3"),
        { name: "/somepage/[id]/settings/[...rest]" } as MatchedRoute,
      );
      input.i18n = {
        ...getConstants().I18N_CONFIG,
        locale: "en",
      };
      const output = generateHrefLang(input);
      expect(output).toBe(
        `<link rel="alternate" hreflang="es" href="https://www.example.com/es/alguna-pagina/1/settings/2/3" />`,
      );
    });

    it("should work with multi supported locales", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        LOCALES_SET: new Set(["es", "en", "fr"]),
        I18N_CONFIG: {
          locales: ["es", "en", "fr"],
          pages: {
            "/somepage": {
              es: "/alguna-pagina",
              en: "/somepage",
              fr: "/quelquepage",
              it: "/qualchepagina",
              de: "/irgendwelcheseite",
            },
          },
          hrefLangOrigin: "https://www.example.com",
        },
      };
      const input = new RequestContext(
        new Request("https://www.example.com/somepage"),
        { name: "/somepage" } as MatchedRoute,
      );
      input.i18n = {
        ...getConstants().I18N_CONFIG,
        locale: "en",
      };
      const output = generateHrefLang(input);
      expect(output).toBe(
        `<link rel="alternate" hreflang="es" href="https://www.example.com/es/alguna-pagina" /><link rel="alternate" hreflang="fr" href="https://www.example.com/fr/quelquepage" />`,
      );
    });

    it("should work with dynamic routes and multi supported locales", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        LOCALES_SET: new Set(["es", "en", "fr", "it", "de"]),
        I18N_CONFIG: {
          locales: ["es", "en", "fr", "it", "de"],
          pages: {
            "/somepage/[id]/settings/[...rest]": {
              es: "/alguna-pagina/[id]/settings/[...rest]",
              en: "/somepage/[id]/settings/[...rest]",
              fr: "/quelquepage/[id]/parametres/[...rest]",
              it: "/qualchepagina/[id]/impostazioni/[...rest]",
              de: "/irgendwelcheseite/[id]/einstellungen/[...rest]",
            },
          },
          hrefLangOrigin: {
            es: "https://www.example.com",
            en: "https://www.example.co.uk",
            fr: "https://www.example.fr",
            it: "https://www.example.it",
            de: "https://www.example.de",
          },
        },
      };
      const input = new RequestContext(
        new Request("https://www.example.com/somepage/1/settings/2/3"),
        { name: "/somepage/[id]/settings/[...rest]" } as MatchedRoute,
      );
      input.i18n = {
        ...getConstants().I18N_CONFIG,
        locale: "en",
      };
      const output = generateHrefLang(input);
      expect(output).toBe(
        [
          `<link rel="alternate" hreflang="es" href="https://www.example.com/es/alguna-pagina/1/settings/2/3" />`,
          `<link rel="alternate" hreflang="fr" href="https://www.example.fr/fr/quelquepage/1/parametres/2/3" />`,
          `<link rel="alternate" hreflang="it" href="https://www.example.it/it/qualchepagina/1/impostazioni/2/3" />`,
          `<link rel="alternate" hreflang="de" href="https://www.example.de/de/irgendwelcheseite/1/einstellungen/2/3" />`,
        ].join(""),
      );
    });

    it("should skip the hrefLang of some locale without domain in hrefLangOrigin", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        LOCALES_SET: new Set(["es", "en", "fr", "de"]),
        I18N_CONFIG: {
          locales: ["es", "en", "fr", "de"],
          pages: {
            "/somepage/[id]/settings/[...rest]": {
              es: "/alguna-pagina/[id]/settings/[...rest]",
              en: "/somepage/[id]/settings/[...rest]",
              fr: "/quelquepage/[id]/parametres/[...rest]",
              it: "/qualchepagina/[id]/impostazioni/[...rest]",
              de: "/irgendwelcheseite/[id]/einstellungen/[...rest]",
            },
          },
          hrefLangOrigin: {
            es: "https://www.example.com",
            en: "https://www.example.co.uk",
            fr: "https://www.example.fr",
            it: "https://www.example.it", // not supported
            // de -> not defined
          },
        },
      };
      const input = new RequestContext(
        new Request("https://www.example.com/en/somepage/1/settings/2/3"),
        { name: "/somepage/[id]/settings/[...rest]" } as MatchedRoute,
      );
      input.i18n = {
        ...globalThis.mockConstants.I18N_CONFIG,
        locale: "en",
      };
      const output = generateHrefLang(input);
      expect(output).toBe(
        [
          `<link rel="alternate" hreflang="es" href="https://www.example.com/es/alguna-pagina/1/settings/2/3" />`,
          `<link rel="alternate" hreflang="fr" href="https://www.example.fr/fr/quelquepage/1/parametres/2/3" />`,
        ].join(""),
      );
    });

    it("should work with more I18nConfig and with already the language in the pathname", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        LOCALES_SET: new Set(["es", "en"]),
        I18N_CONFIG: {
          defaultLocale: "en",
          locales: ["en", "es"],
          messages: {
            en: {
              hello: "Hello {{name}}!",
              withHtml: "Hello <strong>{{name}}</strong>!",
            },
            es: {
              hello: "¡Hola {{name}}!",
              withHtml: "¡Hola <strong>{{name}}</strong>!",
            },
          },
          pages: {
            "/a": {
              en: "/about-us",
              es: "/sobre-nosotros",
            },
            "/user/[username]": {
              en: "/user/[username]",
              es: "/usuario/[username]",
            },
            "/somepage": {
              en: "/somepage",
              es: "/alguna-pagina",
            },
          },
          hrefLangOrigin: "https://test.com",
        },
      };

      const input = new RequestContext(
        new Request("https://test.com/es/sobre-nosotros"),
        { name: "/a" } as MatchedRoute,
      );
      input.i18n = {
        ...getConstants().I18N_CONFIG,
        locale: "es",
      };

      const output = generateHrefLang(input);

      expect(output).toBe(
        [
          '<link rel="alternate" hreflang="en" href="https://test.com/en/about-us" />',
        ].join(""),
      );
    });

    it("should not generate hrefLang on 404 page (reserved pages)", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        LOCALES_SET: new Set(["es", "en"]),
        I18N_CONFIG: {
          defaultLocale: "en",
          locales: ["en", "es"],
          pages: {
            "/a": {
              en: "/about-us",
              es: "/sobre-nosotros",
            },
          },
          hrefLangOrigin: "https://test.com",
        },
      };

      const input = new RequestContext(
        new Request("https://test.com/es/not-found"),
        { name: "/_404" } as MatchedRoute,
      );
      input.i18n = {
        ...getConstants().I18N_CONFIG,
        locale: "es",
      };

      const output = generateHrefLang(input);

      expect(output).toBe("");
    });

    it("should work with trailingSlash=true in the configuration", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        CONFIG: {
          trailingSlash: true,
        },
        LOCALES_SET: new Set(["es", "en", "fr", "de"]),
        I18N_CONFIG: {
          locales: ["es", "en", "fr", "de"],
          pages: {
            "/somepage/[id]/settings/[...rest]": {
              es: "/alguna-pagina/[id]/settings/[...rest]",
              en: "/somepage/[id]/settings/[...rest]",
              fr: "/quelquepage/[id]/parametres/[...rest]",
              it: "/qualchepagina/[id]/impostazioni/[...rest]",
              de: "/irgendwelcheseite/[id]/einstellungen/[...rest]",
            },
          },
          hrefLangOrigin: {
            es: "https://www.example.com",
            en: "https://www.example.co.uk",
            fr: "https://www.example.fr",
            it: "https://www.example.it", // not supported
            // de -> not defined
          },
        },
      };

      const i18n = {
        ...globalThis.mockConstants.I18N_CONFIG,
        locale: "en",
      }
      const home = new RequestContext(
        new Request("https://www.example.com/en/"),
        { name: "/" } as MatchedRoute,
      );
      const homeWithoutTrailingSlash = new RequestContext(
        new Request("https://www.example.com/en"),
        { name: "/" } as MatchedRoute,
      );
      const withTrailingSlash = new RequestContext(
        new Request("https://www.example.com/en/somepage/1/settings/2/3/"),
        { name: "/somepage/[id]/settings/[...rest]" } as MatchedRoute,
      );
      const withoutTrailingSlash = new RequestContext(
        new Request("https://www.example.com/en/somepage/1/settings/2/3"),
        { name: "/somepage/[id]/settings/[...rest]" } as MatchedRoute,
      );

      home.i18n = i18n;
      withTrailingSlash.i18n = i18n;
      withoutTrailingSlash.i18n = i18n;
      homeWithoutTrailingSlash.i18n = i18n;

      expect(generateHrefLang(home)).toBe(
        [
          `<link rel="alternate" hreflang="es" href="https://www.example.com/es/" />`,
          `<link rel="alternate" hreflang="fr" href="https://www.example.fr/fr/" />`,
        ].join(""),
      );
      expect(generateHrefLang(homeWithoutTrailingSlash)).toBe(
        [
          `<link rel="alternate" hreflang="es" href="https://www.example.com/es/" />`,
          `<link rel="alternate" hreflang="fr" href="https://www.example.fr/fr/" />`,
        ].join(""),
      );
      expect(generateHrefLang(withTrailingSlash)).toBe(
        [
          `<link rel="alternate" hreflang="es" href="https://www.example.com/es/alguna-pagina/1/settings/2/3/" />`,
          `<link rel="alternate" hreflang="fr" href="https://www.example.fr/fr/quelquepage/1/parametres/2/3/" />`,
        ].join(""),
      );
      expect(generateHrefLang(withoutTrailingSlash)).toBe(
        [
          `<link rel="alternate" hreflang="es" href="https://www.example.com/es/alguna-pagina/1/settings/2/3/" />`,
          `<link rel="alternate" hreflang="fr" href="https://www.example.fr/fr/quelquepage/1/parametres/2/3/" />`,
        ].join(""),
      );
    });

    it("should work with trailingSlash=false in the configuration", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        CONFIG: {
          trailingSlash: false,
        },
        LOCALES_SET: new Set(["es", "en", "fr", "de"]),
        I18N_CONFIG: {
          locales: ["es", "en", "fr", "de"],
          pages: {
            "/somepage/[id]/settings/[...rest]": {
              es: "/alguna-pagina/[id]/settings/[...rest]",
              en: "/somepage/[id]/settings/[...rest]",
              fr: "/quelquepage/[id]/parametres/[...rest]",
              it: "/qualchepagina/[id]/impostazioni/[...rest]",
              de: "/irgendwelcheseite/[id]/einstellungen/[...rest]",
            },
          },
          hrefLangOrigin: {
            es: "https://www.example.com",
            en: "https://www.example.co.uk",
            fr: "https://www.example.fr",
            it: "https://www.example.it", // not supported
            // de -> not defined
          },
        },
      };

      const i18n = {
        ...globalThis.mockConstants.I18N_CONFIG,
        locale: "en",
      }
      const home = new RequestContext(
        new Request("https://www.example.com/en/"),
        { name: "/" } as MatchedRoute,
      );
      const homeWithoutTrailingSlash = new RequestContext(
        new Request("https://www.example.com/en"),
        { name: "/" } as MatchedRoute,
      );
      const withTrailingSlash = new RequestContext(
        new Request("https://www.example.com/en/somepage/1/settings/2/3/"),
        { name: "/somepage/[id]/settings/[...rest]" } as MatchedRoute,
      );
      const withoutTrailingSlash = new RequestContext(
        new Request("https://www.example.com/en/somepage/1/settings/2/3"),
        { name: "/somepage/[id]/settings/[...rest]" } as MatchedRoute,
      );

      home.i18n = i18n;
      withTrailingSlash.i18n = i18n;
      withoutTrailingSlash.i18n = i18n;
      homeWithoutTrailingSlash.i18n = i18n;

      expect(generateHrefLang(home)).toBe(
        [
          `<link rel="alternate" hreflang="es" href="https://www.example.com/es" />`,
          `<link rel="alternate" hreflang="fr" href="https://www.example.fr/fr" />`,
        ].join(""),
      );
      expect(generateHrefLang(homeWithoutTrailingSlash)).toBe(
        [
          `<link rel="alternate" hreflang="es" href="https://www.example.com/es" />`,
          `<link rel="alternate" hreflang="fr" href="https://www.example.fr/fr" />`,
        ].join(""),
      );
      expect(generateHrefLang(withTrailingSlash)).toBe(
        [
          `<link rel="alternate" hreflang="es" href="https://www.example.com/es/alguna-pagina/1/settings/2/3" />`,
          `<link rel="alternate" hreflang="fr" href="https://www.example.fr/fr/quelquepage/1/parametres/2/3" />`,
        ].join(""),
      );
      expect(generateHrefLang(withoutTrailingSlash)).toBe(
        [
          `<link rel="alternate" hreflang="es" href="https://www.example.com/es/alguna-pagina/1/settings/2/3" />`,
          `<link rel="alternate" hreflang="fr" href="https://www.example.fr/fr/quelquepage/1/parametres/2/3" />`,
        ].join(""),
      );
    });
  });
});

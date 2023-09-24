import { describe, it, expect, afterEach } from "bun:test";
import renderAttributes from ".";
import { RequestContext } from "../../brisa";
import getConstants from "../../constants";

describe("utils", () => {
  describe("renderAttributes", () => {
    afterEach(() => {
      globalThis.mockConstants = undefined;
    });

    it("should render attributes", () => {
      const request = new RequestContext(new Request("https://example.com"));
      const attributes = renderAttributes({
        props: {
          foo: "bar",
        },
        request,
        type: "div",
      });

      expect(attributes).toBe(' foo="bar"');
    });

    it('should render the "a" href attribute with the locale as prefix', () => {
      const request = new RequestContext(new Request("https://example.com/ru"));

      request.i18n = {
        locale: "ru",
        locales: ["en", "ru"],
        defaultLocale: "en",
        t: () => "",
      };

      const attributes = renderAttributes({
        props: {
          href: "/about",
        },
        request,
        type: "a",
      });

      expect(attributes).toBe(' href="/ru/about"');
    });

    it('should add the lang attribute in the "html" tag', () => {
      const request = new RequestContext(new Request("https://example.com/ru"));

      request.i18n = {
        locale: "ru",
        locales: ["en", "ru"],
        defaultLocale: "en",
        t: () => "",
      };

      const attributes = renderAttributes({
        props: {},
        request,
        type: "html",
      });

      expect(attributes).toBe(' lang="ru"');
    });

    it('should translate the "a" href attribute', () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        I18N_CONFIG: {
          locales: ["en", "es"],
          defaultLocale: "en",
          pages: {
            "/some-page": {
              es: "/alguna-pagina",
            },
            "/user/[id]": {
              es: "/usuario/[id]",
            },
            "/catch/[[...catchAll]]": {
              es: "/atrapar/[[...catchAll]]",
            },
            "/dynamic/[id]/catch/[...rest]": {
              es: "/dinamico/[id]/atrapar/[...rest]",
            },
          },
        },
      };

      const request = new RequestContext(new Request("https://example.com/es"));

      request.i18n = {
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
        t: () => "",
      };

      const hrefOfATag = (href: string) =>
        renderAttributes({
          props: {
            href,
          },
          request,
          type: "a",
        });

      expect(hrefOfATag("/")).toBe(' href="/es"');
      expect(hrefOfATag("/some-page")).toBe(' href="/es/alguna-pagina"');
      expect(hrefOfATag("/user/aral")).toBe(' href="/es/usuario/aral"');
      expect(hrefOfATag("https://example.com")).toBe(
        ' href="https://example.com"',
      );
      expect(hrefOfATag("/catch/first/second")).toBe(
        ' href="/es/atrapar/first/second"',
      );
      expect(hrefOfATag("/dynamic/1/catch/first/second")).toBe(
        ' href="/es/dinamico/1/atrapar/first/second"',
      );
    });

    it("should work with trailing slash enable in the config", () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        CONFIG: {
          trailingSlash: true,
        },
        I18N_CONFIG: {
          locales: ["en", "es"],
          defaultLocale: "en",
          pages: {
            "/some-page": {
              es: "/alguna-pagina",
            },
            "/user/[id]": {
              es: "/usuario/[id]",
            },
            "/catch/[[...catchAll]]": {
              es: "/atrapar/[[...catchAll]]",
            },
            "/dynamic/[id]/catch/[...rest]": {
              es: "/dinamico/[id]/atrapar/[...rest]",
            },
          },
        },
      };

      const request = new RequestContext(new Request("https://example.com/es"));

      request.i18n = {
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
        t: () => "",
      };

      const hrefOfATag = (href: string) =>
        renderAttributes({
          props: {
            href,
          },
          request,
          type: "a",
        });

      expect(hrefOfATag("/")).toBe(' href="/es/"');
      expect(hrefOfATag("/some-page")).toBe(' href="/es/alguna-pagina/"');
      expect(hrefOfATag("/some-page/")).toBe(' href="/es/alguna-pagina/"');
      expect(hrefOfATag("/user/aral")).toBe(' href="/es/usuario/aral/"');
      expect(hrefOfATag("/user/aral/")).toBe(' href="/es/usuario/aral/"');
      expect(hrefOfATag("/catch/first/second")).toBe(
        ' href="/es/atrapar/first/second/"',
      );
      expect(hrefOfATag("/catch/first/second/")).toBe(
        ' href="/es/atrapar/first/second/"',
      );
      expect(hrefOfATag("/dynamic/1/catch/first/second")).toBe(
        ' href="/es/dinamico/1/atrapar/first/second/"',
      );
      expect(hrefOfATag("/dynamic/1/catch/first/second/")).toBe(
        ' href="/es/dinamico/1/atrapar/first/second/"',
      );
    });
  });
});

import { describe, it, expect, afterEach } from "bun:test";
import renderAttributes from ".";
import getConstants from "../../constants";
import extendRequestContext from "../extend-request-context";

describe("utils", () => {
  describe("renderAttributes", () => {
    afterEach(() => {
      globalThis.mockConstants = undefined;
    });

    it("should render attributes", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });
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
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com/ru"),
      });

      request.i18n = {
        locale: "ru",
        locales: ["en", "ru"],
        defaultLocale: "en",
        pages: {},
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
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com/ru"),
      });

      request.i18n = {
        locale: "ru",
        locales: ["en", "ru"],
        defaultLocale: "en",
        pages: {},
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

      const request = extendRequestContext({
        originalRequest: new Request("https://example.com/es"),
      });

      request.i18n = {
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
        pages: {},
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

      const request = extendRequestContext({
        originalRequest: new Request("https://example.com/es"),
      });

      request.i18n = {
        locale: "es",
        locales: ["en", "es"],
        defaultLocale: "en",
        pages: {},
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

    it('should add the assetPrefix to the "src" attribute for internal src (PRODUCTION)', () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        IS_PRODUCTION: true,
        CONFIG: {
          assetPrefix: "https://cdn.test.com",
        },
      };

      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const imgSrc = (src: string) =>
        renderAttributes({
          props: {
            src,
          },
          request,
          type: "img",
        });
      const scriptSrc = (src: string) =>
        renderAttributes({
          props: {
            src,
          },
          request,
          type: "script",
        });

      expect(imgSrc("https://example.com/some-image.png")).toBe(
        ' src="https://example.com/some-image.png"',
      );

      expect(imgSrc("/some-image.png")).toBe(
        ' src="https://cdn.test.com/some-image.png"',
      );

      expect(scriptSrc("https://example.com/some-script.js")).toBe(
        ' src="https://example.com/some-script.js"',
      );

      expect(scriptSrc("/some-script.js")).toBe(
        ' src="https://cdn.test.com/some-script.js"',
      );
    });

    it('should NOT add the assetPrefix to the "src" attribute for internal src (DEVELOPMENT)', () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        IS_PRODUCTION: false,
        CONFIG: {
          assetPrefix: "https://cdn.test.com",
        },
      };

      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const imgSrc = (src: string) =>
        renderAttributes({
          props: {
            src,
          },
          request,
          type: "img",
        });
      const scriptSrc = (src: string) =>
        renderAttributes({
          props: {
            src,
          },
          request,
          type: "script",
        });

      expect(imgSrc("https://example.com/some-image.png")).toBe(
        ' src="https://example.com/some-image.png"',
      );

      expect(imgSrc("/some-image.png")).toBe(' src="/some-image.png"');

      expect(scriptSrc("https://example.com/some-script.js")).toBe(
        ' src="https://example.com/some-script.js"',
      );

      expect(scriptSrc("/some-script.js")).toBe(' src="/some-script.js"');
    });

    it('should add "open" attribute to the "dialog" tag without the boolean content when open=true', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const attributes = renderAttributes({
        props: {
          open: true,
        },
        request,
        type: "dialog",
      });

      expect(attributes).toBe(" open");
    });

    it('should not return "open" attribute to the "dialog" tag when open=false', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const attributes = renderAttributes({
        props: {
          open: false,
        },
        request,
        type: "dialog",
      });

      expect(attributes).toBe("");
    });

    it("should serialize an attribute with an object value", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const attributes = renderAttributes({
        props: {
          foo: {
            bar: "baz",
          },
        },
        request,
        type: "div",
      });

      expect(attributes).toBe(" foo=\"{'bar':'baz'}\"");
    });
  });
});

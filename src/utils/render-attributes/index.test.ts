import { afterEach, describe, expect, it } from "bun:test";
import renderAttributes from ".";
import { getConstants } from "@/constants";
import extendRequestContext from "@/utils/extend-request-context";
import type { MatchedRoute } from "bun";

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

    it('should render the "a" href attribute with the same dynamic value', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com/en/user/aral"),
        route: {
          name: "user",
          params: {
            id: "aral",
          },
        } as unknown as MatchedRoute,
      });

      request.i18n = {
        locale: "ru",
        locales: ["en", "ru"],
        defaultLocale: "en",
        pages: {
          "/user/[id]": {
            ru: "/пользователь/[id]",
          },
        },
        t: () => "",
      };

      const attributes = renderAttributes({
        props: {
          href: "/пользователь/[id]",
        },
        request,
        type: "a",
      });

      expect(attributes).toBe(' href="/ru/пользователь/aral"');
    });

    it('should add the lang attribute in the "html" tag the ltr direction', () => {
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

      expect(attributes).toBe(' lang="ru" dir="ltr"');
    });

    it('should add the lang attribute in the "html" tag with the rtl direction', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com/ar"),
      });

      request.i18n = {
        locale: "ar",
        locales: ["en", "ar"],
        defaultLocale: "en",
        pages: {},
        t: () => "",
      };

      const attributes = renderAttributes({
        props: {},
        request,
        type: "html",
      });

      expect(attributes).toBe(' lang="ar" dir="rtl"');
    });

    it('should not add any attribute when the value is "undefined"', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });
      const attributes = renderAttributes({
        props: {
          foo: undefined,
        },
        request,
        type: "div",
      });

      expect(attributes).toBe("");
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

    it('should transform style prop from obj to string in the "style" attribute', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const attributes = renderAttributes({
        props: {
          style: {
            color: "red",
            backgroundColor: "blue",
            padding: "10px",
            margin: "10px",
            border: "1px solid black",
          },
        },
        request,
        type: "div",
      });

      expect(attributes).toBe(
        ' style="color:red;background-color:blue;padding:10px;margin:10px;border:1px solid black;"',
      );
    });

    it('should also allow style prop as string in the "style" attribute', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const attributes = renderAttributes({
        props: {
          style: "color:red;",
        },
        request,
        type: "div",
      });

      expect(attributes).toBe(' style="color:red;"');
    });
  });
});

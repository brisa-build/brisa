import { afterEach, describe, expect, it } from "bun:test";
import renderAttributes from ".";
import { getConstants } from "../../constants";
import extendRequestContext from "../extend-request-context";
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
        elementProps: {
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
        elementProps: {
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
        elementProps: {
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
        elementProps: {},
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
        elementProps: {},
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
        elementProps: {
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
          elementProps: {
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
          elementProps: {
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
          elementProps: {
            src,
          },
          request,
          type: "img",
        });
      const scriptSrc = (src: string) =>
        renderAttributes({
          elementProps: {
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
          elementProps: {
            src,
          },
          request,
          type: "img",
        });
      const scriptSrc = (src: string) =>
        renderAttributes({
          elementProps: {
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
        elementProps: {
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
        elementProps: {
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
        elementProps: {
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
        elementProps: {
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
        elementProps: {
          style: "color:red;",
        },
        request,
        type: "div",
      });

      expect(attributes).toBe(' style="color:red;"');
    });

    it('should simplify indicatorSignal to indicatorId inside "indicator" attribute', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const attributes = renderAttributes({
        elementProps: {
          indicator: request.indicate("increment"),
        },
        request,
        type: "div",
      });

      expect(attributes).toBe(` indicator="['__ind:increment']"`);
    });

    it('should simplify multi indicatorSignals to indicatorIds inside "indicator" attribute', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const attributes = renderAttributes({
        elementProps: {
          indicator: [
            request.indicate("increment"),
            request.indicate("decrement"),
          ],
        },
        request,
        type: "div",
      });

      expect(attributes).toBe(
        ` indicator="['__ind:increment','__ind:decrement']"`,
      );
    });

    it('should simplify indicatorSignal to indicatorId inside "indicate[Event]" attribute with a string value', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const attributes = renderAttributes({
        elementProps: {
          indicateClick: request.indicate("increment"),
        },
        request,
        type: "div",
      });

      expect(attributes).toBe(` indicateclick="__ind:increment"`);
    });

    it("should not add functions as attributes", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const attributes = renderAttributes({
        elementProps: {
          onClick: () => {},
        },
        request,
        type: "div",
      });

      expect(attributes).toBe("");
    });

    it("should add the data-action-onClick if the onClick function is a function with actionId property", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const onClick = () => {};
      onClick.actionId = "a1_1";

      const attributes = renderAttributes({
        elementProps: {
          onClick,
        },
        request,
        type: "div",
      });

      expect(attributes).toBe(` data-action-onclick="a1_1" data-action`);
    });

    it("should replace the data-action-onClick if the onClick function is a function with actionId property", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const onClick = () => {};
      onClick.actionId = "a1_1";

      const attributes = renderAttributes({
        elementProps: {
          onClick,
          foo: "bar",
          "data-action-onclick": "a1_2",
        },
        request,
        type: "div",
      });

      expect(attributes).toBe(
        ` data-action-onclick="a1_1" data-action foo="bar"`,
      );
    });

    it("should keep data-action if the onClick function is a function with actionId property", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const onClick = () => {};
      onClick.actionId = "a1_1";

      const attributes = renderAttributes({
        elementProps: {
          "data-action-onclick": "a1_2",
          "data-action": true,
          foo: "bar",
          onClick,
        },
        request,
        type: "div",
      });

      expect(attributes).toBe(
        ` data-action-onclick="a1_1" data-action foo="bar"`,
      );
    });

    it("should a nested action work with other actions in the same element", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const onClick = () => {};
      onClick.actionId = "a1_1";

      const attributes = renderAttributes({
        elementProps: {
          foo: "bar",
          "data-action": true,
          onClick,
          onDoubleClick: () => {},
          "data-action-onDoubleClick": "a1_3",
        },
        request,
        type: "div",
      });

      expect(attributes).toBe(
        ` foo="bar" data-action data-action-onclick="a1_1" data-action-ondoubleclick="a1_3"`,
      );
    });

    it("should add only the action properties of the component as data-actions", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const onClick = () => {};
      onClick.actionId = "a1_1";

      const attributes = renderAttributes({
        elementProps: {
          foo: "bar",
          "data-action": true,
          onClick,
          onDoubleClick: () => {},
          "data-action-onDoubleClick": "a1_3",
        },
        request,
        type: "div",
        componentProps: {
          onClick,
          someProp: "someValue",
          empty: undefined,
          nullable: null,
        },
      });

      expect(attributes).toBe(
        ` foo="bar" data-action data-action-onclick="a1_1" data-action-ondoubleclick="a1_3" data-actions="[[['onClick','a1_1']]]"`,
      );
    });

    it("should add also the parent dependencies as data-actions", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const onClick = () => {};
      onClick.actionId = "a1_1";
      onClick.actions = [[["onMouseOver", "a1_2"]]];

      const attributes = renderAttributes({
        elementProps: {
          foo: "bar",
          "data-action": true,
          onClick,
          onDoubleClick: () => {},
          "data-action-onDoubleClick": "a1_3",
        },
        request,
        type: "div",
        componentProps: {
          onClick,
          someProp: "someValue",
          empty: undefined,
          nullable: null,
        },
      });

      expect(attributes).toBe(
        ` foo="bar" data-action data-action-onclick="a1_1" data-action-ondoubleclick="a1_3" data-actions="[[['onClick','a1_1']],[['onMouseOver','a1_2']]]"`,
      );
    });

    it('should not add the "data-actions" attribute when there are no action properties', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const attributes = renderAttributes({
        elementProps: {
          foo: "bar",
          "data-action": true,
        },
        request,
        type: "div",
        componentProps: {
          someProp: "someValue",
          empty: undefined,
          nullable: null,
        },
      });

      expect(attributes).toBe(` foo="bar" data-action`);
    });

    it('should add "action", "enctype" and "method" attributes to the "form" tag when data-action-onsubmit exists', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const attributes = renderAttributes({
        elementProps: { "data-action-onsubmit": "a1", "data-action": true },
        request,
        type: "form",
      });

      expect(attributes).toBe(
        ` data-action-onsubmit="a1" data-action action="/?_aid=a1" enctype="multipart/form-data" method="POST"`,
      );
    });

    it('should add "action", "enctype" and "method" attributes to the "form" tag when onSubmit action and these attributes are not defined', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const onSubmit = () => {};
      onSubmit.actionId = "a1";

      const attributes = renderAttributes({
        elementProps: { onSubmit },
        request,
        type: "form",
      });

      expect(attributes).toBe(
        ` data-action-onsubmit="a1" data-action action="/?_aid=a1" enctype="multipart/form-data" method="POST"`,
      );
    });

    it("should keep search params when adds the action attribute", () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com?foo=bar"),
      });

      const onSubmit = () => {};
      onSubmit.actionId = "a1";

      const attributes = renderAttributes({
        elementProps: { onSubmit },
        request,
        type: "form",
      });

      expect(attributes).toBe(
        ` data-action-onsubmit="a1" data-action action="/?foo=bar&_aid=a1" enctype="multipart/form-data" method="POST"`,
      );
    });

    it('should keep method="GET" when adds the action attribute and the "method" attr aleady exist', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com?foo=bar"),
      });

      const onSubmit = () => {};
      onSubmit.actionId = "a1";

      const attributes = renderAttributes({
        elementProps: { onSubmit, method: "GET" },
        request,
        type: "form",
      });

      expect(attributes).toBe(
        ` data-action-onsubmit="a1" data-action method="GET" action="/?foo=bar&_aid=a1" enctype="multipart/form-data"`,
      );
    });

    it('should keep "action" when adds the method attribute and the "action" attr aleady exist', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com?foo=bar"),
      });

      const onSubmit = () => {};
      onSubmit.actionId = "a1";

      const attributes = renderAttributes({
        elementProps: { onSubmit, action: "/some-action" },
        request,
        type: "form",
      });

      expect(attributes).toBe(
        ` data-action-onsubmit="a1" data-action action="/some-action" enctype="multipart/form-data" method="POST"`,
      );
    });

    it('should keep "enctype" when adds the method attribute and the "enctype" attr aleady exist', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com?foo=bar"),
      });

      const onSubmit = () => {};
      onSubmit.actionId = "a1";

      const attributes = renderAttributes({
        elementProps: {
          onSubmit,
          enctype: "application/x-www-form-urlencoded",
        },
        request,
        type: "form",
      });

      expect(attributes).toBe(
        ` data-action-onsubmit="a1" data-action enctype="application/x-www-form-urlencoded" action="/?foo=bar&_aid=a1" method="POST"`,
      );
    });

    it('should "data-actions" dependencies not mutate', () => {
      const request = extendRequestContext({
        originalRequest: new Request("https://example.com"),
      });

      const onClick = () => {};
      onClick.actionId = "a1_1";
      onClick.actions = [[["onMouseOver", "a1_2"]]];

      const attributesConfig = {
        elementProps: {
          foo: "bar",
          "data-action": true,
          onClick,
          onDoubleClick: () => {},
          "data-action-onDoubleClick": "a1_3",
        },
        request,
        type: "div",
        componentProps: {
          onClick,
          someProp: "someValue",
          empty: undefined,
          nullable: null,
        },
      };

      const attributes = renderAttributes(attributesConfig);
      const attributes2 = renderAttributes(attributesConfig);

      expect(attributes).toBe(
        ` foo="bar" data-action data-action-onclick="a1_1" data-action-ondoubleclick="a1_3" data-actions="[[['onClick','a1_1']],[['onMouseOver','a1_2']]]"`,
      );
      expect(attributes2).toBe(attributes);
    });
  });
});

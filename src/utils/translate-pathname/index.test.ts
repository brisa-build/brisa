import { afterEach, describe, it, expect } from "bun:test";
import translatePathname from ".";
import { RequestContext } from "../../bunrise";
import getConstants from "../../constants";

describe("utils", () => {
  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  describe("translatePathname", () => {
    it("should translate the pathname", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        I18N_CONFIG: {
          locale: "es",
          locales: ["es", "en"],
          defaultLocale: "es",
          pages: {
            "/example": {
              es: "/ejemplo",
            },
          },
        },
      };

      const requestContext = new RequestContext(
        new Request("https://example.com"),
      );
      requestContext.i18n = {
        ...globalThis.mockConstants.I18N_CONFIG,
        locale: "es",
      };

      const output = translatePathname("/example", requestContext);

      expect(output).toBe("/es/ejemplo");
    });

    it("should work with dynamic routes and catchAll routes", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        I18N_CONFIG: {
          locale: "es",
          locales: ["es", "en"],
          defaultLocale: "es",
          pages: {
            "/example/[id]/settings/[[...catchAll]]": {
              es: "/ejemplo/[id]/configuracion/[[...catchAll]]",
            },
          },
        },
      };

      const requestContext = new RequestContext(
        new Request("https://example.com"),
      );
      requestContext.i18n = {
        ...globalThis.mockConstants.I18N_CONFIG,
        locale: "es",
      };

      const output = translatePathname(
        "/example/1/settings/2/3",
        requestContext,
      );

      expect(output).toBe("/es/ejemplo/1/configuracion/2/3");
    });
  });
});

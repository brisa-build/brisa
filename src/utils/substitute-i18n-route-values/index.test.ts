import { afterEach, describe, it, expect } from "bun:test";
import substituteI18nRouteValues from ".";
import getConstants from "../../constants";

describe("utils", () => {
  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  describe("substituteI18nRouteValues", () => {
    it("should translate the pathname", () => {
      globalThis.mockConstants = {
        ...getConstants(),
        I18N_CONFIG: {
          locale: "es",
          locales: ["es", "en"],
          defaultLocale: "es",
          pages: {
            "/example/[id]": {
              es: "/ejemplo/[id]",
            },
          },
        },
      };

      const output = substituteI18nRouteValues(
        "/example/[id]",
        "/ejemplo/some-id"
      );

      expect(output).toBe("/example/some-id");
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

      const output = substituteI18nRouteValues(
        "/example/[id]/settings/[[...catchAll]]",
        "/ejemplo/1/configuracion/2/3"
      );

      expect(output).toBe("/example/1/settings/2/3");
    });
  });
});

import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import path from "node:path";
import adaptRouterToPageTranslations from ".";
import getRouteMatcher from "../get-route-matcher";
import getConstants from "../../constants";
import extendRequestContext from "../extend-request-context";

const PAGES_DIR = path.join(
  import.meta.dir,
  "..",
  "..",
  "__fixtures__",
  "pages",
);

const pages = {
  "/somepage": {
    es: "/alguna-pagina",
    it: "/qualsiasi-pagina",
  },
  "/user/[username]": {
    es: "/usuario/[username]",
  },
};

const router = getRouteMatcher(PAGES_DIR, ["/_404"]);

const createRequest = (url: string) => {
  const request = extendRequestContext({ originalRequest: new Request(url) });
  request.i18n = {
    locale: "es",
    defaultLocale: "es",
    t: (v) => "",
    locales: ["en", "es"],
    pages: {},
  };
  return request;
};

describe("utils", () => {
  beforeEach(() => {
    globalThis.mockConstants = {
      ...(getConstants() ?? {}),
      PAGES_DIR,
      I18N_CONFIG: {
        locales: ["en", "es"],
        defaultLocale: "es",
        pages,
      },
    };
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });
  describe("adaptRouterToPageTranslations", () => {
    describe("given a real router", () => {
      it("should NOT return the route given the original pathname respecting the locale page", () => {
        const { match, reservedRoutes } = adaptRouterToPageTranslations(
          pages,
          router,
        );
        const { route, isReservedPathname } = match(
          createRequest("https://example.com/somepage"),
        );
        expect(route).toBe(null);
        expect(isReservedPathname).toBe(false);
        expect(reservedRoutes["/_404"]).toBeDefined();
      });

      it("should NOT return the route given another locale page", () => {
        const { match, reservedRoutes } = adaptRouterToPageTranslations(
          pages,
          router,
        );
        const { route, isReservedPathname } = match(
          createRequest("https://example.com/qualsiasi-pagina"),
        );
        expect(route).toBe(null);
        expect(isReservedPathname).toBe(false);
        expect(reservedRoutes["/_404"]).toBeDefined();
      });

      it("should return the route given the translated pathname", () => {
        const { match, reservedRoutes } = adaptRouterToPageTranslations(
          pages,
          router,
        );
        const { route, isReservedPathname } = match(
          createRequest("https://example.com/alguna-pagina"),
        );
        expect(route).not.toBe(null);
        expect(route?.filePath).toBe(path.join(PAGES_DIR, "somepage.tsx"));
        expect(isReservedPathname).toBe(false);
        expect(reservedRoutes["/_404"]).toBeDefined();
      });

      it("should return the dynamic route given the translated pathname", () => {
        const { match, reservedRoutes } = adaptRouterToPageTranslations(
          pages,
          router,
        );
        const { route, isReservedPathname } = match(
          createRequest("https://example.com/usuario/aral"),
        );
        expect(route).not.toBe(null);
        expect(route?.filePath).toBe(
          path.join(PAGES_DIR, "user", "[username].tsx"),
        );
        expect(isReservedPathname).toBe(false);
        expect(reservedRoutes["/_404"]).toBeDefined();
      });
    });

    describe("given a mock router", () => {
      it("should detect all the translated routes", () => {
        const mockRouter = {
          match: (v: any) => ({
            route: typeof v.finalURL === "string" ? new URL(v.finalURL) : null,
          }),
        };
        const mockPages = {
          "/somepage": { es: "/alguna-pagina", it: "/qualsiasi-pagina" },
          "/user/[username]": { es: "/usuario/[username]" },
          "/some/[...slug]": { es: "/algo/[...slug]" },
          "/another/[[...catchall]]": { es: "/otra-cosa/[[...catchall]]" },
          "/": { es: "/" },
          "/user/[username]/settings/[id]": {
            es: "/usuario/[username]/configuracion/[id]",
          },
        };
        const { match } = adaptRouterToPageTranslations(
          mockPages,
          mockRouter as any,
        );

        const getPathname = (v: any) =>
          match(createRequest(v))?.route?.pathname;

        expect(getPathname("https://example.com/alguna-pagina")).toBe(
          "/somepage",
        );
        expect(getPathname("https://example.com/usuario/aral")).toBe(
          "/user/aral",
        );
        expect(getPathname("https://example.com/algo/1/2/3")).toBe(
          "/some/1/2/3",
        );
        expect(getPathname("https://example.com/otra-cosa/1/2/3")).toBe(
          "/another/1/2/3",
        );
        expect(getPathname("https://example.com/")).toBe("/");
        expect(
          getPathname("https://example.com/usuario/aral/configuracion/1"),
        ).toBe("/user/aral/settings/1");

        // not untranslated because is not in the current locale "es"
        expect(getPathname("https://example.com/qualsiasi-pagina")).toBe(
          "/qualsiasi-pagina",
        );
      });

      it("should detect all the translated routes with locale prefix", () => {
        const mockRouter = {
          match: (v: any) => ({
            route: typeof v.finalURL === "string" ? new URL(v.finalURL) : null,
          }),
        };
        const mockPages = {
          "/somepage": { es: "/alguna-pagina", it: "/qualsiasi-pagina" },
          "/user/[username]": { es: "/usuario/[username]" },
          "/some/[...slug]": { es: "/algo/[...slug]" },
          "/another/[[...catchall]]": { es: "/otra-cosa/[[...catchall]]" },
          "/": { es: "/" },
          "/user/[username]/settings/[id]": {
            es: "/usuario/[username]/configuracion/[id]",
          },
        };
        const { match } = adaptRouterToPageTranslations(
          mockPages,
          mockRouter as any,
        );

        const getPathname = (v: any) =>
          match(createRequest(v))?.route?.pathname;

        expect(getPathname("https://example.com/es/alguna-pagina")).toBe(
          "/somepage",
        );
        expect(getPathname("https://example.com/es/usuario/aral")).toBe(
          "/user/aral",
        );
        expect(getPathname("https://example.com/es/algo/1/2/3")).toBe(
          "/some/1/2/3",
        );
        expect(getPathname("https://example.com/es/otra-cosa/1/2/3")).toBe(
          "/another/1/2/3",
        );
        expect(getPathname("https://example.com/es")).toBe("/");
        expect(
          getPathname("https://example.com/es/usuario/aral/configuracion/1"),
        ).toBe("/user/aral/settings/1");

        // not untranslated because is not in the current locale "es"
        expect(getPathname("https://example.com/es/qualsiasi-pagina")).toBe(
          "/qualsiasi-pagina",
        );
      });

      it("should detect all the translated routes with trailingSlash", () => {
        const mockRouter = {
          match: (v: any) => ({
            route: typeof v.finalURL === "string" ? new URL(v.finalURL) : null,
          }),
        };
        const mockPages = {
          "/somepage": { es: "/alguna-pagina", it: "/qualsiasi-pagina" },
          "/user/[username]": { es: "/usuario/[username]" },
          "/some/[...slug]": { es: "/algo/[...slug]" },
          "/another/[[...catchall]]": { es: "/otra-cosa/[[...catchall]]" },
          "/": { es: "/" },
          "/user/[username]/settings/[id]": {
            es: "/usuario/[username]/configuracion/[id]",
          },
          "/somepage-without-spanish": { it: "/qualsiasi/" },
        };
        const { match } = adaptRouterToPageTranslations(
          mockPages,
          mockRouter as any,
        );

        const getPathname = (v: any) =>
          match(createRequest(v))?.route?.pathname;

        expect(getPathname("https://example.com/es/alguna-pagina/")).toBe(
          "/somepage",
        );
        expect(getPathname("https://example.com/es/usuario/aral/")).toBe(
          "/user/aral",
        );
        expect(getPathname("https://example.com/es/algo/1/2/3/")).toBe(
          "/some/1/2/3",
        );
        expect(getPathname("https://example.com/es/otra-cosa/1/2/3/")).toBe(
          "/another/1/2/3",
        );
        expect(getPathname("https://example.com/es/")).toBe("/");
        expect(
          getPathname("https://example.com/es/usuario/aral/configuracion/1/"),
        ).toBe("/user/aral/settings/1");

        // not untranslated because is not in the current locale "es"
        expect(getPathname("https://example.com/es/qualsiasi-pagina/")).toBe(
          "/qualsiasi-pagina",
        );
        expect(
          getPathname("https://example.com/es/somepage-without-spanish/"),
        ).toBe("/somepage-without-spanish");
      });
    });
  });
});

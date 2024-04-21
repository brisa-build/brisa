import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";

import getClientCodeInPage from ".";
import { getConstants } from "@/constants";
import getWebComponentsList from "@/utils/get-web-components-list";

const src = path.join(import.meta.dir, "..", "..", "__fixtures__");
const webComponentsDir = path.join(src, "web-components");
const build = path.join(src, `out-${crypto.randomUUID()}}`);
const brisaInternals = path.join(build, "_brisa");
const pages = path.join(src, "pages");
const allWebComponents = await getWebComponentsList(src);
const pageWebComponents = {
  "web-component": allWebComponents["web-component"],
  "native-some-example": allWebComponents["native-some-example"],
};

const i18nCode = 3072;
const brisaSize = 5650; // TODO: Reduce this size
const webComponents = 684;
const unsuspenseSize = 217;
const rpcSize = 2020; // TODO: Reduce this size
const lazyRPCSize = 3069; // TODO: Reduce this size
// lazyRPC is loaded after user interaction (action, link),
// so it's not included in the initial size
const initialSize = unsuspenseSize + rpcSize;

describe("utils", () => {
  beforeEach(async () => {
    fs.mkdirSync(build, { recursive: true });
    fs.mkdirSync(brisaInternals, { recursive: true });
    const constants = getConstants() ?? {};
    globalThis.mockConstants = {
      ...constants,
      SRC_DIR: src,
      IS_PRODUCTION: true,
      IS_DEVELOPMENT: false,
      BUILD_DIR: build,
    };
  });

  afterEach(() => {
    fs.rmSync(build, { recursive: true });
    globalThis.mockConstants = undefined;
  });

  describe("getClientCodeInPage", () => {
    it("should not return client code in page without web components, without suspense, without server actions", async () => {
      const pagePath = path.join(pages, "somepage.tsx");
      const output = await getClientCodeInPage({ pagePath, allWebComponents });
      const expected = {
        code: "",
        rpc: "",
        lazyRPC: "",
        unsuspense: "",
        size: 0,
        useI18n: false,
        useContextProvider: false,
        i18nKeys: new Set<string>(),
      };
      expect(output).toEqual(expected);
    });

    it("should return client code size of brisa + 2 web-components in page with web components", async () => {
      const pagePath = path.join(pages, "page-with-web-component.tsx");
      const output = await getClientCodeInPage({
        pagePath,
        allWebComponents,
        pageWebComponents,
      });

      expect(output).not.toBeNull();
      expect(output!.size).toEqual(brisaSize + i18nCode + webComponents);
      expect(output!.useI18n).toBeTrue();
      expect(output!.i18nKeys).toEqual(new Set(["hello"]));
    });

    it("should return client code size as 0 when a page does not have web components", async () => {
      const pagePath = path.join(pages, "somepage.tsx");
      const output = await getClientCodeInPage({ pagePath, allWebComponents });
      expect(output!.size).toEqual(0);
    });

    it("should return client code in page with suspense and rpc", async () => {
      const pagePath = path.join(pages, "index.tsx");
      const output = await getClientCodeInPage({ pagePath, allWebComponents });

      expect(output?.unsuspense.length).toBe(unsuspenseSize);
      expect(output?.rpc.length).toBe(rpcSize);
      expect(output?.lazyRPC.length).toBe(lazyRPCSize);
      expect(output?.size).toBe(initialSize);
      expect(output?.code).toBeEmpty();
      expect(output?.useI18n).toBeFalse();
      expect(output?.i18nKeys).toBeEmpty();
    });

    it("should define 2 web components if there is 1 web component and another one inside", async () => {
      const pagePath = path.join(pages, "page-with-web-component.tsx");
      const output = await getClientCodeInPage({
        pagePath,
        allWebComponents,
        pageWebComponents,
      });
      expect(output!.code).toContain('"web-component"');
      expect(output!.code).toContain('"native-some-example"');
    });

    it("should load lazyRPC in /somepage because it has an hyperlink", async () => {
      const webComponentSize = 125;
      const output = await getClientCodeInPage({
        pagePath: path.join(pages, "somepage.tsx"),
        allWebComponents,
        pageWebComponents: {
          "with-link": allWebComponents["with-link"],
        },
      });
      expect(output!.code).toContain('"with-link"');
      expect(output?.unsuspense.length).toBe(0);
      expect(output?.rpc.length).toBe(rpcSize);
      expect(output?.lazyRPC.length).toBe(lazyRPCSize);
      expect(output?.size).toBe(brisaSize + webComponentSize + rpcSize);
      expect(output?.useI18n).toBeFalse();
      expect(output?.i18nKeys).toBeEmpty();
    });

    it("should add context-provider if the page has a context-provider without serverOnly attribute", async () => {
      const pagePath = path.join(pages, "somepage-with-context.tsx");
      const output = await getClientCodeInPage({
        pagePath,
        allWebComponents,
        pageWebComponents,
      });
      expect(output!.code).toContain('"context-provider"');
    });

    it("should add context-provider if the page has not a context-provider but layoutHasContextProvider is true", async () => {
      const pagePath = path.join(pages, "somepage.tsx");
      const layoutHasContextProvider = true;
      const output = await getClientCodeInPage({
        pagePath,
        allWebComponents,
        pageWebComponents,
        layoutHasContextProvider,
      });
      expect(output!.code).toContain('"context-provider"');
    });

    it("should not add context-provider if the page has a context-provider with serverOnly attribute", async () => {
      const pagePath = path.join(pages, "somepage.tsx");
      const output = await getClientCodeInPage({
        pagePath,
        allWebComponents,
        pageWebComponents,
      });
      expect(output!.code).not.toContain('"context-provider"');
    });

    it("should allow environment variables in web components with BRISA_PUBLIC_ prefix", async () => {
      const pagePath = path.join(pages, "page-with-web-component.tsx");
      Bun.env.BRISA_PUBLIC_TEST = "value of test env variable";
      const output = await getClientCodeInPage({
        pagePath,
        allWebComponents,
        pageWebComponents,
      });
      expect(output!.code).toContain("value of test env variable");
    });

    it("should NOT add the integrations web context plugins when there are not plugins", async () => {
      const pagePath = path.join(pages, "page-with-web-component.tsx");
      const integrationsPath = path.join(webComponentsDir, "_integrations.tsx");
      const output = await getClientCodeInPage({
        pagePath,
        allWebComponents,
        pageWebComponents,
        integrationsPath,
      });
      expect(output!.code).not.toContain("window._P=");
    });

    it("should add the integrations web context plugins when there are plugins", async () => {
      const pagePath = path.join(pages, "page-with-web-component.tsx");
      const integrationsPath = path.join(
        webComponentsDir,
        "_integrations2.tsx",
      );
      const output = await getClientCodeInPage({
        pagePath,
        allWebComponents,
        pageWebComponents,
        integrationsPath,
      });
      expect(output!.code).toContain("window._P=");
    });
  });
});

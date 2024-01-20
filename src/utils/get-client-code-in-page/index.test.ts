import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";

import getClientCodeInPage from ".";
import { getConstants } from "@/constants";
import getWebComponentsList from "@/utils/get-web-components-list";

const src = path.join(import.meta.dir, "..", "..", "__fixtures__");
const build = path.join(src, `out-${crypto.randomUUID()}}`);
const brisaInternals = path.join(build, "_brisa");
const pages = path.join(src, "pages");
const allWebComponents = await getWebComponentsList(src);
const pageWebComponents = {
  "web-component": allWebComponents["web-component"],
  "native-some-example": allWebComponents["native-some-example"],
};

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
      REGEX: {
        ...constants.REGEX,
        WEB_COMPONENTS_ISLAND: /.*\/src\/__fixtures__\/.*\.(tsx|jsx|js|ts)$/,
      },
    };
  });

  afterEach(() => {
    fs.rmSync(build, { recursive: true });
    globalThis.mockConstants = undefined;
  });

  describe("getClientCodeInPage", () => {
    it("should not return client code in page without web components, without suspense, without server actions", async () => {
      const input = path.join(pages, "somepage.tsx");
      const output = await getClientCodeInPage(input, allWebComponents);
      const expected = {
        code: "",
        unsuspense: "",
        size: 0,
        useI18n: false,
        i18nKeys: new Set<string>(),
      };
      expect(output).toEqual(expected);
    });

    it("should return client code size of brisa + 2 web-components in page with web components", async () => {
      const input = path.join(pages, "page-with-web-component.tsx");
      const output = await getClientCodeInPage(
        input,
        allWebComponents,
        pageWebComponents,
      );
      const i18nCode = 2951;
      const brisaSize = 5264;
      const webComponents = 670;

      expect(output).not.toBeNull();
      expect(output!.size).toEqual(brisaSize + i18nCode + webComponents);
      expect(output!.useI18n).toBeTrue();
      expect(output!.i18nKeys).toEqual(new Set(["hello"]));
    });

    it("shoukld return client code size as 0 when a page does not have web components", async () => {
      const input = path.join(pages, "somepage.tsx");
      const output = await getClientCodeInPage(input, allWebComponents);
      expect(output!.size).toEqual(0);
    });

    it("should return client code in page with suspense", async () => {
      const input = path.join(pages, "index.tsx");

      const output = await getClientCodeInPage(input, allWebComponents);
      const expected = {
        code: "",
        unsuspense:
          "l$=new Set;u$=(h)=>{const r=(v)=>document.getElementById(v);l$.add(h);for(let v of l$){const g=r(`S:${v}`),f=r(`U:${v}`);if(g&&f)l$.delete(v),g.replaceWith(f.content.cloneNode(!0)),f.remove(),r(`R:${v}`)?.remove()}};\n",
        size: 217,
        useI18n: false, // no client code in page
        i18nKeys: new Set<string>(),
      };
      expect(output).toEqual(expected);
    });

    it("should define 2 web components if there is 1 web component and another one inside", async () => {
      const input = path.join(pages, "page-with-web-component.tsx");
      const output = await getClientCodeInPage(
        input,
        allWebComponents,
        pageWebComponents,
      );
      expect(output!.code).toContain('"web-component"');
      expect(output!.code).toContain('"native-some-example"');
    });

    it("should add context-provider if the page has a context-provider without serverOnly attribute", async () => {
      const input = path.join(pages, "somepage-with-context.tsx");
      const output = await getClientCodeInPage(
        input,
        allWebComponents,
        pageWebComponents,
      );
      expect(output!.code).toContain('"context-provider"');
    });

    it("should not add context-provider if the page has a context-provider with serverOnly attribute", async () => {
      const input = path.join(pages, "somepage.tsx");
      const output = await getClientCodeInPage(
        input,
        allWebComponents,
        pageWebComponents,
      );
      expect(output!.code).not.toContain('"context-provider"');
    });

    it("should allow environment variables in web components with BRISA_PUBLIC_ prefix", async () => {
      const input = path.join(pages, "page-with-web-component.tsx");
      Bun.env.BRISA_PUBLIC_TEST = "value of test env variable";
      const output = await getClientCodeInPage(
        input,
        allWebComponents,
        pageWebComponents,
      );
      expect(output!.code).toContain("value of test env variable");
    });
  });
});

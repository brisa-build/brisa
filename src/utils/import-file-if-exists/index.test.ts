import { describe, it, expect, afterEach } from "bun:test";
import importFileIfExists from ".";
import path from "node:path";

const join = path.join;

describe("utils", () => {
  afterEach(() => {
    path.join = join;
  });

  describe("importFileIfExists", () => {
    it("should return null if there is not a custom middleware", async () => {
      const middleware = await importFileIfExists("middleware");
      expect(middleware).toBeNull();
    });

    it('should return custom middleware if "middleware.ts" exists', async () => {
      path.join = () =>
        join(import.meta.dir, "..", "..", "__fixtures__", "middleware");

      const middleware = await importFileIfExists("middleware");
      expect(middleware).toBeFunction();
    });

    it("should return null if there is not a custom i18n", async () => {
      const i18n = await importFileIfExists("i18n");
      expect(i18n).toBeNull();
    });

    it('should return custom i18n if "i18n.ts" exists', async () => {
      path.join = () =>
        join(import.meta.dir, "..", "..", "__fixtures__", "i18n");

      const i18n = await importFileIfExists("i18n");
      expect(i18n).toEqual({
        defaultLocale: "en",
        locales: ["en", "fr"],
        messages: {
          en: {
            "hello-world": "Hello world!",
          },
          fr: {
            "hello-world": "Bonjour le monde !",
          },
        },
      });
    });
  });
});

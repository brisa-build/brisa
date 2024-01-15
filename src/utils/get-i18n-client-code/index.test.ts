import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import getI18nClientCode from ".";
import { normalizeQuotes } from "@/helpers";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

const I18N_CONFIG = {
  defaultLocale: "en",
  locales: ["en", "pt"],
  messages: {
    en: {
      hello: "Hello {{name}}",
    },
    pt: {
      hello: "Olá {{name}}",
    },
  },
  pages: {},
};

mock.module("@/constants", () => ({
  default: { I18N_CONFIG },
}));

describe("utils", () => {
  beforeEach(() => GlobalRegistrator.register());
  afterEach(() => GlobalRegistrator.unregister());

  describe("get-i18n-client-code", () => {
    it("should add window.i18n without the translate code if has useT=false", () => {
      const output = normalizeQuotes(getI18nClientCode(false));
      const expected = normalizeQuotes(`   
          const i18nConfig = {
            "defaultLocale":"en",
            "locales":["en","pt"]
          };

          window.i18n = {
            ...i18nConfig,
            get locale(){ return document.documentElement.lang },
          }
        `);

      expect(output).toBe(expected);
    });

    it("should work the window.i18n without translate code", async () => {
      const output = normalizeQuotes(getI18nClientCode(false));
      const script = document.createElement("script");
      script.innerHTML = output;
      document.documentElement.lang = "pt";
      document.body.appendChild(script);

      expect(window.i18n.locale).toBe("pt");
    });

    it("should add window.i18n with the translate code if has useT=true", () => {
      const output = normalizeQuotes(getI18nClientCode(true));
      const expected = normalizeQuotes(` 
        import {translateCore} from 'brisa';

        const i18nConfig = {
          "defaultLocale":"en",
          "locales":["en","pt"]
        };

        window.i18n = {
          ...i18nConfig,
          get locale(){ return document.documentElement.lang },
          get t() {
            return translateCore(this.locale, { ...i18nConfig, messages: this.messages })
          },
          get messages() { return {[this.locale]: window.i18nMessages } }
        }
      `);

      expect(output).toBe(expected);
    });

    it("should work the window.i18n with translate code", async () => {
      let output = normalizeQuotes(getI18nClientCode(true));

      output = output.replace(
        normalizeQuotes("import {translateCore} from 'brisa';"),
        'const translateCore = () => (k) => "Olá John";',
      );

      window.i18nMessages = I18N_CONFIG.messages;

      const script = document.createElement("script");
      script.innerHTML = output;
      document.documentElement.lang = "pt";
      document.body.appendChild(script);

      expect(window.i18n.locale).toBe("pt");
      expect(window.i18n.t("hello", { name: "John" })).toBe("Olá John");
    });
  });
});

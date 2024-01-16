import { describe, it, expect, beforeEach, afterEach } from "bun:test";

const getI18nClientMessages = import.meta.require(".").default;

describe("utils", () => {
  describe("getI18nClientMessages", () => {
    beforeEach(() => {
      globalThis.mockConstants = {
        I18N_CONFIG: {
          defaultLocale: "en-US",
          locales: ["en-US", "pt-BR"],
          messages: {
            "en-US": {
              hello: "Hello",
              world: "World",
              "hello-world": "Hello {{name}}",
              "hello-world-2": "Hello World 2",
              "hello-world-3": "Hello World 3",
              nested: {
                "very-nested": {
                  content: "Very nested content",
                },
              },
              array: [
                {
                  content: "Array content",
                },
              ],
            },
            "pt-BR": {
              hello: "Olá",
              world: "Mundo",
              "hello-world": "Olá Mundo",
              "hello-world-2": "Olá Mundo 2",
              "hello-world-3": "Olá Mundo 3",
              nested: {
                "very-nested": {
                  content: "Conteúdo muito aninhado",
                },
              },
              array: [
                {
                  content: "Conteúdo do array",
                },
              ],
            },
          },
        },
      };
    });

    afterEach(() => {
      globalThis.mockConstants = undefined;
    });

    it("should take only the consumed messages", () => {
      const i18nKeys = new Set<string>(["hello-world", "hello-world-3"]);
      const output = getI18nClientMessages("en-US", i18nKeys);
      const expected = {
        "hello-world": "Hello {{name}}",
        "hello-world-3": "Hello World 3",
      };

      expect(output).toEqual(expected);
    });

    it("should take only the consumed messages and nested messages", () => {
      const i18nKeys = new Set<string>([
        "hello-world",
        "nested.very-nested.content",
      ]);
      const output = getI18nClientMessages("en-US", i18nKeys);
      const expected = {
        "hello-world": "Hello {{name}}",
        nested: {
          "very-nested": {
            content: "Very nested content",
          },
        },
      };

      expect(output).toEqual(expected);
    });

    it("should take only the consumed messages and object translations", () => {
      const i18nKeys = new Set<string>(["hello-world", "nested.very-nested"]);
      const output = getI18nClientMessages("en-US", i18nKeys);
      const expected = {
        "hello-world": "Hello {{name}}",
        nested: {
          "very-nested": {
            content: "Very nested content",
          },
        },
      };

      expect(output).toEqual(expected);
    });

    it("should take only the consumed messages and array translations", () => {
      const i18nKeys = new Set<string>(["hello-world", "array"]);
      const output = getI18nClientMessages("en-US", i18nKeys);
      const expected = {
        "hello-world": "Hello {{name}}",
        array: [
          {
            content: "Array content",
          },
        ],
      };

      expect(output).toEqual(expected);
    });
  });
});

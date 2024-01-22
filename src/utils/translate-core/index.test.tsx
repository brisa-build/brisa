import { describe, expect, it, afterAll } from "bun:test";
import translateCore from ".";
import { type I18nConfig, type JSXElement } from "@/types";

type NestedKeysType = {
  key_1: {
    key_1_nested: string;
    key_2_nested: string;
  };
  key_2: string;
};

type RootKeysType = {
  root_key_1: string;
  root_key_2: string;
};

type InterpolateType = {
  key_1: {
    key_1_nested: string;
    key_2_nested: string;
  };
  key_2: string;
};

type WithEmptyType = {
  emptyKey: string;
};

const nsNestedKeys: NestedKeysType = {
  key_1: {
    key_1_nested: "message 1 nested",
    key_2_nested: "message 2 nested",
  },
  key_2: "message 2",
};

const nsRootKeys: RootKeysType = {
  root_key_1: "root message 1",
  root_key_2: "root message 2",
};

const nsInterpolate: InterpolateType = {
  key_1: {
    key_1_nested: "message 1 {{count}}",
    key_2_nested: "message 2 {{count}}",
  },
  key_2: "message 2",
};

const nsWithEmpty: WithEmptyType = {
  emptyKey: "",
};

function getI18nConfig<T>(dir: T extends Record<string, any> ? T : never) {
  return {
    locales: ["en", "ru"],
    defaultLocale: "en",
    messages: {
      en: dir,
    },
  };
}

describe("utils", () => {
  afterAll(() => {
    globalThis.mockConstants = undefined;
  });

  describe("translateCore", () => {
    it("should translate a key interpoleting correctly", async () => {
      const config = getI18nConfig({ hello_world: "Hello {{name}}" });
      const t = translateCore("en", config);

      expect(typeof t).toBe("function");
      expect(t<string>("hello_world", { name: "Test" })).toBe("Hello Test");
    });

    it("should translate a nested key interpoleting correctly", async () => {
      const config = getI18nConfig({
        hello_world: {
          hello_world_nested: "Hello {{name}}",
        },
      });

      const t = translateCore("en", config);

      expect(typeof t).toBe("function");
      expect(
        t<string>("hello_world.hello_world_nested", { name: "Test" }),
      ).toBe("Hello Test");
    });

    it("should return an object of root keys", async () => {
      const config = getI18nConfig(nsRootKeys);
      const t = translateCore("en", config);

      expect(typeof t).toBe("function");
      expect(t<RootKeysType>(".", null, { returnObjects: true })).toEqual(
        nsRootKeys,
      );
    });

    it("should return an object of nested keys", async () => {
      const config = {
        locales: ["en", "ru"],
        defaultLocale: "en",
        messages: {
          en: nsNestedKeys,
        },
      };
      const t = translateCore("en", config);

      expect(typeof t).toBe("function");
      expect(
        t<NestedKeysType["key_1"]>("key_1", null, { returnObjects: true }),
      ).toEqual(nsNestedKeys.key_1);
      expect(
        t<NestedKeysType["key_2"]>("key_2", null, { returnObjects: true }),
      ).toEqual(nsNestedKeys.key_2);
    });

    it("should return an object of nested keys and interpolate correctly", async () => {
      const config = getI18nConfig(nsInterpolate);

      const t = translateCore("en", config);
      const count = 999;
      const expected: NestedKeysType = {
        key_1: {
          key_1_nested: `message 1 ${count}`,
          key_2_nested: `message 2 ${count}`,
        },
        key_2: "message 2",
      };

      expect(typeof t).toBe("function");
      expect(
        t<NestedKeysType>(".", { count }, { returnObjects: true }),
      ).toEqual(expected);
    });

    it("should return empty string when allowEmptyStrings is passed as true", () => {
      const config = {
        locales: ["en", "ru"],
        defaultLocale: "en",
        messages: {
          en: nsWithEmpty,
        },
        allowEmptyStrings: true,
      };
      const t = translateCore("en", config);

      expect(typeof t).toBe("function");
      expect(t<string>("emptyKey")).toBe("");
    });

    it("should return empty string when allowEmptyStrings is omitted", () => {
      const config = {
        locales: ["en", "ru"],
        defaultLocale: "en",
        messages: {
          en: nsWithEmpty,
        },
      };
      const t = translateCore("en", config);

      expect(typeof t).toBe("function");
      expect(t<string>("emptyKey")).toBe("");
    });

    it("should return the key name when allowEmptyStrings is omit passed as false.", () => {
      const config = {
        locales: ["en", "ru"],
        defaultLocale: "en",
        messages: {
          en: nsWithEmpty,
        },
        allowEmptyStrings: false,
      };
      const t = translateCore("en", config);

      expect(typeof t).toBe("function");
      expect(t("emptyKey")).toBe("emptyKey");
    });

    it("should work with different interpolation preffix and suffix", () => {
      const config = {
        locales: ["en", "ru"],
        defaultLocale: "en",
        messages: {
          en: {
            key_1: "hello [[name]]",
          },
        },
        interpolation: {
          prefix: "[[",
          suffix: "]]",
        },
      };
      const t = translateCore("en", config);
      expect(t<string>("key_1", { name: "test" })).toBe("hello test");
    });

    it("should work with format", () => {
      const config = {
        locales: ["en", "ru"],
        defaultLocale: "en",
        messages: {
          en: {
            key_1: "hello {{name, uppercase}}",
          },
        },
        interpolation: {
          format: (value, format) => {
            if (typeof value !== "string") return "";
            if (format === "uppercase") {
              return value.toUpperCase();
            }
            return value;
          },
        },
      } as I18nConfig;
      const t = translateCore("en", config);
      expect(t<string>("key_1", { name: "test" })).toBe("hello TEST");
    });

    it("should work with html inside the translation", () => {
      const config = {
        locales: ["en", "ru"],
        defaultLocale: "en",
        messages: {
          en: {
            key_1: "hello <0>{{name}}</0>",
          },
        },
      };
      const t = translateCore("en", config);
      const output = t("key_1", { name: "test" }, { elements: [<strong />] });
      const element = output[1] as JSXElement;

      expect(output[0]).toBe("hello ");
      expect(element.type).toBe("strong");
      expect(element.props.children).toBe("test");
    });

    it("should _messages override _defaultMessages", () => {
      const config = {
        locales: ["en", "ru"],
        defaultLocale: "en",
        messages: {
          en: {
            key_1: "hello {{name}}",
            key_2: "hello 2 {{name}}",
          },
          ru: {
            key_1: "привет {{name}}",
            key_2: "привет 2 {{name}}",
          },
        },
        _messages: {
          key_1: "new hello {{name}}",
        },
      };
      const t = translateCore("en", config);
      expect(t<string>("key_1", { name: "test" })).toBe("new hello test");
      expect(t<string>("key_2", { name: "test" })).toBe("hello 2 test");
    });
  });
});

import { describe, it, expect, spyOn } from "bun:test";
import AST from "@/utils/ast";
import constants from "@/constants";
import analyzeClientAst from ".";

const { parseCodeToAST } = AST("tsx");
const { LOG_PREFIX } = constants;

describe("utils", () => {
  describe("analyze-client-ast", () => {
    it("should not detect suspense", async () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <div>hello</div>
        }
      `);

      const res = await analyzeClientAst(ast, {});

      expect(res.useI18n).toBeFalse();
      expect(res.useContextProvider).toBeFalse();
      expect(res.webComponents).toEqual({});
      expect(res.useSuspense).toBeFalse();
      expect(res.i18nKeys).toBeEmpty();
    });
    it("should detect suspense", async () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <div>hello</div>
        }

        Component.suspense = () => <div>loading...</div>
      `);

      const res = await analyzeClientAst(ast, {});

      expect(res.useI18n).toBeFalse();
      expect(res.useContextProvider).toBeFalse();
      expect(res.webComponents).toEqual({});
      expect(res.useSuspense).toBeTrue();
      expect(res.i18nKeys).toBeEmpty();
    });

    it("should detect web components", async () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <my-component>hello</my-component>
        }

        Component.suspense = () => <div>loading...</div>
      `);

      const res = await analyzeClientAst(ast, {
        "my-component": "my-component.js",
        "another-component": "another-component.js",
      });

      expect(res.useI18n).toBeFalse();
      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeTrue();
      expect(res.webComponents).toEqual({
        "my-component": "my-component.js",
      });
      expect(res.i18nKeys).toBeEmpty();
    });

    it("should detect web components inside suspense", async () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <div>hello</div>
        }

        Component.suspense = () => <another-component>loading...</another-component>
      `);

      const res = await analyzeClientAst(ast, {
        "my-component": "my-component.js",
        "another-component": "another-component.js",
      });

      expect(res.useI18n).toBeFalse();
      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeTrue();
      expect(res.webComponents).toEqual({
        "another-component": "another-component.js",
      });
      expect(res.i18nKeys).toBeEmpty();
    });

    it("should not detect context-provider when serverOnly", async () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <context-provider serverOnly={true}>hello</context-provider>
        }
      `);

      const res = await analyzeClientAst(ast, {});

      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.useI18n).toBeFalse();
      expect(res.webComponents).toEqual({});
      expect(res.i18nKeys).toBeEmpty();
    });

    it("should detect context-provider", async () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <context-provider>hello</context-provider>
        }
      `);

      const res = await analyzeClientAst(ast, {});

      expect(res.useContextProvider).toBeTrue();
      expect(res.useSuspense).toBeFalse();
      expect(res.useI18n).toBeFalse();
      expect(res.webComponents).toEqual({});
      expect(res.i18nKeys).toBeEmpty();
    });

    it("should detect i18n when is declated and used to consume the locale", async () => {
      const ast = parseCodeToAST(`  
        export default function Component({i18n}) {
          const { locale } = i18n;
          return <div>{locale}</div>
        }
      `);

      const res = await analyzeClientAst(ast, {});

      expect(res.webComponents).toEqual({});
      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toBeEmpty();
    });

    it("should detect i18n when is used to consume the locale from webContext identifier", async () => {
      const ast = parseCodeToAST(`  
        export default function Component(webContext) {
          const { locale } = webContext.i18n;
          return <div>{locale}</div>
        }
      `);

      const res = await analyzeClientAst(ast, {});

      expect(res.webComponents).toEqual({});
      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toBeEmpty();
    });

    it("should detect i18n when is used to consume the locale from webContext identifier + destructuring", async () => {
      const ast = parseCodeToAST(`  
        export default function Component(webContext) {
          const { i18n } = webContext;
          return <div>{i18n.locale}</div>
        }
      `);

      const res = await analyzeClientAst(ast, {});

      expect(res.webComponents).toEqual({});
      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toBeEmpty();
    });

    it("should detect i18n when is used to consume t function", async () => {
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n}) {
          return <div>{i18n.t("hello")}</div>
        }
      `);

      const res = await analyzeClientAst(ast, {});

      expect(res.webComponents).toEqual({});
      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(["hello"]));
    });

    it("should detect i18n when is used to consume t function from arrow function", async () => {
      const ast = parseCodeToAST(`
        const Component = ({}, {i18n}) => {
          return <div>{i18n.t("hello")}</div>
        }

        export default Component;
      `);

      const res = await analyzeClientAst(ast, {});

      expect(res.webComponents).toEqual({});
      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(["hello"]));
    });

    it("should return all the i18n keys used in the component", async () => {
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n}) {
          return <div>{i18n.t("hello")}</div>
        }
      `);

      const res = await analyzeClientAst(ast, {});

      expect(res.webComponents).toEqual({});
      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(["hello"]));
    });

    it("should return all the i18n keys used in the component using destructuring", async () => {
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n: { t }}) {
          return <div>{t("hello")}</div>
        }
      `);

      const res = await analyzeClientAst(ast, {});

      expect(res.webComponents).toEqual({});
      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(["hello"]));
    });

    it("should return all the i18n keys used in the component using webContext identifier", async () => {
      const ast = parseCodeToAST(`
        export default function Component({}, webContext) {
          return <div>{webContext.i18n.t("hello")}</div>
        }
      `);

      const res = await analyzeClientAst(ast, {});

      expect(res.webComponents).toEqual({});
      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(["hello"]));
    });

    it("should not return as i18n keys when is not using i18n", async () => {
      const ast = parseCodeToAST(`
        import t from "i18n";

        export default function Component() {
          return <div>{t("hello")}</div>
        }
      `);

      const res = await analyzeClientAst(ast, {});

      expect(res.webComponents).toEqual({});
      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.useI18n).toBeFalse();
      expect(res.i18nKeys).toBeEmpty();
    });

    it("should log a warning and no return i18n keys when there is no literal as first argument", async () => {
      const mockLog = spyOn(console, "log");
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n}) {
          return <div>{i18n.t(variable)}</div>
        }
      `);

      const res = await analyzeClientAst(ast, {});

      const logs = mockLog.mock.calls.toString();
      mockLog.mockRestore();

      expect(res.webComponents).toEqual({});
      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toBeEmpty();
      expect(logs).toContain("Ops! Warning:");
      expect(logs).toContain("Addressing Dynamic i18n Key Export Limitations");
      expect(logs).toContain("Code: i18n.t(variable)");
    });
  });
});

import { describe, it, expect, spyOn } from "bun:test";
import AST from "@/utils/ast";
import analyzeClientAst from ".";

const { parseCodeToAST } = AST("tsx");

describe("utils", () => {
  describe("analyze-client-ast", () => {
    it("should detect i18n when is declated and used to consume the locale", () => {
      const ast = parseCodeToAST(`  
        export default function Component({i18n}) {
          const { locale } = i18n;
          return <div>{locale}</div>
        }
      `);

      const res = analyzeClientAst(ast);

      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toBeEmpty();
    });

    it("should detect i18n when is used to consume the locale from webContext identifier", () => {
      const ast = parseCodeToAST(`  
        export default function Component(webContext) {
          const { locale } = webContext.i18n;
          return <div>{locale}</div>
        }
      `);

      const res = analyzeClientAst(ast);

      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toBeEmpty();
    });

    it("should detect i18n when is used to consume the locale from webContext identifier + destructuring", () => {
      const ast = parseCodeToAST(`  
        export default function Component(webContext) {
          const { i18n } = webContext;
          return <div>{i18n.locale}</div>
        }
      `);

      const res = analyzeClientAst(ast);

      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toBeEmpty();
    });

    it("should detect i18n when is used to consume t function", () => {
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n}) {
          return <div>{i18n.t("hello")}</div>
        }
      `);

      const res = analyzeClientAst(ast);

      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(["hello"]));
    });

    it("should detect i18n when is used to consume t function from arrow function", () => {
      const ast = parseCodeToAST(`
        const Component = ({}, {i18n}) => {
          return <div>{i18n.t("hello")}</div>
        }

        export default Component;
      `);

      const res = analyzeClientAst(ast);

      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(["hello"]));
    });

    it("should return all the i18n keys used in the component", () => {
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n}) {
          return <div>{i18n.t("hello")}</div>
        }
      `);

      const res = analyzeClientAst(ast);

      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(["hello"]));
    });

    it("should return all the i18n keys used in the component using destructuring", () => {
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n: { t }}) {
          return <div>{t("hello")}</div>
        }
      `);

      const res = analyzeClientAst(ast);

      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(["hello"]));
    });

    it("should return all the i18n keys used in the component using webContext identifier", () => {
      const ast = parseCodeToAST(`
        export default function Component({}, webContext) {
          return <div>{webContext.i18n.t("hello")}</div>
        }
      `);

      const res = analyzeClientAst(ast);

      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(["hello"]));
    });

    it("should not return as i18n keys when is not using i18n", () => {
      const ast = parseCodeToAST(`
        import t from "i18n";

        export default function Component() {
          return <div>{t("hello")}</div>
        }
      `);

      const res = analyzeClientAst(ast);

      expect(res.useI18n).toBeFalse();
      expect(res.i18nKeys).toBeEmpty();
    });

    it("should log a warning and no return i18n keys when there is no literal as first argument", () => {
      const mockLog = spyOn(console, "log");
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n}) {
          return <div>{i18n.t(variable)}</div>
        }
      `);

      const res = analyzeClientAst(ast);

      const logs = mockLog.mock.calls.toString();
      mockLog.mockRestore();

      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toBeEmpty();
      expect(logs).toContain("Ops! Warning:");
      expect(logs).toContain("Addressing Dynamic i18n Key Export Limitations");
      expect(logs).toContain("Code: i18n.t(variable)");
    });

    it("should add the keys specified inside MyWebComponent.i18nKeys array", () => {
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n}) {
          return <div>{i18n.t("hello")}</div>
        }

        Component.i18nKeys = ["hello-world"];
      `);

      const res = analyzeClientAst(ast);

      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(["hello", "hello-world"]));
    });
  });
});

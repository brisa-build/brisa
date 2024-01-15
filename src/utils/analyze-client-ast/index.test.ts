import { describe, it, expect } from "bun:test";
import AST from "@/utils/ast";
import analyzeClientAst from ".";

const { parseCodeToAST } = AST("tsx");

describe("utils", () => {
  describe("analyze-client-ast", () => {
    it("should not detect suspense", async () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <div>hello</div>
        }
      `);

      const { useSuspense, useContextProvider, useI18n, webComponents } =
        await analyzeClientAst(ast, {});

      expect(useI18n).toBeFalse();
      expect(useContextProvider).toBeFalse();
      expect(webComponents).toEqual({});
      expect(useSuspense).toBeFalse();
    });
    it("should detect suspense", async () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <div>hello</div>
        }

        Component.suspense = () => <div>loading...</div>
      `);

      const { useSuspense, useContextProvider, useI18n, webComponents } =
        await analyzeClientAst(ast, {});

      expect(useI18n).toBeFalse();
      expect(useContextProvider).toBeFalse();
      expect(webComponents).toEqual({});
      expect(useSuspense).toBeTrue();
    });

    it("should detect web components", async () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <my-component>hello</my-component>
        }

        Component.suspense = () => <div>loading...</div>
      `);

      const { webComponents, useI18n, useContextProvider, useSuspense } =
        await analyzeClientAst(ast, {
          "my-component": "my-component.js",
          "another-component": "another-component.js",
        });

      expect(useI18n).toBeFalse();
      expect(useContextProvider).toBeFalse();
      expect(useSuspense).toBeTrue();
      expect(webComponents).toEqual({
        "my-component": "my-component.js",
      });
    });

    it("should detect web components inside suspense", async () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <div>hello</div>
        }

        Component.suspense = () => <another-component>loading...</another-component>
      `);

      const { webComponents, useContextProvider, useI18n, useSuspense } =
        await analyzeClientAst(ast, {
          "my-component": "my-component.js",
          "another-component": "another-component.js",
        });

      expect(useI18n).toBeFalse();
      expect(useContextProvider).toBeFalse();
      expect(useSuspense).toBeTrue();
      expect(webComponents).toEqual({
        "another-component": "another-component.js",
      });
    });

    it("should not detect context-provider when serverOnly", async () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <context-provider serverOnly={true}>hello</context-provider>
        }
      `);

      const { useContextProvider, useSuspense, useI18n } =
        await analyzeClientAst(ast, {});

      expect(useContextProvider).toBeFalse();
      expect(useSuspense).toBeFalse();
      expect(useI18n).toBeFalse();
    });

    it("should detect context-provider", async () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <context-provider>hello</context-provider>
        }
      `);

      const { useContextProvider, useSuspense, useI18n } =
        await analyzeClientAst(ast, {});

      expect(useContextProvider).toBeTrue();
      expect(useSuspense).toBeFalse();
      expect(useI18n).toBeFalse();
    });

    it("should detect i18n when is declated and used to consume the locale", async () => {
      const ast = parseCodeToAST(`  
        export default function Component({i18n}) {
          const { locale } = i18n;
          return <div>{locale}</div>
        }
      `);

      const { webComponents, useI18n, useContextProvider, useSuspense } =
        await analyzeClientAst(ast, {});

      expect(webComponents).toEqual({});
      expect(useContextProvider).toBeFalse();
      expect(useSuspense).toBeFalse();
      expect(useI18n).toBeTrue();
    });

    it("should detect i18n when is used to consume the locale from props identifier", async () => {
      const ast = parseCodeToAST(`  
        export default function Component(props) {
          const { locale } = props.i18n;
          return <div>{locale}</div>
        }
      `);

      const { useI18n, useContextProvider, useSuspense, webComponents } =
        await analyzeClientAst(ast, {});

      expect(webComponents).toEqual({});
      expect(useContextProvider).toBeFalse();
      expect(useSuspense).toBeFalse();
      expect(useI18n).toBeTrue();
    });

    it("should detect i18n when is used to consume the locale from props identifier + destructuring", async () => {
      const ast = parseCodeToAST(`  
        export default function Component(props) {
          const { i18n } = props;
          return <div>{i18n.locale}</div>
        }
      `);

      const { useI18n, useContextProvider, useSuspense, webComponents } =
        await analyzeClientAst(ast, {});

      expect(webComponents).toEqual({});
      expect(useContextProvider).toBeFalse();
      expect(useSuspense).toBeFalse();
      expect(useI18n).toBeTrue();
    });

    it("should detect i18n when is used to consume t function", async () => {
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n}) {
          return <div>{i18n.t("hello")}</div>
        }
      `);

      const { useI18n, useContextProvider, useSuspense, webComponents } =
        await analyzeClientAst(ast, {});

      expect(webComponents).toEqual({});
      expect(useContextProvider).toBeFalse();
      expect(useSuspense).toBeFalse();
      expect(useI18n).toBeTrue();
    });

    it("should detect i18n when is used to consume t function from arrow function", async () => {
      const ast = parseCodeToAST(`
        const Component = ({}, {i18n}) => {
          return <div>{i18n.t("hello")}</div>
        }

        export default Component;
      `);

      const { useI18n, useContextProvider, useSuspense, webComponents } =
        await analyzeClientAst(ast, {});

      expect(webComponents).toEqual({});
      expect(useContextProvider).toBeFalse();
      expect(useSuspense).toBeFalse();
      expect(useI18n).toBeTrue();
    });
  });
});

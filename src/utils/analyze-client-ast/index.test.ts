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

      const { useSuspense } = await analyzeClientAst(ast, {});

      expect(useSuspense).toBeFalse();
    });
    it("should detect suspense", async () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <div>hello</div>
        }

        Component.suspense = () => <div>loading...</div>
      `);

      const { useSuspense } = await analyzeClientAst(ast, {});

      expect(useSuspense).toBeTrue();
    });

    it("should detect web components", async () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <my-component>hello</my-component>
        }

        Component.suspense = () => <div>loading...</div>
      `);

      const { webComponents } = await analyzeClientAst(ast, {
        "my-component": "my-component.js",
        "another-component": "another-component.js",
      });

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

      const { webComponents } = await analyzeClientAst(ast, {
        "my-component": "my-component.js",
        "another-component": "another-component.js",
      });

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

      const { useContextProvider, useSuspense } = await analyzeClientAst(
        ast,
        {},
      );

      expect(useContextProvider).toBeFalse();
      expect(useSuspense).toBeFalse();
    });

    it("should detect context-provider", async () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <context-provider>hello</context-provider>
        }
      `);

      const { useContextProvider, useSuspense } = await analyzeClientAst(
        ast,
        {},
      );

      expect(useContextProvider).toBeTrue();
      expect(useSuspense).toBeFalse();
    });
  });
});

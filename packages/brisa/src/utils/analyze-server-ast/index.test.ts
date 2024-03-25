import { describe, it, expect, spyOn } from "bun:test";
import AST from "../ast";
import analyzeServerAst from ".";

const { parseCodeToAST } = AST("tsx");

describe("utils", () => {
  describe("analyze-server-ast", () => {
    it("should not detect suspense", () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <div>hello</div>
        }
      `);

      const res = analyzeServerAst(ast, {});

      expect(res.useContextProvider).toBeFalse();
      expect(res.webComponents).toEqual({});
      expect(res.useActions).toBeFalse();
      expect(res.useSuspense).toBeFalse();
    });
    it("should detect suspense", () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <div>hello</div>
        }

        Component.suspense = () => <div>loading...</div>
      `);

      const res = analyzeServerAst(ast, {});

      expect(res.useContextProvider).toBeFalse();
      expect(res.webComponents).toEqual({});
      expect(res.useActions).toBeFalse();
      expect(res.useSuspense).toBeTrue();
    });

    it("should detect web components", () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <my-component>hello</my-component>
        }

        Component.suspense = () => <div>loading...</div>
      `);

      const res = analyzeServerAst(ast, {
        "my-component": "my-component.js",
        "another-component": "another-component.js",
      });

      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeTrue();
      expect(res.useActions).toBeFalse();
      expect(res.webComponents).toEqual({
        "my-component": "my-component.js",
      });
    });

    it("should detect web components inside suspense", () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <div>hello</div>
        }

        Component.suspense = () => <another-component>loading...</another-component>
      `);

      const res = analyzeServerAst(ast, {
        "my-component": "my-component.js",
        "another-component": "another-component.js",
      });

      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeTrue();
      expect(res.useActions).toBeFalse();
      expect(res.webComponents).toEqual({
        "another-component": "another-component.js",
      });
    });

    it("should not detect context-provider when serverOnly", () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <context-provider serverOnly={true}>hello</context-provider>
        }
      `);

      const res = analyzeServerAst(ast, {});

      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.webComponents).toEqual({});
      expect(res.useActions).toBeFalse();
    });

    it("should detect context-provider", () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <context-provider>hello</context-provider>
        }
      `);

      const res = analyzeServerAst(ast, {});

      expect(res.useActions).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.webComponents).toEqual({});
      expect(res.useContextProvider).toBeTrue();
    });

    it("should detect actions when is used the attribute data-action", () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <div data-action="action">hello</div>
        }
      `);

      const res = analyzeServerAst(ast, {});

      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.webComponents).toEqual({});
      expect(res.useActions).toBeTrue();
    });
  });
});

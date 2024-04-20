import { describe, it, expect } from "bun:test";
import AST from "@/utils/ast";
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
      expect(res.useHyperlink).toBeFalse();
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
      expect(res.useHyperlink).toBeFalse();
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
      expect(res.useHyperlink).toBeFalse();
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
      expect(res.useHyperlink).toBeFalse();
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
      expect(res.useHyperlink).toBeFalse();
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
      expect(res.useHyperlink).toBeFalse();
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
      expect(res.useHyperlink).toBeFalse();
    });

    it("should detect hyperlink with relative path", () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <a href="/hello">hello</a>
        }
      `);

      const res = analyzeServerAst(ast, {});

      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.webComponents).toEqual({});
      expect(res.useActions).toBeFalse();
      expect(res.useHyperlink).toBeTrue();
    });

    it("should not detect hyperlink with absolute path", () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <a href="https://someweb.com/hello">hello</a>
        }
      `);

      const res = analyzeServerAst(ast, {});

      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.webComponents).toEqual({});
      expect(res.useActions).toBeFalse();
      expect(res.useHyperlink).toBeFalse();
    });

    it("should not detect hyperlink with target=_blank", () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return <a href="/hello" target="_blank">hello</a>
        }
      `);

      const res = analyzeServerAst(ast, {});

      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.webComponents).toEqual({});
      expect(res.useActions).toBeFalse();
      expect(res.useHyperlink).toBeFalse();
    });

    it("should not detect hyperlink if there are a lot of links without relative path on same tab", () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return (
            <>
              <a href="https://someweb.com/foo">foo</a>
              <a href="https://someweb.com/bar">bar</a>
              <a href="https://someweb.com/baz">baz</a>
              <a href="/hello" target="_blank">hello</a>
            </>
          )
        }
      `);

      const res = analyzeServerAst(ast, {});

      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.webComponents).toEqual({});
      expect(res.useActions).toBeFalse();
      expect(res.useHyperlink).toBeFalse();
    })

    it("should detect hyperlink if there are a lot of links and one of them is relative path", () => {
      const ast = parseCodeToAST(`
        export default function Component() {
          return (
            <>
              <a href="https://someweb.com/foo">foo</a>
              <a href="https://someweb.com/bar">bar</a>
              <a href="https://someweb.com/baz">baz</a>
              <a href="/hello" target="_blank">hello</a>
              <a href="/hello">hello</a>
            </>
          )
        }
      `);

      const res = analyzeServerAst(ast, {});

      expect(res.useContextProvider).toBeFalse();
      expect(res.useSuspense).toBeFalse();
      expect(res.webComponents).toEqual({});
      expect(res.useActions).toBeFalse();
      expect(res.useHyperlink).toBeTrue();
    })
  });
});

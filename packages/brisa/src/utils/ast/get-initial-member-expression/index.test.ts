import AST from "@/utils/ast";
import { getInitialMemberExpression } from "@/utils/ast/get-initial-member-expression";
import { describe, expect, it } from "bun:test";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");

describe("AST", () => {
  describe("getInitialMemberExpression", () => {
    it("should return the first member expression", () => {
      const code = `b.c.d.e.f.g;`;
      const ast = parseCodeToAST(code) as any;
      const memberExpression = getInitialMemberExpression(
        ast.body[0].expression,
      );
      const codeFromAst = generateCodeFromAST(memberExpression);
      expect(codeFromAst).toBe("b.c");
    });

    it("should work with optional chaining (?.) in the middle", () => {
      const code = `b?.c?.d?.e?.f?.g;`;
      const ast = parseCodeToAST(code) as any;
      const memberExpression = getInitialMemberExpression(
        ast.body[0].expression,
      );
      const codeFromAst = generateCodeFromAST(memberExpression);
      expect(codeFromAst).toBe("b?.c");
    });

    it("should work with default values in the middle", () => {
      const code = `(b.c ?? {}).d.e.f ?? "foo";`;
      const ast = parseCodeToAST(code) as any;
      const memberExpression = getInitialMemberExpression(
        ast.body[0].expression,
      );
      const codeFromAst = generateCodeFromAST(memberExpression);
      expect(codeFromAst).toBe("b.c");
    });
  });
});

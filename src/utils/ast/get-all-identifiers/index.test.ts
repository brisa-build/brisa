import { describe, it, expect } from "bun:test";
import gerAllIdentifiers from ".";
import AST from "..";

const { parseCodeToAST } = AST("tsx");

describe("utils", () => {
  describe("ast", () => {
    describe("contains-identifiers", () => {
      it("should return all identifiers in the given AST", () => {
        const ast = parseCodeToAST(`
          const a = 1;
          const b = 2;
          const c = a + b;
        `);
        const output = gerAllIdentifiers(ast);
        expect(output).toEqual(new Set(["a", "b", "c"]));
      });

      it("should return all identifiers in the given AST with nested structures", () => {
        const ast = parseCodeToAST(`
          const a = 1;
          const b = 2;
          const c = a + b;
          const d = () => {
            const e = 3;
            const f = 4;
            const g = e + f;
          };
        `);
        const output = gerAllIdentifiers(ast);
        expect(output).toEqual(new Set(["a", "b", "c", "d", "e", "f", "g"]));
      });
    });
  });
});

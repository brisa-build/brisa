import { describe, it, expect } from "bun:test";
import containsIdentifiers from ".";

describe("utils", () => {
  describe("ast", () => {
    describe("contains-identifiers", () => {
      it("should return true if the AST contains the given identifiers", () => {
        const output = containsIdentifiers(
          { type: "Identifier", name: "a" },
          new Set(["a"]),
        );
        expect(output).toBeTrue();
      });

      it("should return false if the AST does not contain the given identifiers", () => {
        const output = containsIdentifiers(
          { type: "Identifier", name: "a" },
          new Set(["b"]),
        );
        expect(output).toBeFalse();
      });

      it("should return true if the AST contains the given identifiers in a nested structure", () => {
        const output = containsIdentifiers(
          {
            type: "CallExpression",
            callee: { type: "Identifier", name: "a" },
          } as any,
          new Set(["a"]),
        );
        expect(output).toBeTrue();
      });

      it("should return false if the AST does not contain the given identifiers in a nested structure", () => {
        const output = containsIdentifiers(
          {
            type: "CallExpression",
            callee: { type: "Identifier", name: "a" },
          } as any,
          new Set(["b"]),
        );
        expect(output).toBeFalse();
      });
    });
  });
});

import getSortedKeysMemberExpression from "@/utils/ast/get-sorted-keys-member-expression";
import { describe, it, expect } from "bun:test";

describe("AST -> getSortedKeysMemberExpression", () => {
  it("should return the keys of a member expression", () => {
    const memberExpression = {
      type: "MemberExpression",
      object: {
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "foo",
        },
        property: {
          type: "Identifier",
          name: "bar",
        },
      },
      property: {
        type: "Identifier",
        name: "baz",
      },
    };

    expect(getSortedKeysMemberExpression(memberExpression)).toEqual([
      { type: "Identifier", name: "foo" },
      { type: "Identifier", name: "bar" },
      { type: "Identifier", name: "baz" },
    ]);
  });
});

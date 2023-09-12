import { describe, expect, it } from "bun:test";
import injectUnsuspenseScript from ".";

describe("injectUnsuspenseScript", () => {
  it("should return a script tag with the code", () => {
    expect(injectUnsuspenseScript()).toMatch(/<script>[\s\S]+<\/script>/gm);
  });
});
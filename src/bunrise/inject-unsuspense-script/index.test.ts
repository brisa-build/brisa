import { describe, expect, it } from "bun:test";
import { injectUnsuspenseScript } from ".";

describe("injectUnsuspenseScript", () => {
  it("should return a script tag with the code", async () => {
    expect(await injectUnsuspenseScript()).toMatch(
      /<script>[\s\S]+<\/script>/gm,
    );
  });
});

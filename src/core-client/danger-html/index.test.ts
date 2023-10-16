import { describe, it, expect } from "bun:test";
import dangerHTML from ".";

describe("core-client", () => {
  describe("danger-html", () => {
    it('should be transformed to "danger-html" element', () => {
      const html = "<div>test</div>";
      const element = dangerHTML(html);

      expect(element).toEqual({
        toString: expect.any(Function),
      });
    });
  });
});

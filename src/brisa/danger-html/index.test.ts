import { describe, it, expect } from "bun:test";
import dangerHTML from ".";

describe("danger-html", () => {
  it('should be transformed to "danger-html" element', () => {
    const html = "<div>test</div>";
    const element = dangerHTML(html);

    expect(element).toEqual({
      type: "danger-html",
      props: {
        html,
      },
    });
  });
});